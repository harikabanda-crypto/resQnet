#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_LOG="$SCRIPT_DIR/backend.log"
FRONTEND_LOG="$SCRIPT_DIR/frontend.log"

echo "======================================================================"
echo "  ResQNet — Landslide Early Warning & Disaster Response Network"
echo "  North Eastern Region (NER), India | SIH Platform"
echo "======================================================================"

# 1. Verify system dependencies
command -v python3 >/dev/null 2>&1 || { echo "[ERROR] python3 is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "[ERROR] node is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "[ERROR] npm is required but not installed."; exit 1; }

# 2. Check Backend Virtualenv and Dependencies
echo "[1/4] Checking Python backend environment..."
if [ ! -d "$SCRIPT_DIR/backend/.venv" ]; then
    echo "Creating virtual environment in backend/.venv..."
    python3 -m venv "$SCRIPT_DIR/backend/.venv"
fi

VENV_PY="$SCRIPT_DIR/backend/.venv/bin/python"
VENV_PIP="$SCRIPT_DIR/backend/.venv/bin/pip"
VENV_UVICORN="$SCRIPT_DIR/backend/.venv/bin/uvicorn"

if ! "$VENV_PY" -c "import fastapi, xgboost, sqlalchemy, uvicorn" 2>/dev/null; then
    echo "Installing backend dependencies from backend/requirements.txt..."
    "$VENV_PIP" install -r "$SCRIPT_DIR/backend/requirements.txt"
fi

# 3. Check Frontend Dependencies
echo "[2/4] Checking frontend node_modules..."
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    (cd "$SCRIPT_DIR/frontend" && npm install)
fi

# Cleanup handler for graceful shutdown
cleanup() {
    echo ""
    echo "[!] Stopping ResQNet services..."
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    echo "[✓] All ResQNet processes terminated cleanly."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 4. Start Backend Service
echo "[3/4] Starting FastAPI backend on port 8000..."
(
    cd "$SCRIPT_DIR/backend"
    "$VENV_UVICORN" app.main:app --host 127.0.0.1 --port 8000 > "$BACKEND_LOG" 2>&1
) &
BACKEND_PID=$!

# Wait for backend health check
echo -n "Waiting for backend to become healthy"
HEALTHY=0
for i in {1..30}; do
    if curl -s http://127.0.0.1:8000/health | grep -q '"status":"ok"'; then
        HEALTHY=1
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

if [ $HEALTHY -ne 1 ]; then
    echo "[ERROR] Backend failed to start. Check $BACKEND_LOG for details:"
    tail -n 20 "$BACKEND_LOG"
    exit 1
fi
echo "[✓] Backend is ready and responding at http://127.0.0.1:8000"

# 5. Start Frontend Service
echo "[4/4] Starting Vite frontend on port 5173..."
(
    cd "$SCRIPT_DIR/frontend"
    npm run dev -- --host 127.0.0.1 --port 5173 > "$FRONTEND_LOG" 2>&1
) &
FRONTEND_PID=$!

sleep 2

echo ""
echo "======================================================================"
echo "  ✓ ResQNet Full Stack is LIVE!"
echo "======================================================================"
echo "  Citizen & Authority App:  http://localhost:5173"
echo "  Backend API Server:       http://localhost:8000"
echo "  Interactive API Docs:     http://localhost:8000/docs"
echo "  Live WebSocket Feeds:     ws://localhost:8000/ws"
echo ""
echo "  Demo Credentials (all roles use password: demo123):"
echo "    • Authority:  shillong.hq@resqnet.ner"
echo "    • Responder:  ndrf.bravo1@resqnet.ner"
echo "    • NGO:        assam.aid@resqnet.ner"
echo "    • Citizen:    aiban.lang@resqnet.ner"
echo ""
echo "  Logs: tail -f backend.log | tail -f frontend.log"
echo "  Press [Ctrl+C] to stop all services."
echo "======================================================================"
echo ""

# Wait for background processes
wait "$BACKEND_PID" "$FRONTEND_PID"
