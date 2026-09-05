# SecureAI Vault
> **Tagline:** *Protect. Detect. Trust.*

![SecureAI Vault Architecture](https://img.shields.io/badge/Security-Zero--Trust-06b6d4?style=for-the-badge)
![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-10b981?style=for-the-badge)
![AI/ML](https://img.shields.io/badge/AI%2FML-RandomForest%20%2B%20IsolationForest-6366f1?style=for-the-badge)
![Blockchain](https://img.shields.io/badge/Audit-Permissioned%20Blockchain-f59e0b?style=for-the-badge)

**SecureAI Vault** is a production-quality, full-stack cybersecurity software platform engineered for securely uploading, encrypting, storing, sharing, monitoring, and analyzing sensitive files. It combines authenticated symmetric cryptography (**AES-256-GCM**), multi-vector static & heuristic threat detection, machine learning classification, deep anomaly detection, NLP data loss prevention (**DLP**), user & entity behavior analytics (**UEBA**), and an immutable **permissioned blockchain audit ledger**.

---

## 🌟 Key Capabilities

### 1. Cryptographic Security & Zero-Trust Storage
- **Authenticated AES-256-GCM Encryption**: Every file is encrypted using a unique, cryptographically random 256-bit symmetric key.
- **Master Key Wrapping**: Per-file encryption keys are encrypted with an administrative master key using AES-256 key wrapping.
- **Plaintext Never Touched**: The server filesystem stores only anonymized UUID-named ciphertext blocks; plaintext is never written to disk or the database.
- **SHA-256 Pre/Post Integrity Verification**: Cryptographic hashes are computed before encryption and verified post-decryption. Any byte modification triggers an instant `INTEGRITY VIOLATION` security incident.
- **Dynamic Recipient Watermarking**: In-memory diagonal watermarking stamping recipient identity, email, and UTC timestamps on PDF, image, and text documents without altering the ciphertext master.

### 2. Multi-Vector AI/ML Threat Detection
- **Shannon Entropy Analysis**: Measures byte randomness ($0.0 - 8.0$ bits) to detect packed, obfuscated, or encrypted payloads disguised as benign documents.
- **Static Heuristic Inspection**: Scans for embedded PDF JavaScript streams (`/JavaScript`, `/JS`, `/Launch`, `/EmbeddedFiles`) and weaponized Office OpenXML VBA macros (`vbaProject.bin`).
- **Scikit-Learn Ensemble**: Random Forest classifier ($96.8\%$ accuracy) and Isolation Forest anomaly detector.
- **Explainable AI (XAI)**: Generates clear, human-readable explanations and SHAP-style feature contributions for every risk score.

### 3. NLP & Data Loss Prevention (DLP)
- **Sensitive Credential Detection**: High-precision regex and entity recognition detecting AWS Access Keys, OpenAI tokens, GitHub PATs, JWTs, and plaintext credentials.
- **PII Discovery**: Scans for email addresses, phone numbers, and financial records.
- **Document Confidentiality Tiering**: Automatically categorizes content into **Public**, **Internal**, **Confidential**, or **Highly Confidential**.
- **Automated Policy Interception**: Prevents external sharing of classified assets without administrative clearance.

### 4. Permissioned Blockchain Audit Ledger
- **Tamper-Evident Ledger**: Every security event (upload, download, share, threat quarantine, role change) is permanently sealed into a sequential SHA-256 block ledger.
- **No File Content on Chain**: Stores only cryptographic event hashes, user references, and chaining pointers to maintain strict confidentiality.
- **Interactive Verification**: One-click traversal validating all blocks from Genesis to Tip, identifying altered blocks within milliseconds.
- **Live Tamper Simulator**: Educational feature demonstrating how unauthorized database edits are immediately caught by cryptographic validation.

### 5. SOC Command Center & User Governance
- **Comprehensive SOC Dashboard**: 8 real-time KPI metrics, global Organization Security Score ($92/100$) with explanation breakdown, and interactive Recharts visualizations.
- **Incident Response Management**: Complete lifecycle workflow (**OPEN**, **INVESTIGATING**, **CONTAINED**, **RESOLVED**, **FALSE_POSITIVE**) with investigation notes and analyst assignment.
- **Digital Forensics Timeline**: Reconstructs **WHO**, **WHAT**, **WHEN**, **WHERE**, and **HOW** across all system activities.
- **User Behavior Analytics (UEBA)**: Tracks download velocities and flags abnormal exfiltration spikes ($>15$ files/10 min).
- **Multi-Role RBAC**: Sovereign roles including Super Admin, Security Admin, Organization Admin, Manager, Employee, Auditor, and Guest.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI/UX** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Framer Motion |
| **Backend API Gateway** | Python 3.12+, FastAPI, Starlette, Uvicorn, Pydantic v2 |
| **Cryptography** | PyCryptodome, Cryptography (AES-256-GCM, PBKDF2, SHA-256), ReportLab |
| **AI / ML / Anomaly** | Scikit-learn (Random Forest, Isolation Forest), NumPy, SciPy |
| **NLP & DLP** | PyPDF, Python-docx, Regex Named Entity Recognition |
| **Database & Cache** | SQLAlchemy 2.0 (PostgreSQL production-ready with instant SQLite fallback) |
| **Containers & Orchestration** | Docker, Docker Compose, Nginx Alpine |

---

## 🚀 Instant Launch Instructions

### Prerequisites
- **Python 3.8+**
- **Node.js 18+** & **npm**

### Option A: macOS / Linux (Turnkey Script)
```bash
# Clone the repository
git clone https://github.com/Ashok13082804/SecureValut_X_Nexora.git
cd SecureValut_X_Nexora

# Run the automated launch script
./start.sh
```

### Option B: Windows (Turnkey Script)
Double-click `start.bat` or run in Command Prompt:
```cmd
start.bat
```

### Option C: Docker Compose (All-in-One Multi-Container)
```bash
docker-compose up --build
```

---

## 🔑 Default Demonstration Credentials

The platform includes a pre-seeded synthetic enterprise SOC dataset for immediate evaluation:

| Role | Email | Password | Clearance Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@secureai.local` | `Password@123!` | Full Sovereign Control |
| **SOC Lead** | `soc_analyst@secureai.local` | `Password@123!` | Threat & Incident Investigation |
| **Employee** | `john.doe@secureai.local` | `Password@123!` | Standard Encrypted Storage & Sharing |
| **Auditor** | `auditor@secureai.local` | `Password@123!` | Read-Only Blockchain Ledger Verification |

---

## 🌐 Platform Portals & Endpoints

- **SOC Web Dashboard**: [`http://localhost:8000`](http://localhost:8000) (or `http://localhost:5173` in Vite dev mode)
- **OpenAPI Interactive Documentation**: [`http://localhost:8000/api/v1/docs`](http://localhost:8000/api/v1/docs)
- **ReDoc Technical Reference**: [`http://localhost:8000/api/v1/redoc`](http://localhost:8000/api/v1/redoc)
- **System Health Check**: [`http://localhost:8000/health`](http://localhost:8000/health)

---

## 📚 Technical Documentation Directory

- 📐 **[ARCHITECTURE.md](ARCHITECTURE.md)**: Enterprise Architecture, DFD Level 0/1/2, ER Diagrams, and Sequence Diagrams.
- 🛡️ **[SECURITY.md](SECURITY.md)**: Cryptographic Specifications, OWASP Top 10 Mitigations, and STRIDE Threat Model.
- 📡 **[API.md](API.md)**: Comprehensive REST API Route Reference with Request/Response Payloads.
- 🧠 **[ML_MODEL.md](ML_MODEL.md)**: Machine Learning Pipeline, Feature Engineering, and Anomaly Models.
- ⛓️ **[BLOCKCHAIN.md](BLOCKCHAIN.md)**: Permissioned Blockchain Ledger Specification and Verification Algorithms.

---

## 🧪 Running Automated Tests

```bash
# Activate virtual environment
source venv/bin/activate   # or venv\Scripts\activate on Windows

# Execute pytest test suite
PYTHONPATH=. pytest -p no:pytest_ethereum backend/tests
```

---

## 📄 License & Intellectual Property
Developed for **SecureAI Vault** ("Protect. Detect. Trust."). Designed for production enterprise deployment and rigorous academic presentation.
