from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.models.database import Base
from backend.app.blockchain.ledger import blockchain_ledger

def test_blockchain_mint_and_verify():
    # In-memory test db
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(bind=test_engine)
    db = TestingSessionLocal()
    
    try:
        # Genesis block
        genesis = blockchain_ledger.ensure_genesis_block(db)
        assert genesis.block_index == 0
        assert genesis.event_type == "GENESIS_BLOCK"
        
        # Add audit block
        block1 = blockchain_ledger.add_audit_block(
            db=db,
            event_type="FILE_UPLOADED",
            actor_reference="auditor@test.com",
            file_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            details={"file_name": "contract.pdf"}
        )
        assert block1.block_index == 1
        assert block1.previous_hash == genesis.current_hash
        
        # Verify valid chain
        verify_res = blockchain_ledger.verify_ledger_integrity(db)
        assert verify_res["is_valid"] is True
        assert verify_res["total_blocks"] == 2
        
        # Simulate tampering
        blockchain_ledger.simulate_tampering(db, 1)
        tamper_res = blockchain_ledger.verify_ledger_integrity(db)
        assert tamper_res["is_valid"] is False
        assert tamper_res["tampered_block_index"] == 1
        
        # Repair chain
        blockchain_ledger.repair_ledger(db)
        repaired_res = blockchain_ledger.verify_ledger_integrity(db)
        assert repaired_res["is_valid"] is True
    finally:
        db.close()
