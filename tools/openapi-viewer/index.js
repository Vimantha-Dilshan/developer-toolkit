/**
 * OpenAPI Viewer Tool
 * ====================
 * Upload or paste a Swagger/OpenAPI JSON/YAML spec and render a readable,
 * interactive summary — endpoints grouped by tag, schemas, request/response examples.
 *
 * Renders without external SwaggerUI to keep it lightweight.
 *
 * @module tools/openapi-viewer
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { escapeHtml, readFileAsText } from '../../assets/js/utils/dom.utils.js';

export function mount(container) {
    // Load js-yaml if needed
    if (!window.jsyaml) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';
        script.onload = () => { container.innerHTML = buildUI(); bindEvents(container); };
        document.head.appendChild(script);
    } else {
        container.innerHTML = buildUI();
        bindEvents(container);
    }
}

// ─── UI ─────────────────────────────────────────────────────────

function buildUI() {
    return `
    <div class="tool-page" id="oapi-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">OpenAPI Viewer</h1>
            <p class="tool-description">Paste or upload a Swagger/OpenAPI 2.0, 3.0 or 3.1 spec to render a readable interactive reference.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-ghost btn-sm" id="oapi-sample-btn">Load Sample</button>
          <label class="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Spec
            <input type="file" id="oapi-file" accept=".json,.yaml,.yml" class="sr-only" aria-label="Upload OpenAPI spec" />
          </label>
        </div>
      </div>

      <!-- Input -->
      <div class="tool-panel" style="margin-bottom: var(--space-4);" id="oapi-input-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">Spec (JSON or YAML)</div>
          <div class="tool-panel-actions">
            <button class="btn btn-primary btn-sm" id="oapi-parse-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              Parse
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <textarea
            id="oapi-input"
            class="code-textarea"
            placeholder="Paste your OpenAPI / Swagger JSON or YAML here..."
            spellcheck="false"
            rows="12"
            aria-label="OpenAPI spec input"
          ></textarea>
          <div id="oapi-parse-error" style="display:none; margin: var(--space-2) var(--space-4);"></div>
        </div>
      </div>

      <!-- Rendered Spec -->
      <div id="oapi-output" style="display:none;">

        <!-- Header / info -->
        <div id="oapi-info-card" style="margin-bottom: var(--space-4);"></div>

        <!-- Search + filter -->
        <div class="tool-options-bar" style="margin-bottom: var(--space-3);">
          <input type="text" id="oapi-search" class="input input-sm" placeholder="Search endpoints..." aria-label="Search endpoints" style="max-width: 260px;" />
          <div id="oapi-method-filters" class="btn-group" style="flex-wrap: wrap;"></div>
          <button class="btn btn-ghost btn-sm" id="oapi-collapse-all" style="margin-left:auto;">Collapse all</button>
          <button class="btn btn-ghost btn-sm" id="oapi-expand-all">Expand all</button>
        </div>

        <!-- Endpoints -->
        <div id="oapi-endpoints"></div>

        <!-- Schemas -->
        <div id="oapi-schemas-section" style="margin-top: var(--space-6); display:none;">
          <h3 style="font-size: var(--text-lg); font-weight: var(--font-semibold); margin-bottom: var(--space-3);">Schemas / Models</h3>
          <div id="oapi-schemas"></div>
        </div>
      </div>

      <div id="oapi-empty" style="display:flex; align-items:center; justify-content:center; padding: var(--space-12); color: var(--text-tertiary); font-size: var(--text-sm);">
        Paste an OpenAPI spec above and click Parse
      </div>
    </div>

    <style>
      .oapi-tag-group { margin-bottom: var(--space-4); }
      .oapi-tag-header { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--surface-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-md); cursor: pointer; font-weight: var(--font-semibold); }
      .oapi-tag-header:hover { border-color: var(--border-hover); }
      .oapi-tag-body { border: 1px solid var(--border-primary); border-top: none; border-radius: 0 0 var(--radius-md) var(--radius-md); overflow: hidden; }
      .oapi-endpoint { border-bottom: 1px solid var(--border-primary); }
      .oapi-endpoint:last-child { border-bottom: none; }
      .oapi-endpoint-summary { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); cursor: pointer; transition: background 0.1s; }
      .oapi-endpoint-summary:hover { background: var(--surface-hover); }
      .oapi-endpoint-detail { padding: var(--space-4); background: var(--bg-primary); border-top: 1px solid var(--border-primary); display: none; }
      .oapi-endpoint-detail.open { display: block; }
      .method-badge { display: inline-block; padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 11px; font-weight: var(--font-bold); min-width: 64px; text-align: center; }
      .method-GET     { background: rgba(34,197,94,0.2);   color: #4ade80; }
      .method-POST    { background: rgba(59,130,246,0.2);  color: #60a5fa; }
      .method-PUT     { background: rgba(245,158,11,0.2);  color: #fbbf24; }
      .method-PATCH   { background: rgba(168,85,247,0.2);  color: #c084fc; }
      .method-DELETE  { background: rgba(239,68,68,0.2);   color: #f87171; }
      .method-HEAD    { background: rgba(107,114,128,0.2); color: #9ca3af; }
      .method-OPTIONS { background: rgba(107,114,128,0.2); color: #9ca3af; }
      .status-badge   { padding: 1px 6px; border-radius: var(--radius-sm); font-size: 10px; font-weight: var(--font-semibold); }
      .status-2xx { background: rgba(34,197,94,0.2); color: #4ade80; }
      .status-4xx { background: rgba(239,68,68,0.2); color: #f87171; }
      .status-5xx { background: rgba(245,158,11,0.2); color: #fbbf24; }
    </style>`;
}

// ─── Events ─────────────────────────────────────────────────────

function bindEvents(container) {
    container.querySelector('#oapi-parse-btn')?.addEventListener('click', () => parseSpec(container));

    container.querySelector('#oapi-sample-btn')?.addEventListener('click', () => {
        const el = container.querySelector('#oapi-input');
        if (el) { el.value = SAMPLE_SPEC; parseSpec(container); }
    });

    container.querySelector('#oapi-file')?.addEventListener('change', async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await readFileAsText(file).catch(() => null);
        if (text) {
            const el = container.querySelector('#oapi-input');
            if (el) el.value = text;
            parseSpec(container);
        }
    });

    container.querySelector('#oapi-search')?.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        container.querySelectorAll('.oapi-endpoint').forEach(row => {
            const path = row.dataset.path ?? '';
            const method = row.dataset.method ?? '';
            const summary = row.dataset.summary ?? '';
            const match = !q || [path, method, summary].some(s => s.toLowerCase().includes(q));
            row.style.display = match ? '' : 'none';
        });
    });

    container.querySelector('#oapi-collapse-all')?.addEventListener('click', () => {
        container.querySelectorAll('.oapi-endpoint-detail').forEach(d => d.classList.remove('open'));
    });
    container.querySelector('#oapi-expand-all')?.addEventListener('click', () => {
        container.querySelectorAll('.oapi-endpoint-detail').forEach(d => d.classList.add('open'));
    });

    // Delegate toggle clicks
    container.addEventListener('click', e => {
        const summary = e.target.closest('.oapi-endpoint-summary');
        if (summary) {
            const detail = summary.nextElementSibling;
            detail?.classList.toggle('open');
        }
        const tagHeader = e.target.closest('.oapi-tag-header');
        if (tagHeader) {
            const body = tagHeader.nextElementSibling;
            if (body) body.style.display = body.style.display === 'none' ? '' : 'none';
        }
    });
}

// ─── Parser ─────────────────────────────────────────────────────

function parseSpec(container) {
    const raw = container.querySelector('#oapi-input')?.value?.trim() ?? '';
    const errEl = container.querySelector('#oapi-parse-error');
    const output = container.querySelector('#oapi-output');
    const empty = container.querySelector('#oapi-empty');

    if (!raw) { toastService.warning('Paste a spec first'); return; }

    let spec;
    try {
        spec = raw.trimStart().startsWith('{') ? JSON.parse(raw) : window.jsyaml.load(raw);
    } catch (e) {
        if (errEl) { errEl.style.display = ''; errEl.innerHTML = `<div class="result-error">${escapeHtml(e.message)}</div>`; }
        return;
    }
    if (errEl) errEl.style.display = 'none';

    if (output) output.style.display = '';
    if (empty) empty.style.display = 'none';

    renderSpec(spec, container);
}

function renderSpec(spec, container) {
    const info = spec.info ?? {};
    const paths = spec.paths ?? {};
    const schemas = spec.components?.schemas ?? spec.definitions ?? {};
    const version = spec.openapi ?? spec.swagger ?? 'unknown';

    // Info card
    const infoCard = container.querySelector('#oapi-info-card');
    if (infoCard) {
        infoCard.innerHTML = `
      <div style="padding: var(--space-4); background: var(--surface-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-md);">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h2 style="font-size: var(--text-xl); font-weight: var(--font-bold); margin: 0 0 var(--space-1);">${escapeHtml(info.title ?? 'Untitled API')}</h2>
            <div style="display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap;">
              <span class="badge badge-primary" style="font-size: 10px;">v${escapeHtml(info.version ?? '?')}</span>
              <span class="badge" style="background: var(--surface-tertiary); font-size: 10px;">OpenAPI ${escapeHtml(version)}</span>
              ${info.license ? `<span style="font-size: var(--text-xs); color: var(--text-tertiary);">License: ${escapeHtml(info.license.name ?? '')}</span>` : ''}
            </div>
            ${info.description ? `<p style="margin: var(--space-2) 0 0; font-size: var(--text-sm); color: var(--text-secondary);">${escapeHtml(info.description.slice(0, 300))}${info.description.length > 300 ? '…' : ''}</p>` : ''}
          </div>
          <div style="text-align: right; font-size: var(--text-xs); color: var(--text-tertiary);">
            <div>${Object.keys(paths).length} paths</div>
            <div>${Object.values(paths).reduce((n, p) => n + Object.keys(p).filter(m => ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(m)).length, 0)} endpoints</div>
            <div>${Object.keys(schemas).length} schemas</div>
          </div>
        </div>
      </div>`;
    }

    // Group endpoints by tag
    const groups = {};
    for (const [path, pathObj] of Object.entries(paths)) {
        for (const [method, op] of Object.entries(pathObj)) {
            if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) continue;
            const tags = op.tags?.length ? op.tags : ['default'];
            for (const tag of tags) {
                if (!groups[tag]) groups[tag] = [];
                groups[tag].push({ path, method: method.toUpperCase(), op });
            }
        }
    }

    // Method filter buttons
    const allMethods = [...new Set(Object.values(groups).flat().map(e => e.method))].sort();
    const filterEl = container.querySelector('#oapi-method-filters');
    if (filterEl) {
        filterEl.innerHTML = allMethods.map(m => `<button class="btn btn-secondary btn-xs" data-mfilter="${m}" style="font-family:var(--font-mono); font-size:10px;">${m}</button>`).join('');
        filterEl.addEventListener('click', e => {
            const btn = e.target.closest('[data-mfilter]');
            if (!btn) return;
            const m = btn.dataset.mfilter;
            container.querySelectorAll('.oapi-endpoint').forEach(row => {
                row.style.display = (!m || row.dataset.method === m) ? '' : 'none';
            });
        });
    }

    // Render endpoint groups
    const endpointsEl = container.querySelector('#oapi-endpoints');
    if (!endpointsEl) return;
    endpointsEl.innerHTML = Object.entries(groups).map(([tag, endpoints]) => `
    <div class="oapi-tag-group">
      <div class="oapi-tag-header" role="button" aria-expanded="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        <span>${escapeHtml(tag)}</span>
        <span style="margin-left:auto; font-size:var(--text-xs); color:var(--text-tertiary); font-weight:normal;">${endpoints.length} endpoint${endpoints.length === 1 ? '' : 's'}</span>
      </div>
      <div class="oapi-tag-body">
        ${endpoints.map(({ path, method, op }) => renderEndpoint(path, method, op)).join('')}
      </div>
    </div>`).join('');

    // Schemas
    if (Object.keys(schemas).length) {
        const schemaSection = container.querySelector('#oapi-schemas-section');
        const schemasEl = container.querySelector('#oapi-schemas');
        if (schemaSection) schemaSection.style.display = '';
        if (schemasEl) {
            schemasEl.innerHTML = Object.entries(schemas).map(([name, schema]) => `
        <div style="margin-bottom: var(--space-3);">
          <div class="oapi-tag-header" role="button">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            <span style="font-family: var(--font-mono);">${escapeHtml(name)}</span>
            ${schema.type ? `<span class="badge" style="font-size:10px; background: var(--surface-tertiary);">${schema.type}</span>` : ''}
          </div>
          <div class="oapi-tag-body" style="display:none; padding: var(--space-3);">
            <pre style="margin:0; font-size: var(--text-xs);"><code class="language-json">${escapeHtml(JSON.stringify(schema, null, 2))}</code></pre>
          </div>
        </div>`).join('');
        }
    }

    // Highlight code blocks
    if (window.hljs) {
        container.querySelectorAll('pre code').forEach(el => window.hljs.highlightElement(el));
    }
}

function renderEndpoint(path, method, op) {
    const summary = op.summary ?? op.operationId ?? path;
    const deprecated = op.deprecated ? '<span class="badge" style="background:rgba(239,68,68,0.2);color:#f87171;font-size:10px;">deprecated</span>' : '';
    const params = op.parameters ?? [];
    const responses = op.responses ?? {};
    const requestBody = op.requestBody;

    const paramRows = params.map(p => `
    <tr>
      <td style="font-family:var(--font-mono); font-size: var(--text-xs);">${escapeHtml(p.name)}</td>
      <td style="font-size:var(--text-xs);">${p.in}</td>
      <td style="font-size:var(--text-xs);">${p.required ? '<strong>required</strong>' : 'optional'}</td>
      <td style="font-family:var(--font-mono); font-size: var(--text-xs); color: var(--accent-400);">${p.schema?.type ?? ''}</td>
      <td style="font-size:var(--text-xs); color: var(--text-secondary);">${escapeHtml(p.description ?? '')}</td>
    </tr>`).join('');

    const responseRows = Object.entries(responses).map(([code, resp]) => {
        const cls = code.startsWith('2') ? 'status-2xx' : code.startsWith('4') ? 'status-4xx' : code.startsWith('5') ? 'status-5xx' : '';
        return `<div style="display:flex; gap:var(--space-2); align-items:center; padding: var(--space-1) 0;">
      <span class="status-badge ${cls}">${escapeHtml(code)}</span>
      <span style="font-size:var(--text-xs); color:var(--text-secondary);">${escapeHtml(resp.description ?? '')}</span>
    </div>`;
    }).join('');

    return `
    <div class="oapi-endpoint" data-path="${escapeHtml(path)}" data-method="${method}" data-summary="${escapeHtml(summary)}">
      <div class="oapi-endpoint-summary" role="button">
        <span class="method-badge method-${method}">${method}</span>
        <span style="font-family: var(--font-mono); font-size: var(--text-sm);">${escapeHtml(path)}</span>
        <span style="font-size: var(--text-xs); color: var(--text-tertiary); margin-left: var(--space-2);">${escapeHtml(op.summary ?? '')}</span>
        ${deprecated}
      </div>
      <div class="oapi-endpoint-detail">
        ${op.description ? `<p style="font-size:var(--text-sm); color:var(--text-secondary); margin: 0 0 var(--space-3);">${escapeHtml(op.description)}</p>` : ''}
        ${params.length ? `
          <div style="margin-bottom: var(--space-3);">
            <div style="font-size:var(--text-xs); font-weight:var(--font-semibold); text-transform:uppercase; color:var(--text-tertiary); margin-bottom:var(--space-2);">Parameters</div>
            <table class="data-table" style="width:100%; font-size:var(--text-xs);"><thead><tr><th>Name</th><th>In</th><th>Required</th><th>Type</th><th>Description</th></tr></thead><tbody>${paramRows}</tbody></table>
          </div>` : ''}
        ${requestBody ? `
          <div style="margin-bottom: var(--space-3);">
            <div style="font-size:var(--text-xs); font-weight:var(--font-semibold); text-transform:uppercase; color:var(--text-tertiary); margin-bottom:var(--space-2);">Request Body</div>
            <pre style="font-size:var(--text-xs); background:var(--surface-secondary); padding:var(--space-3); border-radius:var(--radius-sm); overflow:auto; margin:0;"><code class="language-json">${escapeHtml(JSON.stringify(requestBody?.content ?? {}, null, 2))}</code></pre>
          </div>` : ''}
        ${Object.keys(responses).length ? `
          <div>
            <div style="font-size:var(--text-xs); font-weight:var(--font-semibold); text-transform:uppercase; color:var(--text-tertiary); margin-bottom:var(--space-2);">Responses</div>
            ${responseRows}
          </div>` : ''}
      </div>
    </div>`;
}

// ─── Sample Spec ────────────────────────────────────────────────

const SAMPLE_SPEC = `openapi: 3.0.3
info:
  title: Orion Developer Tools API
  version: 1.0.0
  description: Sample REST API specification for demonstration purposes.
  license:
    name: MIT

servers:
  - url: https://api.orion.dev/v1

tags:
  - name: users
    description: User management
  - name: tools
    description: Tool usage API

paths:
  /users:
    get:
      tags: [users]
      summary: List all users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
          description: Max results to return
        - name: page
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: User list
        '401':
          description: Unauthorized
    post:
      tags: [users]
      summary: Create a user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUser'
      responses:
        '201':
          description: User created
        '400':
          description: Validation error

  /users/{id}:
    get:
      tags: [users]
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: User found
        '404':
          description: Not found
    delete:
      tags: [users]
      summary: Delete user
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Deleted
        '404':
          description: Not found

  /tools:
    get:
      tags: [tools]
      summary: List available tools
      responses:
        '200':
          description: Tool list

components:
  schemas:
    CreateUser:
      type: object
      required: [name, email]
      properties:
        name:
          type: string
          example: Jane Doe
        email:
          type: string
          format: email
        role:
          type: string
          enum: [admin, user, viewer]
          default: user
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
        role:
          type: string
        createdAt:
          type: string
          format: date-time
`;
