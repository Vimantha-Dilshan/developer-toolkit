/**
 * Markdown Preview Tool
 * =====================
 * Live split-pane Markdown editor with GitHub-style rendering,
 * syntax highlighting, table of contents, and HTML export.
 *
 * @module tools/markdown-preview
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { downloadService } from '../../assets/js/services/download.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';
import { readFileAsText } from '../../assets/js/utils/dom.utils.js';
import { lineCount, wordCount, charCount } from '../../assets/js/utils/format.utils.js';

export function mount(container) {
    // Load marked from CDN if not already present
    if (!window.marked) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        script.onload = () => { container.innerHTML = buildUI(); bindEvents(container); loadSample(container); };
        script.onerror = () => toastService.error('Failed to load Marked.js');
        document.head.appendChild(script);
    } else {
        container.innerHTML = buildUI();
        bindEvents(container);
        loadSample(container);
    }
}

// ─── UI ─────────────────────────────────────────────────────────

function buildUI() {
    return `
    <div class="tool-page" id="md-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">Markdown Preview</h1>
            <p class="tool-description">Live Markdown editor with GitHub-style preview, syntax highlighting, and HTML export.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="md-sample-btn">Sample</button>
          <button class="btn btn-ghost btn-sm" id="md-clear-btn">Clear</button>
          <label class="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload
            <input type="file" id="md-file-input" accept=".md,.markdown,.txt" class="sr-only" aria-label="Upload Markdown file" />
          </label>
        </div>
      </div>

      <div class="tool-options-bar">
        <div class="tool-options-group">
          <span class="tool-options-label">View:</span>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm active" id="md-view-split" aria-pressed="true">Split</button>
            <button class="btn btn-secondary btn-sm" id="md-view-edit" aria-pressed="false">Editor</button>
            <button class="btn btn-secondary btn-sm" id="md-view-preview" aria-pressed="false">Preview</button>
          </div>
        </div>
        <div class="tool-options-group">
          <label class="checkbox-item">
            <input type="checkbox" id="md-sync-scroll" checked />
            <span class="checkbox-label">Sync scroll</span>
          </label>
        </div>
        <div class="tool-options-group" style="margin-left:auto; gap: var(--space-2);">
          <button class="copy-btn" id="md-copy-html">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy HTML
          </button>
          <button class="copy-btn" id="md-download-md">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            .md
          </button>
          <button class="copy-btn" id="md-download-html">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            .html
          </button>
        </div>
      </div>

      <div id="md-layout" class="tool-layout-split" style="min-height: 540px;">

        <!-- Editor pane -->
        <div class="tool-panel" id="md-editor-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">Markdown</div>
          </div>
          <div class="tool-panel-body">
            <textarea
              id="md-editor"
              class="code-textarea"
              placeholder="# Write Markdown here..."
              spellcheck="false"
              aria-label="Markdown editor"
              style="min-height: 500px; resize: none;"
            ></textarea>
          </div>
          <div class="editor-statusbar" id="md-statusbar">
            <span class="editor-statusbar-item" id="md-stat-words">0 words</span>
            <span class="editor-statusbar-item" id="md-stat-chars">0 chars</span>
            <span class="editor-statusbar-item" id="md-stat-lines">0 lines</span>
          </div>
        </div>

        <!-- Preview pane -->
        <div class="tool-panel" id="md-preview-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">Preview</div>
          </div>
          <div class="tool-panel-body" style="overflow: auto; min-height: 500px;">
            <div id="md-preview" class="markdown-body" style="padding: var(--space-6); min-height: 100%;"></div>
          </div>
        </div>
      </div>
    </div>

    <style>
      /* GitHub-style Markdown rendering */
      .markdown-body { color: var(--text-primary); font-family: var(--font-sans); font-size: var(--text-sm); line-height: 1.7; }
      .markdown-body h1,.markdown-body h2 { border-bottom: 1px solid var(--border-primary); padding-bottom: var(--space-2); }
      .markdown-body h1 { font-size: var(--text-3xl); margin: var(--space-6) 0 var(--space-4); }
      .markdown-body h2 { font-size: var(--text-2xl); margin: var(--space-5) 0 var(--space-3); }
      .markdown-body h3 { font-size: var(--text-xl); margin: var(--space-4) 0 var(--space-2); }
      .markdown-body h4, .markdown-body h5, .markdown-body h6 { margin: var(--space-3) 0 var(--space-2); }
      .markdown-body p  { margin: var(--space-3) 0; }
      .markdown-body a  { color: var(--accent-400); text-decoration: underline; }
      .markdown-body code { font-family: var(--font-mono); font-size: 0.9em; background: var(--surface-secondary); padding: 2px 6px; border-radius: var(--radius-sm); }
      .markdown-body pre { background: var(--surface-code); border: 1px solid var(--border-primary); border-radius: var(--radius-md); overflow: auto; margin: var(--space-4) 0; }
      .markdown-body pre code { background: none; padding: 0; }
      .markdown-body blockquote { border-left: 3px solid var(--accent-500); margin: var(--space-4) 0; padding: var(--space-2) var(--space-4); color: var(--text-secondary); background: var(--surface-secondary); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
      .markdown-body table { border-collapse: collapse; width: 100%; margin: var(--space-4) 0; }
      .markdown-body th, .markdown-body td { border: 1px solid var(--border-primary); padding: var(--space-2) var(--space-3); }
      .markdown-body th { background: var(--surface-secondary); font-weight: var(--font-semibold); }
      .markdown-body ul, .markdown-body ol { padding-left: var(--space-6); margin: var(--space-2) 0; }
      .markdown-body li { margin: var(--space-1) 0; }
      .markdown-body img { max-width: 100%; border-radius: var(--radius-md); }
      .markdown-body hr { border: none; border-top: 1px solid var(--border-primary); margin: var(--space-6) 0; }
      .markdown-body input[type="checkbox"] { margin-right: var(--space-1); }
    </style>`;
}

// ─── Events ─────────────────────────────────────────────────────

function bindEvents(container) {
    const editor = container.querySelector('#md-editor');
    const preview = container.querySelector('#md-preview');
    let renderedHtml = '';

    const render = debounce(() => {
        const text = editor?.value ?? '';
        renderedHtml = parseMarkdown(text);
        if (preview) {
            preview.innerHTML = renderedHtml;
            // Re-highlight code blocks
            if (window.hljs) {
                preview.querySelectorAll('pre code').forEach(el => {
                    window.hljs.highlightElement(el);
                });
            }
        }
        updateStats(text, container);
    }, 100);

    editor?.addEventListener('input', render);

    // View toggle
    container.querySelector('#md-view-split')?.addEventListener('click', () => setView('split', container));
    container.querySelector('#md-view-edit')?.addEventListener('click', () => setView('edit', container));
    container.querySelector('#md-view-preview')?.addEventListener('click', () => setView('preview', container));

    // Sync scroll
    editor?.addEventListener('scroll', () => {
        if (!container.querySelector('#md-sync-scroll')?.checked) return;
        const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
        const prevBody = container.querySelector('#md-preview-panel .tool-panel-body');
        if (prevBody) prevBody.scrollTop = ratio * (prevBody.scrollHeight - prevBody.clientHeight);
    });

    // Copy HTML
    container.querySelector('#md-copy-html')?.addEventListener('click', () => {
        if (renderedHtml) clipboardService.copyWithFeedback(renderedHtml, container.querySelector('#md-copy-html'));
    });

    // Download MD
    container.querySelector('#md-download-md')?.addEventListener('click', () => {
        const text = editor?.value ?? '';
        if (text) downloadService.text(text, 'document.md');
    });

    // Download HTML
    container.querySelector('#md-download-html')?.addEventListener('click', () => {
        const html = buildHTMLExport(renderedHtml);
        downloadService.html(html, 'document.html');
    });

    // Upload file
    container.querySelector('#md-file-input')?.addEventListener('change', async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await readFileAsText(file).catch(() => null);
        if (text && editor) { editor.value = text; render(); toastService.success('File loaded', file.name); }
    });

    // Clear
    container.querySelector('#md-clear-btn')?.addEventListener('click', () => {
        if (editor) editor.value = '';
        if (preview) preview.innerHTML = '';
        renderedHtml = '';
        updateStats('', container);
    });

    container.querySelector('#md-sample-btn')?.addEventListener('click', () => loadSample(container));
}

function setView(mode, container) {
    ['split', 'edit', 'preview'].forEach(v => {
        container.querySelector(`#md-view-${v}`)?.setAttribute('aria-pressed', String(v === mode));
        container.querySelector(`#md-view-${v}`)?.classList.toggle('active', v === mode);
    });

    const editorPanel = container.querySelector('#md-editor-panel');
    const previewPanel = container.querySelector('#md-preview-panel');
    const layout = container.querySelector('#md-layout');

    if (mode === 'split') {
        if (editorPanel) editorPanel.style.display = '';
        if (previewPanel) previewPanel.style.display = '';
        if (layout) layout.style.display = 'flex';
    } else if (mode === 'edit') {
        if (editorPanel) editorPanel.style.display = '';
        if (previewPanel) previewPanel.style.display = 'none';
        if (layout) layout.style.display = 'flex';
    } else {
        if (editorPanel) editorPanel.style.display = 'none';
        if (previewPanel) previewPanel.style.display = '';
        if (layout) layout.style.display = 'flex';
    }
}

