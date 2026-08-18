/**
 * Cron Parser Tool
 * ================
 * Parse cron expressions and display human-readable descriptions
 * plus the next N scheduled execution times.
 *
 * @module tools/cron-parser
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
    // Parse default expression
    const input = container.querySelector('#cron-input');
    if (input) { input.value = '0 9 * * 1-5'; parseCron(container); }
}

function buildUI() {
    return `
    <div class="tool-page" id="cron-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">Cron Parser</h1>
            <p class="tool-description">Parse and explain cron expressions. Preview the next scheduled execution times.</p>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="tool-panel" style="margin-bottom: var(--space-4);">
        <div class="tool-panel-body" style="padding: var(--space-5);">
          <div style="display: flex; gap: var(--space-3); align-items: flex-end; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 280px;">
              <label class="form-label" for="cron-input" style="display:block; margin-bottom: var(--space-1);">Cron Expression (5 or 6 fields)</label>
              <input type="text" id="cron-input" class="input input-mono" placeholder="* * * * *" autocomplete="off" aria-label="Cron expression" />
            </div>
            <div class="form-group" style="min-width: 60px;">
              <label class="form-label" for="cron-count">Next</label>
              <select class="select" id="cron-count">
                <option value="5">5</option>
                <option value="10" selected>10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <button class="btn btn-primary" id="cron-parse-btn" style="height: 38px;">Parse</button>
          </div>

          <!-- Field labels -->
          <div id="cron-field-labels" style="margin-top: var(--space-3); display: flex; gap: var(--space-2); flex-wrap: wrap;"></div>
        </div>
      </div>

      <!-- Quick templates -->
      <div style="margin-bottom: var(--space-4);">
        <div style="font-size: var(--text-xs); font-weight: var(--font-semibold); text-transform: uppercase; color: var(--text-tertiary); margin-bottom: var(--space-2);">Common Expressions</div>
        <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);" id="cron-templates"></div>
      </div>

      <!-- Error banner -->
      <div id="cron-error" style="display:none; margin-bottom: var(--space-3);"></div>

      <!-- Results -->
      <div id="cron-results" style="display:none;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
          <!-- Description -->
          <div class="tool-panel">
            <div class="tool-panel-header"><div class="tool-panel-title">Human Description</div></div>
            <div class="tool-panel-body" style="padding: var(--space-5);">
              <div id="cron-description" style="font-size: var(--text-base); color: var(--text-primary); line-height: 1.8;"></div>
              <div id="cron-field-breakdown" style="margin-top: var(--space-4);"></div>
            </div>
          </div>

          <!-- Next executions -->
          <div class="tool-panel">
            <div class="tool-panel-header">
              <div class="tool-panel-title" id="cron-next-label">Next 10 Executions</div>
              <div class="tool-panel-actions">
                <button class="copy-btn" id="cron-copy-times" aria-label="Copy times">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
              </div>
            </div>
            <div class="tool-panel-body" id="cron-times-body" style="overflow: auto; max-height: 400px;"></div>
          </div>
        </div>
      </div>

      <div id="cron-empty" style="display:flex; align-items:center; justify-content:center; padding: var(--space-8); color: var(--text-tertiary); font-size: var(--text-sm);">
        Enter a cron expression above to get started
      </div>
    </div>`;
}

const TEMPLATES = [
    { label: 'Every minute', expr: '* * * * *' },
    { label: 'Every 5 minutes', expr: '*/5 * * * *' },
    { label: 'Every hour', expr: '0 * * * *' },
    { label: 'Every day at 9 AM', expr: '0 9 * * *' },
    { label: 'Weekdays at 9 AM', expr: '0 9 * * 1-5' },
    { label: 'Every Sunday', expr: '0 0 * * 0' },
    { label: 'First of month', expr: '0 0 1 * *' },
    { label: 'Every 30 minutes', expr: '*/30 * * * *' },
    { label: 'Every midnight', expr: '0 0 * * *' },
    { label: 'Twice daily', expr: '0 8,20 * * *' },
];

function bindEvents(container) {
    // Render templates
    const tplWrap = container.querySelector('#cron-templates');
    TEMPLATES.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary btn-xs';
        btn.textContent = t.label;
        btn.style.fontFamily = 'var(--font-mono)';
        btn.addEventListener('click', () => {
            container.querySelector('#cron-input').value = t.expr;
            parseCron(container);
        });
        tplWrap?.appendChild(btn);
    });

    const auto = debounce(() => parseCron(container), 400);
    container.querySelector('#cron-input')?.addEventListener('input', auto);
    container.querySelector('#cron-count')?.addEventListener('change', () => parseCron(container));
    container.querySelector('#cron-parse-btn')?.addEventListener('click', () => parseCron(container));

    container.querySelector('#cron-copy-times')?.addEventListener('click', () => {
        const times = [...container.querySelectorAll('.cron-time-entry')].map(el => el.textContent?.trim() ?? '').join('\n');
        if (times) clipboardService.copyWithFeedback(times, container.querySelector('#cron-copy-times'));
    });
}

