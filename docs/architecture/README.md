# Architecture Overview

Developer Toolkit is a fully static single-page application (SPA). No build step, no server, no framework dependencies.

## Stack

| Layer | Technology |
| ------- | ----------- |
| Markup | HTML5 (semantic) |
| Styles | CSS3 custom properties + TailwindCSS CDN |
| Scripts | Vanilla JS ES6 modules (`<script type="module">`) |
| Routing | Hash-based (`#/`, `#/tool/:id`) |
| Storage | `localStorage` (settings, favorites, history) |
| PWA | Service Worker + Web App Manifest |
| CDNs | Highlight.js, Marked.js, js-yaml, QRCode.js, JsBarcode, GSAP |

## Module Graph

```
index.html
  └── app.js (bootstrap)
        ├── router.js          → dynamic import(toolDef.module)
        ├── event-bus.js       → pub/sub singleton
        ├── keyboard-shortcuts.js
        ├── navbar.component.js
        ├── sidebar.component.js
        ├── settings.component.js
        └── home.component.js

services/
  ├── theme.service.js
  ├── clipboard.service.js
  ├── download.service.js
  ├── toast.service.js
  ├── settings.service.js
  ├── history.service.js
  ├── favorites.service.js
  ├── ai-provider.service.js
  ├── analytics.service.js
  ├── keyboard.service.js
  └── storage.service.js

tools/[id]/index.js  (lazy-loaded per route)
  └── export mount(container), unmount()
```

## Routing

The router listens on `window.hashchange`. On navigation:

1. Find tool definition in `tools.config.js` by `toolId`
2. Dynamically `import(toolDef.module)` (cached after first load)
3. Call `previousTool.unmount()` if defined
4. Render tool container, call `tool.mount(container)`
5. Update `historyService`, document title, and sidebar active state

## CSS Architecture

Styles are layered:

1. **`variables.css`** — Design tokens (colors, spacing, typography, radius, shadows)
2. **`reset.css`** — Normalize / base styles
3. **`typography.css`** — Text utilities
4. **Component files** — Buttons, inputs, modals, toasts, etc.
5. **`tools.css`** — Tool layout grid (.tool-page, .tool-header, .tool-panel, .tool-tabs…)
6. **`animations.css`** — GSAP + CSS transitions
7. **TailwindCSS CDN** — Utility classes for one-off adjustments

## Tool Module Contract

```javascript
/**
 * @param {HTMLElement} container - The tool's mount point (div#tool-view)
 */
export async function mount(container) {
  container.innerHTML = buildUI();   // Synchronous HTML string
  bindEvents(container);             // Attach all listeners via container query
}

/**
 * Called before unmounting (navigating away).
 * Clean up: clearInterval, AbortController.abort(), removeEventListener
 */
export function unmount() {}
```

Rules:

- **No global state** — all state scoped to the module or passed via closure
- **Use `container.querySelector`** — never `document.querySelector` inside tools
- **Use shared services** — never implement copy/download/toast inline
- **Accessibility** — all interactive elements must have `aria-label` or visible label

## Services

All services are singleton instances exported from their module:

```javascript
// Usage
import { toastService } from '../../assets/js/services/toast.service.js';
toastService.success('Copied!');
```

## Event Bus

```javascript
import { eventBus, EVENTS } from '../../assets/js/core/event-bus.js';

// Subscribe
eventBus.on(EVENTS.THEME_CHANGE, ({ theme }) => { /* ... */ });

// Publish
eventBus.emit(EVENTS.THEME_CHANGE, { theme: 'dark' });
```

## Adding a New Tool

1. Create `tools/my-tool/index.js` with `mount()` and optionally `unmount()`
2. Add an entry to `assets/js/config/tools.config.js`:

   ```javascript
   {
     id: 'my-tool',
     name: 'My Tool',
     description: 'Short description',
     icon: '<svg>…</svg>',
     category: 'utilities',
     tags: ['tag1', 'tag2'],
     module: '../tools/my-tool/index.js',
     shortcut: 'G M',   // optional keyboard shortcut
   }
   ```

3. The tool is automatically added to the sidebar, home page, search, and command palette.
