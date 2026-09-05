from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...models.models import User, Role
from ...schemas.schemas import UserResponse
from ...security.auth import get_current_user, require_roles
from ...blockchain.ledger import blockchain_ledger

router = APIRouter(prefix="/users", tags=["User Management"])

class UpdateRoleRequest(BaseModel):
    role: str

@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Security Admin", "Organization Admin"]))
):
    """List all registered platform users."""
    return db.query(User).order_by(User.created_at.desc()).all()

@router.patch("/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: UpdateRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin"]))
):
    """Change a user's RBAC role."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    old_role = user.role
    user.role = payload.role
    
    blockchain_ledger.add_audit_block(
        db=db,
        event_type="USER_ROLE_CHANGED",
        actor_reference=current_user.email,
        details={"user_id": user_id, "old_role": old_role, "new_role": payload.role}
    )
    db.commit()
    return {"message": f"User role updated to {payload.role}"}

@router.patch("/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Security Admin"]))
):
    """Disable or activate a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot disable your own account.")
        
    user.is_active = not user.is_active
    blockchain_ledger.add_audit_block(
        db=db,
        event_type="USER_ACCOUNT_TOGGLED",
        actor_reference=current_user.email,
        details={"user_id": user_id, "is_active": user.is_active}
    )
    db.commit()
    return {"message": f"User account is now {'active' if user.is_active else 'disabled'}"}
