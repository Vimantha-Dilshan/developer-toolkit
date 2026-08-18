/**
 * Storage Service
 * ===============
 * Abstraction over localStorage with JSON serialisation, error handling,
 * and namespace prefixing.
 *
 * @module services/storage
 */

import { APP_CONFIG } from '../config/app-config.js';

class StorageService {
    #prefix = APP_CONFIG.storagePrefix;

    /** @param {string} key */
    #prefixed(key) {
        return `${this.#prefix}${key}`;
    }

    /**
     * Store a value.
     * @param {string} key
     * @param {*}      value - Must be JSON-serialisable
     * @returns {boolean} Success
     */
    set(key, value) {
        try {
            localStorage.setItem(this.#prefixed(key), JSON.stringify(value));
            return true;
        } catch {
            console.warn('[Storage] Failed to set key:', key);
            return false;
        }
    }

    /**
     * Retrieve a value.
     * @param {string} key
     * @param {*}      [defaultValue]
     * @returns {*}
     */
    get(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(this.#prefixed(key));
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch {
            return defaultValue;
        }
    }

    /**
     * Remove a key.
     * @param {string} key
     */
    remove(key) {
        try {
            localStorage.removeItem(this.#prefixed(key));
        } catch {
            // silent
        }
    }

    /**
     * Check if a key exists.
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return localStorage.getItem(this.#prefixed(key)) !== null;
    }

    /**
     * Clear all keys under this app's prefix.
     */
    clearAll() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.#prefix));
        keys.forEach(k => localStorage.removeItem(k));
    }

    /**
     * Get all keys under the app prefix.
     * @returns {string[]}
     */
    keys() {
        return Object.keys(localStorage)
            .filter(k => k.startsWith(this.#prefix))
            .map(k => k.slice(this.#prefix.length));
    }
}

export const storageService = new StorageService();
