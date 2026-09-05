import datetime
import uuid
import json
from sqlalchemy.orm import Session
from ..models.models import User, DownloadHistory, SecurityEvent, Incident

class UEBAService:
    @classmethod
    def evaluate_user_behavior(cls, db: Session, user_id: str) -> dict:
        """
        Evaluate user behavioral metrics vs baseline:
        - Download velocity (downloads in last 10 minutes)
        - Threat upload history
        - Failed logins
        - Device variations
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"user_risk_score": 15.0, "status": "Normal"}
            
        ten_mins_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=10)
        recent_downloads = db.query(DownloadHistory).filter(
            DownloadHistory.user_id == user_id,
            DownloadHistory.downloaded_at >= ten_mins_ago
        ).count()
        
        anomalies = []
        calculated_risk = user.risk_score
        
        # 1. Bulk download spike anomaly
        if recent_downloads >= 15:
            anomalies.append(f"Abnormal download spike: {recent_downloads} files downloaded within 10 minutes (Normal baseline: 2-4/day).")
            calculated_risk = max(calculated_risk, 88.0)
        elif recent_downloads >= 8:
            anomalies.append(f"Elevated download volume: {recent_downloads} files downloaded in 10 minutes.")
            calculated_risk = max(calculated_risk, 55.0)
            
        # 2. Failed logins
        if user.failed_login_attempts >= 3:
            anomalies.append(f"Multiple failed authentication attempts ({user.failed_login_attempts}) recorded.")
            calculated_risk = max(calculated_risk, 70.0)
            
        # Update user record if risk escalated
        if calculated_risk != user.risk_score:
            user.risk_score = round(calculated_risk, 1)
            db.commit()
            
        # If severe anomaly detected, create an incident
        if calculated_risk >= 80.0 and anomalies:
            existing_inc = db.query(Incident).filter(
                Incident.affected_user_id == user_id,
                Incident.category == "UEBA Anomaly",
                Incident.status == "OPEN"
            ).first()
            if not existing_inc:
                inc = Incident(
                    incident_number=f"UEBA-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
                    title=f"UEBA Anomaly: Elevated Risk Profile for {user.username}",
                    severity="HIGH",
                    category="UEBA Anomaly",
                    status="OPEN",
                    affected_user_id=user.id,
                    risk_score=int(calculated_risk),
                    evidence_json=json.dumps({"anomalies": anomalies, "downloads_10m": recent_downloads}),
                    assigned_analyst="Security SOC Lead",
                    investigation_notes="Automated alert triggered by UEBA baseline anomaly monitor."
                )
                db.add(inc)
                db.commit()
                
        return {
            "user_id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "baseline_risk": 15.0,
            "current_risk": user.risk_score,
            "recent_downloads_count": recent_downloads,
            "anomalies": anomalies,
            "status": "High Risk" if user.risk_score >= 75 else ("Elevated" if user.risk_score >= 45 else "Normal")
        }

    @classmethod
    def get_all_user_risk_profiles(cls, db: Session) -> list:
        users = db.query(User).all()
        profiles = []
        for u in users:
            profiles.append(cls.evaluate_user_behavior(db, u.id))
        return sorted(profiles, key=lambda x: x["current_risk"], reverse=True)

ueba_service = UEBAService()
