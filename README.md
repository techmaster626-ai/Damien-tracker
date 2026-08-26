# 🤽‍♂️ Water Polo Stats Tracker

> A modern, real-time Water Polo scorekeeping, analytics, Firebase Cloud Sync, and live broadcast overlay platform inspired by [`water-polo-stats.com`](https://water-polo-stats.com/) and built to NCAA & World Aquatics (FINA) electronic scorekeeping standards.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firebase: Firestore & Auth](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28?logo=firebase&logoColor=black)](firestore.rules)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?logo=javascript&logoColor=black)](js/)
[![HTML5](https://img.shields.io/badge/HTML5-Modern%20Semantic-E34F26?logo=html5&logoColor=white)](index.html)
[![CSS3](https://img.shields.io/badge/CSS3-Aquatic%20Glassmorphism-1572B6?logo=css3&logoColor=white)](styles/)
[![NCAA & FINA Standards](https://img.shields.io/badge/Standards-NCAA%20%7C%20World%20Aquatics-00E5FF)](#-official-box-score--advanced-metrics)
[![MaxPreps Compatible](https://img.shields.io/badge/Export-MaxPreps%20Compatible-FFB300)](#-maxpreps--reports-export)

---

## ⚡ Quick Start

No Node/npm build steps or complex dependencies required! It runs completely in the browser as a standalone pure client-side application.

### Option 1: Direct File
Simply double-click or open **[`index.html`](index.html)** in Google Chrome, Safari, Edge, or Firefox.

### Option 2: Local Web Server (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File server.ps1 -Port 8080
```
Then navigate to **`http://localhost:8080`** in your browser.

---

## ☁️ Firebase Cloud Sync & Real-Time Live Sharing

The app includes built-in **Firebase Cloud Firestore** integration:

- **Real-Time Live Broadcast Sync (`onSnapshot`)**: Scorekeepers can host a match with 1 click (`📡 Start Live Broadcast Sync`). Every goal, save, exclusion timer, and score change is pushed to Firestore in real-time.
- **Spectator & Stream Live Link**: Spectators, coaches, and OBS broadcast computers can enter the Live Room ID or visit `https://your-site/?room=<MATCH_ID>` to receive live score updates with zero latency.
- **Cloud Match Storage**: Save and load full match records, rosters, and shot maps to/from Cloud Firestore.
- **Offline Fallback**: Seamless local storage fallback when working offline poolside.

---

## ✨ Features Overview

### 1. ⏱️ Live Match Command Center & Clocks
- **Game Clock**: Quarter lengths (8:00, 7:00, 6:00, 5:00), Play/Pause with <kbd>Space</kbd>, +10s / -10s quick bumps, and manual time editing modal.
- **Shot Clock (30s / 20s)**: Visual countdown ring with dedicated reset buttons for 30s possessions (<kbd>S</kbd>) and 20s exclusions / corner resets (<kbd>E</kbd>).
- **Web Audio API Sound Synthesizer**: Realistic synthesized referee pea whistles (short chirp & long stoppage), arena electric buzzers (<5s warning), and deep goal horn sound effects.
- **Active 20-Second Exclusion Penalty Box**: Real-time counting timers for ejected players with one-click **"Wave In"** early release upon goals or turnovers.
- **Foul-Out Tracking**: Automatic amber warning on 2 exclusions and red foul-out badges upon reaching 3 major fouls (rolled out).
- **Situational Alerts**: Live **"6 ON 5 MAN UP"** power play status indicator.

---

### 2. 🗺️ Interactive SVG Pool Court & Goal Mouth Heatmap
- **Regulation Water Polo Pool**: Regulation markings including **2m offside line** (red cone), **5m penalty line** (yellow cone), **6m direct shot line** (green marker), half distance line (15m), and corner re-entry zones.
- **Interactive Shot Placement**: Click/tap anywhere on the pool court to drop shot coordinates with trajectory lines to the cage.
- **3x3 Goal Mouth Target Grid**: 9 placement quadrants (*Top-Left, Top-Center, Top-Right, Mid-Left, Center GK, Mid-Right, Low-Left Skip, Low-Center, Low-Right Skip*, plus *Crossbar*, *Post*, and *Wide*).
- **Outcome Filtering**: Filter shot markers by team (Home/Away), quarter (Q1–Q4), and outcome (Goal 🟢, Goalie Save 🔵, Miss 🔴, Field Block 🟡).

---

### 3. 📊 Official Box Score & Advanced Analytics
- **Quarter-by-Quarter Table**: Period scores for Q1, Q2, Q3, Q4, and Overtime.
- **Situational Efficiency Gauges**:
  - **6-on-5 Man Up Conversion Rate** (e.g. `4/7 (57.1%)`)
  - **5-on-6 Penalty Kill Defense Rate** (e.g. `71.4%`)
  - **5-Meter Penalty Conversion Rate** (e.g. `2/2 (100.0%)`)
  - **Shooting Accuracy** (`Goals / Total Shots`)
- **Full Player Stat Sheets**:
  - `Cap`, `Player Name`, `Position`, `Goals (G)`, `Shots (SH)`, `Shooting % (SH%)`, `Assists (A)`, `Points (PTS)`, `Steals (ST)`, `Blocks (BLK)`, `Exclusions (EXC)`, `Exclusions Drawn (EXD)`, `Penalty Fouls (PFC)`, `Penalty Drawn (PFD)`, `Turnovers (TO)`, `Sprints Won (SPR)`.
- **Goalkeepers Analysis**:
  - `Saves (SV)`, `Goals Allowed (GA)`, `Shots Faced (SF)`, `Save % (SV%)`, `Penalty Saves (PSV)`, `Steals`, `Assists`.

---

### 4. 🎥 Broadcast Scorebug & Live Stream Overlay
Inspired by `water-polo-stats.com` broadcast capabilities:
- **Floating Stream HUD**: Clean, high-contrast broadcast scoreboard suitable for OBS Studio, vMix, YouTube, or Twitch streaming browser sources.
- **Chroma-Key Modes**: 1-click toggle between **Transparent** and **Green Screen** (`#00b140`) modes.
- **Live Active Exclusion Badges**: Real-time exclusion countdown timers embedded directly on the stream scorebug.
- **Fullscreen Arena Mode**: Connect laptop to poolside monitors or TVs.

---

### 5. 💾 MaxPreps & Reports Export
- **MaxPreps 1-Click Export**: Formatted plain-text and table report matching MaxPreps water polo scorekeeper with 1-click clipboard copy.
- **Official Printable Score Sheet**: Formatted high-contrast PDF/print layout for referee signatures and scorebooks.
- **CSV Downloads**: Separate Play-by-Play and Box Score spreadsheet exports.
- **JSON Match Backup & Restore**: Save matches to disk and reload previous matches.
- **Social Media Graphic Share Card**: High-res 1200x630 canvas-rendered match graphic with scores and key metrics.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|:---|:---|
| <kbd>Space</kbd> | Start / Pause Game Clock |
| <kbd>S</kbd> | Reset Shot Clock to 30 Seconds |
| <kbd>E</kbd> | Reset Shot Clock to 20 Seconds (Exclusion / Corner) |
| <kbd>G</kbd> | Log Goal (Opens Goal Details Modal) |
| <kbd>F</kbd> | Log 20s Exclusion Foul (Starts Penalty Timer) |
| <kbd>V</kbd> | Log Goalkeeper Save |
| <kbd>M</kbd> | Log Missed Shot / Hit Bar |
| <kbd>Z</kbd> | Undo Last Logged Event |

---

## 📁 Repository Structure

```
water-polo-stats/
├── index.html                   # Main single-page application entry point
├── styles/
│   ├── main.css                 # Design tokens, aquatic theme, modals & layout
│   ├── scoreboard.css           # Scoreboard HUD, game clock, 30s/20s shot clock & exclusion box
│   ├── pool-map.css             # SVG pool court & 3x3 goal mouth selector
│   ├── boxscore.css             # NCAA/FINA box scores, analytics & play-by-play styles
│   └── overlay.css              # Broadcast scorebug HUD, chroma-key & print styles
├── js/
│   ├── app.js                   # Application orchestrator, event bus & hotkeys
│   ├── state.js                 # Reactive match state & FINA/NCAA stat calculations
│   ├── audio.js                 # Web Audio API synthesizer (whistles, buzzers, horns)
│   ├── pool-chart.js            # Interactive pool shot map & goal target grid
│   ├── boxscore.js              # Box scores, situational gauges & goalie tables
│   ├── pbp.js                   # Play-by-Play live feed
│   ├── exporter.js              # MaxPreps, PDF, CSV, JSON & PNG share card generator
│   ├── presets.js               # Pre-loaded demo matches (Olympic Final, NCAA Championship)
│   ├── firebase-config.js       # Firebase Modular v10 SDK loader & config
│   └── cloud-sync.js            # Firestore live room syncing & cloud storage
├── .github/
│   └── workflows/
│       └── deploy.yml           # Automated GitHub Pages CI/CD workflow
├── firebase.json                # Firebase Firestore & Hosting configuration
├── firestore.rules              # Validated Firestore security rules
├── firestore.indexes.json       # Firestore database indexes
├── .firebaserc                  # Firebase project identifier
├── server.ps1                   # Lightweight PowerShell static web server
├── package.json                 # Project metadata & keywords
├── .gitignore                   # Standard ignore rules
├── LICENSE                      # MIT License
└── README.md                    # Project documentation
```

---

## 🚀 Deploying

### Option A: GitHub Pages
1. Push this codebase to GitHub:
   ```bash
   git remote add origin https://github.com/techmaster626-ai/Damien-tracker.git
   git push -u origin main
   ```
2. In repository **Settings > Pages > Build and deployment > Source**, select **GitHub Actions**. Your live web app will automatically be available at:
   👉 **https://techmaster626-ai.github.io/Damien-tracker/**

### Option B: Firebase Hosting
```bash
firebase deploy --only hosting,firestore
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
