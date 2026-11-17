# VulnBoard — vulnerability intake and remediation

VulnBoard is a compact security operations platform. It ingests scanner output, creates stable finding fingerprints, updates repeat observations instead of duplicating records, assigns CVSS-based severity and remediation targets, and tracks analyst workflow with an authenticated API.

![VulnBoard dashboard](screenshots/dashboard.png)

## Features

- Authenticated scanner ingestion and analyst updates using a Bearer token.
- Batch validation (1–500 findings) and SHA-256 deduplication using normalized asset, plugin ID, and title.
- Repeat observations increment occurrence count and refresh `lastSeen`; resolved findings reopen when rediscovered.
- CVSS severity bands and SLA targets: critical 24 hours, high 7 days, medium 30 days, low/info 90 days.
- Workflow transitions: `open → triaged → in_progress → resolved`, with false-positive and reopen paths.
- Finding assignment, search/filter, overdue metrics, and per-finding event history.
- Security response headers and constant-time comparison for API token validation.

## Stack and requirements

Node.js 22.5+, built-in HTTP, SQLite, crypto, SQL, HTML/CSS/JavaScript, and `node:test`. No third-party packages required.

## Setup

```bash
node --version  # 22.5+
API_TOKEN='use-a-long-random-local-secret' npm start
# open http://localhost:3003
```

For a quick local demo, the development-only token is `local-demo-token`. Change it before using the application outside a local machine. PowerShell:

```powershell
$env:API_TOKEN='use-a-long-random-local-secret'; npm start
```

The first launch creates `data/vulnboard.sqlite` with five sample findings. Set `PORT` and `DB_PATH` to override defaults.

## Tests

```bash
npm test
npm run check
```

Tests cover CVSS mapping, SLA calculation, fingerprint normalization, authenticated ingestion, duplicate updates, payload validation, status transitions, activity history, and filtering.

## API reference

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/api/health` | No | Health check |
| GET | `/api/metrics` | No | Severity, active, and overdue counts |
| GET | `/api/findings?severity=high&status=open&q=api` | No | Filter/search findings |
| POST | `/api/scans` | Yes | Ingest scanner batch |
| PATCH | `/api/findings/:id` | Yes | Change status/assignee |
| GET | `/api/findings/:id/events` | No | Read finding event history |

Example scan ingestion:

```bash
curl -X POST http://localhost:3003/api/scans \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer use-a-long-random-local-secret' \
  -d '{"source":"nmap-import","findings":[{"asset":"api.example.in","pluginId":"TLS-001","title":"Weak TLS configuration","description":"Disable legacy protocol versions.","cvss":7.4}]}'
```

Example analyst update:

```bash
curl -X PATCH http://localhost:3003/api/findings/REPLACE_ID \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer use-a-long-random-local-secret' \
  -d '{"status":"triaged","assignedTo":"platform-team","details":"Patch planned"}'
```

## Architecture

```text
Scanner JSON ── Bearer-authenticated ingestion
                         │
                         ▼
               Input validation / fingerprint
                         │
                         ▼
              Finding service / SLA / workflow
                         │
                         ▼
   SQLite findings + finding_events (audit history)
                         │
                         ▼
               Dashboard / metrics / filters
```

## Screenshots

- `screenshots/dashboard.png` — security posture cards, severity queue, owners, and due dates.

## Security and production notes

The built-in development token is deliberately simple and must be replaced. A production service should use an identity provider, scoped roles, per-tenant authorization, secret management, HTTPS, request throttling, scanner signature verification, immutable audit storage, and a production database. CVSS is a prioritization input, not a complete risk model; exploitability, asset criticality, and exposure should also influence real remediation SLAs.
