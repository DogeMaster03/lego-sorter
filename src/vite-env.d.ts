/// <reference types="vite/client" />

interface ElectronAPI {
  platform: NodeJS.Platform;
}

interface Window {
  electronAPI?: ElectronAPI;
}
