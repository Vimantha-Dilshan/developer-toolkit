/**
 * Settings Component
 * ==================
 * Wires the settings modal form to the settings service.
 *
 * @module components/settings
 */

import { themeService } from '../services/theme.service.js';
import { settingsService } from '../services/settings.service.js';

export function initSettings() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    // Theme select
    const themeEl = document.getElementById('setting-theme');
    themeEl?.addEventListener('change', e => {
        themeService.set(e.target.value);
        settingsService.set('theme', e.target.value);
    });

    // Font size
    document.getElementById('setting-font-size')?.addEventListener('change', e => {
        settingsService.set('fontSize', parseInt(e.target.value, 10));
    });

    // Tab size
    document.getElementById('setting-tab-size')?.addEventListener('change', e => {
        settingsService.set('tabSize', parseInt(e.target.value, 10));
    });

    // Word wrap
    document.getElementById('setting-word-wrap')?.addEventListener('change', e => {
        settingsService.set('wordWrap', e.target.checked);
    });

    // Animations
    document.getElementById('setting-animations')?.addEventListener('change', e => {
        settingsService.set('animations', e.target.checked);
    });

    // Auto-copy
    document.getElementById('setting-auto-copy')?.addEventListener('change', e => {
        settingsService.set('autoCopy', e.target.checked);
    });

    // History limit
    document.getElementById('setting-history-limit')?.addEventListener('change', e => {
        settingsService.set('historyLimit', parseInt(e.target.value, 10));
    });

    // Sync form state with current settings when modal opens
    modal.addEventListener('transitionend', () => {
        if (modal.style.display !== 'none') {
            syncFormToSettings();
        }
    });

    // Also sync on settings button click
    document.getElementById('settings-btn')?.addEventListener('click', syncFormToSettings);
}

function syncFormToSettings() {
    const s = settingsService.all;

    const set = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = val;
        else el.value = val;
    };

    set('setting-theme', s.theme);
    set('setting-font-size', s.fontSize);
    set('setting-tab-size', s.tabSize);
    set('setting-word-wrap', s.wordWrap);
    set('setting-animations', s.animations);
    set('setting-auto-copy', s.autoCopy);
    set('setting-history-limit', s.historyLimit);
}
