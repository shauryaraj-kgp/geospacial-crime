from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from hotspot_explainer_agent import train_and_explain_hotspot, get_default_inputs
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/explain-hotspot/")
def explain_hotspot():
    df_imputed, crime_columns, current_week = get_default_inputs()
    result = train_and_explain_hotspot(df_imputed, crime_columns, current_week)
    return JSONResponse(result) 