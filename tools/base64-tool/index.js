/**
 * Base64 Tool
 * ===========
 * Encode and decode Base64 for text, files, and images.
 *
 * @module tools/base64-tool
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { downloadService } from '../../assets/js/services/download.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { escapeHtml, readFileAsDataURL } from '../../assets/js/utils/dom.utils.js';
import { formatBytes } from '../../assets/js/utils/format.utils.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
}

// ─── UI ─────────────────────────────────────────────────────────

function buildUI() {
    return `
    <div class="tool-page" id="b64-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 8h3m0 0v8m0-8V8m7 0h-3m0 0v8m0-8V8"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">Base64 Encoder / Decoder</h1>
            <p class="tool-description">Encode and decode Base64 for text, files, and images with live preview.</p>
          </div>
        </div>
      </div>

      <!-- Mode Tabs -->
      <div class="tool-tabs" style="margin-bottom: var(--space-4);">
        <button class="tool-tab active" data-b64tab="text">Text</button>
        <button class="tool-tab" data-b64tab="file">File / Image</button>
        <button class="tool-tab" data-b64tab="image-preview">Image Preview</button>
      </div>

      <!-- ── Text Tab ────────────────────────────────────── -->
      <div id="b64-text-tab">
        <div class="tool-options-bar" style="margin-bottom: var(--space-3);">
          <div class="tool-options-group">
            <span class="tool-options-label">Mode:</span>
            <div class="btn-group">
              <button class="btn btn-secondary btn-sm active" id="b64-mode-encode" aria-pressed="true">Encode</button>
              <button class="btn btn-secondary btn-sm" id="b64-mode-decode" aria-pressed="false">Decode</button>
            </div>
          </div>
          <div class="tool-options-group">
            <span class="tool-options-label">Encoding:</span>
            <select class="select" id="b64-encoding" aria-label="Text encoding">
              <option value="utf8" selected>UTF-8</option>
              <option value="latin1">Latin-1</option>
            </select>
          </div>
          <div class="tool-options-group">
            <label class="checkbox-item">
              <input type="checkbox" id="b64-url-safe" />
              <span class="checkbox-label">URL-safe</span>
            </label>
          </div>
          <div class="tool-options-group">
            <label class="checkbox-item">
              <input type="checkbox" id="b64-no-padding" />
              <span class="checkbox-label">No padding</span>
            </label>
          </div>
        </div>

        <div class="tool-layout-split" style="min-height: 360px;">
          <div class="tool-panel">
            <div class="tool-panel-header">
              <div class="tool-panel-title" id="b64-input-label">Plain Text (Input)</div>
            </div>
            <div class="tool-panel-body">
              <textarea id="b64-text-input" class="code-textarea" placeholder="Enter text to encode..." spellcheck="false" style="min-height: 300px;" aria-label="Text input"></textarea>
            </div>
            <div class="editor-statusbar" id="b64-input-status">
              <span class="editor-statusbar-item">0 chars</span>
              <span class="editor-statusbar-item">0 bytes</span>
            </div>
          </div>

          <div class="tool-panel">
            <div class="tool-panel-header">
              <div class="tool-panel-title" id="b64-output-label">Base64 (Output)</div>
              <div class="tool-panel-actions">
                <button class="copy-btn" id="b64-copy-btn" aria-label="Copy output">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
                <button class="copy-btn" id="b64-download-btn" aria-label="Download output">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </button>
              </div>
            </div>
            <div class="tool-panel-body">
              <textarea id="b64-text-output" class="code-textarea" placeholder="Output will appear here..." spellcheck="false" style="min-height: 300px;" readonly aria-label="Output" aria-live="polite"></textarea>
            </div>
            <div class="editor-statusbar" id="b64-output-status">
              <span class="editor-statusbar-item" id="b64-output-size">0 chars</span>
              <span class="editor-statusbar-item" id="b64-ratio">Ratio: —</span>
              <span class="editor-statusbar-item" id="b64-valid-indicator"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── File Tab ────────────────────────────────────── -->
      <div id="b64-file-tab" style="display:none;">
        <div class="tool-panel" style="margin-bottom: var(--space-4);">
          <div class="tool-panel-header"><div class="tool-panel-title">Upload File</div></div>
          <div class="tool-panel-body" style="padding: var(--space-6);">
            <div id="b64-drop-zone" style="border: 2px dashed var(--border-primary); border-radius: var(--radius-lg); padding: var(--space-10); text-align: center; cursor: pointer; transition: border-color 0.2s;" role="button" tabindex="0" aria-label="Drop zone for files">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto var(--space-3); opacity: 0.4;" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div style="font-size: var(--text-sm); color: var(--text-secondary);">Drag & drop a file here, or</div>
              <label class="btn btn-secondary btn-sm" style="margin-top: var(--space-3); cursor: pointer;">
                Browse File
                <input type="file" id="b64-file-input" class="sr-only" aria-label="Browse file" />
              </label>
            </div>
          </div>
        </div>

        <div class="tool-panel" id="b64-file-output" style="display:none;">
          <div class="tool-panel-header">
            <div class="tool-panel-title" id="b64-file-name">File Base64</div>
            <div class="tool-panel-actions">
              <button class="copy-btn" id="b64-file-copy" aria-label="Copy Base64">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
              <button class="copy-btn" id="b64-file-copy-dataurl" aria-label="Copy data URL">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Data URL
              </button>
            </div>
          </div>
          <div class="tool-panel-body" style="padding: var(--space-4);">
            <div id="b64-file-meta" style="font-size: var(--text-xs); color: var(--text-tertiary); margin-bottom: var(--space-3);"></div>
            <textarea id="b64-file-b64" class="code-textarea" rows="8" readonly style="word-break: break-all;" aria-label="File Base64 output" aria-live="polite"></textarea>
          </div>
        </div>
      </div>

      <!-- ── Image Preview Tab ──────────────────────────── -->
      <div id="b64-image-tab" style="display:none;">
        <div class="tool-panel" style="margin-bottom: var(--space-4);">
          <div class="tool-panel-header"><div class="tool-panel-title">Base64 Image Data</div></div>
          <div class="tool-panel-body" style="padding: var(--space-4);">
            <textarea id="b64-img-input" class="code-textarea" rows="6" placeholder="Paste Base64 image data or data URL here..." spellcheck="false" aria-label="Base64 image input"></textarea>
            <button class="btn btn-primary btn-sm" id="b64-img-preview-btn" style="margin-top: var(--space-2);">Preview Image</button>
          </div>
        </div>
        <div id="b64-img-preview-card" class="tool-panel" style="display:none;">
          <div class="tool-panel-header"><div class="tool-panel-title">Image Preview</div></div>
          <div class="tool-panel-body" style="padding: var(--space-4); text-align: center;">
            <img id="b64-img-el" src="" alt="Decoded image preview" style="max-width: 100%; max-height: 480px; border-radius: var(--radius-md); border: 1px solid var(--border-primary);" />
            <div id="b64-img-dims" style="margin-top: var(--space-2); font-size: var(--text-xs); color: var(--text-tertiary);"></div>
          </div>
        </div>
      </div>
    </div>`;
}

// ─── Events ─────────────────────────────────────────────────────

function bindEvents(container) {
    let mode = 'encode';
    let currentOutput = '';

    // Tab switching
    container.querySelectorAll('[data-b64tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('[data-b64tab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            container.querySelector('#b64-text-tab').style.display = tab.dataset.b64tab === 'text' ? '' : 'none';
            container.querySelector('#b64-file-tab').style.display = tab.dataset.b64tab === 'file' ? '' : 'none';
            container.querySelector('#b64-image-tab').style.display = tab.dataset.b64tab === 'image-preview' ? '' : 'none';
        });
    });

    // Encode / Decode toggle
    container.querySelector('#b64-mode-encode')?.addEventListener('click', () => {
        mode = 'encode';
        setMode(container, 'encode');
        processText(container, mode);
    });
    container.querySelector('#b64-mode-decode')?.addEventListener('click', () => {
        mode = 'decode';
        setMode(container, 'decode');
        processText(container, mode);
    });

    // Live processing
    const process = debounce(() => processText(container, mode), 150);
    container.querySelector('#b64-text-input')?.addEventListener('input', process);
    container.querySelector('#b64-url-safe')?.addEventListener('change', process);
    container.querySelector('#b64-no-padding')?.addEventListener('change', process);

    // Copy / Download
    container.querySelector('#b64-copy-btn')?.addEventListener('click', () => {
        const out = container.querySelector('#b64-text-output')?.value;
        if (out) clipboardService.copyWithFeedback(out, container.querySelector('#b64-copy-btn'));
    });
    container.querySelector('#b64-download-btn')?.addEventListener('click', () => {
        const out = container.querySelector('#b64-text-output')?.value;
        const name = mode === 'encode' ? 'encoded.b64' : 'decoded.txt';
        if (out) downloadService.text(out, name);
    });

    // File upload
    container.querySelector('#b64-file-input')?.addEventListener('change', async e => {
        await handleFileUpload(e.target.files?.[0], container);
    });

    // Drag & drop
    const dropZone = container.querySelector('#b64-drop-zone');
    dropZone?.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent-500)'; });
    dropZone?.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; });
    dropZone?.addEventListener('drop', async e => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        await handleFileUpload(e.dataTransfer.files?.[0], container);
    });

    // File copy buttons
    container.querySelector('#b64-file-copy')?.addEventListener('click', () => {
        const b64 = container.querySelector('#b64-file-b64')?.value;
        if (b64) clipboardService.copyWithFeedback(b64.split(',').pop() ?? b64, container.querySelector('#b64-file-copy'));
    });
    container.querySelector('#b64-file-copy-dataurl')?.addEventListener('click', () => {
        const b64 = container.querySelector('#b64-file-b64')?.value;
        if (b64) clipboardService.copyWithFeedback(b64, container.querySelector('#b64-file-copy-dataurl'));
    });

    // Image preview
    container.querySelector('#b64-img-preview-btn')?.addEventListener('click', () => {
        const raw = container.querySelector('#b64-img-input')?.value?.trim() ?? '';
        if (!raw) return;
        let src = raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
        const imgEl = container.querySelector('#b64-img-el');
        const card = container.querySelector('#b64-img-preview-card');
        if (imgEl) {
            imgEl.src = src;
            imgEl.onload = () => {
                const dims = container.querySelector('#b64-img-dims');
                if (dims) dims.textContent = `${imgEl.naturalWidth}×${imgEl.naturalHeight}px · ${formatBytes(new Blob([src]).size)}`;
                if (card) card.style.display = '';
            };
            imgEl.onerror = () => {
                toastService.error('Failed to render image — check the Base64 data');
                if (card) card.style.display = 'none';
            };
        }
    });
}

// ─── Core Processing ────────────────────────────────────────────

function processText(container, mode) {
    const input = container.querySelector('#b64-text-input')?.value ?? '';
    const urlSafe = container.querySelector('#b64-url-safe')?.checked ?? false;
    const noPad = container.querySelector('#b64-no-padding')?.checked ?? false;
    const outputEl = container.querySelector('#b64-text-output');
    const validEl = container.querySelector('#b64-valid-indicator');
    const sizeEl = container.querySelector('#b64-output-size');
    const ratioEl = container.querySelector('#b64-ratio');

    if (!input.trim()) {
        if (outputEl) outputEl.value = '';
        if (sizeEl) sizeEl.textContent = '0 chars';
        if (ratioEl) ratioEl.textContent = 'Ratio: —';
        if (validEl) validEl.textContent = '';
        return;
    }

    try {
        let result = '';

        if (mode === 'encode') {
            let b64 = btoa(unescape(encodeURIComponent(input)));
            if (urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_');
            if (noPad) b64 = b64.replace(/=+$/, '');
            result = b64;
            if (validEl) { validEl.textContent = '✓ Encoded'; validEl.style.color = 'var(--color-success-text)'; }
        } else {
            let b64 = input.trim();
            // Reverse URL-safe
            b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
            // Re-add padding
            b64 = b64.padEnd(b64.length + (4 - b64.length % 4) % 4, '=');
            result = decodeURIComponent(escape(atob(b64)));
            if (validEl) { validEl.textContent = '✓ Valid Base64'; validEl.style.color = 'var(--color-success-text)'; }
        }

        if (outputEl) outputEl.value = result;
        if (sizeEl) sizeEl.textContent = `${result.length.toLocaleString()} chars`;
        if (ratioEl) ratioEl.textContent = `Ratio: ${((result.length / (input.length || 1)) * 100).toFixed(0)}%`;

        // Input status
        updateInputStatus(container, input);

    } catch (err) {
        if (outputEl) outputEl.value = '';
        if (validEl) { validEl.textContent = `✗ ${err.message}`; validEl.style.color = 'var(--color-error-text)'; }
        if (ratioEl) ratioEl.textContent = 'Ratio: —';
    }
}

function updateInputStatus(container, input) {
    const el = container.querySelector('#b64-input-status');
    if (!el) return;
    const spans = el.querySelectorAll('.editor-statusbar-item');
    if (spans[0]) spans[0].textContent = `${input.length.toLocaleString()} chars`;
    if (spans[1]) spans[1].textContent = `${formatBytes(new Blob([input]).size)}`;
}

function setMode(container, mode) {
    container.querySelector('#b64-mode-encode')?.setAttribute('aria-pressed', String(mode === 'encode'));
    container.querySelector('#b64-mode-decode')?.setAttribute('aria-pressed', String(mode === 'decode'));
    container.querySelector('#b64-mode-encode')?.classList.toggle('active', mode === 'encode');
    container.querySelector('#b64-mode-decode')?.classList.toggle('active', mode === 'decode');

    const inputLabel = container.querySelector('#b64-input-label');
    const outputLabel = container.querySelector('#b64-output-label');

    if (mode === 'encode') {
        if (inputLabel) inputLabel.textContent = 'Plain Text (Input)';
        if (outputLabel) outputLabel.textContent = 'Base64 (Output)';
        const textInput = container.querySelector('#b64-text-input');
        if (textInput) textInput.placeholder = 'Enter text to encode...';
    } else {
        if (inputLabel) inputLabel.textContent = 'Base64 (Input)';
        if (outputLabel) outputLabel.textContent = 'Decoded Text (Output)';
        const textInput = container.querySelector('#b64-text-input');
        if (textInput) textInput.placeholder = 'Enter Base64 string to decode...';
    }
}

async function handleFileUpload(file, container) {
    if (!file) return;

    try {
        const dataUrl = await readFileAsDataURL(file);
        const b64 = dataUrl; // full data URL

        container.querySelector('#b64-file-output').style.display = '';
        container.querySelector('#b64-file-name').textContent = file.name;
        container.querySelector('#b64-file-meta').textContent = `${file.name} · ${file.type || 'unknown'} · ${formatBytes(file.size)}`;
        container.querySelector('#b64-file-b64').value = b64;

        toastService.success('File encoded', `${formatBytes(file.size)}`);
    } catch (err) {
        toastService.error('Failed to read file', err.message);
    }
}
