# SecureAI Vault – REST API Technical Reference
> **Base URL:** `http://localhost:8000/api/v1`  
> **Interactive OpenAPI UI:** `http://localhost:8000/api/v1/docs`  
> **ReDoc UI:** `http://localhost:8000/api/v1/redoc`

---

## Authentication Header
All protected endpoints require a valid JWT Bearer access token in the HTTP Authorization header:
```http
Authorization: Bearer <access_token>
```

---

## 1. Authentication & Session Endpoints (`/auth`)

### `POST /auth/register`
Register a new corporate identity.
- **Request Body**:
  ```json
  {
    "email": "analyst@secureai.local",
    "username": "analyst",
    "full_name": "Security Analyst",
    "password": "Password@123!",
    "role": "Security Admin"
  }
  ```
- **Response**: `200 OK` (User profile object).

### `POST /auth/login`
Authenticate using username or email and password.
- **Request Body**:
  ```json
  {
    "username_or_email": "admin@secureai.local",
    "password": "Password@123!"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 86400,
    "requires_mfa": false,
    "user": {
      "id": "7bf3b680-...",
      "email": "admin@secureai.local",
      "full_name": "System Administrator",
      "role": "Super Admin"
    }
  }
  ```

### `POST /auth/verify-mfa`
Validate a 6-digit TOTP authenticator code.
- **Request Body**: `{"user_id": "...", "code": "123456"}`

### `GET /auth/me`
Retrieve profile of currently authenticated user.

---

## 2. File Repository & Ingestion (`/files`)

### `POST /files/upload`
Execute full 8-stage secure upload pipeline.
- **Content-Type**: `multipart/form-data`
- **Form Data**: `file` (Binary payload)
- **Response**:
  ```json
  {
    "id": "3f9c...",
    "original_name": "Audit_Report.pdf",
    "file_extension": "pdf",
    "mime_type": "application/pdf",
    "file_size": 24890,
    "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "threat_score": 12,
    "threat_classification": "Safe",
    "nlp_classification": "Confidential",
    "is_quarantined": false,
    "integrity_status": "VERIFIED"
  }
  ```

### `GET /files`
List accessible files with query filters (`query`, `classification`, `quarantined`).

### `GET /files/{id}`
Retrieve 7-tab deep inspection payload (Overview, Threat Heuristics, ML Inference, NLP DLP, Versions, Access History, Blockchain Anchor).

### `GET /files/{id}/download?watermark=true`
Decrypt ciphertext, verify SHA-256 integrity, apply dynamic watermark, and stream payload.

### `POST /files/{id}/quarantine?quarantine=true`
Administratively quarantine or release a file (Requires Super Admin or Security Admin).

---

## 3. Secure Expiring Shares (`/shares`)

### `POST /shares`
Generate expiring, password-protected, watermarked share link.
- **Request Body**:
  ```json
  {
    "file_id": "3f9c...",
    "share_type": "link",
    "download_limit": 5,
    "expires_in_hours": 24,
    "password": "ShareSecret2026!",
    "watermark_enabled": true,
    "view_only": false
  }
  ```

### `GET /shares/public/{token}`
Inspect public share metadata and download limits.

### `POST /shares/public/{token}/download`
Authenticate password/MFA and download decrypted watermarked file.

---

## 4. Blockchain Audit Ledger (`/blockchain`)

### `GET /blockchain/blocks`
List all sequential SHA-256 blocks from Genesis to Tip.

### `GET /blockchain/verify`
Traverse cryptographic hash links and verify chain integrity.
- **Response**:
  ```json
  {
    "is_valid": true,
    "total_blocks": 6,
    "verified_blocks": 6,
    "tampered_block_index": null,
    "message": "All 6 blocks successfully verified. Full cryptographic audit trail is intact."
  }
  ```

### `POST /blockchain/tamper`
Deliberately forge a block payload to test real-time tamper detection in demonstrations.

### `POST /blockchain/repair`
Re-mint and re-link blocks to restore blockchain validity.

---

## 5. SOC Analytics & UEBA (`/analytics`, `/ueba`)

### `GET /analytics/metrics`
Retrieve command center KPIs, Organization Security Score ($92/100$), and chart series.

### `GET /ueba/users`
List user risk profiles and baseline download velocity anomalies.

---

## 6. Incidents & Forensics (`/incidents`, `/forensics`)

### `GET /incidents`
List security incident tickets by status (`OPEN`, `INVESTIGATING`, `CONTAINED`, `RESOLVED`).

### `PATCH /incidents/{id}`
Update status, assigned analyst, or add forensic notes.

### `GET /forensics/timeline`
Retrieve reconstructed chronological timeline (WHO, WHAT, WHEN, WHERE, HOW).

---

## 7. Report Export Endpoints (`/reports`)

### `GET /reports/export/pdf`
Generate and stream a formal Executive SOC Audit Report PDF.

### `GET /reports/export/json`
Stream raw SIEM-ready JSON telemetry feed.

### `GET /reports/export/csv?target=threats`
Download CSV dataset of detected threats, incidents, or audit logs.
