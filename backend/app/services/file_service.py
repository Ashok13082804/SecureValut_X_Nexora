import os
import uuid
import json
import datetime
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from ..config.settings import settings
from ..models.models import (
    File, FileVersion, EncryptionMetadata, ThreatDetection,
    MLPrediction, NLPAnalysis, AuditLog, SecurityEvent, DownloadHistory, Incident
)
from ..security.crypto import crypto_service
from ..security.watermark import watermark_service
from ..ai.threat_analyzer import threat_analyzer
from ..ml.classifier import ml_classifier
from ..nlp.dlp_analyzer import dlp_analyzer
from ..blockchain.ledger import blockchain_ledger

class FileService:
    @staticmethod
    def validate_file_metadata(filename: str, size: int):
        """Perform validation on extension and size."""
        if not filename or '.' not in filename:
            raise HTTPException(status_code=400, detail="Invalid filename: must include a valid file extension.")
        ext = filename.split('.')[-1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File extension '.{ext}' is prohibited by organization security policy."
            )
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if size > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum permitted threshold of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

    @classmethod
    async def upload_file(cls, db: Session, upload_file: UploadFile, current_user) -> File:
        """
        Execute full 9-stage pipeline:
        Validate -> SHA-256 -> Static Scan -> ML Scan -> NLP Scan -> Risk Fusion -> AES-256-GCM Encrypt -> Store -> Blockchain Record
        """
        filename = os.path.basename(upload_file.filename)
        content = await upload_file.read()
        file_size = len(content)
        ext = filename.split('.')[-1].lower()
        mime_type = upload_file.content_type or "application/octet-stream"
        
        # 1. Validation
        cls.validate_file_metadata(filename, file_size)
        
        # 2. SHA-256 Pre-encryption Hash
        original_hash = crypto_service.calculate_sha256(content)
        
        # 3. Static Threat Scan
        threat_result = threat_analyzer.analyze_file(filename, content, mime_type)
        
        # 4. Machine Learning & Anomaly Scan
        ml_result = ml_classifier.predict(filename, content)
        
        # 5. NLP & DLP Scan
        nlp_result = dlp_analyzer.analyze_content(filename, content)
        
        # 6. Risk Fusion Calculation
        # Weighted combination: 45% Heuristics + 35% ML Model + 20% DLP sensitivity
        dlp_risk_weight = 30 if nlp_result["sensitivity_classification"] in ["Confidential", "Highly Confidential"] else 5
        fused_score = int(
            (0.45 * threat_result["threat_score"]) +
            (0.35 * ml_result["risk_score"]) +
            (0.20 * dlp_risk_weight)
        )
        fused_score = min(max(fused_score, 0), 100)
        
        # Determine quarantine
        is_quarantined = (
            threat_result["threat_score"] >= 70 or
            ml_result["prediction_label"] == "Malicious" or
            threat_result["has_macros"] or
            threat_result["has_pdf_javascript"]
        )
        
        # 7. AES-256-GCM Authenticated Encryption
        enc_result = crypto_service.encrypt_file_data(content)
        
        # 8. Store encrypted payload to disk with isolated unique UUID
        storage_uuid = f"{uuid.uuid4().hex}_{filename}"
        storage_file_name = f"{storage_uuid}.enc"
        storage_path = os.path.join(settings.STORAGE_PATH, storage_file_name)
        with open(storage_path, "wb") as f:
            f.write(enc_result["ciphertext"])
            
        # 9. Create Blockchain Audit Block
        block = blockchain_ledger.add_audit_block(
            db=db,
            event_type="FILE_UPLOADED",
            actor_reference=current_user.email,
            file_hash=original_hash,
            details={
                "original_filename": filename,
                "file_size": file_size,
                "threat_score": fused_score,
                "classification": threat_result["classification"],
                "sensitivity": nlp_result["sensitivity_classification"],
                "quarantined": is_quarantined
            }
        )
        
        # 10. Persist Database Records
        db_file = File(
            original_name=filename,
            storage_name=storage_file_name,
            file_extension=ext,
            mime_type=mime_type,
            file_size=file_size,
            sha256_hash=original_hash,
            owner_id=current_user.id,
            threat_score=fused_score,
            threat_classification=threat_result["classification"],
            nlp_classification=nlp_result["sensitivity_classification"],
            is_quarantined=is_quarantined,
            integrity_status="VERIFIED",
            current_version=1
        )
        db.add(db_file)
        db.flush()
        
        # Version 1 record
        db_version = FileVersion(
            file_id=db_file.id,
            version_number=1,
            sha256_hash=original_hash,
            storage_name=storage_file_name,
            file_size=file_size,
            change_summary="Initial secure upload",
            created_by_id=current_user.id
        )
        db.add(db_version)
        
        # Encryption metadata
        db_enc = EncryptionMetadata(
            file_id=db_file.id,
            algorithm=enc_result["algorithm"],
            nonce_b64=enc_result["nonce_b64"],
            tag_b64=enc_result["tag_b64"],
            encrypted_key_b64=enc_result["encrypted_key_b64"],
            key_fingerprint=enc_result["key_fingerprint"],
            key_version=1
        )
        db.add(db_enc)
        
        # Threat Details
        db_threat = ThreatDetection(
            file_id=db_file.id,
            threat_score=fused_score,
            classification=threat_result["classification"],
            entropy=threat_result["entropy"],
            has_macros=threat_result["has_macros"],
            has_embedded_scripts=threat_result["has_embedded_scripts"],
            has_pdf_javascript=threat_result["has_pdf_javascript"],
            abnormal_structure=threat_result["abnormal_structure"],
            suspicious_strings_json=json.dumps(threat_result["suspicious_strings"]),
            explainable_reasons_json=json.dumps(threat_result["explainable_reasons"]),
            recommendation=threat_result["recommendation"]
        )
        db.add(db_threat)
        
        # ML Prediction
        db_ml = MLPrediction(
            file_id=db_file.id,
            model_name=ml_result["model_name"],
            model_version=ml_result["model_version"],
            prediction_label=ml_result["prediction_label"],
            confidence=ml_result["confidence"],
            risk_score=ml_result["risk_score"],
            anomaly_score=ml_result["anomaly_score"],
            feature_importance_json=json.dumps(ml_result["feature_importance"])
        )
        db.add(db_ml)
        
        # NLP Analysis
        db_nlp = NLPAnalysis(
            file_id=db_file.id,
            sensitivity_classification=nlp_result["sensitivity_classification"],
            confidence=nlp_result["confidence"],
            confidential_terms_count=nlp_result["confidential_terms_count"],
            email_count=nlp_result["email_count"],
            phone_count=nlp_result["phone_count"],
            api_key_count=nlp_result["api_key_count"],
            detected_entities_json=json.dumps(nlp_result["detected_entities"]),
            sample_snippets_json=json.dumps(nlp_result["sample_snippets"])
        )
        db.add(db_nlp)
        
        # Audit Log
        db_audit = AuditLog(
            action="FILE_UPLOAD",
            actor_id=current_user.id,
            actor_name=current_user.full_name,
            target_type="FILE",
            target_id=db_file.id,
            status="SUCCESS",
            details_json=json.dumps({
                "filename": filename,
                "file_size": file_size,
                "sha256": original_hash,
                "threat_score": fused_score,
                "blockchain_block": block.block_index
            }),
            hash_signature=crypto_service.calculate_sha256(f"{current_user.id}:FILE_UPLOAD:{original_hash}".encode())
        )
        db.add(db_audit)
        
        # If threat detected, create Incident automatically
        if is_quarantined or fused_score > 60:
            incident = Incident(
                incident_number=f"INC-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
                title=f"Suspicious File Upload: {filename}",
                severity="HIGH" if fused_score >= 75 else "MEDIUM",
                category="Malware / Threat Detection",
                status="OPEN",
                affected_user_id=current_user.id,
                affected_file_id=db_file.id,
                risk_score=fused_score,
                evidence_json=json.dumps({
                    "threat_score": fused_score,
                    "entropy": threat_result["entropy"],
                    "reasons": threat_result["explainable_reasons"],
                    "ml_confidence": ml_result["confidence"]
                }),
                assigned_analyst="Security SOC Analyst",
                investigation_notes="Automated alert triggered by SecureAI Vault threat inspection engine."
            )
            db.add(incident)
            
        db.commit()
        db.refresh(db_file)
        return db_file

    @classmethod
    def download_file(
        cls,
        db: Session,
        file_id: str,
        current_user,
        share=None,
        apply_watermark: bool = False
    ) -> tuple[bytes, str, str]:
        """
        Decrypt file, verify cryptographic SHA-256 integrity, apply watermark, and record download.
        Returns: (plaintext_bytes, filename, mime_type)
        """
        file_record = db.query(File).filter(File.id == file_id, File.is_deleted == False).first()
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found.")
            
        if file_record.is_quarantined and getattr(current_user, "role", "") != "Super Admin":
            raise HTTPException(
                status_code=403,
                detail="Access denied: File is under administrative quarantine due to security threats."
            )
            
        enc_meta = db.query(EncryptionMetadata).filter(EncryptionMetadata.file_id == file_id).first()
        if not enc_meta:
            raise HTTPException(status_code=500, detail="Encryption metadata missing for target file.")
            
        storage_path = os.path.join(settings.STORAGE_PATH, file_record.storage_name)
        if not os.path.exists(storage_path):
            raise HTTPException(status_code=404, detail="Encrypted file asset missing on disk storage.")
            
        with open(storage_path, "rb") as f:
            ciphertext = f.read()
            
        # Decrypt and verify integrity
        try:
            plaintext, is_valid = crypto_service.decrypt_file_data(
                ciphertext=ciphertext,
                nonce_b64=enc_meta.nonce_b64,
                tag_b64=enc_meta.tag_b64,
                wrapped_key_b64=enc_meta.encrypted_key_b64,
                expected_sha256=file_record.sha256_hash
            )
        except Exception as e:
            # Cryptographic MAC failure
            file_record.integrity_status = "INTEGRITY VIOLATION"
            db.commit()
            
            # Log critical alert
            blockchain_ledger.add_audit_block(
                db=db,
                event_type="INTEGRITY_VIOLATION",
                actor_reference=getattr(current_user, "email", "ANONYMOUS"),
                file_hash=file_record.sha256_hash,
                details={"file_id": file_id, "error": "Decryption MAC tag validation failure"}
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="CRITICAL SECURITY ALERT: File integrity violation! Cryptographic tag mismatch."
            )
            
        if not is_valid:
            file_record.integrity_status = "INTEGRITY VIOLATION"
            db.commit()
            
            # Log critical alert
            blockchain_ledger.add_audit_block(
                db=db,
                event_type="INTEGRITY_VIOLATION",
                actor_reference=getattr(current_user, "email", "ANONYMOUS"),
                file_hash=file_record.sha256_hash,
                details={"file_id": file_id, "error": "SHA-256 hash mismatch after decryption"}
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="CRITICAL SECURITY ALERT: File integrity violation! SHA-256 does not match original."
            )
            
        # Check if watermarking should be applied
        recipient_str = getattr(current_user, "email", "Authorized Recipient")
        watermark_flag = apply_watermark or (share and share.watermark_enabled) or (file_record.nlp_classification in ["Confidential", "Highly Confidential"])
        
        final_bytes = plaintext
        if watermark_flag:
            final_bytes = watermark_service.watermark_file(plaintext, file_record.file_extension, recipient_str)
            
        # Log download history
        dl_history = DownloadHistory(
            file_id=file_id,
            user_id=getattr(current_user, "id", None),
            share_id=share.id if share else None,
            ip_address="127.0.0.1",
            user_agent="SecureAI Client",
            integrity_verified=True,
            watermark_applied=watermark_flag
        )
        db.add(dl_history)
        
        # Log blockchain audit
        blockchain_ledger.add_audit_block(
            db=db,
            event_type="FILE_DOWNLOADED",
            actor_reference=recipient_str,
            file_hash=file_record.sha256_hash,
            details={
                "file_name": file_record.original_name,
                "watermark_applied": watermark_flag,
                "share_id": share.id if share else None
            }
        )
        
        db.commit()
        return final_bytes, file_record.original_name, file_record.mime_type

file_service = FileService()
