# Lego Sorter

A desktop app (Electron) for rebuilding multiple official Lego sets from mixed bins. Based on the workflow from [this video](https://www.youtube.com/watch?v=qlhjs82RKiI): load sets, sort physically by **part type**, log finds by **color**, and route pieces to the right sets (smaller sets first).

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer (22+ recommended for the bundled Electron version)
- npm (comes with Node.js)
- A free [Rebrickable](https://rebrickable.com/register/) account and [API key](https://rebrickable.com/api/)

## Development

Install dependencies and run the app in development mode (Vite hot reload + Electron window):

```bash
cd lego-sorter
npm install
npm run dev
```

Paste your Rebrickable API key in **Settings**. It is stored only on your machine.

### Troubleshooting: `path.txt does not exist`

If Electron fails with a missing `path.txt` error, the binary download did not finish. Run:

```bash
npm run electron:install
npm run dev
```

## Building the Electron app

Building has two steps: compile the React UI, then package it with Electron.

### 1. Build the UI (`dist/`)

Compiles TypeScript and bundles the web app into `dist/`:

```bash
npm run build
```

### 2. Run the built app locally (no installer)

Opens Electron using the files in `dist/` (useful to verify a production build before packaging):

```bash
npm run build
npm run start
```

### 3. Package an unpacked app (`release/`)

Creates a runnable app folder without an installer (faster for testing packaging):

```bash
npm run pack
```

Output (macOS example):

```
release/mac-arm64/Lego Sorter.app
```

Open that `.app` directly from Finder, or run it from the terminal.

### 4. Build installers (`release/`)

Creates distributable installers for your current platform:

```bash
npm run dist
```

Outputs depend on the OS you run the command on:

| Platform | Typical outputs in `release/` |
|----------|-------------------------------|
| macOS    | `.dmg`, `.zip` (e.g. `Lego Sorter-1.0.0-arm64.dmg`) |
| Windows  | NSIS installer (e.g. `Lego Sorter Setup 1.0.0.exe`) |
| Linux    | `AppImage` (e.g. `Lego Sorter-1.0.0.AppImage`) |

To build for another platform from macOS, you may need extra setup (Wine for Windows, etc.). See [electron-builder multi-platform docs](https://www.electron.build/multi-platform-build).

### Build commands summary

| Command | What it does |
|---------|----------------|
| `npm run build` | Compile UI → `dist/` |
| `npm run start` | Run Electron against `dist/` |
| `npm run pack` | `build` + unpacked app in `release/` |
| `npm run dist` | `build` + installers in `release/` |
| `npm run dev` | Dev mode (Vite + Electron, not a release build) |
| `npm run dev:web` | Browser-only dev server |
| `npm run electron:install` | Re-download Electron binary if install failed |

### Project layout (build-related)

```
lego-sorter/
  dist/              # Built React app (created by npm run build)
  electron/
    main.mjs         # Electron main process
    preload.mjs      # Preload script
  release/           # Packaged apps (created by pack/dist)
  scripts/
    install-electron.mjs
```

## Workflow

1. **Sets** — Add set numbers (e.g. `6030`, `10261-1`). Parts load from Rebrickable.
2. **Master list** — All sets combined by part *type* (color ignored), sorted by how many you need most.
3. **Sort bins** — Pull pieces of one type from mixed bins.
4. **Log found pieces** — Click a master-list row, pick color and quantity, click **Add pieces**.
5. **Set routing** — See which sets need those pieces (smaller sets listed first). Put pieces in bags/piles per set.
6. If routing is empty, that color is not needed — set those pieces aside.
7. **Progress** — Track completion per set.
8. **Export / Import** — Backup or move sessions as JSON. Progress also auto-saves locally.

## Notes

- Rebrickable rate limit is about **1 request per second**; loading large sets may take a moment.
- API keys are stored in local app storage only.
- Session export files use `version: 1` for future compatibility.
- First `npm install` runs `electron:install` automatically via `postinstall`.
