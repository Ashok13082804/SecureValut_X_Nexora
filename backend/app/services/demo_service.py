import os
import uuid
import json
import datetime
from sqlalchemy.orm import Session
from ..config.settings import settings
from ..models.models import (
    User, Role, File, FileVersion, EncryptionMetadata,
    ThreatDetection, MLPrediction, NLPAnalysis, BlockchainBlock,
    Incident, Notification, AuditLog, SecurityPolicy
)
from ..security.auth import get_password_hash
from ..security.crypto import crypto_service
from ..blockchain.ledger import blockchain_ledger
from .policy_service import policy_service

class DemoDataService:
    @classmethod
    def seed_demo_data(cls, db: Session):
        """Seed complete synthetic enterprise cybersecurity environment."""
        # Check if already seeded
        existing_user = db.query(User).filter(User.email == "admin@secureai.local").first()
        if existing_user:
            return

        # 1. Seed Roles
        roles_def = [
            ("Super Admin", "Full sovereign privileges across the cybersecurity platform"),
            ("Security Admin", "Threat management, incident investigation, policy configuration"),
            ("Organization Admin", "User provisioning, departmental governance"),
            ("Manager", "File approvals, high-confidentiality clearance"),
            ("Employee", "Standard encrypted storage, sharing, and viewing"),
            ("Auditor", "Read-only access to tamper-evident blockchain and audit trails"),
            ("Guest", "Restricted temporary access to designated shared assets")
        ]
        role_objs = {}
        for r_name, r_desc in roles_def:
            r = Role(name=r_name, description=r_desc)
            db.add(r)
            db.flush()
            role_objs[r_name] = r

        # 2. Seed Default Users (Password: Password@123!)
        demo_password_hash = get_password_hash("Password@123!")
        
        users_def = [
            ("admin@secureai.local", "admin", "System Administrator", "Super Admin", 5.0),
            ("soc_analyst@secureai.local", "soc_analyst", "Elena Rostova (SOC Lead)", "Security Admin", 10.0),
            ("john.doe@secureai.local", "john.doe", "Johnathan Doe", "Employee", 18.0),
            ("auditor@secureai.local", "auditor", "Marcus Vance (External Auditor)", "Auditor", 8.0)
        ]
        
        user_objs = {}
        for email, uname, fname, rname, risk in users_def:
            u = User(
                email=email,
                username=uname,
                full_name=fname,
                hashed_password=demo_password_hash,
                role=rname,
                role_id=role_objs[rname].id,
                is_active=True,
                is_verified=True,
                risk_score=risk,
                mfa_enabled=True,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=30)
            )
            db.add(u)
            db.flush()
            user_objs[uname] = u

        # 3. Seed Policies
        policy_service.seed_default_policies(db)

        # 4. Initialize Blockchain Genesis Block
        blockchain_ledger.ensure_genesis_block(db)

        # 5. Seed Synthetic Files (Clean, Suspicious, Malicious)
        files_data = [
            {
                "name": "Q3_Financial_Audit_Report.pdf",
                "ext": "pdf",
                "mime": "application/pdf",
                "content": b"%PDF-1.5\n%Header\nCONFIDENTIAL FINANCIAL AUDIT\nNet Revenue: $42,500,000\nEBITDA Margin: 28.4%\nInternal routing only.\nAccountant: sarah.cfo@secureai.local\nPhone: +1-555-019-2831\n%%EOF",
                "threat_score": 12,
                "threat_class": "Safe",
                "nlp_class": "Confidential",
                "quarantined": False,
                "entropy": 4.12
            },
            {
                "name": "Employee_Bonus_Plan_2026.xlsx",
                "ext": "xlsx",
                "mime": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "content": b"PK\x03\x04\x14\x00\x00\x00\x08\x00Employee Compensation Matrix, Strictly Private, Internal Use Only.",
                "threat_score": 24,
                "threat_class": "Low Risk",
                "nlp_class": "Highly Confidential",
                "quarantined": False,
                "entropy": 5.24
            },
            {
                "name": "Invoice_Macro_Payment_Processor.docm",
                "ext": "docm",
                "mime": "application/vnd.ms-word.document.macroEnabled.12",
                "content": b"PK\x03\x04\x14\x00\x00\x00\x08\x00word/vbaProject.bin AutoOpen() powershell -c Invoke-Expression",
                "threat_score": 88,
                "threat_class": "High Risk",
                "nlp_class": "Internal",
                "quarantined": True,
                "entropy": 7.68
            },
            {
                "name": "Cloud_Architecture_Whitepaper.pdf",
                "ext": "pdf",
                "mime": "application/pdf",
                "content": b"%PDF-1.7\nZero-Trust Multi-Cloud Architecture Framework. Public dissemination approved.",
                "threat_score": 8,
                "threat_class": "Safe",
                "nlp_class": "Public",
                "quarantined": False,
                "entropy": 3.85
            }
        ]

        admin_u = user_objs["admin"]
        john_u = user_objs["john.doe"]

        for f_item in files_data:
            sha256 = crypto_service.calculate_sha256(f_item["content"])
            enc = crypto_service.encrypt_file_data(f_item["content"])
            
            storage_name = f"{uuid.uuid4().hex}_{f_item['name']}.enc"
            storage_path = os.path.join(settings.STORAGE_PATH, storage_name)
            with open(storage_path, "wb") as f_out:
                f_out.write(enc["ciphertext"])
                
            db_file = File(
                original_name=f_item["name"],
                storage_name=storage_name,
                file_extension=f_item["ext"],
                mime_type=f_item["mime"],
                file_size=len(f_item["content"]),
                sha256_hash=sha256,
                owner_id=admin_u.id if "Financial" in f_item["name"] else john_u.id,
                threat_score=f_item["threat_score"],
                threat_classification=f_item["threat_class"],
                nlp_classification=f_item["nlp_class"],
                is_quarantined=f_item["quarantined"],
                integrity_status="VERIFIED",
                current_version=1
            )
            db.add(db_file)
            db.flush()

            # Encryption Metadata
            db_enc = EncryptionMetadata(
                file_id=db_file.id,
                algorithm="AES-256-GCM",
                nonce_b64=enc["nonce_b64"],
                tag_b64=enc["tag_b64"],
                encrypted_key_b64=enc["encrypted_key_b64"],
                key_fingerprint=enc["key_fingerprint"],
                key_version=1
            )
            db.add(db_enc)

            # Threat Detection
            reasons = []
            if f_item["quarantined"]:
                reasons.append("Embedded VBA Macro detected (vbaProject.bin).")
                reasons.append("Discovered suspicious execution strings ('powershell', 'Invoke-Expression').")
                reasons.append(f"High Shannon entropy ({f_item['entropy']}) indicates packed binary payloads.")
            else:
                reasons.append("Clean file headers verified.")
                reasons.append(f"Standard entropy distribution ({f_item['entropy']}/8.0).")

            db_threat = ThreatDetection(
                file_id=db_file.id,
                threat_score=f_item["threat_score"],
                classification=f_item["threat_class"],
                entropy=f_item["entropy"],
                has_macros=f_item["quarantined"],
                has_embedded_scripts=f_item["quarantined"],
                has_pdf_javascript=False,
                abnormal_structure=False,
                suspicious_strings_json=json.dumps(["powershell", "Invoke-Expression"] if f_item["quarantined"] else []),
                explainable_reasons_json=json.dumps(reasons),
                recommendation="Quarantine file immediately." if f_item["quarantined"] else "File approved for organizational access."
            )
            db.add(db_threat)

            # ML Prediction
            db_ml = MLPrediction(
                file_id=db_file.id,
                model_name="RandomForest_IsolationForest_Ensemble",
                model_version="2.4.0",
                prediction_label="Malicious" if f_item["quarantined"] else "Clean",
                confidence=0.97 if f_item["quarantined"] else 0.99,
                risk_score=float(f_item["threat_score"]),
                anomaly_score=0.88 if f_item["quarantined"] else 0.05,
                feature_importance_json=json.dumps({"entropy": 0.28, "suspicious_tokens": 0.22, "macro_indicator": 0.18})
            )
            db.add(db_ml)

            # NLP Analysis
            db_nlp = NLPAnalysis(
                file_id=db_file.id,
                sensitivity_classification=f_item["nlp_class"],
                confidence=0.94,
                confidential_terms_count=4 if "Audit" in f_item["name"] else 0,
                email_count=1 if "Audit" in f_item["name"] else 0,
                phone_count=1 if "Audit" in f_item["name"] else 0,
                api_key_count=0,
                detected_entities_json=json.dumps({"emails": ["sarah.cfo@secureai.local"], "phones": ["+1-555-019-2831"]}),
                sample_snippets_json=json.dumps(["Discovered 1 email and financial statements."])
            )
            db.add(db_nlp)

            # Add Blockchain Audit Block
            blockchain_ledger.add_audit_block(
                db=db,
                event_type="FILE_UPLOADED",
                actor_reference=admin_u.email if "Financial" in f_item["name"] else john_u.email,
                file_hash=sha256,
                details={
                    "file_name": f_item["name"],
                    "threat_score": f_item["threat_score"],
                    "classification": f_item["threat_class"],
                    "quarantined": f_item["quarantined"]
                }
            )

        # 6. Seed Realistic Incidents
        incident_1 = Incident(
            incident_number=f"INC-{datetime.datetime.utcnow().strftime('%Y%m%d')}-00104",
            title="Malicious Office Macro Detection: Invoice_Macro_Payment_Processor.docm",
            severity="HIGH",
            category="Malware / Threat Detection",
            status="OPEN",
            affected_user_id=john_u.id,
            risk_score=88,
            evidence_json=json.dumps({"threat_score": 88, "macro": True, "tokens": ["powershell", "Invoke-Expression"]}),
            assigned_analyst="Elena Rostova (SOC Lead)",
            investigation_notes="Automated sandbox quarantined the weaponized Word attachment upon upload. User was notified."
        )
        db.add(incident_1)

        incident_2 = Incident(
            incident_number=f"INC-{datetime.datetime.utcnow().strftime('%Y%m%d')}-00089",
            title="Suspicious Login Sequence: Multiple Failed Attempts from Foreign IP",
            severity="MEDIUM",
            category="Authentication Anomaly",
            status="INVESTIGATING",
            affected_user_id=john_u.id,
            risk_score=65,
            evidence_json=json.dumps({"ip": "194.26.29.11", "attempts": 4, "user_agent": "Python-requests/2.31"}),
            assigned_analyst="Elena Rostova (SOC Lead)",
            investigation_notes="MFA challenge successfully blocked unauthorized credential stuffing."
        )
        db.add(incident_2)

        # 7. Seed Notifications
        notif_1 = Notification(
            user_id=admin_u.id,
            title="Critical Threat Quarantined",
            message="File 'Invoice_Macro_Payment_Processor.docm' was automatically quarantined (Threat Score: 88/100).",
            severity="CRITICAL",
            is_read=False,
            link="/threats"
        )
        notif_2 = Notification(
            user_id=admin_u.id,
            title="Blockchain Audit Block Appended",
            message="Block #4 successfully minted to permissioned ledger.",
            severity="INFO",
            is_read=True,
            link="/blockchain"
        )
        db.add(notif_1)
        db.add(notif_2)

        db.commit()

demo_data_service = DemoDataService()
