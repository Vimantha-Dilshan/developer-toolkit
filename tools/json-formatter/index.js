/**
 * JSON Formatter Tool
 * ====================
 * Format, minify, validate, explore, and transform JSON.
 *
 * @module tools/json-formatter
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { downloadService } from '../../assets/js/services/download.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';
import { formatBytes, lineCount, charCount } from '../../assets/js/utils/format.utils.js';
import { escapeHtml, readFileAsText } from '../../assets/js/utils/dom.utils.js';

/** @type {AbortController|null} */
let _cleanup = null;

export function mount(container) {
    if (_cleanup) _cleanup.abort();
    _cleanup = new AbortController();
    const { signal } = _cleanup;

    container.innerHTML = buildUI();
    bindEvents(container, signal);
    loadSample(container);
}

export function unmount() {
    _cleanup?.abort();
}

// ─── UI Builder ────────────────────────────────────────────────

function buildUI() {
    return `
    <div class="tool-page" id="json-fmt-root">
      <!-- Header -->
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">JSON Formatter</h1>
            <p class="tool-description">Format, minify, validate and explore JSON with syntax highlighting, tree view, and search.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="jf-sample-btn" title="Load sample JSON">Sample</button>
          <button class="btn btn-ghost btn-sm" id="jf-clear-btn" title="Clear input">Clear</button>
          <label class="btn btn-secondary btn-sm" title="Upload JSON file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload
            <input type="file" id="jf-file-input" accept=".json,application/json" class="sr-only" aria-label="Upload JSON file" />
          </label>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="tool-options-bar">
        <div class="tool-options-group">
          <span class="tool-options-label">Action:</span>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm active" id="jf-btn-format">Format</button>
            <button class="btn btn-secondary btn-sm" id="jf-btn-minify">Minify</button>
            <button class="btn btn-secondary btn-sm" id="jf-btn-validate">Validate</button>
          </div>
        </div>
        <div class="tool-options-group">
          <span class="tool-options-label">Indent:</span>
          <select class="select select-sm" id="jf-indent" aria-label="Select indent size">
            <option value="2" selected>2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </div>
        <div class="tool-options-group">
          <label class="checkbox-item" title="Sort object keys alphabetically">
            <input type="checkbox" id="jf-sort-keys" />
            <span class="checkbox-label">Sort keys</span>
          </label>
        </div>
        <div class="tool-options-group" style="margin-left: auto;">
          <button class="btn btn-ghost btn-sm" id="jf-tree-toggle" aria-pressed="false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            Tree View
          </button>
        </div>
      </div>

      <!-- Split Layout -->
      <div class="tool-layout-split" style="min-height: 520px;">

        <!-- Input Panel -->
        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Input
            </div>
            <div class="tool-panel-actions">
              <div class="input-group" style="max-width: 200px;">
                <span class="input-group-prefix">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </span>
                <input type="text" id="jf-search" class="input input-sm input-mono" placeholder="Search JSON..." aria-label="Search in JSON" style="padding-left: 28px;" />
              </div>
            </div>
          </div>
          <div class="tool-panel-body" style="position: relative;">
            <textarea
              id="jf-input"
              class="code-textarea"
              placeholder='Paste your JSON here...\n\nExample:\n{\n  "name": "Orion",\n  "version": "1.0"\n}'
              spellcheck="false"
              autocomplete="off"
              aria-label="JSON input"
              style="min-height: 460px;"
            ></textarea>
          </div>
          <div class="editor-statusbar" id="jf-input-status">
            <span class="editor-statusbar-item">0 chars</span>
            <span class="editor-statusbar-item">0 lines</span>
          </div>
        </div>

        <!-- Output Panel -->
        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              Output
            </div>
            <div class="tool-panel-actions">
              <button class="copy-btn" id="jf-copy-btn" aria-label="Copy output">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
              <button class="copy-btn" id="jf-download-btn" aria-label="Download as JSON file">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            </div>
          </div>
          <div class="tool-panel-body" id="jf-output-wrapper" style="overflow: auto; min-height: 460px;">
            <!-- Output renders here -->
            <div id="jf-output-placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 400px; color: var(--text-tertiary); font-size: var(--text-sm);">
              Formatted output will appear here
            </div>
            <pre id="jf-output" style="display: none; margin: 0;"><code id="jf-output-code" class="language-json"></code></pre>
            <div id="jf-tree-view" style="display: none;" aria-label="JSON tree view"></div>
          </div>
          <div class="editor-statusbar" id="jf-output-status" aria-live="polite">
            <span class="editor-statusbar-item" id="jf-status-text">Ready</span>
          </div>
        </div>

      </div>

      <!-- Validation Result Banner -->
      <div id="jf-validation-result" style="display: none; margin-top: var(--space-3);"></div>
    </div>`;
}

