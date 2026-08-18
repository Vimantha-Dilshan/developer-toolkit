/**
 * SQL Formatter Tool
 * ==================
 * Format SQL queries across multiple dialects with syntax highlighting.
 *
 * @module tools/sql-formatter
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { downloadService } from '../../assets/js/services/download.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';
import { escapeHtml, readFileAsText } from '../../assets/js/utils/dom.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
}

// ─── UI ─────────────────────────────────────────────────────────

function buildUI() {
    return `
    <div class="tool-page" id="sql-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">SQL Formatter</h1>
            <p class="tool-description">Format, beautify, and lint SQL queries across MySQL, PostgreSQL, SQLite, SQL Server and Oracle.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="sql-sample-btn">Sample</button>
          <button class="btn btn-ghost btn-sm" id="sql-clear-btn">Clear</button>
          <label class="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload
            <input type="file" id="sql-file-input" accept=".sql,.txt" class="sr-only" aria-label="Upload SQL file" />
          </label>
        </div>
      </div>

      <div class="tool-options-bar" style="flex-wrap: wrap;">
        <div class="tool-options-group">
          <span class="tool-options-label">Dialect:</span>
          <select class="select" id="sql-dialect" aria-label="SQL dialect">
            <option value="mysql">MySQL</option>
            <option value="postgresql" selected>PostgreSQL</option>
            <option value="sqlite">SQLite</option>
            <option value="tsql">SQL Server (T-SQL)</option>
            <option value="oracle">Oracle</option>
          </select>
        </div>
        <div class="tool-options-group">
          <span class="tool-options-label">Indent:</span>
          <select class="select" id="sql-indent" aria-label="Indent size">
            <option value="2" selected>2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </div>
        <div class="tool-options-group">
          <span class="tool-options-label">Keywords:</span>
          <select class="select" id="sql-keywords" aria-label="Keyword case">
            <option value="upper" selected>UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="preserve">Preserve</option>
          </select>
        </div>
        <div class="tool-options-group">
          <label class="checkbox-item">
            <input type="checkbox" id="sql-newline-before" checked />
            <span class="checkbox-label">Clause on new line</span>
          </label>
        </div>
        <div class="tool-options-group" style="margin-left:auto;">
          <button class="btn btn-primary" id="sql-format-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
            Format SQL
          </button>
        </div>
      </div>

      <div class="tool-layout-split" style="min-height: 520px;">

        <!-- Input -->
        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">Input SQL</div>
          </div>
          <div class="tool-panel-body">
            <textarea
              id="sql-input"
              class="code-textarea"
              placeholder="Paste your SQL query here..."
              spellcheck="false"
              autocomplete="off"
              aria-label="SQL input"
              style="min-height: 460px;"
            ></textarea>
          </div>
        </div>

        <!-- Output -->
        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">Formatted SQL</div>
            <div class="tool-panel-actions">
              <button class="copy-btn" id="sql-copy-btn" aria-label="Copy formatted SQL">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
              <button class="copy-btn" id="sql-download-btn" aria-label="Download formatted SQL">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            </div>
          </div>
          <div class="tool-panel-body" style="overflow: auto; min-height: 460px;">
            <div id="sql-output-placeholder" style="display:flex; align-items:center; justify-content:center; height: 100%; min-height: 400px; color: var(--text-tertiary); font-size: var(--text-sm);">
              Formatted SQL will appear here
            </div>
            <pre id="sql-output" style="display:none; margin:0;"><code id="sql-output-code" class="language-sql"></code></pre>
          </div>
          <div class="editor-statusbar" id="sql-status-bar" aria-live="polite">
            <span class="editor-statusbar-item" id="sql-status">Ready</span>
          </div>
        </div>

      </div>
    </div>`;
}

// ─── Events ─────────────────────────────────────────────────────

function bindEvents(container) {
    let currentFormatted = '';

    container.querySelector('#sql-format-btn')?.addEventListener('click', () => {
        const raw = container.querySelector('#sql-input')?.value?.trim();
        currentFormatted = formatSQL(raw, container);
    });

    container.querySelector('#sql-input')?.addEventListener('input', debounce(() => {
        const raw = container.querySelector('#sql-input')?.value?.trim();
        if (raw) currentFormatted = formatSQL(raw, container);
    }, 600));

    container.querySelector('#sql-copy-btn')?.addEventListener('click', () => {
        if (currentFormatted) clipboardService.copyWithFeedback(currentFormatted, container.querySelector('#sql-copy-btn'));
    });

    container.querySelector('#sql-download-btn')?.addEventListener('click', () => {
        if (currentFormatted) downloadService.text(currentFormatted, 'formatted.sql');
    });

    container.querySelector('#sql-sample-btn')?.addEventListener('click', () => {
        const inputEl = container.querySelector('#sql-input');
        if (inputEl) {
            inputEl.value = getSampleSQL();
            currentFormatted = formatSQL(inputEl.value, container);
        }
    });

    container.querySelector('#sql-clear-btn')?.addEventListener('click', () => {
        const inputEl = container.querySelector('#sql-input');
        if (inputEl) inputEl.value = '';
        container.querySelector('#sql-output-placeholder').style.display = 'flex';
        container.querySelector('#sql-output').style.display = 'none';
        currentFormatted = '';
    });

    container.querySelector('#sql-file-input')?.addEventListener('change', async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await readFileAsText(file);
            const inputEl = container.querySelector('#sql-input');
            if (inputEl) inputEl.value = text;
            currentFormatted = formatSQL(text, container);
        } catch {
            toastService.error('Failed to read file');
        }
    });

    // Re-format when options change
    ['sql-dialect', 'sql-indent', 'sql-keywords', 'sql-newline-before'].forEach(id => {
        container.querySelector(`#${id}`)?.addEventListener('change', () => {
            const raw = container.querySelector('#sql-input')?.value?.trim();
            if (raw) currentFormatted = formatSQL(raw, container);
        });
    });
}

// ─── SQL Formatter ──────────────────────────────────────────────

const SQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
    'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN', 'ON', 'AND', 'OR', 'NOT', 'IN',
    'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'NULL', 'AS', 'DISTINCT',
    'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'UNION ALL',
    'INTERSECT', 'EXCEPT', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
    'DELETE', 'CREATE TABLE', 'CREATE INDEX', 'CREATE VIEW', 'DROP TABLE',
    'DROP INDEX', 'DROP VIEW', 'ALTER TABLE', 'ADD', 'MODIFY', 'RENAME',
    'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'UNIQUE', 'NOT NULL', 'DEFAULT',
    'CHECK', 'INDEX', 'CONSTRAINT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'EXISTS', 'WITH', 'RECURSIVE', 'RETURNING', 'BEGIN', 'COMMIT', 'ROLLBACK',
    'TRANSACTION', 'EXPLAIN', 'ANALYZE', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
    'COALESCE', 'NULLIF', 'CAST', 'CONVERT', 'ISNULL', 'CONCAT', 'LENGTH',
    'UPPER', 'LOWER', 'TRIM', 'SUBSTR', 'SUBSTRING', 'REPLACE', 'NOW', 'CURRENT_TIMESTAMP',
    'DATE', 'DATETIME', 'TIMESTAMP', 'INT', 'INTEGER', 'BIGINT', 'SMALLINT',
    'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'VARCHAR', 'CHAR', 'TEXT', 'BLOB',
    'BOOLEAN', 'BOOL', 'SERIAL', 'AUTO_INCREMENT', 'IDENTITY',
];

function formatSQL(raw, container) {
    if (!raw) return '';

    const keywordCase = container.querySelector('#sql-keywords')?.value ?? 'upper';
    const indentVal = container.querySelector('#sql-indent')?.value ?? '2';
    const newlineBefore = container.querySelector('#sql-newline-before')?.checked ?? true;
    const indent = indentVal === 'tab' ? '\t' : ' '.repeat(parseInt(indentVal, 10));

    let sql = raw.replace(/\s+/g, ' ').trim();

    // Keyword casing
    if (keywordCase !== 'preserve') {
        SQL_KEYWORDS.forEach(kw => {
            const re = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'gi');
            sql = sql.replace(re, keywordCase === 'upper' ? kw.toUpperCase() : kw.toLowerCase());
        });
    }

    if (newlineBefore) {
        // Main clause keywords get their own line
        const clauses = [
            'SELECT', 'FROM', 'WHERE', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
            'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN', 'ON', 'AND', 'OR',
            'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION ALL',
            'UNION', 'INTERSECT', 'EXCEPT', 'INSERT INTO', 'VALUES', 'UPDATE',
            'SET', 'DELETE FROM', 'RETURNING', 'WITH',
        ];
        const pattern = keywordCase === 'upper'
            ? clauses.map(k => k.toUpperCase())
            : keywordCase === 'lower'
                ? clauses.map(k => k.toLowerCase())
                : clauses;

        pattern.forEach((kw, i) => {
            const re = new RegExp(`\\s+(${kw.replace(/\s+/g, '\\s+')})\\b`, 'g');
            sql = sql.replace(re, `\n${kw}`);
        });

        // Indent things after SELECT
        sql = sql.replace(/\bSELECT\b/i, match => match)
            .replace(/,\s+(?=\w)/g, `,\n${indent}`)
            .replace(/\((?!SELECT)/g, '(\n' + indent)
            .replace(/\)\s*(?=,|\bFROM\b|\bWHERE\b)/ig, '\n)');

        // Indent WHERE conditions
        sql = sql.replace(/\bAND\b(?!\s*\()/g, `\n${indent}AND`);
        sql = sql.replace(/\bOR\b(?!\s*\()/g, `\n${indent}OR`);
    }

    // Clean up extra blank lines
    sql = sql.replace(/\n{3,}/g, '\n\n').trim();

    // Render
    const placeholder = container.querySelector('#sql-output-placeholder');
    const outputEl = container.querySelector('#sql-output');
    const codeEl = container.querySelector('#sql-output-code');
    const statusEl = container.querySelector('#sql-status');

    if (placeholder) placeholder.style.display = 'none';
    if (outputEl) outputEl.style.display = 'block';
    if (codeEl) {
        codeEl.textContent = sql;
        if (window.hljs) window.hljs.highlightElement(codeEl);
    }
    if (statusEl) {
        const lines = sql.split('\n').length;
        statusEl.textContent = `✓ Formatted · ${lines} lines`;
        statusEl.style.color = 'var(--color-success-text)';
    }

    return sql;
}

function getSampleSQL() {
    return `SELECT u.id, u.name, u.email, COUNT(o.id) AS total_orders, SUM(o.amount) AS total_amount FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at >= '2024-01-01' AND u.status = 'active' AND (o.status = 'completed' OR o.status = 'processing') GROUP BY u.id, u.name, u.email HAVING total_orders > 5 ORDER BY total_amount DESC LIMIT 20 OFFSET 0;`;
}
