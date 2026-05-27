# Bricksort — Node.js branch

This branch runs Bricksort as a **web app + Express API** instead of the Electron desktop app.

- **Frontend:** React (Vite) in the browser
- **Backend:** Node.js + Express on port `3001`
- **APIs:** Rebrickable and Brickognize are called from the server (your API key stays on the machine running Node)

## Development

```bash
cd bricksort
npm install
npm run dev:node
```

Open http://localhost:5173

Optional: set `REBRICKABLE_API_KEY` in the environment before starting the server so you skip entering it in Settings:

```bash
export REBRICKABLE_API_KEY=your_key_here
npm run dev:node
```

## Production (single Node process)

```bash
npm run build:node
npm run start:node
```

Open http://localhost:3001

## Branches

| Branch | How to run |
|--------|------------|
| `main` | `npm run dev` — Electron desktop app |
| `nodejs` | `npm run dev:node` — Browser + Node server |

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Server status |
| GET/POST | `/api/settings/rebrickable-key` | Configure Rebrickable key |
| GET | `/api/sets/:setNum` | Load set inventory |
| GET | `/api/parts/:partNum/sets` | Find sets containing a part |
| POST | `/api/brickognize/predict-parts` | Camera identify (JPEG bytes) |

Session data (sets loaded, progress) still saves in the browser via `localStorage`.
