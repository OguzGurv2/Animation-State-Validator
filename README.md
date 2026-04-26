# Lottie + Rive Testing Environment

A lightweight Vite app for testing animation assets in the browser.

## Features

- Built-in presets using local files in this repo:
  - Lottie: `assets/lottie/select-advanced-plan/idle.json`, `assets/lottie/select-advanced-plan/click.json`, `assets/lottie/select-advanced-plan/hover.json`, `assets/lottie/select-advanced-plan/hover-off.json`
  - Rive: `assets/rive/cart-icon-final.riv`
- Startup auto-select with idle-first priority.
- Playback controls for both players (`play`, `pause`, `stop`).
- Chip-based state management for both engines:
  - Select animation and state from chips.
  - Delete individual states.
  - Delete whole animations.
- Modal workflow for Lottie authoring:
  - Add a new animation with one or more states.
  - Add additional states later to an existing animation.

## Project Structure

```text
.
├─ assets/
├─ src/
│  ├─ main.js                  # bootstrap wiring
│  ├─ lottie.js                # Lottie runtime + state manager
│  ├─ rive.js                  # Rive runtime + state manager
│  ├─ chips.js                 # reusable chip/control UI helpers
│  ├─ modal.js                 # Lottie modal controller
│  ├─ helpers/preset-utils.js  # pure preset/deletion helper functions
│  └─ style.css                # UI styling
├─ test/
│  └─ preset-utils.test.js
├─ index.html
└─ vite.config.js
```

## Quick Start

```bash
npm install
npm run dev
```

Then open the local Vite URL: `http://localhost:300/`.

## Build Check

```bash
npm run build
```

## Tests

```bash
npm test
```
