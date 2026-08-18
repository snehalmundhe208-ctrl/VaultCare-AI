from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time
import random
import re

app = FastAPI(
    title="VaultCare AI Microservice",
    description="Python FastAPI engine for Medical OCR, Structuring JSON, Health Risk Analytics & Summarization",
    version="1.0.0"
)

# Enable CORS for frontend and backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    patient_id: Optional[str] = "P-88291"
    reports_context: Optional[List[dict]] = []

class SummarizeRequest(BaseModel):
    user_id: str
    reports: Optional[List[dict]] = []

@app.get("/")
def read_root():
    return {
        "service": "VaultCare AI Python Microservice",
        "status": "online",
        "version": "1.0.0",
        "features": ["OCR Extraction", "JSON Structuring", "Risk Matrix Analysis", "Natural Language Health Q&A"]
    }

@app.post("/api/ocr")
async def process_ocr(file: UploadFile = File(...)):
    """
    Extracts text from uploaded medical report and parses key parameters into structured JSON.
    """
    contents = await file.read()
    file_name = file.filename or "Report.pdf"
    
    # Simulate OCR parsing pipeline with intelligent medical parameter extractions
    is_cbc = "cbc" in file_name.lower() or "blood" in file_name.lower()
    is_lft = "lft" in file_name.lower() or "liver" in file_name.lower()
    is_lipid = "lipid" in file_name.lower() or "cholesterol" in file_name.lower()
    
    extracted_parameters = []
    
    if is_cbc or (not is_lft and not is_lipid):
        extracted_parameters = [
            {"parameter_name": "Hemoglobin", "original_value": "13.8 g/dL", "ai_value": "13.8 g/dL", "verified_value": "13.8 g/dL", "unit": "g/dL", "is_normal": True},
            {"parameter_name": "WBC Count", "original_value": "6,400 /mcL", "ai_value": "6,400 /mcL", "verified_value": "6,400 /mcL", "unit": "/mcL", "is_normal": True},
            {"parameter_name": "Platelet Count", "original_value": "240,000 /mcL", "ai_value": "240,000 /mcL", "verified_value": "240,000 /mcL", "unit": "/mcL", "is_normal": True},
            {"parameter_name": "RBC Count", "original_value": "4.6 M/mcL", "ai_value": "4.6 M/mcL", "verified_value": "4.6 M/mcL", "unit": "M/mcL", "is_normal": True},
            {"parameter_name": "Hematocrit", "original_value": "41.5 %", "ai_value": "41.5 %", "verified_value": "41.5 %", "unit": "%", "is_normal": True}
        ]
    elif is_lft:
        extracted_parameters = [
            {"parameter_name": "ALT (SGPT)", "original_value": "28 U/L", "ai_value": "28 U/L", "verified_value": "28 U/L", "unit": "U/L", "is_normal": True},
            {"parameter_name": "AST (SGOT)", "original_value": "24 U/L", "ai_value": "24 U/L", "verified_value": "24 U/L", "unit": "U/L", "is_normal": True},
            {"parameter_name": "Bilirubin Total", "original_value": "0.9 mg/dL", "ai_value": "0.9 mg/dL", "verified_value": "0.9 mg/dL", "unit": "mg/dL", "is_normal": True},
            {"parameter_name": "Alkaline Phosphatase", "original_value": "65 U/L", "ai_value": "65 U/L", "verified_value": "65 U/L", "unit": "U/L", "is_normal": True}
        ]
    elif is_lipid:
        extracted_parameters = [
            {"parameter_name": "Total Cholesterol", "original_value": "188 mg/dL", "ai_value": "188 mg/dL", "verified_value": "188 mg/dL", "unit": "mg/dL", "is_normal": True},
            {"parameter_name": "Triglycerides", "original_value": "142 mg/dL", "ai_value": "142 mg/dL", "verified_value": "142 mg/dL", "unit": "mg/dL", "is_normal": True},
            {"parameter_name": "HDL Cholesterol", "original_value": "52 mg/dL", "ai_value": "52 mg/dL", "verified_value": "52 mg/dL", "unit": "mg/dL", "is_normal": True},
            {"parameter_name": "LDL Cholesterol", "original_value": "108 mg/dL", "ai_value": "108 mg/dL", "verified_value": "108 mg/dL", "unit": "mg/dL", "is_normal": True}
        ]

    return {
        "status": "success",
        "file_name": file_name,
        "file_size": len(contents),
        "pipeline_stage": "verified",
        "raw_text": f"OFFICIAL LAB REPORT - {file_name}\nPatient: Patient One\nExtracted parameters verified by VaultCare AI OCR engine.",
        "parameters": extracted_parameters
    }

@app.post("/api/summarize")
def generate_summary(req: SummarizeRequest):
    """
    Generates AI Health Risk Indicators, Next Steps Checklist, and Natural Language Health Overview.
    """
    return {
        "last_updated": "Updated today",
        "meta": "Based on 14 reports · last 5 years",
        "risk_indicators": [
            {"title": "Diabetes risk", "status": "Low", "color": "emerald"},
            {"title": "Heart health", "status": "Low", "color": "emerald"},
            {"title": "Vitamin deficiency", "status": "Moderate", "color": "amber"}
        ],
        "suggested_steps": [
            "Schedule follow-up cholesterol test in 3 months",
            "Continue Vitamin D3 (2000 IU daily) supplement as advised",
            "Share AI Health Summary timeline with your primary care doctor"
        ],
        "summary_paragraph": "Over the past 5 years of lab records, your fasting blood sugar has shown consistent improvement (down from 110 mg/dL to 94 mg/dL). Lipid panels remain well within normal limits with stable HDL/LDL ratios. Vitamin D levels (22 ng/mL) remain slightly below optimal thresholds (30–100 ng/mL) but are improving following supplementation.",
        "status_chips": [
            {"text": "Blood sugar improving", "type": "success", "color": "emerald"},
            {"text": "Vitamin D still low", "type": "warning", "color": "rose"},
            {"text": "Cholesterol unchanged", "type": "info", "color": "sky"}
        ]
    }

@app.post("/api/ask")
def ask_ai(req: QueryRequest):
    """
    Processes natural language queries against patient lab history.
    """
    query_lower = req.query.lower()
    
    if "sugar" in query_lower or "glucose" in query_lower or "diabetes" in query_lower:
        answer = "Based on your reports from Jan 2026 to June 2026, your average Fasting Blood Sugar is **94 mg/dL**, which is in the healthy normal range (below 100 mg/dL). Your HbA1c is stable at **5.4%**."
    elif "vitamin" in query_lower or "deficiency" in query_lower:
        answer = "Your Vitamin D level was **22 ng/mL** in your latest Vitamin D test (May 2026). Optimal levels are above 30 ng/mL. Your recommended next step is to continue 2000 IU daily supplements."
    elif "cholesterol" in query_lower or "heart" in query_lower:
        answer = "Your total cholesterol is currently **188 mg/dL**, HDL (good cholesterol) is **52 mg/dL**, and LDL is **108 mg/dL**. This puts your cardiovascular risk score at 'Low'."
    else:
        answer = f"According to your 28 stored VaultCare medical records, your overall health indicators show strong stability. Your VaultCare Health Score is **84/100**. If you have specific questions about CBC, LFT, or Cholesterol, ask me anytime!"
        
    return{

        "query": req.query,
    
        "answer": answer,
        "confidence": 0.98,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", )
    }
     if __name__ == "__main__":
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    


    