/**
 * Keyboard Service
 * ================
 * Registers global keyboard shortcut handlers using the shortcut registry.
 *
 * @module services/keyboard
 */

import { KEYBOARD_SHORTCUTS } from '../config/keyboard-shortcuts.js';
import { router } from '../core/router.js';
import { themeService } from './theme.service.js';
import { commandPaletteService } from './command-palette.service.js';
import { APP_CONFIG } from '../config/app-config.js';

class KeyboardService {
    /** @type {Map<string, Function>} */
    #handlers = new Map();

    /** @type {string[]} Stores g-prefix sequence */
    #sequence = [];

    /** @type {number|null} Timeout for sequence reset */
    #seqTimer = null;

    init() {
        if (!APP_CONFIG.features.keyboardShortcuts) return;

        this.#buildHandlers();
        document.addEventListener('keydown', this.#handleKeyDown.bind(this));
    }

    /** Build action handlers */
    #buildHandlers() {
        this.#handlers.set('openCommandPalette', () => commandPaletteService.open());
        this.#handlers.set('showKeyboardHelp', () => {
            const modal = document.getElementById('keyboard-shortcuts-modal');
            if (modal) modal.style.display = 'flex';
        });
        this.#handlers.set('closeOverlay', () => {
            // Close any open overlay in order of priority
            const cpOverlay = document.getElementById('command-palette-overlay');
            if (cpOverlay?.style.display !== 'none') {
                commandPaletteService.close();
                return;
            }
            // Close topmost open modal
            const modals = document.querySelectorAll('.modal-overlay[style*="flex"]');
            if (modals.length) {
                modals[modals.length - 1].style.display = 'none';
                return;
            }
            // Close side panels
            const panels = document.querySelectorAll('.side-panel[style*="flex"]');
            panels.forEach(p => p.style.display = 'none');
        });
        this.#handlers.set('toggleTheme', () => themeService.toggle());
        this.#handlers.set('toggleSidebar', () => {
            document.getElementById('sidebar-collapse-btn')?.click();
        });
        this.#handlers.set('navigate', (route) => router.navigate(route));
    }

    /** @param {KeyboardEvent} e */
    #handleKeyDown(e) {
        // Skip if user is typing in an input, textarea, select, or contenteditable
        const tag = e.target.tagName.toLowerCase();
        const isEditable = ['input', 'textarea', 'select'].includes(tag) ||
            e.target.isContentEditable;

        // Build the key combo string
        const combo = this.#buildCombo(e);

        // Handle two-key sequences (e.g. "g h")
        if (this.#sequence.length > 0) {
            const seqCombo = `${this.#sequence.join(' ')} ${combo}`;
            const seqShortcut = KEYBOARD_SHORTCUTS.find(s =>
                (Array.isArray(s.keys) ? s.keys : [s.keys]).some(k => k.toLowerCase() === seqCombo.toLowerCase())
            );
            if (seqShortcut && !isEditable) {
                e.preventDefault();
                this.#dispatchShortcut(seqShortcut);
                this.#clearSequence();
                return;
            }
            this.#clearSequence();
        }

        // Single-key shortcuts that work even in inputs
        const globalShortcut = KEYBOARD_SHORTCUTS.find(s =>
            ['openCommandPalette', 'closeOverlay'].includes(s.action) &&
            (Array.isArray(s.keys) ? s.keys : [s.keys]).some(k => k.toLowerCase() === combo.toLowerCase())
        );

        if (globalShortcut) {
            e.preventDefault();
            this.#dispatchShortcut(globalShortcut);
            return;
        }

        // Skip remaining if in an input
        if (isEditable) return;

        // Match single key shortcut
        const shortcut = KEYBOARD_SHORTCUTS.find(s =>
            (Array.isArray(s.keys) ? s.keys : [s.keys]).some(k => k.toLowerCase() === combo.toLowerCase())
        );

        if (shortcut) {
            e.preventDefault();
            this.#dispatchShortcut(shortcut);
            return;
        }

        // Start a sequence if combo is "g"
        if (combo === 'g') {
            this.#sequence = ['g'];
            this.#seqTimer = setTimeout(() => this.#clearSequence(), 1500);
        }
    }

    #dispatchShortcut(shortcut) {
        const handler = this.#handlers.get(shortcut.action);
        if (handler) {
            handler(shortcut.route ?? shortcut);
        }
    }

    #buildCombo(e) {
        const parts = [];
        if (e.metaKey && e.key !== 'Meta') parts.push('meta');
        if (e.ctrlKey && e.key !== 'Control') parts.push('ctrl');
        if (e.altKey && e.key !== 'Alt') parts.push('alt');
        if (e.shiftKey && e.key !== 'Shift') parts.push('shift');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    }

    #clearSequence() {
        this.#sequence = [];
        clearTimeout(this.#seqTimer);
        this.#seqTimer = null;
    }
}

export const keyboardService = new KeyboardService();