function parseCron(container) {
    const raw = container.querySelector('#cron-input')?.value?.trim() ?? '';
    const count = parseInt(container.querySelector('#cron-count')?.value ?? '10', 10);
    const results = container.querySelector('#cron-results');
    const errorEl = container.querySelector('#cron-error');
    const emptyEl = container.querySelector('#cron-empty');

    if (!raw) {
        if (results) results.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'flex';
        if (errorEl) errorEl.style.display = 'none';
        updateFieldLabels(container, []);
        return;
    }

    const fields = raw.split(/\s+/);
    if (fields.length < 5 || fields.length > 6) {
        showError(container, `Expected 5 or 6 fields, got ${fields.length}`);
        return;
    }

    try {
        const parsed = parseFields(fields);
        if (errorEl) errorEl.style.display = 'none';

        updateFieldLabels(container, fields);

        // Description
        const descEl = container.querySelector('#cron-description');
        if (descEl) descEl.innerHTML = buildDescription(parsed, fields);

        // Breakdown
        const breakdownEl = container.querySelector('#cron-field-breakdown');
        if (breakdownEl) breakdownEl.innerHTML = buildBreakdown(parsed, fields);

        // Next executions
        const nextTimes = getNextN(parsed, count, new Date());
        const timesBody = container.querySelector('#cron-times-body');
        const nextLabel = container.querySelector('#cron-next-label');
        if (nextLabel) nextLabel.textContent = `Next ${count} Executions`;
        if (timesBody) {
            timesBody.innerHTML = nextTimes.map((d, i) => `
        <div class="cron-time-entry" style="display:flex; justify-content:space-between; padding: var(--space-2) var(--space-4); border-bottom: 1px solid var(--border-primary); font-size: var(--text-xs); font-family: var(--font-mono);">
          <span style="color: var(--text-tertiary);">#${i + 1}</span>
          <span>${formatDate(d)}</span>
          <span style="color: var(--text-tertiary);">${relativeTime(d)}</span>
        </div>`).join('');
        }

        if (results) results.style.display = '';
        if (emptyEl) emptyEl.style.display = 'none';

    } catch (err) {
        showError(container, err.message);
    }
}

function showError(container, msg) {
    const errorEl = container.querySelector('#cron-error');
    const results = container.querySelector('#cron-results');
    if (errorEl) { errorEl.innerHTML = `<div class="result-error">${escapeHtml(msg)}</div>`; errorEl.style.display = ''; }
    if (results) results.style.display = 'none';
    container.querySelector('#cron-empty').style.display = 'none';
}

// ─── Field labels ───────────────────────────────────────────────

const FIELD_NAMES_5 = ['minute', 'hour', 'day of month', 'month', 'day of week'];
const FIELD_NAMES_6 = ['second', 'minute', 'hour', 'day of month', 'month', 'day of week'];

function updateFieldLabels(container, fields) {
    const wrap = container.querySelector('#cron-field-labels');
    if (!wrap) return;
    const names = fields.length === 6 ? FIELD_NAMES_6 : FIELD_NAMES_5;
    wrap.innerHTML = fields.map((f, i) => `
    <div style="text-align:center; padding: var(--space-1) var(--space-2); background: var(--surface-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-primary);">
      <div style="font-family: var(--font-mono); font-weight: var(--font-bold); font-size: var(--text-sm); color: var(--accent-400);">${escapeHtml(f)}</div>
      <div style="font-size: 10px; color: var(--text-tertiary);">${names[i] ?? ''}</div>
    </div>`).join('');
}

// ─── Parser ─────────────────────────────────────────────────────

function parseFields(fields) {
    const has6 = fields.length === 6;
    const offset = has6 ? 1 : 0;
    return {
        second: has6 ? parseField(fields[0], 0, 59, 'second') : { type: 'fixed', values: [0] },
        minute: parseField(fields[0 + offset], 0, 59, 'minute'),
        hour: parseField(fields[1 + offset], 0, 23, 'hour'),
        dom: parseField(fields[2 + offset], 1, 31, 'dom'),
        month: parseField(fields[3 + offset], 1, 12, 'month'),
        dow: parseField(fields[4 + offset], 0, 7, 'dow'),
        _fields: fields,
        _has6: has6,
    };
}

