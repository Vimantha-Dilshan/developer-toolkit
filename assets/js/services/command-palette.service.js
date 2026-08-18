/**
 * Command Palette Service
 * =======================
 * Manages the ⌘K command palette overlay with fuzzy search and keyboard nav.
 *
 * @module services/command-palette
 */

import { TOOLS } from '../config/tools.js';
import { router } from '../core/router.js';

class CommandPaletteService {
    /** @type {HTMLElement|null} */
    #overlay = null;
    #input = null;
    #results = null;

    /** @type {number} Currently focused item index */
    #activeIndex = -1;

    /** @type {Array} Flattened list of all searchable items */
    #items = [];

    init() {
        this.#overlay = document.getElementById('command-palette-overlay');
        this.#input = document.getElementById('cp-input');
        this.#results = document.getElementById('cp-results');

        if (!this.#overlay) return;

        this.#buildItems();
        this.#bindEvents();
    }

    open(initialQuery = '') {
        if (!this.#overlay) return;
        this.#overlay.style.display = 'flex';
        if (this.#input) {
            this.#input.value = initialQuery;
            this.#input.focus();
        }
        this.#search(initialQuery);
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (!this.#overlay) return;
        this.#overlay.style.display = 'none';
        this.#activeIndex = -1;
        document.body.style.overflow = '';
    }

    /** Build the master item list from tools */
    #buildItems() {
        this.#items = TOOLS.map(tool => ({
            type: 'tool',
            id: tool.id,
            name: tool.name,
            description: tool.description,
            category: tool.category,
            keywords: tool.keywords,
            icon: tool.icon,
            action: () => router.navigate(`/tool/${tool.id}`),
        }));
    }

    #bindEvents() {
        // Close button
        document.getElementById('cp-close')?.addEventListener('click', () => this.close());

        // Backdrop click
        document.getElementById('cp-backdrop')?.addEventListener('click', () => this.close());

        // Input
        this.#input?.addEventListener('input', e => {
            this.#search(e.target.value);
        });

        // Keyboard navigation
        this.#input?.addEventListener('keydown', e => {
            const items = this.#results?.querySelectorAll('.cp-item') ?? [];

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.#activeIndex = Math.min(this.#activeIndex + 1, items.length - 1);
                this.#updateActive(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.#activeIndex = Math.max(this.#activeIndex - 1, 0);
                this.#updateActive(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const active = this.#results?.querySelector('.cp-item[data-selected="true"]');
                if (active) {
                    active.click();
                } else if (items[0]) {
                    items[0].click();
                }
            } else if (e.key === 'Escape') {
                this.close();
            }
        });
    }

    #search(query) {
        if (!this.#results) return;
        this.#activeIndex = -1;

        const q = query.trim().toLowerCase();
        const filtered = q
            ? this.#items.filter(item =>
                item.name.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                item.keywords.some(k => k.includes(q)) ||
                item.category.includes(q)
            )
            : this.#items;

        if (filtered.length === 0) {
            this.#results.innerHTML = `
        <div class="cp-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <p>No tools found for "<strong>${this.#escape(query)}</strong>"</p>
        </div>`;
            return;
        }

        // Group by category
        const groups = {};
        filtered.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });

        this.#results.innerHTML = Object.entries(groups).map(([cat, items]) => `
      <div class="cp-group">
        <div class="cp-group-label">${this.#escape(cat)}</div>
        ${items.map(item => `
          <button class="cp-item" role="option" data-id="${item.id}" aria-label="${this.#escape(item.name)}">
            <div class="cp-item-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="${item.icon}"/>
              </svg>
            </div>
            <div class="cp-item-content">
              <div class="cp-item-name">${this.#highlight(item.name, q)}</div>
              <div class="cp-item-desc">${this.#highlight(item.description, q)}</div>
            </div>
          </button>`).join('')}
      </div>`).join('');

        // Bind click handlers
        this.#results.querySelectorAll('.cp-item').forEach((el, i) => {
            const item = filtered.find(it => it.id === el.dataset.id);
            el.addEventListener('click', () => {
                if (item) {
                    item.action();
                    this.close();
                }
            });
        });
    }

    #updateActive(items) {
        items.forEach((el, i) => {
            el.dataset.selected = String(i === this.#activeIndex);
            el.setAttribute('aria-selected', String(i === this.#activeIndex));
        });
        if (items[this.#activeIndex]) {
            items[this.#activeIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    #highlight(text, query) {
        if (!query) return this.#escape(text);
        const escaped = this.#escape(text);
        const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return escaped.replace(new RegExp(escapedQ, 'gi'), m => `<mark>${m}</mark>`);
    }

    #escape(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

export const commandPaletteService = new CommandPaletteService();
