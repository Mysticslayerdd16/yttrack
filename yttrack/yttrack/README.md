# YTTrack — YouTube Music Tracker

Automatically tracks every YouTube song you play and displays them in a personal dashboard hosted on GitHub Pages, with data stored in Supabase.

---

## Setup (do this once, ~15 minutes total)

### Step 1 — Set up Supabase database

1. Go to [supabase.com](https://supabase.com) and open your project
2. Click **SQL Editor** in the left sidebar → **New Query**
3. Copy everything from `SUPABASE_SETUP.sql` and paste it in → click **Run**
4. You should see "Success. No rows returned"

---

### Step 2 — Deploy dashboard to GitHub Pages

1. Go to [github.com](https://github.com) → click **+** → **New repository**
2. Name it `yttrack` → set to **Public** → click **Create repository**
3. Upload this entire folder (drag and drop all files into the repository page)
4. Go to **Settings** → **Pages** (in the left sidebar)
5. Under **Source**, select **GitHub Actions**
6. Go to **Actions** tab — you'll see the deploy workflow running automatically
7. Once it finishes (~2 minutes), your dashboard is live at:
   `https://YOUR_USERNAME.github.io/yttrack`

---

### Step 3 — Install the Chrome extension

1. Open `extension/popup.html` and replace `YOUR_GITHUB_PAGES_URL` with your actual URL from Step 2
2. Open Chrome → go to `chrome://extensions`
3. Toggle **Developer mode** ON (top right)
4. Click **Load unpacked**
5. Select the `extension/` folder from this project
6. The YTTrack icon will appear in your Chrome toolbar

---

### Step 4 — Start tracking!

1. Go to YouTube and play any song
2. After ~5 seconds, it'll be tracked automatically
3. Open your dashboard at your GitHub Pages URL to see it appear in real time

---

## How song detection works

The extension uses multiple signals to decide if a video is a song:

| Signal | Weight |
|---|---|
| On `music.youtube.com` | Strong ✓ |
| Channel ends in `- Topic` | Strong ✓ |
| VEVO channel | Strong ✓ |
| Title contains `lyrics`, `official audio`, `ft.`, `remix`, etc. | Medium ✓ |
| Duration between 1.5 and 10 minutes | Medium ✓ |
| Contains words like `podcast`, `tutorial`, `gaming`, `vlog` | Excluded ✗ |

---

## Project structure

```
yttrack/
├── dashboard/              React app (deployed to GitHub Pages)
│   └── src/
│       ├── App.jsx         Main dashboard UI
│       ├── App.css         Styles
│       ├── supabase.js     Database connection
│       └── index.js        Entry point
├── extension/              Chrome extension
│   ├── manifest.json       Extension config
│   ├── content.js          Song detection logic
│   ├── background.js       Service worker
│   └── popup.html          Extension popup UI
├── .github/workflows/
│   └── deploy.yml          Auto-deploy to GitHub Pages
└── SUPABASE_SETUP.sql      Database schema
```

---

## Updating your dashboard

Any time you push changes to the `main` branch on GitHub, the dashboard will automatically rebuild and redeploy via GitHub Actions.
