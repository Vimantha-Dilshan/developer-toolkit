/**
 * History Service
 * ===============
 * Tracks recently opened tools with localStorage persistence.
 *
 * @module services/history
 */

import { storageService } from './storage.service.js';
import { eventBus } from '../core/event-bus.js';
import { EVENTS, STORAGE_KEYS } from '../config/constants.js';
import { getToolById } from '../config/tools.js';
import { settingsService } from './settings.service.js';

class HistoryService {
    /** @type {Array<{toolId: string, timestamp: number}>} */
    #history = [];

    init() {
        const saved = storageService.get(STORAGE_KEYS.RECENT_TOOLS);
        this.#history = Array.isArray(saved) ? saved : [];

        // Listen for tool open events
        eventBus.on(EVENTS.TOOL_OPEN, ({ id }) => {
            if (id) this.#trackTool(id);
        });
    }

    /**
     * @param {string} toolId
     */
    #trackTool(toolId) {
        // Remove existing entry for this tool
        this.#history = this.#history.filter(e => e.toolId !== toolId);

        // Add to front
        this.#history.unshift({ toolId, timestamp: Date.now() });

        // Trim to limit
        const limit = settingsService.get('historyLimit', 10);
        if (this.#history.length > limit) {
            this.#history = this.#history.slice(0, limit);
        }

        this.#save();
        eventBus.emit(EVENTS.HISTORY_UPDATE, this.getRecent());
    }

    /**
     * Get recent tool definitions.
     * @param {number} [limit]
     * @returns {Array<{tool: Object, timestamp: number}>}
     */
    getRecent(limit) {
        const max = limit ?? settingsService.get('historyLimit', 10);
        return this.#history
            .slice(0, max)
            .map(e => ({ tool: getToolById(e.toolId), timestamp: e.timestamp }))
            .filter(e => e.tool);
    }

    /** Clear all history */
    clear() {
        this.#history = [];
        this.#save();
    }

    #save() {
        storageService.set(STORAGE_KEYS.RECENT_TOOLS, this.#history);
    }
}

export const historyService = new HistoryService();
