/**
 * Toast Notification Service
 * ==========================
 * Renders accessible, animated toast notifications.
 *
 * @module services/toast
 */

import { APP_CONFIG } from '../config/app-config.js';

class ToastService {
    /** @type {HTMLElement|null} */
    #container = null;

    init() {
        this.#container = document.getElementById('toast-container');
    }

    /**
     * Show a success toast.
     * @param {string} title
     * @param {string} [message]
     * @param {number} [duration]
     */
    success(title, message = '', duration = APP_CONFIG.toastDuration) {
        this.#show({ type: 'success', title, message, duration });
    }

    /**
     * Show an error toast.
     */
    error(title, message = '', duration = APP_CONFIG.toastDuration + 1500) {
        this.#show({ type: 'error', title, message, duration });
    }

    /**
     * Show a warning toast.
     */
    warning(title, message = '', duration = APP_CONFIG.toastDuration) {
        this.#show({ type: 'warning', title, message, duration });
    }

    /**
     * Show an info toast.
     */
    info(title, message = '', duration = APP_CONFIG.toastDuration) {
        this.#show({ type: 'info', title, message, duration });
    }

    /** @private */
    #show({ type, title, message, duration }) {
        if (!this.#container) {
            this.#container = document.getElementById('toast-container');
        }
        if (!this.#container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
      <div class="toast-icon" aria-hidden="true">${this.#icon(type)}</div>
      <div class="toast-content">
        <div class="toast-title">${this.#escape(title)}</div>
        ${message ? `<div class="toast-message">${this.#escape(message)}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Dismiss notification">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="toast-progress" style="animation-duration: ${duration}ms" aria-hidden="true"></div>
    `;

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.#dismiss(toast);
        });

        this.#container.appendChild(toast);

        // Auto-dismiss
        const timer = setTimeout(() => this.#dismiss(toast), duration);
        toast.dataset.timer = timer;

        // Limit max visible toasts to 5
        const toasts = this.#container.querySelectorAll('.toast');
        if (toasts.length > 5) {
            this.#dismiss(toasts[0]);
        }
    }

    /** @private */
    #dismiss(toast) {
        if (!toast || !toast.parentNode) return;
        clearTimeout(toast.dataset.timer);
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }

    /** @private */
    #icon(type) {
        const icons = {
            success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
            error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
        };
        return icons[type] || icons.info;
    }

    /** Escape HTML to prevent injection */
    #escape(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

export const toastService = new ToastService();
