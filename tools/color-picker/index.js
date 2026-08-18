/**
 * Color Picker Tool
 * =================
 * Visual color picker with HEX/RGB/HSL/HSV/CMYK conversion,
 * contrast checker, palette generator, and CSS variable export.
 *
 * @module tools/color-picker
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
    setColor('#8b5cf6', container); // default purple
}

function buildUI() {
    return `
    <div class="tool-page" id="color-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">Color Picker</h1>
            <p class="tool-description">Convert colors between HEX, RGB, HSL, HSV and CMYK. Check contrast ratios and generate palettes.</p>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 300px 1fr; gap: var(--space-4); align-items: start;" class="color-grid">

        <!-- Left: Picker -->
        <div style="display: flex; flex-direction: column; gap: var(--space-4);">

          <!-- Native picker + preview -->
          <div class="tool-panel">
            <div class="tool-panel-body" style="padding: var(--space-4);">
              <input type="color" id="color-native" value="#8b5cf6" style="width: 100%; height: 200px; border: none; padding: 0; cursor: pointer; background: none;" aria-label="Color picker" />
              <div id="color-preview-box" style="height: 64px; border-radius: var(--radius-md); margin-top: var(--space-2); transition: background 0.2s;"></div>
              <div style="display: flex; gap: var(--space-2); margin-top: var(--space-2);">
                <input type="text" id="color-hex-input" class="input input-mono" value="#8b5cf6" placeholder="#hex" maxlength="9" aria-label="HEX color value" style="flex:1;" />
                <button class="btn btn-primary btn-sm" id="color-hex-apply">Apply</button>
              </div>
            </div>
          </div>

          <!-- Contrast Checker -->
          <div class="tool-panel">
            <div class="tool-panel-header"><div class="tool-panel-title">Contrast Checker</div></div>
            <div class="tool-panel-body" style="padding: var(--space-4);">
              <div class="form-group">
                <label class="form-label" for="contrast-bg">Background color</label>
                <div style="display: flex; gap: var(--space-2); align-items: center;">
                  <input type="color" id="contrast-bg-picker" value="#ffffff" style="width: 36px; height: 36px; border: 1px solid var(--border-primary); border-radius: var(--radius-sm); padding: 2px; cursor:pointer;" aria-label="Background color picker" />
                  <input type="text" id="contrast-bg" class="input input-mono input-sm" value="#ffffff" aria-label="Background HEX" />
                </div>
              </div>
              <div id="contrast-result" style="margin-top: var(--space-3);"></div>
            </div>
          </div>
        </div>

        <!-- Right: Conversions + Palette -->
        <div style="display: flex; flex-direction: column; gap: var(--space-4);">

          <!-- Color values -->
          <div class="tool-panel">
            <div class="tool-panel-header"><div class="tool-panel-title">Color Values</div></div>
            <div class="tool-panel-body" style="padding: var(--space-4);">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);" id="color-values-grid">
                ${['HEX', 'RGB', 'HSL', 'HSV', 'CMYK'].map(fmt => `
                  <div>
                    <div style="font-size: var(--text-xs); color: var(--text-tertiary); margin-bottom: 4px;">${fmt}</div>
                    <div style="display: flex; gap: var(--space-2); align-items: center;">
                      <input type="text" id="color-val-${fmt.toLowerCase()}" class="input input-mono input-sm" readonly aria-label="${fmt} value" style="flex:1;" />
                      <button class="btn btn-ghost btn-xs color-copy-val" data-fmt="${fmt.toLowerCase()}" aria-label="Copy ${fmt}">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                    </div>
                  </div>`).join('')}
              </div>
            </div>
          </div>

          <!-- Shades Palette -->
          <div class="tool-panel">
            <div class="tool-panel-header">
              <div class="tool-panel-title">Shades & Tints</div>
              <div class="tool-panel-actions">
                <button class="copy-btn" id="color-copy-css-vars">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  CSS Variables
                </button>
              </div>
            </div>
            <div class="tool-panel-body" style="padding: var(--space-4);">
              <div id="color-palette" style="display: flex; gap: 4px; flex-wrap: wrap;"></div>
            </div>
          </div>

          <!-- Named colors lookup -->
          <div class="tool-panel">
            <div class="tool-panel-header"><div class="tool-panel-title">Named Color Lookup</div></div>
            <div class="tool-panel-body" style="padding: var(--space-4);">
              <div style="display: flex; gap: var(--space-2);">
                <input type="text" id="color-name-input" class="input" placeholder="Search color name (e.g. coral, steelblue)..." autocomplete="off" aria-label="Named color search" style="flex:1;" />
                <button class="btn btn-secondary btn-sm" id="color-name-search">Search</button>
              </div>
              <div id="color-name-results" style="margin-top: var(--space-3); display: flex; flex-wrap: wrap; gap: var(--space-2);"></div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <style>
      .color-swatch { width: 48px; height: 48px; border-radius: var(--radius-sm); cursor: pointer; border: 2px solid transparent; transition: transform 0.1s, border-color 0.1s; flex-shrink:0; }
      .color-swatch:hover { transform: scale(1.08); border-color: var(--text-primary); }
      @media (max-width: 640px) { .color-grid { grid-template-columns: 1fr !important; } }
    </style>`;
}

function bindEvents(container) {
    const nativePicker = container.querySelector('#color-native');
    const hexInput = container.querySelector('#color-hex-input');

    nativePicker?.addEventListener('input', e => setColor(e.target.value, container));
    nativePicker?.addEventListener('change', e => setColor(e.target.value, container));

    container.querySelector('#color-hex-apply')?.addEventListener('click', () => {
        const val = hexInput?.value?.trim();
        if (val && isValidHex(val)) setColor(val, container);
    });

    hexInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const val = hexInput?.value?.trim();
            if (val && isValidHex(val)) setColor(val, container);
        }
    });

    // Contrast checker
    const bgPicker = container.querySelector('#contrast-bg-picker');
    const bgInput = container.querySelector('#contrast-bg');
    const checkContrast = () => {
        const fg = hexInput?.value?.trim() ?? '#000';
        const bg = bgInput?.value?.trim() ?? '#fff';
        if (isValidHex(fg) && isValidHex(bg)) updateContrast(fg, bg, container);
    };

    bgPicker?.addEventListener('input', e => { if (bgInput) bgInput.value = e.target.value; checkContrast(); });
    bgInput?.addEventListener('input', debounce(e => { if (bgPicker) bgPicker.value = e.target.value; checkContrast(); }, 200));

    // Copy values
    container.querySelectorAll('.color-copy-val').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = container.querySelector(`#color-val-${btn.dataset.fmt}`)?.value;
            if (val) clipboardService.copyWithFeedback(val, btn);
        });
    });

    // Copy CSS vars
    container.querySelector('#color-copy-css-vars')?.addEventListener('click', () => {
        const swatches = [...container.querySelectorAll('.color-swatch')];
        const vars = swatches.map((s, i) => {
            const shade = SHADE_NAMES[i] ?? i * 100;
            return `  --color-${shade}: ${s.dataset.hex};`;
        }).join('\n');
        clipboardService.copyWithFeedback(`:root {\n${vars}\n}`, container.querySelector('#color-copy-css-vars'));
    });

    // Named color search
    container.querySelector('#color-name-search')?.addEventListener('click', () => searchNamedColors(container));
    container.querySelector('#color-name-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') searchNamedColors(container);
    });
}

const SHADE_NAMES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

function setColor(hex, container) {
    hex = normalizeHex(hex);
    if (!hex) return;

    // Update native picker
    const picker = container.querySelector('#color-native');
    if (picker) picker.value = hex;

    // Update hex input
    const hexInput = container.querySelector('#color-hex-input');
    if (hexInput) hexInput.value = hex;

    // Update preview
    const preview = container.querySelector('#color-preview-box');
    if (preview) preview.style.background = hex;

    // Convert to all formats
    const { r, g, b } = hexToRgb(hex);
    const hsl = rgbToHsl(r, g, b);
    const hsv = rgbToHsv(r, g, b);
    const cmyk = rgbToCmyk(r, g, b);

    const set = (id, val) => { const el = container.querySelector(id); if (el) el.value = val; };
    set('#color-val-hex', hex);
    set('#color-val-rgb', `rgb(${r}, ${g}, ${b})`);
    set('#color-val-hsl', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
    set('#color-val-hsv', `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`);
    set('#color-val-cmyk', `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`);

    // Palette
    renderPalette(hex, container);

    // Contrast check with current bg
    const bg = container.querySelector('#contrast-bg')?.value?.trim() ?? '#ffffff';
    if (isValidHex(bg)) updateContrast(hex, bg, container);
}

function renderPalette(baseHex, container) {
    const { r, g, b } = hexToRgb(baseHex);
    const { h, s } = rgbToHsl(r, g, b);

    const shades = SHADE_NAMES.map(shade => {
        const l = shade === 50 ? 97 : shade === 950 ? 8 : Math.round(95 - (shade / 1000) * 88);
        const hex2 = hslToHex(h, s, l);
        return { shade, hex: hex2 };
    });

    const palette = container.querySelector('#color-palette');
    if (!palette) return;

    palette.innerHTML = shades.map(({ shade, hex }) => `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
      <div
        class="color-swatch"
        style="background: ${hex};"
        data-hex="${hex}"
        title="${shade}: ${hex}"
        tabindex="0"
        role="button"
        aria-label="${shade}: ${hex}"
      ></div>
      <span style="font-size: 10px; color: var(--text-tertiary);">${shade}</span>
    </div>`).join('');

    palette.querySelectorAll('.color-swatch').forEach(sw => {
        sw.addEventListener('click', () => setColor(sw.dataset.hex, container));
        sw.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') setColor(sw.dataset.hex, container); });
    });
}

function updateContrast(fgHex, bgHex, container) {
    const fg = hexToRgb(fgHex);
    const bg = hexToRgb(bgHex);
    const fgL = relativeLuminance(fg.r, fg.g, fg.b);
    const bgL = relativeLuminance(bg.r, bg.g, bg.b);
    const ratio = (Math.max(fgL, bgL) + 0.05) / (Math.min(fgL, bgL) + 0.05);
    const aaSmall = ratio >= 4.5 ? '✓ Pass' : '✗ Fail';
    const aaLarge = ratio >= 3 ? '✓ Pass' : '✗ Fail';
    const aaaSmall = ratio >= 7 ? '✓ Pass' : '✗ Fail';

    const resultEl = container.querySelector('#contrast-result');
    if (!resultEl) return;

    resultEl.innerHTML = `
    <div style="background: ${bgHex}; color: ${fgHex}; padding: var(--space-3); border-radius: var(--radius-md); text-align:center; font-weight: var(--font-semibold); margin-bottom: var(--space-3);">
      Sample Text Preview
    </div>
    <div style="font-size: var(--text-xs); display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-2); text-align: center;">
      <div>
        <div style="font-weight: var(--font-semibold);">${ratio.toFixed(2)}:1</div>
        <div style="color: var(--text-tertiary);">Ratio</div>
      </div>
      <div>
        <div style="color: ${aaSmall.includes('✓') ? 'var(--color-success-text)' : 'var(--color-error-text)'}; font-weight: var(--font-semibold);">${aaSmall}</div>
        <div style="color: var(--text-tertiary);">AA Normal</div>
      </div>
      <div>
        <div style="color: ${aaLarge.includes('✓') ? 'var(--color-success-text)' : 'var(--color-error-text)'}; font-weight: var(--font-semibold);">${aaLarge}</div>
        <div style="color: var(--text-tertiary);">AA Large</div>
      </div>
    </div>`;
}

function searchNamedColors(container) {
    const query = container.querySelector('#color-name-input')?.value?.trim().toLowerCase() ?? '';
    if (!query) return;

    const matches = NAMED_COLORS.filter(([name]) => name.toLowerCase().includes(query)).slice(0, 20);
    const resultsEl = container.querySelector('#color-name-results');
    if (!resultsEl) return;

    if (!matches.length) {
        resultsEl.innerHTML = `<span style="font-size: var(--text-xs); color: var(--text-tertiary);">No colors found</span>`;
        return;
    }

    resultsEl.innerHTML = matches.map(([name, hex]) => `
    <div
      class="color-swatch"
      style="background: ${hex}; width: 40px; height: 40px;"
      data-hex="${hex}"
      title="${name}: ${hex}"
      tabindex="0"
      role="button"
      aria-label="${name} ${hex}"
    ></div>`).join('');

    resultsEl.querySelectorAll('.color-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
            setColor(sw.dataset.hex, container);
            const hexInput = container.querySelector('#color-hex-input');
            if (hexInput) hexInput.value = sw.dataset.hex;
        });
    });
}

// ─── Color Math ──────────────────────────────────────────────────

function normalizeHex(hex) {
    hex = hex.trim().replace(/^#+/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length === 6 || hex.length === 8) return `#${hex}`;
    return null;
}

function isValidHex(hex) { return /^#?[0-9a-fA-F]{3,8}$/.test(hex); }

function hexToRgb(hex) {
    hex = normalizeHex(hex) ?? '#000000';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => Math.round((l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))) * 255);
    return `#${[f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    let h = 0;
    if (max !== min) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(max * 100) };
}

function rgbToCmyk(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const k = 1 - Math.max(r, g, b);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    return {
        c: Math.round((1 - r - k) / (1 - k) * 100),
        m: Math.round((1 - g - k) / (1 - k) * 100),
        y: Math.round((1 - b - k) / (1 - k) * 100),
        k: Math.round(k * 100),
    };
}

function relativeLuminance(r, g, b) {
    const sRGB = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

// A small selection of CSS named colors
const NAMED_COLORS = [
    ['red', '#ff0000'], ['coral', '#ff7f50'], ['tomato', '#ff6347'], ['orangered', '#ff4500'],
    ['gold', '#ffd700'], ['orange', '#ffa500'], ['yellow', '#ffff00'],
    ['limegreen', '#32cd32'], ['green', '#008000'], ['teal', '#008080'],
    ['cyan', '#00ffff'], ['deepskyblue', '#00bfff'], ['steelblue', '#4682b4'],
    ['royalblue', '#4169e1'], ['blue', '#0000ff'], ['navy', '#000080'],
    ['purple', '#800080'], ['violet', '#ee82ee'], ['magenta', '#ff00ff'],
    ['hotpink', '#ff69b4'], ['deeppink', '#ff1493'], ['crimson', '#dc143c'],
    ['maroon', '#800000'], ['brown', '#a52a2a'], ['chocolate', '#d2691e'],
    ['peru', '#cd853f'], ['tan', '#d2b48c'], ['beige', '#f5f5dc'],
    ['ivory', '#fffff0'], ['white', '#ffffff'], ['silver', '#c0c0c0'],
    ['gray', '#808080'], ['dimgray', '#696969'], ['black', '#000000'],
    ['indigo', '#4b0082'], ['slateblue', '#6a5acd'], ['mediumpurple', '#9370db'],
    ['lavender', '#e6e6fa'], ['mintcream', '#f5fffa'], ['honeydew', '#f0fff0'],
];
