/**
 * Application Bootstrap
 * =====================
 * Entry point — initialises all services and starts the router.
 *
 * @module core/app
 */

import { router } from './router.js';
import { eventBus } from './event-bus.js';
import { EVENTS } from '../config/constants.js';
import { APP_CONFIG } from '../config/app-config.js';

// Services
import { themeService } from '../services/theme.service.js';
import { storageService } from '../services/storage.service.js';
import { toastService } from '../services/toast.service.js';
import { settingsService } from '../services/settings.service.js';
import { favoritesService } from '../services/favorites.service.js';
import { historyService } from '../services/history.service.js';
import { keyboardService } from '../services/keyboard.service.js';
import { commandPaletteService } from '../services/command-palette.service.js';

// Components
import { initSidebar } from '../components/sidebar.component.js';
import { initNavbar } from '../components/navbar.component.js';
import { initSettings } from '../components/settings.component.js';

/**
 * Main application class.
 */
class App {
    #initialized = false;

    /**
     * Bootstrap the application.
     * Called once when the DOM is ready.
     */
    async init() {
        if (this.#initialized) return;
        this.#initialized = true;

        try {
            // 1. Initialise settings (must be first — controls other service behavior)
            settingsService.init();

            // 2. Apply saved theme immediately to prevent FOUC
            themeService.init();

            // 3. Initialise core services
            favoritesService.init();
            historyService.init();

            // 4. Render chrome (sidebar, navbar)
            initSidebar();
            initNavbar();
            initSettings();

            // 5. Initialise keyboard shortcuts
            keyboardService.init();

            // 6. Initialise command palette
            commandPaletteService.init();

            // 7. Initialise toast service
            toastService.init();

            // 8. Wire global UI event listeners
            this.#bindGlobalEvents();

            // 9. Start router (renders the first page)
            const contentEl = document.getElementById('tool-container');
            if (!contentEl) throw new Error('Missing #tool-container element in DOM');
            router.init(contentEl);

            // 10. Show the app and hide the loader
            await this.#revealApp();

            // 11. Register PWA install prompt
            this.#initPWA();

            // 12. Announce to analytics (disabled by default)
            if (APP_CONFIG.features.analytics) {
                this.#initAnalytics();
            }

            console.log(`%c ${APP_CONFIG.name} v${APP_CONFIG.version} `, 'background:#10b981;color:white;padding:2px 6px;border-radius:4px;font-weight:bold;');
        } catch (err) {
            console.error('[App] Initialisation failed:', err);
            this.#showFatalError(err);
        }
    }

    /** Reveal the main app and hide the loader with a smooth transition */
    async #revealApp() {
        return new Promise(resolve => {
            const loader = document.getElementById('app-loader');
            const app = document.getElementById('app');

            if (app) {
                app.style.opacity = '1';
                app.style.pointerEvents = 'auto';
                app.removeAttribute('aria-hidden');
            }

            if (loader) {
                loader.classList.add('hidden');
                setTimeout(() => {
                    loader.remove();
                    resolve();
                }, 300);
            } else {
                resolve();
            }
        });
    }

