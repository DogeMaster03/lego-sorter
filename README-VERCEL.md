# Deploy Bricksort to Vercel

## Why the 250 MB error happens

Vercel serverless functions have a **250 MB uncompressed** size limit. Bricksort includes **Electron** (~150 MB+) for the desktop app. Without special config, Vercel bundles that into your API and exceeds the limit.

This repo includes `vercel.json` and `api/` routes that:

- Deploy the React app as static files from `dist/`
- Run API routes as small serverless functions (Rebrickable + Brickognize proxies)
- Skip Electron install on Vercel

## Deploy steps

1. Push the `nodejs` branch (or `main` with these files) to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. **Root directory:** `bricksort` (if the repo root is `vibecoding`, set this).
4. **Environment variable** (required):

   | Name | Value |
   |------|--------|
   | `REBRICKABLE_API_KEY` | Your [Rebrickable API key](https://rebrickable.com/api/) |

5. Deploy. Vercel uses:
   - **Build command:** `npm run build:vercel`
   - **Output directory:** `dist`
   - **Install command:** skips Electron postinstall and removes Electron packages

## Notes

- The API key is read from `REBRICKABLE_API_KEY` only (not saved in the browser or in-memory on Vercel).
- Camera / Brickognize works via `/api/brickognize/predict-parts`.
- Session data still saves in the browser (`localStorage`).
- For local development with the Node server, use `npm run dev:node` as before.
