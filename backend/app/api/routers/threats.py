import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...models.models import ThreatDetection, File, User
from ...security.auth import get_current_user

router = APIRouter(prefix="/threats", tags=["Threat Center"])

@router.get("")
def list_threats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all detected file threats across the organization."""
    threats = db.query(ThreatDetection).order_by(ThreatDetection.threat_score.desc()).all()
    results = []
    for t in threats:
        f = db.query(File).filter(File.id == t.file_id).first()
        results.append({
            "id": t.id,
            "file_id": t.file_id,
            "file_name": f.original_name if f else "Unknown",
            "file_size": f.file_size if f else 0,
            "threat_score": t.threat_score,
            "classification": t.classification,
            "entropy": t.entropy,
            "has_macros": t.has_macros,
            "has_embedded_scripts": t.has_embedded_scripts,
            "has_pdf_javascript": t.has_pdf_javascript,
            "abnormal_structure": t.abnormal_structure,
            "is_quarantined": f.is_quarantined if f else False,
            "suspicious_strings": json.loads(t.suspicious_strings_json or "[]"),
            "explainable_reasons": json.loads(t.explainable_reasons_json or "[]"),
            "recommendation": t.recommendation,
            "scanned_at": t.scanned_at
        })
    return results