function updateStats(text, container) {
    const words = container.querySelector('#md-stat-words');
    const chars = container.querySelector('#md-stat-chars');
    const lines = container.querySelector('#md-stat-lines');
    if (words) words.textContent = `${wordCount(text)} words`;
    if (chars) chars.textContent = `${charCount(text)} chars`;
    if (lines) lines.textContent = `${lineCount(text)} lines`;
}

function parseMarkdown(text) {
    if (!window.marked) return `<pre>${text}</pre>`;
    // Configure marked
    window.marked.setOptions({ gfm: true, breaks: true });
    return window.marked.parse(text);
}

function buildHTMLExport(body) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Markdown Export</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
<style>
body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; max-width: 900px; margin: 40px auto; padding: 0 24px; color: #24292f; line-height: 1.7; }
h1,h2 { border-bottom: 1px solid #d0d7de; padding-bottom: 8px; }
pre { background: #0d1117; border-radius: 6px; padding: 16px; overflow: auto; }
code { font-family: 'SFMono-Regular',Consolas,monospace; }
table { border-collapse: collapse; width: 100%; }
th,td { border: 1px solid #d0d7de; padding: 6px 13px; }
th { background: #f6f8fa; }
blockquote { border-left: 4px solid #d0d7de; margin: 0; padding: 0 16px; color: #656d76; }
img { max-width: 100%; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function loadSample(container) {
    const editor = container.querySelector('#md-editor');
    if (!editor) return;
    editor.value = SAMPLE_MD;
    editor.dispatchEvent(new Event('input'));
}

const SAMPLE_MD = `# Orion

> Navigate the **Universe of Code** — all developer tools, entirely in your browser.

## Features

- ✅ JSON Formatter & Validator
- ✅ JWT Decoder
- ✅ UUID Generator (v1, v4, v7, ULID, NanoID)
- ✅ SQL Formatter (multiple dialects)
- ✅ Regex Tester with cheatsheet
- ✅ API Tester (mini Postman)
- ✅ Docker Compose Generator
- ✅ ENV Comparator
- ✅ **This Markdown Previewer!**

## Installation

\`\`\`bash
# Clone the repo
git clone https://github.com/Vimantha-Dilshan/developer-toolkit.git

# Open in browser
cd developer-toolkit && open index.html
\`\`\`

## Usage Example

\`\`\`javascript
// JSON Formatting
const data = { name: "Orion", version: "1.0" };
const formatted = JSON.stringify(data, null, 2);
console.log(formatted);
\`\`\`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| \`Ctrl+K\` | Open Command Palette |
| \`Ctrl+/\` | Toggle shortcuts modal |
| \`G H\`   | Go to Home |

## Contributing

1. Fork the repository
2. Create your branch: \`git checkout -b feature/amazing-tool\`
3. Commit: \`git commit -m 'feat: add amazing tool'\`
4. Push: \`git push origin feature/amazing-tool\`
5. Open a Pull Request

---

Made with ❤️ for developers everywhere.
`;
