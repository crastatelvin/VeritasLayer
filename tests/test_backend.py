import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app

client = TestClient(app)

def test_read_logs():
    response = client.get("/logs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_log_ingestion():
    log_payload = {
        "timestamp": "2026-05-05T12:00:00",
        "agent_id": "ci-test-agent",
        "function_name": "test_func",
        "trigger_event": {"test": "data"},
        "final_decision": "Approved",
        "status": "success",
        "metadata": {"test": "meta"}
    }
    response = client.post("/log", json=log_payload)
    assert response.status_code == 200
    assert response.json()["status"] == "recorded"

def test_explain_not_found():
    response = client.get("/explain/999999")
    assert response.status_code == 404
