import pandas as pd
from xgboost import XGBClassifier
from hotspot_utils import get_default_inputs
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import joblib


# Load environment variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

# Directory to save models
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_PATH = os.path.join(MODEL_DIR, "hotspot_xgb.joblib")
FEATURE_COLS_PATH = os.path.join(MODEL_DIR, "feature_cols.joblib")

def mongo_to_df(query={}, projection=None):
    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    cursor = collection.find(query, projection)
    df = pd.DataFrame(list(cursor))
    return df

def main():
    print("Loading data from MongoDB...")
    df = mongo_to_df()
    if df.empty:
        print("No data found in MongoDB.")
        return

    print("Preprocessing data...")
    df_imputed, crime_columns, current_week = get_default_inputs(df)
    current_week = pd.to_datetime(current_week)

    df_imputed["week_start"] = pd.to_datetime(df_imputed["week_start"])
    df_imputed = df_imputed.sort_values(by="week_start")
    train_df = df_imputed[df_imputed["week_start"] < current_week]

    drop_cols = [
        'normalized_crime_delta', 'week_start', 'weighted_sentiment', 'WARD CODE',
        'source_location', 'hotspot', 'COUNCIL NAME', 'week_end', 'latitude',
        'longitude', 'Population_Census_2022-03-20', 'Area'
    ] + crime_columns

    feature_cols = train_df.select_dtypes(include=["number"]).columns.difference(drop_cols).tolist()

    X_train = train_df[feature_cols]
    y_train = train_df["hotspot"]

    print(f"Training XGBoost model on {X_train.shape[0]} samples and {X_train.shape[1]} features...")
    model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    print("Saving model and feature columns...")
    # model.save_model(MODEL_PATH)  # Save with XGBoost’s own format
    joblib.dump(model, MODEL_PATH)
    joblib.dump(feature_cols, FEATURE_COLS_PATH)

    print(f"Model saved to {MODEL_PATH}")
    print(f"Feature columns saved to {FEATURE_COLS_PATH}")

if __name__ == "__main__":
    main()