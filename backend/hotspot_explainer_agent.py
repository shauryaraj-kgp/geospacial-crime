import pandas as pd
import datetime
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report
import shap
import google.generativeai as genai
from dotenv import load_dotenv
import os
import pickle

# Load your .env with API key
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# --- Load pre-trained model and feature columns ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), "hotspot_xgb.pkl")
with open(MODEL_PATH, "rb") as f:
    model_bundle = pickle.load(f)
    loaded_model = model_bundle["model"]
    loaded_feature_cols = model_bundle["feature_cols"]

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
    # --- SHAP ANALYSIS ---
    explainer = shap.Explainer(loaded_model, X_pred)
    shap_values = explainer(X_pred)

    summary, hotspots = summarize_with_gemini(X_pred, y_pred, shap_values, predict_df)
    return {"hotspots": hotspots, "summary": summary}

def summarize_with_gemini(X_pred, y_pred, shap_values, predict_df):
    summaries = []
    hotspots = []
    for i, shap_row in enumerate(shap_values):
        if y_pred[i] != 1:
            continue  # Only include predicted hotspots
        feature_contributions = sorted(
            zip(X_pred.columns, shap_row.values),
            key=lambda x: abs(x[1]),
            reverse=True
        )[:5]
        feature_summary = "\n".join([f"- {feat}: {val:.3f}" for feat, val in feature_contributions])
        psos = predict_df.iloc[i]['source_location']
        council = predict_df.iloc[i]['COUNCIL NAME']
        summaries.append(f"**{psos} ({council})**\n"
                         f"Top features:\n{feature_summary}\n")
        hotspots.append({"ward": psos, "council": council})

    if not summaries:
        return "No hotspots detected this week.", []

    batched_prompt = (
        "The following wards were predicted to be crime hotspots this week. Each entry lists the most influential "
        "features (via SHAP values) that contributed to the prediction. Provide a short summary explaining why each "
        "location may be a hotspot based on these features:\n\n" +
        "\n\n".join(summaries)
    )

    model = genai.GenerativeModel("gemini-2.0-flash")  
    response = model.generate_content(batched_prompt)
    return response.text, hotspots

def get_default_inputs(df_imputed):
    crime_columns = [
        'Alcohol offences, travelling to and from sporting event',
        'Breach of football banning order',
        'Breach of the peace',
        'Carrying of Knives etc S Act 1993',
        'Drunk in or attempting to enter designated sports ground',
        'Mobbing and rioting',
        'Offensive behaviour at football (OBaFaTBSA 2012)',
        'Permitting riotous behaviour in licensed premises',
        'Possession of an offensive weapon',
        'Possession of offensive weapon used in other criminal activity',
        'Public mischief - including wasting police time',
        'Racially aggravated conduct',
        'Racially aggravated harassment',
        'Serious Assault',
        'Sports grounds offences possessing alcohol etc',
        'Stirring up hatred: Racial',
        'Threatening or abusive behaviour',
        'DETECTED CRIME'
    ]
    current_week = "2024-04-29"
    return df_imputed, crime_columns, current_week

# --- Example Usage ---
# if __name__ == "__main__":
#     df_imputed = pd.read_csv("full_dataset.csv")
#     df_imputed, crime_columns, current_week = get_default_inputs(df_imputed)
#     summary_output = train_and_explain_hotspot(df_imputed, crime_columns, current_week)
#     with open("hotspot_summary.md", "w") as f:
#         f.write(summary_output["summary"])
#     print("✅ Summary saved to hotspot_summary.md")