function parseField(expr, min, max, name) {
    if (expr === '*') return { type: 'all', min, max };

    const values = new Set();
    const parts = expr.split(',');

    for (const part of parts) {
        const stepMatch = part.match(/^(.+)\/(\d+)$/);
        if (stepMatch) {
            const range = stepMatch[1];
            const step = parseInt(stepMatch[2], 10);
            const rng = range === '*' ? [min, max] : range.split('-').map(Number);
            const start = rng[0], end = rng[1] ?? max;
            for (let i = start; i <= end; i += step) values.add(i);
            continue;
        }
        if (part.includes('-')) {
            const [s, e] = part.split('-').map(Number);
            for (let i = s; i <= e; i++) values.add(i);
            continue;
        }
        values.add(parseInt(part, 10));
    }

    const arr = [...values].sort((a, b) => a - b);
    if (arr.some(v => v < min || v > max)) throw new Error(`Field "${name}" has value out of range ${min}-${max}`);
    return { type: 'list', values: arr, min, max };
}

function getValues(field, min, max) {
    return field.type === 'all' ? range(min, max) : field.values;
}

function range(a, b) {
    const arr = [];
    for (let i = a; i <= b; i++) arr.push(i);
    return arr;
}

// ─── Next N executions ──────────────────────────────────────────

function getNextN(parsed, n, from) {
    const results = [];
    let d = new Date(from);
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1); // start from next minute

    for (let tries = 0; tries < 500000 && results.length < n; tries++) {
        if (matchesCron(parsed, d)) results.push(new Date(d));
        d = new Date(d.getTime() + 60 * 1000);
    }
    return results;
}

function matchesCron(p, d) {
    const month = d.getMonth() + 1;
    const dom = d.getDate();
    const dow = d.getDay(); // 0=Sun
    const hour = d.getHours();
    const min = d.getMinutes();

    const months = getValues(p.month, 1, 12);
    const doms = getValues(p.dom, 1, 31);
    const dows = getValues(p.dow, 0, 7).map(v => v === 7 ? 0 : v); // 7 = Sunday alias
    const hours = getValues(p.hour, 0, 23);
    const minutes = getValues(p.minute, 0, 59);

    return months.includes(month)
        && doms.includes(dom)
        && dows.includes(dow)
        && hours.includes(hour)
        && minutes.includes(min);
}

// ─── Human description ──────────────────────────────────────────

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function buildDescription(parsed, fields) {
    const minuteDesc = describeField(parsed.minute, 'minute', 0, 59, v => `${v}`);
    const hourDesc = describeField(parsed.hour, 'hour', 0, 23, v => `${v}:00`);
    const domDesc = describeField(parsed.dom, 'day', 1, 31, v => ordinal(v));
    const monthDesc = describeField(parsed.month, 'month', 1, 12, v => MONTH_NAMES[v]);
    const dowDesc = describeField(parsed.dow, 'day', 0, 7, v => DOW_NAMES[v % 7]);

    return `
    <div style="font-size: var(--text-lg); font-weight: var(--font-semibold); margin-bottom: var(--space-3);">
      ${buildSummary(parsed)}
    </div>
    <div style="color: var(--text-secondary); font-size: var(--text-sm);">
      <strong>Minute:</strong> ${minuteDesc}<br/>
      <strong>Hour:</strong> ${hourDesc}<br/>
      <strong>Day of month:</strong> ${domDesc}<br/>
      <strong>Month:</strong> ${monthDesc}<br/>
      <strong>Day of week:</strong> ${dowDesc}
    </div>`;
}

function buildSummary(p) {
    const allMin = p.minute.type === 'all';
    const allHr = p.hour.type === 'all';
    if (allMin && allHr) return 'Every minute';
    if (allMin && p.hour.values?.length) return `Every minute of hour(s) ${p.hour.values.join(', ')}`;
    if (p.minute.values?.length === 1 && p.hour.values?.length === 1)
        return `At ${p.hour.values[0].toString().padStart(2, '0')}:${p.minute.values[0].toString().padStart(2, '0')}`;
    return 'At selected times';
}

function describeField(field, noun, min, max, format) {
    if (field.type === 'all') return `every ${noun}`;
    const labels = field.values.map(format);
    if (labels.length > 5) return `${labels.length} selected values`;
    return labels.join(', ');
}

function buildBreakdown(parsed, fields) {
    const names = fields.length === 6 ? FIELD_NAMES_6 : FIELD_NAMES_5;
    return `
    <div style="font-size: var(--text-xs);">
      ${fields.map((f, i) => `
        <div style="display: flex; justify-content: space-between; padding: var(--space-1) 0; border-bottom: 1px solid var(--border-primary);">
          <span style="color: var(--text-tertiary); text-transform: capitalize;">${names[i]}</span>
          <span style="font-family: var(--font-mono); color: var(--accent-400);">${escapeHtml(f)}</span>
        </div>`).join('')}
    </div>`;
}

function formatDate(d) {
    return d.toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function relativeTime(d) {
    const diff = d - Date.now();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    return `in ${Math.floor(hrs / 24)}d`;
}

function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
