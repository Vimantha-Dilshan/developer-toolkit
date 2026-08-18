/**
 * Clipboard Service
 * =================
 * Cross-browser clipboard write with graceful fallback.
 *
 * @module services/clipboard
 */

import { toastService } from './toast.service.js';

class ClipboardService {
    /**
     * Copy text to clipboard.
     * @param {string}  text
     * @param {string}  [successMsg]
     * @returns {Promise<boolean>}
     */
    async copy(text, successMsg = 'Copied to clipboard') {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                this.#fallbackCopy(text);
            }
            toastService.success(successMsg, '', 2000);
            return true;
        } catch {
            toastService.error('Copy failed', 'Could not access clipboard. Try Ctrl+C.');
            return false;
        }
    }

    /**
     * Copy text with visual feedback on a button element.
     * @param {string}      text
     * @param {HTMLElement} btn  - Button to show feedback on
     * @param {string}      [msg]
     */
    async copyWithFeedback(text, btn, msg = 'Copied!') {
        const success = await this.copy(text, '');
        if (success && btn) {
            const original = btn.innerHTML;
            btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        ${msg}`;
            btn.classList.add('copied');
            setTimeout(() => {
                btn.innerHTML = original;
                btn.classList.remove('copied');
            }, 2000);
        }
    }

    /** textarea-based fallback for non-secure contexts */
    #fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
    }
}

export const clipboardService = new ClipboardService();
