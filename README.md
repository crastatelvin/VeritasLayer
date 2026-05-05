<div align="center">

# 🛡️ VeritasLayer

### The Truth Layer for AI — Explainable Governance & Immutable Audit Trails

[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/AI-Gemini_Flash-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![ChromaDB](https://img.shields.io/badge/Vector-ChromaDB-36cfc9?style=for-the-badge)](https://www.trychroma.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

> **VeritasLayer** is a production-grade transparency layer for agentic systems. It intercepts agent decisions, redacts PII, and stores traces in an immutable vault. Using Gemini 1.5 Flash and ChromaDB, it reconstructs the "Internal Monologue" of any AI agent into human-readable, auditable logic chains.

<br/>

![Explainability](https://img.shields.io/badge/Explainability-Gemini_Reasoning-f3b44f?style=for-the-badge) ![Security](https://img.shields.io/badge/Security-PII_Redactor-5aa6ff?style=for-the-badge) ![Immutability](https://img.shields.io/badge/Compliance-SQLite_Triggers-b189ff?style=for-the-badge) ![Visualization](https://img.shields.io/badge/UI-React_Flow_Graph-36cfc9?style=for-the-badge)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Usage](#-usage)
- [Security & Compliance](#-security--compliance)
- [License](#-license)

---

## 🧠 Overview

**VeritasLayer** (Project 7) solves the "Black Box" problem in AI agents. While most agents act autonomously, understanding *why* a specific decision was made is often impossible after the fact. VeritasLayer provides:

1.  **The @audit_trace SDK:** A drop-in Python decorator that captures agent state, triggers, and decisions.
2.  **The Immutable Vault:** A specialized backend that uses SQLite triggers to prevent any tampering with historical audit logs.
3.  **The Explainer Agent:** A RAG-powered reconstruction engine that pulls agent thoughts from ChromaDB and metadata from SQLite to explain decisions in natural language.
4.  **Premium Monitoring Dashboard:** A glassmorphic React interface that visualizes decision paths using React Flow graphs.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏷️ **@audit_trace SDK** | Seamless integration with any Python agent via a high-performance decorator |
| 🛡️ **PII Redaction** | Local masking of Emails, API Keys, and IPs before logs ever leave the agent environment |
| 🔒 **Tamper-Proof Vault** | SQLite `BEFORE UPDATE` and `BEFORE DELETE` triggers ensure log immutability |
| 🧠 **Reasoning Reconstruction** | Gemini-powered endpoint that turns raw traces into structured "Summary, Logic, Evidence" cards |
| 📊 **Decision Flow Graphs** | Interactive React Flow visualization of the inference path (Trigger -> Reasoning -> Decision) |
| 🔍 **Semantic Audit Search** | ChromaDB-backed search allows finding similar decisions based on agent "thoughts" |
| 🎨 **Glassmorphic UI** | Premium dark-mode dashboard with real-time system monitoring status |

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────┐
│              Agentic Application (Shadow COO)             │
│                                                           │
│  @audit_trace decorator ──► PII Redactor ──► POST /logs   │
└──────────────────────────────┬────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────┐
│                   VeritasLayer Vault (API)                │
│                                                           │
│  /logs    ─► SQLite (Immutability) ─► ChromaDB (Thoughts) │
│  /explain ─► Gemini 1.5 Flash      ─► Structured Analysis │
└──────────────────────────────┬────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────┐
│                  Verification Dashboard                   │
│                                                           │
│  Feed: Searchable Decision Trail                          │
│  Graph: React Flow Decision Path Visualization           │
│  Core: Structured Logic Reconstruction Cards              │
└───────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI, Python 3.11+ |
| **Explainability** | Google Gemini 1.5 Flash |
| **Vector Store** | ChromaDB (Semantic Memory) |
| **Structured DB** | SQLite (with Immutability Triggers) |
| **Frontend** | React 19, Vite, Tailwind CSS v4 |
| **Visualization** | React Flow, Lucide Icons |
| **Security** | Regex-based local PII Redaction |

---

## 📁 Project Structure

```
audit-trail/
│
├── sdk/
│   └── logger.py          # @audit_trace decorator + PII Redactor
│
├── backend/
│   ├── main.py            # FastAPI service + Gemini Explainer
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Glassmorphic Dashboard UI
│   │   └── index.css      # Tailwind v4 Styles
│   ├── vite.config.js
│   └── Dockerfile
│
├── tests/
│   ├── test_audit.py      # E2E Simulation Test
│   └── test_backend.py    # Backend Unit Tests
│
├── docker-compose.yml     # Full Stack Orchestration
└── README.md
```

---

## 🚀 Installation

### 1) Clone the Repository
```bash
git clone https://github.com/crastatelvin/VeritasLayer.git
cd VeritasLayer
```

### 2) Setup Backend
```bash
cd backend
pip install -r requirements.txt
$env:GOOGLE_API_KEY="your_gemini_api_key"
python main.py
```

### 3) Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 💻 Usage

### 🛠️ Using the SDK
Integrating VeritasLayer into your agent is as simple as adding a decorator:

```python
from sdk.logger import audit_trace

@audit_trace(agent_id="trader_agent_01")
def execute_trade(symbol: str, amount: float):
    # Agent Logic Here
    thought = "Market volatility is low, moving to execute buy order."
    return {"decision": f"BUY {amount} {symbol}", "thoughts": thought}
```

### 📊 Monitoring
1.  Open `http://localhost:5173` to view the dashboard.
2.  Select a decision from the **Recent Decisions** feed.
3.  Visualize the path in the **Inference Graph**.
4.  Read the **Reasoning Core** for the AI's logic reconstruction.

---

## 🔒 Security & Compliance

- **Zero-Trust Logging:** The database is hardened against internal tampering via SQL-level triggers.
- **Privacy First:** Sensitive strings (Emails, API Keys) are masked at the source (SDK level) before reaching the network.
- **Explainability:** Directly addresses regulatory requirements for human-in-the-loop oversight in autonomous systems.

---

## License

This project is licensed under the MIT License.

<br/>

<div align="center">
Built by Telvin Crasta · Production-Ready Governance · 2026
<br/><br/>
⭐ Star **VeritasLayer** if you believe AI should be transparent and auditable.
</div>
