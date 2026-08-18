/**
 * Debounce & Throttle Utilities
 * ==============================
 *
 * @module utils/debounce
 */

/**
 * Returns a debounced version of fn that delays invocation
 * until after `delay` ms have elapsed since the last call.
 *
 * @template {(...args: any[]) => any} T
 * @param {T}      fn
 * @param {number} delay  ms
 * @returns {T & { cancel(): void }}
 */
export function debounce(fn, delay) {
    let timer = null;
    const debounced = function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn.apply(this, args);
        }, delay);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
}

/**
 * Returns a throttled version of fn that fires at most once per `limit` ms.
 *
 * @template {(...args: any[]) => any} T
 * @param {T}      fn
 * @param {number} limit  ms
 * @returns {T}
 */
export function throttle(fn, limit) {
    let inThrottle = false;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, limit);
        }
    };
}

/**
 * Returns a function that is called at most once.
 * @template {(...args: any[]) => any} T
 * @param {T} fn
 * @returns {T}
 */
export function once(fn) {
    let called = false;
    let result;
    return function (...args) {
        if (!called) {
            called = true;
            result = fn.apply(this, args);
        }
        return result;
    };
}

/**
 * Schedule a function on the next animation frame.
 * Returns a cancel function.
 * @param {Function} fn
 * @returns {Function} cancel
 */
export function raf(fn) {
    const id = requestAnimationFrame(fn);
    return () => cancelAnimationFrame(id);
}
