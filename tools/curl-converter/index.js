/**
 * cURL Converter Tool
 * ====================
 * Convert cURL commands to fetch/axios/HTTPie, and vice versa.
 *
 * @module tools/curl-converter
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
}

// ─── UI ─────────────────────────────────────────────────────────

function buildUI() {
    return `
    <div class="tool-page" id="curl-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">cURL Converter</h1>
            <p class="tool-description">Convert cURL commands to JavaScript fetch, axios, Python requests, HTTPie, and more.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="curl-sample-btn">Sample</button>
          <button class="btn btn-ghost btn-sm" id="curl-clear-btn">Clear</button>
        </div>
      </div>

      <!-- Input -->
      <div class="tool-panel" style="margin-bottom: var(--space-4);">
        <div class="tool-panel-header">
          <div class="tool-panel-title">cURL Command</div>
        </div>
        <div class="tool-panel-body" style="padding: var(--space-4);">
          <textarea
            id="curl-input"
            class="code-textarea"
            rows="6"
            placeholder="curl -X POST https://api.example.com/users \\&#10;  -H 'Content-Type: application/json' \\&#10;  -H 'Authorization: Bearer TOKEN' \\&#10;  -d '{\"name\": \"John\", \"email\": \"john@example.com\"}'"
            spellcheck="false"
            autocomplete="off"
            aria-label="cURL command input"
          ></textarea>
          <div id="curl-error" style="display:none; margin-top: var(--space-2);"></div>
        </div>
      </div>

      <!-- Target Language -->
      <div class="tool-options-bar" style="margin-bottom: var(--space-4);">
        <div class="tool-options-group">
          <span class="tool-options-label">Convert to:</span>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm active" data-lang="fetch" aria-pressed="true">JS fetch</button>
            <button class="btn btn-secondary btn-sm" data-lang="axios" aria-pressed="false">axios</button>
            <button class="btn btn-secondary btn-sm" data-lang="python" aria-pressed="false">Python</button>
            <button class="btn btn-secondary btn-sm" data-lang="node" aria-pressed="false">Node (got)</button>
            <button class="btn btn-secondary btn-sm" data-lang="httpie" aria-pressed="false">HTTPie</button>
          </div>
        </div>
      </div>

      <!-- Output -->
      <div class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title" id="curl-out-title">JavaScript fetch</div>
          <div class="tool-panel-actions">
            <button class="copy-btn" id="curl-copy-btn" aria-label="Copy converted code">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy
            </button>
          </div>
        </div>
        <div class="tool-panel-body" style="overflow: auto; min-height: 240px;">
          <div id="curl-out-placeholder" style="display:flex; align-items:center; justify-content:center; height:240px; color: var(--text-tertiary); font-size: var(--text-sm);">
            Paste a cURL command above to convert
          </div>
          <pre id="curl-output" style="display:none; margin:0;"><code id="curl-output-code" class="language-javascript"></code></pre>
        </div>
      </div>

      <!-- Parsed Details -->
      <div id="curl-parsed-details" style="display:none; margin-top: var(--space-4);">
        <div class="tool-panel">
          <div class="tool-panel-header"><div class="tool-panel-title">Parsed Request Details</div></div>
          <div class="tool-panel-body" style="padding: var(--space-4);">
            <div id="curl-parsed-body" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--space-3);"></div>
          </div>
        </div>
      </div>
    </div>`;
}

// ─── Events ─────────────────────────────────────────────────────

function bindEvents(container) {
    let currentLang = 'fetch';
    let currentOutput = '';
    let lastParsed = null;

    const convert = debounce(() => {
        const raw = container.querySelector('#curl-input')?.value?.trim() ?? '';
        if (!raw) {
            showPlaceholder(container);
            return;
        }
        const parsed = parseCurl(raw);
        if (!parsed) {
            showError(container, 'Could not parse cURL command. Make sure it starts with "curl".');
            return;
        }
        lastParsed = parsed;
        currentOutput = convertTo(parsed, currentLang);
        showOutput(container, currentOutput, currentLang);
        showParsedDetails(parsed, container);
    }, 200);

    container.querySelector('#curl-input')?.addEventListener('input', convert);

    container.querySelectorAll('[data-lang]').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('[data-lang]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            currentLang = btn.dataset.lang;
            if (lastParsed) {
                currentOutput = convertTo(lastParsed, currentLang);
                showOutput(container, currentOutput, currentLang);
            }
        });
    });

    container.querySelector('#curl-copy-btn')?.addEventListener('click', () => {
        if (currentOutput) clipboardService.copyWithFeedback(currentOutput, container.querySelector('#curl-copy-btn'));
    });

    container.querySelector('#curl-sample-btn')?.addEventListener('click', () => {
        const inputEl = container.querySelector('#curl-input');
        if (inputEl) {
            inputEl.value = `curl -X POST 'https://api.example.com/v1/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.example' \\
  -H 'Accept: application/json' \\
  -d '{"name": "Jane Doe", "email": "jane@example.com", "role": "admin"}'`;
            convert();
        }
    });

    container.querySelector('#curl-clear-btn')?.addEventListener('click', () => {
        const inputEl = container.querySelector('#curl-input');
        if (inputEl) inputEl.value = '';
        showPlaceholder(container);
        container.querySelector('#curl-parsed-details').style.display = 'none';
        currentOutput = '';
        lastParsed = null;
    });
}

// ─── cURL Parser ────────────────────────────────────────────────

function parseCurl(raw) {
    // Normalize multi-line cURL (remove backslash-newlines)
    let cmd = raw.replace(/\\\s*\n\s*/g, ' ').trim();

    if (!cmd.toLowerCase().startsWith('curl')) return null;

    const parsed = {
        method: 'GET',
        url: '',
        headers: {},
        body: null,
        auth: null,
    };

    // Extract tokens, respecting quotes
    const tokens = tokenize(cmd.slice(4).trim());
    let i = 0;

    while (i < tokens.length) {
        const t = tokens[i];

        if (t === '-X' || t === '--request') {
            parsed.method = tokens[++i]?.toUpperCase() ?? 'GET';
        } else if (t === '-H' || t === '--header') {
            const header = tokens[++i] ?? '';
            const colon = header.indexOf(':');
            if (colon !== -1) {
                const key = header.slice(0, colon).trim();
                const val = header.slice(colon + 1).trim();
                parsed.headers[key] = val;
            }
        } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-binary') {
            parsed.body = tokens[++i] ?? '';
            if (['POST', 'PUT', 'PATCH'].includes(parsed.method) === false) parsed.method = 'POST';
        } else if (t === '-u' || t === '--user') {
            parsed.auth = tokens[++i] ?? '';
        } else if (t === '-L' || t === '--location' || t === '--compressed' || t === '-s' || t === '--silent') {
            // ignore flags
        } else if (!t.startsWith('-') && !parsed.url) {
            parsed.url = t.replace(/^['"]|['"]$/g, '');
        }
        i++;
    }

    if (!parsed.url) return null;
    return parsed;
}

