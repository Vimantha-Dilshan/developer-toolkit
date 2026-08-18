/**
 * UUID Generator Tool
 * ====================
 * Generate UUID v1, v4, v7, ULID, NanoID — single or bulk.
 *
 * @module tools/uuid-generator
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { downloadService } from '../../assets/js/services/download.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
    generate(container); // auto-generate on mount
}

// ─── UI ─────────────────────────────────────────────────────────

function buildUI() {
    return `
    <div class="tool-page" id="uuid-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">UUID Generator</h1>
            <p class="tool-description">Generate UUIDs (v1, v4, v7), ULIDs, and NanoIDs — single or in bulk.</p>
          </div>
        </div>
      </div>

      <!-- Options Row -->
      <div class="tool-options-bar" style="flex-wrap: wrap; gap: var(--space-3);">
        <div class="tool-options-group">
          <span class="tool-options-label">Type:</span>
          <select class="select" id="uuid-type" aria-label="UUID type">
            <option value="v4" selected>UUID v4 (random)</option>
            <option value="v1">UUID v1 (time-based)</option>
            <option value="v7">UUID v7 (time-ordered)</option>
            <option value="ulid">ULID</option>
            <option value="nanoid">NanoID</option>
          </select>
        </div>
        <div class="tool-options-group" id="nanoid-options" style="display:none;">
          <span class="tool-options-label">Length:</span>
          <input type="number" id="nanoid-length" class="input" value="21" min="4" max="256" aria-label="NanoID length" style="width: 80px;" />
        </div>
        <div class="tool-options-group">
          <span class="tool-options-label">Count:</span>
          <input type="number" id="uuid-count" class="input" value="1" min="1" max="1000" aria-label="Number of UUIDs to generate" style="width: 80px;" />
        </div>
        <div class="tool-options-group">
          <label class="checkbox-item" title="Output uppercase">
            <input type="checkbox" id="uuid-uppercase" />
            <span class="checkbox-label">Uppercase</span>
          </label>
        </div>
        <div class="tool-options-group" style="margin-left:auto;">
          <button class="btn btn-primary" id="uuid-generate-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
            Generate
          </button>
        </div>
      </div>

      <!-- Output -->
      <div class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">Generated IDs</div>
          <div class="tool-panel-actions">
            <button class="copy-btn" id="uuid-copy-all">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy All
            </button>
            <button class="copy-btn" id="uuid-download">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </button>
          </div>
        </div>
        <div class="tool-panel-body" id="uuid-output-body">
          <!-- UUIDs render here -->
        </div>
      </div>

      <!-- Info Box -->
      <div id="uuid-info-box" class="info-box" style="margin-top: var(--space-4);">
        <!-- type description renders here -->
      </div>
    </div>

    <style>
      .uuid-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: var(--space-3);
      }
      .uuid-row {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-sm);
        transition: background 0.1s;
      }
      .uuid-row:hover {
        background: var(--surface-hover);
      }
      .uuid-value {
        flex: 1;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-primary);
        letter-spacing: 0.03em;
        word-break: break-all;
      }
      .uuid-copy-btn {
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.15s;
      }
      .uuid-row:hover .uuid-copy-btn { opacity: 1; }
    </style>`;
}

// ─── Events ─────────────────────────────────────────────────────

function bindEvents(container) {
    container.querySelector('#uuid-generate-btn')?.addEventListener('click', () => generate(container));

    container.querySelector('#uuid-type')?.addEventListener('change', e => {
        const isNano = e.target.value === 'nanoid';
        container.querySelector('#nanoid-options').style.display = isNano ? 'flex' : 'none';
        updateInfoBox(e.target.value, container);
        generate(container);
    });

    container.querySelector('#uuid-uppercase')?.addEventListener('change', () => generate(container));
    container.querySelector('#uuid-count')?.addEventListener('change', () => generate(container));
    container.querySelector('#nanoid-length')?.addEventListener('change', () => generate(container));

    container.querySelector('#uuid-copy-all')?.addEventListener('click', () => {
        const all = [...container.querySelectorAll('.uuid-value')].map(el => el.textContent).join('\n');
        if (all) clipboardService.copyWithFeedback(all, container.querySelector('#uuid-copy-all'));
    });

    container.querySelector('#uuid-download')?.addEventListener('click', () => {
        const all = [...container.querySelectorAll('.uuid-value')].map(el => el.textContent).join('\n');
        if (all) downloadService.text(all, 'uuids.txt');
    });

    // Keyboard shortcut
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generate(container);
    });

    updateInfoBox('v4', container);
}

// ─── Generate ───────────────────────────────────────────────────

function generate(container) {
    const type = container.querySelector('#uuid-type')?.value ?? 'v4';
    const count = Math.min(1000, Math.max(1, parseInt(container.querySelector('#uuid-count')?.value ?? '1', 10)));
    const uppercase = container.querySelector('#uuid-uppercase')?.checked ?? false;
    const nanoLen = parseInt(container.querySelector('#nanoid-length')?.value ?? '21', 10);

    const ids = [];
    for (let i = 0; i < count; i++) {
        let id = '';
        switch (type) {
            case 'v1': id = generateV1(); break;
            case 'v4': id = generateV4(); break;
            case 'v7': id = generateV7(); break;
            case 'ulid': id = generateULID(); break;
            case 'nanoid': id = generateNanoID(nanoLen); break;
            default: id = generateV4();
        }
        ids.push(uppercase ? id.toUpperCase() : id);
    }

    renderOutput(ids, container);
}

function renderOutput(ids, container) {
    const body = container.querySelector('#uuid-output-body');
    if (!body) return;

    body.innerHTML = `
    <div class="uuid-list" role="list">
      ${ids.map((id, i) => `
        <div class="uuid-row" role="listitem">
          <span class="uuid-value" id="uuid-val-${i}" title="Click to copy" style="cursor:default;">${id}</span>
          <button class="btn btn-ghost btn-xs uuid-copy-btn" data-value="${id}" aria-label="Copy UUID ${id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>`).join('')}
    </div>`;

    // Bind copy buttons
    body.querySelectorAll('[data-value]').forEach(btn => {
        btn.addEventListener('click', () => {
            clipboardService.copyWithFeedback(btn.dataset.value, btn);
        });
    });
}

// ─── UUID Generation Algorithms ─────────────────────────────────

function generateV4() {
    // RFC 4122 v4 UUID
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateV1() {
    // Simplified v1 (uses current timestamp, random node)
    const now = Date.now();
    const t = BigInt(now) * 10000n + 122192928000000000n; // Gregorian epoch offset
    const tLow = Number(t & 0xFFFFFFFFn).toString(16).padStart(8, '0');
    const tMid = Number((t >> 32n) & 0xFFFFn).toString(16).padStart(4, '0');
    const tHi = Number((t >> 48n) & 0x0FFFn | 0x1000n).toString(16).padStart(4, '0');
    const clock = (Math.random() * 0x3FFF | 0x8000).toString(16).padStart(4, '0');
    const node = [...crypto.getRandomValues(new Uint8Array(6))].map(b => b.toString(16).padStart(2, '0')).join('');
    return `${tLow}-${tMid}-${tHi}-${clock}-${node}`;
}

function generateV7() {
    // UUID v7: Unix timestamp ms + random
    const ts = Date.now();
    const high = ts.toString(16).padStart(12, '0');
    const rand = crypto.getRandomValues(new Uint8Array(10));
    rand[0] = (rand[0] & 0x0f) | 0x70; // version 7
    rand[2] = (rand[2] & 0x3f) | 0x80; // variant
    const randHex = [...rand].map(b => b.toString(16).padStart(2, '0')).join('');
    const full = high + randHex;
    return `${full.slice(0, 8)}-${full.slice(8, 12)}-${full.slice(12, 16)}-${full.slice(16, 20)}-${full.slice(20)}`;
}

// ULID alphabet (Crockford base32)
const ULID_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function generateULID() {
    const now = Date.now();
    let ts = '';
    let t = now;
    for (let i = 9; i >= 0; i--) {
        ts = ULID_CHARS[t % 32] + ts;
        t = Math.floor(t / 32);
    }
    let rand = '';
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    let rem = 0, bits = 0;
    for (const b of bytes) {
        rem = (rem << 8) | b;
        bits += 8;
        while (bits >= 5) {
            bits -= 5;
            rand += ULID_CHARS[(rem >> bits) & 31];
        }
    }
    // Ensure 16 random chars
    while (rand.length < 16) rand += ULID_CHARS[0];
    return (ts + rand.slice(0, 16)).toUpperCase();
}

const NANO_ALPHABET = '_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateNanoID(size = 21) {
    const bytes = crypto.getRandomValues(new Uint8Array(size));
    return [...bytes].map(b => NANO_ALPHABET[b % NANO_ALPHABET.length]).join('');
}

// ─── Info Box ───────────────────────────────────────────────────

const TYPE_INFO = {
    v4: { title: 'UUID v4 — Random', desc: 'Fully random 128-bit identifier. Most widely used version. Virtually guaranteed to be unique.' },
    v1: { title: 'UUID v1 — Time-based', desc: 'Based on timestamp and MAC address. Sortable by time but reveals creation time.' },
    v7: { title: 'UUID v7 — Time-ordered', desc: 'Monotonically sortable using Unix timestamp (ms). Ideal for database primary keys.' },
    ulid: { title: 'ULID — Universally Unique Lexicographically Sortable', desc: '128-bit compatible with UUID. URL-safe, case-insensitive, monotonic sorting.' },
    nanoid: { title: 'NanoID — Compact Unique ID', desc: 'URL-safe and compact. Customisable length. Uses a larger alphabet for higher entropy per character.' },
};

function updateInfoBox(type, container) {
    const box = container.querySelector('#uuid-info-box');
    if (!box) return;
    const info = TYPE_INFO[type] ?? TYPE_INFO.v4;
    box.innerHTML = `<strong>${info.title}</strong><br><span>${info.desc}</span>`;
}
