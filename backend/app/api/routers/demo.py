from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...models.database import get_db, Base, engine
from ...services.demo_service import demo_data_service

router = APIRouter(prefix="/demo", tags=["Demo Mode & Seeding"])

@router.post("/seed")
def seed_demo_environment(db: Session = Depends(get_db)):
    """Seed synthetic enterprise cybersecurity data for full dashboard demonstration."""
    demo_data_service.seed_demo_data(db)
    return {"message": "Enterprise demo data successfully seeded."}

@router.post("/reset")
def reset_demo_environment(db: Session = Depends(get_db)):
    """Reset database tables and re-seed clean demonstration state."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    demo_data_service.seed_demo_data(db)
    return {"message": "Environment reset and clean demo state seeded."}
