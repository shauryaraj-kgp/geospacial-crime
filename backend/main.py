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

def load_crime_data_chunks(chunksize=10000):
    """Yield chunks of the crime data from CSV file."""
    return pd.read_csv('full_dataset.csv', chunksize=chunksize)

@app.get("/")
def is_it_running_nigga():
    return {"message": "It's running nigga"}

@app.get("/explain-hotspot/")
def explain_hotspot():
    # This endpoint needs the full DataFrame for imputation and model training.
    # If your model can be adapted to work in chunks, do so; otherwise, this will still load the full file.
    # If memory is a concern, consider using a smaller sample or optimizing the model.
    crime_df = pd.concat(load_crime_data_chunks())
    df_imputed, crime_columns, current_week = get_default_inputs(crime_df)
    result = train_and_explain_hotspot(df_imputed, crime_columns, current_week)
    return JSONResponse(result)

@app.get("/crime/{year}/{month}")
def get_crime_by_location(year: int, month: int):
    crime_by_location = {}
    for chunk in load_crime_data_chunks():
        filtered_df = chunk[
            (chunk['year'] == year) & 
            (chunk['month'] == month)
        ]
        group = filtered_df.groupby('WARD CODE')['DETECTED CRIME'].sum()
        for ward, val in group.items():
            crime_by_location[ward] = crime_by_location.get(ward, 0) + val
    return {"data": crime_by_location}

@app.get("/crime/{year}/{month}/{ward_code}")
def get_crime_total(year: int, month: int, ward_code: str):
    total_crime = 0
    for chunk in load_crime_data_chunks():
        filtered_df = chunk[
            (chunk['year'] == year) & 
            (chunk['month'] == month) & 
            (chunk['WARD CODE'] == ward_code)
        ]
        total_crime += filtered_df['DETECTED CRIME'].sum()
    return {"total_detected_crime": total_crime}

@app.get("/crime/{year}/{month}/{ward_code}/weekly")
def get_weekly_crime(year: int, month: int, ward_code: str):
    weekly_data = []
    for chunk in load_crime_data_chunks():
        filtered_df = chunk[
            (chunk['year'] == year) & 
            (chunk['month'] == month) & 
            (chunk['WARD CODE'] == ward_code)
        ]
        filtered_df = filtered_df.sort_values('week_start')
        weekly_data.extend(filtered_df.apply(
            lambda row: {
                "week_start": row['week_start'],
                "week_end": row['week_end'],
                "detected_crime": row['DETECTED CRIME']
            }, 
            axis=1
        ).tolist())
    return {"data": weekly_data}

@app.get("/crime-location/{year}/{ward_code}")
def get_crime_location_yearly(year: int, ward_code: str):
    monthly_crime = {}
    for chunk in load_crime_data_chunks():
        filtered_df = chunk[
            (chunk['year'] == year) & 
            (chunk['WARD CODE'] == ward_code)
        ]
        group = filtered_df.groupby('month')['DETECTED CRIME'].sum()
        for month, val in group.items():
            monthly_crime[month] = monthly_crime.get(month, 0) + val
    return {"data": monthly_crime}

@app.get("/sentiment/{year}/{month}")
def get_sentiment_by_location(year: int, month: int):
    sentiment_by_location = {}
    count_by_location = {}
    for chunk in load_crime_data_chunks():
        filtered_df = chunk[
            (chunk['year'] == year) & 
            (chunk['month'] == month)
        ]
        group = filtered_df.groupby('WARD CODE')['weighted_sentiment'].agg(['sum', 'count'])
        for ward, row in group.iterrows():
            sentiment_by_location[ward] = sentiment_by_location.get(ward, 0) + row['sum']
            count_by_location[ward] = count_by_location.get(ward, 0) + row['count']
    mean_sentiment = {ward: sentiment_by_location[ward] / count_by_location[ward] for ward in sentiment_by_location}
    return {"data": mean_sentiment}

@app.get("/sentiment/{year}/{month}/{ward_code}")
def get_sentiment_total(year: int, month: int, ward_code: str):
    total_sentiment = 0
    count = 0
    for chunk in load_crime_data_chunks():
        filtered_df = chunk[
            (chunk['year'] == year) & 
            (chunk['month'] == month) & 
            (chunk['WARD CODE'] == ward_code)
        ]
        total_sentiment += filtered_df['weighted_sentiment'].sum()
        count += filtered_df['weighted_sentiment'].count()
    avg_sentiment = total_sentiment / count if count > 0 else None
    return {"average_sentiment": avg_sentiment}

@app.get("/sentiment/{year}/{month}/{ward_code}/weekly")
def get_weekly_sentiment(year: int, month: int, ward_code: str):
    weekly_data = []
    for chunk in load_crime_data_chunks():
        filtered_df = chunk[
            (chunk['year'] == year) & 
            (chunk['month'] == month) & 
            (chunk['WARD CODE'] == ward_code)
        ]
        filtered_df = filtered_df.sort_values('week_start')
        weekly_data.extend(filtered_df.apply(
            lambda row: {
                "week_start": row['week_start'],
                "week_end": row['week_end'],
                "sentiment": row['weighted_sentiment']
            }, 
            axis=1
        ).tolist())
    return {"data": weekly_data}

