import pandas as pd
import pickle
from xgboost import XGBClassifier
from hotspot_explainer_agent import get_default_inputs
import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

# Connect to MongoDB and load data
def mongo_to_df(query={}, projection=None):
    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    cursor = collection.find(query, projection)
    df = pd.DataFrame(list(cursor))
    return df

def main():
    print("Starting script...")
    print("Loading data from MongoDB...")
    df = mongo_to_df()
    if df.empty:
        print("No data found in MongoDB.")
        return
    df_imputed, crime_columns, current_week = get_default_inputs(df)
    current_week = pd.to_datetime(current_week)
    df = df_imputed.copy()
    df["week_start"] = pd.to_datetime(df["week_start"])
    df = df.sort_values(by="week_start")
    train_df = df[df["week_start"] < current_week]
    drop_cols = ['normalized_crime_delta', 'week_start', 'weighted_sentiment', 
                 'WARD CODE', 'source_location', 'hotspot', 'COUNCIL NAME', 'week_end', 'latitude', 'longitude', 'Population_Census_2022-03-20', 'Area'] + crime_columns
    feature_cols = train_df.select_dtypes(include=['number']).columns.difference(drop_cols).tolist()
    X_train = train_df[feature_cols]
    y_train = train_df["hotspot"]
    print(f"Training on {X_train.shape[0]} samples and {X_train.shape[1]} features...")
    model = XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    with open("hotspot_xgb.pkl", "wb") as f:
        pickle.dump({
            "model": model,
            "feature_cols": feature_cols
        }, f)
    print("Model saved to hotspot_xgb.pkl")

if __name__ == "__main__":
    main() 