function tokenize(str) {
    const tokens = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === "'" && !inDouble) { inSingle = !inSingle; continue; }
        if (c === '"' && !inSingle) { inDouble = !inDouble; continue; }
        if (c === ' ' && !inSingle && !inDouble) {
            if (current) { tokens.push(current); current = ''; }
            continue;
        }
        current += c;
    }
    if (current) tokens.push(current);
    return tokens;
}

// ─── Converters ─────────────────────────────────────────────────

function convertTo(parsed, lang) {
    switch (lang) {
        case 'fetch': return toFetch(parsed);
        case 'axios': return toAxios(parsed);
        case 'python': return toPython(parsed);
        case 'node': return toGot(parsed);
        case 'httpie': return toHTTPie(parsed);
        default: return toFetch(parsed);
    }
}

function toFetch({ method, url, headers, body }) {
    const hLines = Object.entries(headers).map(([k, v]) => `    '${k}': '${v}',`).join('\n');
    let code = `const response = await fetch('${url}', {\n  method: '${method}',\n`;

    if (hLines) code += `  headers: {\n${hLines}\n  },\n`;
    if (body) code += `  body: \`${body}\`,\n`;

    code += `});\n\nconst data = await response.json();\nconsole.log(data);`;
    return code;
}

function toAxios({ method, url, headers, body }) {
    const hLines = Object.entries(headers).map(([k, v]) => `    '${k}': '${v}',`).join('\n');

    let opts = `  method: '${method.toLowerCase()}',\n  url: '${url}',\n`;
    if (hLines) opts += `  headers: {\n${hLines}\n  },\n`;
    if (body) {
        try { opts += `  data: ${JSON.stringify(JSON.parse(body), null, 4)},\n`; }
        catch { opts += `  data: '${body}',\n`; }
    }

    return `import axios from 'axios';\n\nconst response = await axios({\n${opts}});\n\nconsole.log(response.data);`;
}