    /** Bind global UI event listeners */
    #bindGlobalEvents() {
        // Mobile sidebar toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        mobileMenuBtn?.addEventListener('click', () => {
            const isOpen = sidebar?.classList.contains('open');
            sidebar?.classList.toggle('open');
            sidebarOverlay?.classList.toggle('visible');
            mobileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
        });

        sidebarOverlay?.addEventListener('click', () => {
            sidebar?.classList.remove('open');
            sidebarOverlay.classList.remove('visible');
            mobileMenuBtn?.setAttribute('aria-expanded', 'false');
        });

        // Sidebar collapse (desktop)
        const collapseBtn = document.getElementById('sidebar-collapse-btn');
        collapseBtn?.addEventListener('click', () => {
            eventBus.emit(EVENTS.SIDEBAR_COLLAPSE);
        });

        // Settings modal
        const settingsBtn = document.getElementById('settings-btn');
        settingsBtn?.addEventListener('click', () => {
            const modal = document.getElementById('settings-modal');
            if (modal) modal.style.display = 'flex';
        });

        // About modal
        const aboutBtn = document.getElementById('about-btn');
        aboutBtn?.addEventListener('click', () => {
            const modal = document.getElementById('about-modal');
            if (modal) modal.style.display = 'flex';
            generateAboutHeatmap();
        });

        // Favorites panel
        const favoritesBtn = document.getElementById('favorites-btn');
        const favoritesPanel = document.getElementById('favorites-panel');
        const favoritesClose = document.getElementById('favorites-close');
        const favBackdrop = document.getElementById('favorites-backdrop');

        favoritesBtn?.addEventListener('click', () => {
            if (favoritesPanel) {
                favoritesPanel.style.display = 'flex';
                favoritesService.renderPanel(document.getElementById('favorites-list'));
            }
        });

        [favoritesClose, favBackdrop].forEach(el => {
            el?.addEventListener('click', () => {
                if (favoritesPanel) favoritesPanel.style.display = 'none';
            });
        });

        // Keyboard shortcuts modal
        const keyboardHelpBtn = document.getElementById('keyboard-help-btn');
        keyboardHelpBtn?.addEventListener('click', () => {
            const modal = document.getElementById('keyboard-shortcuts-modal');
            if (modal) modal.style.display = 'flex';
        });

        // Close any modal that contains [data-modal-close]
        document.addEventListener('click', e => {
            if (e.target.closest('[data-modal-close]')) {
                const modal = e.target.closest('.modal-overlay');
                if (modal) modal.style.display = 'none';
            }
            // Also close if clicking the backdrop
            if (e.target.classList.contains('modal-backdrop')) {
                const modal = e.target.closest('.modal-overlay');
                if (modal) modal.style.display = 'none';
            }
        });

        // Theme toggle (topbar)
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle?.addEventListener('click', () => themeService.toggle());

        // Search triggers → open command palette
        const searchTriggers = [
            document.getElementById('topbar-search-btn'),
            document.getElementById('sidebar-search-btn'),
        ];
        searchTriggers.forEach(btn => {
            btn?.addEventListener('click', () => commandPaletteService.open());
        });

        // Sidebar collapse persistence
        eventBus.on(EVENTS.SIDEBAR_COLLAPSE, () => {
            const sidebarEl = document.getElementById('sidebar');
            const mainEl = document.getElementById('main-wrapper');
            sidebarEl?.classList.toggle('collapsed');
            mainEl?.classList.toggle('sidebar-collapsed');
            const isNowCollapsed = sidebarEl?.classList.contains('collapsed');
            storageService.set('sidebar_collapsed', isNowCollapsed);

            // Flip button label so screen-reader / tooltip reflects new action
            const btn = document.getElementById('sidebar-collapse-btn');
            if (btn) {
                const label = isNowCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
                btn.setAttribute('aria-label', label);
                btn.setAttribute('title', label);
            }
        });

        // Restore sidebar state
        if (storageService.get('sidebar_collapsed') === true) {
            document.getElementById('sidebar')?.classList.add('collapsed');
            document.getElementById('main-wrapper')?.classList.add('sidebar-collapsed');
            const btn = document.getElementById('sidebar-collapse-btn');
            if (btn) { btn.setAttribute('aria-label', 'Expand sidebar'); btn.setAttribute('title', 'Expand sidebar'); }
        }

        // Handle EVENTS.ROUTE_CHANGE — close mobile sidebar, etc.
        eventBus.on(EVENTS.ROUTE_CHANGE, () => {
            sidebar?.classList.remove('open');
            sidebarOverlay?.classList.remove('visible');
            mobileMenuBtn?.setAttribute('aria-expanded', 'false');
            // Focus main content for accessibility
            document.getElementById('content-area')?.focus();
        });

        // Sidebar search
        document.getElementById('sidebar-search-btn')?.addEventListener('click', () => {
            commandPaletteService.open();
        });

        // Reset settings button
        document.getElementById('reset-settings-btn')?.addEventListener('click', () => {
            if (confirm('Reset all settings, favorites, and history? This cannot be undone.')) {
                settingsService.reset();
                favoritesService.clear();
                historyService.clear();
                toastService.success('Settings reset', 'All preferences have been cleared.');
                document.getElementById('settings-modal').style.display = 'none';
            }
        });
    }

    /** Initialise PWA install prompt */
    #initPWA() {
        if (!APP_CONFIG.features.pwaInstall) return;

        let deferredPrompt = null;
        const banner = document.getElementById('pwa-install-banner');

        window.addEventListener('beforeinstallprompt', e => {
            e.preventDefault();
            deferredPrompt = e;

            // Check if dismissed recently
            const dismissed = storageService.get('pwa_dismissed');
            if (dismissed) {
                const daysAgo = (Date.now() - dismissed) / 86400000;
                if (daysAgo < APP_CONFIG.pwaPromptCooldownDays) return;
            }

            if (banner) banner.style.display = 'flex';
        });

        document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            if (banner) banner.style.display = 'none';
            if (outcome === 'accepted') {
                toastService.success('App installed!', 'Orion has been added to your device.');
            }
        });

        document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
            if (banner) banner.style.display = 'none';
            storageService.set('pwa_dismissed', Date.now());
        });
    }

    /** Placeholder for analytics initialisation */
    #initAnalytics() {
        // Add analytics provider scripts here.
        // Example: Google Analytics, Plausible, Fathom, etc.
        console.log('[Analytics] Analytics placeholder — configure your provider in app.js');
    }

    /** Show a fatal error message when the app fails to initialise */
    #showFatalError(err) {
        document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;font-family:system-ui,sans-serif;background:#0a0a0b;color:#fafafa;">
        <div style="text-align:center;max-width:480px;">
          <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem;">Failed to start Orion</h1>
          <p style="color:#a1a1aa;margin-bottom:1rem;">${err.message}</p>
          <button onclick="location.reload()" style="padding:.5rem 1.5rem;background:#8b5cf6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;">Reload Page</button>
        </div>
      </div>`;
    }
}

/** Bootstrap on DOM ready */
const app = new App();

/**
 * Generate the fake GitHub contribution heatmap in the About modal.
 * Runs once — subsequent calls are no-ops (grid already populated).
 */
function generateAboutHeatmap() {
    const grid = document.getElementById('about-heatmap-grid');
    if (!grid || grid.childElementCount > 0) return;

    const WEEKS = 53;
    const today = new Date();

    // Align start to the nearest past Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - (WEEKS * 7 - 1));
    start.setDate(start.getDate() - start.getDay());

    let total = 0;
    let lastMonth = null;
    const monthMarkers = [];

    for (let w = 0; w < WEEKS; w++) {
        for (let d = 0; d < 7; d++) {
            const date = new Date(start);
            date.setDate(date.getDate() + w * 7 + d);

            const cell = document.createElement('span');

            if (date > today) {
                cell.className = 'hm-cell hm-future';
            } else {
                // Bias heavily toward level 3-4 for a very bright heatmap
                const r = Math.random();
                let lvl = r < 0.08 ? 0 : r < 0.18 ? 1 : r < 0.35 ? 2 : r < 0.62 ? 3 : 4;
                // Slight weekend reduction
                if (d === 0 || d === 6) lvl = Math.max(0, lvl - 1);

                cell.className = `hm-cell hm-${lvl}`;
                cell.title = `${date.toDateString()} · ${lvl === 0 ? 'No contributions' : `${lvl} contribution${lvl !== 1 ? 's' : ''}`}`;
                total += lvl;

                // Track first week of each new month for labels
                if (d === 0) {
                    const month = date.toLocaleString('default', { month: 'short' });
                    if (month !== lastMonth) {
                        monthMarkers.push({ col: w, label: month });
                        lastMonth = month;
                    }
                }
            }

            grid.appendChild(cell);
        }
    }

    // Render month labels
    const monthsEl = document.getElementById('about-heatmap-months');
    if (monthsEl) {
        monthMarkers.forEach(({ col, label }) => {
            const span = document.createElement('span');
            span.textContent = label;
            span.style.gridColumnStart = col + 1;
            monthsEl.appendChild(span);
        });
    }

    // Render total count
    const countEl = document.getElementById('about-heatmap-count');
    if (countEl) countEl.textContent = `${total.toLocaleString()} contributions in the last year`;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

export { app };
