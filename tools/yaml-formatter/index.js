/**
 * YAML Formatter Tool
 * ====================
 * Format, validate YAML, convert YAML ↔ JSON.
 * Uses js-yaml CDN (loaded lazily — same approach as openapi-viewer).
 *
 * @module tools/yaml-formatter
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { downloadService } from '../../assets/js/services/download.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { escapeHtml, readFileAsText } from '../../assets/js/utils/dom.utils.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';

export function mount(container) {
    loadYamlLib(() => {
        container.innerHTML = buildUI();
        bindEvents(container);
    });
}

function loadYamlLib(cb) {
    if (window.jsyaml) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';
    s.onload = cb;
    s.onerror = () => toastService.error('Failed to load YAML library');
    document.head.appendChild(s);
}

function buildUI() {
    return `
    <div class="tool-page" id="yaml-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">YAML Formatter</h1>
            <p class="tool-description">Format and validate YAML. Convert YAML ↔ JSON with syntax highlighting.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="yaml-sample-btn">Sample</button>
          <label class="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload
            <input type="file" id="yaml-file-input" accept=".yaml,.yml,.json" class="sr-only" />
          </label>
        </div>
      </div>

      <!-- Mode -->
      <div class="tool-options-bar" style="margin-bottom: var(--space-4);">
        <div class="tool-options-group">
          <span class="tool-options-label">Mode:</span>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm active" data-yaml-mode="yaml" aria-pressed="true">Format YAML</button>
            <button class="btn btn-secondary btn-sm" data-yaml-mode="yaml2json" aria-pressed="false">YAML → JSON</button>
            <button class="btn btn-secondary btn-sm" data-yaml-mode="json2yaml" aria-pressed="false">JSON → YAML</button>
          </div>
        </div>
        <div class="tool-options-group" style="margin-left: auto;">
          <button class="btn btn-primary btn-sm" id="yaml-process-btn">Process</button>
          <button class="btn btn-secondary btn-sm" id="yaml-validate-btn">Validate</button>
        </div>
      </div>

      <!-- Banner -->
      <div id="yaml-banner" style="display:none; margin-bottom: var(--space-3);"></div>

      <div class="tool-layout-split">
        <div class="tool-panel">
          <div class="tool-panel-header"><div class="tool-panel-title" id="yaml-input-label">YAML Input</div></div>
          <div class="tool-panel-body">
            <textarea id="yaml-input" class="code-textarea" rows="20" placeholder="name: Alice&#10;age: 30" spellcheck="false" aria-label="YAML input"></textarea>
          </div>
          <div class="editor-statusbar"><span class="editor-statusbar-item" id="yaml-in-status">—</span></div>
        </div>

        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title" id="yaml-output-label">Output</div>
            <div class="tool-panel-actions">
              <button class="copy-btn" id="yaml-copy-btn" aria-label="Copy output">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
              <button class="copy-btn" id="yaml-download-btn" aria-label="Download">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            </div>
          </div>
          <div class="tool-panel-body" style="overflow:auto;">
            <pre id="yaml-output-pre" style="display:none; margin:0; padding: var(--space-4);"><code id="yaml-output-code" style="font-size: var(--text-xs);"></code></pre>
            <div id="yaml-output-ph" style="display:flex; align-items:center; justify-content:center; height:100%; min-height:340px; color: var(--text-tertiary); font-size: var(--text-sm);">Output will appear here</div>
          </div>
        </div>
      </div>
    </div>`;
}

function bindEvents(container) {
    let currentMode = 'yaml';
    let lastOutput = '';
    let lastExt = 'yaml';

    container.querySelectorAll('[data-yaml-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('[data-yaml-mode]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
            currentMode = btn.dataset.yamlMode;

            const inLabel = container.querySelector('#yaml-input-label');
            const outLabel = container.querySelector('#yaml-output-label');
            if (currentMode === 'json2yaml') {
                if (inLabel) inLabel.textContent = 'JSON Input';
                if (outLabel) outLabel.textContent = 'YAML Output';
            } else {
                if (inLabel) inLabel.textContent = 'YAML Input';
                if (outLabel) outLabel.textContent = currentMode === 'yaml' ? 'Formatted YAML' : 'JSON Output';
            }

            doProcess(container, currentMode, (out, ext) => { lastOutput = out; lastExt = ext; });
        });
    });

    const auto = debounce(() => {
        updateStatus(container, currentMode);
        doProcess(container, currentMode, (out, ext) => { lastOutput = out; lastExt = ext; });
    }, 400);

    container.querySelector('#yaml-input')?.addEventListener('input', auto);
    container.querySelector('#yaml-process-btn')?.addEventListener('click', () => doProcess(container, currentMode, (out, ext) => { lastOutput = out; lastExt = ext; }));
    container.querySelector('#yaml-validate-btn')?.addEventListener('click', () => validateOnly(container));

    container.querySelector('#yaml-copy-btn')?.addEventListener('click', () => {
        if (lastOutput) clipboardService.copyWithFeedback(lastOutput, container.querySelector('#yaml-copy-btn'));
    });
    container.querySelector('#yaml-download-btn')?.addEventListener('click', () => {
        if (lastOutput) downloadService.text(lastOutput, `output.${lastExt}`);
    });

    container.querySelector('#yaml-file-input')?.addEventListener('change', async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await readFileAsText(file).catch(() => null);
        if (text) { container.querySelector('#yaml-input').value = text; auto(); }
    });

    container.querySelector('#yaml-sample-btn')?.addEventListener('click', () => {
        container.querySelector('#yaml-input').value = SAMPLE_YAML;
        auto();
    });
}

function updateStatus(container, mode) {
    const raw = container.querySelector('#yaml-input')?.value ?? '';
    const status = container.querySelector('#yaml-in-status');
    if (!status) return;
    if (!raw.trim()) { status.textContent = '—'; status.style.color = ''; return; }
    try {
        if (mode === 'json2yaml') {
            JSON.parse(raw);
            status.textContent = '✓ Valid JSON';
        } else {
            window.jsyaml?.load(raw);
            status.textContent = '✓ Valid YAML';
        }
        status.style.color = 'var(--color-success-text)';
    } catch (e) {
        status.textContent = `✗ ${e.message?.slice(0, 60) ?? 'Error'}`;
        status.style.color = 'var(--color-error-text)';
    }
}

function doProcess(container, mode, onResult) {
    const raw = container.querySelector('#yaml-input')?.value ?? '';
    const pre = container.querySelector('#yaml-output-pre');
    const code = container.querySelector('#yaml-output-code');
    const ph = container.querySelector('#yaml-output-ph');

    if (!raw.trim()) {
        if (pre) pre.style.display = 'none';
        if (ph) ph.style.display = 'flex';
        return;
    }

    try {
        let output = '';
        let lang = 'yaml';
        let ext = 'yaml';

        if (mode === 'yaml') {
            const parsed = window.jsyaml.load(raw);
            output = window.jsyaml.dump(parsed, { indent: 2, lineWidth: 120 });
        } else if (mode === 'yaml2json') {
            const parsed = window.jsyaml.load(raw);
            output = JSON.stringify(parsed, null, 2);
            lang = 'json'; ext = 'json';
        } else if (mode === 'json2yaml') {
            const parsed = JSON.parse(raw);
            output = window.jsyaml.dump(parsed, { indent: 2, lineWidth: 120 });
        }

        if (pre) pre.style.display = 'block';
        if (ph) ph.style.display = 'none';
        if (code) {
            code.textContent = output;
            code.className = `language-${lang}`;
            if (window.hljs) window.hljs.highlightElement(code);
        }

        onResult(output, ext);
    } catch (err) {
        if (pre) pre.style.display = 'none';
        if (ph) { ph.style.display = 'flex'; ph.innerHTML = `<div class="result-error" style="padding: var(--space-4);">${escapeHtml(err.message)}</div>`; }
    }
}

function validateOnly(container) {
    const raw = container.querySelector('#yaml-input')?.value ?? '';
    const banner = container.querySelector('#yaml-banner');
    if (!banner) return;

    try {
        window.jsyaml.load(raw);
        banner.innerHTML = `<div class="result-success">✓ Valid YAML</div>`;
    } catch (err) {
        banner.innerHTML = `<div class="result-error">${escapeHtml(err.message)}</div>`;
    }
    banner.style.display = '';
}

const SAMPLE_YAML = `# Application configuration
app:
  name: developer-toolkit
  version: "1.0.0"
  description: Navigate the Universe of Code

server:
  host: 0.0.0.0
  port: 3000
  debug: false

database:
  host: localhost
  port: 5432
  name: devtools
  pool:
    min: 2
    max: 10

features:
  - json-formatter
  - jwt-decoder
  - regex-tester
  - markdown-preview

logging:
  level: info
  format: json
  output:
    - console
    - file: /var/log/app.log
`;
