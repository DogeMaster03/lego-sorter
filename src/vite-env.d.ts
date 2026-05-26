/// <reference types="vite/client" />

interface ElectronAPI {
  platform: NodeJS.Platform;
  brickognizePredictParts: (imageBytes: ArrayBuffer) => Promise<unknown>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
