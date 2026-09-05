from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth & User Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)
    role: Optional[str] = "Employee"

class UserLogin(BaseModel):
    username_or_email: str
    password: str
    remember_me: Optional[bool] = False
    device_fingerprint: Optional[str] = None

class MFAVerifyRequest(BaseModel):
    user_id: str
    code: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    requires_mfa: bool = False
    user: Optional[Dict[str, Any]] = None

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    is_locked: bool
    mfa_enabled: bool
    risk_score: float
    last_login_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SessionResponse(BaseModel):
    id: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    is_active: bool
    expires_at: datetime
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- File Schemas ---
class FileResponse(BaseModel):
    id: str
    original_name: str
    file_extension: str
    mime_type: str
    file_size: int
    sha256_hash: str
    owner_id: str
    threat_score: int
    threat_classification: str
    nlp_classification: str
    is_quarantined: bool
    integrity_status: str
    current_version: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ThreatDetailSchema(BaseModel):
    threat_score: int
    classification: str
    entropy: float
    has_macros: bool
    has_embedded_scripts: bool
    has_pdf_javascript: bool
    abnormal_structure: bool
    suspicious_strings: List[str]
    explainable_reasons: List[str]
    recommendation: Optional[str]

class MLDetailSchema(BaseModel):
    model_name: str
    model_version: str
    prediction_label: str
    confidence: float
    risk_score: float
    anomaly_score: float
    feature_importance: Dict[str, float]

class NLPDetailSchema(BaseModel):
    sensitivity_classification: str
    confidence: float
    confidential_terms_count: int
    email_count: int
    phone_count: int
    api_key_count: int
    detected_entities: Dict[str, Any]
    sample_snippets: List[str]

class FileDetailResponse(BaseModel):
    file: FileResponse
    encryption_algorithm: str
    key_fingerprint: str
    threat_analysis: Optional[ThreatDetailSchema] = None
    ml_prediction: Optional[MLDetailSchema] = None
    nlp_analysis: Optional[NLPDetailSchema] = None
    blockchain_block_index: Optional[int] = None
    blockchain_block_hash: Optional[str] = None
    versions_count: int
    shares_count: int
    downloads_count: int

# --- Share Schemas ---
class ShareCreate(BaseModel):
    file_id: str
    share_type: str = "link"  # user, role, organization, link
    target_identifier: Optional[str] = None
    view_only: bool = False
    allow_download: bool = True
    download_limit: int = 5
    expires_in_hours: Optional[int] = 24
    password: Optional[str] = None
    requires_mfa: bool = False
    watermark_enabled: bool = True

class ShareResponse(BaseModel):
    id: str
    file_id: str
    file_name: Optional[str] = None
    share_type: str
    target_identifier: Optional[str]
    access_token: str
    share_url: str
    view_only: bool
    allow_download: bool
    download_limit: int
    download_count: int
    has_password: bool
    requires_mfa: bool
    watermark_enabled: bool
    approval_status: str
    expires_at: Optional[datetime]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ShareAccessRequest(BaseModel):
    token: str
    password: Optional[str] = None
    mfa_code: Optional[str] = None

# --- Blockchain Schemas ---
class BlockResponse(BaseModel):
    id: int
    block_index: int
    timestamp: float
    event_type: str
    file_hash: Optional[str]
    actor_reference: str
    details: Dict[str, Any]
    previous_hash: str
    current_hash: str
    nonce: int
    created_at: datetime

class BlockchainVerifyResponse(BaseModel):
    is_valid: bool
    total_blocks: int
    verified_blocks: int
    tampered_block_index: Optional[int] = None
    message: str
    checked_at: datetime

class BlockchainTamperRequest(BaseModel):
    block_index: int
    tampered_event: Optional[str] = "TAMPERED_TRANSACTION_PAYLOAD"

# --- SOC & Analytics Schemas ---
class SecurityScoreBreakdown(BaseModel):
    overall_score: int
    authentication_score: int
    threat_detection_score: int
    file_integrity_score: int
    dlp_score: int
    blockchain_score: int
    ueba_score: int
    recommendations: List[str]
    status_level: str  # SECURE, GOOD, ELEVATED RISK, CRITICAL RISK

class SOCMetricsResponse(BaseModel):
    total_files: int
    secure_files: int
    threats_detected: int
    suspicious_files: int
    active_shares: int
    downloads_today: int
    blocked_requests: int
    security_score: int
    security_breakdown: SecurityScoreBreakdown
    charts: Dict[str, Any]

class IncidentCreate(BaseModel):
    title: str
    severity: str = "MEDIUM"
    category: str = "Policy Violation"
    affected_user_id: Optional[str] = None
    affected_file_id: Optional[str] = None
    risk_score: int = 60
    assigned_analyst: Optional[str] = "SOC Analyst 1"
    investigation_notes: Optional[str] = ""

class IncidentResponse(BaseModel):
    id: str
    incident_number: str
    title: str
    severity: str
    category: str
    status: str
    affected_user_id: Optional[str]
    affected_file_id: Optional[str]
    risk_score: int
    evidence: Dict[str, Any]
    assigned_analyst: str
    investigation_notes: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assigned_analyst: Optional[str] = None
    investigation_notes: Optional[str] = None

class PolicyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    condition_type: str
    condition_expression: str
    action: str
    is_active: bool = True

class PolicyResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    condition_type: str
    condition_expression: str
    action: str
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    severity: str
    is_read: bool
    link: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
