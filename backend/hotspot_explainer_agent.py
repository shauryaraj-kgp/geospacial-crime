import pandas as pd
import datetime
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report
import shap
import google.generativeai as genai
from dotenv import load_dotenv
import os
import pickle
from hotspot_utils import get_default_inputs

# Load your .env with API key
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# --- Load XGBoost model and feature columns in native format ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), "hotspot_xgb.pkl")
FEATURE_COLS_PATH = os.path.join(os.path.dirname(__file__), "feature_cols.pkl")

with open(MODEL_PATH, "rb") as f:
    loaded_model = pickle.load(f)

with open(FEATURE_COLS_PATH, "rb") as f:
    loaded_feature_cols = pickle.load(f)

def train_and_explain_hotspot(df_imputed: pd.DataFrame, crime_columns: list, current_week: str):
    # --- PREPARE DATA ---
    current_week = pd.to_datetime(current_week)
    df = df_imputed.copy()
    df["week_start"] = pd.to_datetime(df["week_start"])
    df = df.sort_values(by="week_start")

    predict_df = df[df["week_start"] == current_week]
    X_pred = predict_df[loaded_feature_cols]
    y_true = predict_df["hotspot"]

    # --- USE LOADED MODEL FOR PREDICTION ---
    y_pred = loaded_model.predict(X_pred)

    result = predict_df[['week_start','week_end','source_location','COUNCIL NAME','WARD CODE']].copy()
    result['true'] = y_true.values
    result['pred'] = y_pred
    result.to_csv("hotspot_predictions.csv", index=False) #output predictions path

    # ---- SHAP Analysis for predicted hotspots only ----
    hotspot_indices = [i for i, val in enumerate(y_pred) if val == 1]
    if not hotspot_indices:
        return {"summary": "No hotspots predicted for this week.", "hotspots": []}

    X_hotspots = X_pred.iloc[hotspot_indices]
    predict_hotspots = predict_df.iloc[hotspot_indices]

    explainer = shap.Explainer(loaded_model, X_pred)  # Background = all, faster than TreeExplainer on CPU
    shap_values = explainer(X_hotspots)

    summary, hotspots = summarize_with_gemini(X_hotspots, shap_values, predict_hotspots)
    return {"summary": summary, "hotspots": hotspots}

def summarize_with_gemini(X_pred, shap_values, predict_df):
    summaries = []
    hotspots = []

    for i, shap_row in enumerate(shap_values):
        feature_contributions = sorted(
            zip(X_pred.columns, shap_row.values),
            key=lambda x: abs(x[1]),
            reverse=True
        )[:5]

        feature_summary = "\n".join([f"- {feat}: {val:.3f}" for feat, val in feature_contributions])
        psos = predict_df.iloc[i]['source_location']
        council = predict_df.iloc[i]['COUNCIL NAME']
        ward = predict_df.iloc[i]['WARD CODE']
        summaries.append(f"**{psos} ({council})**\n"
                         f"Top features:\n{feature_summary}\n")
        hotspots.append({"source_location": psos, "council": council, "ward": ward})

    if not summaries:
        return "No hotspots detected this week.", []

    batched_prompt = (
        "The following wards were predicted to be crime hotspots this week. Each entry lists the most influential features (via SHAP values) that contributed to the prediction. Provide a short summary (in normal format not in a README format)explaining why each location may be a hotspot based on these features:\n\n" +
        "\n\n".join(summaries)
    )

    model = genai.GenerativeModel("gemini-2.0-flash")  
    response = model.generate_content(batched_prompt)
    return response.text, hotspots

