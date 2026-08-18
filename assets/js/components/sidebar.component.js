/**
 * Sidebar Component
 * =================
 * Initialises sidebar behaviour — active states, collapse, tooltips.
 *
 * @module components/sidebar
 */

import { eventBus } from '../core/event-bus.js';
import { EVENTS } from '../config/constants.js';

/**
 * Initialise sidebar behaviour.
 * The sidebar HTML is already in the DOM (index.html).
 * This function adds the interactive behaviour layer.
 */
export function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Listen for route changes to update active nav item
    // (also handled by router, but re-enforced here)
    eventBus.on(EVENTS.ROUTE_CHANGE, ({ path, params }) => {
        updateActiveNavItem(path, params);
    });
}

/**
 * Mark the correct nav item as active.
 * @param {string} path
 * @param {Object} params
 */
function updateActiveNavItem(path, params) {
    const all = document.querySelectorAll('.nav-item');
    all.forEach(item => {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
    });

    if (params?.toolId) {
        const match = document.querySelector(`[data-tool="${params.toolId}"]`);
        if (match) {
            match.classList.add('active');
            match.setAttribute('aria-current', 'page');
            // Ensure it's visible in the scroll
            match.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    } else {
        const homeItem = document.querySelector('[data-route="home"]');
        if (homeItem) {
            homeItem.classList.add('active');
            homeItem.setAttribute('aria-current', 'page');
        }
    }
}
