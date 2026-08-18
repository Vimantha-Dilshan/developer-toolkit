/**
 * QR Code Generator Tool
 * =======================
 * Generate QR codes from text, URLs, contacts (vCard), WiFi credentials, and more.
 * Uses the QRCode.js CDN library.
 *
 * @module tools/qr-generator
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { downloadService } from '../../assets/js/services/download.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { debounce } from '../../assets/js/utils/debounce.utils.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';

let _qrInstance = null;

export function mount(container) {
    loadQRLib(() => {
        container.innerHTML = buildUI();
        bindEvents(container);
        generateQR(container);
    });
}

export function unmount() {
    _qrInstance = null;
}

function loadQRLib(cb) {
    if (window.QRCode) { cb(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = cb;
    script.onerror = () => toastService.error('Failed to load QRCode library');
    document.head.appendChild(script);
}

function buildUI() {
    return `
    <div class="tool-page" id="qr-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3m0-3h3m-3 3v3"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">QR Code Generator</h1>
            <p class="tool-description">Generate QR codes from URLs, text, vCards, WiFi credentials and more. Download as PNG or SVG.</p>
          </div>
        </div>
      </div>

      <!-- Type Tabs -->
      <div class="tool-tabs" style="margin-bottom: var(--space-4);">
        <button class="tool-tab active" data-qrtab="text">Text / URL</button>
        <button class="tool-tab" data-qrtab="wifi">WiFi</button>
        <button class="tool-tab" data-qrtab="vcard">vCard</button>
        <button class="tool-tab" data-qrtab="email">Email</button>
        <button class="tool-tab" data-qrtab="sms">SMS</button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr auto; gap: var(--space-6); align-items: start;">

        <!-- Left: Input forms -->
        <div>
          <!-- Text / URL -->
          <div id="qr-text-form">
            <div class="form-group">
              <label class="form-label" for="qr-text-input">Text or URL</label>
              <textarea id="qr-text-input" class="textarea textarea-mono" rows="4" placeholder="https://example.com" spellcheck="false" autocomplete="off" aria-label="QR code text"></textarea>
            </div>
          </div>

          <!-- WiFi form -->
          <div id="qr-wifi-form" style="display:none;">
            <div class="form-group"><label class="form-label" for="qr-wifi-ssid">Network SSID</label><input type="text" id="qr-wifi-ssid" class="input" autocomplete="off" placeholder="MyNetwork" /></div>
            <div class="form-group"><label class="form-label" for="qr-wifi-pass">Password</label><input type="password" id="qr-wifi-pass" class="input" autocomplete="off" /></div>
            <div class="form-group">
              <label class="form-label" for="qr-wifi-enc">Encryption</label>
              <select class="select" id="qr-wifi-enc">
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </select>
            </div>
            <div class="form-group"><label class="checkbox-item"><input type="checkbox" id="qr-wifi-hidden" /><span class="checkbox-label">Hidden network</span></label></div>
          </div>

          <!-- vCard form -->
          <div id="qr-vcard-form" style="display:none;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
              <div class="form-group"><label class="form-label" for="qr-vc-name">Full Name</label><input type="text" id="qr-vc-name" class="input" autocomplete="off" /></div>
              <div class="form-group"><label class="form-label" for="qr-vc-org">Organization</label><input type="text" id="qr-vc-org" class="input" autocomplete="off" /></div>
              <div class="form-group"><label class="form-label" for="qr-vc-phone">Phone</label><input type="tel" id="qr-vc-phone" class="input" autocomplete="off" /></div>
              <div class="form-group"><label class="form-label" for="qr-vc-email">Email</label><input type="email" id="qr-vc-email" class="input" autocomplete="off" /></div>
              <div class="form-group" style="grid-column: span 2;"><label class="form-label" for="qr-vc-url">Website</label><input type="url" id="qr-vc-url" class="input input-mono" placeholder="https://" autocomplete="off" /></div>
            </div>
          </div>

          <!-- Email form -->
          <div id="qr-email-form" style="display:none;">
            <div class="form-group"><label class="form-label" for="qr-em-to">To</label><input type="email" id="qr-em-to" class="input" autocomplete="off" /></div>
            <div class="form-group"><label class="form-label" for="qr-em-subject">Subject</label><input type="text" id="qr-em-subject" class="input" autocomplete="off" /></div>
            <div class="form-group"><label class="form-label" for="qr-em-body">Body</label><textarea id="qr-em-body" class="textarea" rows="3" autocomplete="off"></textarea></div>
          </div>

          <!-- SMS form -->
          <div id="qr-sms-form" style="display:none;">
            <div class="form-group"><label class="form-label" for="qr-sms-to">Phone Number</label><input type="tel" id="qr-sms-to" class="input" autocomplete="off" /></div>
            <div class="form-group"><label class="form-label" for="qr-sms-body">Message</label><textarea id="qr-sms-body" class="textarea" rows="3" autocomplete="off"></textarea></div>
          </div>

          <!-- QR Options -->
          <div class="tool-panel" style="margin-top: var(--space-4);">
            <div class="tool-panel-header"><div class="tool-panel-title">QR Options</div></div>
            <div class="tool-panel-body" style="padding: var(--space-4);">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
                <div class="form-group">
                  <label class="form-label" for="qr-size">Size (px): <span id="qr-size-label">256</span></label>
                  <input type="range" id="qr-size" min="128" max="512" value="256" step="16" class="range-input" aria-label="QR code size" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="qr-error-level">Error correction</label>
                  <select class="select" id="qr-error-level">
                    <option value="L">Low (7%)</option>
                    <option value="M" selected>Medium (15%)</option>
                    <option value="Q">Quartile (25%)</option>
                    <option value="H">High (30%)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="qr-fg">Foreground color</label>
                  <input type="color" id="qr-fg" value="#000000" style="width:100%; height:36px; cursor:pointer; border: 1px solid var(--border-primary); border-radius: var(--radius-sm); padding: 2px;" aria-label="QR foreground color" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="qr-bg">Background color</label>
                  <input type="color" id="qr-bg" value="#ffffff" style="width:100%; height:36px; cursor:pointer; border: 1px solid var(--border-primary); border-radius: var(--radius-sm); padding: 2px;" aria-label="QR background color" />
                </div>
              </div>
              <button class="btn btn-primary" id="qr-generate-btn" style="width:100%; margin-top: var(--space-2);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Generate QR Code
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Preview -->
        <div style="text-align: center; min-width: 280px;">
          <div class="tool-panel">
            <div class="tool-panel-header"><div class="tool-panel-title">Preview</div></div>
            <div class="tool-panel-body" style="padding: var(--space-5); display: flex; flex-direction: column; align-items: center; gap: var(--space-4);">
              <div id="qr-canvas-wrap" style="background: #fff; padding: 16px; border-radius: var(--radius-md);"></div>
              <div id="qr-data-len" style="font-size: var(--text-xs); color: var(--text-tertiary);"></div>
              <div style="display: flex; gap: var(--space-2);">
                <button class="btn btn-primary btn-sm" id="qr-download-png">Download PNG</button>
                <button class="copy-btn" id="qr-copy-data-url" aria-label="Copy data URL">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Data URL
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .range-input { -webkit-appearance: none; width: 100%; height: 6px; border-radius: var(--radius-full); background: var(--surface-tertiary); outline: none; }
      .range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent-500); cursor: pointer; }
    </style>`;
}

function bindEvents(container) {
    let currentTab = 'text';

    container.querySelectorAll('[data-qrtab]').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('[data-qrtab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.qrtab;
            ['text', 'wifi', 'vcard', 'email', 'sms'].forEach(t => {
                const el = container.querySelector(`#qr-${t}-form`);
                if (el) el.style.display = t === currentTab ? '' : 'none';
            });
            generateQR(container);
        });
    });

    container.querySelector('#qr-generate-btn')?.addEventListener('click', () => generateQR(container));

    const auto = debounce(() => generateQR(container), 500);
    ['qr-text-input', 'qr-wifi-ssid', 'qr-wifi-pass', 'qr-wifi-enc', 'qr-vc-name', 'qr-vc-org', 'qr-vc-phone', 'qr-vc-email', 'qr-vc-url',
        'qr-em-to', 'qr-em-subject', 'qr-em-body', 'qr-sms-to', 'qr-sms-body'].forEach(id => {
            container.querySelector(`#${id}`)?.addEventListener('input', auto);
        });

    container.querySelector('#qr-size')?.addEventListener('input', e => {
        const label = container.querySelector('#qr-size-label');
        if (label) label.textContent = e.target.value;
        auto();
    });

    ['qr-error-level', 'qr-fg', 'qr-bg'].forEach(id => {
        container.querySelector(`#${id}`)?.addEventListener('change', auto);
    });

    container.querySelector('#qr-download-png')?.addEventListener('click', () => {
        const canvas = container.querySelector('#qr-canvas-wrap canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    });

    container.querySelector('#qr-copy-data-url')?.addEventListener('click', () => {
        const canvas = container.querySelector('#qr-canvas-wrap canvas');
        if (canvas) clipboardService.copyWithFeedback(canvas.toDataURL('image/png'), container.querySelector('#qr-copy-data-url'));
    });
}

function generateQR(container) {
    const wrap = container.querySelector('#qr-canvas-wrap');
    const dataLen = container.querySelector('#qr-data-len');
    if (!wrap || !window.QRCode) return;

    const size = parseInt(container.querySelector('#qr-size')?.value ?? '256', 10);
    const errLevel = container.querySelector('#qr-error-level')?.value ?? 'M';
    const fg = container.querySelector('#qr-fg')?.value ?? '#000000';
    const bg = container.querySelector('#qr-bg')?.value ?? '#ffffff';

    // Determine active form
    const activeTab = container.querySelector('[data-qrtab].active')?.dataset.qrtab ?? 'text';
    const data = buildQRData(container, activeTab);

    if (!data.trim()) {
        wrap.innerHTML = `<div style="width:${size}px; height:${size}px; display:flex; align-items:center; justify-content:center; color: var(--text-tertiary); font-size: var(--text-sm); background: #fff; border-radius: var(--radius-sm);">Enter data above</div>`;
        if (dataLen) dataLen.textContent = '';
        return;
    }

    try {
        wrap.innerHTML = '';
        new window.QRCode(wrap, {
            text: data,
            width: size,
            height: size,
            colorDark: fg,
            colorLight: bg,
            correctLevel: window.QRCode.CorrectLevel[errLevel] ?? window.QRCode.CorrectLevel.M,
        });

        if (dataLen) dataLen.textContent = `${data.length} characters encoded`;
    } catch (err) {
        wrap.innerHTML = `<div style="color: var(--color-error-text); font-size: var(--text-xs); padding: var(--space-4);">Error: ${escapeHtml(err.message)}</div>`;
    }
}

function buildQRData(container, tab) {
    switch (tab) {
        case 'text': return container.querySelector('#qr-text-input')?.value ?? '';
        case 'wifi': {
            const ssid = container.querySelector('#qr-wifi-ssid')?.value ?? '';
            const pass = container.querySelector('#qr-wifi-pass')?.value ?? '';
            const enc = container.querySelector('#qr-wifi-enc')?.value ?? 'WPA';
            const hidden = container.querySelector('#qr-wifi-hidden')?.checked ? 'H:true;' : '';
            return `WIFI:T:${enc};S:${ssid};P:${pass};${hidden};`;
        }
        case 'vcard': {
            const name = container.querySelector('#qr-vc-name')?.value ?? '';
            const org = container.querySelector('#qr-vc-org')?.value ?? '';
            const phone = container.querySelector('#qr-vc-phone')?.value ?? '';
            const email = container.querySelector('#qr-vc-email')?.value ?? '';
            const url = container.querySelector('#qr-vc-url')?.value ?? '';
            return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nORG:${org}\nTEL:${phone}\nEMAIL:${email}\nURL:${url}\nEND:VCARD`;
        }
        case 'email': {
            const to = container.querySelector('#qr-em-to')?.value ?? '';
            const subject = container.querySelector('#qr-em-subject')?.value ?? '';
            const body = container.querySelector('#qr-em-body')?.value ?? '';
            return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }
        case 'sms': {
            const to = container.querySelector('#qr-sms-to')?.value ?? '';
            const body = container.querySelector('#qr-sms-body')?.value ?? '';
            return `sms:${to}${body ? `?body=${encodeURIComponent(body)}` : ''}`;
        }
        default: return '';
    }
}
