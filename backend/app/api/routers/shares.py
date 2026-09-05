from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...models.models import File, FileShare, User
from ...schemas.schemas import ShareCreate, ShareResponse, ShareAccessRequest
from ...security.auth import get_current_user
from ...services.sharing_service import sharing_service
from ...services.file_service import file_service

router = APIRouter(prefix="/shares", tags=["Secure File Sharing"])

@router.post("", response_model=ShareResponse)
def create_share_link(
    share_in: ShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate expiring, password-protected, watermarked share link."""
    share = sharing_service.create_share(db, share_in, current_user)
    file_record = db.query(File).filter(File.id == share.file_id).first()
    
    return {
        "id": share.id,
        "file_id": share.file_id,
        "file_name": file_record.original_name if file_record else "Unknown",
        "share_type": share.share_type,
        "target_identifier": share.target_identifier,
        "access_token": share.access_token,
        "share_url": f"/s/{share.access_token}",
        "view_only": share.view_only,
        "allow_download": share.allow_download,
        "download_limit": share.download_limit,
        "download_count": share.download_count,
        "has_password": bool(share.password_hash),
        "requires_mfa": share.requires_mfa,
        "watermark_enabled": share.watermark_enabled,
        "approval_status": share.approval_status,
        "expires_at": share.expires_at,
        "created_at": share.created_at
    }

@router.get("", response_model=List[ShareResponse])
def list_shares(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List active file shares created by or shared with current user."""
    shares = db.query(FileShare).filter(FileShare.shared_by_id == current_user.id).all()
    results = []
    for s in shares:
        f = db.query(File).filter(File.id == s.file_id).first()
        results.append({
            "id": s.id,
            "file_id": s.file_id,
            "file_name": f.original_name if f else "Unknown",
            "share_type": s.share_type,
            "target_identifier": s.target_identifier,
            "access_token": s.access_token,
            "share_url": f"/s/{s.access_token}",
            "view_only": s.view_only,
            "allow_download": s.allow_download,
            "download_limit": s.download_limit,
            "download_count": s.download_count,
            "has_password": bool(s.password_hash),
            "requires_mfa": s.requires_mfa,
            "watermark_enabled": s.watermark_enabled,
            "approval_status": s.approval_status,
            "expires_at": s.expires_at,
            "created_at": s.created_at
        })
    return results

@router.delete("/{share_id}")
def revoke_share(
    share_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke an active share link immediately."""
    sharing_service.revoke_share(db, share_id, current_user)
    return {"message": "Share link revoked successfully."}

@router.get("/public/{token}")
def get_public_share_info(token: str, db: Session = Depends(get_db)):
    """Public query to inspect share metadata before download."""
    share = sharing_service.validate_and_get_share(db, token)
    file_record = db.query(File).filter(File.id == share.file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File associated with this share no longer exists.")
        
    return {
        "share_id": share.id,
        "file_name": file_record.original_name,
        "file_size": file_record.file_size,
        "file_extension": file_record.file_extension,
        "view_only": share.view_only,
        "allow_download": share.allow_download,
        "has_password": bool(share.password_hash),
        "requires_mfa": share.requires_mfa,
        "watermark_enabled": share.watermark_enabled,
        "downloads_remaining": max(0, share.download_limit - share.download_count),
        "expires_at": share.expires_at
    }

@router.post("/public/{token}/download")
def public_download_file(
    token: str,
    body: Optional[ShareAccessRequest] = None,
    db: Session = Depends(get_db)
):
    """Public authenticated download using expiring share token."""
    password = body.password if body else None
    share = sharing_service.validate_and_get_share(db, token, password=password)
    
    if not share.allow_download:
        raise HTTPException(status_code=403, detail="Download not permitted for this view-only share.")
        
    # Increment download count
    share.download_count += 1
    db.commit()
    
    class DummyPublicUser:
        id = None
        email = f"External Recipient ({share.target_identifier or 'Public Link'})"
        role = "Guest"
        
    plaintext, filename, mime = file_service.download_file(
        db=db,
        file_id=share.file_id,
        current_user=DummyPublicUser(),
        share=share,
        apply_watermark=share.watermark_enabled
    )
    
    return Response(
        content=plaintext,
        media_type=mime,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
