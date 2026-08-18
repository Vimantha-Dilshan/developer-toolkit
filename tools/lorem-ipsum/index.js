/**
 * Lorem Ipsum Generator Tool
 * ==========================
 * Generate lorem ipsum text by words, sentences, or paragraphs.
 * Supports HTML output mode.
 *
 * @module tools/lorem-ipsum
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { downloadService } from '../../assets/js/services/download.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
    generate(container);
}

function buildUI() {
    return `
    <div class="tool-page" id="lorem-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">Lorem Ipsum Generator</h1>
            <p class="tool-description">Generate placeholder text by words, sentences, or paragraphs. Optional HTML output.</p>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="tool-panel" style="margin-bottom: var(--space-4);">
        <div class="tool-panel-body" style="padding: var(--space-4);">
          <div style="display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: flex-end;">

            <div class="form-group" style="min-width: 120px;">
              <label class="form-label" for="lorem-type">Type</label>
              <select class="select" id="lorem-type">
                <option value="paragraphs" selected>Paragraphs</option>
                <option value="sentences">Sentences</option>
                <option value="words">Words</option>
                <option value="lists">List items</option>
              </select>
            </div>

            <div class="form-group" style="min-width: 120px;">
              <label class="form-label" for="lorem-count">Count: <span id="lorem-count-label">3</span></label>
              <input type="range" id="lorem-count" min="1" max="20" value="3" class="range-input" aria-label="Lorem ipsum count" />
            </div>

            <div class="form-group">
              <label class="form-label">Options</label>
              <div style="display: flex; flex-direction: column; gap: var(--space-1);">
                <label class="checkbox-item">
                  <input type="checkbox" id="lorem-start" checked />
                  <span class="checkbox-label">Start with "Lorem ipsum…"</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" id="lorem-html" />
                  <span class="checkbox-label">HTML output</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Tags (HTML mode)</label>
              <select class="select" id="lorem-tag" aria-label="HTML tag">
                <option value="p">Paragraph &lt;p&gt;</option>
                <option value="li">List item &lt;li&gt;</option>
                <option value="h2">Heading &lt;h2&gt;</option>
                <option value="span">Inline &lt;span&gt;</option>
                <option value="div">Div &lt;div&gt;</option>
              </select>
            </div>

            <div style="margin-left: auto;">
              <button class="btn btn-primary" id="lorem-gen-btn" style="height: 38px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Regenerate
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Output -->
      <div class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">Generated Text</div>
          <div class="tool-panel-actions">
            <span id="lorem-char-count" style="font-size: var(--text-xs); color: var(--text-tertiary); margin-right: var(--space-2);"></span>
            <button class="copy-btn" id="lorem-copy-btn" aria-label="Copy text">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy
            </button>
            <button class="copy-btn" id="lorem-download-btn" aria-label="Download text">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <textarea id="lorem-output" class="code-textarea" rows="18" readonly aria-label="Generated lorem ipsum text" aria-live="polite"></textarea>
        </div>
      </div>
    </div>

    <style>
      .range-input { -webkit-appearance: none; width: 100%; height: 6px; border-radius: var(--radius-full); background: var(--surface-tertiary); outline: none; }
      .range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent-500); cursor: pointer; }
    </style>`;
}

function bindEvents(container) {
    container.querySelector('#lorem-gen-btn')?.addEventListener('click', () => generate(container));

    container.querySelector('#lorem-count')?.addEventListener('input', e => {
        const label = container.querySelector('#lorem-count-label');
        if (label) label.textContent = e.target.value;
        generate(container);
    });

    ['#lorem-type', '#lorem-start', '#lorem-html', '#lorem-tag'].forEach(sel => {
        container.querySelector(sel)?.addEventListener('change', () => generate(container));
    });

    container.querySelector('#lorem-copy-btn')?.addEventListener('click', () => {
        const out = container.querySelector('#lorem-output')?.value ?? '';
        if (out) clipboardService.copyWithFeedback(out, container.querySelector('#lorem-copy-btn'));
    });

    container.querySelector('#lorem-download-btn')?.addEventListener('click', () => {
        const out = container.querySelector('#lorem-output')?.value ?? '';
        const html = container.querySelector('#lorem-html')?.checked ?? false;
        if (out) downloadService.text(out, html ? 'lorem.html' : 'lorem.txt');
    });
}

function generate(container) {
    const type = container.querySelector('#lorem-type')?.value ?? 'paragraphs';
    const count = parseInt(container.querySelector('#lorem-count')?.value ?? '3', 10);
    const startLorem = container.querySelector('#lorem-start')?.checked ?? true;
    const htmlMode = container.querySelector('#lorem-html')?.checked ?? false;
    const tag = container.querySelector('#lorem-tag')?.value ?? 'p';

    let output = '';

    switch (type) {
        case 'paragraphs': {
            const paras = buildParagraphs(count, startLorem);
            output = htmlMode ? paras.map(p => `<${tag}>${p}</${tag}>`).join('\n\n') : paras.join('\n\n');
            break;
        }
        case 'sentences': {
            const all = buildSentences(count, startLorem);
            output = htmlMode ? `<${tag}>${all.join(' ')}</${tag}>` : all.join(' ');
            break;
        }
        case 'words': {
            const words = buildWords(count, startLorem);
            output = htmlMode ? `<${tag}>${words.join(' ')}</${tag}>` : words.join(' ');
            break;
        }
        case 'lists': {
            const items = buildParagraphs(count, startLorem).map(p => p.split('.')[0] + '.');
            output = htmlMode
                ? `<ul>\n${items.map(i => `  <li>${i}</li>`).join('\n')}\n</ul>`
                : items.map(i => `• ${i}`).join('\n');
            break;
        }
    }

    const outEl = container.querySelector('#lorem-output');
    const charCount = container.querySelector('#lorem-char-count');
    if (outEl) outEl.value = output;
    if (charCount) charCount.textContent = `${output.length.toLocaleString()} chars`;
}

// ─── Text generation ─────────────────────────────────────────────

const LOREM_WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
    'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
    'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
    'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
    'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
    'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde', 'omnis', 'iste', 'natus',
    'error', 'voluptatem', 'accusantium', 'doloremque', 'laudantium', 'totam', 'rem', 'aperiam',
    'eaque', 'ipsa', 'quae', 'ab', 'illo', 'inventore', 'veritatis', 'quasi', 'architecto', 'beatae',
    'vitae', 'dicta', 'explicabo', 'nemo', 'ipsam', 'quia', 'aspernatur', 'odit', 'aut', 'fugit',
];

function rndWord() {
    return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function buildWords(count, startLorem) {
    const arr = [];
    if (startLorem && count >= 2) {
        arr.push('Lorem', 'ipsum');
        for (let i = 2; i < count; i++) arr.push(rndWord());
    } else {
        for (let i = 0; i < count; i++) arr.push(rndWord());
    }
    if (arr.length) arr[0] = arr[0].charAt(0).toUpperCase() + arr[0].slice(1);
    return arr;
}

function buildSentences(count, startLorem) {
    const sentences = [];
    for (let s = 0; s < count; s++) {
        const wordCount = 8 + Math.floor(Math.random() * 10);
        const words = [];
        for (let w = 0; w < wordCount; w++) words.push(rndWord());
        if (s === 0 && startLorem) { words[0] = 'Lorem'; words[1] = 'ipsum'; }
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        sentences.push(words.join(' ') + '.');
    }
    return sentences;
}

function buildParagraphs(count, startLorem) {
    const paras = [];
    for (let p = 0; p < count; p++) {
        const sentCount = 3 + Math.floor(Math.random() * 4);
        paras.push(buildSentences(sentCount, p === 0 && startLorem).join(' '));
    }
    return paras;
}
