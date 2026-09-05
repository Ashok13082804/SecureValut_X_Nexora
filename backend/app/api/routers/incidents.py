import json
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...models.models import Incident, User
from ...schemas.schemas import IncidentCreate, IncidentResponse, IncidentUpdate
from ...security.auth import get_current_user, require_roles
from ...blockchain.ledger import blockchain_ledger

router = APIRouter(prefix="/incidents", tags=["Incident Response"])

@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List security incident tickets with optional status filtering."""
    q = db.query(Incident)
    if status:
        q = q.filter(Incident.status == status)
    if severity:
        q = q.filter(Incident.severity == severity)
    incidents = q.order_by(Incident.created_at.desc()).all()
    
    results = []
    for inc in incidents:
        results.append({
            "id": inc.id,
            "incident_number": inc.incident_number,
            "title": inc.title,
            "severity": inc.severity,
            "category": inc.category,
            "status": inc.status,
            "affected_user_id": inc.affected_user_id,
            "affected_file_id": inc.affected_file_id,
            "risk_score": inc.risk_score,
            "evidence": json.loads(inc.evidence_json or "{}"),
            "assigned_analyst": inc.assigned_analyst,
            "investigation_notes": inc.investigation_notes,
            "created_at": inc.created_at,
            "updated_at": inc.updated_at
        })
    return results

@router.post("", response_model=IncidentResponse)
def create_incident(
    inc_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually escalate an event into a formal incident ticket."""
    incident_num = f"INC-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
    new_inc = Incident(
        incident_number=incident_num,
        title=inc_in.title,
        severity=inc_in.severity,
        category=inc_in.category,
        status="OPEN",
        affected_user_id=inc_in.affected_user_id,
        affected_file_id=inc_in.affected_file_id,
        risk_score=inc_in.risk_score,
        assigned_analyst=inc_in.assigned_analyst or current_user.full_name,
        investigation_notes=inc_in.investigation_notes or ""
    )
    db.add(new_inc)
    
    blockchain_ledger.add_audit_block(
        db=db,
        event_type="INCIDENT_CREATED",
        actor_reference=current_user.email,
        details={"incident_number": incident_num, "title": inc_in.title, "severity": inc_in.severity}
    )
    db.commit()
    db.refresh(new_inc)
    
    return {
        "id": new_inc.id,
        "incident_number": new_inc.incident_number,
        "title": new_inc.title,
        "severity": new_inc.severity,
        "category": new_inc.category,
        "status": new_inc.status,
        "affected_user_id": new_inc.affected_user_id,
        "affected_file_id": new_inc.affected_file_id,
        "risk_score": new_inc.risk_score,
        "evidence": json.loads(new_inc.evidence_json or "{}"),
        "assigned_analyst": new_inc.assigned_analyst,
        "investigation_notes": new_inc.investigation_notes,
        "created_at": new_inc.created_at,
        "updated_at": new_inc.updated_at
    }

@router.patch("/{incident_id}")
def update_incident(
    incident_id: str,
    update_in: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update incident status (OPEN, INVESTIGATING, CONTAINED, RESOLVED, FALSE_POSITIVE) or notes."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    if update_in.status:
        inc.status = update_in.status
    if update_in.assigned_analyst:
        inc.assigned_analyst = update_in.assigned_analyst
    if update_in.investigation_notes is not None:
        inc.investigation_notes = update_in.investigation_notes
        
    inc.updated_at = datetime.datetime.utcnow()
    
    blockchain_ledger.add_audit_block(
        db=db,
        event_type="INCIDENT_UPDATED",
        actor_reference=current_user.email,
        details={"incident_id": incident_id, "status": inc.status}
    )
    db.commit()
    return {"message": "Incident updated successfully", "status": inc.status}
