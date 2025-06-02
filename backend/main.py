from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from hotspot_explainer_agent import train_and_explain_hotspot, get_default_inputs
import os
from dotenv import load_dotenv
import pandas as pd
import json
from typing import List, Dict

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory cache for the CSV data
crime_df_cache = None

def load_crime_data() -> pd.DataFrame:
    """Load the crime data from CSV file, using a global in-memory cache."""
    global crime_df_cache
    if crime_df_cache is not None:
        return crime_df_cache
    crime_df_cache = pd.read_csv('full_dataset.csv')
    return crime_df_cache

@app.get("/")
def is_it_running_nigga():
    return {"message": "It's running nigga"}

@app.get("/explain-hotspot/")
def explain_hotspot():
    crime_df = load_crime_data()
    df_imputed, crime_columns, current_week = get_default_inputs(crime_df)
    result = train_and_explain_hotspot(df_imputed, crime_columns, current_week)
    return JSONResponse(result)

@app.get("/crime/{year}/{month}")
def get_crime_by_location(year: int, month: int):
    crime_df = load_crime_data()
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month)
    ]
    crime_by_location = filtered_df.groupby('WARD CODE')['DETECTED CRIME'].sum().to_dict()
    return {"data": crime_by_location}

@app.get("/crime/{year}/{month}/{ward_code}")
def get_crime_total(year: int, month: int, ward_code: str):
    crime_df = load_crime_data()
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month) & 
        (crime_df['WARD CODE'] == ward_code)
    ]
    total_crime = filtered_df['DETECTED CRIME'].sum()
    return {"total_detected_crime": total_crime}

@app.get("/crime/{year}/{month}/{ward_code}/weekly")
def get_weekly_crime(year: int, month: int, ward_code: str):
    crime_df = load_crime_data()
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month) & 
        (crime_df['WARD CODE'] == ward_code)
    ]
    filtered_df = filtered_df.sort_values('week_start')
    weekly_data = filtered_df.apply(
        lambda row: {
            "week_start": row['week_start'],
            "week_end": row['week_end'],
            "detected_crime": row['DETECTED CRIME']
        }, 
        axis=1
    ).tolist()
    return {"data": weekly_data}

@app.get("/crime-location/{year}/{ward_code}")
def get_crime_location_yearly(year: int, ward_code: str):
    crime_df = load_crime_data()
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['WARD CODE'] == ward_code)
    ]
    monthly_crime = filtered_df.groupby('month')['DETECTED CRIME'].sum().to_dict()
    return {"data": monthly_crime}

@app.get("/sentiment/{year}/{month}")
def get_sentiment_by_location(year: int, month: int):
    crime_df = load_crime_data()
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month)
    ]
    sentiment_by_location = filtered_df.groupby('WARD CODE')['weighted_sentiment'].mean().to_dict()
    return {"data": sentiment_by_location}

@app.get("/sentiment/{year}/{month}/{ward_code}")
def get_sentiment_total(year: int, month: int, ward_code: str):
    crime_df = load_crime_data()
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month) & 
        (crime_df['WARD CODE'] == ward_code)
    ]
    avg_sentiment = filtered_df['weighted_sentiment'].mean()
    return {"average_sentiment": avg_sentiment}

@app.get("/sentiment/{year}/{month}/{ward_code}/weekly")
def get_weekly_sentiment(year: int, month: int, ward_code: str):
    crime_df = load_crime_data()
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month) & 
        (crime_df['WARD CODE'] == ward_code)
    ]
    filtered_df = filtered_df.sort_values('week_start')
    weekly_data = filtered_df.apply(
        lambda row: {
            "week_start": row['week_start'],
            "week_end": row['week_end'],
            "sentiment": row['weighted_sentiment']
        }, 
        axis=1
    ).tolist()
    return {"data": weekly_data}

@app.get("/sentiment-location/{year}/{ward_code}")
def get_sentiment_location_yearly(year: int, ward_code: str):
    crime_df = load_crime_data()
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['WARD CODE'] == ward_code)
    ]
    monthly_sentiment = filtered_df.groupby('month')['weighted_sentiment'].mean().to_dict()
    return {"data": monthly_sentiment}

@app.get("/rank/crime/{year}/{month}/{ward_code}")
def get_location_crime_rank(year: int, month: int, ward_code: str):
    crime_df = load_crime_data()
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month)
    ]
    location_totals = filtered_df.groupby('WARD CODE')['DETECTED CRIME'].sum().sort_values(ascending=False)
    total_locations = len(location_totals)
    if ward_code in location_totals.index:
        location_rank = location_totals.index.get_loc(ward_code) + 1
    else:
        location_rank = None
    return {"rank": location_rank, "total_regions": total_locations}

@app.get("/rank/sentiment/{year}/{month}/{ward_code}")
def get_location_sentiment_rank(year: int, month: int, ward_code: str):
    crime_df = load_crime_data()
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month)
    ]
    location_sentiments = filtered_df.groupby('WARD CODE')['weighted_sentiment'].mean().sort_values(ascending=False)
    total_locations = len(location_sentiments)
    if ward_code in location_sentiments.index:
        location_rank = location_sentiments.index.get_loc(ward_code) + 1
    else:
        location_rank = None
    return {"rank": location_rank, "total_regions": total_locations}

@app.get("/ward/metadata/{ward_code}")
def get_location_metadata(ward_code: str):
    crime_df = load_crime_data()
    filtered = crime_df[crime_df['WARD CODE'] == ward_code]
    if filtered.empty:
        raise HTTPException(status_code=404, detail=f"Location '{ward_code}' not found")
    location_data = filtered.iloc[0]
    return {
        "population": int(location_data['Population_Census_2022-03-20']),
        "area": float(location_data['Area']),
        "council": str(location_data['COUNCIL NAME'])
    }

@app.get("/crime-reasons/{year}/{month}/{ward_code}")
def get_crime_reasons(year: int, month: int, ward_code: str):
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
        'Threatening or abusive behaviour'
    ]
    crime_df = load_crime_data()
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month) & 
        (crime_df['WARD CODE'] == ward_code)
    ]
    crime_sums = filtered_df[crime_columns].sum()
    non_zero_crimes = crime_sums[crime_sums > 0].sort_values(ascending=False).to_dict()
    return non_zero_crimes

@app.get("/wards")
def get_wards():
    crime_df = load_crime_data()
    unique_wards = crime_df[['WARD CODE', 'source_location']].drop_duplicates()
    result = [
        {"ward_code": row['WARD CODE'], "source_location": row['source_location']} 
        for _, row in unique_wards.iterrows()
    ]
    return result

@app.get("/ward/latlon/{ward_code}")
def get_ward_latlon(ward_code: str):
    crime_df = load_crime_data()
    filtered = crime_df[crime_df['WARD CODE'] == ward_code]
    if filtered.empty:
        raise HTTPException(status_code=404, detail=f"Ward code '{ward_code}' not found")
    location_data = filtered.iloc[0]
    return {
        "latitude": float(location_data['latitude']),
        "longitude": float(location_data['longitude'])
    }

# @app.get("/data")
# def get_data():
#     """Serve the original JSON data file (for download or inspection)."""
#     return FileResponse("new_monthly_data.json", media_type='application/json', filename="new_monthly_data.json")