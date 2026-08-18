/**
 * Application Configuration
 * =========================
 * Central configuration for the Orion application.
 * Modify these values to customise the application behaviour.
 *
 * @module config/app-config
 */

export const APP_CONFIG = Object.freeze({
    /** Application metadata */
    name: 'Orion',
    shortName: 'Orion',
    tagline: 'Navigate the Universe of Code',
    description: 'Orion is a modern, high-performance web application containing dozens of useful developer tools that work entirely inside the browser with no backend.',
    version: '1.0.0',
    author: 'Orion Contributors',
    license: 'MIT',

    /** URLs */
    githubUrl: 'https://github.com/Vimantha-Dilshan/developer-toolkit',
    docsUrl: 'https://github.com/Vimantha-Dilshan/developer-toolkit/wiki',
    issuesUrl: 'https://github.com/Vimantha-Dilshan/developer-toolkit/issues',

    /** Base path — change if deploying to a subpath on GitHub Pages */
    basePath: '',

    /** Default theme: 'dark' | 'light' | 'system' */
    defaultTheme: 'dark',

    /** Maximum number of recent tools to track */
    maxRecentTools: 10,

    /** Maximum number of favourite tools */
    maxFavoriteTools: 20,

    /** Enable/disable PWA install prompt */
    enablePWAPrompt: true,

    /** Days before showing PWA install prompt again after dismissal */
    pwaPromptCooldownDays: 7,

    /** Debounce delay (ms) for search and real-time processing */
    searchDebounceMs: 150,
    processingDebounceMs: 400,

    /** Toast default duration (ms) */
    toastDuration: 3500,

    /** Animation settings */
    animations: {
        enabled: true,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        pageTransitionMs: 200,
        toastAnimMs: 300,
        modalAnimMs: 200,
    },

    /** LocalStorage key prefix */
    storagePrefix: 'devtk_',

    /** Feature flags — see features.js */
    features: {
        commandPalette: true,
        keyboardShortcuts: true,
        favorites: true,
        recentTools: true,
        pwaInstall: true,
        analytics: false,
        aiFeatures: true,
    },
});
