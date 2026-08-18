/**
 * AI Commit Generator Tool
 * =========================
 * Generate conventional commit messages from a git diff using AI
 * (OpenAI, Claude, Gemini) or a local heuristic fallback.
 *
 * @module tools/ai-commit-generator
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { aiProviderService } from '../../assets/js/services/ai-provider.service.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
}

// ─── UI ─────────────────────────────────────────────────────────

function buildUI() {
    return `
    <div class="tool-page" id="commit-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">AI Commit Generator</h1>
            <p class="tool-description">Paste a <code>git diff</code> to generate a conventional commit message using AI or smart heuristics.</p>
          </div>
        </div>
      </div>

      <!-- AI Provider Config -->
      <div class="tool-panel" style="margin-bottom: var(--space-4);">
        <div class="tool-panel-header"><div class="tool-panel-title">AI Provider (optional)</div></div>
        <div class="tool-panel-body" style="padding: var(--space-4);">
          <div style="display: flex; gap: var(--space-3); align-items: flex-end; flex-wrap: wrap;">
            <div>
              <label class="form-label" for="commit-provider">Provider</label>
              <select class="select" id="commit-provider" aria-label="AI provider">
                <option value="local" selected>Local heuristics (no API key)</option>
                <option value="openai">OpenAI (GPT-3.5)</option>
                <option value="claude">Anthropic (Claude)</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>
            <div id="commit-key-wrap" style="flex: 1; display: none;">
              <label class="form-label" for="commit-api-key">API Key (session only, never stored)</label>
              <div style="display: flex; gap: var(--space-2);">
                <input type="password" id="commit-api-key" class="input input-mono" placeholder="sk-..." autocomplete="off" aria-label="API key" style="flex:1;" />
                <button class="btn btn-secondary btn-sm" id="commit-save-key">Set Key</button>
              </div>
              <div id="commit-key-status" style="font-size: var(--text-xs); margin-top: 4px; color: var(--text-tertiary);"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="tool-layout-split" style="min-height: 440px;">

        <!-- Left: diff input + options -->
        <div style="display: flex; flex-direction: column; gap: var(--space-4);">
          <div class="tool-panel" style="flex: 1;">
            <div class="tool-panel-header">
              <div class="tool-panel-title">Git Diff</div>
              <div class="tool-panel-actions">
                <button class="btn btn-ghost btn-xs" id="commit-sample-btn">Load Sample</button>
                <button class="btn btn-ghost btn-xs" id="commit-clear-btn">Clear</button>
              </div>
            </div>
            <div class="tool-panel-body">
              <textarea
                id="commit-diff"
                class="code-textarea"
                placeholder="Paste git diff output here...\n\nTip: Run 'git diff HEAD' or 'git diff --staged'"
                spellcheck="false"
                style="min-height: 300px;"
                aria-label="Git diff input"
              ></textarea>
            </div>
          </div>

          <!-- Options -->
          <div class="tool-panel">
            <div class="tool-panel-header"><div class="tool-panel-title">Options</div></div>
            <div class="tool-panel-body" style="padding: var(--space-4);">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
                <div class="form-group">
                  <label class="form-label" for="commit-type-hint">Type hint (optional)</label>
                  <select class="select" id="commit-type-hint" aria-label="Commit type hint">
                    <option value="">Auto-detect</option>
                    <option value="feat">feat — new feature</option>
                    <option value="fix">fix — bug fix</option>
                    <option value="docs">docs — documentation</option>
                    <option value="style">style — formatting</option>
                    <option value="refactor">refactor — code change</option>
                    <option value="test">test — tests</option>
                    <option value="chore">chore — maintenance</option>
                    <option value="perf">perf — performance</option>
                    <option value="ci">ci — CI/CD</option>
                    <option value="build">build — build system</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="commit-scope">Scope (optional)</label>
                  <input type="text" id="commit-scope" class="input" placeholder="e.g. auth, api, ui" autocomplete="off" aria-label="Commit scope" />
                </div>
              </div>
              <div style="display: flex; gap: var(--space-3); margin-top: var(--space-2);">
                <label class="checkbox-item">
                  <input type="checkbox" id="commit-breaking" />
                  <span class="checkbox-label">Breaking change</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" id="commit-body-include" checked />
                  <span class="checkbox-label">Include body</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" id="commit-emoji" />
                  <span class="checkbox-label">Add emoji</span>
                </label>
              </div>
              <div style="margin-top: var(--space-3);">
                <button class="btn btn-primary" id="commit-generate-btn" style="width: 100%;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  Generate Commit Message
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: output -->
        <div class="tool-panel">
          <div class="tool-panel-header">
            <div class="tool-panel-title">Generated Commit</div>
            <div class="tool-panel-actions">
              <button class="copy-btn" id="commit-copy-btn" aria-label="Copy commit message">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
            </div>
          </div>
          <div class="tool-panel-body" style="min-height: 300px; overflow: auto;">
            <div id="commit-output-placeholder" style="display:flex; align-items:center; justify-content:center; height:300px; color: var(--text-tertiary); font-size: var(--text-sm); flex-direction: column; gap: var(--space-3);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4" aria-hidden="true"><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/></svg>
              Generated commit message will appear here
            </div>
            <div id="commit-loading" style="display:none; align-items:center; justify-content:center; height:300px; flex-direction:column; gap:var(--space-3);">
              <div class="spinner" aria-label="Generating..."></div>
              <div style="color: var(--text-tertiary); font-size: var(--text-sm);" id="commit-loading-text">Generating...</div>
            </div>
            <div id="commit-output" style="display:none; padding: var(--space-4);">
              <pre id="commit-output-pre" style="background: var(--surface-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-md); padding: var(--space-4); margin: 0; font-family: var(--font-mono); font-size: var(--text-sm); white-space: pre-wrap; word-break: break-word; color: var(--text-primary);"></pre>

              <!-- Variations -->
              <div id="commit-variations" style="margin-top: var(--space-4);">
                <div style="font-size: var(--text-xs); font-weight: var(--font-semibold); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-2);">Alternative suggestions</div>
                <div id="commit-variations-list"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .spinner { width: 32px; height: 32px; border: 3px solid var(--border-primary); border-top-color: var(--accent-500); border-radius: 50%; animation: spin 0.8s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .commit-variation { padding: var(--space-2) var(--space-3); background: var(--surface-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--text-xs); cursor: pointer; margin-bottom: var(--space-2); transition: border-color 0.15s; }
      .commit-variation:hover { border-color: var(--accent-500); }
    </style>`;
}

// ─── Events ─────────────────────────────────────────────────────

function bindEvents(container) {
    let currentCommit = '';

    container.querySelector('#commit-provider')?.addEventListener('change', e => {
        const isLocal = e.target.value === 'local';
        container.querySelector('#commit-key-wrap').style.display = isLocal ? 'none' : '';
    });

    container.querySelector('#commit-save-key')?.addEventListener('click', () => {
        const provider = container.querySelector('#commit-provider')?.value;
        const key = container.querySelector('#commit-api-key')?.value?.trim();
        if (!key) { toastService.warning('Enter an API key first'); return; }
        aiProviderService.setKey(provider, key);
        container.querySelector('#commit-key-status').innerHTML = `<span style="color: var(--color-success-text);">✓ Key set for this session</span>`;
        toastService.success('API key set (session only)');
    });

    container.querySelector('#commit-generate-btn')?.addEventListener('click', () => generate(container, result => {
        currentCommit = result;
    }));

    container.querySelector('#commit-copy-btn')?.addEventListener('click', () => {
        if (currentCommit) clipboardService.copyWithFeedback(currentCommit, container.querySelector('#commit-copy-btn'));
    });

    container.querySelector('#commit-sample-btn')?.addEventListener('click', () => {
        const el = container.querySelector('#commit-diff');
        if (el) { el.value = SAMPLE_DIFF; }
    });

    container.querySelector('#commit-clear-btn')?.addEventListener('click', () => {
        const el = container.querySelector('#commit-diff');
        if (el) el.value = '';
        showPlaceholder(container);
        currentCommit = '';
    });

    // Click variation to set as main
    container.addEventListener('click', e => {
        const v = e.target.closest('.commit-variation');
        if (v) {
            const text = v.textContent?.trim();
            const pre = container.querySelector('#commit-output-pre');
            if (text && pre) { pre.textContent = text; currentCommit = text; }
        }
    });
}

// ─── Core Generate ──────────────────────────────────────────────

async function generate(container, onDone) {
    const diff = container.querySelector('#commit-diff')?.value?.trim() ?? '';
    const provider = container.querySelector('#commit-provider')?.value ?? 'local';
    const typeHint = container.querySelector('#commit-type-hint')?.value ?? '';
    const scope = container.querySelector('#commit-scope')?.value?.trim() ?? '';
    const breaking = container.querySelector('#commit-breaking')?.checked ?? false;
    const addBody = container.querySelector('#commit-body-include')?.checked ?? true;
    const addEmoji = container.querySelector('#commit-emoji')?.checked ?? false;

    if (!diff) { toastService.warning('Paste a git diff first'); return; }

    setLoading(container, true, 'Analysing diff…');

    try {
        const result = await aiProviderService.generateCommit({
            diff, provider, typeHint, scope, breaking, addBody, addEmoji,
        });

        showCommit(container, result.main, result.variations ?? []);
        onDone(result.main);
    } catch (err) {
        toastService.error('Generation failed', err.message);
        showPlaceholder(container);
    } finally {
        setLoading(container, false);
    }
}

function setLoading(container, on, text = 'Generating...') {
    container.querySelector('#commit-output-placeholder').style.display = on ? 'none' : 'flex';
    container.querySelector('#commit-loading').style.display = on ? 'flex' : 'none';
    container.querySelector('#commit-output').style.display = on ? 'none' : '';
    if (on) {
        const lt = container.querySelector('#commit-loading-text');
        if (lt) lt.textContent = text;
    }
}

function showPlaceholder(container) {
    container.querySelector('#commit-output-placeholder').style.display = 'flex';
    container.querySelector('#commit-loading').style.display = 'none';
    container.querySelector('#commit-output').style.display = 'none';
}

function showCommit(container, main, variations) {
    container.querySelector('#commit-output-placeholder').style.display = 'none';
    container.querySelector('#commit-loading').style.display = 'none';
    container.querySelector('#commit-output').style.display = '';

    const pre = container.querySelector('#commit-output-pre');
    if (pre) pre.textContent = main;

    const varList = container.querySelector('#commit-variations-list');
    if (varList) {
        varList.innerHTML = variations.map(v => `<div class="commit-variation" tabindex="0" role="button" title="Click to use this variation">${escapeHtml(v)}</div>`).join('');
    }

    container.querySelector('#commit-variations').style.display = variations.length ? '' : 'none';
}

const SAMPLE_DIFF = `diff --git a/src/auth/jwt.service.ts b/src/auth/jwt.service.ts
index 3a21b45..7f8c2d1 100644
--- a/src/auth/jwt.service.ts
+++ b/src/auth/jwt.service.ts
@@ -1,12 +1,21 @@
 import { Injectable } from '@nestjs/common';
 import { JwtService } from '@nestjs/jwt';
+import { ConfigService } from '@nestjs/config';
 
 @Injectable()
 export class AuthService {
-  constructor(private jwtService: JwtService) {}
+  constructor(
+    private jwtService: JwtService,
+    private configService: ConfigService,
+  ) {}
 
-  async generateToken(userId: string): Promise<string> {
-    return this.jwtService.sign({ sub: userId });
+  async generateToken(userId: string, role: string): Promise<string> {
+    const expiresIn = this.configService.get<string>('JWT_EXPIRY', '3600s');
+    return this.jwtService.sign(
+      { sub: userId, role },
+      { expiresIn },
+    );
   }
+
+  async validateToken(token: string) {
+    return this.jwtService.verify(token);
+  }
 }

diff --git a/src/auth/auth.guard.ts b/src/auth/auth.guard.ts
index 0000000..1a2b3c4 100644
--- /dev/null
+++ b/src/auth/auth.guard.ts
@@ -0,0 +1,18 @@
+import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
+import { AuthService } from './jwt.service';
+
+@Injectable()
+export class AuthGuard implements CanActivate {
+  constructor(private authService: AuthService) {}
+
+  async canActivate(context: ExecutionContext): Promise<boolean> {
+    const request = context.switchToHttp().getRequest();
+    const token = request.headers.authorization?.split(' ')[1];
+    if (!token) throw new UnauthorizedException();
+    try {
+      request.user = await this.authService.validateToken(token);
+      return true;
+    } catch {
+      throw new UnauthorizedException();
+    }
+  }
+}`;
