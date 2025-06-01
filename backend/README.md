# Hotspot Explainer Backend

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and add your Google API key:
   ```bash
   cp .env.example .env
   # Edit .env to add your GOOGLE_API_KEY
   ```

3. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

## API Usage

### POST `/explain-hotspot/`
- **file**: CSV file (preprocessed, as expected by the model)
- **crime_columns**: Comma-separated string of crime column names
- **current_week**: Date string (e.g., "2024-04-29")

**Returns:**
```json
{
  "summary": "...Gemini-generated summary..."
}
```

## CORS
CORS is enabled for all origins for local development. Adjust in `main.py` for production. 