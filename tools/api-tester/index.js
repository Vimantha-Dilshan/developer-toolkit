/**
 * API Tester Tool
 * ===============
 * A browser-based mini Postman — send HTTP requests, inspect responses,
 * add headers/params/body, auth, and export as cURL.
 *
 * @module tools/api-tester
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';
import { formatBytes } from '../../assets/js/utils/format.utils.js';

export function mount(container) {
  container.innerHTML = buildUI();
  bindEvents(container);
}

// ─── UI ─────────────────────────────────────────────────────────

function buildUI() {
  return `
    <div class="api-pm" id="api-root">

      <!-- URL Bar -->
      <div class="api-pm-urlbar">
        <div class="api-pm-method-wrap" id="api-method-wrap">
          <button class="api-pm-method-btn" id="api-method-btn" type="button" data-method="GET" aria-haspopup="listbox" aria-label="HTTP method">
            <span id="api-method-label">GET</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div class="api-pm-method-dropdown" id="api-method-dropdown" role="listbox" style="display:none;">
            <button class="api-pm-method-opt" data-method="GET">GET</button>
            <button class="api-pm-method-opt" data-method="POST">POST</button>
            <button class="api-pm-method-opt" data-method="PUT">PUT</button>
            <button class="api-pm-method-opt" data-method="PATCH">PATCH</button>
            <button class="api-pm-method-opt" data-method="DELETE">DELETE</button>
            <button class="api-pm-method-opt" data-method="HEAD">HEAD</button>
            <button class="api-pm-method-opt" data-method="OPTIONS">OPTIONS</button>
          </div>
          <input type="hidden" id="api-method" value="GET" />
        </div>
        <input type="url" id="api-url" class="api-pm-urlinput"
          placeholder="Enter URL  e.g. https://api.example.com/endpoint"
          autocomplete="off" aria-label="Request URL" />
        <button class="api-pm-sendbtn btn btn-primary" id="api-send-btn">Send</button>
      </div>

      <!-- CORS note -->
      <div class="api-pm-cors-note">
        ⓘ Browser fetch is subject to CORS restrictions.
        Use a proxy like <code>https://corsproxy.io/?url=</code> for restricted APIs.
      </div>

      <!-- Two-panel layout -->
      <div class="api-pm-panels">

        <!-- ── Request panel ─────────────────────────── -->
        <div class="api-pm-req-panel">

          <div class="tool-tabs api-pm-tab-strip">
            <button class="tool-tab active" data-tab="params">Params</button>
            <button class="tool-tab" data-tab="headers">Headers</button>
            <button class="tool-tab" data-tab="body">Body</button>
            <button class="tool-tab" data-tab="auth">Auth</button>
          </div>

          <!-- Params -->
          <div class="tool-tab-content api-pm-pane" id="tab-params">
            <div class="api-pm-kv-cols">
              <span></span><span class="api-pm-kv-label">Key</span>
              <span class="api-pm-kv-label">Value</span><span></span>
            </div>
            <div id="params-list">
              ${paramRow('', '', false)}
            </div>
            <button class="api-pm-addrow" id="api-add-param">+ Add parameter</button>
          </div>

          <!-- Headers -->
          <div class="tool-tab-content api-pm-pane" id="tab-headers" style="display:none;">
            <div class="api-pm-kv-cols">
              <span></span><span class="api-pm-kv-label">Key</span>
              <span class="api-pm-kv-label">Value</span><span></span>
            </div>
            <div id="headers-list">
              ${headerRow('Content-Type', 'application/json', true)}
              ${headerRow('Accept', 'application/json', true)}
              ${headerRow('', '', false)}
            </div>
            <button class="api-pm-addrow" id="api-add-header">+ Add header</button>
          </div>

          <!-- Body -->
          <div class="tool-tab-content api-pm-pane api-pm-pane-body" id="tab-body" style="display:none;">
            <div class="api-pm-bodytype-bar">
              <button class="api-pm-bodytype-btn active" data-bodytype="none">none</button>
              <button class="api-pm-bodytype-btn" data-bodytype="json">JSON</button>
              <button class="api-pm-bodytype-btn" data-bodytype="form">form-urlencoded</button>
              <button class="api-pm-bodytype-btn" data-bodytype="text">raw</button>
            </div>
            <div id="body-none-msg" class="api-pm-body-none">No request body will be sent.</div>
            <div id="body-json-wrap" style="display:none;">
              <textarea id="api-body-json" class="api-pm-body-editor" rows="10"
                placeholder='{\n  "key": "value"\n}' spellcheck="false" aria-label="JSON body"></textarea>
            </div>
            <div id="body-form-wrap" style="display:none;">
              <div class="api-pm-kv-cols">
                <span></span><span class="api-pm-kv-label">Key</span>
                <span class="api-pm-kv-label">Value</span><span></span>
              </div>
              <div id="form-body-list">${paramRow('', '', false)}</div>
              <button class="api-pm-addrow" id="api-add-form-field">+ Add field</button>
            </div>
            <div id="body-text-wrap" style="display:none;">
              <textarea id="api-body-text" class="api-pm-body-editor" rows="10"
                placeholder="Raw request body..." spellcheck="false" aria-label="Raw body"></textarea>
            </div>
          </div>

          <!-- Auth -->
          <div class="tool-tab-content api-pm-pane" id="tab-auth" style="display:none;">
            <div class="api-pm-auth-type-row">
              <label class="form-label" style="margin-bottom:0; white-space:nowrap;">Auth type</label>
              <select class="select" id="api-auth-type" aria-label="Auth type">
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="api-key">API Key</option>
              </select>
            </div>
            <div id="auth-bearer-wrap" style="display:none;" class="api-pm-auth-fields">
              <label class="form-label" for="auth-bearer-token">Token</label>
              <input type="text" id="auth-bearer-token" class="input input-mono"
                placeholder="Bearer token..." autocomplete="off" aria-label="Bearer token" />
            </div>
            <div id="auth-basic-wrap" style="display:none;" class="api-pm-auth-fields">
              <div class="api-pm-auth-2col">
                <div>
                  <label class="form-label" for="auth-basic-user">Username</label>
                  <input type="text" id="auth-basic-user" class="input" autocomplete="off" aria-label="Username" />
                </div>
                <div>
                  <label class="form-label" for="auth-basic-pass">Password</label>
                  <input type="password" id="auth-basic-pass" class="input" autocomplete="off" aria-label="Password" />
                </div>
              </div>
            </div>
            <div id="auth-apikey-wrap" style="display:none;" class="api-pm-auth-fields">
              <div class="api-pm-auth-2col">
                <div>
                  <label class="form-label" for="auth-key-name">Key Name</label>
                  <input type="text" id="auth-key-name" class="input input-mono" value="X-API-Key"
                    autocomplete="off" aria-label="API key name" />
                </div>
                <div>
                  <label class="form-label" for="auth-key-value">Value</label>
                  <input type="text" id="auth-key-value" class="input input-mono"
                    autocomplete="off" aria-label="API key value" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Response panel ────────────────────────── -->
        <div class="api-pm-res-panel" id="api-response-panel">
          <div class="api-pm-res-header">
            <div class="api-pm-res-title-row">
              <span class="api-pm-res-title">Response</span>
              <div class="api-pm-res-meta" id="api-response-meta"></div>
            </div>
            <div class="api-pm-res-actions">
              <button class="copy-btn" id="api-copy-response" aria-label="Copy response">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy
              </button>
              <button class="copy-btn" id="api-copy-curl" aria-label="Copy as cURL">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                </svg>
                cURL
              </button>
            </div>
          </div>

          <div class="tool-tabs api-pm-tab-strip" id="api-response-tabs">
            <button class="tool-tab active" data-rtab="body">Body</button>
            <button class="tool-tab" data-rtab="headers">Headers</button>
          </div>

          <div id="rtab-body" class="api-pm-res-body">
            <div id="api-response-placeholder" class="api-pm-res-placeholder">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
              <span>Send a request to see the response</span>
            </div>
            <pre id="api-response-body" style="display:none; margin:0;"><code id="api-response-code" class="language-json"></code></pre>
          </div>

          <div id="rtab-headers" style="display:none; padding: var(--space-4);">
            <div id="api-response-headers-table"></div>
          </div>
        </div>

      </div>
    </div>

    <style>
      /* ══ API Tester — Postman-style layout ══════════ */
      #api-root.api-pm {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      /* URL bar */
      .api-pm-urlbar {
        display: flex;
        align-items: center;
        background: var(--surface-secondary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-lg);
        margin-bottom: var(--space-2);
        position: relative;
      }

      /* Method custom dropdown */
      .api-pm-method-wrap {
        position: relative;
        flex-shrink: 0;
        border-right: 1px solid var(--border-primary);
        align-self: stretch;
        display: flex;
        align-items: stretch;
      }
      .api-pm-method-btn {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        background: transparent;
        border: none;
        border-radius: var(--radius-lg) 0 0 var(--radius-lg);
        font-weight: 700;
        font-size: var(--text-sm);
        padding: 0 var(--space-3);
        cursor: pointer;
        white-space: nowrap;
        outline: none;
        min-width: 96px;
        color: #49cc90;
        transition: background var(--transition-fast);
      }
      .api-pm-method-btn:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
      .api-pm-method-btn[data-method="GET"]     { color: #49cc90; }
      .api-pm-method-btn[data-method="POST"]    { color: #fca130; }
      .api-pm-method-btn[data-method="PUT"]     { color: #4d90d0; }
      .api-pm-method-btn[data-method="PATCH"]   { color: #50e3c2; }
      .api-pm-method-btn[data-method="DELETE"]  { color: #f93e3e; }
      .api-pm-method-btn[data-method="HEAD"]    { color: #a855f7; }
      .api-pm-method-btn[data-method="OPTIONS"] { color: #94a3b8; }
      .api-pm-method-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        z-index: 200;
        background: var(--surface-secondary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-md);
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        min-width: 120px;
        padding: var(--space-1) 0;
        overflow: hidden;
      }
      .api-pm-method-opt {
        display: block;
        width: 100%;
        background: none;
        border: none;
        text-align: left;
        padding: var(--space-2) var(--space-4);
        font-size: var(--text-sm);
        font-weight: 700;
        cursor: pointer;
        letter-spacing: 0.02em;
        transition: background var(--transition-fast);
      }
      .api-pm-method-opt[data-method="GET"]     { color: #49cc90; }
      .api-pm-method-opt[data-method="POST"]    { color: #fca130; }
      .api-pm-method-opt[data-method="PUT"]     { color: #4d90d0; }
      .api-pm-method-opt[data-method="PATCH"]   { color: #50e3c2; }
      .api-pm-method-opt[data-method="DELETE"]  { color: #f93e3e; }
      .api-pm-method-opt[data-method="HEAD"]    { color: #a855f7; }
      .api-pm-method-opt[data-method="OPTIONS"] { color: #94a3b8; }
      .api-pm-method-opt:hover { background: var(--surface-hover); }
      .api-pm-method-opt.selected { background: color-mix(in srgb, currentColor 12%, transparent); }

      .api-pm-urlinput {
        flex: 1;
        border: none !important;
        background: transparent !important;
        outline: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        padding: var(--space-3) var(--space-3) !important;
        color: var(--text-primary);
        min-width: 0;
      }

      .api-pm-sendbtn {
        flex-shrink: 0;
        border-radius: 0 var(--radius-lg) var(--radius-lg) 0 !important;
        padding: var(--space-3) var(--space-5) !important;
        border: none !important;
        border-left: 1px solid var(--border-primary) !important;
        height: 100%;
      }

      /* CORS note */
      .api-pm-cors-note {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        padding: 0 var(--space-1) var(--space-3);
      }
      .api-pm-cors-note code {
        font-family: var(--font-mono);
        background: var(--surface-active);
        padding: 1px 5px;
        border-radius: var(--radius-xs);
      }

      /* Side-by-side panels */
      .api-pm-panels {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
        align-items: start;
      }
      @media (max-width: 860px) {
        .api-pm-panels { grid-template-columns: 1fr; }
      }

      .api-pm-req-panel,
      .api-pm-res-panel {
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-lg);
        background: var(--surface-primary);
        overflow: hidden;
      }

      /* Tab strip */
      .api-pm-tab-strip {
        background: var(--surface-secondary) !important;
        border-bottom: 1px solid var(--border-primary);
        padding: 0 var(--space-2);
        gap: 0;
        margin: 0;
      }

      /* Panes */
      .api-pm-pane {
        padding: var(--space-3);
        min-height: 160px;
      }
      .api-pm-pane-body { padding: 0; }

      /* KV column headers */
      .api-pm-kv-cols {
        display: grid;
        grid-template-columns: 20px 1fr 1fr 26px;
        gap: var(--space-2);
        padding: var(--space-1) var(--space-2) var(--space-1);
      }
      .api-pm-kv-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-disabled);
        font-weight: var(--font-semibold);
      }

      /* KV rows */
      .kv-row {
        display: grid !important;
        grid-template-columns: 20px 1fr 1fr 26px;
        gap: var(--space-2);
        align-items: center;
        padding: 2px var(--space-2);
        border-radius: var(--radius-sm);
        margin-bottom: 0 !important;
      }
      .kv-row:hover { background: var(--surface-hover); }

      .kv-row .kv-key,
      .kv-row .kv-value {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        padding: var(--space-1) var(--space-2) !important;
        font-size: var(--text-xs) !important;
        height: 28px !important;
        border-radius: 0 !important;
        border-bottom: 1px solid transparent !important;
        color: var(--text-secondary);
        transition: border-color var(--transition-fast), color var(--transition-fast);
      }
      .kv-row .kv-key:focus,
      .kv-row .kv-value:focus {
        border-bottom-color: var(--accent-500) !important;
        color: var(--text-primary) !important;
        outline: none !important;
      }
      .kv-row .kv-check {
        margin: 0;
        accent-color: var(--accent-500);
        cursor: pointer;
      }
      .kv-row .kv-remove {
        width: 22px; height: 22px;
        padding: 0 !important;
        font-size: 10px;
        opacity: 0;
        display: flex; align-items: center; justify-content: center;
        transition: opacity var(--transition-fast);
        border-radius: var(--radius-sm) !important;
        min-width: unset !important;
      }
      .kv-row:hover .kv-remove { opacity: 1; }

      .api-pm-addrow {
        background: none;
        border: none;
        color: var(--accent-400);
        font-size: var(--text-xs);
        cursor: pointer;
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-sm);
        transition: background var(--transition-fast);
        display: block;
        width: 100%;
        text-align: left;
        margin-top: var(--space-1);
      }
      .api-pm-addrow:hover { background: var(--surface-hover); }

      /* Body type bar */
      .api-pm-bodytype-bar {
        display: flex;
        gap: 0;
        padding: 0 var(--space-3);
        border-bottom: 1px solid var(--border-primary);
        background: var(--surface-secondary);
      }
      .api-pm-bodytype-btn {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        cursor: pointer;
        margin-bottom: -1px;
        transition: color var(--transition-fast), border-color var(--transition-fast);
      }
      .api-pm-bodytype-btn.active {
        color: var(--accent-400);
        border-bottom-color: var(--accent-500);
      }
      .api-pm-bodytype-btn:hover:not(.active) { color: var(--text-secondary); }

      .api-pm-body-none {
        color: var(--text-tertiary);
        font-size: var(--text-sm);
        padding: var(--space-6) var(--space-4);
        text-align: center;
      }
      .api-pm-body-editor {
        width: 100%;
        box-sizing: border-box;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        line-height: 1.65;
        padding: var(--space-3);
        background: var(--surface-input);
        border: none;
        color: var(--text-primary);
        resize: vertical;
        outline: none;
        min-height: 160px;
        display: block;
      }

      /* Auth */
      .api-pm-auth-type-row {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border-bottom: 1px solid var(--border-primary);
        background: var(--surface-secondary);
      }
      .api-pm-auth-fields { padding: var(--space-3); }
      .api-pm-auth-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
      }

      /* Response header */
      .api-pm-res-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-3) var(--space-4);
        background: var(--surface-secondary);
        border-bottom: 1px solid var(--border-primary);
        gap: var(--space-3);
        flex-wrap: wrap;
      }
      .api-pm-res-title-row {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        flex: 1;
        min-width: 0;
        flex-wrap: wrap;
      }
      .api-pm-res-title {
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
        white-space: nowrap;
      }
      .api-pm-res-meta {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--text-xs);
        flex-wrap: wrap;
      }
      .api-pm-res-actions {
        display: flex;
        gap: var(--space-2);
        flex-shrink: 0;
      }
      .api-pm-res-body {
        overflow: auto;
        min-height: 240px;
        max-height: 520px;
      }
      .api-pm-res-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: 4rem var(--space-4);
        color: var(--text-disabled);
        font-size: var(--text-sm);
        opacity: 0.7;
      }
    </style>`;
}

function headerRow(key = '', val = '', enabled = false) {
  return `
    <div class="kv-row">
      <input type="checkbox" class="kv-check" ${enabled ? 'checked' : ''} aria-label="Enable header" />
      <input type="text" class="input input-mono kv-key"   value="${escapeHtml(key)}" placeholder="Header name" autocomplete="off" />
      <input type="text" class="input input-mono kv-value" value="${escapeHtml(val)}" placeholder="Value"       autocomplete="off" />
      <button class="btn btn-ghost btn-xs kv-remove" title="Remove">✕</button>
    </div>`;
}

function paramRow(key = '', val = '', enabled = false) {
  return `
    <div class="kv-row">
      <input type="checkbox" class="kv-check" ${enabled ? 'checked' : ''} aria-label="Enable param" />
      <input type="text" class="input input-mono kv-key"   value="${escapeHtml(key)}" placeholder="Key"   autocomplete="off" />
      <input type="text" class="input input-mono kv-value" value="${escapeHtml(val)}" placeholder="Value" autocomplete="off" />
      <button class="btn btn-ghost btn-xs kv-remove" title="Remove">✕</button>
    </div>`;
}

// ─── Events ─────────────────────────────────────────────────────

function bindEvents(container) {
  let lastResponse = '';

  // Method custom dropdown
  const methodBtn = container.querySelector('#api-method-btn');
  const methodDrop = container.querySelector('#api-method-dropdown');
  const methodInput = container.querySelector('#api-method');
  const methodLabel = container.querySelector('#api-method-label');

  methodBtn?.addEventListener('click', e => {
    e.stopPropagation();
    const open = methodDrop.style.display !== 'none';
    methodDrop.style.display = open ? 'none' : '';
  });

  container.querySelectorAll('.api-pm-method-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      const m = opt.dataset.method;
      if (methodLabel) methodLabel.textContent = m;
      if (methodBtn) methodBtn.dataset.method = m;
      if (methodInput) methodInput.value = m;
      container.querySelectorAll('.api-pm-method-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      if (methodDrop) methodDrop.style.display = 'none';
    });
  });

  // Mark initial selection
  container.querySelector(`.api-pm-method-opt[data-method="GET"]`)?.classList.add('selected');

  // Close dropdown on outside click
  document.addEventListener('click', () => {
    if (methodDrop) methodDrop.style.display = 'none';
  });

  // Tabs
  container.querySelectorAll('.tool-tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tool-tab[data-tab]').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.tool-tab-content').forEach(c => c.style.display = 'none');
      tab.classList.add('active');
      const content = container.querySelector(`#tab-${tab.dataset.tab}`);
      if (content) content.style.display = '';
    });
  });

  container.querySelectorAll('[data-rtab]').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('[data-rtab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      container.querySelector('#rtab-body').style.display = tab.dataset.rtab === 'body' ? '' : 'none';
      container.querySelector('#rtab-headers').style.display = tab.dataset.rtab === 'headers' ? '' : 'none';
    });
  });

  // Body type
  container.querySelectorAll('[data-bodytype]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-bodytype]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.bodytype;
      container.querySelector('#body-json-wrap').style.display = type === 'json' ? '' : 'none';
      container.querySelector('#body-form-wrap').style.display = type === 'form' ? '' : 'none';
      container.querySelector('#body-text-wrap').style.display = type === 'text' ? '' : 'none';
      container.querySelector('#body-none-msg').style.display = type === 'none' ? '' : 'none';
    });
  });

  // Auth type
  container.querySelector('#api-auth-type')?.addEventListener('change', e => {
    container.querySelector('#auth-bearer-wrap').style.display = e.target.value === 'bearer' ? '' : 'none';
    container.querySelector('#auth-basic-wrap').style.display = e.target.value === 'basic' ? '' : 'none';
    container.querySelector('#auth-apikey-wrap').style.display = e.target.value === 'api-key' ? '' : 'none';
  });

  // Add header/param rows
  container.querySelector('#api-add-header')?.addEventListener('click', () => {
    container.querySelector('#headers-list').insertAdjacentHTML('beforeend', headerRow());
  });
  container.querySelector('#api-add-param')?.addEventListener('click', () => {
    container.querySelector('#params-list').insertAdjacentHTML('beforeend', paramRow());
  });
  container.querySelector('#api-add-form-field')?.addEventListener('click', () => {
    container.querySelector('#form-body-list').insertAdjacentHTML('beforeend', paramRow());
  });

  // Remove row delegation
  container.addEventListener('click', e => {
    if (e.target.classList.contains('kv-remove')) {
      e.target.closest('.kv-row')?.remove();
    }
  });

  // Send
  container.querySelector('#api-send-btn')?.addEventListener('click', () => sendRequest(container, result => {
    lastResponse = result;
  }));

  // Copy response
  container.querySelector('#api-copy-response')?.addEventListener('click', () => {
    if (lastResponse) clipboardService.copyWithFeedback(lastResponse, container.querySelector('#api-copy-response'));
  });

  // Copy cURL
  container.querySelector('#api-copy-curl')?.addEventListener('click', () => {
    const curl = buildCurl(container);
    if (curl) clipboardService.copyWithFeedback(curl, container.querySelector('#api-copy-curl'));
  });

  // Enter to send
  container.querySelector('#api-url')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') container.querySelector('#api-send-btn')?.click();
  });
}

