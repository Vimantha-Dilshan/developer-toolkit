/**
 * Navbar Component
 * ================
 * Initialises topbar behaviour — settings, theme toggle wiring, etc.
 * The HTML is already present in index.html.
 *
 * @module components/navbar
 */

import { themeService } from '../services/theme.service.js';
import { eventBus } from '../core/event-bus.js';
import { EVENTS } from '../config/constants.js';

export function initNavbar() {
    // Theme toggle is wired in app.js; listen for changes here to keep icons in sync
    eventBus.on(EVENTS.THEME_CHANGE, ({ theme }) => {
        const moonIcon = document.getElementById('icon-moon');
        const sunIcon = document.getElementById('icon-sun');
        if (moonIcon) moonIcon.style.display = theme === 'light' ? 'block' : 'none';
        if (sunIcon) sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
    });
}
