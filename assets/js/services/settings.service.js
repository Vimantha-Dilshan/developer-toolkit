/**
 * Settings Service
 * ================
 * Manages application settings with persistence.
 *
 * @module services/settings
 */

import { storageService } from './storage.service.js';
import { eventBus } from '../core/event-bus.js';
import { EVENTS, STORAGE_KEYS } from '../config/constants.js';

const DEFAULT_SETTINGS = Object.freeze({
    theme: 'dark',
    animations: true,
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    autoCopy: false,
    historyLimit: 10,
    language: 'en',
});

class SettingsService {
    #settings = { ...DEFAULT_SETTINGS };

    init() {
        const saved = storageService.get(STORAGE_KEYS.SETTINGS);
        if (saved && typeof saved === 'object') {
            this.#settings = { ...DEFAULT_SETTINGS, ...saved };
        }
        this.#applySettings();
    }

    /** Get all settings */
    get all() {
        return { ...this.#settings };
    }

    /**
     * Get a specific setting value.
     * @param {string} key
     * @param {*}      [defaultValue]
     */
    get(key, defaultValue) {
        return this.#settings[key] ?? defaultValue ?? DEFAULT_SETTINGS[key];
    }

    /**
     * Update a setting.
     * @param {string} key
     * @param {*}      value
     */
    set(key, value) {
        this.#settings[key] = value;
        this.#save();
        this.#applySettings();
        eventBus.emit(EVENTS.SETTINGS_CHANGE, { key, value, settings: this.all });
    }

    /** Update multiple settings at once */
    update(updates) {
        Object.assign(this.#settings, updates);
        this.#save();
        this.#applySettings();
        eventBus.emit(EVENTS.SETTINGS_CHANGE, { settings: this.all });
    }

    /** Reset to defaults */
    reset() {
        this.#settings = { ...DEFAULT_SETTINGS };
        this.#save();
        this.#applySettings();
        eventBus.emit(EVENTS.SETTINGS_RESET);
    }

    #save() {
        storageService.set(STORAGE_KEYS.SETTINGS, this.#settings);
    }

    #applySettings() {
        // Animations
        if (!this.#settings.animations) {
            document.documentElement.classList.add('no-animations');
        } else {
            document.documentElement.classList.remove('no-animations');
        }

        // Update settings form UI if open
        const fontSizeEl = document.getElementById('setting-font-size');
        const tabSizeEl = document.getElementById('setting-tab-size');
        const wordWrapEl = document.getElementById('setting-word-wrap');
        const animEl = document.getElementById('setting-animations');
        const themeEl = document.getElementById('setting-theme');
        const autoCopyEl = document.getElementById('setting-auto-copy');
        const historyEl = document.getElementById('setting-history-limit');

        if (fontSizeEl) fontSizeEl.value = this.#settings.fontSize;
        if (tabSizeEl) tabSizeEl.value = this.#settings.tabSize;
        if (wordWrapEl) wordWrapEl.checked = this.#settings.wordWrap;
        if (animEl) animEl.checked = this.#settings.animations;
        if (themeEl) themeEl.value = this.#settings.theme;
        if (autoCopyEl) autoCopyEl.checked = this.#settings.autoCopy;
        if (historyEl) historyEl.value = this.#settings.historyLimit;
    }
}

export const settingsService = new SettingsService();