// ─── Request Builder ────────────────────────────────────────────

async function sendRequest(container, onResponse) {
  const method = container.querySelector('#api-method')?.value ?? 'GET';
  let url = container.querySelector('#api-url')?.value?.trim() ?? '';
  const sendBtn = container.querySelector('#api-send-btn');

  if (!url) { toastService.warning('Please enter a URL'); return; }

  // Append params
  const params = collectKVRows(container.querySelectorAll('#params-list .kv-row'));
  if (params.length) {
    const sp = new URLSearchParams(params);
    url += (url.includes('?') ? '&' : '?') + sp.toString();
  }

  // Build headers
  const headersObj = {};
  collectKVRows(container.querySelectorAll('#headers-list .kv-row'))
    .forEach(([k, v]) => { headersObj[k] = v; });

  // Auth
  const authType = container.querySelector('#api-auth-type')?.value ?? 'none';
  if (authType === 'bearer') {
    const token = container.querySelector('#auth-bearer-token')?.value;
    if (token) headersObj['Authorization'] = `Bearer ${token}`;
  } else if (authType === 'basic') {
    const user = container.querySelector('#auth-basic-user')?.value ?? '';
    const pass = container.querySelector('#auth-basic-pass')?.value ?? '';
    headersObj['Authorization'] = `Basic ${btoa(`${user}:${pass}`)}`;
  } else if (authType === 'api-key') {
    const keyName = container.querySelector('#auth-key-name')?.value ?? 'X-API-Key';
    const keyValue = container.querySelector('#auth-key-value')?.value ?? '';
    if (keyName && keyValue) headersObj[keyName] = keyValue;
  }

  // Body
  let body;
  const bodyType = container.querySelector('[data-bodytype].active')?.dataset.bodytype ?? 'none';
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    if (bodyType === 'json') {
      body = container.querySelector('#api-body-json')?.value?.trim() ?? '';
    } else if (bodyType === 'form') {
      const fields = collectKVRows(container.querySelectorAll('#form-body-list .kv-row'));
      body = new URLSearchParams(fields).toString();
      headersObj['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (bodyType === 'text') {
      body = container.querySelector('#api-body-text')?.value ?? '';
    }
  }

  // UI — loading state
  if (sendBtn) { sendBtn.textContent = 'Sending…'; sendBtn.disabled = true; }
  const placeholder = container.querySelector('#api-response-placeholder');
  if (placeholder) { placeholder.style.display = 'flex'; placeholder.textContent = 'Sending…'; }

  const startTime = performance.now();

  try {
    const opts = {
      method,
      headers: headersObj,
      ...(body != null && body !== '' ? { body } : {}),
    };

    const response = await fetch(url, opts);
    const elapsed = Math.round(performance.now() - startTime);
    const text = await response.text();
    const size = new Blob([text]).size;

    // Render response
    showResponse(container, response, text, elapsed, size);
    onResponse(text);
  } catch (err) {
    showError(container, err.message);
  } finally {
    if (sendBtn) { sendBtn.textContent = 'Send'; sendBtn.disabled = false; }
  }
}

