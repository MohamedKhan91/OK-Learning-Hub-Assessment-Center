# NOK Drive sync — 2-minute setup

Your site stores every trainee's results directly in your Google Drive:
1. In your NOK Drive folder → New → Google Sheets → name it **NOK Trainee Records**.
2. Extensions → Apps Script → paste the whole contents of `NOK-Drive-Sync.apps-script.js` → Save.
3. Deploy → New deployment → **Web app** → Execute as: **Me** → Who has access: **Anyone** → Deploy → authorize.
4. Copy the Web app URL (ends in `/exec`) → open the site → **Trainer** tab → section 5 → paste → **Save & test**.

From then on every badge a trainee earns auto-writes their row (name, XP, badges, tracks, coach rank, full share code). One row per person, updated live. "Pull roster from Drive" rebuilds the dashboard anywhere. CSV export unchanged.

Tip: send the /exec URL to be baked into the published site file and every trainee device auto-syncs with zero steps.
