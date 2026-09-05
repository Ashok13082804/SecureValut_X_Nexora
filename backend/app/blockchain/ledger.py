import time
import json
import hashlib
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models.models import BlockchainBlock

class BlockchainLedger:
    @staticmethod
    def calculate_block_hash(
        block_index: int,
        timestamp: float,
        event_type: str,
        file_hash: Optional[str],
        actor_reference: str,
        details_json: str,
        previous_hash: str,
        nonce: int = 0
    ) -> str:
        """Calculate canonical SHA-256 hash of block contents."""
        header = f"{block_index}:{timestamp}:{event_type}:{file_hash or ''}:{actor_reference}:{details_json}:{previous_hash}:{nonce}"
        return hashlib.sha256(header.encode('utf-8')).hexdigest()

    @classmethod
    def ensure_genesis_block(cls, db: Session) -> BlockchainBlock:
        """Create genesis block if ledger is empty."""
        genesis = db.query(BlockchainBlock).filter(BlockchainBlock.block_index == 0).first()
        if not genesis:
            ts = 1756000000.0  # Stable baseline timestamp
            event_type = "GENESIS_BLOCK"
            actor = "SYSTEM_INITIALIZATION"
            details = json.dumps({"note": "SecureAI Vault Permissioned Audit Ledger Genesis Block", "consensus": "Proof-of-Integrity"})
            prev_hash = "0" * 64
            curr_hash = cls.calculate_block_hash(0, ts, event_type, None, actor, details, prev_hash, 0)
            
            genesis = BlockchainBlock(
                block_index=0,
                timestamp=ts,
                event_type=event_type,
                file_hash=None,
                actor_reference=actor,
                details_json=details,
                previous_hash=prev_hash,
                current_hash=curr_hash,
                nonce=0
            )
            db.add(genesis)
            db.commit()
            db.refresh(genesis)
        return genesis

    @classmethod
    def add_audit_block(
        cls,
        db: Session,
        event_type: str,
        actor_reference: str,
        file_hash: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> BlockchainBlock:
        """Append a new tamper-evident audit record to the permissioned blockchain."""
        cls.ensure_genesis_block(db)
        
        # Get latest block
        latest_block = db.query(BlockchainBlock).order_by(BlockchainBlock.block_index.desc()).first()
        new_index = latest_block.block_index + 1
        previous_hash = latest_block.current_hash
        timestamp = time.time()
        details_str = json.dumps(details or {}, sort_keys=True)
        
        current_hash = cls.calculate_block_hash(
            new_index, timestamp, event_type, file_hash, actor_reference, details_str, previous_hash, 0
        )
        
        block = BlockchainBlock(
            block_index=new_index,
            timestamp=timestamp,
            event_type=event_type,
            file_hash=file_hash,
            actor_reference=actor_reference,
            details_json=details_str,
            previous_hash=previous_hash,
            current_hash=current_hash,
            nonce=0
        )
        db.add(block)
        db.commit()
        db.refresh(block)
        return block

    @classmethod
    def verify_ledger_integrity(cls, db: Session) -> Dict[str, Any]:
        """
        Validate all blocks from genesis to tip.
        Verifies:
        1. Current hash matches SHA-256 calculation of block fields.
        2. Previous hash matches prior block's current hash.
        """
        blocks = db.query(BlockchainBlock).order_by(BlockchainBlock.block_index.asc()).all()
        if not blocks:
            return {
                "is_valid": True,
                "total_blocks": 0,
                "verified_blocks": 0,
                "tampered_block_index": None,
                "message": "Ledger is clean (0 blocks)."
            }
            
        for i, block in enumerate(blocks):
            # Check recalculation of block hash
            expected_hash = cls.calculate_block_hash(
                block.block_index,
                block.timestamp,
                block.event_type,
                block.file_hash,
                block.actor_reference,
                block.details_json,
                block.previous_hash,
                block.nonce
            )
            if expected_hash != block.current_hash:
                return {
                    "is_valid": False,
                    "total_blocks": len(blocks),
                    "verified_blocks": i,
                    "tampered_block_index": block.block_index,
                    "message": f"CRITICAL: Cryptographic integrity failure at Block #{block.block_index}. Hash mismatch detected (Stored: {block.current_hash[:12]}..., Computed: {expected_hash[:12]}...)."
                }
                
            # Check chaining
            if i > 0:
                prev_block = blocks[i - 1]
                if block.previous_hash != prev_block.current_hash:
                    return {
                        "is_valid": False,
                        "total_blocks": len(blocks),
                        "verified_blocks": i,
                        "tampered_block_index": block.block_index,
                        "message": f"CRITICAL: Chaining broken between Block #{prev_block.block_index} and #{block.block_index}. Previous hash mismatch."
                    }
                    
        return {
            "is_valid": True,
            "total_blocks": len(blocks),
            "verified_blocks": len(blocks),
            "tampered_block_index": None,
            "message": f"All {len(blocks)} blocks successfully verified. Full cryptographic audit trail is intact and immutable."
        }

    @classmethod
    def simulate_tampering(cls, db: Session, block_index: int) -> bool:
        """Deliberately alter block data without updating hash to showcase tamper detection."""
        block = db.query(BlockchainBlock).filter(BlockchainBlock.block_index == block_index).first()
        if not block:
            return False
        details = json.loads(block.details_json)
        details["FORGED_FLAG"] = True
        details["TAMPERED_AT"] = time.time()
        details["ORIGINAL_EVENT"] = block.event_type
        block.event_type = "UNAUTHORIZED_ALTERATION"
        block.details_json = json.dumps(details)
        db.commit()
        return True

    @classmethod
    def repair_ledger(cls, db: Session) -> bool:
        """Re-hash blocks sequentially from genesis to re-establish a valid chain."""
        blocks = db.query(BlockchainBlock).order_by(BlockchainBlock.block_index.asc()).all()
        for i, block in enumerate(blocks):
            if i == 0:
                prev_hash = "0" * 64
            else:
                prev_hash = blocks[i - 1].current_hash
            block.previous_hash = prev_hash
            block.current_hash = cls.calculate_block_hash(
                block.block_index,
                block.timestamp,
                block.event_type,
                block.file_hash,
                block.actor_reference,
                block.details_json,
                block.previous_hash,
                block.nonce
            )
        db.commit()
        return True

blockchain_ledger = BlockchainLedger()
