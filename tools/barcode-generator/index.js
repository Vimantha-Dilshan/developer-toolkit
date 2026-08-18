/**
 * Barcode Generator Tool
 * ======================
 * Generate barcodes using JsBarcode via CDN.
 * Supports Code128, EAN-13, EAN-8, UPC-A, Code39, ITF-14, MSI, pharmacode.
 *
 * @module tools/barcode-generator
 */

import { downloadService } from '../../assets/js/services/download.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';

export function mount(container) {
    loadJsBarcode(() => {
        container.innerHTML = buildUI();
        bindEvents(container);
        generate(container);
    });
}

function loadJsBarcode(cb) {
    if (window.JsBarcode) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
    s.onload = cb;
    s.onerror = () => toastService.error('Failed to load JsBarcode library');
    document.head.appendChild(s);
}

const FORMATS = [
    { value: 'CODE128', label: 'Code 128 (auto)', sample: 'Hello-World-123' },
    { value: 'CODE39', label: 'Code 39', sample: 'CODE39' },
    { value: 'EAN13', label: 'EAN-13', sample: '5901234123457' },
    { value: 'EAN8', label: 'EAN-8', sample: '96385074' },
    { value: 'UPCA', label: 'UPC-A', sample: '012345678905' },
    { value: 'ITF14', label: 'ITF-14', sample: '12345678901231' },
    { value: 'MSI', label: 'MSI', sample: '12345678' },
    { value: 'pharmacode', label: 'Pharmacode', sample: '1234' },
];

