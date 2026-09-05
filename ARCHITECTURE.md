# SecureAI Vault – Enterprise Architecture Document
> **Tagline:** *Protect. Detect. Trust.*

---

## 1. System Architecture Overview

```mermaid
graph TD
    subgraph Client Layer
        WebClient["React + Vite + TypeScript SOC Dashboard\n(Tailwind CSS, Recharts, Framer Motion)"]
        PublicClient["Expiring Link Share Portal (/s/:token)"]
    end

    subgraph API Gateway & Security Layer
        FastAPIGateway["FastAPI Gateway (Port 8000)"]
        SecHeaders["Security Headers Middleware (CSP, HSTS, X-Frame)"]
        RateLimiter["Rate Limiting & Account Lockout Engine"]
        AuthModule["OAuth2 Bearer / JWT Token Verifier"]
    end

    subgraph Defense & Analytics Services
        ThreatSvc["Static Threat & Heuristic Analyzer\n(Shannon Entropy, PDF JS, Macros)"]
        MLSvc["ML Threat Classifier & Anomaly Detector\n(Random Forest + Isolation Forest)"]
        NLPSvc["NLP & DLP Data Classifier\n(Credential Detection, PII, Entity Recognition)"]
        UEBASvc["UEBA User Behavior Analytics\n(Baseline Tracking & Download Velocity)"]
        PolicySvc["Configurable Security Policy Engine"]
    end

    subgraph Cryptography & Storage Layer
        CryptoEngine["AES-256-GCM Engine\n(Unique Per-File Keys, PBKDF2 Master Wrap)"]
        IntegrityEngine["SHA-256 Hash Verifier"]
        WatermarkEngine["Dynamic In-Memory Watermarking Engine"]
        DiskStore["Isolated Encrypted Storage\n(./secure_storage/<uuid>.enc)"]
    end

    subgraph Blockchain Ledger Layer
        BlockchainEngine["Permissioned Blockchain Audit Ledger"]
        LedgerStore[("Cryptographic SHA-256 Block Store\nGenesis to Tip Linked Chain")]
    end

    subgraph Database Persistence
        DB[(PostgreSQL / SQLite Database\nUsers, Files, Incidents, Policies, Logs)]
    end

    WebClient -->|REST API / HTTPS| FastAPIGateway
    PublicClient -->|REST API / HTTPS| FastAPIGateway
    FastAPIGateway --> SecHeaders --> RateLimiter --> AuthModule

    FastAPIGateway --> ThreatSvc
    FastAPIGateway --> MLSvc
    FastAPIGateway --> NLPSvc
    FastAPIGateway --> UEBASvc
    FastAPIGateway --> PolicySvc

    FastAPIGateway --> CryptoEngine
    CryptoEngine --> DiskStore
    CryptoEngine --> IntegrityEngine
    CryptoEngine --> WatermarkEngine

    FastAPIGateway --> BlockchainEngine
    BlockchainEngine --> LedgerStore

    FastAPIGateway --> DB
```

---

## 2. Data Flow Diagrams (DFD)

### DFD Level 0 (Context Diagram)
```mermaid
graph LR
    User([Platform User / SOC Analyst]) -->|Upload File, Credentials, Share Config| System[SecureAI Vault Platform]
    System -->|Security Dashboard, Alerts, Decrypted Stream| User
    External([External Recipient]) -->|Share Token, Password| System
    System -->|Watermarked Decrypted File| External
    System -->|Permanent Cryptographic Hashes| Blockchain[Permissioned Blockchain Ledger]
```

### DFD Level 1 (Macro Subsystems)
```mermaid
graph TD
    User([User]) --> Auth[1. Authentication & RBAC]
    Auth --> SessionDB[(User Sessions)]

    User --> Ingestion[2. Secure Ingestion Pipeline]
    Ingestion --> Scan[3. Multi-Factor AI/ML/NLP Inspection]
    Scan --> Crypto[4. AES-256-GCM Encryption]
    Crypto --> Storage[(Encrypted File Store)]

    Crypto --> BlockEngine[5. Blockchain Event Sealing]
    BlockEngine --> BlockLedger[(Blockchain Block Store)]

    User --> Download[6. Download & Integrity Verification]
    Storage --> Download
    Download --> Watermark[7. Dynamic Recipient Watermarking]
    Watermark --> User
```

---

## 3. Sequence Diagrams

