/**
 * CSV ↔ JSON Converter Tool
 * =========================
 * Convert CSV to JSON (array of objects or 2D array) and JSON to CSV.
 *
 * @module tools/csv-json
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
    <div class="tool-page" id="csv-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">CSV ↔ JSON Converter</h1>
            <p class="tool-description">Convert between CSV and JSON formats. Preview data in a table, customise delimiters and headers.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="csv-sample-btn">Load Sample</button>
          <label class="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload
            <input type="file" id="csv-file-input" accept=".csv,.json,.txt" class="sr-only" aria-label="Upload CSV or JSON file" />
          </label>
        </div>
      </div>

      <!-- Mode + Options -->
      <div class="tool-options-bar" style="margin-bottom: var(--space-4); flex-wrap: wrap;">
        <div class="tool-options-group">
          <span class="tool-options-label">Mode:</span>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm active" id="csv-mode-csv2json" aria-pressed="true">CSV → JSON</button>
            <button class="btn btn-secondary btn-sm" id="csv-mode-json2csv" aria-pressed="false">JSON → CSV</button>
          </div>
        </div>
        <div class="tool-options-group">
          <span class="tool-options-label">Delimiter:</span>
          <select class="select" id="csv-delimiter">
            <option value="," selected>Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="&#9;">Tab</option>
            <option value="|">Pipe (|)</option>
          </select>
        </div>
        <div class="tool-options-group">
          <label class="checkbox-item">
            <input type="checkbox" id="csv-has-header" checked />
            <span class="checkbox-label">First row as header</span>
          </label>
        </div>
        <div class="tool-options-group">
          <label class="checkbox-item">
            <input type="checkbox" id="csv-pretty" checked />
            <span class="checkbox-label">Pretty-print JSON</span>
          </label>
        </div>
        <div class="tool-options-group" style="margin-left:auto;">
          <button class="btn btn-primary" id="csv-convert-btn">Convert</button>
        </div>
      </div>

      <div class="tool-layout-split" style="min-height: 420px;">
        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title" id="csv-input-label">CSV Input</div>
          </div>
          <div class="tool-panel-body">
            <textarea id="csv-input" class="code-textarea" rows="16" placeholder="name,age,city&#10;Alice,30,New York&#10;Bob,25,London" spellcheck="false" aria-label="CSV input"></textarea>
          </div>
        </div>

        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title" id="csv-output-label">JSON Output</div>
            <div class="tool-panel-actions">
              <button class="copy-btn" id="csv-copy-btn" aria-label="Copy output">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
              <button class="copy-btn" id="csv-download-btn" aria-label="Download output">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            </div>
          </div>
          <div class="tool-panel-body">
            <pre id="csv-output-pre" style="display:none; margin:0;"><code id="csv-output-code" class="language-json"></code></pre>
            <div id="csv-output-placeholder" style="display:flex; align-items:center; justify-content:center; height:100%; min-height:340px; color: var(--text-tertiary); font-size: var(--text-sm);">
              Output will appear here
            </div>
          </div>
          <div class="editor-statusbar" id="csv-status-bar"><span class="editor-statusbar-item" id="csv-status">Ready</span></div>
        </div>
      </div>

      <!-- Table Preview -->
      <div class="tool-panel" style="margin-top: var(--space-4);" id="csv-table-panel">
        <div class="tool-panel-header"><div class="tool-panel-title">Table Preview</div></div>
        <div class="tool-panel-body" id="csv-table-body" style="overflow: auto; max-height: 320px;">
          <div style="display:flex; align-items:center; justify-content:center; padding: var(--space-8); color: var(--text-tertiary); font-size: var(--text-sm);">Convert data to see a table preview</div>
        </div>
      </div>
    </div>`;
}

function bindEvents(container) {
    let mode = 'csv2json';
    let lastOutput = '';
    let lastExt = 'json';

    const convert = debounce(() => doConvert(container, mode, result => { lastOutput = result.text; lastExt = result.ext; }), 400);

    container.querySelector('#csv-mode-csv2json')?.addEventListener('click', () => {
        mode = 'csv2json';
        container.querySelector('#csv-mode-csv2json')?.classList.add('active');
        container.querySelector('#csv-mode-json2csv')?.classList.remove('active');
        container.querySelector('#csv-input-label').textContent = 'CSV Input';
        container.querySelector('#csv-output-label').textContent = 'JSON Output';
        convert();
    });
    container.querySelector('#csv-mode-json2csv')?.addEventListener('click', () => {
        mode = 'json2csv';
        container.querySelector('#csv-mode-json2csv')?.classList.add('active');
        container.querySelector('#csv-mode-csv2json')?.classList.remove('active');
        container.querySelector('#csv-input-label').textContent = 'JSON Input';
        container.querySelector('#csv-output-label').textContent = 'CSV Output';
        convert();
    });

    container.querySelector('#csv-input')?.addEventListener('input', convert);
    container.querySelector('#csv-delimiter')?.addEventListener('change', convert);
    container.querySelector('#csv-has-header')?.addEventListener('change', convert);
    container.querySelector('#csv-pretty')?.addEventListener('change', convert);
    container.querySelector('#csv-convert-btn')?.addEventListener('click', () => doConvert(container, mode, result => { lastOutput = result.text; lastExt = result.ext; }));

    container.querySelector('#csv-copy-btn')?.addEventListener('click', () => {
        if (lastOutput) clipboardService.copyWithFeedback(lastOutput, container.querySelector('#csv-copy-btn'));
    });
    container.querySelector('#csv-download-btn')?.addEventListener('click', () => {
        if (lastOutput) downloadService.text(lastOutput, `output.${lastExt}`);
    });

    container.querySelector('#csv-file-input')?.addEventListener('change', async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await readFileAsText(file).catch(() => null);
        if (text) { container.querySelector('#csv-input').value = text; convert(); }
    });

    container.querySelector('#csv-sample-btn')?.addEventListener('click', () => {
        container.querySelector('#csv-input').value = SAMPLE_CSV;
        convert();
    });
}

function doConvert(container, mode, onResult) {
    const raw = container.querySelector('#csv-input')?.value ?? '';
    const delimiter = container.querySelector('#csv-delimiter')?.value ?? ',';
    const hasHeader = container.querySelector('#csv-has-header')?.checked ?? true;
    const pretty = container.querySelector('#csv-pretty')?.checked ?? true;

    const pre = container.querySelector('#csv-output-pre');
    const codeEl = container.querySelector('#csv-output-code');
    const placeholder = container.querySelector('#csv-output-placeholder');
    const statusEl = container.querySelector('#csv-status');

    if (!raw.trim()) {
        if (pre) pre.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        return;
    }

    try {
        let outputText = '';
        let ext = 'json';

        if (mode === 'csv2json') {
            const data = csvToJson(raw, delimiter, hasHeader);
            outputText = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
            renderTableFromArray(Array.isArray(data) ? data : [], container);
        } else {
            const parsed = JSON.parse(raw);
            outputText = jsonToCsv(parsed, delimiter);
            ext = 'csv';
            if (codeEl) { codeEl.className = 'language-plaintext'; }
            renderTableFromCsv(outputText, delimiter, container);
        }

        if (pre) pre.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        if (codeEl) {
            codeEl.textContent = outputText;
            if (mode === 'csv2json') codeEl.className = 'language-json';
            if (window.hljs) window.hljs.highlightElement(codeEl);
        }
        if (statusEl) {
            statusEl.textContent = '✓ Converted';
            statusEl.style.color = 'var(--color-success-text)';
        }

        onResult({ text: outputText, ext });
    } catch (err) {
        if (pre) pre.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        if (placeholder) placeholder.innerHTML = `<div class="result-error" style="padding: var(--space-4);">${escapeHtml(err.message)}</div>`;
        if (statusEl) { statusEl.textContent = '✗ Error'; statusEl.style.color = 'var(--color-error-text)'; }
    }
}

// ─── CSV → JSON ──────────────────────────────────────────────────

function csvToJson(raw, delimiter = ',', hasHeader = true) {
    const rows = parseCSV(raw, delimiter);
    if (!rows.length) return [];

    if (!hasHeader) return rows;

    const headers = rows[0];
    return rows.slice(1).map(row =>
        Object.fromEntries(headers.map((h, i) => [h, coerce(row[i] ?? '')]))
    );
}

function parseCSV(raw, delimiter) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuote = false;

    for (let i = 0; i < raw.length; i++) {
        const c = raw[i];
        const next = raw[i + 1];

        if (c === '"' && inQuote && next === '"') { cell += '"'; i++; continue; }
        if (c === '"') { inQuote = !inQuote; continue; }
        if (!inQuote && c === delimiter) { row.push(cell); cell = ''; continue; }
        if (!inQuote && (c === '\n' || (c === '\r' && next === '\n'))) {
            if (c === '\r') i++;
            row.push(cell); rows.push(row); row = []; cell = '';
            continue;
        }
        cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c !== ''));
}

function coerce(val) {
    if (val === '') return '';
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === 'null') return null;
    const num = Number(val);
    if (!isNaN(num) && val.trim() !== '') return num;
    return val;
}

// ─── JSON → CSV ──────────────────────────────────────────────────

function jsonToCsv(data, delimiter = ',') {
    const arr = Array.isArray(data) ? data : [data];
    if (!arr.length) return '';

    const headers = [...new Set(arr.flatMap(obj => Object.keys(obj ?? {})))];

    const rows = arr.map(obj => headers.map(h => {
        const val = (obj ?? {})[h];
        const str = val === null || val === undefined ? '' : String(typeof val === 'object' ? JSON.stringify(val) : val);
        return str.includes(delimiter) || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(delimiter));

    return [headers.join(delimiter), ...rows].join('\n');
}

// ─── Table Renders ───────────────────────────────────────────────

function renderTableFromArray(data, container) {
    const body = container.querySelector('#csv-table-body');
    if (!body || !data.length) return;

    const headers = Object.keys(data[0]);
    body.innerHTML = `
    <table class="data-table" style="width:100%; font-size: var(--text-xs);">
      <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
      <tbody>
        ${data.slice(0, 100).map(row => `<tr>${headers.map(h => `<td>${escapeHtml(String(row[h] ?? ''))}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
    ${data.length > 100 ? `<div style="padding: var(--space-2) var(--space-4); font-size: var(--text-xs); color: var(--text-tertiary);">Showing first 100 of ${data.length} rows</div>` : ''}`;
}

function renderTableFromCsv(csv, delimiter, container) {
    const rows = parseCSV(csv, delimiter);
    if (!rows.length) return;
    const body = container.querySelector('#csv-table-body');
    if (!body) return;

    const headers = rows[0];
    body.innerHTML = `
    <table class="data-table" style="width:100%; font-size: var(--text-xs);">
      <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows.slice(1, 101).map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>`;
}

const SAMPLE_CSV = `id,name,email,role,active,score
1,Alice Johnson,alice@example.com,admin,true,9.5
2,Bob Smith,bob@example.com,user,true,7.2
3,Carol White,carol@example.com,user,false,8.1
4,Dave Brown,dave@example.com,editor,true,6.8
5,Eva Davis,eva@example.com,admin,true,9.9
`;
