/**
 * Favorites Service
 * =================
 * Manages user's favorite tools with localStorage persistence.
 *
 * @module services/favorites
 */

import { storageService } from './storage.service.js';
import { eventBus } from '../core/event-bus.js';
import { EVENTS, STORAGE_KEYS } from '../config/constants.js';
import { getToolById } from '../config/tools.js';
import { APP_CONFIG } from '../config/app-config.js';

class FavoritesService {
    /** @type {string[]} Array of tool IDs */
    #favorites = [];

    init() {
        const saved = storageService.get(STORAGE_KEYS.FAVORITES);
        this.#favorites = Array.isArray(saved) ? saved : [];
    }

    /**
     * Check if a tool is favorited.
     * @param {string} toolId
     */
    isFavorite(toolId) {
        return this.#favorites.includes(toolId);
    }

    /**
     * Toggle favorite status.
     * @param {string} toolId
     * @returns {boolean} New favorite state
     */
    toggle(toolId) {
        if (this.isFavorite(toolId)) {
            this.remove(toolId);
            return false;
        } else {
            this.add(toolId);
            return true;
        }
    }

    /**
     * Add to favorites.
     * @param {string} toolId
     */
    add(toolId) {
        if (this.isFavorite(toolId)) return;
        if (this.#favorites.length >= APP_CONFIG.maxFavoriteTools) {
            this.#favorites.shift(); // Remove oldest
        }
        this.#favorites.push(toolId);
        this.#save();
        eventBus.emit(EVENTS.FAVORITE_ADD, { toolId });
    }

    /**
     * Remove from favorites.
     * @param {string} toolId
     */
    remove(toolId) {
        this.#favorites = this.#favorites.filter(id => id !== toolId);
        this.#save();
        eventBus.emit(EVENTS.FAVORITE_REMOVE, { toolId });
    }

    /** Get all favorite tool definitions */
    getAll() {
        return this.#favorites
            .map(id => getToolById(id))
            .filter(Boolean);
    }

    /** Clear all favorites */
    clear() {
        this.#favorites = [];
        this.#save();
    }

    /** Get count of favorites */
    get count() {
        return this.#favorites.length;
    }

    /** Render the favorites side panel content */
    renderPanel(container) {
        if (!container) return;
        const tools = this.getAll();

        if (tools.length === 0) {
            container.innerHTML = `
        <div class="empty-state" style="padding: 3rem 1rem;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-disabled);" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <h3 class="empty-state-title">No favorites yet</h3>
          <p class="empty-state-text">Click the star icon on any tool to add it here.</p>
        </div>`;
            return;
        }

        container.innerHTML = tools.map(tool => `
      <a href="#/tool/${tool.id}" class="recent-item" data-tool-id="${tool.id}">
        <div class="recent-item-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="${tool.icon}"/>
          </svg>
        </div>
        <div class="recent-item-info">
          <div class="recent-item-name">${tool.name}</div>
          <div class="recent-item-time">${tool.category}</div>
        </div>
        <button class="copy-btn" data-remove-favorite="${tool.id}" aria-label="Remove ${tool.name} from favorites">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </a>`).join('');

        // Wire remove buttons
        container.querySelectorAll('[data-remove-favorite]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                this.remove(btn.dataset.removeFavorite);
                this.renderPanel(container);
            });
        });
    }

    #save() {
        storageService.set(STORAGE_KEYS.FAVORITES, this.#favorites);
    }
}

export const favoritesService = new FavoritesService();
