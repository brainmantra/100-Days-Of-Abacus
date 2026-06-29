# api/index.py
import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import gspread
from oauth2client.service_account import ServiceAccountCredentials

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the expected incoming data from React
class VerifyRequest(BaseModel):
    mobile_number: str

# Helper function to connect to Google Sheets
def get_google_sheet():
    scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
    
    # Load credentials securely from Vercel Environment Variables
    creds_json = os.environ.get("GOOGLE_CREDENTIALS_JSON")
    if not creds_json:
        raise Exception("Google Credentials not found in environment.")
        
    creds_dict = json.loads(creds_json)
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
    client = gspread.authorize(creds)
    
    sheet_id = os.environ.get("GOOGLE_SHEET_ID")
    return client.open_by_key(sheet_id).sheet1

@app.post("/api/verify")
def verify_student(request: VerifyRequest):
    try:
        sheet = get_google_sheet()
        records = sheet.get_all_records() # Returns a list of dictionaries
        
        # Search for the mobile number
        for row in records:
            if str(row.get('Mobile Number')) == request.mobile_number:
                # Assuming your sheet columns are named exactly like this
                return {
                    "user_id": str(row.get('ID', '123')), 
                    "name": row.get('Name'),
                    "level": row.get('Level')
                }
                
        # If loop finishes without finding the number
        raise HTTPException(status_code=404, detail="Student not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))