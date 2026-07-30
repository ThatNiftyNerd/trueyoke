import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import cssHasPseudo from "css-has-pseudo/browser";

import "./styles.css";
import { getRouter } from "./router";
import { SessionGate } from "./features/auth/SessionGate";
import { startOAuthDeepLinkListener } from "./features/auth/deep-link";
import { ThemeProvider } from "./theme/ThemeProvider";

// :has() can't be polyfilled at build time (it's a runtime selector-matching
// feature) -- this is a no-op on browsers/WebView with native support
// (Chrome 105+) and only does work on older engines (relevant down to the
// Android 11 floor, see postcss.config.js).
cssHasPseudo(document);

// Catches the native OAuth redirect (no-op on web).
startOAuthDeepLinkListener();


const router = getRouter();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider>
      <SessionGate>
        <RouterProvider router={router} />
      </SessionGate>
    </ThemeProvider>
  </StrictMode>,
);