// ─── Events ────────────────────────────────────────────────────

function bindEvents(container, signal) {
    const $ = id => container.querySelector(`#${id}`);

    const inputEl = $('jf-input');
    const outputEl = $('jf-output');
    const codeEl = $('jf-output-code');
    const treeEl = $('jf-tree-view');
    const placeholder = $('jf-output-placeholder');
    const statusText = $('jf-status-text');
    const inputStatus = $('jf-input-status');

    let currentOutput = '';
    let treeMode = false;

    // Process on input (debounced)
    const process = debounce(() => {
        const value = inputEl?.value?.trim();
        if (!value) {
            showPlaceholder();
            updateInputStatus('');
            return;
        }
        updateInputStatus(value);
        processJSON(value);
    }, 300);

    inputEl?.addEventListener('input', process);

    // Format button
    $('jf-btn-format')?.addEventListener('click', () => {
        setActiveBtn('jf-btn-format', container);
        processJSON(inputEl?.value?.trim(), 'format');
    });

    // Minify button
    $('jf-btn-minify')?.addEventListener('click', () => {
        setActiveBtn('jf-btn-minify', container);
        processJSON(inputEl?.value?.trim(), 'minify');
    });

    // Validate button
    $('jf-btn-validate')?.addEventListener('click', () => {
        setActiveBtn('jf-btn-validate', container);
        validateJSON(inputEl?.value?.trim(), container);
    });

    // Sort keys
    $('jf-sort-keys')?.addEventListener('change', () => {
        if (inputEl?.value?.trim()) process();
    });

    // Indent change
    $('jf-indent')?.addEventListener('change', () => {
        if (inputEl?.value?.trim()) process();
    });

    // Tree view toggle
    $('jf-tree-toggle')?.addEventListener('click', () => {
        treeMode = !treeMode;
        const btn = $('jf-tree-toggle');
        btn?.setAttribute('aria-pressed', String(treeMode));
        btn?.classList.toggle('active', treeMode);
        if (currentOutput) {
            if (treeMode) renderTree(currentOutput, treeEl, outputEl, placeholder);
            else showCode(currentOutput, codeEl, outputEl, treeEl, placeholder);
        }
    });

    // Copy
    $('jf-copy-btn')?.addEventListener('click', () => {
        if (currentOutput) {
            clipboardService.copyWithFeedback(currentOutput, $('jf-copy-btn'), 'Copied!');
        }
    });

    // Download
    $('jf-download-btn')?.addEventListener('click', () => {
        if (currentOutput) {
            downloadService.json(currentOutput, 'formatted.json');
        }
    });

    // File upload
    $('jf-file-input')?.addEventListener('change', async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await readFileAsText(file);
            if (inputEl) inputEl.value = text;
            process();
            toastService.success('File loaded', file.name);
        } catch {
            toastService.error('Failed to read file');
        }
    });

    // Clear
    $('jf-clear-btn')?.addEventListener('click', () => {
        if (inputEl) inputEl.value = '';
        showPlaceholder();
        updateInputStatus('');
        currentOutput = '';
    });

    // Search
    const searchEl = $('jf-search');
    searchEl?.addEventListener('input', debounce(e => {
        if (currentOutput && !treeMode) {
            highlightSearch(e.target.value, codeEl);
        }
    }, 200));

    // Sample button
    $('jf-sample-btn')?.addEventListener('click', () => loadSample(container));

    // ── Internal helpers ──

    function processJSON(raw, mode = 'format') {
        if (!raw) { showPlaceholder(); return; }

        try {
            let parsed = JSON.parse(raw);

            if ($('jf-sort-keys')?.checked) {
                parsed = sortObjectKeys(parsed);
            }

            const indent = getIndent(container);

            if (mode === 'minify') {
                currentOutput = JSON.stringify(parsed);
            } else {
                currentOutput = JSON.stringify(parsed, null, indent);
            }

            if (treeMode) {
                renderTree(parsed, treeEl, outputEl, placeholder);
            } else {
                showCode(currentOutput, codeEl, outputEl, treeEl, placeholder);
            }

            const bytes = new Blob([currentOutput]).size;
            if (statusText) {
                statusText.textContent = `✓ Valid JSON · ${currentOutput.split('\n').length} lines · ${formatBytes(bytes)}`;
                statusText.style.color = 'var(--color-success-text)';
            }

            // Hide validation banner
            const banner = container.querySelector('#jf-validation-result');
            if (banner) banner.style.display = 'none';

        } catch (err) {
            showError(err.message, codeEl, outputEl, treeEl, placeholder);
            currentOutput = '';
            if (statusText) {
                statusText.textContent = `✗ Invalid JSON`;
                statusText.style.color = 'var(--color-error-text)';
            }
        }
    }

    function updateInputStatus(value) {
        if (!inputStatus) return;
        const spans = inputStatus.querySelectorAll('.editor-statusbar-item');
        if (spans[0]) spans[0].textContent = `${(value || '').length.toLocaleString()} chars`;
        if (spans[1]) spans[1].textContent = `${lineCount(value || '')} lines`;
    }
}

