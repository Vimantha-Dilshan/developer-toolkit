# Developer Toolkit

> **The Ultimate Collection of Free Developer Tools** — A production-quality, offline-capable progressive web app with 28 tools built entirely in Vanilla JS, hosted on GitHub Pages.

[![GitHub Pages](https://img.shields.io/badge/Live-GitHub%20Pages-blueviolet?logo=github)](https://your-username.github.io/developer-toolkit)
[![PWA](https://img.shields.io/badge/PWA-Installable-success?logo=pwa)](https://your-username.github.io/developer-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

### 🛠️ 13 Core Developer Tools

| Tool | Description |
| ------ | ------------- |
| **JSON Formatter** | Format, minify, validate, and tree-view JSON with search |
| **JWT Decoder** | Decode JWT tokens — header, payload, claims, expiry countdown |
| **UUID Generator** | Generate UUID v1/v4/v7, ULID, NanoID — bulk mode |
| **SQL Formatter** | Format SQL with MySQL/PostgreSQL/SQLite/T-SQL/Oracle dialects |
| **Regex Tester** | Live match highlighting, replace mode, flags, cheatsheet |
| **API Tester** | Mini Postman — GET/POST/PUT/DELETE, auth, headers, cURL export |
| **Docker Generator** | Generate docker-compose.yml + Dockerfile + .env.example |
| **ENV Comparator** | Compare two .env files — missing, extra, and changed keys |
| **Markdown Preview** | GitHub-style Markdown editor + split preview |
| **cURL Converter** | Convert cURL to JS/Python/axios/got/HTTPie |
| **AI Commit Generator** | Git diff → conventional commit messages (local + AI providers) |
| **OpenAPI Viewer** | Render Swagger/OpenAPI specs interactively |
| **Base64 Tool** | Encode/decode text, files, and images |

### 🎁 15 Bonus Tools

| Tool | Description |
| ------ | ------------- |
| **Password Generator** | Cryptographic passwords with entropy meter |
| **Hash Generator** | SHA-1/256/384/512, HMAC, file hashing, verify |
| **Timestamp Converter** | Unix ↔ human-readable dates, batch, live clock |
| **Color Picker** | HEX/RGB/HSL/HSV/CMYK, WCAG contrast, shades palette |
| **URL Encoder** | Encode/decode, URL parser, URL builder |
| **QR Code Generator** | Text, URL, vCard, WiFi, Email, SMS — download PNG |
| **JSON Compare** | Deep diff two JSON objects — added/removed/changed |
| **CSV ↔ JSON** | Convert CSV to JSON and back with table preview |
| **XML Formatter** | Format, minify, validate XML |
| **YAML Formatter** | Format YAML, convert YAML ↔ JSON |
| **Lorem Ipsum** | Words, sentences, paragraphs, HTML output |
| **Diff Checker** | Line-level text diff — split and unified views |
| **Cron Parser** | Human-readable cron descriptions + next N execution times |
| **HTML Entity Encoder** | Encode/decode HTML entities + reference table |
| **Barcode Generator** | Code128, EAN-13, UPC-A, Code39 — download PNG/SVG |

### 🎨 UI/UX

- **Premium dark/light theme** with glassmorphism and smooth transitions
- **Command palette** (`Ctrl+K` / `⌘K`) for instant tool navigation
- **Keyboard shortcuts** — `G J` for JSON Formatter, `G U` for UUID Generator, etc.
- **Favorites & recent tools** — persisted to localStorage
- **PWA** — installable, works fully offline via service worker
- **Responsive** — works on desktop, tablet, and mobile
- **WCAG 2.1 AA** — full keyboard navigation and screen reader support
- **Full SEO** — semantic HTML, meta tags, JSON-LD structured data

### ⚡ Performance

- No React/Vue/Angular — pure Vanilla JS ES6 modules
- No build step — clone and open `index.html`
- Lazy-loaded tool modules — only loaded when visited
- CDN libraries: TailwindCSS, Highlight.js, Marked.js, js-yaml, QRCode.js, JsBarcode

---

## 🚀 Getting Started

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/developer-toolkit.git
cd developer-toolkit

# Open in browser (any static file server)
npx serve .
# or
python -m http.server 8080
# or just open index.html directly in your browser
```

> **Note:** Some features (service worker, ES modules via `file://`) require a web server. Use `npx serve .` or VS Code's Live Server extension for the best experience.

### Deploy to GitHub Pages

1. Fork this repository
2. Go to **Settings → Pages**
3. Set source to **GitHub Actions**
4. Push to `main` — the workflow automatically deploys

Or use the included workflow manually:

```bash
git push origin main  # Triggers .github/workflows/deploy.yml
```

---

## 📁 Project Structure

```
developer-toolkit/
├── index.html                    # SPA entry point
├── manifest.json                 # PWA manifest
├── service-worker.js             # Offline cache
├── robots.txt / sitemap.xml      # SEO
│
├── assets/
│   ├── css/
│   │   ├── themes/               # CSS custom property tokens
│   │   ├── components/           # Buttons, inputs, cards, modals…
│   │   └── tools/                # Tool-specific styles
│   ├── js/
│   │   ├── app.js                # App bootstrap
│   │   ├── config/               # App config, tool registry
│   │   ├── core/                 # Router, event bus, keyboard shortcuts
│   │   ├── services/             # Clipboard, toast, theme, AI, download…
│   │   ├── utils/                # DOM, debounce, format helpers
│   │   └── components/           # Navbar, sidebar, settings, home
│   └── icons/                    # SVG favicon & PWA icons
│
├── tools/                        # Tool modules (lazy-loaded)
│   ├── json-formatter/index.js
│   ├── jwt-decoder/index.js
│   ├── uuid-generator/index.js
│   ├── sql-formatter/index.js
│   ├── regex-tester/index.js
│   ├── api-tester/index.js
│   ├── docker-generator/index.js
│   ├── env-comparator/index.js
│   ├── markdown-preview/index.js
│   ├── curl-converter/index.js
│   ├── ai-commit-generator/index.js
│   ├── openapi-viewer/index.js
│   ├── base64-tool/index.js
│   ├── password-generator/index.js
│   ├── hash-generator/index.js
│   ├── timestamp-converter/index.js
│   ├── color-picker/index.js
│   ├── url-encoder/index.js
│   ├── qr-generator/index.js
│   ├── json-compare/index.js
│   ├── csv-json/index.js
│   ├── xml-formatter/index.js
│   ├── yaml-formatter/index.js
│   ├── lorem-ipsum/index.js
│   ├── diff-checker/index.js
│   ├── cron-parser/index.js
│   ├── html-encoder/index.js
│   └── barcode-generator/index.js
│
├── data/samples/                 # Sample data files
└── docs/architecture/            # Architecture documentation
```

---

## 🏗️ Architecture

### Routing

Hash-based SPA router (`#/` home, `#/tool/:toolId`). Tool modules are dynamically imported on first visit and cached in memory.

### Tool Module Pattern

Every tool exports two functions:

```javascript
// tools/my-tool/index.js
export async function mount(container) {
  container.innerHTML = buildUI();
  bindEvents(container);
}

export function unmount() {
  // Clean up intervals, event listeners, etc.
}
```

### Services

| Service | Responsibility |
| --------- | --------------- |
| `themeService` | Dark/light toggle, persisted to localStorage |
| `clipboardService` | `navigator.clipboard` with fallback |
| `downloadService` | Blob download helpers |
| `toastService` | Lightweight toast notifications |
| `settingsService` | User preferences (font size, tab size, etc.) |
| `historyService` | Recently visited tools |
| `favoritesService` | Starred tools |
| `aiProviderService` | OpenAI / Claude / Gemini / local commit generator |
| `analyticsService` | Privacy-respecting usage events |
| `keyboardService` | Global keyboard shortcut registration |

### Event Bus

Decoupled component communication via `eventBus.on(EVENT, handler)` and `eventBus.emit(EVENT, data)`.

---

## 🤝 Contributing

1. Fork the repo and create a feature branch: `git checkout -b feature/my-tool`
2. Follow the [tool module pattern](#-architecture) above
3. Register your tool in `assets/js/config/tools.config.js`
4. Ensure keyboard navigation and ARIA attributes are correct
5. Submit a pull request using the provided template

---

## 📄 License

MIT © 2024 Developer Toolkit Contributors
