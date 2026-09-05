import datetime
import uuid
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float, 
    ForeignKey, Text, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    permissions = Column(Text, nullable=True)  # JSON-serialized list of permission strings
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    users = relationship("User", back_populates="role_rel")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    username = Column(String(60), unique=True, nullable=False, index=True)
    full_name = Column(String(120), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="Employee", nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    is_locked = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(64), nullable=True)
    
    risk_score = Column(Float, default=15.0)  # User baseline risk (0-100)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    role_rel = relationship("Role", back_populates="users")
    files = relationship("File", back_populates="owner", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")
    login_history = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(64), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="sessions")

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_fingerprint = Column(String(64), nullable=False, index=True)
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    is_trusted = Column(Boolean, default=True)
    last_seen_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="devices")

class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    key_hash = Column(String(64), unique=True, nullable=False)
    prefix = Column(String(10), nullable=False)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="api_keys")

class File(Base):
    __tablename__ = "files"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    original_name = Column(String(255), nullable=False, index=True)
    storage_name = Column(String(255), unique=True, nullable=False)  # Internal UUID path
    file_extension = Column(String(20), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
    sha256_hash = Column(String(64), nullable=False, index=True)
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Security & AI Assessment
    threat_score = Column(Integer, default=0)  # 0 to 100
    threat_classification = Column(String(30), default="Safe")  # Safe, Low Risk, Suspicious, High Risk
    nlp_classification = Column(String(30), default="Public")   # Public, Internal, Confidential, Highly Confidential
    is_quarantined = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    integrity_status = Column(String(30), default="VERIFIED")  # VERIFIED, INTEGRITY VIOLATION
    
    current_version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    owner = relationship("User", back_populates="files")
    versions = relationship("FileVersion", back_populates="file", cascade="all, delete-orphan")
    encryption_meta = relationship("EncryptionMetadata", back_populates="file", uselist=False, cascade="all, delete-orphan")
    threat_details = relationship("ThreatDetection", back_populates="file", uselist=False, cascade="all, delete-orphan")
    ml_prediction = relationship("MLPrediction", back_populates="file", uselist=False, cascade="all, delete-orphan")
    nlp_analysis = relationship("NLPAnalysis", back_populates="file", uselist=False, cascade="all, delete-orphan")
    shares = relationship("FileShare", back_populates="file", cascade="all, delete-orphan")
    downloads = relationship("DownloadHistory", back_populates="file", cascade="all, delete-orphan")

class FileVersion(Base):
    __tablename__ = "file_versions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    storage_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    change_summary = Column(String(255), default="Version updated")
    created_by_id = Column(String(36), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    file = relationship("File", back_populates="versions")

class EncryptionMetadata(Base):
    __tablename__ = "encryption_metadata"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), unique=True, nullable=False)
    algorithm = Column(String(30), default="AES-256-GCM", nullable=False)
    nonce_b64 = Column(String(64), nullable=False)
    tag_b64 = Column(String(64), nullable=False)
    encrypted_key_b64 = Column(Text, nullable=False)  # File key wrapped with master key
    key_fingerprint = Column(String(64), nullable=False)
    key_version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    file = relationship("File", back_populates="encryption_meta")

class ThreatDetection(Base):
    __tablename__ = "threat_detections"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), unique=True, nullable=False)
    threat_score = Column(Integer, default=0)
    classification = Column(String(30), default="Safe")
    entropy = Column(Float, default=0.0)
    has_macros = Column(Boolean, default=False)
    has_embedded_scripts = Column(Boolean, default=False)
    has_pdf_javascript = Column(Boolean, default=False)
    abnormal_structure = Column(Boolean, default=False)
    suspicious_strings_json = Column(Text, default="[]")
    explainable_reasons_json = Column(Text, default="[]")
    recommendation = Column(Text, nullable=True)
    scanned_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    file = relationship("File", back_populates="threat_details")

class MLPrediction(Base):
    __tablename__ = "ml_predictions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), unique=True, nullable=False)
    model_name = Column(String(50), default="RandomForest_v2.1")
    model_version = Column(String(20), default="2.1.0")
    prediction_label = Column(String(30), default="Clean")
    confidence = Column(Float, default=0.98)
    risk_score = Column(Float, default=5.0)
    anomaly_score = Column(Float, default=0.04)  # Deep learning / Isolation Forest reconstruction error
    feature_importance_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    file = relationship("File", back_populates="ml_prediction")

