/**
 * Password Generator Tool
 * ========================
 * Generate strong, customisable passwords with entropy meter.
 *
 * @module tools/password-generator
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
    generate(container);
}

const CHARSETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
    similar: 'iIlL1oO0',
};

function buildUI() {
    return `
    <div class="tool-page" id="pwd-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">Password Generator</h1>
            <p class="tool-description">Generate cryptographically strong passwords with customisable rules and entropy measurement.</p>
          </div>
        </div>
      </div>

      <div style="max-width: 620px; margin: 0 auto;">
        <!-- Output Display -->
        <div class="tool-panel" style="margin-bottom: var(--space-4);">
          <div class="tool-panel-body" style="padding: var(--space-5);">
            <div style="display: flex; align-items: center; gap: var(--space-3);">
              <input
                id="pwd-output"
                type="text"
                class="input input-mono"
                readonly
                aria-label="Generated password"
                style="flex: 1; font-size: var(--text-xl); letter-spacing: 0.05em;"
              />
              <button class="btn btn-ghost btn-sm" id="pwd-toggle-vis" title="Show/hide password" aria-pressed="false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="btn btn-primary btn-sm" id="pwd-copy-btn" aria-label="Copy password">Copy</button>
              <button class="btn btn-ghost btn-sm" id="pwd-refresh-btn" title="Generate new password" aria-label="Generate new password">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
              </button>
            </div>

            <!-- Strength bar -->
            <div style="margin-top: var(--space-4);">
              <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-1); font-size: var(--text-xs); color: var(--text-tertiary);">
                <span>Strength</span>
                <span id="pwd-strength-label">—</span>
              </div>
              <div style="height: 6px; background: var(--surface-tertiary); border-radius: var(--radius-full); overflow: hidden;">
                <div id="pwd-strength-bar" style="height: 100%; width: 0; transition: width 0.3s, background 0.3s; border-radius: var(--radius-full);"></div>
              </div>
              <div style="font-size: var(--text-xs); color: var(--text-tertiary); margin-top: var(--space-1);">
                Entropy: <span id="pwd-entropy">—</span> bits
              </div>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="tool-panel" style="margin-bottom: var(--space-4);">
          <div class="tool-panel-header"><div class="tool-panel-title">Settings</div></div>
          <div class="tool-panel-body" style="padding: var(--space-4);">

            <div class="form-group">
              <label class="form-label" for="pwd-length">Length: <span id="pwd-length-display">16</span></label>
              <input type="range" id="pwd-length" min="4" max="128" value="16" step="1" class="range-input" aria-label="Password length" />
              <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); color: var(--text-tertiary); margin-top: 2px;">
                <span>4</span><span>32</span><span>64</span><span>128</span>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); margin-top: var(--space-3);">
              <label class="checkbox-item"><input type="checkbox" id="pwd-upper"   checked /><span class="checkbox-label">Uppercase (A–Z)</span></label>
              <label class="checkbox-item"><input type="checkbox" id="pwd-lower"   checked /><span class="checkbox-label">Lowercase (a–z)</span></label>
              <label class="checkbox-item"><input type="checkbox" id="pwd-digits"  checked /><span class="checkbox-label">Digits (0–9)</span></label>
              <label class="checkbox-item"><input type="checkbox" id="pwd-symbols" checked /><span class="checkbox-label">Symbols (!@#$…)</span></label>
              <label class="checkbox-item"><input type="checkbox" id="pwd-no-similar" /><span class="checkbox-label">Exclude similar (iIl1oO0)</span></label>
              <label class="checkbox-item"><input type="checkbox" id="pwd-no-ambiguous" /><span class="checkbox-label">Exclude ambiguous ({}[]()…)</span></label>
            </div>

            <div class="form-group" style="margin-top: var(--space-3);">
              <label class="form-label" for="pwd-custom-chars">Custom extra characters</label>
              <input type="text" id="pwd-custom-chars" class="input input-mono" placeholder="e.g. #%^" autocomplete="off" aria-label="Custom characters" />
            </div>
          </div>
        </div>

        <!-- Bulk generation -->
        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">Bulk Generation</div>
            <div class="tool-panel-actions">
              <button class="btn btn-secondary btn-sm" id="pwd-bulk-btn">Generate Batch</button>
              <button class="copy-btn" id="pwd-bulk-copy">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy All
              </button>
            </div>
          </div>
          <div class="tool-panel-body" style="padding: var(--space-3) var(--space-4);">
            <div style="display: flex; gap: var(--space-3); align-items: center; margin-bottom: var(--space-3);">
              <label class="form-label" style="margin: 0;" for="pwd-bulk-count">Count:</label>
              <input type="number" id="pwd-bulk-count" class="input" value="10" min="1" max="100" style="width: 80px;" aria-label="Bulk count" />
            </div>
            <textarea id="pwd-bulk-output" class="code-textarea" rows="6" readonly aria-label="Bulk passwords" aria-live="polite"></textarea>
          </div>
        </div>
      </div>
    </div>

    <style>
      .range-input { -webkit-appearance: none; width: 100%; height: 6px; border-radius: var(--radius-full); background: var(--surface-tertiary); outline: none; }
      .range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent-500); cursor: pointer; }
    </style>`;
}

function bindEvents(container) {
    const regen = () => generate(container);

    container.querySelector('#pwd-length')?.addEventListener('input', e => {
        const label = container.querySelector('#pwd-length-display');
        if (label) label.textContent = e.target.value;
        regen();
    });

    ['pwd-upper', 'pwd-lower', 'pwd-digits', 'pwd-symbols', 'pwd-no-similar', 'pwd-no-ambiguous'].forEach(id => {
        container.querySelector(`#${id}`)?.addEventListener('change', regen);
    });

    container.querySelector('#pwd-custom-chars')?.addEventListener('input', debounce(regen, 300));
    container.querySelector('#pwd-refresh-btn')?.addEventListener('click', regen);

    container.querySelector('#pwd-copy-btn')?.addEventListener('click', () => {
        const pwd = container.querySelector('#pwd-output')?.value;
        if (pwd) clipboardService.copyWithFeedback(pwd, container.querySelector('#pwd-copy-btn'));
    });

    container.querySelector('#pwd-toggle-vis')?.addEventListener('click', e => {
        const input = container.querySelector('#pwd-output');
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        e.currentTarget.setAttribute('aria-pressed', String(!show));
    });

    container.querySelector('#pwd-bulk-btn')?.addEventListener('click', () => generateBulk(container));

    container.querySelector('#pwd-bulk-copy')?.addEventListener('click', () => {
        const text = container.querySelector('#pwd-bulk-output')?.value;
        if (text) clipboardService.copyWithFeedback(text, container.querySelector('#pwd-bulk-copy'));
    });
}

function buildCharset(container) {
    let cs = '';
    if (container.querySelector('#pwd-upper')?.checked) cs += CHARSETS.upper;
    if (container.querySelector('#pwd-lower')?.checked) cs += CHARSETS.lower;
    if (container.querySelector('#pwd-digits')?.checked) cs += CHARSETS.digits;
    if (container.querySelector('#pwd-symbols')?.checked) cs += CHARSETS.symbols;

    const custom = container.querySelector('#pwd-custom-chars')?.value ?? '';
    if (custom) cs += custom;

    if (container.querySelector('#pwd-no-similar')?.checked) {
        cs = [...cs].filter(c => !CHARSETS.similar.includes(c)).join('');
    }
    if (container.querySelector('#pwd-no-ambiguous')?.checked) {
        cs = cs.replace(/[{}[\]()\\/`'"~,;.:!]/g, '');
    }

    return [...new Set(cs)].join(''); // dedupe
}

function generatePassword(charset, length) {
    if (!charset) return '';
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    const chars = [];
    for (const b of bytes) {
        if (chars.length >= length) break;
        const idx = b % charset.length;
        chars.push(charset[idx]);
    }
    return chars.join('');
}

function generate(container) {
    const charset = buildCharset(container);
    const length = parseInt(container.querySelector('#pwd-length')?.value ?? '16', 10);

    if (!charset) { toastService.warning('Select at least one character set'); return; }

    const pwd = generatePassword(charset, length);

    const output = container.querySelector('#pwd-output');
    if (output) output.value = pwd;

    // Entropy = log2(charset^length) = length * log2(charset.length)
    const entropy = Math.round(length * Math.log2(charset.length));
    const strengthEl = container.querySelector('#pwd-strength-label');
    const strengthBar = container.querySelector('#pwd-strength-bar');
    const entropyEl = container.querySelector('#pwd-entropy');

    if (entropyEl) entropyEl.textContent = entropy;

    const { label, color, pct } = getStrength(entropy);
    if (strengthEl) strengthEl.textContent = label;
    if (strengthBar) { strengthBar.style.width = `${pct}%`; strengthBar.style.background = color; }
}

function generateBulk(container) {
    const charset = buildCharset(container);
    const length = parseInt(container.querySelector('#pwd-length')?.value ?? '16', 10);
    const count = Math.min(100, Math.max(1, parseInt(container.querySelector('#pwd-bulk-count')?.value ?? '10', 10)));
    if (!charset) { toastService.warning('Select at least one character set'); return; }
    const passwords = Array.from({ length: count }, () => generatePassword(charset, length));
    const output = container.querySelector('#pwd-bulk-output');
    if (output) output.value = passwords.join('\n');
}

function getStrength(entropy) {
    if (entropy < 28) return { label: 'Very Weak', color: '#ef4444', pct: 10 };
    if (entropy < 36) return { label: 'Weak', color: '#f97316', pct: 25 };
    if (entropy < 60) return { label: 'Moderate', color: '#eab308', pct: 50 };
    if (entropy < 80) return { label: 'Strong', color: '#22c55e', pct: 75 };
    if (entropy < 100) return { label: 'Very Strong', color: '#10b981', pct: 88 };
    return { label: 'Excellent', color: '#8b5cf6', pct: 100 };
}