function showResponse(container, response, text, elapsed, size) {
  const ph = container.querySelector('#api-response-placeholder');
  const pre = container.querySelector('#api-response-body');
  const code = container.querySelector('#api-response-code');
  const meta = container.querySelector('#api-response-meta');

  if (ph) ph.style.display = 'none';
  if (pre) pre.style.display = 'block';

  let displayText = text;
  let lang = 'text';

  try {
    const parsed = JSON.parse(text);
    displayText = JSON.stringify(parsed, null, 2);
    lang = 'json';
  } catch { /* not JSON */ }

  if (code) {
    code.textContent = displayText;
    code.className = `language-${lang}`;
    if (window.hljs) window.hljs.highlightElement(code);
  }

  // Status badge
  const statusColor = response.status < 300 ? 'success' : response.status < 400 ? 'warning' : 'error';
  if (meta) {
    meta.innerHTML = `
      <span class="badge badge-${statusColor}" style="font-size: var(--text-xs);">${response.status} ${response.statusText}</span>
      <span style="color: var(--text-tertiary);">${elapsed}ms</span>
      <span style="color: var(--text-tertiary);">${formatBytes(size)}</span>`;
  }

  // Response headers
  const headersTable = container.querySelector('#api-response-headers-table');
  if (headersTable) {
    const rows = [...response.headers.entries()].map(([k, v]) => `
      <tr>
        <td style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--accent-400); white-space: nowrap;">${escapeHtml(k)}</td>
        <td style="font-family: var(--font-mono); font-size: var(--text-xs); word-break: break-all;">${escapeHtml(v)}</td>
      </tr>`).join('');
    headersTable.innerHTML = `<table class="data-table" style="width:100%; font-size: var(--text-xs);"><tbody>${rows}</tbody></table>`;
  }
}

