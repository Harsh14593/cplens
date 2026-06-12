# CPLens

**Unified competitive programming analytics across Codeforces, LeetCode, and CodeChef.**

CPLens pulls your contest history, submission patterns, and rating trends from all three platforms into one dashboard — with an AI study plan, a global leaderboard, a GitHub-style activity heatmap, and shareable profile cards.

🔗 **[cplens.vercel.app](https://cplens.vercel.app)**

---

## Features

| Feature | Description |
|---|---|
| **Unified Dashboard** | CF + LC + CC ratings, contest history, and stats in one view |
| **CP Score** | Composite score (0–3000) and tier ranking across all platforms |
| **AI Study Plan** | Gemini-powered plan targeting your weak topics and current level |
| **Activity Heatmap** | GitHub-style 365-day submission grid, merged across all platforms |
| **Progress Tracker** | Firestore-backed daily snapshots with sparkline charts and all-time deltas |
| **Global Leaderboard** | Ranked by CP Score across all CPLens users |
| **Contest Calendar** | Upcoming CF + LC contests with live countdown timers and Google Calendar export |
| **Head-to-Head Compare** | Side-by-side stats, dual skill radar, category win tally, shareable URL |
| **README Card** | Embeddable SVG card for your GitHub profile (`![CPLens](url)`) |
| **Public Profile** | Shareable `/u?codeforces=handle` page — no login required |
| **Skill Radar** | Topic-level accuracy radar across DP, Graphs, Trees, Math, and more |
| **Problem Recommendations** | Weak-tag-based problem suggestions from CF, LC, and CC |

---

## Tech Stack

**Frontend**
- React 19, React Router v7
- Recharts (rating history, skill radar, sparklines)
- Firebase Auth (Google OAuth) + Firestore (progress snapshots, leaderboard)
- Deployed on **Vercel**

**Backend**
- FastAPI + Uvicorn
- Codeforces API, LeetCode GraphQL, CodeChef scraper
- Google Gemini (`gemini-2.5-flash`) for AI study plan generation
- SVG card generation with 1-hour in-memory cache
- Deployed on **Render**

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React Frontend                    │
│  Dashboard  │  Compare  │  Leaderboard  │  Contests │
└────────────────────┬────────────────────────────────┘
                     │ REST (axios)
┌────────────────────▼────────────────────────────────┐
│                  FastAPI Backend                     │
│  /api/codeforces  /api/leetcode  /api/codechef       │
│  /api/ai          /api/card      /api/contests       │
└──────┬──────────────────┬──────────────────┬────────┘
       │                  │                  │
  CF API (REST)   LC GraphQL API      Gemini API
                              │
                    ┌─────────▼──────────┐
                    │  Firebase (client) │
                    │  Auth + Firestore  │
                    └────────────────────┘
```

---

## Local Setup

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# create backend/.env
echo "GEMINI_API_KEY=your_key_here" > .env
echo "ALLOWED_ORIGINS=http://localhost:3000" >> .env

uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install

# create frontend/.env.local
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local
# add your Firebase config vars (REACT_APP_FIREBASE_*)

npm start
```

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GEMINI_API_KEY` | backend `.env` | Google AI Studio API key |
| `ALLOWED_ORIGINS` | backend `.env` | Comma-separated allowed CORS origins |
| `REACT_APP_API_URL` | frontend `.env.local` | Backend base URL |
| `REACT_APP_FIREBASE_*` | frontend `.env.local` | Firebase project config |

---

## README Card

Add your CPLens stats to any GitHub README:

```markdown
[![CPLens](https://your-render-url.onrender.com/api/card/YOUR_CF_HANDLE?lc=YOUR_LC&cc=YOUR_CC)](https://cplens.vercel.app/u?codeforces=YOUR_CF_HANDLE)
```

---

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth.uid == uid;
    }
    match /leaderboard/{uid} {
      allow read: if true;
      allow write: if request.auth.uid == uid;
    }
  }
}
```

---

## Project Structure

```
cplens/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, router registration
│   ├── routers/
│   │   ├── codeforces.py        # CF user, contests, analyze endpoints
│   │   ├── leetcode.py          # LC profile + submission calendar
│   │   ├── codechef.py          # CC scraper
│   │   ├── ai.py                # Gemini study plan
│   │   ├── card.py              # SVG profile card (cached)
│   │   ├── contests.py          # Upcoming CF + LC contests
│   │   └── recommendations.py  # Weak-tag problem suggestions
│   └── analysis/
│       └── engine.py            # Tag stats, activity heatmap, insights
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.js     # Main analytics dashboard
    │   │   ├── Compare.js       # Head-to-head comparison
    │   │   ├── Leaderboard.js   # Global CP Score rankings
    │   │   ├── Contests.js      # Contest calendar + countdown
    │   │   └── PublicProfile.js # Shareable public view
    │   ├── components/
    │   │   ├── CPScore.js       # Composite score + tier badge
    │   │   ├── ActivityHeatmap.js
    │   │   ├── ProgressTracker.js
    │   │   ├── SkillRadar.js
    │   │   └── StudyPlan.js
    │   └── utils/
    │       └── progress.js      # Firestore snapshot helpers
```
