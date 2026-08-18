/**
 * Format Utilities
 * ================
 * String/number/byte formatting helpers.
 *
 * @module utils/format
 */

/**
 * Format bytes to human-readable string.
 * @param {number} bytes
 * @param {number} [decimals]
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format a number with thousands separators.
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
    return n.toLocaleString();
}

/**
 * Format a Unix timestamp as a relative time string.
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
}

/**
 * Format ms duration as a string.
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/**
 * Pad a number with leading zeros.
 * @param {number} n
 * @param {number} [length]
 * @returns {string}
 */
export function zeroPad(n, length = 2) {
    return String(n).padStart(length, '0');
}

/**
 * Format a date as ISO-like string.
 * @param {Date|number} date
 * @returns {string}
 */
export function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

/**
 * Count lines in a string.
 * @param {string} str
 * @returns {number}
 */
export function lineCount(str) {
    return str ? str.split('\n').length : 0;
}

/**
 * Count words in a string.
 * @param {string} str
 * @returns {number}
 */
export function wordCount(str) {
    return str ? str.trim().split(/\s+/).filter(Boolean).length : 0;
}

/**
 * Count characters (excluding whitespace).
 * @param {string} str
 * @returns {number}
 */
export function charCount(str) {
    return str ? str.replace(/\s/g, '').length : 0;
}

/**
 * Truncate string to maxLength and add ellipsis.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength = 100) {
    if (!str || str.length <= maxLength) return str;
    return `${str.slice(0, maxLength)}…`;
}
