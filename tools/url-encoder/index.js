/**
 * URL Encoder / Decoder Tool
 * ==========================
 * Encode/decode URL components, full URLs, and query strings.
 *
 * @module tools/url-encoder
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
}

function buildUI() {
    return `
    <div class="tool-page" id="url-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">URL Encoder / Decoder</h1>
            <p class="tool-description">Encode and decode URL components, full URLs, and query strings. Parse and build URLs visually.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="url-sample-btn">Sample</button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tool-tabs" style="margin-bottom: var(--space-4);">
        <button class="tool-tab active" data-urltab="encode">Encode / Decode</button>
        <button class="tool-tab" data-urltab="parse">URL Parser</button>
        <button class="tool-tab" data-urltab="build">URL Builder</button>
      </div>

      <!-- ── Encode/Decode Tab ─────────────────────────── -->
      <div id="url-encode-tab">
        <div class="tool-options-bar" style="margin-bottom: var(--space-3);">
          <div class="tool-options-group">
            <span class="tool-options-label">Function:</span>
            <div class="btn-group">
              <button class="btn btn-secondary btn-sm active" data-fn="encodeURIComponent" aria-pressed="true">encodeURIComponent</button>
              <button class="btn btn-secondary btn-sm" data-fn="encodeURI" aria-pressed="false">encodeURI</button>
              <button class="btn btn-secondary btn-sm" data-fn="form" aria-pressed="false">Form-encoded</button>
            </div>
          </div>
          <div class="tool-options-group">
            <div class="btn-group">
              <button class="btn btn-secondary btn-sm active" data-dir="encode" aria-pressed="true">Encode</button>
              <button class="btn btn-secondary btn-sm" data-dir="decode" aria-pressed="false">Decode</button>
            </div>
          </div>
        </div>

        <div class="tool-layout-split">
          <div class="tool-panel">
            <div class="tool-panel-header"><div class="tool-panel-title" id="url-enc-in-label">Input</div></div>
            <div class="tool-panel-body">
              <textarea id="url-enc-input" class="code-textarea" rows="12" placeholder="Enter text to encode/decode..." spellcheck="false" aria-label="URL encode input"></textarea>
            </div>
          </div>
          <div class="tool-panel">
            <div class="tool-panel-header">
              <div class="tool-panel-title" id="url-enc-out-label">Output</div>
              <div class="tool-panel-actions">
                <button class="copy-btn" id="url-enc-copy" aria-label="Copy output">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
              </div>
            </div>
            <div class="tool-panel-body">
              <textarea id="url-enc-output" class="code-textarea" rows="12" readonly aria-label="URL encode output" aria-live="polite"></textarea>
            </div>
          </div>
        </div>
        <div id="url-enc-error" style="display:none; margin-top: var(--space-2);"></div>
      </div>

      <!-- ── URL Parser Tab ────────────────────────────── -->
      <div id="url-parse-tab" style="display:none;">
        <div class="tool-panel" style="margin-bottom: var(--space-4);">
          <div class="tool-panel-body" style="padding: var(--space-4);">
            <div style="display: flex; gap: var(--space-2);">
              <input type="text" id="url-parse-input" class="input input-mono" placeholder="https://example.com/path?key=value&foo=bar#section" style="flex:1;" autocomplete="off" aria-label="URL to parse" />
              <button class="btn btn-primary btn-sm" id="url-parse-btn">Parse</button>
            </div>
          </div>
        </div>
        <div id="url-parse-result" style="display:none;"></div>
      </div>

      <!-- ── URL Builder Tab ───────────────────────────── -->
      <div id="url-build-tab" style="display:none;">
        <div class="tool-panel" style="margin-bottom: var(--space-4);">
          <div class="tool-panel-header"><div class="tool-panel-title">URL Components</div></div>
          <div class="tool-panel-body" style="padding: var(--space-4);">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
              <div class="form-group"><label class="form-label" for="build-protocol">Protocol</label><select class="select" id="build-protocol"><option value="https://">https://</option><option value="http://">http://</option><option value="ftp://">ftp://</option></select></div>
              <div class="form-group"><label class="form-label" for="build-host">Host</label><input type="text" id="build-host" class="input input-mono" placeholder="example.com" autocomplete="off" /></div>
              <div class="form-group"><label class="form-label" for="build-port">Port (optional)</label><input type="number" id="build-port" class="input input-mono" placeholder="8080" autocomplete="off" /></div>
              <div class="form-group"><label class="form-label" for="build-path">Path</label><input type="text" id="build-path" class="input input-mono" placeholder="/api/v1/users" autocomplete="off" /></div>
              <div class="form-group"><label class="form-label" for="build-hash">Hash / Fragment</label><input type="text" id="build-hash" class="input input-mono" placeholder="section" autocomplete="off" /></div>
            </div>

            <div style="margin-top: var(--space-3);">
              <div style="font-size: var(--text-sm); font-weight: var(--font-medium); margin-bottom: var(--space-2);">Query Parameters</div>
              <div id="build-params-list">
                <div class="kv-row">
                  <input type="checkbox" class="kv-check" checked aria-label="Enable param" />
                  <input type="text" class="input input-sm kv-key" placeholder="key" autocomplete="off" />
                  <input type="text" class="input input-sm kv-value" placeholder="value" autocomplete="off" />
                  <button class="btn btn-ghost btn-xs kv-remove" title="Remove">✕</button>
                </div>
              </div>
              <button class="btn btn-ghost btn-sm" id="build-add-param" style="margin-top: var(--space-1);">+ Add Parameter</button>
            </div>
          </div>
        </div>

        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">Built URL</div>
            <div class="tool-panel-actions">
              <button class="copy-btn" id="build-copy-btn" aria-label="Copy URL">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy URL
              </button>
            </div>
          </div>
          <div class="tool-panel-body" style="padding: var(--space-4);">
            <div id="build-output" style="font-family: var(--font-mono); font-size: var(--text-sm); word-break: break-all; color: var(--text-primary); padding: var(--space-3); background: var(--surface-secondary); border-radius: var(--radius-md); min-height: 48px;"></div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .url-part-row { display: flex; gap: var(--space-3); align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--border-primary); }
      .url-part-name { font-size: var(--text-xs); color: var(--text-tertiary); min-width: 100px; font-family: var(--font-mono); }
      .url-part-val  { font-family: var(--font-mono); font-size: var(--text-xs); flex: 1; word-break: break-all; color: var(--text-primary); }
      .kv-row { display: flex; gap: var(--space-2); align-items: center; margin-bottom: var(--space-2); }
      .kv-row input { flex: 1; }
    </style>`;
}

function bindEvents(container) {
    let encFn = 'encodeURIComponent';
    let encDir = 'encode';
    let currentOutput = '';

    // Tab switching
    container.querySelectorAll('[data-urltab]').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('[data-urltab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            container.querySelector('#url-encode-tab').style.display = tab.dataset.urltab === 'encode' ? '' : 'none';
            container.querySelector('#url-parse-tab').style.display = tab.dataset.urltab === 'parse' ? '' : 'none';
            container.querySelector('#url-build-tab').style.display = tab.dataset.urltab === 'build' ? '' : 'none';
        });
    });

    // Function toggle
    container.querySelectorAll('[data-fn]').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('[data-fn]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
            encFn = btn.dataset.fn;
            processEncode(container, encFn, encDir);
        });
    });

    // Direction toggle
    container.querySelectorAll('[data-dir]').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('[data-dir]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
            encDir = btn.dataset.dir;
            processEncode(container, encFn, encDir);
        });
    });

    const process = debounce(() => processEncode(container, encFn, encDir), 150);
    container.querySelector('#url-enc-input')?.addEventListener('input', process);

    container.querySelector('#url-enc-copy')?.addEventListener('click', () => {
        const out = container.querySelector('#url-enc-output')?.value;
        if (out) clipboardService.copyWithFeedback(out, container.querySelector('#url-enc-copy'));
    });

    // URL Parser
    container.querySelector('#url-parse-btn')?.addEventListener('click', () => parseURL(container));
    container.querySelector('#url-parse-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') parseURL(container);
    });

    // URL Builder
    const buildUpdate = debounce(() => buildURL(container), 150);
    ['build-protocol', 'build-host', 'build-port', 'build-path', 'build-hash'].forEach(id => {
        container.querySelector(`#${id}`)?.addEventListener('input', buildUpdate);
        container.querySelector(`#${id}`)?.addEventListener('change', buildUpdate);
    });
    container.querySelector('#build-params-list')?.addEventListener('input', buildUpdate);
    container.querySelector('#build-add-param')?.addEventListener('click', () => {
        const list = container.querySelector('#build-params-list');
        list?.insertAdjacentHTML('beforeend', `
      <div class="kv-row">
        <input type="checkbox" class="kv-check" checked aria-label="Enable param" />
        <input type="text" class="input input-sm kv-key" placeholder="key" autocomplete="off" />
        <input type="text" class="input input-sm kv-value" placeholder="value" autocomplete="off" />
        <button class="btn btn-ghost btn-xs kv-remove" title="Remove">✕</button>
      </div>`);
        buildUpdate();
    });
    container.addEventListener('click', e => {
        if (e.target.classList.contains('kv-remove')) { e.target.closest('.kv-row')?.remove(); buildUpdate(); }
    });

    container.querySelector('#build-copy-btn')?.addEventListener('click', () => {
        const url = container.querySelector('#build-output')?.textContent?.trim();
        if (url) clipboardService.copyWithFeedback(url, container.querySelector('#build-copy-btn'));
    });

    // Sample
    container.querySelector('#url-sample-btn')?.addEventListener('click', () => {
        const input = container.querySelector('#url-enc-input');
        if (input) { input.value = 'Hello World! name=John Doe&email=john@example.com&msg=Hello, World! 🌍'; processEncode(container, encFn, encDir); }
    });
}

function processEncode(container, fn, dir) {
    const input = container.querySelector('#url-enc-input')?.value ?? '';
    const output = container.querySelector('#url-enc-output');
    const errEl = container.querySelector('#url-enc-error');

    if (!input.trim()) { if (output) output.value = ''; return; }

    try {
        let result = '';
        if (dir === 'encode') {
            if (fn === 'encodeURIComponent') result = encodeURIComponent(input);
            else if (fn === 'encodeURI') result = encodeURI(input);
            else if (fn === 'form') result = input.replace(/[^A-Za-z0-9-_.~]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')).replace(/%20/g, '+');
        } else {
            if (fn === 'form') result = decodeURIComponent(input.replace(/\+/g, ' '));
            else result = decodeURIComponent(input);
        }
        if (output) output.value = result;
        if (errEl) errEl.style.display = 'none';
    } catch (e) {
        if (errEl) { errEl.style.display = ''; errEl.innerHTML = `<div class="result-error">${escapeHtml(e.message)}</div>`; }
    }
}

function parseURL(container) {
    const raw = container.querySelector('#url-parse-input')?.value?.trim() ?? '';
    const result = container.querySelector('#url-parse-result');
    if (!raw || !result) return;

    try {
        const url = new URL(raw);
        const params = [...url.searchParams.entries()];

        result.style.display = '';
        result.innerHTML = `
      <div class="tool-panel">
        <div class="tool-panel-body" style="padding: var(--space-4);">
          ${urlPart('Protocol', url.protocol)}
          ${urlPart('Host', url.hostname)}
          ${url.port ? urlPart('Port', url.port) : ''}
          ${urlPart('Pathname', url.pathname)}
          ${url.search ? urlPart('Query String', url.search) : ''}
          ${url.hash ? urlPart('Fragment', url.hash) : ''}
          ${params.length ? `
            <div style="margin-top: var(--space-3);">
              <div style="font-size: var(--text-xs); font-weight: var(--font-semibold); text-transform: uppercase; color: var(--text-tertiary); margin-bottom: var(--space-2);">Query Parameters</div>
              <table class="data-table" style="width:100%;">
                <thead><tr><th>Key</th><th>Value (decoded)</th></tr></thead>
                <tbody>${params.map(([k, v]) => `<tr><td style="font-family:var(--font-mono); font-size:var(--text-xs);">${escapeHtml(k)}</td><td style="font-family:var(--font-mono); font-size:var(--text-xs);">${escapeHtml(v)}</td></tr>`).join('')}</tbody>
              </table>
            </div>` : ''}
        </div>
      </div>`;
    } catch (e) {
        result.style.display = '';
        result.innerHTML = `<div class="result-error">${escapeHtml(e.message)}</div>`;
    }
}

function urlPart(name, value) {
    return `<div class="url-part-row"><span class="url-part-name">${name}</span><span class="url-part-val">${escapeHtml(value)}</span></div>`;
}

function buildURL(container) {
    const proto = container.querySelector('#build-protocol')?.value ?? 'https://';
    const host = container.querySelector('#build-host')?.value?.trim() ?? '';
    const port = container.querySelector('#build-port')?.value?.trim() ?? '';
    const path = container.querySelector('#build-path')?.value?.trim() ?? '';
    const hash = container.querySelector('#build-hash')?.value?.trim() ?? '';

    const params = [];
    container.querySelectorAll('#build-params-list .kv-row').forEach(row => {
        const enabled = row.querySelector('.kv-check')?.checked ?? true;
        const k = row.querySelector('.kv-key')?.value?.trim() ?? '';
        const v = row.querySelector('.kv-value')?.value?.trim() ?? '';
        if (enabled && k) params.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    });

    if (!host) {
        const out = container.querySelector('#build-output');
        if (out) out.textContent = '—';
        return;
    }

    let url = `${proto}${host}`;
    if (port) url += `:${port}`;
    if (path) url += path.startsWith('/') ? path : `/${path}`;
    if (params.length) url += `?${params.join('&')}`;
    if (hash) url += `#${hash}`;

    const out = container.querySelector('#build-output');
    if (out) out.textContent = url;
}
