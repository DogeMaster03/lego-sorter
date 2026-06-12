import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { useSessionStore } from "./store/sessionStore";

import { initTheme } from "./lib/theme";

useSessionStore.getState().initSession();
initTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
