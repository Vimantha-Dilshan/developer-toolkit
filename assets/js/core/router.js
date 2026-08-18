/**
 * Client-Side Router
 * ==================
 * Hash-based SPA router with dynamic module loading and lifecycle hooks.
 *
 * @module core/router
 */

import { eventBus } from './event-bus.js';
import { EVENTS } from '../config/constants.js';
import { TOOLS, getToolById } from '../config/tools.js';

/**
 * @typedef {Object} Route
 * @property {string}   path     - Route pattern (e.g. '/' or '/tool/:id')
 * @property {Function} render   - Async render function called with params and container
 */

class Router {
    /** @type {Route[]} */
    #routes = [];

    /** @type {{ path: string, params: Object } | null} */
    #current = null;

    /** @type {HTMLElement} */
    #container = null;

    /** @type {AbortController | null} */
    #loadingController = null;

    /** @type {Map<string, Object>} Cache for loaded tool modules */
    #moduleCache = new Map();

    /**
     * Initialise the router.
     * @param {HTMLElement} container - DOM element to render pages into
     */
    init(container) {
        this.#container = container;
        this.#registerRoutes();
        window.addEventListener('hashchange', () => this.#resolve());
        this.#resolve();
    }

    /** Register all application routes */
    #registerRoutes() {
        this.#routes = [
            {
                path: '/',
                render: async (params, el) => {
                    const { renderHome } = await import('../components/home.component.js');
                    renderHome(el);
                },
            },
            {
                path: '/tool/:toolId',
                render: async (params, el) => {
                    await this.#loadTool(params.toolId, el);
                },
            },
        ];
    }

    /** Parse the current URL hash and render the matching route */
    async #resolve() {
        const rawHash = window.location.hash.slice(1) || '/';
        const path = rawHash.split('?')[0];

        // Cancel any in-flight navigation
        this.#loadingController?.abort();
        this.#loadingController = new AbortController();
        const signal = this.#loadingController.signal;

        for (const route of this.#routes) {
            const params = this.#match(route.path, path);
            if (params !== null) {

                const prevRoute = this.#current;
                this.#current = { path, params };

                eventBus.emit(EVENTS.ROUTE_BEFORE_CHANGE, { from: prevRoute, to: this.#current });

                this.#showLoading();

                try {
                    await route.render(params, this.#container, signal);
                    if (!signal.aborted) {
                        this.#updateSidebarActiveState(path, params);
                        this.#updateBreadcrumb(params);
                        eventBus.emit(EVENTS.ROUTE_CHANGE, this.#current);
                    }
                } catch (err) {
                    if (!signal.aborted) {
                        console.error('[Router] Render error:', err);
                        this.#renderError(err);
                    }
                } finally {
                    if (!signal.aborted) {
                        this.#hideLoading();
                    }
                }
                return;
            }
        }

        // 404 — navigate home
        this.navigate('/');
    }

    /**
     * Match a route pattern against a path and extract params.
     * @param {string} pattern - Route pattern (e.g. '/tool/:toolId')
     * @param {string} path    - Actual path
     * @returns {Object|null}  - Params object or null if no match
     */
    #match(pattern, path) {
        if (pattern === path) return {};

        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        if (patternParts.length !== pathParts.length) return null;

        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }
        return params;
    }

    /**
     * Dynamically load and mount a tool module.
     * @param {string}      toolId
     * @param {HTMLElement} container
     */
    async #loadTool(toolId, container) {
        const toolDef = getToolById(toolId);
        if (!toolDef) {
            this.#renderNotFound(toolId, container);
            return;
        }

        // Track in history
        eventBus.emit(EVENTS.TOOL_OPEN, toolDef);

        try {
            let toolModule = this.#moduleCache.get(toolId);
            if (!toolModule) {
                // toolDef.module paths use '../../tools/' (relative to tools.js in assets/js/config/).
                // Dynamic import() resolves relative to THIS file (assets/js/core/), which is one
                // directory deeper, so we need one extra '../' to reach the project root.
                const modulePath = toolDef.module.replace(/^\.\.\/\.\.\//, '../../../');
                toolModule = await import(modulePath);
                this.#moduleCache.set(toolId, toolModule);
            }

            container.innerHTML = '';
            if (typeof toolModule.mount === 'function') {
                await toolModule.mount(container);
            } else if (typeof toolModule.default?.mount === 'function') {
                await toolModule.default.mount(container);
            } else {
                throw new Error(`Tool "${toolId}" does not export a mount() function.`);
            }
        } catch (err) {
            console.error(`[Router] Failed to load tool "${toolId}":`, err);
            this.#renderLoadError(toolDef, container);
        }
    }

    /** Navigate to a path */
    navigate(path) {
        window.location.hash = path;
    }

    /** Get the current route info */
    get current() {
        return this.#current;
    }

    /** Show loading state */
    #showLoading() {
        const loading = document.getElementById('content-loading');
        if (loading) loading.style.display = 'block';
        if (this.#container) this.#container.style.visibility = 'hidden';
    }

    /** Hide loading state */
    #hideLoading() {
        const loading = document.getElementById('content-loading');
        if (loading) loading.style.display = 'none';
        if (this.#container) {
            this.#container.style.visibility = 'visible';
            // Trigger page enter animation
            this.#container.classList.remove('page-enter');
            void this.#container.offsetWidth; // reflow
            this.#container.classList.add('page-enter');
        }
    }

    /** Update sidebar active nav item */
    #updateSidebarActiveState(path, params) {
        const navItems = document.querySelectorAll('.nav-item[data-tool], .nav-item[data-route]');
        navItems.forEach(item => {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        });

        if (params.toolId) {
            const activeItem = document.querySelector(`[data-tool="${params.toolId}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
                activeItem.setAttribute('aria-current', 'page');
            }
        } else if (path === '/') {
            const homeItem = document.querySelector('[data-route="home"]');
            if (homeItem) {
                homeItem.classList.add('active');
                homeItem.setAttribute('aria-current', 'page');
            }
        }
    }

    /** Update the topbar breadcrumb */
    #updateBreadcrumb(params) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;

        if (params.toolId) {
            const toolDef = getToolById(params.toolId);
            breadcrumb.innerHTML = `
        <ol class="breadcrumb-list">
          <li class="breadcrumb-item">
            <a href="#/" class="breadcrumb-link">Home</a>
          </li>
          <li class="breadcrumb-item">
            <span>${toolDef ? toolDef.name : params.toolId}</span>
          </li>
        </ol>`;
        } else {
            breadcrumb.innerHTML = `
        <ol class="breadcrumb-list">
          <li class="breadcrumb-item">
            <span>Home</span>
          </li>
        </ol>`;
        }
    }

    /** Render a 404-style not found page */
    #renderNotFound(toolId, container) {
        container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="m4.9 4.9 14.2 14.2"/>
        </svg>
        <h2 class="empty-state-title">Tool not found</h2>
        <p class="empty-state-text">The tool "<strong>${toolId}</strong>" doesn't exist or hasn't been registered yet.</p>
        <a href="#/" class="btn btn-primary" style="margin-top: 1rem;">← Back to Home</a>
      </div>`;
    }

    /** Render a load error page */
    #renderLoadError(toolDef, container) {
        container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <h2 class="empty-state-title">Failed to load tool</h2>
        <p class="empty-state-text">There was a problem loading <strong>${toolDef.name}</strong>. Check your internet connection and try again.</p>
        <button class="btn btn-primary" style="margin-top: 1rem;" onclick="window.location.reload()">Reload</button>
      </div>`;
    }

    /** Render a generic error */
    #renderError(err) {
        if (!this.#container) return;
        this.#container.innerHTML = `
      <div class="empty-state">
        <h2 class="empty-state-title">Something went wrong</h2>
        <p class="empty-state-text" style="font-family: var(--font-mono); font-size: 0.75rem;">${err.message}</p>
        <button class="btn btn-secondary" style="margin-top: 1rem;" onclick="window.history.back()">Go Back</button>
      </div>`;
    }
}

/** Singleton Router instance */
export const router = new Router();
