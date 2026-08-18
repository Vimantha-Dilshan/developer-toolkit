/**
 * DOM Utilities
 * =============
 * Lightweight helpers for common DOM operations.
 *
 * @module utils/dom
 */

/**
 * Query a single element with type safety.
 * @template {HTMLElement} T
 * @param {string}            selector
 * @param {HTMLElement|Document} [context]
 * @returns {T|null}
 */
export function qs(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * Query all elements.
 * @param {string}               selector
 * @param {HTMLElement|Document} [context]
 * @returns {HTMLElement[]}
 */
export function qsa(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

/**
 * Create an element with attributes and children.
 * @param {string}   tag
 * @param {Object}   [attrs]
 * @param {...(Node|string)} [children]
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('data-')) el.setAttribute(k, v);
        else if (k in el) el[k] = v;
        else el.setAttribute(k, v);
    });
    children.forEach(child => {
        if (child instanceof Node) el.appendChild(child);
        else if (child != null) el.appendChild(document.createTextNode(String(child)));
    });
    return el;
}

/**
 * Remove all children from an element.
 * @param {HTMLElement} el
 */
export function clearElement(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
}

/**
 * Add event listener and return cleanup function.
 * @param {EventTarget}  target
 * @param {string}       type
 * @param {Function}     handler
 * @param {*}            [options]
 * @returns {Function} Cleanup function
 */
export function on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    return () => target.removeEventListener(type, handler, options);
}

/**
 * Set element visibility.
 * @param {HTMLElement} el
 * @param {boolean}     visible
 */
export function setVisible(el, visible) {
    if (!el) return;
    el.style.display = visible ? '' : 'none';
}

/**
 * Toggle a class on an element.
 * @param {HTMLElement} el
 * @param {string}      className
 * @param {boolean}     [force]
 */
export function toggleClass(el, className, force) {
    el?.classList.toggle(className, force);
}

/**
 * Escape HTML special characters.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Unescape HTML entities.
 * @param {string} str
 * @returns {string}
 */
export function unescapeHtml(str) {
    const doc = new DOMParser().parseFromString(str, 'text/html');
    return doc.documentElement.textContent ?? '';
}

/**
 * Scroll an element into view smoothly.
 * @param {HTMLElement} el
 */
export function scrollIntoView(el) {
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Check if an element is visible in the viewport.
 * @param {HTMLElement} el
 * @returns {boolean}
 */
export function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Get file text content via FileReader.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file, 'UTF-8');
    });
}

/**
 * Get file as data URL.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}
