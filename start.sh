#!/usr/bin/env bash
# ==============================================================================
# SecureAI Vault - Enterprise Startup Script (macOS / Linux)
# Tagline: Protect. Detect. Trust.
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "========================================================================"
echo "    ____                            ___    ____   _    __            ____ "
echo "   / __/__  _______  __________    /   |  /  _/  | |  / /___ ___  __/ / /_"
echo "  _\ \/ _ \/ __/ _ \/ ___/ _ \/   / /| |  / /    | | / / __ \`/ / / / / __/"
echo " /___/\___/\__/\___/_/  \___/    / ___ |_/ /     | |/ / /_/ / /_/ / / /_  "
echo "                                /_/  |_/___/     |___/\__,_/\__,_/_/\__/  "
echo "========================================================================"
echo "           SecureAI Vault • Enterprise Cybersecurity Platform           "
echo "                       Protect. Detect. Trust.                          "
echo "========================================================================"
echo -e "${NC}"

# 1. Environment Verification
echo -e "${YELLOW}[1/4] Checking system prerequisites...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: python3 is required but not installed.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required but not installed.${NC}"
    exit 1
fi

PYTHON_VER=$(python3 --version)
NODE_VER=$(node --version)
echo -e "${GREEN}✓ Found ${PYTHON_VER}${NC}"
echo -e "${GREEN}✓ Found Node.js ${NODE_VER}${NC}"

# 2. Virtual Environment Setup
echo -e "\n${YELLOW}[2/4] Setting up Python virtual environment...${NC}"
if [ ! -d "venv" ]; then
    echo "Creating virtual environment 'venv'..."
    python3 -m venv venv
fi

# Detect python binary
if [ -f "venv/bin/python3" ]; then
    VENV_PYTHON="venv/bin/python3"
else
    VENV_PYTHON="python3"
fi

echo "Installing/verifying backend dependencies..."
$VENV_PYTHON -m pip install -q -r backend/requirements.txt || {
    echo -e "${YELLOW}Retrying pip install with verbose output...${NC}"
    $VENV_PYTHON -m pip install -r backend/requirements.txt
}
echo -e "${GREEN}✓ Backend dependencies installed successfully.${NC}"

# 3. Frontend Build & Packaging
echo -e "\n${YELLOW}[3/4] Building React SOC frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend npm packages..."
    npm install --silent
fi

echo "Compiling frontend assets..."
npm run build
cd ..
echo -e "${GREEN}✓ Frontend bundled into production distribution.${NC}"

# 4. Starting Platform Services
echo -e "\n${YELLOW}[4/4] Starting SecureAI Vault Unified Application Server...${NC}"
echo -e "${CYAN}========================================================================${NC}"
echo -e "${GREEN}  ✓ Web Platform URL:       http://localhost:8000${NC}"
echo -e "${GREEN}  ✓ API OpenAPI Docs:       http://localhost:8000/api/v1/docs${NC}"
echo -e "${GREEN}  ✓ Alternate Redoc Docs:   http://localhost:8000/api/v1/redoc${NC}"
echo -e "${CYAN}------------------------------------------------------------------------${NC}"
echo -e "${YELLOW}  Default Demonstration Credentials:${NC}"
echo -e "    • Super Admin:  admin@secureai.local       / Password@123!"
echo -e "    • SOC Lead:     soc_analyst@secureai.local  / Password@123!"
echo -e "    • Employee:     john.doe@secureai.local     / Password@123!"
echo -e "${CYAN}========================================================================${NC}"
echo -e "Press CTRL+C at any time to stop the server.\n"

export PYTHONPATH=.
$VENV_PYTHON -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
