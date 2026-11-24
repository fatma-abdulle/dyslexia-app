# Dyslexia support API

## Setup in Windows PowerShell

Open PowerShell in the `server` folder, then run:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

The training notebook and its scikit-learn version were not included with this project. Replace the placeholder functions in `features.py` with the exact `MIRROR`, `clean()`, and `extract_features()` notebook code. Copy the trained `dyslexia_rf.joblib` into this folder. Change the unpinned `scikit-learn` line in `requirements.txt` to the exact version used to train the model. Until then, `/classify` returns a clear setup error.

## Find your PC's IPv4 address

Run `ipconfig` in PowerShell and find the IPv4 Address under your active Wi-Fi adapter. Set `API_URL` in `src/constants/config.js` to `http://YOUR_IPV4_ADDRESS:8000` when using the real server.

## Allow port 8000 through Windows Firewall

In an Administrator PowerShell window, add an inbound TCP rule for port 8000:

```powershell
New-NetFirewallRule -DisplayName "Dyslexia Support API 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

## Run

From this folder, with the virtual environment active:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Test each endpoint

In another PowerShell window:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/classify -ContentType 'application/json' -Body '{"intended":"bed","typed":"ded"}'
```

The classify request returns a setup message until the notebook features and model have been added.

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/summarize -ContentType 'application/json' -Body '{"text":"Plants use sunlight to make food. Their roots take in water. Leaves exchange gases with the air. Stems carry water through the plant. Flowers help many plants reproduce."}'
```

Study practice uses only sentences from the supplied text. The service validates the request and response with Pydantic:

```powershell
$practice = @{ text = "Plants use sunlight to make food. Their roots take in water. Leaves exchange gases with the air. Stems carry water through the plant. Flowers help many plants reproduce."; count = 5; difficulty = "Easy"; types = @("multiple_choice", "true_false", "short_answer"); ageBand = "general" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/study -ContentType 'application/json' -Body $practice
```
