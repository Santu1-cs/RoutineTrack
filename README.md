# RoutineTrack 🕐

A personal daily routine & productivity manager. Mobile-first, installable as a PWA, works fully offline, all data stays on your device.

## Quick start (local)

```bash
cd routinetrack
python3 -m http.server 8765
# open http://localhost:8765
```

On your phone, replace `localhost` with the machine's LAN IP, e.g. `http://192.168.x.x:8765`.

## Install as a PWA (recommended)

- **Android / Chrome / Edge:** open the app → menu → **Add to Home Screen / Install app**
- **iOS Safari:** open → Share → **Add to Home Screen**
- **Desktop Chrome / Edge:** look for the install icon in the address bar

Once installed, the app runs offline and feels like a native app.

## Features

**Today tab**
- Progress donut showing % done + streak counter
- Timeline grouped by Morning / Afternoon / Evening / Night
- Tap an activity's check button: `pending → ✓ done → — skipped → pending`
- Calendar button jumps to any past/future date

**History tab**
- 4 stat cards (current streak, best streak, days logged, avg completion)
- Month calendar heatmap — tap any day to open its detail modal
- Category breakdown over the last 30 days
- Time-of-day bar chart showing when your activities cluster

**Settings tab**
- Add / edit / delete schedule items (title, time, duration, category)
- 7 built-in categories with distinct colors
- Export / Import full JSON backup
- Reset all data

## Project structure

```
routinetrack/
├── index.html              # App shell, tabs, modal/toast roots
├── app.css                 # Mobile-first dark theme
├── data.js                 # Default schedule & categories
├── store.js                # localStorage persistence + stats
├── render.js               # Views (Today/History/Settings) + modals
├── app.js                  # Controller / event wiring
├── sw.js                   # Service worker (offline cache)
├── manifest.webmanifest    # PWA manifest
├── icon.svg                # App icon
├── .gitignore
├── LICENSE
└── README.md
```

## Push to GitHub

### Option 1: One-command push (with GH_TOKEN env var)

```bash
# 1. Generate a personal access token at https://github.com/settings/tokens
#    Scopes: repo (classic token)

# 2. Export it and run the push script
export GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export REPO="your-github-username/your-repo-name"   # must already exist

# 3. Push
bash deploy.sh
```

### Option 2: Manual git push (works anywhere)

```bash
cd routinetrack
git init
git add .
git commit -m "Initial commit: RoutineTrack v1"

# Create an empty repo on GitHub first, then:
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

### Option 3: GitHub Pages (optional live deployment)

After pushing, if you want a live URL at `https://USER.github.io/REPO/`:

```bash
# From the repo, run:
gh repo deploy --site-pages   # gh CLI, or use Settings → Pages in GitHub UI
```

Then set repository **Settings → Pages → Source → Deploy from a branch → main / root**.

The GitHub Actions workflow included here will also auto-deploy on every push to `main`.

## Data

Everything is stored in your browser's `localStorage` under keys like `rt.schedule.v1`, `rt.log.v1`. Nothing is uploaded anywhere. Use **Export** in Settings to back up or move between devices.

## License

MIT — see [LICENSE](LICENSE).
