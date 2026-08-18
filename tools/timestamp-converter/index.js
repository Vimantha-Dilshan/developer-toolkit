/**
 * Timestamp Converter Tool
 * =========================
 * Convert Unix timestamps ↔ human-readable dates across timezones.
 *
 * @module tools/timestamp-converter
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';

let _interval = null;

export function mount(container) {
    clearInterval(_interval);
    container.innerHTML = buildUI();
    bindEvents(container);
    renderNow(container);
    // Tick live
    _interval = setInterval(() => updateLive(container), 1000);
}

export function unmount() {
    clearInterval(_interval);
}

const FORMATS = [
    { id: 'iso', label: 'ISO 8601', fn: d => d.toISOString() },
    { id: 'utc', label: 'UTC string', fn: d => d.toUTCString() },
    { id: 'local', label: 'Local string', fn: d => d.toLocaleString() },
    { id: 'rfc', label: 'RFC 2822', fn: d => d.toUTCString().replace('GMT', '+0000') },
    { id: 'date', label: 'Date only', fn: d => d.toISOString().slice(0, 10) },
    { id: 'time', label: 'Time only (UTC)', fn: d => d.toISOString().slice(11, 19) },
];

function buildUI() {
    return `
    <div class="tool-page" id="ts-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">Timestamp Converter</h1>
            <p class="tool-description">Convert Unix timestamps to and from human-readable dates across multiple formats and timezones.</p>
          </div>
        </div>
      </div>

      <!-- Live Now Card -->
      <div class="tool-panel" style="margin-bottom: var(--space-4);">
        <div class="tool-panel-body" style="padding: var(--space-4);">
          <div style="display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap;">
            <div>
              <div style="font-size: var(--text-xs); color: var(--text-tertiary); margin-bottom: 2px;">Current Unix Timestamp</div>
              <div id="ts-live-unix" style="font-family: var(--font-mono); font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--accent-400);"></div>
            </div>
            <div style="flex:1; min-width: 200px;">
              <div style="font-size: var(--text-xs); color: var(--text-tertiary); margin-bottom: 2px;">Current UTC Time</div>
              <div id="ts-live-iso" style="font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-secondary);"></div>
            </div>
            <button class="btn btn-ghost btn-sm" id="ts-use-now-btn">Use Now</button>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);" class="ts-grid">

        <!-- Unix → Human -->
        <div class="tool-panel">
          <div class="tool-panel-header"><div class="tool-panel-title">Unix Timestamp → Date</div></div>
          <div class="tool-panel-body" style="padding: var(--space-4);">
            <div class="form-group">
              <label class="form-label" for="ts-unix-input">Unix Timestamp (seconds or ms)</label>
              <div style="display: flex; gap: var(--space-2);">
                <input type="number" id="ts-unix-input" class="input input-mono" placeholder="e.g. 1710000000" autocomplete="off" aria-label="Unix timestamp" style="flex:1;" />
                <button class="btn btn-primary btn-sm" id="ts-unix-convert-btn">Convert</button>
              </div>
            </div>
            <div id="ts-unix-results" style="display:none; margin-top: var(--space-3);">
              ${FORMATS.map(f => `
                <div style="display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) 0; border-bottom: 1px solid var(--border-primary);">
                  <span style="font-size: var(--text-xs); color: var(--text-tertiary); min-width: 120px;">${f.label}</span>
                  <span id="ts-fmt-${f.id}" style="font-family: var(--font-mono); font-size: var(--text-xs); flex:1; word-break:break-all;"></span>
                  <button class="btn btn-ghost btn-xs ts-copy-fmt" data-fmt="${f.id}" aria-label="Copy ${f.label}">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                </div>`).join('')}
              <div style="margin-top: var(--space-3);">
                <div id="ts-relative-time" style="font-size: var(--text-sm); color: var(--text-secondary);"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Human → Unix -->
        <div class="tool-panel">
          <div class="tool-panel-header"><div class="tool-panel-title">Date → Unix Timestamp</div></div>
          <div class="tool-panel-body" style="padding: var(--space-4);">
            <div class="form-group">
              <label class="form-label" for="ts-date-input">Date / Time String</label>
              <input type="datetime-local" id="ts-date-input" class="input input-mono" aria-label="Date input" />
            </div>
            <div class="form-group">
              <label class="form-label" for="ts-tz">Timezone offset</label>
              <select class="select" id="ts-tz" aria-label="Timezone">
                <option value="local" selected>Local (${getLocalTZLabel()})</option>
                <option value="0">UTC +0</option>
                <option value="-5">UTC -5 (EST)</option>
                <option value="-8">UTC -8 (PST)</option>
                <option value="5.5">UTC +5:30 (IST)</option>
                <option value="8">UTC +8 (CST)</option>
                <option value="9">UTC +9 (JST)</option>
                <option value="10">UTC +10 (AEST)</option>
              </select>
            </div>
            <button class="btn btn-primary btn-sm" id="ts-date-convert-btn" style="width:100%;">Convert</button>
            <div id="ts-date-results" style="display:none; margin-top: var(--space-3);">
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div class="ts-result-row"><span>Seconds</span><span id="ts-out-sec" class="mono"></span></div>
                <div class="ts-result-row"><span>Milliseconds</span><span id="ts-out-ms" class="mono"></span></div>
                <div class="ts-result-row"><span>ISO 8601</span><span id="ts-out-iso" class="mono"></span></div>
              </div>
              <button class="btn btn-ghost btn-sm" id="ts-copy-unix" style="margin-top: var(--space-2);">Copy Unix (seconds)</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Batch Converter -->
      <div class="tool-panel" style="margin-top: var(--space-4);">
        <div class="tool-panel-header">
          <div class="tool-panel-title">Batch Converter</div>
          <div class="tool-panel-actions">
            <button class="copy-btn" id="ts-batch-copy">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy Results
            </button>
          </div>
        </div>
        <div class="tool-panel-body" style="padding: var(--space-4);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
            <div>
              <label class="form-label">Unix timestamps (one per line)</label>
              <textarea id="ts-batch-input" class="code-textarea" rows="6" placeholder="1710000000&#10;1720000000&#10;1730000000" spellcheck="false" aria-label="Batch input timestamps"></textarea>
            </div>
            <div>
              <label class="form-label">ISO 8601 Results</label>
              <textarea id="ts-batch-output" class="code-textarea" rows="6" readonly aria-label="Batch output dates" aria-live="polite"></textarea>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="ts-batch-btn" style="margin-top: var(--space-2);">Convert All</button>
        </div>
      </div>
    </div>

    <style>
      .ts-result-row { display: flex; justify-content: space-between; padding: var(--space-2) 0; border-bottom: 1px solid var(--border-primary); font-size: var(--text-sm); }
      .ts-result-row span { color: var(--text-secondary); }
      .ts-result-row .mono { font-family: var(--font-mono); color: var(--text-primary); }
      @media (max-width: 640px) { .ts-grid { grid-template-columns: 1fr; } }
    </style>`;
}

function getLocalTZLabel() {
    const offset = -new Date().getTimezoneOffset() / 60;
    return `UTC ${offset >= 0 ? '+' : ''}${offset}`;
}

function bindEvents(container) {
    container.querySelector('#ts-unix-input')?.addEventListener('input', debounce(() => convertUnix(container), 300));
    container.querySelector('#ts-unix-convert-btn')?.addEventListener('click', () => convertUnix(container));
    container.querySelector('#ts-date-convert-btn')?.addEventListener('click', () => convertDate(container));
    container.querySelector('#ts-use-now-btn')?.addEventListener('click', () => {
        const el = container.querySelector('#ts-unix-input');
        if (el) { el.value = String(Math.floor(Date.now() / 1000)); convertUnix(container); }
    });

    container.querySelector('#ts-batch-btn')?.addEventListener('click', () => batchConvert(container));

    container.querySelector('#ts-batch-copy')?.addEventListener('click', () => {
        const out = container.querySelector('#ts-batch-output')?.value;
        if (out) clipboardService.copyWithFeedback(out, container.querySelector('#ts-batch-copy'));
    });

    container.querySelector('#ts-copy-unix')?.addEventListener('click', () => {
        const sec = container.querySelector('#ts-out-sec')?.textContent;
        if (sec) clipboardService.copyWithFeedback(sec, container.querySelector('#ts-copy-unix'));
    });

    container.querySelectorAll('.ts-copy-fmt').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = container.querySelector(`#ts-fmt-${btn.dataset.fmt}`)?.textContent;
            if (val) clipboardService.copyWithFeedback(val, btn);
        });
    });
}

function convertUnix(container) {
    const raw = container.querySelector('#ts-unix-input')?.value?.trim() ?? '';
    const results = container.querySelector('#ts-unix-results');

    if (!raw) { if (results) results.style.display = 'none'; return; }

    let ts = parseInt(raw, 10);
    // Auto-detect ms vs s
    if (ts > 1e12) ts = Math.floor(ts / 1000); // ms → s
    const date = new Date(ts * 1000);

    if (isNaN(date.getTime())) { if (results) results.style.display = 'none'; return; }

    if (results) results.style.display = '';

    FORMATS.forEach(f => {
        const el = container.querySelector(`#ts-fmt-${f.id}`);
        if (el) el.textContent = f.fn(date);
    });

    const relEl = container.querySelector('#ts-relative-time');
    if (relEl) {
        const now = Date.now();
        const diffMs = now - date.getTime();
        const rel = formatRelative(diffMs);
        relEl.textContent = diffMs >= 0 ? `${rel} ago` : `in ${rel}`;
    }
}

function convertDate(container) {
    const raw = container.querySelector('#ts-date-input')?.value ?? '';
    const tzVal = container.querySelector('#ts-tz')?.value ?? 'local';
    const results = container.querySelector('#ts-date-results');

    if (!raw) { if (results) results.style.display = 'none'; return; }

    let date;
    if (tzVal === 'local') {
        date = new Date(raw);
    } else {
        const offset = parseFloat(tzVal) * 60;
        const d = new Date(raw);
        const utc = d.getTime() - d.getTimezoneOffset() * 60000 - offset * 60000;
        date = new Date(utc);
    }

    if (isNaN(date.getTime())) { if (results) results.style.display = 'none'; return; }

    if (results) results.style.display = '';

    const sec = container.querySelector('#ts-out-sec');
    const ms = container.querySelector('#ts-out-ms');
    const iso = container.querySelector('#ts-out-iso');

    if (sec) sec.textContent = String(Math.floor(date.getTime() / 1000));
    if (ms) ms.textContent = String(date.getTime());
    if (iso) iso.textContent = date.toISOString();
}

function batchConvert(container) {
    const raw = container.querySelector('#ts-batch-input')?.value ?? '';
    const lines = raw.split('\n').filter(l => l.trim());
    const output = lines.map(line => {
        const ts = parseInt(line.trim(), 10);
        if (isNaN(ts)) return `${line.trim()} → [invalid]`;
        const date = new Date((ts > 1e12 ? ts : ts * 1000));
        return `${line.trim()} → ${date.toISOString()}`;
    });
    const outEl = container.querySelector('#ts-batch-output');
    if (outEl) outEl.value = output.join('\n');
}

function renderNow(container) {
    const now = Date.now();
    const unix = container.querySelector('#ts-live-unix');
    const iso = container.querySelector('#ts-live-iso');
    if (unix) unix.textContent = String(Math.floor(now / 1000));
    if (iso) iso.textContent = new Date(now).toISOString();
}

function updateLive(container) {
    if (!document.getElementById('ts-root')) { clearInterval(_interval); return; }
    renderNow(container);
}

function formatRelative(ms) {
    const abs = Math.abs(ms);
    if (abs < 60000) return `${Math.floor(abs / 1000)}s`;
    if (abs < 3600000) return `${Math.floor(abs / 60000)}m`;
    if (abs < 86400000) return `${Math.floor(abs / 3600000)}h`;
    if (abs < 2592000000) return `${Math.floor(abs / 86400000)}d`;
    if (abs < 31536000000) return `${Math.floor(abs / 2592000000)}mo`;
    return `${Math.floor(abs / 31536000000)}y`;
}
