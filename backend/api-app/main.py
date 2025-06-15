from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# MongoDB configuration
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

# Initialize FastAPI app
app = FastAPI(
    title="Geospatial Crime API",
    description="API for accessing geospatial crime data",
    version="1.0.0"
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    # Test connection
    client.admin.command('ping')
    logger.info("Successfully connected to MongoDB")
except ConnectionFailure as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise

@app.get("/")
def is_it_running():
    return {"message": "It's running"}

@app.get("/crime/{year}/{month}")
def get_crime_by_location(year: int, month: int):
    pipeline = [
        {"$match": {"year": year, "month": month}},
        {"$group": {"_id": "$WARD CODE", "total": {"$sum": "$DETECTED CRIME"}}}
    ]
    results = collection.aggregate(pipeline)
    crime_by_location = {doc["_id"]: doc["total"] for doc in results}
    return {"data": crime_by_location}

@app.get("/crime/{year}/{month}/{ward_code}")
def get_crime_total(year: int, month: int, ward_code: str):
    pipeline = [
        {"$match": {"year": year, "month": month, "WARD CODE": ward_code}},
        {"$group": {"_id": None, "total": {"$sum": "$DETECTED CRIME"}}}
    ]
    result = list(collection.aggregate(pipeline))
    total_crime = result[0]["total"] if result else 0
    return {"total_detected_crime": total_crime}

@app.get("/crime/{year}/{month}/{ward_code}/weekly")
def get_weekly_crime(year: int, month: int, ward_code: str):
    cursor = collection.find(
        {"year": year, "month": month, "WARD CODE": ward_code},
        {"week_start": 1, "week_end": 1, "DETECTED CRIME": 1, "_id": 0}
    ).sort("week_start", 1)
    weekly_data = [
        {
            "week_start": doc.get("week_start"),
            "week_end": doc.get("week_end"),
            "detected_crime": doc.get("DETECTED CRIME")
        }
        for doc in cursor
    ]
    return {"data": weekly_data}

@app.get("/crime-location/{year}/{ward_code}")
def get_crime_location_yearly(year: int, ward_code: str):
    pipeline = [
        {"$match": {"year": year, "WARD CODE": ward_code}},
        {"$group": {"_id": "$month", "total": {"$sum": "$DETECTED CRIME"}}}
    ]
    results = collection.aggregate(pipeline)
    monthly_crime = {doc["_id"]: doc["total"] for doc in results}
    return {"data": monthly_crime}

@app.get("/sentiment/{year}/{month}")
def get_sentiment_by_location(year: int, month: int):
    pipeline = [
        {"$match": {"year": year, "month": month}},
        {"$group": {"_id": "$WARD CODE", "avg": {"$avg": "$weighted_sentiment"}}}
    ]
    results = collection.aggregate(pipeline)
    sentiment_by_location = {doc["_id"]: doc["avg"] for doc in results}
    return {"data": sentiment_by_location}

@app.get("/sentiment/{year}/{month}/{ward_code}")
def get_sentiment_total(year: int, month: int, ward_code: str):
    pipeline = [
        {"$match": {"year": year, "month": month, "WARD CODE": ward_code}},
        {"$group": {"_id": None, "avg": {"$avg": "$weighted_sentiment"}}}
    ]
    result = list(collection.aggregate(pipeline))
    avg_sentiment = result[0]["avg"] if result else None
    return {"average_sentiment": avg_sentiment}

@app.get("/sentiment/{year}/{month}/{ward_code}/weekly")
def get_weekly_sentiment(year: int, month: int, ward_code: str):
    cursor = collection.find(
        {"year": year, "month": month, "WARD CODE": ward_code},
        {"week_start": 1, "week_end": 1, "weighted_sentiment": 1, "_id": 0}
    ).sort("week_start", 1)
    weekly_data = [
        {
            "week_start": doc.get("week_start"),
            "week_end": doc.get("week_end"),
            "sentiment": doc.get("weighted_sentiment")
        }
        for doc in cursor
    ]
    return {"data": weekly_data}

@app.get("/sentiment-location/{year}/{ward_code}")
def get_sentiment_location_yearly(year: int, ward_code: str):
    pipeline = [
        {"$match": {"year": year, "WARD CODE": ward_code}},
        {"$group": {"_id": "$month", "avg": {"$avg": "$weighted_sentiment"}}}
    ]
    results = collection.aggregate(pipeline)
    monthly_sentiment = {doc["_id"]: doc["avg"] for doc in results}
    return {"data": monthly_sentiment}

@app.get("/rank/crime/{year}/{month}/{ward_code}")
def get_location_crime_rank(year: int, month: int, ward_code: str):
    pipeline = [
        {"$match": {"year": year, "month": month}},
        {"$group": {"_id": "$WARD CODE", "total": {"$sum": "$DETECTED CRIME"}}},
        {"$sort": {"total": -1}}
    ]
    results = list(collection.aggregate(pipeline))
    total_locations = len(results)
    location_rank = None
    for idx, doc in enumerate(results):
        if doc["_id"] == ward_code:
            location_rank = idx + 1
            break
    return {"rank": location_rank, "total_regions": total_locations}

@app.get("/rank/sentiment/{year}/{month}/{ward_code}")
def get_location_sentiment_rank(year: int, month: int, ward_code: str):
    pipeline = [
        {"$match": {"year": year, "month": month}},
        {"$group": {"_id": "$WARD CODE", "avg": {"$avg": "$weighted_sentiment"}}},
        {"$sort": {"avg": -1}}
    ]
    results = list(collection.aggregate(pipeline))
    total_locations = len(results)
    location_rank = None
    for idx, doc in enumerate(results):
        if doc["_id"] == ward_code:
            location_rank = idx + 1
            break
    return {"rank": location_rank, "total_regions": total_locations}

@app.get("/ward/metadata/{ward_code}")
def get_location_metadata(ward_code: str):
    doc = collection.find_one({"WARD CODE": ward_code})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Location '{ward_code}' not found")
    return {
        "population": int(doc.get('Population_Census_2022-03-20', 0)),
        "area": float(doc.get('Area', 0)),
        "council": str(doc.get('COUNCIL NAME', ''))
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
    cursor = collection.find(
        {"year": year, "month": month, "WARD CODE": ward_code},
        {col: 1 for col in crime_columns}
    )
    crime_sums = {col: 0 for col in crime_columns}
    for doc in cursor:
        for col in crime_columns:
            crime_sums[col] += doc.get(col, 0)
    non_zero_crimes = {k: v for k, v in sorted(crime_sums.items(), key=lambda item: item[1], reverse=True) if v > 0}
    return non_zero_crimes

@app.get("/wards")
def get_wards():
    pipeline = [
        {"$group": {"_id": {"WARD CODE": "$WARD CODE", "source_location": "$source_location"}}}
    ]
    results = collection.aggregate(pipeline)
    result = [
        {"ward_code": doc["_id"]["WARD CODE"], "source_location": doc["_id"]["source_location"]}
        for doc in results
    ]
    return result

@app.get("/ward/latlon/{ward_code}")
def get_ward_latlon(ward_code: str):
    doc = collection.find_one({"WARD CODE": ward_code})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Ward code '{ward_code}' not found")
    return {
        "latitude": float(doc.get('latitude', 0)),
        "longitude": float(doc.get('longitude', 0))
    }