### Sequence 1: 8-Stage Secure File Upload Pipeline
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Gateway as FastAPI Gateway
    participant Threat as Static & Heuristic Engine
    participant ML as ML & Isolation Forest
    participant NLP as NLP & DLP Engine
    participant Crypto as AES-256-GCM Crypto Service
    participant Storage as Encrypted Disk Store
    participant Chain as Blockchain Ledger
    participant DB as Relational Database

    User->>Gateway: POST /api/v1/files/upload (Multipart)
    Gateway->>Gateway: Stage 1: Extension & MIME Policy Validation
    Gateway->>Crypto: Stage 2: Calculate Plaintext SHA-256 Hash
    Gateway->>Threat: Stage 3: Scan Shannon Entropy, PDF JS, Macros
    Gateway->>ML: Stage 4: Extract Features & Predict Threat / Anomaly
    Gateway->>NLP: Stage 5: Scan Credentials, PII, Classify Confidentiality
    Gateway->>Gateway: Stage 6: Risk Fusion (Composite Score 0-100)
    Gateway->>Crypto: Stage 7: Generate File Key & AES-256-GCM Encrypt
    Crypto->>Storage: Write Ciphertext to disk (UUID.enc)
    Gateway->>Chain: Stage 8: Mint Blockchain Audit Block (FILE_UPLOADED)
    Chain->>Chain: SHA-256 Chaining (PrevHash -> CurrHash)
    Gateway->>DB: Commit File, Metadata, Threat, ML, and NLP Records
    Gateway-->>User: 200 OK (FileResponse with Threat Score & SHA-256)
```

### Sequence 2: Cryptographic Decryption, Verification & Watermarking
```mermaid
sequenceDiagram
    autonumber
    actor Recipient
    participant Gateway as FastAPI Gateway
    participant Crypto as AES-256-GCM Service
    participant Storage as Encrypted Disk Store
    participant Watermark as Dynamic Watermarker
    participant Chain as Blockchain Ledger
    participant DB as Relational Database

    Recipient->>Gateway: GET /api/v1/files/{id}/download
    Gateway->>DB: Query File & Encryption Metadata
    Gateway->>Storage: Read Ciphertext Bytes
    Gateway->>Crypto: Unwrap File Key & Decrypt (AES-256-GCM)
    Crypto->>Crypto: Authenticate 128-bit Tag & Verify Nonce
    Crypto->>Crypto: Compare Post-Decryption SHA-256 with Stored Hash
    alt Hash Matches (Integrity Valid)
        Crypto->>Watermark: Apply Recipient Email & UTC Watermark
        Gateway->>Chain: Mint Audit Block (FILE_DOWNLOADED)
        Gateway->>DB: Record Download History Log
        Gateway-->>Recipient: 200 OK (Stream Decrypted Watermarked Payload)
    else Hash Mismatch (Integrity Violation)
        Gateway->>DB: Set File.integrity_status = "INTEGRITY VIOLATION"
        Gateway->>Chain: Mint Block (INTEGRITY_VIOLATION)
        Gateway-->>Recipient: 409 Conflict (Critical Security Alert)
    end
```

---

## 4. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : establishes
    USERS ||--o{ FILES : owns
    USERS ||--o{ FILE_SHARES : creates
    USERS ||--o{ AUDIT_LOGS : triggers
    USERS ||--o{ INCIDENTS : assigned_to

    FILES ||--|| ENCRYPTION_METADATA : secures
    FILES ||--|| THREAT_DETECTIONS : evaluated_by
    FILES ||--|| ML_PREDICTIONS : analyzed_by
    FILES ||--|| NLP_ANALYSIS : classified_by
    FILES ||--o{ FILE_VERSIONS : tracks
    FILES ||--o{ FILE_SHARES : shared_via
    FILES ||--o{ DOWNLOAD_HISTORY : downloaded_in

    BLOCKCHAIN_BLOCKS ||--o{ FILES : anchors_hash

    USERS {
        string id PK
        string email UK
        string username UK
        string full_name
        string hashed_password
        string role
        boolean mfa_enabled
        float risk_score
        datetime created_at
    }

    FILES {
        string id PK
        string original_name
        string storage_name UK
        string file_extension
        string mime_type
        int file_size
        string sha256_hash
        string owner_id FK
        int threat_score
        string threat_classification
        string nlp_classification
        boolean is_quarantined
        string integrity_status
        int current_version
    }

    ENCRYPTION_METADATA {
        string id PK
        string file_id FK
        string algorithm
        string nonce_b64
        string tag_b64
        string encrypted_key_b64
        string key_fingerprint
    }

    BLOCKCHAIN_BLOCKS {
        int id PK
        int block_index UK
        float timestamp
        string event_type
        string file_hash
        string actor_reference
        text details_json
        string previous_hash
        string current_hash
    }

    INCIDENTS {
        string id PK
        string incident_number UK
        string title
        string severity
        string category
        string status
        int risk_score
        text investigation_notes
    }
```
