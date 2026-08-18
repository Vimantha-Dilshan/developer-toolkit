/**
 * Theme Service
 * =============
 * Manages dark / light / system theme with persistence and smooth transitions.
 *
 * @module services/theme
 */

import { storageService } from './storage.service.js';
import { eventBus } from '../core/event-bus.js';
import { EVENTS, STORAGE_KEYS } from '../config/constants.js';
import { APP_CONFIG } from '../config/app-config.js';

class ThemeService {
    /** @type {'dark'|'light'|'system'} */
    #preference = APP_CONFIG.defaultTheme;

    /** @type {MediaQueryList} */
    #mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    init() {
        // Load saved preference
        const saved = storageService.get(STORAGE_KEYS.THEME);
        if (saved && ['dark', 'light', 'system'].includes(saved)) {
            this.#preference = saved;
        }

        // Apply initial theme
        this.#apply(this.#resolvedTheme);

        // Listen for system preference changes
        this.#mediaQuery.addEventListener('change', () => {
            if (this.#preference === 'system') {
                this.#apply(this.#resolvedTheme);
            }
        });
    }

    /** The user-selected preference ('dark' | 'light' | 'system') */
    get preference() {
        return this.#preference;
    }

    /** The currently active theme ('dark' | 'light') */
    get current() {
        return this.#resolvedTheme;
    }

    get #resolvedTheme() {
        if (this.#preference === 'system') {
            return this.#mediaQuery.matches ? 'dark' : 'light';
        }
        return this.#preference;
    }

    /**
     * Set the theme preference.
     * @param {'dark'|'light'|'system'} preference
     */
    set(preference) {
        if (!['dark', 'light', 'system'].includes(preference)) return;
        this.#preference = preference;
        storageService.set(STORAGE_KEYS.THEME, preference);
        this.#apply(this.#resolvedTheme);
    }

    /** Toggle between dark and light */
    toggle() {
        const next = this.#resolvedTheme === 'dark' ? 'light' : 'dark';
        this.set(next);
    }

    /** @param {'dark'|'light'} theme */
    #apply(theme) {
        const html = document.documentElement;
        html.classList.remove('dark', 'light');
        html.classList.add(theme);
        html.setAttribute('data-theme', theme);

        // Update meta theme-color
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = theme === 'dark' ? '#8b5cf6' : '#7c3aed';

        // Update Highlight.js stylesheet
        const hljsTheme = document.getElementById('hljs-theme');
        if (hljsTheme) {
            hljsTheme.href = theme === 'dark'
                ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css'
                : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css';
        }

        // Update theme toggle icons
        const moonIcon = document.getElementById('icon-moon');
        const sunIcon = document.getElementById('icon-sun');
        if (moonIcon) moonIcon.style.display = theme === 'light' ? 'block' : 'none';
        if (sunIcon) sunIcon.style.display = theme === 'dark' ? 'block' : 'none';

        eventBus.emit(EVENTS.THEME_CHANGE, { theme, preference: this.#preference });
    }
}

export const themeService = new ThemeService();
