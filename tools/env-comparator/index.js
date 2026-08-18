/**
 * ENV Comparator Tool
 * ====================
 * Upload and compare two .env files — find missing, extra and duplicate keys.
 *
 * @module tools/env-comparator
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { downloadService } from '../../assets/js/services/download.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { escapeHtml, readFileAsText } from '../../assets/js/utils/dom.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
}

// ─── UI ─────────────────────────────────────────────────────────

function buildUI() {
    return `
    <div class="tool-page" id="env-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">ENV Comparator</h1>
            <p class="tool-description">Compare two .env files to find missing, extra, duplicate and differing keys.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="env-sample-btn">Load Sample</button>
          <button class="btn btn-ghost btn-sm" id="env-clear-btn">Clear</button>
          <button class="btn btn-primary" id="env-compare-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
            Compare
          </button>
        </div>
      </div>

      <!-- Input row -->
      <div class="tool-layout-split" style="margin-bottom: var(--space-4);">

        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">File A (e.g. .env.development)</div>
            <div class="tool-panel-actions">
              <label class="btn btn-ghost btn-xs">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload
                <input type="file" id="env-upload-a" accept=".env,.txt" class="sr-only" aria-label="Upload .env file A" />
              </label>
            </div>
          </div>
          <div class="tool-panel-body">
            <textarea
              id="env-input-a"
              class="code-textarea"
              placeholder="Paste .env content...\nKEY=value\nDATABASE_URL=postgresql://..."
              rows="14"
              spellcheck="false"
              autocomplete="off"
              aria-label="ENV file A"
            ></textarea>
          </div>
        </div>

        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">File B (e.g. .env.production)</div>
            <div class="tool-panel-actions">
              <label class="btn btn-ghost btn-xs">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload
                <input type="file" id="env-upload-b" accept=".env,.txt" class="sr-only" aria-label="Upload .env file B" />
              </label>
            </div>
          </div>
          <div class="tool-panel-body">
            <textarea
              id="env-input-b"
              class="code-textarea"
              placeholder="Paste .env content...\nKEY=value\nDATABASE_URL=postgresql://..."
              rows="14"
              spellcheck="false"
              autocomplete="off"
              aria-label="ENV file B"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div id="env-results" style="display:none;">

        <!-- Stats row -->
        <div id="env-stats-row" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-4);"></div>

        <!-- Filters -->
        <div class="tool-options-bar" style="margin-bottom: var(--space-3);">
          <div class="tool-options-group">
            <span class="tool-options-label">Show:</span>
            <div class="btn-group">
              <button class="btn btn-secondary btn-sm active" data-filter="all">All</button>
              <button class="btn btn-secondary btn-sm" data-filter="missing-b">Missing in B</button>
              <button class="tool btn-secondary btn-sm btn" data-filter="missing-a">Missing in A</button>
              <button class="btn btn-secondary btn-sm" data-filter="different">Different values</button>
              <button class="btn btn-secondary btn-sm" data-filter="same">Same</button>
            </div>
          </div>
          <div class="tool-options-group" style="margin-left:auto;">
            <button class="copy-btn" id="env-export-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
          </div>
        </div>

        <div class="tool-panel">
          <div class="tool-panel-body" id="env-table-body" style="overflow: auto; max-height: 480px;"></div>
        </div>
      </div>

      <div id="env-empty" style="display:flex; align-items:center; justify-content:center; padding: var(--space-12); color: var(--text-tertiary); font-size: var(--text-sm);">
        Paste or upload two .env files to compare
      </div>
    </div>

    <style>
      .env-status-missing-a  { background: rgba(239,68,68,0.12);  }
      .env-status-missing-b  { background: rgba(245,158,11,0.12); }
      .env-status-different  { background: rgba(59,130,246,0.12); }
      .env-status-same       { background: transparent; }
      .env-badge-missing-a   { background: rgba(239,68,68,0.2);   color: #f87171; }
      .env-badge-missing-b   { background: rgba(245,158,11,0.2);  color: #fbbf24; }
      .env-badge-different   { background: rgba(59,130,246,0.2);  color: #60a5fa; }
      .env-badge-same        { background: rgba(34,197,94,0.2);   color: #4ade80; }
    </style>`;
}

// ─── Events ─────────────────────────────────────────────────────

let _lastResults = [];

function bindEvents(container) {
    container.querySelector('#env-compare-btn')?.addEventListener('click', () => compare(container));

    container.querySelector('#env-sample-btn')?.addEventListener('click', () => {
        container.querySelector('#env-input-a').value = SAMPLE_A;
        container.querySelector('#env-input-b').value = SAMPLE_B;
        compare(container);
    });

    container.querySelector('#env-clear-btn')?.addEventListener('click', () => {
        container.querySelector('#env-input-a').value = '';
        container.querySelector('#env-input-b').value = '';
        container.querySelector('#env-results').style.display = 'none';
        container.querySelector('#env-empty').style.display = 'flex';
        _lastResults = [];
    });

    // File uploads
    container.querySelector('#env-upload-a')?.addEventListener('change', async e => {
        const text = await readFileAsText(e.target.files[0]).catch(() => null);
        if (text) container.querySelector('#env-input-a').value = text;
    });
    container.querySelector('#env-upload-b')?.addEventListener('change', async e => {
        const text = await readFileAsText(e.target.files[0]).catch(() => null);
        if (text) container.querySelector('#env-input-b').value = text;
    });

    // Filters
    container.addEventListener('click', e => {
        const btn = e.target.closest('[data-filter]');
        if (!btn) return;
        container.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTable(_lastResults, btn.dataset.filter, container);
    });

    container.querySelector('#env-export-btn')?.addEventListener('click', () => {
        if (!_lastResults.length) return;
        const csv = ['Key,Status,Value A,Value B']
            .concat(_lastResults.map(r => `${csvCell(r.key)},${r.status},${csvCell(r.valueA ?? '')},${csvCell(r.valueB ?? '')}`))
            .join('\n');
        downloadService.text(csv, 'env-comparison.csv');
    });
}

// ─── Core Compare ───────────────────────────────────────────────

function compare(container) {
    const rawA = container.querySelector('#env-input-a')?.value ?? '';
    const rawB = container.querySelector('#env-input-b')?.value ?? '';

    if (!rawA.trim() && !rawB.trim()) {
        toastService.warning('Please enter content for at least one file');
        return;
    }

    const mapA = parseEnv(rawA);
    const mapB = parseEnv(rawB);
    const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);

    const results = [];
    for (const key of [...allKeys].sort()) {
        const hasA = mapA.has(key);
        const hasB = mapB.has(key);
        let status;
        if (!hasB) status = 'missing-b';
        else if (!hasA) status = 'missing-a';
        else if (mapA.get(key) !== mapB.get(key)) status = 'different';
        else status = 'same';

        results.push({ key, valueA: mapA.get(key), valueB: mapB.get(key), status });
    }

    _lastResults = results;

    // Stats
    const statsEl = container.querySelector('#env-stats-row');
    if (statsEl) {
        const counts = { 'missing-b': 0, 'missing-a': 0, different: 0, same: 0 };
        results.forEach(r => counts[r.status]++);
        statsEl.innerHTML = [
            statCard('Total keys', allKeys.size, ''),
            statCard('Missing in B', counts['missing-b'], 'warning'),
            statCard('Missing in A', counts['missing-a'], 'error'),
            statCard('Different', counts['different'], 'info'),
            statCard('Identical', counts['same'], 'success'),
        ].join('');
    }

    renderTable(results, 'all', container);

    container.querySelector('#env-results').style.display = '';
    container.querySelector('#env-empty').style.display = 'none';
}

function renderTable(results, filter, container) {
    const body = container.querySelector('#env-table-body');
    if (!body) return;

    const filtered = filter === 'all' ? results : results.filter(r => r.status === filter);

    if (!filtered.length) {
        body.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; padding: var(--space-8); color: var(--text-tertiary); font-size: var(--text-sm);">No items match the selected filter</div>`;
        return;
    }

    body.innerHTML = `
    <table class="data-table" style="width:100%;">
      <thead>
        <tr>
          <th style="width: 40%;">Key</th>
          <th style="width: 8%;">Status</th>
          <th style="width: 26%;">Value A</th>
          <th style="width: 26%;">Value B</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(r => `
          <tr class="env-status-${r.status}">
            <td style="font-family: var(--font-mono); font-size: var(--text-xs);">${escapeHtml(r.key)}</td>
            <td><span class="badge env-badge-${r.status}" style="font-size: 10px;">${statusLabel(r.status)}</span></td>
            <td style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary); max-width: 200px; word-break: break-all;">${r.valueA != null ? escapeHtml(maskSecret(r.key, r.valueA)) : '<em style="color:var(--text-tertiary)">—</em>'}</td>
            <td style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary); max-width: 200px; word-break: break-all;">${r.valueB != null ? escapeHtml(maskSecret(r.key, r.valueB)) : '<em style="color:var(--text-tertiary)">—</em>'}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// ─── Helpers ────────────────────────────────────────────────────

function parseEnv(raw) {
    const map = new Map();
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) { map.set(trimmed, ''); continue; }
        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();
        // Strip surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        map.set(key, value);
    }
    return map;
}

const SECRET_KEYS = /password|secret|token|key|api[_-]?key|private|jwt|pass|auth|credential/i;

function maskSecret(key, value) {
    if (SECRET_KEYS.test(key) && value.length > 4) {
        return value.slice(0, 3) + '•'.repeat(Math.min(value.length - 3, 8));
    }
    return value;
}

function statusLabel(s) {
    const m = { 'missing-b': '← missing', 'missing-a': '→ missing', different: '≠ differs', same: '= same' };
    return m[s] ?? s;
}

function statCard(label, value, type) {
    const bg = { warning: 'rgba(245,158,11,0.12)', error: 'rgba(239,68,68,0.12)', info: 'rgba(59,130,246,0.12)', success: 'rgba(34,197,94,0.12)', '': 'var(--surface-secondary)' }[type] ?? 'var(--surface-secondary)';
    return `
    <div style="padding: var(--space-3); background: ${bg}; border: 1px solid var(--border-primary); border-radius: var(--radius-md);">
      <div style="font-size: var(--text-xs); color: var(--text-tertiary); margin-bottom: 2px;">${label}</div>
      <div style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--text-primary);">${value}</div>
    </div>`;
}

function csvCell(val) {
    return `"${String(val).replace(/"/g, '""')}"`;
}

const SAMPLE_A = `# Development environment
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/myapp_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-not-for-production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_BUCKET=myapp-dev-bucket
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
FEATURE_FLAG_BETA=true
`;

const SAMPLE_B = `# Production environment
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://prod-db:5432/myapp_prod
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=super-secure-production-secret-256bits
JWT_EXPIRY=3600
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAI44QH8DHBEXAMPLE
S3_BUCKET=myapp-prod-bucket
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=465
SENTRY_DSN=https://example@sentry.io/123
CDN_URL=https://cdn.example.com
`;
