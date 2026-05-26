const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  brickognizePredictParts: (imageBytes) =>
    ipcRenderer.invoke("brickognize:predictParts", imageBytes),
});

