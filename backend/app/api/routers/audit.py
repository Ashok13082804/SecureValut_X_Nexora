import json
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...models.models import AuditLog, User
from ...security.auth import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("")
def list_audit_logs(
    action: Optional[str] = None,
    actor: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve tamper-evident cryptographic audit logs."""
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    if actor:
        q = q.filter(AuditLog.actor_name.ilike(f"%{actor}%"))
        
    logs = q.order_by(AuditLog.timestamp.desc()).limit(100).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "action": l.action,
            "actor_id": l.actor_id,
            "actor_name": l.actor_name,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "ip_address": l.ip_address,
            "status": l.status,
            "details": json.loads(l.details_json or "{}"),
            "hash_signature": l.hash_signature,
            "timestamp": l.timestamp
        })
    return results
