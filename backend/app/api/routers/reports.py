import datetime
from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...models.models import File, ThreatDetection, Incident, AuditLog, BlockchainBlock, User
from ...security.auth import get_current_user
from ...services.reporting_service import reporting_service

router = APIRouter(prefix="/reports", tags=["Report Generation"])

@router.get("/export/pdf")
def export_pdf_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Generate and stream a formal PDF security audit report."""
    pdf_bytes = reporting_service.generate_pdf_summary_report(db)
    filename = f"SecureAI_Vault_Audit_Report_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export/json")
def export_json_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Export complete SOC state and threat telemetry in JSON format."""
    files = db.query(File).count()
    threats = db.query(ThreatDetection).count()
    incidents = db.query(Incident).count()
    blocks = db.query(BlockchainBlock).count()
    
    data = {
        "platform": "SecureAI Vault",
        "exported_at": datetime.datetime.utcnow().isoformat(),
        "exported_by": current_user.email,
        "summary": {
            "total_files": files,
            "threats_detected": threats,
            "incidents": incidents,
            "blockchain_blocks": blocks
        }
    }
    json_str = reporting_service.generate_json_report(data)
    filename = f"SecureAI_Vault_Data_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export/csv")
def export_csv_report(
    target: str = Query("threats", enum=["threats", "incidents", "audit"]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export threat detections, incidents, or audit logs in CSV format."""
    if target == "threats":
        rows = []
        threats = db.query(ThreatDetection).all()
        for t in threats:
            rows.append({
                "FileID": t.file_id,
                "ThreatScore": t.threat_score,
                "Classification": t.classification,
                "Entropy": t.entropy,
                "HasMacros": t.has_macros,
                "HasJavaScript": t.has_pdf_javascript,
                "ScannedAt": t.scanned_at
            })
        fieldnames = ["FileID", "ThreatScore", "Classification", "Entropy", "HasMacros", "HasJavaScript", "ScannedAt"]
    elif target == "incidents":
        rows = []
        incs = db.query(Incident).all()
        for i in incs:
            rows.append({
                "IncidentNumber": i.incident_number,
                "Title": i.title,
                "Severity": i.severity,
                "Status": i.status,
                "RiskScore": i.risk_score,
                "AssignedAnalyst": i.assigned_analyst,
                "CreatedAt": i.created_at
            })
        fieldnames = ["IncidentNumber", "Title", "Severity", "Status", "RiskScore", "AssignedAnalyst", "CreatedAt"]
    else:
        rows = []
        logs = db.query(AuditLog).limit(500).all()
        for l in logs:
            rows.append({
                "Action": l.action,
                "Actor": l.actor_name,
                "TargetType": l.target_type,
                "TargetID": l.target_id,
                "Status": l.status,
                "Timestamp": l.timestamp
            })
        fieldnames = ["Action", "Actor", "TargetType", "TargetID", "Status", "Timestamp"]

    csv_data = reporting_service.generate_csv_report(rows, fieldnames)
    filename = f"SecureAI_{target}_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
