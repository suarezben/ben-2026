import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { waitForWebFonts } from "./wait-for-webfonts";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root");
}

void waitForWebFonts()
  .catch(() => {
    /* waitForWebFonts should not reject; guard anyway so first paint always mounts */
  })
  .then(() => {
    createRoot(rootEl).render(<App />);
    if (import.meta.env.DEV) {
      const t = document.title.replace(/\s*·\s*dev\s*$/i, "").trim();
      document.title = t ? `${t} · dev` : "· dev";
      console.info(
        "%cVite dev",
        "color:#166534;font-weight:bold",
        `— ${window.location.origin} (this tab is the live dev server; Cmd+Shift+R if something looks stale)`
      );
    }
  });
  