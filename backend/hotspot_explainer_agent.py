import pandas as pd
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report
import shap
import google.generativeai as genai
from dotenv import load_dotenv
import os
import joblib
from hotspot_utils import get_default_inputs

# Load your .env with API key
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Paths
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models", "hotspot_xgb.joblib")
FEATURE_COLS_PATH = os.path.join(BASE_DIR, "models", "feature_cols.joblib")

# Model and feature cache
_model_cache = None
_feature_cols_cache = None

def load_model_once():
    global _model_cache, _feature_cols_cache
    if _model_cache is None or _feature_cols_cache is None:
        _model_cache = joblib.load(MODEL_PATH)
        _feature_cols_cache = joblib.load(FEATURE_COLS_PATH)
    return _model_cache, _feature_cols_cache

def train_and_explain_hotspot(df_imputed: pd.DataFrame, crime_columns: list, current_week: str):
    model, feature_cols = load_model_once()

    current_week = pd.to_datetime(current_week)
    df = df_imputed.copy()
    df["week_start"] = pd.to_datetime(df["week_start"])
    df = df.sort_values(by="week_start")

    predict_df = df[df["week_start"] == current_week]
    if predict_df.empty:
        return {"summary": "No data available for this week.", "hotspots": []}

    X_pred = predict_df[feature_cols]
    y_true = predict_df["hotspot"]

    y_pred = model.predict(X_pred)

    result = predict_df[['week_start', 'week_end', 'source_location', 'COUNCIL NAME', 'WARD CODE']].copy()
    result['true'] = y_true.values
    result['pred'] = y_pred

    # Filter predicted hotspots
    hotspot_indices = [i for i, val in enumerate(y_pred) if val == 1]
    if not hotspot_indices:
        return {"summary": "No hotspots predicted for this week.", "hotspots": []}

    X_hotspots = X_pred.iloc[hotspot_indices]
    predict_hotspots = predict_df.iloc[hotspot_indices]

    # SHAP explanation (use full background set for now)
    explainer = shap.Explainer(model, X_pred)
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
        summaries.append(f"**{psos} ({council})**\nTop features:\n{feature_summary}")
        hotspots.append({"source_location": psos, "council": council, "ward": ward})

    if not summaries:
        return "No hotspots detected this week.", []

    batched_prompt = (
        "The following wards were predicted to be crime hotspots this week. "
        "Each entry lists the most influential features (via SHAP values) that contributed to the prediction. "
        "Provide a short summary (in normal paragraph format, not markdown) explaining why each location may be a hotspot based on these features:\n\n" +
        "\n\n".join(summaries)
    )

    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(batched_prompt)
    return response.text.strip(), hotspots

