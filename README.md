# TailFax™ — Aircraft History Reports

Real data from FAA, NTSB, and FAA SDRS. No fake data.

## Data Sources
| Source | What it provides | How accessed |
|--------|-----------------|--------------|
| FAA Civil Aviation Registry | Owner name, registration status, serial number, cert dates | Bulk ZIP download on startup |
| NTSB Accident Database | Every accident ever investigated | Live REST API per query |
| FAA Service Difficulty Reports | Mechanic-filed failure reports | Live REST API per query |

**Not included in Standard report:** Lien/title records (requires FAA OKC records request).

---

## Deploy on Railway (5 minutes, free tier available)

1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select your repo → Railway auto-detects Python and builds it
4. Click **Generate Domain** to get a public URL like `https://tailfax-production.up.railway.app`
5. Done — the frontend is served from the same URL at `/`

**Note:** On first startup, the FAA registry downloads (~30MB, ~60 seconds). The health endpoint at `/api/health` shows when it's ready.

---

## Deploy on Render (free tier, sleeps after inactivity)

1. Push to GitHub
2. [render.com](https://render.com) → New Web Service → Connect repo
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
5. Done

---

## Run Locally

```bash
cd tailfax
pip install -r requirements.txt
uvicorn api.main:app --reload
# Open http://localhost:8000
```

The frontend is served at `http://localhost:8000/`  
The API docs are at `http://localhost:8000/docs`

---

## API Endpoints

```
GET /api/health
    Returns FAA loading status and aircraft count

GET /api/report?reg=N12345&make=Gulfstream&model=G-IV
    Full report by registration number

GET /api/report?serial=750-0098&make=Cessna&model=Citation+X
    Full report by serial number
```

---

## Known Limitations

- **Ownership history:** FAA bulk registry only contains the *current* registrant. Full chain of title requires an FAA OKC records request (~$10).
- **Lien status:** Not in Standard report. Always conduct a title search before purchasing.
- **NTSB API:** The public CAROL API can be slow or unavailable. Report will note when data is unavailable.
- **FAA registry refresh:** Downloaded once per deployment. For production, schedule a monthly refresh via cron job or Airflow DAG (code in `/api/main.py` `load_faa_registry()`).

---

## TailFax Score™ Methodology

| Component | Max Points | How calculated |
|-----------|-----------|----------------|
| Accidents | 40 | Deducted by damage severity × recency multiplier |
| Lien/Title | 20 | Not yet verified — reserved for Enhanced reports |
| Ownership | 15 | Not yet verified — reserved for Enhanced reports |
| SDRs | 15 | −3 per SDR, capped at 15 |
| Registration | 10 | Full points if Valid, deducted if Expired/Revoked |

Score formula is a trade secret. Do not publish.

---

## Roadmap

- [ ] FAA OKC lien/title API integration
- [ ] Full ownership history (OKC records)  
- [ ] FlightAware AeroAPI flight activity
- [ ] PDF report generation (WeasyPrint)
- [ ] Stripe payment integration ($199/report)
- [ ] Broker subscription dashboard ($299/mo)
- [ ] Lender API ($999/mo)
- [ ] Monthly FAA registry auto-refresh