@app.get("/sentiment-location/{year}/{ward_code}")
def get_sentiment_location_yearly(year: int, ward_code: str):
    monthly_sentiment = {}
    count_by_month = {}
    for chunk in load_crime_data_chunks():
        filtered_df = chunk[
            (chunk['year'] == year) & 
            (chunk['WARD CODE'] == ward_code)
        ]
        group = filtered_df.groupby('month')['weighted_sentiment'].agg(['sum', 'count'])
        for month, row in group.iterrows():
            monthly_sentiment[month] = monthly_sentiment.get(month, 0) + row['sum']
            count_by_month[month] = count_by_month.get(month, 0) + row['count']
    mean_sentiment = {month: monthly_sentiment[month] / count_by_month[month] for month in monthly_sentiment}
    return {"data": mean_sentiment}

@app.get("/rank/crime/{year}/{month}/{ward_code}")
def get_location_crime_rank(year: int, month: int, ward_code: str):
    location_totals = {}
    for chunk in load_crime_data_chunks():
        filtered_df = chunk[
            (chunk['year'] == year) & 
            (chunk['month'] == month)
        ]
        group = filtered_df.groupby('WARD CODE')['DETECTED CRIME'].sum()
        for ward, val in group.items():
            location_totals[ward] = location_totals.get(ward, 0) + val
    sorted_wards = sorted(location_totals.items(), key=lambda x: x[1], reverse=True)
    total_locations = len(sorted_wards)
    location_rank = None
    for idx, (ward, _) in enumerate(sorted_wards):
        if ward == ward_code:
            location_rank = idx + 1
            break
    return {"rank": location_rank, "total_regions": total_locations}

@app.get("/rank/sentiment/{year}/{month}/{ward_code}")
def get_location_sentiment_rank(year: int, month: int, ward_code: str):
    sentiment_totals = {}
    count_by_location = {}
    for chunk in load_crime_data_chunks():
        filtered_df = chunk[
            (chunk['year'] == year) & 
            (chunk['month'] == month)
        ]
        group = filtered_df.groupby('WARD CODE')['weighted_sentiment'].agg(['sum', 'count'])
        for ward, row in group.iterrows():
            sentiment_totals[ward] = sentiment_totals.get(ward, 0) + row['sum']
            count_by_location[ward] = count_by_location.get(ward, 0) + row['count']
    mean_sentiment = {ward: sentiment_totals[ward] / count_by_location[ward] for ward in sentiment_totals}
    sorted_wards = sorted(mean_sentiment.items(), key=lambda x: x[1], reverse=True)
    total_locations = len(sorted_wards)
    location_rank = None
    for idx, (ward, _) in enumerate(sorted_wards):
        if ward == ward_code:
            location_rank = idx + 1
            break
    return {"rank": location_rank, "total_regions": total_locations}

@app.get("/ward/metadata/{ward_code}")
def get_location_metadata(ward_code: str):
    for chunk in load_crime_data_chunks():
        filtered = chunk[chunk['WARD CODE'] == ward_code]
        if not filtered.empty:
            location_data = filtered.iloc[0]
            return {
                "population": int(location_data['Population_Census_2022-03-20']),
                "area": float(location_data['Area']),
                "council": str(location_data['COUNCIL NAME'])
            }
    raise HTTPException(status_code=404, detail=f"Location '{ward_code}' not found")

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
    crime_sums = {col: 0 for col in crime_columns}
    for chunk in load_crime_data_chunks():
        filtered_df = chunk[
            (chunk['year'] == year) & 
            (chunk['month'] == month) & 
            (chunk['WARD CODE'] == ward_code)
        ]
        for col in crime_columns:
            if col in filtered_df:
                crime_sums[col] += filtered_df[col].sum()
    non_zero_crimes = {k: v for k, v in sorted(crime_sums.items(), key=lambda item: item[1], reverse=True) if v > 0}
    return non_zero_crimes

@app.get("/wards")
def get_wards():
    seen = set()
    result = []
    for chunk in load_crime_data_chunks():
        for _, row in chunk[['WARD CODE', 'source_location']].drop_duplicates().iterrows():
            key = (row['WARD CODE'], row['source_location'])
            if key not in seen:
                seen.add(key)
                result.append({"ward_code": row['WARD CODE'], "source_location": row['source_location']})
    return result

@app.get("/ward/latlon/{ward_code}")
def get_ward_latlon(ward_code: str):
    for chunk in load_crime_data_chunks():
        filtered = chunk[chunk['WARD CODE'] == ward_code]
        if not filtered.empty:
            location_data = filtered.iloc[0]
            return {
                "latitude": float(location_data['latitude']),
                "longitude": float(location_data['longitude'])
            }
    raise HTTPException(status_code=404, detail=f"Ward code '{ward_code}' not found")

# @app.get("/data")
# def get_data():
#     """Serve the original JSON data file (for download or inspection)."""
#     return FileResponse("new_monthly_data.json", media_type='application/json', filename="new_monthly_data.json")