// ─── Pure Helpers ───────────────────────────────────────────────

function showPlaceholder() {
    const p = document.getElementById('jf-output-placeholder');
    const c = document.getElementById('jf-output');
    const t = document.getElementById('jf-tree-view');
    if (p) p.style.display = 'flex';
    if (c) c.style.display = 'none';
    if (t) t.style.display = 'none';
}

function showCode(code, codeEl, outputEl, treeEl, placeholder) {
    if (placeholder) placeholder.style.display = 'none';
    if (treeEl) treeEl.style.display = 'none';
    if (outputEl) outputEl.style.display = 'block';
    if (codeEl) {
        codeEl.textContent = code;
        if (window.hljs) window.hljs.highlightElement(codeEl);
    }
}

function showError(message, codeEl, outputEl, treeEl, placeholder) {
    if (placeholder) placeholder.style.display = 'none';
    if (treeEl) treeEl.style.display = 'none';
    if (outputEl) outputEl.style.display = 'block';
    if (codeEl) {
        codeEl.className = '';
        codeEl.innerHTML = `<span style="color: var(--color-error-text);">✗ JSON Parse Error\n\n${escapeHtml(message)}</span>`;
    }
}

function renderTree(data, treeEl, outputEl, placeholder) {
    if (placeholder) placeholder.style.display = 'none';
    if (outputEl) outputEl.style.display = 'none';
    if (treeEl) {
        treeEl.style.display = 'block';
        treeEl.innerHTML = `<div class="json-tree">${buildTreeNode(data)}</div>`;
        // Add collapse/expand behavior
        treeEl.querySelectorAll('.json-tree-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const content = toggle.nextElementSibling;
                if (content) {
                    const hidden = content.style.display === 'none';
                    content.style.display = hidden ? '' : 'none';
                    toggle.textContent = hidden ? '▾' : '▸';
                }
            });
        });
    }
}

