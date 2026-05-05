import functools
import json
import asyncio
import httpx
import re
import datetime
from typing import Any, Callable, List, Optional
import os

# PII Redaction Patterns
PII_PATTERNS = {
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    "api_key": r"(?i)(api[_-]?key|secret|token|password|auth)[\s:=]+['\"]?([a-zA-Z0-9_\-\.]{16,})['\"]?",
    "ipv4": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
}

class AuditLogger:
    def __init__(self, backend_url: str = "http://localhost:8000/log"):
        self.backend_url = backend_url
        self.client = httpx.AsyncClient()

    def redact(self, text: str) -> str:
        if not isinstance(text, str):
            text = str(text)
        for name, pattern in PII_PATTERNS.items():
            text = re.sub(pattern, f"[REDACTED_{name.upper()}]", text)
        return text

    async def send_log(self, log_data: dict):
        try:
            # Simple async push
            await self.client.post(self.backend_url, json=log_data)
        except Exception as e:
            print(f"Failed to send audit log: {e}")

_logger = AuditLogger()

def audit_trace(agent_id: str):
    """
    Decorator to trace agent decisions.
    Usage:
    @audit_trace(agent_id="shadow-coo-alpha")
    async def my_agent_step(input_data):
        ...
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = datetime.datetime.utcnow().isoformat()
            
            # Capture inputs
            inputs = {
                "args": [str(a) for a in args],
                "kwargs": {k: str(v) for k, v in kwargs.items()}
            }
            
            # Execute the function
            try:
                result = await func(*args, **kwargs)
                status = "success"
            except Exception as e:
                result = str(e)
                status = "error"
                raise e
            finally:
                end_time = datetime.datetime.utcnow().isoformat()
                
                # Construct log artifact
                log_artifact = {
                    "timestamp": start_time,
                    "agent_id": agent_id,
                    "function_name": func.__name__,
                    "trigger_event": inputs,
                    "final_decision": str(result),
                    "status": status,
                    "metadata": {
                        "duration": (datetime.datetime.fromisoformat(end_time) - datetime.datetime.fromisoformat(start_time)).total_seconds()
                    }
                }
                
                # Scrub PII from everything
                scrubbed_log = json.loads(_logger.redact(json.dumps(log_artifact)))
                
                # Push to backend (fire and forget)
                asyncio.create_task(_logger.send_log(scrubbed_log))
                
            return result
        return wrapper
    return decorator
