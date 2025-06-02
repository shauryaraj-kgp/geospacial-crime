from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from hotspot_explainer_agent import train_and_explain_hotspot, get_default_inputs
import os
from dotenv import load_dotenv
import json
import pandas as pd
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

def load_crime_data() -> pd.DataFrame:
    """Load and cache the crime data from JSON file."""
    with open('new_monthly_data.json', 'r') as f:
        data = json.load(f)
    return pd.DataFrame(data)

# Cache the data at startup
crime_df = load_crime_data()

@app.get("/explain-hotspot/")
def explain_hotspot():
    df_imputed, crime_columns, current_week = get_default_inputs()
    result = train_and_explain_hotspot(df_imputed, crime_columns, current_week)
    return JSONResponse(result)

@app.get("/crime/{year}/{month}")
def get_crime_by_location(year: int, month: int) -> Dict[str, float]:
    """Get total detected crime for each location in a specific month and year."""
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month)
    ]
    
    crime_by_location = filtered_df.groupby('source_location')['DETECTED CRIME'].sum().to_dict()
    return crime_by_location

@app.get("/crime/{year}/{month}/{source_location}")
def get_crime_total(year: int, month: int, source_location: str) -> Dict[str, float]:
    """Get total detected crime for a specific location, month and year."""
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month) & 
        (crime_df['source_location'] == source_location)
    ]
    
    total_crime = filtered_df['DETECTED CRIME'].sum()
    return {"total_detected_crime": total_crime}

@app.get("/crime/{year}/{month}/{source_location}/weekly")
def get_weekly_crime(year: int, month: int, source_location: str) -> List[Dict]:
    """Get weekly crime data for a specific location, month and year."""
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month) & 
        (crime_df['source_location'] == source_location)
    ]
    
    # Sort by week_start to ensure sequential order
    filtered_df = filtered_df.sort_values('week_start')
    
    weekly_data = filtered_df.apply(
        lambda row: {
            "week_start": row['week_start'],
            "week_end": row['week_end'],
            "detected_crime": row['DETECTED CRIME']
        }, 
        axis=1
    ).tolist()
    
    return weekly_data

@app.get("/crime/{year}/{source_location}")
def get_yearly_crime(year: int, source_location: str) -> Dict[int, float]:
    """Get monthly crime totals for a specific location in a given year."""
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['source_location'] == source_location)
    ]
    
    # Group by month and sum the detected crime
    monthly_crime = filtered_df.groupby('month')['DETECTED CRIME'].sum().to_dict()
    return monthly_crime

@app.get("/sentiment/{year}/{month}")
def get_sentiment_by_location(year: int, month: int) -> Dict[str, float]:
    """Get average sentiment for each location in a specific month and year."""
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month)
    ]
    
    sentiment_by_location = filtered_df.groupby('source_location')['weighted_sentiment'].mean().to_dict()
    return sentiment_by_location

@app.get("/sentiment/{year}/{month}/{source_location}")
def get_sentiment_total(year: int, month: int, source_location: str) -> Dict[str, float]:
    """Get average sentiment for a specific location, month and year."""
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month) & 
        (crime_df['source_location'] == source_location)
    ]
    
    avg_sentiment = filtered_df['weighted_sentiment'].mean()
    return {"average_sentiment": avg_sentiment}

@app.get("/sentiment/{year}/{month}/{source_location}/weekly")
def get_weekly_sentiment(year: int, month: int, source_location: str) -> List[Dict]:
    """Get weekly sentiment data for a specific location, month and year."""
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month) & 
        (crime_df['source_location'] == source_location)
    ]
    
    # Sort by week_start to ensure sequential order
    filtered_df = filtered_df.sort_values('week_start')
    
    weekly_data = filtered_df.apply(
        lambda row: {
            "week_start": row['week_start'],
            "week_end": row['week_end'],
            "sentiment": row['weighted_sentiment']
        }, 
        axis=1
    ).tolist()
    
    return weekly_data

@app.get("/sentiment/{year}/{source_location}")
def get_yearly_sentiment(year: int, source_location: str) -> Dict[int, float]:
    """Get monthly sentiment averages for a specific location in a given year."""
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['source_location'] == source_location)
    ]
    
    # Group by month and calculate mean sentiment
    monthly_sentiment = filtered_df.groupby('month')['weighted_sentiment'].mean().to_dict()
    return monthly_sentiment

@app.get("/rank/crime/{year}/{month}/{source_location}")
def get_location_crime_rank(year: int, month: int, source_location: str) -> Dict[str, object]:
    """Get the crime rank of a specific location for a given month and year."""
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month)
    ]
    
    # Calculate total crime for each location and sort in descending order
    location_totals = filtered_df.groupby('source_location')['DETECTED CRIME'].sum().sort_values(ascending=False)
    
    # Get total number of locations
    total_locations = len(location_totals)
    
    # Find rank of the specified location (adding 1 because rank starts at 1)
    location_rank = location_totals.index.get_loc(source_location) + 1
    
    return location_rank

@app.get("/rank/sentiment/{year}/{month}/{source_location}")
def get_location_sentiment_rank(year: int, month: int, source_location: str) -> Dict[str, object]:
    """Get the sentiment rank of a specific location for a given month and year."""
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month)
    ]
    
    # Calculate average sentiment for each location and sort in descending order
    location_sentiments = filtered_df.groupby('source_location')['weighted_sentiment'].mean().sort_values(ascending=False)
    
    # Get total number of locations
    total_locations = len(location_sentiments)
    
    # Find rank of the specified location (adding 1 because rank starts at 1)
    location_rank = location_sentiments.index.get_loc(source_location) + 1
    
    return location_rank

@app.get("/location/metadata/{source_location}")
def get_location_metadata(source_location: str) -> Dict[str, object]:
    """Get metadata for a specific location including population, area, and council."""
    # Get the first row for this location (metadata should be same for all rows of same location)
    location_data = crime_df[crime_df['source_location'] == source_location].iloc[0]
    
    return {
        "population": location_data['Population_Census_2022-03-20'],
        "area": location_data['Area'],
        "council": location_data['COUNCIL NAME']
    }

@app.get("/crime-reasons/{year}/{month}/{source_location}")
def get_crime_reasons(year: int, month: int, source_location: str) -> Dict[str, float]:
    """Get all non-zero crime reasons for a specific location, month and year, sorted by count."""
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
    
    filtered_df = crime_df[
        (crime_df['year'] == year) & 
        (crime_df['month'] == month) & 
        (crime_df['source_location'] == source_location)
    ]
    
    # Sum each crime type and filter for non-zero values, then sort in descending order
    crime_sums = filtered_df[crime_columns].sum()
    non_zero_crimes = crime_sums[crime_sums > 0].sort_values(ascending=False).to_dict()
    
    return non_zero_crimes