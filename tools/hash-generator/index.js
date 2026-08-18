/**
 * Hash Generator Tool
 * ====================
 * Compute MD5 (fallback), SHA-1, SHA-256, SHA-384, SHA-512 hashes
 * from text or file input using the Web Crypto API.
 *
 * @module tools/hash-generator
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';
import { readFileAsText } from '../../assets/js/utils/dom.utils.js';
import { formatBytes } from '../../assets/js/utils/format.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
}

const ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

function buildUI() {
    return `
    <div class="tool-page" id="hash-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">Hash Generator</h1>
            <p class="tool-description">Generate SHA-1, SHA-256, SHA-384 and SHA-512 hashes from text or files using the Web Crypto API.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <label class="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Hash File
            <input type="file" id="hash-file-input" class="sr-only" aria-label="Select file to hash" />
          </label>
        </div>
      </div>

      <!-- Input -->
      <div class="tool-panel" style="margin-bottom: var(--space-4);">
        <div class="tool-panel-header">
          <div class="tool-panel-title">Input Text</div>
        </div>
        <div class="tool-panel-body" style="padding: var(--space-4);">
          <textarea
            id="hash-input"
            class="textarea textarea-mono"
            rows="5"
            placeholder="Enter text to hash..."
            spellcheck="false"
            aria-label="Hash input"
          ></textarea>
          <div id="hash-file-info" style="display:none; margin-top: var(--space-2); font-size: var(--text-xs); color: var(--text-tertiary);"></div>
        </div>
      </div>

      <!-- Options -->
      <div class="tool-options-bar" style="margin-bottom: var(--space-4);">
        <div class="tool-options-group">
          <label class="checkbox-item">
            <input type="checkbox" id="hash-uppercase" />
            <span class="checkbox-label">Uppercase output</span>
          </label>
        </div>
        <div class="tool-options-group">
          <label class="checkbox-item">
            <input type="checkbox" id="hash-hmac" />
            <span class="checkbox-label">HMAC</span>
          </label>
        </div>
        <div id="hash-hmac-key-wrap" style="display:none; gap: var(--space-2); align-items:center;" class="tool-options-group">
          <label class="tool-options-label" for="hash-hmac-key">Secret key:</label>
          <input type="text" id="hash-hmac-key" class="input input-mono input-sm" placeholder="secret..." autocomplete="off" style="max-width: 200px;" aria-label="HMAC secret key" />
        </div>
        <div class="tool-options-group" style="margin-left:auto;">
          <button class="btn btn-primary" id="hash-compute-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/></svg>
            Compute Hashes
          </button>
        </div>
      </div>

      <!-- Hash Results -->
      <div id="hash-results">
        ${ALGORITHMS.map(alg => `
          <div class="tool-panel" style="margin-bottom: var(--space-3);">
            <div class="tool-panel-header">
              <div class="tool-panel-title" style="font-family: var(--font-mono); font-size: var(--text-sm);">${alg}</div>
              <div class="tool-panel-actions">
                <button class="copy-btn hash-copy" data-alg="${alg}" aria-label="Copy ${alg} hash">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
              </div>
            </div>
            <div class="tool-panel-body" style="padding: var(--space-3) var(--space-4);">
              <div id="hash-${alg.toLowerCase().replace('-', '')}" style="font-family: var(--font-mono); font-size: var(--text-sm); word-break: break-all; color: var(--text-tertiary);">
                —
              </div>
            </div>
          </div>`).join('')}
      </div>

      <!-- Verify Panel -->
      <div class="tool-panel" style="margin-top: var(--space-4);">
        <div class="tool-panel-header"><div class="tool-panel-title">Verify Hash</div></div>
        <div class="tool-panel-body" style="padding: var(--space-4);">
          <div style="display: flex; gap: var(--space-3); flex-wrap: wrap; align-items: flex-end;">
            <div style="flex: 1; min-width: 200px;">
              <label class="form-label" for="hash-verify-input">Expected hash</label>
              <input type="text" id="hash-verify-input" class="input input-mono" placeholder="Paste hash to verify..." autocomplete="off" aria-label="Expected hash value" />
            </div>
            <button class="btn btn-secondary" id="hash-verify-btn">Verify</button>
          </div>
          <div id="hash-verify-result" style="min-height: 24px; margin-top: var(--space-2);"></div>
        </div>
      </div>
    </div>`;
}

function bindEvents(container) {
    let currentHashes = {};
    let lastInput = '';

    const compute = async () => {
        const text = container.querySelector('#hash-input')?.value ?? '';
        const upper = container.querySelector('#hash-uppercase')?.checked ?? false;
        const hmac = container.querySelector('#hash-hmac')?.checked ?? false;
        const hmacKey = container.querySelector('#hash-hmac-key')?.value ?? '';

        lastInput = text;
        currentHashes = {};

        if (!text) {
            ALGORITHMS.forEach(alg => {
                const el = container.querySelector(`#hash-${alg.toLowerCase().replace('-', '')}`);
                if (el) { el.textContent = '—'; el.style.color = 'var(--text-tertiary)'; }
            });
            return;
        }

        for (const alg of ALGORITHMS) {
            try {
                const hash = hmac && hmacKey
                    ? await computeHMAC(text, alg, hmacKey)
                    : await computeHash(text, alg);

                const display = upper ? hash.toUpperCase() : hash;
                currentHashes[alg] = display;

                const el = container.querySelector(`#hash-${alg.toLowerCase().replace('-', '')}`);
                if (el) { el.textContent = display; el.style.color = 'var(--text-primary)'; }
            } catch (err) {
                const el = container.querySelector(`#hash-${alg.toLowerCase().replace('-', '')}`);
                if (el) { el.textContent = `Error: ${err.message}`; el.style.color = 'var(--color-error-text)'; }
            }
        }
    };

    container.querySelector('#hash-input')?.addEventListener('input', debounce(compute, 200));
    container.querySelector('#hash-compute-btn')?.addEventListener('click', compute);
    container.querySelector('#hash-uppercase')?.addEventListener('change', compute);
    container.querySelector('#hash-hmac')?.addEventListener('change', e => {
        container.querySelector('#hash-hmac-key-wrap').style.display = e.target.checked ? 'flex' : 'none';
        compute();
    });
    container.querySelector('#hash-hmac-key')?.addEventListener('input', debounce(compute, 300));

    container.querySelector('#hash-file-input')?.addEventListener('change', async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await readFileAsText(file).catch(() => null);
        if (text !== null) {
            const inputEl = container.querySelector('#hash-input');
            if (inputEl) inputEl.value = text;
            const info = container.querySelector('#hash-file-info');
            if (info) { info.style.display = ''; info.textContent = `File: ${file.name} (${formatBytes(file.size)})`; }
            await compute();
        }
    });

    // Copy individual hashes
    container.querySelectorAll('.hash-copy').forEach(btn => {
        btn.addEventListener('click', () => {
            const alg = btn.dataset.alg;
            const hash = currentHashes[alg] ?? container.querySelector(`#hash-${alg.toLowerCase().replace('-', '')}`)?.textContent ?? '';
            if (hash && hash !== '—') clipboardService.copyWithFeedback(hash, btn);
        });
    });

    // Verify
    container.querySelector('#hash-verify-btn')?.addEventListener('click', () => {
        const expected = container.querySelector('#hash-verify-input')?.value?.trim().toLowerCase() ?? '';
        const resultEl = container.querySelector('#hash-verify-result');
        if (!expected) { if (resultEl) resultEl.innerHTML = ''; return; }

        const match = Object.values(currentHashes).some(h => h.toLowerCase() === expected);
        if (resultEl) {
            resultEl.innerHTML = match
                ? `<div class="result-success">✓ Hash match found!</div>`
                : `<div class="result-error">✗ No matching hash found. Check the algorithm and input.</div>`;
        }
    });
}

async function computeHash(text, algorithm) {
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const hash = await crypto.subtle.digest(algorithm, data);
    return bufToHex(hash);
}

async function computeHMAC(text, algorithm, key) {
    const enc = new TextEncoder();
    const keyBuf = enc.encode(key);
    const msgBuf = enc.encode(text);
    const cryptoKey = await crypto.subtle.importKey(
        'raw', keyBuf,
        { name: 'HMAC', hash: algorithm },
        false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgBuf);
    return bufToHex(sig);
}

function bufToHex(buf) {
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
