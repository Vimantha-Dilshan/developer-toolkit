/**
 * Diff Checker Tool
 * =================
 * Line-level text diff — side-by-side or unified/inline view.
 *
 * @module tools/diff-checker
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { downloadService } from '../../assets/js/services/download.service.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
}

function buildUI() {
    return `
    <div class="tool-page" id="diff-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">Diff Checker</h1>
            <p class="tool-description">Compare two text blocks line-by-line. View additions, deletions, and unchanged lines.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="diff-sample-btn">Sample</button>
          <button class="btn btn-ghost btn-sm" id="diff-clear-btn">Clear</button>
          <button class="btn btn-primary" id="diff-compare-btn">Compare</button>
        </div>
      </div>

      <!-- View Options -->
      <div class="tool-options-bar" style="margin-bottom: var(--space-4);">
        <div class="tool-options-group">
          <span class="tool-options-label">View:</span>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm active" data-diff-view="split" aria-pressed="true">Split</button>
            <button class="btn btn-secondary btn-sm" data-diff-view="unified" aria-pressed="false">Unified</button>
          </div>
        </div>
        <div class="tool-options-group">
          <label class="checkbox-item">
            <input type="checkbox" id="diff-ignore-whitespace" />
            <span class="checkbox-label">Ignore whitespace</span>
          </label>
        </div>
        <div class="tool-options-group">
          <label class="checkbox-item">
            <input type="checkbox" id="diff-ignore-case" />
            <span class="checkbox-label">Ignore case</span>
          </label>
        </div>
        <div class="tool-options-group" style="margin-left: auto; gap: var(--space-2);">
          <button class="copy-btn" id="diff-copy-patch" aria-label="Copy unified patch">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Unified Patch
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div id="diff-stats" style="display:none; display: flex; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-4);"></div>

      <!-- Input panels -->
      <div id="diff-inputs" class="tool-layout-split" style="margin-bottom: var(--space-4);">
        <div class="tool-panel">
          <div class="tool-panel-header"><div class="tool-panel-title">Original</div></div>
          <div class="tool-panel-body">
            <textarea id="diff-a" class="code-textarea" rows="10" placeholder="Original text…" spellcheck="false" aria-label="Original text"></textarea>
          </div>
        </div>
        <div class="tool-panel">
          <div class="tool-panel-header"><div class="tool-panel-title">Modified</div></div>
          <div class="tool-panel-body">
            <textarea id="diff-b" class="code-textarea" rows="10" placeholder="Modified text…" spellcheck="false" aria-label="Modified text"></textarea>
          </div>
        </div>
      </div>

      <!-- Diff result -->
      <div id="diff-result" style="display:none;">
        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title" id="diff-result-label">Diff Result</div>
          </div>
          <div class="tool-panel-body" id="diff-result-body" style="overflow: auto; max-height: 560px; font-family: var(--font-mono); font-size: var(--text-xs);"></div>
        </div>
      </div>

      <div id="diff-empty" style="display:flex; align-items:center; justify-content:center; padding: var(--space-8); color: var(--text-tertiary); font-size: var(--text-sm);">
        Paste text in both panels and click Compare
      </div>
    </div>

    <style>
      .diff-line { display: flex; }
      .diff-line-num { min-width: 40px; padding: 2px 8px; text-align: right; color: var(--text-quaternary, #888); user-select: none; border-right: 1px solid var(--border-primary); }
      .diff-line-content { padding: 2px 12px; flex: 1; white-space: pre-wrap; word-break: break-all; }
      .diff-line.added   { background: rgba(34,197,94,0.12); }
      .diff-line.removed { background: rgba(239,68,68,0.12); }
      .diff-line.added   .diff-line-content::before { content: "+ "; color: #4ade80; font-weight: bold; }
      .diff-line.removed .diff-line-content::before { content: "- "; color: #f87171; font-weight: bold; }
      .diff-line.unchanged .diff-line-content::before { content: "  "; }
      /* Split view */
      .diff-split-row { display: grid; grid-template-columns: 1fr 1fr; }
      .diff-split-cell { display: flex; overflow: hidden; border-bottom: 1px solid var(--border-primary); }
      .diff-split-cell.added   { background: rgba(34,197,94,0.12); }
      .diff-split-cell.removed { background: rgba(239,68,68,0.12); }
      .diff-split-cell.empty   { background: var(--surface-secondary); opacity: 0.5; }
    </style>`;
}

function bindEvents(container) {
    let currentView = 'split';
    let lastPatch = '';

    const runDiff = () => {
        const result = doDiff(container, currentView);
        if (result) lastPatch = result.patch;
    };

    container.querySelector('#diff-compare-btn')?.addEventListener('click', runDiff);

    const auto = debounce(runDiff, 500);
    container.querySelector('#diff-a')?.addEventListener('input', auto);
    container.querySelector('#diff-b')?.addEventListener('input', auto);
    container.querySelector('#diff-ignore-whitespace')?.addEventListener('change', runDiff);
    container.querySelector('#diff-ignore-case')?.addEventListener('change', runDiff);

    container.querySelectorAll('[data-diff-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('[data-diff-view]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
            currentView = btn.dataset.diffView;
            runDiff();
        });
    });

    container.querySelector('#diff-copy-patch')?.addEventListener('click', () => {
        if (lastPatch) clipboardService.copyWithFeedback(lastPatch, container.querySelector('#diff-copy-patch'));
    });

    container.querySelector('#diff-sample-btn')?.addEventListener('click', () => {
        container.querySelector('#diff-a').value = SAMPLE_A;
        container.querySelector('#diff-b').value = SAMPLE_B;
        runDiff();
    });

    container.querySelector('#diff-clear-btn')?.addEventListener('click', () => {
        container.querySelector('#diff-a').value = '';
        container.querySelector('#diff-b').value = '';
        container.querySelector('#diff-result').style.display = 'none';
        container.querySelector('#diff-empty').style.display = 'flex';
        container.querySelector('#diff-stats').style.display = 'none';
    });
}

function doDiff(container, viewMode) {
    let rawA = container.querySelector('#diff-a')?.value ?? '';
    let rawB = container.querySelector('#diff-b')?.value ?? '';
    const ignoreWs = container.querySelector('#diff-ignore-whitespace')?.checked ?? false;
    const ignoreCase = container.querySelector('#diff-ignore-case')?.checked ?? false;

    const result = container.querySelector('#diff-result');
    const emptyEl = container.querySelector('#diff-empty');
    const statsEl = container.querySelector('#diff-stats');

    if (!rawA && !rawB) {
        if (result) result.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'flex';
        if (statsEl) statsEl.style.display = 'none';
        return null;
    }

    const normalize = s => {
        if (ignoreWs) s = s.replace(/\s+/g, ' ').trim();
        if (ignoreCase) s = s.toLowerCase();
        return s;
    };

    const aLines = rawA.split('\n');
    const bLines = rawB.split('\n');
    const aNorm = aLines.map(normalize);
    const bNorm = bLines.map(normalize);

    const diff = computeDiff(aNorm, bNorm);

    // Map diff back to original lines
    let ai = 0, bi = 0;
    const hunks = diff.map(op => {
        if (op === '=') { const r = { type: 'unchanged', aLine: aLines[ai], bLine: bLines[bi], an: ai + 1, bn: bi + 1 }; ai++; bi++; return r; }
        if (op === '+') { const r = { type: 'added', aLine: '', bLine: bLines[bi], an: null, bn: bi + 1 }; bi++; return r; }
        if (op === '-') { const r = { type: 'removed', aLine: aLines[ai], bLine: '', an: ai + 1, bn: null }; ai++; return r; }
        return null;
    }).filter(Boolean);

    // Stats
    const added = hunks.filter(h => h.type === 'added').length;
    const removed = hunks.filter(h => h.type === 'removed').length;
    const same = hunks.filter(h => h.type === 'unchanged').length;

    if (statsEl) {
        statsEl.style.display = 'flex';
        statsEl.innerHTML = [
            [`+${added} added`, 'rgba(34,197,94,0.2)', '#4ade80'],
            [`-${removed} removed`, 'rgba(239,68,68,0.2)', '#f87171'],
            [`${same} unchanged`, 'var(--surface-secondary)', 'var(--text-secondary)'],
        ].map(([label, bg, color]) => `
      <div style="padding: var(--space-2) var(--space-4); background: ${bg}; border-radius: var(--radius-md); border: 1px solid var(--border-primary); color: ${color}; font-size: var(--text-sm); font-family: var(--font-mono);">${label}</div>
    `).join('');
    }

    // Render
    const body = container.querySelector('#diff-result-body');
    if (body) {
        body.innerHTML = viewMode === 'split'
            ? renderSplit(hunks)
            : renderUnified(hunks);
    }

    if (result) result.style.display = '';
    if (emptyEl) emptyEl.style.display = 'none';

    // Build unified patch
    const patch = buildUnifiedPatch(hunks);
    return { patch };
}

/** Myers diff algorithm (simplified LCS-based) */
function computeDiff(a, b) {
    const n = a.length, m = b.length;
    const lcs = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            lcs[i][j] = a[i - 1] === b[j - 1] ? lcs[i - 1][j - 1] + 1 : Math.max(lcs[i - 1][j], lcs[i][j - 1]);
        }
    }
    const ops = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { ops.push('='); i--; j--; }
        else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) { ops.push('+'); j--; }
        else { ops.push('-'); i--; }
    }
    return ops.reverse();
}

function renderUnified(hunks) {
    return hunks.map(h => {
        const cls = h.type === 'added' ? 'added' : h.type === 'removed' ? 'removed' : 'unchanged';
        const lineNum = h.type === 'added' ? h.bn : h.an;
        const content = h.type === 'added' ? h.bLine : h.aLine;
        return `<div class="diff-line ${cls}">
      <span class="diff-line-num">${lineNum ?? ''}</span>
      <span class="diff-line-content">${escapeHtml(content)}</span>
    </div>`;
    }).join('');
}

function renderSplit(hunks) {
    return hunks.map(h => {
        const aClass = h.type === 'removed' ? 'removed' : h.type === 'unchanged' ? '' : 'empty';
        const bClass = h.type === 'added' ? 'added' : h.type === 'unchanged' ? '' : 'empty';
        return `<div class="diff-split-row">
      <div class="diff-split-cell ${aClass}">
        <span class="diff-line-num">${h.an ?? ''}</span>
        <span class="diff-line-content">${escapeHtml(h.aLine ?? '')}</span>
      </div>
      <div class="diff-split-cell ${bClass}">
        <span class="diff-line-num">${h.bn ?? ''}</span>
        <span class="diff-line-content">${escapeHtml(h.bLine ?? '')}</span>
      </div>
    </div>`;
    }).join('');
}

function buildUnifiedPatch(hunks) {
    return hunks.map(h => {
        if (h.type === 'added') return `+ ${h.bLine}`;
        if (h.type === 'removed') return `- ${h.aLine}`;
        return `  ${h.aLine}`;
    }).join('\n');
}

const SAMPLE_A = `function greet(name) {
  const message = "Hello, " + name;
  console.log(message);
  return message;
}

const result = greet("World");
console.log(result);`;

const SAMPLE_B = `function greet(name, greeting = "Hello") {
  const message = \`\${greeting}, \${name}!\`;
  console.log(message);
  return message;
}

// Call the function
const result = greet("Developer", "Hi");
console.log("Result:", result);`;
