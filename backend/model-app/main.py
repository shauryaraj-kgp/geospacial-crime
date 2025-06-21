from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from hotspot_explainer_agent import generate_hotspot
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import pandas as pd
from hotspot_utils import get_default_inputs

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def mongo_to_df(query={}, projection=None):
    cursor = collection.find(query, projection)
    df = pd.DataFrame(list(cursor))
    return df

@app.get("/")
def is_it_running():
    return {"message": "It's running"}

@app.get("/explain-hotspot/")
def explain_hotspot():
    try:
        crime_columns, current_week = get_default_inputs()
        current_week = pd.to_datetime(current_week)
        week_query = {"week_start": current_week}
        df = mongo_to_df(query=week_query)

        if df.empty:
            raise HTTPException(status_code=404, detail="No data found in MongoDB for this week.")
        result = generate_hotspot(df, crime_columns, current_week)
        return JSONResponse(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))