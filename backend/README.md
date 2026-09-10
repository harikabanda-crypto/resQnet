# ResQNet Backend

FastAPI service for the ResQNet disaster-response platform.

## Local development

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`.

- Health check: `GET /health`
- Interactive API docs: `/docs`

## Demo accounts

The first startup seeds local demo data. Every demo account uses password `demo123`:

| Role | Email |
|---|---|
| Citizen | `citizen@resqnet.demo` |
| Authority | `authority@resqnet.demo` |
| NGO | `ngo@resqnet.demo` |
| Volunteer | `volunteer@resqnet.demo` |

## API groups

- `/api/auth` — registration, login, and current-user details
- `/api/risk` and `/api/predict` — zone risk, trend, and heuristic predictions
- `/api/alerts` — authority alert management
- `/api/sos` — citizen requests, status updates, and responder assignment
- `/api/reports` — community reports
- `/api/shelters`, `/api/resources`, `/api/responders`, `/api/routes`
- `/api/dashboard/summary` — authority dashboard totals

Set `DATABASE_URL`, `SECRET_KEY`, and `CORS_ORIGINS` in a `.env` file to override local defaults.