class NLPAnalysis(Base):
    __tablename__ = "nlp_analysis"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), unique=True, nullable=False)
    sensitivity_classification = Column(String(30), default="Public")
    confidence = Column(Float, default=0.95)
    confidential_terms_count = Column(Integer, default=0)
    email_count = Column(Integer, default=0)
    phone_count = Column(Integer, default=0)
    api_key_count = Column(Integer, default=0)
    detected_entities_json = Column(Text, default="{}")
    sample_snippets_json = Column(Text, default="[]")
    analyzed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    file = relationship("File", back_populates="nlp_analysis")

class FileShare(Base):
    __tablename__ = "file_shares"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    shared_by_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    share_type = Column(String(20), default="link")  # user, role, organization, link
    target_identifier = Column(String(120), nullable=True)  # email, role name, or org name
    access_token = Column(String(64), unique=True, nullable=False, index=True)
    
    # Permissions
    view_only = Column(Boolean, default=False)
    allow_download = Column(Boolean, default=True)
    download_limit = Column(Integer, default=5)
    download_count = Column(Integer, default=0)
    password_hash = Column(String(255), nullable=True)
    requires_mfa = Column(Boolean, default=False)
    watermark_enabled = Column(Boolean, default=True)
    approval_status = Column(String(20), default="APPROVED")  # PENDING, APPROVED, REJECTED, REVOKED
    
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    file = relationship("File", back_populates="shares")
    shared_by = relationship("User")

class DownloadHistory(Base):
    __tablename__ = "download_history"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), nullable=True)
    share_id = Column(String(36), ForeignKey("file_shares.id", ondelete="SET NULL"), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    integrity_verified = Column(Boolean, default=True)
    watermark_applied = Column(Boolean, default=True)
    downloaded_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    file = relationship("File", back_populates="downloads")

class LoginHistory(Base):
    __tablename__ = "login_history"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    status = Column(String(20), default="SUCCESS")  # SUCCESS, FAILED, LOCKED, MFA_CHALLENGE
    failure_reason = Column(String(100), nullable=True)
    attempted_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="login_history")

class SecurityEvent(Base):
    __tablename__ = "security_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), default="INFO", index=True)  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    actor_id = Column(String(36), nullable=True)
    actor_name = Column(String(120), nullable=True)
    ip_address = Column(String(45), nullable=True)
    target_resource = Column(String(100), nullable=True)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class BlockchainBlock(Base):
    __tablename__ = "blockchain_blocks"
    
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    block_index = Column(Integer, unique=True, nullable=False, index=True)
    timestamp = Column(Float, nullable=False)
    event_type = Column(String(50), nullable=False)
    file_hash = Column(String(64), nullable=True, index=True)
    actor_reference = Column(String(120), nullable=False)
    details_json = Column(Text, nullable=False)
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False, index=True)
    nonce = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    action = Column(String(50), nullable=False, index=True)
    actor_id = Column(String(36), nullable=True)
    actor_name = Column(String(120), nullable=True)
    target_type = Column(String(50), nullable=True)
    target_id = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)
    status = Column(String(20), default="SUCCESS")
    details_json = Column(Text, default="{}")
    hash_signature = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    incident_number = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    severity = Column(String(20), default="MEDIUM", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    category = Column(String(50), default="Threat Detection")
    status = Column(String(20), default="OPEN", index=True)  # OPEN, INVESTIGATING, CONTAINED, RESOLVED, FALSE_POSITIVE
    affected_user_id = Column(String(36), nullable=True)
    affected_file_id = Column(String(36), nullable=True)
    risk_score = Column(Integer, default=50)
    evidence_json = Column(Text, default="{}")
    assigned_analyst = Column(String(120), default="Security SOC Team")
    investigation_notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class SecurityPolicy(Base):
    __tablename__ = "security_policies"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    condition_type = Column(String(50), nullable=False)
    condition_expression = Column(Text, nullable=False)
    action = Column(String(50), nullable=False)  # BLOCK, QUARANTINE, REQUIRE_APPROVAL, ALERT
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="INFO")
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="notifications")
