import secrets
import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..models.models import File, FileShare, AuditLog
from ..schemas.schemas import ShareCreate
from ..security.auth import get_password_hash, verify_password
from ..blockchain.ledger import blockchain_ledger

class SharingService:
    @classmethod
    def create_share(cls, db: Session, share_in: ShareCreate, current_user) -> FileShare:
        """Create a secure expiring share token with granular permissions."""
        file_record = db.query(File).filter(File.id == share_in.file_id, File.is_deleted == False).first()
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
            
        if file_record.is_quarantined:
            raise HTTPException(status_code=400, detail="Cannot share quarantined file")
            
        # DLP check: if file is Highly Confidential, ensure user has proper authorization
        if file_record.nlp_classification == "Highly Confidential" and current_user.role not in ["Super Admin", "Security Admin", "Manager"]:
            raise HTTPException(
                status_code=403,
                detail="Security Policy DLP Violation: Highly Confidential documents require administrative clearance for external link sharing."
            )
            
        # Generate cryptographically secure access token
        access_token = secrets.token_urlsafe(32)
        
        expires_at = None
        if share_in.expires_in_hours:
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=share_in.expires_in_hours)
            
        pwd_hash = None
        if share_in.password:
            pwd_hash = get_password_hash(share_in.password)
            
        share = FileShare(
            file_id=file_record.id,
            shared_by_id=current_user.id,
            share_type=share_in.share_type,
            target_identifier=share_in.target_identifier,
            access_token=access_token,
            view_only=share_in.view_only,
            allow_download=share_in.allow_download,
            download_limit=share_in.download_limit,
            download_count=0,
            password_hash=pwd_hash,
            requires_mfa=share_in.requires_mfa,
            watermark_enabled=share_in.watermark_enabled,
            approval_status="APPROVED",
            expires_at=expires_at
        )
        db.add(share)
        
        # Blockchain audit
        blockchain_ledger.add_audit_block(
            db=db,
            event_type="FILE_SHARED",
            actor_reference=current_user.email,
            file_hash=file_record.sha256_hash,
            details={
                "share_type": share_in.share_type,
                "target": share_in.target_identifier or "Public Link",
                "expires_at": expires_at.isoformat() if expires_at else None,
                "password_protected": bool(share_in.password),
                "watermark_enabled": share_in.watermark_enabled
            }
        )
        
        db.commit()
        db.refresh(share)
        return share

    @classmethod
    def validate_and_get_share(cls, db: Session, token: str, password: str = None) -> FileShare:
        """Validate share token, expiration, download limit, and password."""
        share = db.query(FileShare).filter(FileShare.access_token == token).first()
        if not share:
            raise HTTPException(status_code=404, detail="Invalid share token.")
            
        if share.approval_status != "APPROVED":
            raise HTTPException(status_code=403, detail=f"Share access is {share.approval_status.lower()}.")
            
        if share.expires_at and share.expires_at < datetime.datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Share link has expired.")
            
        if share.download_count >= share.download_limit:
            raise HTTPException(status_code=403, detail="Download limit for this secure share has been reached.")
            
        if share.password_hash:
            if not password:
                raise HTTPException(status_code=401, detail="This share link is password-protected. Please provide the access password.")
            if not verify_password(password, share.password_hash):
                raise HTTPException(status_code=401, detail="Incorrect share link password.")
                
        return share

    @classmethod
    def revoke_share(cls, db: Session, share_id: str, current_user) -> bool:
        """Revoke an active share link."""
        share = db.query(FileShare).filter(FileShare.id == share_id).first()
        if not share:
            raise HTTPException(status_code=404, detail="Share not found.")
            
        share.approval_status = "REVOKED"
        
        # Blockchain audit
        file_rec = db.query(File).filter(File.id == share.file_id).first()
        blockchain_ledger.add_audit_block(
            db=db,
            event_type="SHARE_REVOKED",
            actor_reference=current_user.email,
            file_hash=file_rec.sha256_hash if file_rec else None,
            details={"share_id": share_id}
        )
        db.commit()
        return True

sharing_service = SharingService()
