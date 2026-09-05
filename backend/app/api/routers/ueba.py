from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...security.auth import get_current_user
from ...services.ueba_service import ueba_service

router = APIRouter(prefix="/ueba", tags=["User Behavior Analytics"])

@router.get("/users")
def get_ueba_profiles(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Retrieve UEBA risk scores and behavioral anomaly baseline assessments."""
    return ueba_service.get_all_user_risk_profiles(db)

@router.get("/user/{user_id}")
def get_user_ueba(user_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Evaluate specific user's activity against behavior baselines."""
    return ueba_service.evaluate_user_behavior(db, user_id)
