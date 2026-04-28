# Linux Security Agent & Dashboard

A lightweight, local MVP for continuous security compliance monitoring of Linux endpoints.

## 🚀 Project Overview

This project consists of a system agent written in Go that runs on Linux endpoints, collects inventory/security data, and transmits it to a local Node.js/Express backend that persists findings in SQLite and serves a modern React Dashboard.

## 🛠️ Tech Stack

- **Agent:** Go (Golang) — Single binary execution
- **Backend:** Node.js + Express
- **Database:** SQLite (Relational local storage)
- **Frontend:** React + Vite (Vanilla CSS Premium Design)

---

## 🔍 How It Works

1. **Go Agent:** 
   - Runs continuously (every 60s).
   - Gathers Host details (OS, IP, Kernel, Uptime).
   - Identifies installed packages using `dpkg`, `rpm`, or `apk`.
   - Executes 10 distinct Level-1 CIS benchmark configurations.
2. **Backend API:** 
   - Ingests agent payloads securely.
   - Computes real-time compliance percentages.
3. **Frontend App:**
   - Displays clear Pass/Fail auditing visuals.

---

## 💻 Requirements

Before running, ensure you have:
- [Node.js (v18+)](https://nodejs.org/)
- [Go (1.20+)](https://go.dev/)

---

## 🏃 Setup & Run

### 1. Start the Backend API
```bash
cd backend
npm install
npm run dev
```

### 2. Launch Dashboard
```bash
cd frontend
npm install
npm run dev
```

### 3. Deploy Go Agent
```bash
cd agent
go mod init agent
go run .
```
