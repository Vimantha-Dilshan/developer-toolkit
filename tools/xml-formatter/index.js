/**
 * XML Formatter Tool
 * ==================
 * Format, minify, and validate XML with syntax highlighting.
 *
 * @module tools/xml-formatter
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { downloadService } from '../../assets/js/services/download.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { escapeHtml, readFileAsText } from '../../assets/js/utils/dom.utils.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
}

function buildUI() {
    return `
    <div class="tool-page" id="xml-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">XML Formatter</h1>
            <p class="tool-description">Format, minify, and validate XML. Convert XML to JSON. Syntax highlighted output.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="xml-sample-btn">Sample</button>
          <label class="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload
            <input type="file" id="xml-file-input" accept=".xml,.html,.svg,.xhtml" class="sr-only" />
          </label>
        </div>
      </div>

      <!-- Options -->
      <div class="tool-options-bar" style="margin-bottom: var(--space-4);">
        <div class="tool-options-group">
          <span class="tool-options-label">Mode:</span>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm active" data-xml-mode="format" aria-pressed="true">Format</button>
            <button class="btn btn-secondary btn-sm" data-xml-mode="minify" aria-pressed="false">Minify</button>
          </div>
        </div>
        <div class="tool-options-group">
          <span class="tool-options-label">Indent:</span>
          <select class="select" id="xml-indent">
            <option value="2">2 spaces</option>
            <option value="4" selected>4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </div>
        <div class="tool-options-group" style="margin-left: auto;">
          <button class="btn btn-primary btn-sm" id="xml-format-btn">Format XML</button>
          <button class="btn btn-secondary btn-sm" id="xml-validate-btn">Validate</button>
        </div>
      </div>

      <!-- Validation banner -->
      <div id="xml-banner" style="display:none; margin-bottom: var(--space-3);"></div>

      <div class="tool-layout-split">
        <div class="tool-panel">
          <div class="tool-panel-header"><div class="tool-panel-title">Input</div></div>
          <div class="tool-panel-body">
            <textarea id="xml-input" class="code-textarea" rows="20" placeholder="&lt;root&gt;&#10;  &lt;item&gt;value&lt;/item&gt;&#10;&lt;/root&gt;" spellcheck="false" aria-label="XML input"></textarea>
          </div>
          <div class="editor-statusbar" id="xml-in-statusbar"><span class="editor-statusbar-item" id="xml-in-status">—</span></div>
        </div>

        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">Output</div>
            <div class="tool-panel-actions">
              <button class="copy-btn" id="xml-copy-btn" aria-label="Copy output">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
              <button class="copy-btn" id="xml-download-btn" aria-label="Download">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            </div>
          </div>
          <div class="tool-panel-body" style="overflow:auto;">
            <pre id="xml-output-pre" style="display:none; margin:0; padding: var(--space-4);"><code id="xml-output-code" class="language-xml" style="font-size: var(--text-xs);"></code></pre>
            <div id="xml-output-placeholder" style="display:flex; align-items:center; justify-content:center; height:100%; min-height: 340px; color: var(--text-tertiary); font-size: var(--text-sm);">Output will appear here</div>
          </div>
        </div>
      </div>
    </div>`;
}

function bindEvents(container) {
    let currentMode = 'format';
    let lastOutput = '';

    container.querySelectorAll('[data-xml-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('[data-xml-mode]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
            currentMode = btn.dataset.xmlMode;
            container.querySelector('#xml-format-btn').textContent = currentMode === 'format' ? 'Format XML' : 'Minify XML';
            doProcess(container, currentMode, out => { lastOutput = out; });
        });
    });

    const auto = debounce(() => {
        updateInputStatus(container);
        doProcess(container, currentMode, out => { lastOutput = out; });
    }, 400);

    container.querySelector('#xml-input')?.addEventListener('input', auto);
    container.querySelector('#xml-indent')?.addEventListener('change', auto);
    container.querySelector('#xml-format-btn')?.addEventListener('click', () => doProcess(container, currentMode, out => { lastOutput = out; }));
    container.querySelector('#xml-validate-btn')?.addEventListener('click', () => validateOnly(container));

    container.querySelector('#xml-copy-btn')?.addEventListener('click', () => {
        if (lastOutput) clipboardService.copyWithFeedback(lastOutput, container.querySelector('#xml-copy-btn'));
    });
    container.querySelector('#xml-download-btn')?.addEventListener('click', () => {
        if (lastOutput) downloadService.text(lastOutput, 'output.xml');
    });

    container.querySelector('#xml-file-input')?.addEventListener('change', async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await readFileAsText(file).catch(() => null);
        if (text) { container.querySelector('#xml-input').value = text; auto(); }
    });

    container.querySelector('#xml-sample-btn')?.addEventListener('click', () => {
        container.querySelector('#xml-input').value = SAMPLE_XML;
        auto();
    });
}

function updateInputStatus(container) {
    const raw = container.querySelector('#xml-input')?.value ?? '';
    const status = container.querySelector('#xml-in-status');
    if (!status) return;
    if (!raw.trim()) { status.textContent = '—'; return; }
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(raw, 'application/xml');
        const errNode = doc.querySelector('parsererror');
        if (errNode) { status.textContent = '✗ Invalid XML'; status.style.color = 'var(--color-error-text)'; }
        else { status.textContent = '✓ Valid XML'; status.style.color = 'var(--color-success-text)'; }
    } catch { status.textContent = '✗ Error'; }
}

function doProcess(container, mode, onResult) {
    const raw = container.querySelector('#xml-input')?.value ?? '';
    const indentOpt = container.querySelector('#xml-indent')?.value ?? '4';
    const pre = container.querySelector('#xml-output-pre');
    const codeEl = container.querySelector('#xml-output-code');
    const ph = container.querySelector('#xml-output-placeholder');
    const banner = container.querySelector('#xml-banner');

    if (!raw.trim()) {
        if (pre) pre.style.display = 'none';
        if (ph) ph.style.display = 'flex';
        return;
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(raw.trim(), 'application/xml');
        const errNode = doc.querySelector('parsererror');
        if (errNode) throw new Error(errNode.textContent?.slice(0, 200) ?? 'Invalid XML');

        let output = '';
        if (mode === 'minify') {
            output = minifyXML(raw);
        } else {
            const indent = indentOpt === 'tab' ? '\t' : ' '.repeat(parseInt(indentOpt, 10));
            output = formatXML(raw.trim(), indent);
        }

        if (pre) pre.style.display = 'block';
        if (ph) ph.style.display = 'none';
        if (codeEl) {
            codeEl.textContent = output;
            codeEl.className = 'language-xml';
            if (window.hljs) window.hljs.highlightElement(codeEl);
        }
        if (banner) banner.style.display = 'none';

        onResult(output);
    } catch (err) {
        if (pre) pre.style.display = 'none';
        if (ph) { ph.style.display = 'flex'; ph.innerHTML = `<div class="result-error" style="padding: var(--space-4);">${escapeHtml(err.message)}</div>`; }
    }
}

function validateOnly(container) {
    const raw = container.querySelector('#xml-input')?.value ?? '';
    const banner = container.querySelector('#xml-banner');
    if (!raw.trim() || !banner) return;

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(raw.trim(), 'application/xml');
        const errNode = doc.querySelector('parsererror');

        if (errNode) {
            const msg = errNode.textContent?.slice(0, 300) ?? 'Parse error';
            banner.innerHTML = `<div class="result-error">${escapeHtml(msg)}</div>`;
        } else {
            const elementCount = doc.querySelectorAll('*').length;
            banner.innerHTML = `<div class="result-success">✓ Valid XML — ${elementCount} element${elementCount !== 1 ? 's' : ''}</div>`;
        }
        banner.style.display = '';
    } catch (err) {
        banner.innerHTML = `<div class="result-error">${escapeHtml(err.message)}</div>`;
        banner.style.display = '';
    }
}

function formatXML(xml, indent) {
    let output = '';
    let depth = 0;
    const stripped = xml.replace(/>\s+</g, '><');

    stripped.split(/(<[^>]+>)/g).forEach(part => {
        if (!part.trim()) return;
        if (part.match(/^<\/[^>]+>$/)) {
            depth = Math.max(0, depth - 1);
            output += indent.repeat(depth) + part + '\n';
        } else if (part.match(/^<[^/!?][^>]*\/>$/)) {
            output += indent.repeat(depth) + part + '\n';
        } else if (part.match(/^<[^/!?][^>]*>$/)) {
            output += indent.repeat(depth) + part + '\n';
            depth++;
        } else if (part.match(/^<[!?]/)) {
            output += indent.repeat(depth) + part + '\n';
        } else {
            output += indent.repeat(depth) + part.trim() + '\n';
        }
    });

    return output.trim();
}

function minifyXML(xml) {
    return xml.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
}

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="bk101">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
    <genre>Computer</genre>
    <price>44.95</price>
    <publish_date>2000-10-01</publish_date>
    <description>An in-depth look at creating applications with XML.</description>
  </book>
  <book id="bk102">
    <author>Ralls, Kim</author>
    <title>Midnight Rain</title>
    <genre>Fantasy</genre>
    <price>5.95</price>
    <publish_date>2000-12-16</publish_date>
    <description>A former architect battles corporate zombies.</description>
  </book>
</catalog>`;
