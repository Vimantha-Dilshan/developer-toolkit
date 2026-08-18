/**
 * Regex Tester Tool
 * =================
 * Live regex matching with flag toggles, replace mode, match table, and a cheatsheet.
 *
 * @module tools/regex-tester
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
}

// ─── UI ─────────────────────────────────────────────────────────

function buildUI() {
    return `
    <div class="tool-page" id="regex-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6m-3-3h6"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">Regex Tester</h1>
            <p class="tool-description">Build and test regular expressions in real time with match highlighting, groups, and replace mode.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="rx-cheatsheet-btn">Cheatsheet</button>
          <button class="btn btn-ghost btn-sm" id="rx-sample-btn">Sample</button>
        </div>
      </div>

      <!-- Pattern + Flags Row -->
      <div class="tool-panel" style="margin-bottom: var(--space-4);">
        <div class="tool-panel-body" style="padding: var(--space-4);">
          <div style="display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <label class="form-label" for="rx-pattern">Regular Expression</label>
              <div class="input-group">
                <span class="input-group-prefix" style="font-family: var(--font-mono); font-size: var(--text-lg);">/</span>
                <input
                  type="text"
                  id="rx-pattern"
                  class="input input-mono"
                  placeholder="Enter regex pattern..."
                  autocomplete="off"
                  spellcheck="false"
                  aria-label="Regular expression pattern"
                />
                <span class="input-group-suffix" style="font-family: var(--font-mono); font-size: var(--text-lg);">/</span>
              </div>
            </div>
            <div>
              <label class="form-label">Flags</label>
              <div class="btn-group" role="group" aria-label="Regex flags">
                ${['g', 'i', 'm', 's', 'u'].map(f => `
                  <button
                    class="btn btn-secondary btn-sm flag-toggle"
                    data-flag="${f}"
                    aria-pressed="false"
                    title="${flagDesc(f)}"
                    style="min-width: 32px; font-family: var(--font-mono);"
                  >${f}</button>`).join('')}
              </div>
            </div>
          </div>

          <!-- Replace row -->
          <div style="display: flex; gap: var(--space-3); align-items: center; margin-top: var(--space-3);">
            <div style="flex: 1; min-width: 200px;" id="rx-replace-wrap">
              <label class="form-label" for="rx-replace">Replace With</label>
              <input
                type="text"
                id="rx-replace"
                class="input input-mono"
                placeholder='Replacement string (use $1, $2 for groups)'
                autocomplete="off"
                aria-label="Replacement string"
              />
            </div>
            <div style="display: flex; gap: var(--space-2); align-items: flex-end; padding-bottom: 1px;">
              <div class="btn-group">
                <button class="btn btn-secondary btn-sm active" id="rx-mode-match" aria-pressed="true">Match</button>
                <button class="btn btn-secondary btn-sm" id="rx-mode-replace" aria-pressed="false">Replace</button>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div id="rx-pattern-status" style="margin-top: var(--space-2); min-height: 24px; font-size: var(--text-xs);"></div>
        </div>
      </div>

      <!-- Test String -->
      <div class="tool-layout-split" style="min-height: 380px;">
        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">Test String</div>
          </div>
          <div class="tool-panel-body" style="position: relative;">
            <textarea
              id="rx-test-input"
              class="code-textarea"
              placeholder="Enter test string here..."
              spellcheck="false"
              style="min-height: 300px;"
              aria-label="Test string"
            ></textarea>
          </div>
        </div>

        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title" id="rx-result-title">Result</div>
            <div class="tool-panel-actions">
              <button class="copy-btn" id="rx-copy-result" aria-label="Copy result">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
            </div>
          </div>
          <div class="tool-panel-body" style="overflow: auto; min-height: 300px;" id="rx-result-body">
            <div id="rx-match-display" style="padding: var(--space-4); font-family: var(--font-mono); font-size: var(--text-sm); white-space: pre-wrap; line-height: 1.7;"></div>
          </div>
        </div>
      </div>

      <!-- Match Table -->
      <div class="tool-panel" style="margin-top: var(--space-4);" id="rx-table-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title" id="rx-table-title">Matches</div>
        </div>
        <div class="tool-panel-body" style="overflow: auto; max-height: 300px;" id="rx-table-body">
          <div style="display:flex; align-items:center; justify-content:center; padding: var(--space-8); color: var(--text-tertiary); font-size: var(--text-sm);">
            No matches yet
          </div>
        </div>
      </div>

      <!-- Cheatsheet (hidden by default) -->
      <div id="rx-cheatsheet" class="tool-panel" style="display:none; margin-top: var(--space-4);">
        <div class="tool-panel-header">
          <div class="tool-panel-title">Regex Cheatsheet</div>
          <div class="tool-panel-actions">
            <button class="btn btn-ghost btn-xs" id="rx-cheatsheet-close">Close</button>
          </div>
        </div>
        <div class="tool-panel-body" style="padding: var(--space-4);">
          ${buildCheatsheet()}
        </div>
      </div>
    </div>

    <style>
      .rx-highlight { background: rgba(139,92,246,0.35); border-radius: 2px; outline: 1px solid rgba(139,92,246,0.5); }
      .rx-match-row { cursor: pointer; }
      .rx-match-row:hover td { background: var(--surface-hover); }
      .rx-group-badge { display: inline-block; padding: 1px 6px; background: var(--accent-500); color: #fff; border-radius: var(--radius-sm); font-size: 10px; margin-left: 4px; }
    </style>`;
}

function flagDesc(f) {
    const d = { g: 'global — find all matches', i: 'case insensitive', m: 'multiline', s: 'dotAll — . matches newline', u: 'unicode' };
    return d[f] ?? f;
}

function buildCheatsheet() {
    const sections = [
        {
            title: 'Character Classes',
            rows: [
                ['.', 'Any character except newline'],
                ['\\w', 'Word character [a-zA-Z0-9_]'],
                ['\\d', 'Digit [0-9]'],
                ['\\s', 'Whitespace'],
                ['\\W \\D \\S', 'Negated versions'],
                ['[abc]', 'Character set a, b or c'],
                ['[^abc]', 'Negated set'],
                ['[a-z]', 'Character range'],
            ],
        },
        {
            title: 'Anchors',
            rows: [
                ['^', 'Start of string/line'],
                ['$', 'End of string/line'],
                ['\\b', 'Word boundary'],
                ['\\B', 'Non-word boundary'],
            ],
        },
        {
            title: 'Quantifiers',
            rows: [
                ['*', '0 or more'],
                ['+', '1 or more'],
                ['?', '0 or 1'],
                ['{n}', 'Exactly n'],
                ['{n,}', 'n or more'],
                ['{n,m}', 'Between n and m'],
                ['*? +? ??', 'Lazy (non-greedy) versions'],
            ],
        },
        {
            title: 'Groups & Lookahead',
            rows: [
                ['(abc)', 'Capture group'],
                ['(?:abc)', 'Non-capturing group'],
                ['(?=abc)', 'Positive lookahead'],
                ['(?!abc)', 'Negative lookahead'],
                ['(?<=abc)', 'Positive lookbehind'],
                ['(?<!abc)', 'Negative lookbehind'],
                ['$1 $2', 'Backreferences in replace'],
                ['\\1 \\2', 'Backreferences in pattern'],
            ],
        },
    ];

    return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-4);">
      ${sections.map(s => `
        <div>
          <div style="font-weight: var(--font-semibold); font-size: var(--text-sm); margin-bottom: var(--space-2); color: var(--accent-400);">${s.title}</div>
          <table style="width: 100%; border-collapse: collapse; font-size: var(--text-xs);">
            ${s.rows.map(([pattern, desc]) => `
              <tr>
                <td style="padding: 3px 8px 3px 0; font-family: var(--font-mono); color: var(--text-primary); white-space: nowrap;">${escapeHtml(pattern)}</td>
                <td style="padding: 3px 0; color: var(--text-secondary);">${desc}</td>
              </tr>`).join('')}
          </table>
        </div>`).join('')}
    </div>`;
}

// ─── Events ─────────────────────────────────────────────────────

function bindEvents(container) {
    let mode = 'match';

    const getFlags = () =>
        [...container.querySelectorAll('.flag-toggle[aria-pressed="true"]')].map(b => b.dataset.flag).join('');

    const test = debounce(() => runTest(container, mode), 200);

    container.querySelector('#rx-pattern')?.addEventListener('input', test);
    container.querySelector('#rx-test-input')?.addEventListener('input', test);
    container.querySelector('#rx-replace')?.addEventListener('input', test);

    container.querySelectorAll('.flag-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const pressed = btn.getAttribute('aria-pressed') === 'true';
            btn.setAttribute('aria-pressed', String(!pressed));
            btn.classList.toggle('active', !pressed);
            test();
        });
    });

    container.querySelector('#rx-mode-match')?.addEventListener('click', () => {
        mode = 'match';
        setMode(container, 'match');
        test();
    });

    container.querySelector('#rx-mode-replace')?.addEventListener('click', () => {
        mode = 'replace';
        setMode(container, 'replace');
        test();
    });

    container.querySelector('#rx-copy-result')?.addEventListener('click', () => {
        const text = container.querySelector('#rx-match-display')?.textContent ?? '';
        if (text) clipboardService.copyWithFeedback(text, container.querySelector('#rx-copy-result'));
    });

    container.querySelector('#rx-cheatsheet-btn')?.addEventListener('click', () => {
        const cs = container.querySelector('#rx-cheatsheet');
        if (cs) cs.style.display = cs.style.display === 'none' ? 'block' : 'none';
    });

    container.querySelector('#rx-cheatsheet-close')?.addEventListener('click', () => {
        const cs = container.querySelector('#rx-cheatsheet');
        if (cs) cs.style.display = 'none';
    });

    container.querySelector('#rx-sample-btn')?.addEventListener('click', () => {
        const patternEl = container.querySelector('#rx-pattern');
        const testEl = container.querySelector('#rx-test-input');
        if (patternEl) patternEl.value = '[A-Z][a-z]+';
        if (testEl) testEl.value = 'Hello World! This is Orion — Navigate the Universe of Code.';
        // Set global flag
        container.querySelectorAll('.flag-toggle').forEach(b => {
            const f = b.dataset.flag;
            const on = f === 'g';
            b.setAttribute('aria-pressed', String(on));
            b.classList.toggle('active', on);
        });
        test();
    });
}

function setMode(container, mode) {
    container.querySelector('#rx-mode-match')?.setAttribute('aria-pressed', String(mode === 'match'));
    container.querySelector('#rx-mode-replace')?.setAttribute('aria-pressed', String(mode === 'replace'));
    container.querySelector('#rx-mode-match')?.classList.toggle('active', mode === 'match');
    container.querySelector('#rx-mode-replace')?.classList.toggle('active', mode === 'replace');
    container.querySelector('#rx-result-title').textContent = mode === 'replace' ? 'Replaced Output' : 'Match Highlight';
}

// ─── Core Test ──────────────────────────────────────────────────

function runTest(container, mode) {
    const patternVal = container.querySelector('#rx-pattern')?.value ?? '';
    const testStr = container.querySelector('#rx-test-input')?.value ?? '';
    const flags = [...container.querySelectorAll('.flag-toggle[aria-pressed="true"]')].map(b => b.dataset.flag).join('');
    const replaceStr = container.querySelector('#rx-replace')?.value ?? '';
    const statusEl = container.querySelector('#rx-pattern-status');
    const displayEl = container.querySelector('#rx-match-display');
    const tableBody = container.querySelector('#rx-table-body');

    if (!patternVal) {
        if (displayEl) displayEl.innerHTML = escapeHtml(testStr);
        if (tableBody) tableBody.innerHTML = emptyTableMsg('Enter a pattern above');
        if (statusEl) statusEl.textContent = '';
        return;
    }

    let re;
    try {
        re = new RegExp(patternVal, flags);
        if (statusEl) statusEl.innerHTML = `<span style="color: var(--color-success-text);">✓ Valid regex</span>`;
    } catch (err) {
        if (statusEl) statusEl.innerHTML = `<span style="color: var(--color-error-text);">✗ ${escapeHtml(err.message)}</span>`;
        if (displayEl) displayEl.innerHTML = escapeHtml(testStr);
        if (tableBody) tableBody.innerHTML = emptyTableMsg('Invalid regex');
        return;
    }

    if (mode === 'replace') {
        try {
            const replaced = testStr.replace(re, replaceStr);
            if (displayEl) displayEl.textContent = replaced;
            if (tableBody) tableBody.innerHTML = emptyTableMsg('Replace mode — no match table');
        } catch (err) {
            if (displayEl) displayEl.textContent = `Error: ${err.message}`;
        }
        return;
    }

    // Match mode
    const globalRe = flags.includes('g') ? re : new RegExp(patternVal, flags + 'g');
    const matches = [...testStr.matchAll(globalRe)];

    if (matches.length === 0) {
        if (displayEl) displayEl.innerHTML = escapeHtml(testStr);
        if (tableBody) tableBody.innerHTML = emptyTableMsg('No matches found');
        if (statusEl) {
            statusEl.innerHTML += `<span style="color: var(--text-tertiary); margin-left: var(--space-2);">— 0 matches</span>`;
        }
        return;
    }

    if (statusEl) {
        statusEl.innerHTML += `<span style="color: var(--text-tertiary); margin-left: var(--space-2);">— ${matches.length} match${matches.length === 1 ? '' : 'es'}</span>`;
    }

    // Build highlighted text
    let highlighted = '';
    let lastIdx = 0;
    for (const m of matches) {
        const start = m.index ?? 0;
        const end = start + m[0].length;
        highlighted += escapeHtml(testStr.slice(lastIdx, start));
        highlighted += `<mark class="rx-highlight" title="Match: ${escapeHtml(m[0])}">${escapeHtml(m[0])}</mark>`;
        lastIdx = end;
    }
    highlighted += escapeHtml(testStr.slice(lastIdx));

    if (displayEl) displayEl.innerHTML = highlighted;

    // Build match table
    if (tableBody) {
        const hasGroups = matches[0]?.length > 1;
        const groupCols = hasGroups
            ? Array.from({ length: (matches[0]?.length ?? 1) - 1 }, (_, i) => `<th>Group ${i + 1}</th>`).join('')
            : '';

        tableBody.innerHTML = `
      <table class="data-table" style="width: 100%;">
        <thead><tr>
          <th>#</th><th>Match</th><th>Index</th><th>Length</th>
          ${groupCols}
        </tr></thead>
        <tbody>
          ${matches.map((m, i) => {
            const groups = m.slice(1).map(g =>
                `<td style="font-family: var(--font-mono);">${g !== undefined ? escapeHtml(g) : '<em style="color:var(--text-tertiary)">undefined</em>'}</td>`
            ).join('');
            return `<tr class="rx-match-row">
              <td style="color: var(--text-tertiary);">${i + 1}</td>
              <td style="font-family: var(--font-mono); font-weight: var(--font-semibold); color: var(--accent-400);">${escapeHtml(m[0])}</td>
              <td>${m.index}</td>
              <td>${m[0].length}</td>
              ${groups}
            </tr>`;
        }).join('')}
        </tbody>
      </table>`;
    }
}

function emptyTableMsg(msg) {
    return `<div style="display:flex; align-items:center; justify-content:center; padding: var(--space-8); color: var(--text-tertiary); font-size: var(--text-sm);">${msg}</div>`;
}
