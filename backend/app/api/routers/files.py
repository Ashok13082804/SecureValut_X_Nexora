import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, Query, Response, status
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...models.models import (
    File, FileVersion, EncryptionMetadata, ThreatDetection,
    MLPrediction, NLPAnalysis, FileShare, DownloadHistory,
    BlockchainBlock, User
)
from ...schemas.schemas import FileResponse, FileDetailResponse
from ...security.auth import get_current_user, require_roles
from ...services.file_service import file_service
from ...blockchain.ledger import blockchain_ledger

router = APIRouter(prefix="/files", tags=["Files Management"])

@router.post("/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute complete 9-stage upload, scan, AES-256 encryption & blockchain ledgering pipeline."""
    db_file = await file_service.upload_file(db, file, current_user)
    return db_file

@router.get("", response_model=List[FileResponse])
def list_files(
    query: Optional[str] = None,
    classification: Optional[str] = None,
    quarantined: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List accessible files with role filtering."""
    q = db.query(File).filter(File.is_deleted == False)
    
    # Non-admins only see their own files
    if current_user.role not in ["Super Admin", "Security Admin", "Auditor"]:
        q = q.filter(File.owner_id == current_user.id)
        
    if query:
        q = q.filter(File.original_name.ilike(f"%{query}%"))
    if classification:
        q = q.filter(File.threat_classification == classification)
    if quarantined is not None:
        q = q.filter(File.is_quarantined == quarantined)
        
    return q.order_by(File.created_at.desc()).all()

@router.get("/{file_id}", response_model=FileDetailResponse)
def get_file_details(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve complete 7-tab deep security inspection payload."""
    file_record = db.query(File).filter(File.id == file_id, File.is_deleted == False).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Check access
    if current_user.role not in ["Super Admin", "Security Admin", "Auditor"] and file_record.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this file.")
        
    enc_meta = db.query(EncryptionMetadata).filter(EncryptionMetadata.file_id == file_id).first()
    threat = db.query(ThreatDetection).filter(ThreatDetection.file_id == file_id).first()
    ml = db.query(MLPrediction).filter(MLPrediction.file_id == file_id).first()
    nlp = db.query(NLPAnalysis).filter(NLPAnalysis.file_id == file_id).first()
    
    # Find associated blockchain block
    block = db.query(BlockchainBlock).filter(BlockchainBlock.file_hash == file_record.sha256_hash).first()
    
    versions_count = db.query(FileVersion).filter(FileVersion.file_id == file_id).count()
    shares_count = db.query(FileShare).filter(FileShare.file_id == file_id).count()
    downloads_count = db.query(DownloadHistory).filter(DownloadHistory.file_id == file_id).count()
    
    threat_schema = None
    if threat:
        threat_schema = {
            "threat_score": threat.threat_score,
            "classification": threat.classification,
            "entropy": threat.entropy,
            "has_macros": threat.has_macros,
            "has_embedded_scripts": threat.has_embedded_scripts,
            "has_pdf_javascript": threat.has_pdf_javascript,
            "abnormal_structure": threat.abnormal_structure,
            "suspicious_strings": json.loads(threat.suspicious_strings_json or "[]"),
            "explainable_reasons": json.loads(threat.explainable_reasons_json or "[]"),
            "recommendation": threat.recommendation
        }
        
    ml_schema = None
    if ml:
        ml_schema = {
            "model_name": ml.model_name,
            "model_version": ml.model_version,
            "prediction_label": ml.prediction_label,
            "confidence": ml.confidence,
            "risk_score": ml.risk_score,
            "anomaly_score": ml.anomaly_score,
            "feature_importance": json.loads(ml.feature_importance_json or "{}")
        }
        
    nlp_schema = None
    if nlp:
        nlp_schema = {
            "sensitivity_classification": nlp.sensitivity_classification,
            "confidence": nlp.confidence,
            "confidential_terms_count": nlp.confidential_terms_count,
            "email_count": nlp.email_count,
            "phone_count": nlp.phone_count,
            "api_key_count": nlp.api_key_count,
            "detected_entities": json.loads(nlp.detected_entities_json or "{}"),
            "sample_snippets": json.loads(nlp.sample_snippets_json or "[]")
        }
        
    return {
        "file": file_record,
        "encryption_algorithm": enc_meta.algorithm if enc_meta else "AES-256-GCM",
        "key_fingerprint": enc_meta.key_fingerprint if enc_meta else "Unknown",
        "threat_analysis": threat_schema,
        "ml_prediction": ml_schema,
        "nlp_analysis": nlp_schema,
        "blockchain_block_index": block.block_index if block else None,
        "blockchain_block_hash": block.current_hash if block else None,
        "versions_count": versions_count,
        "shares_count": shares_count,
        "downloads_count": downloads_count
    }

@router.get("/{file_id}/download")
def download_file(
    file_id: str,
    watermark: bool = Query(False, description="Apply dynamic recipient watermark"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Decrypt file, verify SHA-256 integrity, stamp dynamic watermark, and stream payload."""
    plaintext, filename, mime = file_service.download_file(
        db=db,
        file_id=file_id,
        current_user=current_user,
        apply_watermark=watermark
    )
    return Response(
        content=plaintext,
        media_type=mime,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.delete("/{file_id}")
def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete file and record blockchain audit event."""
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
        
    if current_user.role not in ["Super Admin", "Security Admin"] and file_record.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")
        
    file_record.is_deleted = True
    
    blockchain_ledger.add_audit_block(
        db=db,
        event_type="FILE_DELETED",
        actor_reference=current_user.email,
        file_hash=file_record.sha256_hash,
        details={"file_name": file_record.original_name}
    )
    db.commit()
    return {"message": "File deleted successfully"}

@router.post("/{file_id}/quarantine")
def toggle_quarantine(
    file_id: str,
    quarantine: bool = Query(True),
    current_user: User = Depends(require_roles(["Super Admin", "Security Admin"])),
    db: Session = Depends(get_db)
):
    """Administratively quarantine or release a file."""
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
        
    file_record.is_quarantined = quarantine
    blockchain_ledger.add_audit_block(
        db=db,
        event_type="FILE_QUARANTINED" if quarantine else "FILE_RELEASED",
        actor_reference=current_user.email,
        file_hash=file_record.sha256_hash,
        details={"file_id": file_id, "quarantine_state": quarantine}
    )
    db.commit()
    return {"message": f"File quarantine state set to {quarantine}"}
