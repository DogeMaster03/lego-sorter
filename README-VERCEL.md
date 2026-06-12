# Deploy Bricksort to Vercel

## Why the 250 MB error happens

Vercel serverless functions have a **250 MB uncompressed** size limit. Bricksort includes **Electron** (~150 MB+) for the desktop app. Without special config, Vercel bundles that into your API and exceeds the limit.

This repo includes `vercel.json` and `api/` routes that:

- Deploy the React app as static files from `dist/`
- Run API routes as small serverless functions (Rebrickable + Brickognize proxies)
- Skip Electron install on Vercel

## Deploy steps

1. Push the `nodejs` branch to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. **Root directory:** `bricksort` (required if the repo root is `vibecoding`).
4. **Framework preset:** Vite (should auto-detect from `vercel.json`; if not, set manually).
5. **Environment variable** (optional — if set, Settings is read-only):

   | Name | Value |
   |------|--------|
   | `REBRICKABLE_API_KEY` | Your [Rebrickable API key](https://rebrickable.com/api/) |

   If you skip this, open **Settings** after deploy and paste your key. It is stored in your browser and sent with each API request (needed for Camera → Find sets).

6. Deploy. Vercel uses:
   - **Framework:** Vite
   - **Build command:** `npm run build:vercel`
   - **Output directory:** `dist`
   - **Install command:** skips Electron postinstall and removes Electron packages

## Troubleshooting

### "No entrypoint found"

Vercel tried to deploy as a Node server instead of a Vite static site. Fix:

1. Set **Root Directory** to `bricksort` (so `vercel.json` is found).
2. Set **Framework Preset** to **Vite** in Project Settings → General.
3. Ensure **Build Command** is `npm run build:vercel` and **Output Directory** is `dist`.
4. Do **not** set a custom Node.js entrypoint or `start` command in Vercel.

### 250 MB function size

Ensure the install command in `vercel.json` runs (skips Electron). Redeploy after pulling the latest `nodejs` branch.

## Notes

- The API key can come from **Settings** (browser `localStorage`, sent per request) or from **`REBRICKABLE_API_KEY`** on the server.
- Camera / Brickognize works via `/api/brickognize/predict-parts`.
- Session data still saves in the browser (`localStorage`).
- For local development with the Node server, use `npm run dev:node` as before.