function buildTreeNode(value, depth = 0) {
    if (value === null) return `<span class="json-null">null</span>`;
    if (typeof value === 'boolean') return `<span class="json-bool">${value}</span>`;
    if (typeof value === 'number') return `<span class="json-number">${value}</span>`;
    if (typeof value === 'string') return `<span class="json-string">"${escapeHtml(value)}"</span>`;

    if (Array.isArray(value)) {
        if (value.length === 0) return `<span style="color:var(--text-tertiary)">[]</span>`;
        return `<span class="json-tree-toggle" style="cursor:pointer; user-select:none;">▾</span><span class="json-string">[${value.length}]</span><div style="padding-left: 16px;">
      ${value.map((v, i) => `<div class="json-tree-item"><span class="json-number">${i}</span>: ${buildTreeNode(v, depth + 1)}</div>`).join('')}
    </div>`;
    }

    if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) return `<span style="color:var(--text-tertiary)">{}</span>`;
        return `<span class="json-tree-toggle" style="cursor:pointer; user-select:none;">▾</span><span class="json-string">{${keys.length}}</span><div style="padding-left: 16px;">
      ${keys.map(k => `<div class="json-tree-item"><span class="json-key">"${escapeHtml(k)}"</span>: ${buildTreeNode(value[k], depth + 1)}</div>`).join('')}
    </div>`;
    }

    return escapeHtml(String(value));
}

function validateJSON(raw, container) {
    const banner = container.querySelector('#jf-validation-result');
    if (!banner) return;

    if (!raw) {
        banner.style.display = 'none';
        return;
    }

    try {
        JSON.parse(raw);
        banner.style.display = 'block';
        banner.innerHTML = `<div class="result-success">✓ Valid JSON — The input is valid JSON.</div>`;
    } catch (err) {
        banner.style.display = 'block';
        banner.innerHTML = `<div class="result-error">✗ Invalid JSON\n\n${escapeHtml(err.message)}</div>`;
    }
}

function highlightSearch(query, codeEl) {
    if (!codeEl) return;
    if (!query) {
        // Re-run hljs
        if (window.hljs) window.hljs.highlightElement(codeEl);
        return;
    }
    // Simple text highlight — escape regex special chars
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    codeEl.innerHTML = escapeHtml(codeEl.textContent ?? '').replace(re, '<mark>$1</mark>');
}

function sortObjectKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(sortObjectKeys);
    return Object.fromEntries(
        Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, sortObjectKeys(v)])
    );
}

function getIndent(container) {
    const val = container.querySelector('#jf-indent')?.value;
    if (val === 'tab') return '\t';
    return parseInt(val ?? '2', 10);
}

function setActiveBtn(activeId, container) {
    ['jf-btn-format', 'jf-btn-minify', 'jf-btn-validate'].forEach(id => {
        container.querySelector(`#${id}`)?.classList.toggle('active', id === activeId);
    });
}

function loadSample(container) {
    const sample = {
        id: 1,
        name: 'Orion',
        version: '1.0.0',
        features: ['JSON Formatter', 'JWT Decoder', 'UUID Generator', 'SQL Formatter', 'API Tester'],
        config: {
            theme: 'dark',
            language: 'en',
            analytics: false,
        },
        repository: {
            type: 'git',
            url: 'https://github.com/Vimantha-Dilshan/developer-toolkit',
        },
        license: 'MIT',
        active: true,
        score: 9.8,
        tags: ['developer', 'tools', 'browser', 'free', 'open-source'],
    };

    const inputEl = container.querySelector('#jf-input');
    if (inputEl) {
        inputEl.value = JSON.stringify(sample, null, 2);
        inputEl.dispatchEvent(new Event('input'));
    }
}
