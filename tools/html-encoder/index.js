/**
 * HTML Entity Encoder / Decoder Tool
 * ====================================
 * Encode and decode HTML entities. Special characters reference table.
 *
 * @module tools/html-encoder
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
    <div class="tool-page" id="he-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">HTML Entity Encoder</h1>
            <p class="tool-description">Encode or decode HTML entities. Includes a full special characters reference table.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="he-sample-btn">Sample</button>
        </div>
      </div>

      <!-- Mode -->
      <div class="tool-options-bar" style="margin-bottom: var(--space-4);">
        <div class="tool-options-group">
          <span class="tool-options-label">Mode:</span>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm active" data-he-mode="encode" aria-pressed="true">Encode</button>
            <button class="btn btn-secondary btn-sm" data-he-mode="decode" aria-pressed="false">Decode</button>
          </div>
        </div>
        <div class="tool-options-group">
          <span class="tool-options-label">Encode scope:</span>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm active" data-he-scope="named" aria-pressed="true">Named entities</button>
            <button class="btn btn-secondary btn-sm" data-he-scope="numeric" aria-pressed="false">Numeric (&#38;#123;)</button>
            <button class="btn btn-secondary btn-sm" data-he-scope="all" aria-pressed="false">All non-ASCII</button>
          </div>
        </div>
      </div>

      <div class="tool-layout-split" style="margin-bottom: var(--space-4);">
        <div class="tool-panel">
          <div class="tool-panel-header"><div class="tool-panel-title" id="he-input-label">Input (Plain HTML)</div></div>
          <div class="tool-panel-body">
            <textarea id="he-input" class="code-textarea" rows="14" spellcheck="false" aria-label="HTML entity input" placeholder="&lt;p&gt;Hello &amp; World &lt;/p&gt;"></textarea>
          </div>
          <div class="editor-statusbar"><span class="editor-statusbar-item" id="he-in-count">0 chars</span></div>
        </div>
        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title" id="he-output-label">Output (Encoded)</div>
            <div class="tool-panel-actions">
              <button class="copy-btn" id="he-copy-btn" aria-label="Copy output">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
            </div>
          </div>
          <div class="tool-panel-body">
            <textarea id="he-output" class="code-textarea" rows="14" readonly aria-label="HTML entity output" aria-live="polite"></textarea>
          </div>
          <div class="editor-statusbar"><span class="editor-statusbar-item" id="he-out-count">0 chars</span></div>
        </div>
      </div>

      <!-- Reference table -->
      <div class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">HTML Entities Reference</div>
          <div class="tool-panel-actions">
            <input type="search" id="he-ref-search" class="input input-sm" placeholder="Search…" style="width: 180px;" aria-label="Search reference" />
          </div>
        </div>
        <div class="tool-panel-body" style="overflow: auto; max-height: 420px;">
          <table class="data-table" style="width:100%; font-size: var(--text-xs);" id="he-ref-table">
            <thead><tr><th>Character</th><th>Named entity</th><th>Numeric</th><th>Description</th><th></th></tr></thead>
            <tbody id="he-ref-body"></tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function bindEvents(container) {
    let mode = 'encode';
    let scope = 'named';
    let lastOutput = '';

    const process = debounce(() => {
        const input = container.querySelector('#he-input')?.value ?? '';
        let output = '';

        try {
            if (mode === 'encode') output = encodeEntities(input, scope);
            else output = decodeEntities(input);
        } catch (e) {
            output = '';
        }

        const outEl = container.querySelector('#he-output');
        const inCount = container.querySelector('#he-in-count');
        const outCount = container.querySelector('#he-out-count');
        if (outEl) outEl.value = output;
        if (inCount) inCount.textContent = `${input.length.toLocaleString()} chars`;
        if (outCount) outCount.textContent = `${output.length.toLocaleString()} chars`;
        lastOutput = output;
    }, 150);

    container.querySelector('#he-input')?.addEventListener('input', process);

    container.querySelectorAll('[data-he-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('[data-he-mode]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
            mode = btn.dataset.heMode;
            const inLabel = container.querySelector('#he-input-label');
            const outLabel = container.querySelector('#he-output-label');
            if (inLabel) inLabel.textContent = mode === 'encode' ? 'Input (Plain HTML)' : 'Input (Encoded)';
            if (outLabel) outLabel.textContent = mode === 'encode' ? 'Output (Encoded)' : 'Output (Decoded)';
            process();
        });
    });

    container.querySelectorAll('[data-he-scope]').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('[data-he-scope]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
            scope = btn.dataset.heScope;
            process();
        });
    });

    container.querySelector('#he-copy-btn')?.addEventListener('click', () => {
        if (lastOutput) clipboardService.copyWithFeedback(lastOutput, container.querySelector('#he-copy-btn'));
    });

    container.querySelector('#he-sample-btn')?.addEventListener('click', () => {
        container.querySelector('#he-input').value = SAMPLE;
        process();
    });

    // Reference table
    renderRefTable(container);
    container.querySelector('#he-ref-search')?.addEventListener('input', e => {
        filterRefTable(container, e.target.value);
    });
}

// ─── Encode / Decode ─────────────────────────────────────────────

const NAMED_MAP = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
    '©': '&copy;', '®': '&reg;', '™': '&trade;', '€': '&euro;', '£': '&pound;',
    '¥': '&yen;', '°': '&deg;', '±': '&plusmn;', '×': '&times;', '÷': '&divide;',
    '—': '&mdash;', '–': '&ndash;', '"': '&ldquo;', '"': '&rdquo;', '\u00a0': '&nbsp;',
    '«': '&laquo;', '»': '&raquo;', '¶': '&para;', '§': '&sect;', '†': '&dagger;',
    '‡': '&Dagger;', '•': '&bull;', '…': '&hellip;', '′': '&prime;', '″': '&Prime;',
    '≈': '&asymp;', '≠': '&ne;', '≤': '&le;', '≥': '&ge;', '∞': '&infin;',
    'α': '&alpha;', 'β': '&beta;', 'γ': '&gamma;', 'δ': '&delta;', 'π': '&pi;',
    'µ': '&micro;', '½': '&frac12;', '¼': '&frac14;', '¾': '&frac34;',
};

function encodeEntities(text, scope) {
    if (scope === 'named') {
        return text.split('').map(c => NAMED_MAP[c] ?? c).join('');
    }
    if (scope === 'numeric') {
        return text.split('').map(c => {
            const code = c.charCodeAt(0);
            if (code > 127 || c === '&' || c === '<' || c === '>' || c === '"' || c === "'") return `&#${code};`;
            return c;
        }).join('');
    }
    // all
    return text.split('').map(c => {
        const code = c.charCodeAt(0);
        if (code < 32 && code !== 9 && code !== 10 && code !== 13) return `&#${code};`;
        if (NAMED_MAP[c]) return NAMED_MAP[c];
        if (code > 127) return `&#${code};`;
        return c;
    }).join('');
}

function decodeEntities(text) {
    const el = document.createElement('div');
    el.innerHTML = text;
    return el.textContent ?? '';
}

// ─── Reference table ─────────────────────────────────────────────

const REFERENCE = Object.entries(NAMED_MAP).map(([char, named]) => {
    const code = char.charCodeAt(0);
    const DESCS = {
        '&': 'Ampersand', '<': 'Less-than sign', '>': 'Greater-than sign', '"': 'Double quotation mark',
        "'": 'Apostrophe', '©': 'Copyright sign', '®': 'Registered sign', '™': 'Trade mark sign',
        '€': 'Euro sign', '£': 'Pound sign', '¥': 'Yen sign', '°': 'Degree sign',
        '±': 'Plus-minus sign', '×': 'Multiplication sign', '÷': 'Division sign',
        '—': 'Em dash', '–': 'En dash', '"': 'Left double quotation mark', '"': 'Right double quotation mark',
        '\u00a0': 'Non-breaking space', '«': 'Left angle quote', '»': 'Right angle quote',
        '¶': 'Pilcrow (paragraph)', '§': 'Section sign', '†': 'Dagger', '‡': 'Double dagger',
        '•': 'Bullet', '…': 'Horizontal ellipsis', '≈': 'Almost equal', '≠': 'Not equal',
        '≤': 'Less-than or equal', '≥': 'Greater-than or equal', '∞': 'Infinity',
        'α': 'Greek lowercase alpha', 'β': 'Greek lowercase beta', 'γ': 'Greek lowercase gamma',
        'δ': 'Greek lowercase delta', 'π': 'Pi', 'µ': 'Micro sign',
        '½': 'Vulgar fraction one half', '¼': 'Vulgar fraction one quarter', '¾': 'Vulgar fraction three quarters',
        '′': 'Prime', '″': 'Double prime',
    };
    return { char, named, numeric: `&#${code};`, desc: DESCS[char] ?? `U+${code.toString(16).toUpperCase().padStart(4, '0')}` };
});

function renderRefTable(container) {
    const body = container.querySelector('#he-ref-body');
    if (!body) return;
    body.innerHTML = REFERENCE.map(r => refRow(r)).join('');
}

function refRow(r) {
    return `<tr data-searchable="${escapeHtml(r.char)} ${r.named} ${r.numeric} ${r.desc}">
    <td style="text-align:center; font-size: 1.2em;">${r.char === ' ' ? '&nbsp;' : escapeHtml(r.char)}</td>
    <td style="font-family:var(--font-mono);">${escapeHtml(r.named)}</td>
    <td style="font-family:var(--font-mono); color: var(--text-tertiary);">${escapeHtml(r.numeric)}</td>
    <td style="color: var(--text-secondary);">${escapeHtml(r.desc)}</td>
    <td>
      <button class="btn btn-ghost btn-xs" onclick="navigator.clipboard.writeText('${r.named.replace(/'/g, "\\'")}').catch(()=>{})" title="Copy named entity">Copy</button>
    </td>
  </tr>`;
}

function filterRefTable(container, q) {
    const rows = container.querySelectorAll('#he-ref-body tr');
    const lq = q.toLowerCase();
    rows.forEach(row => {
        const hay = row.dataset.searchable?.toLowerCase() ?? '';
        row.style.display = !lq || hay.includes(lq) ? '' : 'none';
    });
}

const SAMPLE = `<h1>Hello & "World" <script>alert('XSS')</script></h1>
<p>Copyright © 2024 — All rights reserved®</p>
<p>Price: £49.99 or €55.00 or ¥7,000</p>
<p>Equation: 2 × 3 ≠ 7, π ≈ 3.14</p>`;
