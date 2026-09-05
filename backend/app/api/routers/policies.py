from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...models.models import SecurityPolicy, User
from ...schemas.schemas import PolicyCreate, PolicyResponse
from ...security.auth import get_current_user, require_roles
from ...services.policy_service import policy_service

router = APIRouter(prefix="/policies", tags=["Security Policies"])

@router.get("", response_model=List[PolicyResponse])
def list_policies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all configured organization security policies."""
    policy_service.seed_default_policies(db)
    return db.query(SecurityPolicy).all()

@router.post("", response_model=PolicyResponse)
def create_policy(
    policy_in: PolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Security Admin"]))
):
    """Create a new automated security policy rule."""
    pol = SecurityPolicy(
        name=policy_in.name,
        description=policy_in.description,
        condition_type=policy_in.condition_type,
        condition_expression=policy_in.condition_expression,
        action=policy_in.action,
        is_active=policy_in.is_active
    )
    db.add(pol)
    db.commit()
    db.refresh(pol)
    return pol

@router.patch("/{policy_id}/toggle")
def toggle_policy(
    policy_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Security Admin"]))
):
    """Enable or disable a security policy."""
    pol = db.query(SecurityPolicy).filter(SecurityPolicy.id == policy_id).first()
    if not pol:
        raise HTTPException(status_code=404, detail="Policy not found")
    pol.is_active = not pol.is_active
    db.commit()
    return {"message": f"Policy is now {'active' if pol.is_active else 'inactive'}", "is_active": pol.is_active}
