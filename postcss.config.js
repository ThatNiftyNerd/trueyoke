// Tailwind v4 emits modern CSS (oklch() colors, color-mix(), @layer cascade
// layers, :has()) that older WebView engines don't understand -- notably the
// stock WebView on Android 11 (Chromium ~83) if a device hasn't picked up a
// Play Store WebView update. postcss-preset-env transpiles the three
// statically-polyfillable ones down to broadly-supported CSS; :has() can't be
// polyfilled at build time, so its client-side runtime polyfill is wired in
// src/main.tsx instead (see css-has-pseudo/browser import there).
export default {
  plugins: {
    "postcss-preset-env": {
      stage: false,
      features: {
        "oklab-function": { preserve: false },
        "color-mix": { preserve: false },
        "cascade-layers": true,
        "has-pseudo-class": true,
      },
      enableClientSidePolyfills: true,
      autoprefixer: {},
    },
  },
};
