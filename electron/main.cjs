const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

const DEV_SERVER_URL =
  process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173";

async function brickognizePredictParts(imageBytes) {
  const form = new FormData();
  const blob = new Blob([Buffer.from(imageBytes)], { type: "image/jpeg" });
  form.append("query_image", blob, "capture.jpg");

  const res = await fetch("https://api.brickognize.com/predict/parts/", {
    method: "POST",
    headers: { accept: "application/json" },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Brickognize error ${res.status}: ${text || res.statusText}`,
    );
  }
  return res.json();
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Bricksort",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  ipcMain.handle("brickognize:predictParts", async (_evt, imageBytes) => {
    return brickognizePredictParts(imageBytes);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

