/**
 * JSON Compare Tool
 * =================
 * Deep diff two JSON objects or arrays — highlight added, removed, and changed keys.
 *
 * @module tools/json-compare
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
}

function buildUI() {
    return `
    <div class="tool-page" id="jcmp-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">JSON Compare</h1>
            <p class="tool-description">Deep diff two JSON objects. Visualize added, removed, modified, and unchanged fields.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="jcmp-sample-btn">Load Sample</button>
          <button class="btn btn-primary" id="jcmp-compare-btn">Compare</button>
        </div>
      </div>

      <!-- Input split -->
      <div class="tool-layout-split" style="margin-bottom: var(--space-4);">
        <div class="tool-panel">
          <div class="tool-panel-header"><div class="tool-panel-title">JSON A (Original)</div></div>
          <div class="tool-panel-body">
            <textarea id="jcmp-a" class="code-textarea" rows="14" placeholder='{"key": "value"}' spellcheck="false" aria-label="JSON A"></textarea>
          </div>
          <div class="editor-statusbar" id="jcmp-a-status" aria-live="polite"><span class="editor-statusbar-item">—</span></div>
        </div>
        <div class="tool-panel">
          <div class="tool-panel-header"><div class="tool-panel-title">JSON B (Modified)</div></div>
          <div class="tool-panel-body">
            <textarea id="jcmp-b" class="code-textarea" rows="14" placeholder='{"key": "changed"}' spellcheck="false" aria-label="JSON B"></textarea>
          </div>
          <div class="editor-statusbar" id="jcmp-b-status" aria-live="polite"><span class="editor-statusbar-item">—</span></div>
        </div>
      </div>

      <!-- Diff Result -->
      <div id="jcmp-result" style="display:none;">
        <!-- Stats -->
        <div id="jcmp-stats" style="display: flex; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-4);"></div>

        <!-- Diff view -->
        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">Diff View</div>
            <div class="tool-panel-actions">
              <button class="copy-btn" id="jcmp-copy-patch" aria-label="Copy JSON Patch">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                JSON Patch
              </button>
            </div>
          </div>
          <div class="tool-panel-body" id="jcmp-diff-body" style="overflow: auto; max-height: 560px;"></div>
        </div>
      </div>

      <div id="jcmp-empty" style="display:flex; align-items:center; justify-content:center; padding: var(--space-12); color: var(--text-tertiary); font-size: var(--text-sm);">
        Paste JSON in both panels and click Compare
      </div>
    </div>

    <style>
      .diff-added   { background: rgba(34,197,94,0.1); }
      .diff-removed { background: rgba(239,68,68,0.1); }
      .diff-changed { background: rgba(245,158,11,0.1); }
      .diff-row { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-2) var(--space-4); border-bottom: 1px solid var(--border-primary); font-family: var(--font-mono); font-size: var(--text-xs); }
      .diff-symbol { min-width: 14px; font-weight: var(--font-bold); }
      .diff-symbol.add  { color: #4ade80; }
      .diff-symbol.rem  { color: #f87171; }
      .diff-symbol.chg  { color: #fbbf24; }
      .diff-symbol.same { color: var(--text-tertiary); }
      .diff-path  { color: var(--accent-400); flex: 1; min-width: 140px; }
      .diff-val   { flex: 1; word-break: break-all; }
      .diff-val.a-val { color: #f87171; }
      .diff-val.b-val { color: #4ade80; }
    </style>`;
}

function bindEvents(container) {
    let lastPatch = [];

    container.querySelector('#jcmp-compare-btn')?.addEventListener('click', () => {
        lastPatch = compare(container);
    });

    container.querySelector('#jcmp-sample-btn')?.addEventListener('click', () => {
        container.querySelector('#jcmp-a').value = JSON.stringify(SAMPLE_A, null, 2);
        container.querySelector('#jcmp-b').value = JSON.stringify(SAMPLE_B, null, 2);
        lastPatch = compare(container);
    });

    container.querySelector('#jcmp-copy-patch')?.addEventListener('click', () => {
        if (lastPatch.length) {
            clipboardService.copyWithFeedback(JSON.stringify(lastPatch, null, 2), container.querySelector('#jcmp-copy-patch'));
        }
    });

    // Status bars
    const onInput = debounce(() => {
        updateStatus(container.querySelector('#jcmp-a')?.value, container.querySelector('#jcmp-a-status'));
        updateStatus(container.querySelector('#jcmp-b')?.value, container.querySelector('#jcmp-b-status'));
    }, 200);
    container.querySelector('#jcmp-a')?.addEventListener('input', onInput);
    container.querySelector('#jcmp-b')?.addEventListener('input', onInput);
}

function updateStatus(raw, statusEl) {
    if (!statusEl) return;
    const span = statusEl.querySelector('.editor-statusbar-item');
    if (!span) return;
    try {
        const obj = JSON.parse(raw ?? '');
        const keyCount = typeof obj === 'object' && obj !== null ? Object.keys(obj).length : 0;
        span.textContent = `✓ Valid · ${keyCount} top-level keys`;
        span.style.color = 'var(--color-success-text)';
    } catch {
        span.textContent = '✗ Invalid JSON';
        span.style.color = 'var(--color-error-text)';
    }
}

function compare(container) {
    const rawA = container.querySelector('#jcmp-a')?.value?.trim() ?? '';
    const rawB = container.querySelector('#jcmp-b')?.value?.trim() ?? '';
    const result = container.querySelector('#jcmp-result');
    const emptyEl = container.querySelector('#jcmp-empty');

    let a, b;
    try { a = JSON.parse(rawA); } catch { toastService.error('JSON A is invalid'); return []; }
    try { b = JSON.parse(rawB); } catch { toastService.error('JSON B is invalid'); return []; }

    const diffs = [];
    deepDiff(a, b, '', diffs);

    const patch = diffs
        .filter(d => d.type !== 'same')
        .map(d => {
            if (d.type === 'added') return { op: 'add', path: `/${d.path.replace(/\./g, '/')}`, value: d.b };
            if (d.type === 'removed') return { op: 'remove', path: `/${d.path.replace(/\./g, '/')}` };
            if (d.type === 'changed') return { op: 'replace', path: `/${d.path.replace(/\./g, '/')}`, value: d.b };
            return null;
        })
        .filter(Boolean);

    // Stats
    const counts = diffs.reduce((acc, d) => { acc[d.type] = (acc[d.type] || 0) + 1; return acc; }, {});
    const statsEl = container.querySelector('#jcmp-stats');
    if (statsEl) {
        statsEl.innerHTML = [
            ['Added', counts.added ?? 0, 'rgba(34,197,94,0.2)', '#4ade80'],
            ['Removed', counts.removed ?? 0, 'rgba(239,68,68,0.2)', '#f87171'],
            ['Changed', counts.changed ?? 0, 'rgba(245,158,11,0.2)', '#fbbf24'],
            ['Unchanged', counts.same ?? 0, 'var(--surface-secondary)', 'var(--text-secondary)'],
        ].map(([label, count, bg, color]) => `
      <div style="padding: var(--space-2) var(--space-4); background: ${bg}; border-radius: var(--radius-md); border: 1px solid var(--border-primary);">
        <span style="font-weight: var(--font-bold); color: ${color}; font-size: var(--text-lg);">${count}</span>
        <span style="font-size: var(--text-xs); color: var(--text-tertiary); margin-left: 4px;">${label}</span>
      </div>`).join('');
    }

    // Diff view
    const body = container.querySelector('#jcmp-diff-body');
    if (body) {
        body.innerHTML = diffs.map(d => {
            const typeMap = { added: 'add', removed: 'rem', changed: 'chg', same: 'same' };
            const symMap = { added: '+', removed: '−', changed: '~', same: ' ' };
            const clsMap = { added: 'diff-added', removed: 'diff-removed', changed: 'diff-changed', same: '' };

            const aVal = d.a !== undefined ? JSON.stringify(d.a) : '';
            const bVal = d.b !== undefined ? JSON.stringify(d.b) : '';

            return `
        <div class="diff-row ${clsMap[d.type]}">
          <span class="diff-symbol ${typeMap[d.type]}">${symMap[d.type]}</span>
          <span class="diff-path">${escapeHtml(d.path || '(root)')}</span>
          ${d.type === 'changed' ? `
            <span class="diff-val a-val">${escapeHtml(aVal)}</span>
            <span style="color: var(--text-tertiary); flex-shrink:0;">→</span>
            <span class="diff-val b-val">${escapeHtml(bVal)}</span>
          ` : d.type === 'added' ? `
            <span class="diff-val b-val">${escapeHtml(bVal)}</span>
          ` : d.type === 'removed' ? `
            <span class="diff-val a-val">${escapeHtml(aVal)}</span>
          ` : `
            <span class="diff-val" style="color:var(--text-tertiary);">${escapeHtml(aVal)}</span>
          `}
        </div>`;
        }).join('');
    }

    if (result) result.style.display = '';
    if (emptyEl) emptyEl.style.display = 'none';

    return patch;
}

function deepDiff(a, b, path, diffs) {
    const bothObjects = isObj(a) && isObj(b);
    const bothArrays = Array.isArray(a) && Array.isArray(b);

    if (bothObjects || bothArrays) {
        const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
        for (const key of keys) {
            const childPath = path ? `${path}.${key}` : key;
            if (!(key in (a ?? {}))) {
                diffs.push({ type: 'added', path: childPath, b: b[key] });
            } else if (!(key in (b ?? {}))) {
                diffs.push({ type: 'removed', path: childPath, a: a[key] });
            } else {
                deepDiff(a[key], b[key], childPath, diffs);
            }
        }
        return;
    }

    if (JSON.stringify(a) === JSON.stringify(b)) {
        diffs.push({ type: 'same', path, a, b });
    } else {
        diffs.push({ type: 'changed', path, a, b });
    }
}

function isObj(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const SAMPLE_A = {
    id: 1, name: 'Alice', email: 'alice@example.com',
    role: 'admin', active: true, score: 9.5,
    address: { city: 'New York', country: 'USA' },
    tags: ['developer', 'designer'],
};
const SAMPLE_B = {
    id: 1, name: 'Alice Smith', email: 'alice.smith@example.com',
    role: 'superadmin', active: false, score: 9.5,
    address: { city: 'San Francisco', country: 'USA', zip: '94102' },
    tags: ['developer', 'architect'],
    lastLogin: '2024-11-01T12:00:00Z',
};
