/**
 * JWT Decoder Tool
 * ================
 * Decode and inspect JSON Web Tokens — header, payload, signature,
 * claims, expiration countdown, and algorithm badge.
 *
 * @module tools/jwt-decoder
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';

let _countdownInterval = null;

export function mount(container) {
    clearInterval(_countdownInterval);
    container.innerHTML = buildUI();
    bindEvents(container);
}

export function unmount() {
    clearInterval(_countdownInterval);
}

// ─── Sample token (never real; generated for demo purposes) ─────
const SAMPLE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTksInJvbGUiOiJhZG1pbiIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlzcyI6ImRldnRvb2xraXQiLCJhdWQiOiJ1c2VycyJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// ─── UI ─────────────────────────────────────────────────────────

function buildUI() {
    return `
    <div class="tool-page" id="jwt-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">JWT Decoder</h1>
            <p class="tool-description">Decode and inspect JSON Web Tokens. View header, payload, claims and expiration details.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="jwt-sample-btn">Load Sample</button>
          <button class="btn btn-ghost btn-sm" id="jwt-clear-btn">Clear</button>
        </div>
      </div>

      <!-- Input -->
      <div class="tool-panel" style="margin-bottom: var(--space-4);">
        <div class="tool-panel-header">
          <div class="tool-panel-title">JWT Token</div>
        </div>
        <div class="tool-panel-body" style="padding: var(--space-4);">
          <textarea
            id="jwt-input"
            class="textarea textarea-mono"
            placeholder="Paste your JWT token here..."
            rows="4"
            spellcheck="false"
            autocomplete="off"
            aria-label="JWT token input"
          ></textarea>
          <div id="jwt-status" style="margin-top: var(--space-2); min-height: 24px;"></div>
        </div>
      </div>

      <!-- Output Panels -->
      <div id="jwt-output" style="display: none;">
        <div class="tool-layout-split" style="min-height: 0;">

          <!-- Header -->
          <div class="tool-panel">
            <div class="tool-panel-header">
              <div class="tool-panel-title" style="display:flex; align-items:center; gap:var(--space-2);">
                HEADER
                <span id="jwt-alg-badge" class="badge badge-primary" style="font-size:10px;"></span>
              </div>
              <div class="tool-panel-actions">
                <button class="copy-btn" id="jwt-copy-header">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
              </div>
            </div>
            <div class="tool-panel-body" style="overflow: auto;">
              <pre style="margin:0;"><code id="jwt-header-output" class="language-json" style="padding: var(--space-4); display: block;"></code></pre>
            </div>
          </div>

          <!-- Payload -->
          <div class="tool-panel">
            <div class="tool-panel-header">
              <div class="tool-panel-title">PAYLOAD</div>
              <div class="tool-panel-actions">
                <button class="copy-btn" id="jwt-copy-payload">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
              </div>
            </div>
            <div class="tool-panel-body" style="overflow: auto;">
              <pre style="margin:0;"><code id="jwt-payload-output" class="language-json" style="padding: var(--space-4); display: block;"></code></pre>
            </div>
          </div>
        </div>

        <!-- Claims Summary -->
        <div class="tool-panel" style="margin-top: var(--space-4);">
          <div class="tool-panel-header">
            <div class="tool-panel-title">CLAIMS SUMMARY</div>
          </div>
          <div class="tool-panel-body" style="padding: var(--space-4);">
            <div id="jwt-claims-grid" class="jwt-claims-grid"></div>
          </div>
        </div>
      </div>

      <div id="jwt-empty" style="display:flex; align-items:center; justify-content:center; padding: var(--space-12) var(--space-4); color: var(--text-tertiary); font-size: var(--text-sm); text-align:center;">
        Paste a JWT token above to decode it
      </div>
    </div>

    <style>
      .jwt-claims-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--space-3);
      }
      .jwt-claim-card {
        padding: var(--space-3);
        background: var(--surface-secondary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-md);
      }
      .jwt-claim-name {
        font-size: var(--text-xs);
        font-weight: var(--font-semibold);
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: var(--tracking-wider);
        margin-bottom: var(--space-1);
      }
      .jwt-claim-value {
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        color: var(--text-primary);
        font-family: var(--font-mono);
        word-break: break-all;
      }
      .jwt-claim-desc {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        margin-top: 2px;
      }
      .jwt-expired { border-color: rgba(239,68,68,0.3); background: var(--color-error-bg); }
      .jwt-valid   { border-color: rgba(34,197,94,0.3); background: var(--color-success-bg); }
    </style>`;
}

// ─── Events ─────────────────────────────────────────────────────

function bindEvents(container) {
    const input = container.querySelector('#jwt-input');

    input?.addEventListener('input', debounce(e => decode(e.target.value.trim(), container), 300));

    container.querySelector('#jwt-sample-btn')?.addEventListener('click', () => {
        if (input) input.value = SAMPLE_TOKEN;
        decode(SAMPLE_TOKEN, container);
    });

    container.querySelector('#jwt-clear-btn')?.addEventListener('click', () => {
        if (input) input.value = '';
        container.querySelector('#jwt-output').style.display = 'none';
        container.querySelector('#jwt-empty').style.display = 'flex';
        container.querySelector('#jwt-status').innerHTML = '';
        clearInterval(_countdownInterval);
    });

    container.querySelector('#jwt-copy-header')?.addEventListener('click', () => {
        const code = container.querySelector('#jwt-header-output')?.textContent;
        if (code) clipboardService.copyWithFeedback(code, container.querySelector('#jwt-copy-header'));
    });

    container.querySelector('#jwt-copy-payload')?.addEventListener('click', () => {
        const code = container.querySelector('#jwt-payload-output')?.textContent;
        if (code) clipboardService.copyWithFeedback(code, container.querySelector('#jwt-copy-payload'));
    });
}

// ─── Core Decode Logic ───────────────────────────────────────────

function decode(token, container) {
    const outputEl = container.querySelector('#jwt-output');
    const emptyEl = container.querySelector('#jwt-empty');
    const statusEl = container.querySelector('#jwt-status');

    if (!token) {
        outputEl.style.display = 'none';
        emptyEl.style.display = 'flex';
        statusEl.innerHTML = '';
        clearInterval(_countdownInterval);
        return;
    }

    const parts = token.split('.');

    if (parts.length !== 3) {
        statusEl.innerHTML = `<div class="result-error" style="padding: var(--space-2) var(--space-3);">Invalid JWT format — expected 3 parts separated by dots, got ${parts.length}.</div>`;
        outputEl.style.display = 'none';
        emptyEl.style.display = 'none';
        return;
    }

    try {
        const header = decodeBase64Url(parts[0]);
        const payload = decodeBase64Url(parts[1]);

        const headerParsed = JSON.parse(header);
        const payloadParsed = JSON.parse(payload);

        // Show output
        outputEl.style.display = 'block';
        emptyEl.style.display = 'none';

        // Algorithm badge
        const algBadge = container.querySelector('#jwt-alg-badge');
        if (algBadge) algBadge.textContent = headerParsed.alg ?? 'unknown';

        // Header
        const headerCode = container.querySelector('#jwt-header-output');
        if (headerCode) {
            headerCode.textContent = JSON.stringify(headerParsed, null, 2);
            if (window.hljs) window.hljs.highlightElement(headerCode);
        }

        // Payload
        const payloadCode = container.querySelector('#jwt-payload-output');
        if (payloadCode) {
            payloadCode.textContent = JSON.stringify(payloadParsed, null, 2);
            if (window.hljs) window.hljs.highlightElement(payloadCode);
        }

        // Claims summary
        renderClaims(payloadParsed, container);

        // Status
        const now = Math.floor(Date.now() / 1000);
        const exp = payloadParsed.exp;

        if (exp) {
            const expired = now > exp;
            statusEl.innerHTML = expired
                ? `<div class="result-error" style="padding: var(--space-2) var(--space-3);">⚠ Token is expired (expired ${formatTimeDiff(now - exp)} ago)</div>`
                : `<div class="result-success" style="padding: var(--space-2) var(--space-3);">✓ Token is valid — expires in ${formatTimeDiff(exp - now)}</div>`;

            // Live countdown
            clearInterval(_countdownInterval);
            if (!expired) {
                _countdownInterval = setInterval(() => {
                    const remaining = exp - Math.floor(Date.now() / 1000);
                    if (remaining <= 0) {
                        clearInterval(_countdownInterval);
                        statusEl.innerHTML = `<div class="result-error" style="padding: var(--space-2) var(--space-3);">⚠ Token just expired</div>`;
                    } else {
                        statusEl.innerHTML = `<div class="result-success" style="padding: var(--space-2) var(--space-3);">✓ Token is valid — expires in ${formatTimeDiff(remaining)}</div>`;
                    }
                }, 1000);
            }
        } else {
            statusEl.innerHTML = `<div style="padding: var(--space-2) var(--space-3); color: var(--text-tertiary); font-size: var(--text-sm);">ℹ No expiration claim (exp)</div>`;
        }

    } catch (err) {
        statusEl.innerHTML = `<div class="result-error" style="padding: var(--space-2) var(--space-3);">Failed to decode JWT: ${escapeHtml(err.message)}</div>`;
        outputEl.style.display = 'none';
        emptyEl.style.display = 'none';
    }
}

function decodeBase64Url(str) {
    // Replace URL-safe characters and add padding
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    return decodeURIComponent(
        atob(padded).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
}

const CLAIM_LABELS = {
    sub: { label: 'Subject', desc: 'Token subject (user identifier)' },
    iss: { label: 'Issuer', desc: 'Who issued this token' },
    aud: { label: 'Audience', desc: 'Intended recipients' },
    exp: { label: 'Expires At', desc: 'Expiration time' },
    iat: { label: 'Issued At', desc: 'When the token was issued' },
    nbf: { label: 'Not Before', desc: 'Token is not valid before this time' },
    jti: { label: 'JWT ID', desc: 'Unique identifier for this token' },
    name: { label: 'Name', desc: 'Full name' },
    email: { label: 'Email', desc: 'Email address' },
    role: { label: 'Role', desc: 'User role' },
};

function renderClaims(payload, container) {
    const grid = container.querySelector('#jwt-claims-grid');
    if (!grid) return;

    const now = Math.floor(Date.now() / 1000);

    grid.innerHTML = Object.entries(payload).map(([key, value]) => {
        const meta = CLAIM_LABELS[key] ?? { label: key, desc: '' };
        let displayValue = value;
        let extraClass = '';

        // Format timestamps
        if (['exp', 'iat', 'nbf'].includes(key) && typeof value === 'number') {
            const date = new Date(value * 1000);
            displayValue = date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
            if (key === 'exp') {
                extraClass = now > value ? 'jwt-expired' : 'jwt-valid';
            }
        }

        if (Array.isArray(value)) displayValue = value.join(', ');
        if (typeof value === 'object' && value !== null) displayValue = JSON.stringify(value);

        return `
      <div class="jwt-claim-card ${extraClass}">
        <div class="jwt-claim-name">${escapeHtml(meta.label)}</div>
        <div class="jwt-claim-value">${escapeHtml(String(displayValue))}</div>
        ${meta.desc ? `<div class="jwt-claim-desc">${escapeHtml(meta.desc)}</div>` : ''}
      </div>`;
    }).join('');
}

function formatTimeDiff(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}