function buildUI() {
    return `
    <div class="tool-page" id="bc-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">Barcode Generator</h1>
            <p class="tool-description">Generate barcodes in Code128, EAN-13, UPC-A, Code39 and more formats. Download as PNG or SVG.</p>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 340px 1fr; gap: var(--space-6); align-items: start;">

        <!-- Left: Controls -->
        <div>
          <div class="tool-panel">
            <div class="tool-panel-header"><div class="tool-panel-title">Configuration</div></div>
            <div class="tool-panel-body" style="padding: var(--space-4);">

              <div class="form-group">
                <label class="form-label" for="bc-format">Format</label>
                <select class="select" id="bc-format">
                  ${FORMATS.map(f => `<option value="${f.value}">${f.label}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="bc-value">Value</label>
                <input type="text" id="bc-value" class="input input-mono" placeholder="Hello-World-123" autocomplete="off" aria-label="Barcode value" />
              </div>

              <div class="form-group">
                <label class="form-label" for="bc-width">Bar width: <span id="bc-width-label">2</span>px</label>
                <input type="range" id="bc-width" min="1" max="5" step="0.5" value="2" class="range-input" />
              </div>

              <div class="form-group">
                <label class="form-label" for="bc-height">Height: <span id="bc-height-label">80</span>px</label>
                <input type="range" id="bc-height" min="30" max="200" step="5" value="80" class="range-input" />
              </div>

              <div class="form-group">
                <label class="form-label" for="bc-margin">Margin: <span id="bc-margin-label">10</span>px</label>
                <input type="range" id="bc-margin" min="0" max="40" step="2" value="10" class="range-input" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
                <div class="form-group">
                  <label class="form-label" for="bc-fg">Bar color</label>
                  <input type="color" id="bc-fg" value="#000000" style="width:100%; height:36px; cursor:pointer; border: 1px solid var(--border-primary); border-radius: var(--radius-sm);" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="bc-bg">Background</label>
                  <input type="color" id="bc-bg" value="#ffffff" style="width:100%; height:36px; cursor:pointer; border: 1px solid var(--border-primary); border-radius: var(--radius-sm);" />
                </div>
              </div>

              <div class="form-group">
                <label class="checkbox-item">
                  <input type="checkbox" id="bc-display-value" checked />
                  <span class="checkbox-label">Display value below barcode</span>
                </label>
              </div>

              <div class="form-group">
                <label class="form-label" for="bc-font-size">Font size: <span id="bc-font-size-label">16</span>px</label>
                <input type="range" id="bc-font-size" min="8" max="32" value="16" class="range-input" />
              </div>

              <button class="btn btn-primary" id="bc-generate-btn" style="width:100%; margin-top: var(--space-2);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Generate Barcode
              </button>
            </div>
          </div>

          <!-- Templates -->
          <div class="tool-panel" style="margin-top: var(--space-4);">
            <div class="tool-panel-header"><div class="tool-panel-title">Sample Values</div></div>
            <div class="tool-panel-body" style="padding: var(--space-3);">
              <div id="bc-samples" style="display: flex; flex-direction: column; gap: var(--space-1);">
                ${FORMATS.map(f => `
                  <button class="btn btn-ghost btn-xs" data-bc-sample="${f.value}" style="justify-content: flex-start; font-family: var(--font-mono);"
                    title="Use sample for ${f.label}">
                    <span style="color: var(--text-tertiary); min-width: 80px;">${f.label}</span>
                    <span>${f.sample}</span>
                  </button>`).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Preview -->
        <div>
          <div class="tool-panel">
            <div class="tool-panel-header">
              <div class="tool-panel-title">Preview</div>
              <div class="tool-panel-actions">
                <button class="btn btn-primary btn-sm" id="bc-download-png">Download PNG</button>
                <button class="btn btn-secondary btn-sm" id="bc-download-svg">Download SVG</button>
              </div>
            </div>
            <div class="tool-panel-body" style="padding: var(--space-6); display: flex; flex-direction: column; align-items: center; min-height: 240px; justify-content: center;">
              <div id="bc-preview-wrap" style="background: #fff; padding: 16px; border-radius: var(--radius-md); display:inline-block;">
                <svg id="bc-svg" style="display:block;"></svg>
              </div>
              <div id="bc-error" style="display:none; margin-top: var(--space-3);"></div>
              <div id="bc-info" style="margin-top: var(--space-3); font-size: var(--text-xs); color: var(--text-tertiary);"></div>
            </div>
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
    const auto = debounce(() => generate(container), 400);

    container.querySelector('#bc-generate-btn')?.addEventListener('click', () => generate(container));

    ['#bc-format', '#bc-value', '#bc-fg', '#bc-bg', '#bc-display-value'].forEach(sel => {
        container.querySelector(sel)?.addEventListener('change', auto);
        container.querySelector(sel)?.addEventListener('input', auto);
    });

    // Range sliders with labels
    [
        ['#bc-width', '#bc-width-label'],
        ['#bc-height', '#bc-height-label'],
        ['#bc-margin', '#bc-margin-label'],
        ['#bc-font-size', '#bc-font-size-label'],
    ].forEach(([sel, labelSel]) => {
        const input = container.querySelector(sel);
        const label = container.querySelector(labelSel);
        input?.addEventListener('input', () => { if (label) label.textContent = input.value; auto(); });
    });

    // Sample buttons
    container.querySelector('#bc-samples')?.addEventListener('click', e => {
        const btn = e.target.closest('[data-bc-sample]');
        if (!btn) return;
        const fmt = btn.dataset.bcSample;
        const info = FORMATS.find(f => f.value === fmt);
        if (info) {
            const formatEl = container.querySelector('#bc-format');
            const valueEl = container.querySelector('#bc-value');
            if (formatEl) formatEl.value = fmt;
            if (valueEl) valueEl.value = info.sample;
            generate(container);
        }
    });

    // Downloads
    container.querySelector('#bc-download-png')?.addEventListener('click', () => {
        const svg = container.querySelector('#bc-svg');
        if (!svg || !svg.childNodes.length) return;
        svgToPng(svg, png => {
            const a = document.createElement('a');
            a.download = 'barcode.png';
            a.href = png;
            a.click();
        });
    });

    container.querySelector('#bc-download-svg')?.addEventListener('click', () => {
        const svg = container.querySelector('#bc-svg');
        if (!svg || !svg.childNodes.length) return;
        const data = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = 'barcode.svg'; a.href = url; a.click();
        URL.revokeObjectURL(url);
    });
}

function generate(container) {
    const format = container.querySelector('#bc-format')?.value ?? 'CODE128';
    const value = container.querySelector('#bc-value')?.value?.trim() ?? '';
    const lineWidth = parseFloat(container.querySelector('#bc-width')?.value ?? '2');
    const height = parseInt(container.querySelector('#bc-height')?.value ?? '80', 10);
    const margin = parseInt(container.querySelector('#bc-margin')?.value ?? '10', 10);
    const fg = container.querySelector('#bc-fg')?.value ?? '#000000';
    const bg = container.querySelector('#bc-bg')?.value ?? '#ffffff';
    const displayValue = container.querySelector('#bc-display-value')?.checked ?? true;
    const fontSize = parseInt(container.querySelector('#bc-font-size')?.value ?? '16', 10);
    const errorEl = container.querySelector('#bc-error');
    const infoEl = container.querySelector('#bc-info');
    const svgEl = container.querySelector('#bc-svg');

    // Auto-set value if empty
    const actualValue = value || (FORMATS.find(f => f.value === format)?.sample ?? '123456');
    if (!value) {
        const inp = container.querySelector('#bc-value');
        if (inp) inp.value = actualValue;
    }

    if (!window.JsBarcode) { if (errorEl) { errorEl.innerHTML = '<div class="result-error">Library not loaded</div>'; errorEl.style.display = ''; } return; }

    try {
        window.JsBarcode(svgEl, actualValue, {
            format,
            lineColor: fg,
            background: bg,
            width: lineWidth,
            height,
            margin,
            displayValue,
            fontSize,
            valid: () => { },
        });

        if (errorEl) errorEl.style.display = 'none';
        if (infoEl) infoEl.textContent = `Format: ${format} · Value length: ${actualValue.length} chars`;

        // Update preview wrap background to match
        const wrap = container.querySelector('#bc-preview-wrap');
        if (wrap) wrap.style.background = bg;

    } catch (err) {
        if (svgEl) svgEl.innerHTML = '';
        if (errorEl) { errorEl.innerHTML = `<div class="result-error">${escapeHtml(err.message)}</div>`; errorEl.style.display = ''; }
    }
}

function svgToPng(svgEl, cb) {
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const w = svgEl.width?.baseVal?.value || 300;
    const h = svgEl.height?.baseVal?.value || 120;
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        cb(canvas.toDataURL('image/png'));
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}
