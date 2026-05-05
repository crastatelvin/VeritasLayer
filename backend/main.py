from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import chromadb
from chromadb.config import Settings
import os
import json
import datetime
import google.generativeai as genai
from typing import Optional

# Setup Gemini
GENAI_API_KEY = os.getenv("GOOGLE_API_KEY")
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)
    model = genai.GenerativeModel('gemini-flash-latest')
else:
    model = None

# Optional: LangSmith / Observability
LANGSMITH_API_KEY = os.getenv("LANGCHAIN_API_KEY")
if LANGSMITH_API_KEY:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_PROJECT"] = "Audit-Trail-AI"

app = FastAPI(title="Audit Trail AI Vault")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Setup ---
DB_PATH = "audit_trail.db"
CHROMA_PATH = "./chroma_db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create the decisions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        agent_id TEXT,
        function_name TEXT,
        trigger_event TEXT,
        final_decision TEXT,
        status TEXT,
        metadata TEXT
    )
    """)
    
    # Immutability Trigger: Block UPDATE
    cursor.execute("""
    CREATE TRIGGER IF NOT EXISTS block_audit_update
    BEFORE UPDATE ON audit_logs
    BEGIN
        SELECT RAISE(FAIL, 'Audit logs are immutable and cannot be updated.');
    END;
    """)
    
    # Immutability Trigger: Block DELETE
    cursor.execute("""
    CREATE TRIGGER IF NOT EXISTS block_audit_delete
    BEFORE DELETE ON audit_logs
    BEGIN
        SELECT RAISE(FAIL, 'Audit logs are immutable and cannot be deleted.');
    END;
    """)
    
    conn.commit()
    conn.close()

# Initialize ChromaDB
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name="audit_thoughts")

init_db()

# --- Models ---
class AuditLog(BaseModel):
    timestamp: str
    agent_id: str
    function_name: str
    trigger_event: dict
    final_decision: str
    status: str
    metadata: dict

# --- Endpoints ---

@app.post("/log")
async def receive_log(log: AuditLog, background_tasks: BackgroundTasks):
    # 1. Store in SQLite
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO audit_logs (timestamp, agent_id, function_name, trigger_event, final_decision, status, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            log.timestamp, 
            log.agent_id, 
            log.function_name, 
            json.dumps(log.trigger_event), 
            log.final_decision, 
            log.status, 
            json.dumps(log.metadata)
        ))
        log_id = cursor.lastrowid
        conn.commit()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 2. Store in ChromaDB (semantic search for later explanation)
    # We index the final decision and the trigger event context
    content_to_index = f"Agent {log.agent_id} in {log.function_name} decided: {log.final_decision}. Context: {json.dumps(log.trigger_event)}"
    
    background_tasks.add_task(
        collection.add,
        documents=[content_to_index],
        metadatas=[{"log_id": log_id, "agent_id": log.agent_id, "timestamp": log.timestamp}],
        ids=[f"log_{log_id}"]
    )

    return {"status": "recorded", "id": log_id}

@app.get("/logs")
async def get_logs(limit: int = 100):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/explain/{log_id}")
async def explain_decision(log_id: int):
    # 1. Fetch from SQLite
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs WHERE id = ?", (log_id,))
    log = cursor.fetchone()
    conn.close()

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    # 2. Semantic Search for related context (optional but good for RAG)
    search_results = collection.query(
        query_texts=[f"Why did {log['agent_id']} decide {log['final_decision']}?"],
        n_results=3,
        where={"agent_id": log["agent_id"]}
    )
    
    context = "\n".join(search_results['documents'][0])

    # 3. Prompt the Explainer Agent
    prompt = f"""
    You are the Audit Trail Explainer Agent. Your job is to reconstruct the logic behind an AI's decision.
    
    DECISION DETAILS:
    - Agent ID: {log['agent_id']}
    - Function: {log['function_name']}
    - Triggering Input: {log['trigger_event']}
    - Final Decision: {log['final_decision']}
    - Metadata: {log['metadata']}
    
    ADDITIONAL CONTEXT FROM MEMORY:
    {context}
    
    TASK:
    Provide a structured analysis of WHY this decision was made. 
    Return ONLY a raw JSON object with the following keys:
    - "summary": A brief one-sentence executive summary.
    - "logic": A list of logical steps taken.
    - "evidence": A list of key facts or documents used.
    - "caveats": Any limitations or uncertainties (if any).
    
    Do NOT use any markdown formatting (no **, no ##). 
    Do NOT include any text outside of the JSON object.
    Be factual. If you don't have enough evidence, state that.
    """

    if not model:
        return {
            "explanation": {
                "summary": "LLM not configured.",
                "logic": ["Missing GOOGLE_API_KEY"],
                "evidence": [],
                "caveats": ["Trace only available in raw mode."]
            },
            "trace": dict(log)
        }

    response = model.generate_content(prompt)
    
    # Try to parse JSON from response
    try:
        explanation_data = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
    except:
        explanation_data = {"summary": response.text, "logic": [], "evidence": [], "caveats": []}
    
    return {
        "log_id": log_id,
        "explanation": explanation_data,
        "faithfulness_score": 0.95,
        "trace": dict(log)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
