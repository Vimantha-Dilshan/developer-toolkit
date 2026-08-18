/**
 * Keyboard Shortcuts Configuration
 * ==================================
 * Central registry for all keyboard shortcuts.
 *
 * @module config/keyboard-shortcuts
 */

/**
 * @typedef {Object} ShortcutDefinition
 * @property {string}   id          - Unique identifier
 * @property {string}   label       - Human-readable label
 * @property {string[]} keys        - Key combination (e.g. ['meta', 'k'])
 * @property {string}   display     - Display string (e.g. '⌘K')
 * @property {string}   [category]  - Group category
 * @property {string}   [action]    - Action type for the handler
 * @property {string}   [toolId]    - Target tool ID (for navigation shortcuts)
 */

/** @type {ShortcutDefinition[]} */
export const KEYBOARD_SHORTCUTS = Object.freeze([

    // ─── Global ─────────────────────────────────────────────
    {
        id: 'command-palette',
        label: 'Open command palette',
        keys: ['meta+k', 'ctrl+k'],
        display: 'Ctrl+K',
        category: 'Global',
        action: 'openCommandPalette',
    },
    {
        id: 'keyboard-help',
        label: 'Show keyboard shortcuts',
        keys: ['?'],
        display: '?',
        category: 'Global',
        action: 'showKeyboardHelp',
    },
    {
        id: 'escape',
        label: 'Close modal / palette',
        keys: ['escape'],
        display: 'Esc',
        category: 'Global',
        action: 'closeOverlay',
    },
    {
        id: 'toggle-theme',
        label: 'Toggle dark / light theme',
        keys: ['t'],
        display: 'T',
        category: 'Global',
        action: 'toggleTheme',
    },
    {
        id: 'go-home',
        label: 'Go to Home',
        keys: ['g h'],
        display: 'G H',
        category: 'Navigation',
        action: 'navigate',
        route: '/',
    },
    {
        id: 'toggle-sidebar',
        label: 'Toggle sidebar',
        keys: ['meta+/', 'ctrl+/'],
        display: 'Ctrl+/',
        category: 'Global',
        action: 'toggleSidebar',
    },

    // ─── Tools ──────────────────────────────────────────────
    {
        id: 'open-json-formatter',
        label: 'Open JSON Formatter',
        keys: ['meta+shift+j', 'ctrl+shift+j'],
        display: 'Ctrl+Shift+J',
        category: 'Tools',
        action: 'navigate',
        route: '/tool/json-formatter',
    },
    {
        id: 'open-regex-tester',
        label: 'Open Regex Tester',
        keys: ['meta+shift+r', 'ctrl+shift+r'],
        display: 'Ctrl+Shift+R',
        category: 'Tools',
        action: 'navigate',
        route: '/tool/regex-tester',
    },
    {
        id: 'open-api-tester',
        label: 'Open API Tester',
        keys: ['meta+shift+a', 'ctrl+shift+a'],
        display: 'Ctrl+Shift+A',
        category: 'Tools',
        action: 'navigate',
        route: '/tool/api-tester',
    },
    {
        id: 'open-markdown-preview',
        label: 'Open Markdown Preview',
        keys: ['meta+shift+m', 'ctrl+shift+m'],
        display: 'Ctrl+Shift+M',
        category: 'Tools',
        action: 'navigate',
        route: '/tool/markdown-preview',
    },
    {
        id: 'open-sql-formatter',
        label: 'Open SQL Formatter',
        keys: ['meta+shift+s', 'ctrl+shift+s'],
        display: 'Ctrl+Shift+S',
        category: 'Tools',
        action: 'navigate',
        route: '/tool/sql-formatter',
    },
    {
        id: 'open-jwt-decoder',
        label: 'Open JWT Decoder',
        keys: ['meta+shift+d', 'ctrl+shift+d'],
        display: 'Ctrl+Shift+D',
        category: 'Tools',
        action: 'navigate',
        route: '/tool/jwt-decoder',
    },
    {
        id: 'open-uuid-generator',
        label: 'Open UUID Generator',
        keys: ['meta+shift+u', 'ctrl+shift+u'],
        display: 'Ctrl+Shift+U',
        category: 'Tools',
        action: 'navigate',
        route: '/tool/uuid-generator',
    },
]);

/**
 * Get shortcuts grouped by category.
 * @returns {Object.<string, ShortcutDefinition[]>}
 */
export function getShortcutsByCategory() {
    return KEYBOARD_SHORTCUTS.reduce((acc, shortcut) => {
        const cat = shortcut.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(shortcut);
        return acc;
    }, {});
}