function toPython({ method, url, headers, body }) {
    const hLines = Object.entries(headers).map(([k, v]) => `    '${k}': '${v}',`).join('\n');
    let code = `import requests\n\nurl = '${url}'\n`;

    if (hLines) code += `headers = {\n${hLines}\n}\n`;

    if (body) {
        try { code += `json_data = ${JSON.stringify(JSON.parse(body), null, 4)}\n\nresponse = requests.${method.toLowerCase()}(url${hLines ? ', headers=headers' : ''}, json=json_data)\n`; }
        catch { code += `data = '${body}'\n\nresponse = requests.${method.toLowerCase()}(url${hLines ? ', headers=headers' : ''}, data=data)\n`; }
    } else {
        code += `\nresponse = requests.${method.toLowerCase()}(url${hLines ? ', headers=headers' : ''})\n`;
    }

    code += `print(response.json())`;
    return code;
}

function toGot({ method, url, headers, body }) {
    const hLines = Object.entries(headers).map(([k, v]) => `    '${k}': '${v}',`).join('\n');
    let opts = '';
    if (hLines) opts += `  headers: {\n${hLines}\n  },\n`;
    if (body) {
        try { opts += `  json: ${JSON.stringify(JSON.parse(body), null, 4)},\n`; }
        catch { opts += `  body: '${body}',\n`; }
    }

    const m = method === 'GET' ? 'get' : method === 'POST' ? 'post' : method === 'PUT' ? 'put' : method === 'DELETE' ? 'delete' : method.toLowerCase();

    return `import got from 'got';\n\nconst { body } = await got.${m}('${url}', {\n${opts}});\n\nconsole.log(JSON.parse(body));`;
}

function toHTTPie({ method, url, headers, body }) {
    let cmd = `http ${method} '${url}'`;
    Object.entries(headers).forEach(([k, v]) => { cmd += ` \\\n  '${k}: ${v}'`; });
    if (body) {
        try {
            const obj = JSON.parse(body);
            Object.entries(obj).forEach(([k, v]) => { cmd += ` \\\n  ${k}:='${JSON.stringify(v)}'`; });
        } catch {
            cmd += ` \\\n  --raw '${body}'`;
        }
    }
    return cmd;
}

// ─── Rendering ──────────────────────────────────────────────────

const LANG_LABELS = { fetch: 'JavaScript fetch', axios: 'axios', python: 'Python requests', node: 'Node.js (got)', httpie: 'HTTPie' };
const LANG_CLASS = { fetch: 'language-javascript', axios: 'language-javascript', python: 'language-python', node: 'language-javascript', httpie: 'language-bash' };

function showOutput(container, code, lang) {
    const ph = container.querySelector('#curl-out-placeholder');
    const pre = container.querySelector('#curl-output');
    const codeEl = container.querySelector('#curl-output-code');
    const titleEl = container.querySelector('#curl-out-title');
    const errEl = container.querySelector('#curl-error');

    if (ph) ph.style.display = 'none';
    if (pre) pre.style.display = 'block';
    if (errEl) errEl.style.display = 'none';

    if (titleEl) titleEl.textContent = LANG_LABELS[lang] ?? lang;
    if (codeEl) {
        codeEl.textContent = code;
        codeEl.className = LANG_CLASS[lang] ?? 'language-text';
        if (window.hljs) window.hljs.highlightElement(codeEl);
    }
}

function showPlaceholder(container) {
    const ph = container.querySelector('#curl-out-placeholder');
    const pre = container.querySelector('#curl-output');
    if (ph) ph.style.display = 'flex';
    if (pre) pre.style.display = 'none';
    container.querySelector('#curl-parsed-details').style.display = 'none';
}

function showError(container, message) {
    const errEl = container.querySelector('#curl-error');
    if (errEl) { errEl.style.display = 'block'; errEl.innerHTML = `<div class="result-error">${escapeHtml(message)}</div>`; }
    showPlaceholder(container);
}

function showParsedDetails(parsed, container) {
    const panel = container.querySelector('#curl-parsed-details');
    const body = container.querySelector('#curl-parsed-body');
    if (!panel || !body) return;
    panel.style.display = '';

    const cards = [
        ['Method', parsed.method, parsed.method === 'GET' ? 'success' : parsed.method === 'DELETE' ? 'error' : 'primary'],
        ['URL', parsed.url, ''],
        ['Headers', Object.keys(parsed.headers).length + ' headers', ''],
        ['Body', parsed.body ? `${new Blob([parsed.body]).size} bytes` : 'None', ''],
    ];

    body.innerHTML = cards.map(([label, value, type]) => `
    <div style="padding: var(--space-3); background: var(--surface-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-md);">
      <div style="font-size: var(--text-xs); color: var(--text-tertiary); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.05em;">${label}</div>
      <div style="font-family: var(--font-mono); font-size: var(--text-xs); word-break: break-all; color: var(--text-primary);">${escapeHtml(value)}</div>
    </div>`).join('');
}
