# SecureAI Vault – Comprehensive Security Architecture & Threat Model
> **Tagline:** *Protect. Detect. Trust.*

---

## 1. Cryptographic Specification

SecureAI Vault implements authenticated symmetric cryptography conforming to NIST SP 800-38D and FIPS 140-3 guidelines:

### Symmetric File Encryption
- **Algorithm**: `AES-256-GCM` (Galois/Counter Mode).
- **Key Generation**: 256-bit cryptographically secure pseudorandom keys generated per file via `os.urandom(32)`.
- **Initialization Vector (IV) / Nonce**: Unique 96-bit (12 bytes) nonces generated randomly per file encryption invocation. Nonces are never reused across encryptions.
- **Authentication Tag (MAC)**: 128-bit (16 bytes) authentication tag verified prior to yielding decrypted plaintext. Any tampering immediately halts processing with a cryptographic MAC failure.

### Key Management Architecture
- **Per-File Ephemeral Keys**: Stored in `encryption_metadata` wrapped using the administrative master key.
- **Master Key Wrapping**: AES-256-GCM authenticated wrapping of per-file keys.
- **Key Isolation**: Raw symmetric keys are never transmitted to frontend clients and exist in memory only during active cryptographic streaming.

### Integrity Fingerprinting
- **SHA-256**: Calculated across plaintext prior to encryption and recorded in the database and permissioned blockchain ledger.
- **Post-Decryption Verification**: Decrypted streams are hashed on-the-fly and compared with the stored signature. Any divergence triggers an automated `INTEGRITY VIOLATION` security incident.

---

## 2. STRIDE Threat Model & Mitigations

| STRIDE Category | Threat Vector | SecureAI Vault Mitigation Strategy |
| :--- | :--- | :--- |
| **Spoofing Identity** | Attacker impersonates legitimate user via brute force or stolen credentials. | Argon2 / bcrypt password hashing with unique salts; OAuth2 JWT with short lifespans; TOTP-based Multi-Factor Authentication (MFA); account lockout after 5 failed attempts. |
| **Tampering with Data** | Malicious alteration of files in storage or audit logs in database. | Authenticated AES-256-GCM MAC tags; pre/post SHA-256 integrity hashing; immutable permissioned blockchain chaining where alterations break downstream block hashes. |
| **Repudiation** | User denies uploading a weaponized file or exfiltrating sensitive data. | Cryptographically signed Audit Logs capturing IP, User Agent, SHA-256, and UTC timestamp; immutably sealed into blockchain blocks. |
| **Information Disclosure** | Unauthorized recipient reads confidential document or sniffed network payload. | Plaintext never stored on disk; filenames randomized to UUIDs; TLS enforced; expiring access tokens with download limits and optional password gates; dynamic recipient watermarking. |
| **Denial of Service** | Resource exhaustion via massive file uploads or rapid API spamming. | Sliding-window rate limiting middleware (120 req/min); strict file size ceilings (100MB max); asynchronous threat scanning; MIME type whitelisting. |
| **Elevation of Privilege** | Normal employee attempts administrative quarantine release or policy overrides. | Strict Role-Based Access Control (RBAC) enforced server-side; FastAPI dependency injection checking roles on every privileged endpoint. |

---

## 3. OWASP Top 10 Mitigation Matrix

1. **A01: Broken Access Control**: Server-side RBAC dependencies (`require_roles(...)`) validate privileges on every protected route. Object IDs are cross-checked against tenant ownership.
2. **A02: Cryptographic Failures**: AES-256-GCM authenticated encryption; no weak ciphers (no DES/RC4/MD5); sensitive secrets in `.env`; per-file key wrapping.
3. **A03: Injection**: SQLAlchemy parameterized queries eliminate SQL injection; filenames sanitized to prevent command injection; static analyzers isolate file payloads.
4. **A04: Insecure Design**: Zero-trust architecture; least privilege defaults; defense-in-depth pipeline (Validation -> Static Scan -> ML Scan -> NLP Scan -> Risk Fusion -> Encryption -> Blockchain Mint).
5. **A05: Security Misconfiguration**: Strict HTTP security headers (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`); stack traces suppressed in API errors.
6. **A06: Vulnerable and Outdated Components**: Modern pinned dependencies; standard Scikit-learn, PyPDF, and PyCryptodome releases.
7. **A07: Identification and Authentication Failures**: Brute-force protection; account lockouts; TOTP MFA challenge support; session token invalidation.
8. **A08: Software and Data Integrity Failures**: SHA-256 file fingerprinting; permissioned blockchain verifying complete transaction lineages; rejection of mismatched payloads.
9. **A09: Security Logging and Monitoring Failures**: Real-time SOC dashboard; UEBA velocity detection; automated incident creation for threat score $>60$; tamper-evident audit logs.
10. **A10: Server-Side Request Forgery (SSRF)**: Uploaded files are parsed in-memory without invoking outbound HTTP webhooks or resolving remote entities.
