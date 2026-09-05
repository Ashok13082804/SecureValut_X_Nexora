from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...models.models import NLPAnalysis
from ...security.auth import get_current_user
from ...nlp.dlp_analyzer import dlp_analyzer

router = APIRouter(prefix="/nlp", tags=["NLP & DLP Analysis"])

class TestNLPRequest(BaseModel):
    filename: str
    content_text: str

@router.get("/summary")
def get_nlp_dlp_summary(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Summary of sensitive data detections and classifications across all stored files."""
    analyses = db.query(NLPAnalysis).all()
    
    total_analyzed = len(analyses)
    confidential_docs = sum(1 for a in analyses if a.sensitivity_classification in ["Confidential", "Highly Confidential"])
    total_emails = sum(a.email_count for a in analyses)
    total_phones = sum(a.phone_count for a in analyses)
    total_api_keys = sum(a.api_key_count for a in analyses)
    
    classifications = {
        "Public": sum(1 for a in analyses if a.sensitivity_classification == "Public"),
        "Internal": sum(1 for a in analyses if a.sensitivity_classification == "Internal"),
        "Confidential": sum(1 for a in analyses if a.sensitivity_classification == "Confidential"),
        "Highly Confidential": sum(1 for a in analyses if a.sensitivity_classification == "Highly Confidential"),
    }
    
    return {
        "total_documents_analyzed": total_analyzed,
        "confidential_documents_count": confidential_docs,
        "discovered_emails_count": total_emails,
        "discovered_phone_numbers_count": total_phones,
        "discovered_api_tokens_count": total_api_keys,
        "classifications_breakdown": classifications
    }

@router.post("/test-scan")
def test_nlp_scan(payload: TestNLPRequest, current_user = Depends(get_current_user)):
    """Test DLP analyzer on sample text."""
    content_bytes = payload.content_text.encode('utf-8')
    result = dlp_analyzer.analyze_content(payload.filename, content_bytes)
    return result
