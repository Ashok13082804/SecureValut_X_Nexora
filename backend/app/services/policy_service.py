from sqlalchemy.orm import Session
from ..models.models import SecurityPolicy

class PolicyService:
    DEFAULT_POLICIES = [
        {
            "name": "DLP Confidential Restriction",
            "description": "Block external link sharing if document classification is Highly Confidential",
            "condition_type": "DLP_CLASSIFICATION",
            "condition_expression": "nlp_classification == 'Highly Confidential'",
            "action": "REQUIRE_APPROVAL"
        },
        {
            "name": "Malware Threat Quarantine",
            "description": "Automatically isolate and quarantine files with composite threat score >= 70",
            "condition_type": "THREAT_THRESHOLD",
            "condition_expression": "threat_score >= 70",
            "action": "QUARANTINE"
        },
        {
            "name": "Mass Download UEBA Defense",
            "description": "Escalate user risk score and lock share link if downloads exceed 15 in 10 minutes",
            "condition_type": "DOWNLOAD_VELOCITY",
            "condition_expression": "recent_downloads >= 15",
            "action": "BLOCK"
        },
        {
            "name": "Mandatory Dynamic Watermark",
            "description": "Enforce dynamic diagonal recipient watermark on all Confidential files",
            "condition_type": "WATERMARK_RULE",
            "condition_expression": "nlp_classification in ['Confidential', 'Highly Confidential']",
            "action": "ALERT"
        }
    ]

    @classmethod
    def seed_default_policies(cls, db: Session):
        count = db.query(SecurityPolicy).count()
        if count == 0:
            for p in cls.DEFAULT_POLICIES:
                policy = SecurityPolicy(
                    name=p["name"],
                    description=p["description"],
                    condition_type=p["condition_type"],
                    condition_expression=p["condition_expression"],
                    action=p["action"],
                    is_active=True
                )
                db.add(policy)
            db.commit()

policy_service = PolicyService()
