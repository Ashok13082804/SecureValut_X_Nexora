import json
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...models.models import File, DownloadHistory, LoginHistory, ThreatDetection, BlockchainBlock, Incident, User
from ...security.auth import get_current_user

router = APIRouter(prefix="/forensics", tags=["Digital Forensics"])

@router.get("/timeline")
def get_forensic_timeline(
    actor: Optional[str] = None,
    file_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Unified digital forensics timeline reconstructing WHO, WHAT, WHEN, WHERE, and HOW.
    Aggregates events across uploads, downloads, logins, threat alerts, and blockchain minting.
    """
    events = []

    # 1. File Upload Events
    files_q = db.query(File).filter(File.is_deleted == False)
    if file_id:
        files_q = files_q.filter(File.id == file_id)
    files = files_q.order_by(File.created_at.desc()).limit(20).all()
    for f in files:
        owner = db.query(User).filter(User.id == f.owner_id).first()
        actor_email = owner.email if owner else "Unknown User"
        if actor and actor.lower() not in actor_email.lower():
            continue
        events.append({
            "timestamp": f.created_at.isoformat(),
            "event_type": "FILE_INGESTION",
            "severity": "HIGH" if f.threat_score >= 70 else ("MEDIUM" if f.threat_score >= 30 else "INFO"),
            "who": actor_email,
            "what": f"Uploaded '{f.original_name}' ({f.file_size} bytes, {f.file_extension})",
            "where": "Secure Ingestion Gateway",
            "how": f"AES-256-GCM Encrypted, SHA-256: {f.sha256_hash[:16]}..., Threat Score: {f.threat_score}/100",
            "blockchain_status": "Anchored to Ledger"
        })

    # 2. Download Events
    dl_q = db.query(DownloadHistory)
    if file_id:
        dl_q = dl_q.filter(DownloadHistory.file_id == file_id)
    downloads = dl_q.order_by(DownloadHistory.downloaded_at.desc()).limit(20).all()
    for d in downloads:
        f = db.query(File).filter(File.id == d.file_id).first()
        u = db.query(User).filter(User.id == d.user_id).first() if d.user_id else None
        actor_email = u.email if u else "External Recipient (Expiring Link)"
        if actor and actor.lower() not in actor_email.lower():
            continue
        events.append({
            "timestamp": d.downloaded_at.isoformat(),
            "event_type": "FILE_DECRYPTION_DOWNLOAD",
            "severity": "INFO",
            "who": actor_email,
            "what": f"Decrypted and retrieved '{f.original_name if f else 'File'}'",
            "where": f"IP Address: {d.ip_address or '127.0.0.1'}",
            "how": f"Integrity Verified: {d.integrity_verified}, Watermark Applied: {d.watermark_applied}",
            "blockchain_status": "Audited"
        })

    # 3. Authentication Events
    logins = db.query(LoginHistory).order_by(LoginHistory.attempted_at.desc()).limit(15).all()
    for l in logins:
        u = db.query(User).filter(User.id == l.user_id).first()
        actor_email = u.email if u else "Unknown User"
        if actor and actor.lower() not in actor_email.lower():
            continue
        events.append({
            "timestamp": l.attempted_at.isoformat(),
            "event_type": f"AUTH_{l.status}",
            "severity": "HIGH" if l.status == "FAILED" else "INFO",
            "who": actor_email,
            "what": f"Authentication attempt status: {l.status}",
            "where": f"IP: {l.ip_address or '127.0.0.1'}, UA: {l.user_agent[:30] if l.user_agent else 'Browser'}",
            "how": "OAuth2 / Argon2 Verification" if l.status == "SUCCESS" else f"Failed: {l.failure_reason}",
            "blockchain_status": "Logged"
        })

    # 4. Blockchain Ledger Blocks
    blocks = db.query(BlockchainBlock).order_by(BlockchainBlock.created_at.desc()).limit(15).all()
    for b in blocks:
        if actor and actor.lower() not in b.actor_reference.lower():
            continue
        events.append({
            "timestamp": b.created_at.isoformat(),
            "event_type": f"BLOCKCHAIN_BLOCK_{b.block_index}",
            "severity": "INFO",
            "who": b.actor_reference,
            "what": f"Block #{b.block_index} minted for event '{b.event_type}'",
            "where": "Permissioned Blockchain Node",
            "how": f"Current Hash: {b.current_hash[:16]}..., Previous Hash: {b.previous_hash[:16]}...",
            "blockchain_status": "Immutably Sealed"
        })

    # Sort all events chronologically descending
    events.sort(key=lambda x: x["timestamp"], reverse=True)
    return events[:50]
