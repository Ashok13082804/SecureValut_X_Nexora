import json
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...models.models import BlockchainBlock
from ...schemas.schemas import BlockResponse, BlockchainVerifyResponse, BlockchainTamperRequest
from ...security.auth import get_current_user
from ...blockchain.ledger import blockchain_ledger

router = APIRouter(prefix="/blockchain", tags=["Blockchain Audit Ledger"])

@router.get("/blocks", response_model=List[BlockResponse])
def list_blocks(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Retrieve full immutable chronological audit ledger."""
    blockchain_ledger.ensure_genesis_block(db)
    blocks = db.query(BlockchainBlock).order_by(BlockchainBlock.block_index.asc()).all()
    results = []
    for b in blocks:
        results.append({
            "id": b.id,
            "block_index": b.block_index,
            "timestamp": b.timestamp,
            "event_type": b.event_type,
            "file_hash": b.file_hash,
            "actor_reference": b.actor_reference,
            "details": json.loads(b.details_json or "{}"),
            "previous_hash": b.previous_hash,
            "current_hash": b.current_hash,
            "nonce": b.nonce,
            "created_at": b.created_at
        })
    return results

@router.get("/verify", response_model=BlockchainVerifyResponse)
def verify_blockchain(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Verify cryptographic integrity of all blocks from Genesis to Tip."""
    result = blockchain_ledger.verify_ledger_integrity(db)
    return {
        "is_valid": result["is_valid"],
        "total_blocks": result["total_blocks"],
        "verified_blocks": result["verified_blocks"],
        "tampered_block_index": result["tampered_block_index"],
        "message": result["message"],
        "checked_at": datetime.datetime.utcnow()
    }

@router.post("/tamper")
def simulate_tampering(payload: BlockchainTamperRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Demonstration Hook: Deliberately alter block data to test real-time tamper detection."""
    success = blockchain_ledger.simulate_tampering(db, payload.block_index)
    if not success:
        raise HTTPException(status_code=404, detail=f"Block #{payload.block_index} not found.")
    return {"message": f"Block #{payload.block_index} has been altered without updating hash signature. Run verify to observe detection."}

@router.post("/repair")
def repair_blockchain(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Recalculate hash linkage to restore ledger integrity."""
    blockchain_ledger.repair_ledger(db)
    return {"message": "Blockchain ledger integrity restored and re-hashed."}