function showError(container, message) {
  const ph = container.querySelector('#api-response-placeholder');
  const pre = container.querySelector('#api-response-body');
  const code = container.querySelector('#api-response-code');
  const meta = container.querySelector('#api-response-meta');

  if (ph) ph.style.display = 'none';
  if (pre) pre.style.display = 'block';
  if (code) {
    code.className = '';
    code.innerHTML = `<span style="color: var(--color-error-text);">✗ Request Failed\n\n${escapeHtml(message)}</span>`;
  }
  if (meta) {
    meta.innerHTML = `<span class="badge badge-error" style="font-size: var(--text-xs);">Error</span>`;
  }
}

function collectKVRows(rows) {
  const pairs = [];
  rows.forEach(row => {
    const enabled = row.querySelector('.kv-check')?.checked ?? true;
    if (!enabled) return;
    const key = row.querySelector('.kv-key')?.value?.trim() ?? '';
    const val = row.querySelector('.kv-value')?.value?.trim() ?? '';
    if (key) pairs.push([key, val]);
  });
  return pairs;
}

function buildCurl(container) {
  const method = container.querySelector('#api-method')?.value ?? 'GET';
  const url = container.querySelector('#api-url')?.value?.trim() ?? '';
  if (!url) return '';

  let curl = `curl -X ${method} '${url}'`;

  collectKVRows(container.querySelectorAll('#headers-list .kv-row')).forEach(([k, v]) => {
    curl += ` \\\n  -H '${k}: ${v}'`;
  });

  const bodyType = container.querySelector('[data-bodytype].active')?.dataset.bodytype ?? 'none';
  if (bodyType === 'json') {
    const body = container.querySelector('#api-body-json')?.value?.trim();
    if (body) curl += ` \\\n  -d '${body.replace(/'/g, "\\'")}'`;
  }

  return curl;
}
