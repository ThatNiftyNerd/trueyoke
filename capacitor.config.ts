import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.yoked.mobile",
  appName: "Yoked",
  // Vite outputs the static SPA bundle into ./dist; Capacitor copies this
  // directory into android/app/src/main/assets/public on `cap sync`.
  webDir: "dist",
};

export default config;
