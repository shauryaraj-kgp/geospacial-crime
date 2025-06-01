import pandas as pd
import datetime
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report
import shap
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load your .env with API key
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def train_and_explain_hotspot(df_imputed: pd.DataFrame, crime_columns: list, current_week: str):
    # --- PREPARE DATA ---
    current_week = pd.to_datetime(current_week)
    df = df_imputed.copy()
    df["week_start"] = pd.to_datetime(df["week_start"])
    df = df.sort_values(by="week_start")

    train_df = df[df["week_start"] < current_week]
    predict_df = df[df["week_start"] == current_week]

    drop_cols = ['normalized_crime_delta', 'week_start', 'weighted_sentiment', 
                 'WARD CODE', 'PSOS_MMW_Name', 'hotspot', 'COUNCIL NAME', 'week_end'] + crime_columns
    feature_cols = train_df.select_dtypes(include=['number']).columns.difference(drop_cols).tolist()

    X_train = train_df[feature_cols]
    y_train = train_df["hotspot"]
    X_pred = predict_df[feature_cols]
    y_true = predict_df["hotspot"]

    # --- TRAIN MODEL ---
    model = XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_pred)

    # --- SHAP ANALYSIS ---
    explainer = shap.Explainer(model, X_train)
    shap_values = explainer(X_pred)

    summary = summarize_with_gemini(X_pred, y_pred, shap_values, predict_df)
    return summary

def summarize_with_gemini(X_pred, y_pred, shap_values, predict_df):
    summaries = []
    
    for i, shap_row in enumerate(shap_values):
        if y_pred[i] != 1:
            continue  # Only include predicted hotspots
        
        feature_contributions = sorted(
            zip(X_pred.columns, shap_row.values),
            key=lambda x: abs(x[1]),
            reverse=True
        )[:5]

        feature_summary = "\n".join([f"- {feat}: {val:.3f}" for feat, val in feature_contributions])
        psos = predict_df.iloc[i]['PSOS_MMW_Name']
        council = predict_df.iloc[i]['COUNCIL NAME']

        summaries.append(f"**{psos} ({council})**\n"
                         f"Top features:\n{feature_summary}\n")

    if not summaries:
        return "No hotspots detected this week."

    batched_prompt = (
        "The following wards were predicted to be crime hotspots this week. Each entry lists the most influential "
        "features (via SHAP values) that contributed to the prediction. Provide a short summary explaining why each "
        "location may be a hotspot based on these features:\n\n" +
        "\n\n".join(summaries)
    )

    model = genai.GenerativeModel("gemini-2.0-flash")  
    response = model.generate_content(batched_prompt)
    return response.text


# --- Example Usage ---
if __name__ == "__main__":
    df_imputed = pd.read_csv("df_imputed_preprocessed.csv")  # Preprocessed data
    crime_columns = ['Alcohol offences, travelling to and from sporting event',
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
    'TOTAL DETECTED CRIME']
    current_week = "2024-04-29"
    summary_output = train_and_explain_hotspot(df_imputed, crime_columns, current_week)
    with open("hotspot_summary.md", "w") as f:
        f.write(summary_output)
    print("✅ Summary saved to hotspot_summary.md")
