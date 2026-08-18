/**
 * Home Component
 * ==============
 * Renders the home/landing page with hero, search, categories, and tool grid.
 *
 * @module components/home
 */

import { TOOLS, TOOL_CATEGORIES, getToolsByCategory } from '../config/tools.js';
import { favoritesService } from '../services/favorites.service.js';
import { historyService } from '../services/history.service.js';
import { commandPaletteService } from '../services/command-palette.service.js';
import { router } from '../core/router.js';
import { eventBus } from '../core/event-bus.js';
import { EVENTS } from '../config/constants.js';
import { formatRelativeTime } from '../utils/format.utils.js';
import { escapeHtml } from '../utils/dom.utils.js';

/** @type {string} Currently active category filter */
let activeCategory = 'all';

/**
 * Render the home page into the container element.
 * @param {HTMLElement} container
 */
export function renderHome(container) {
  container.innerHTML = buildHomeHTML();
  bindHomeEvents(container);
  renderToolsGrid(container, activeCategory);
}

/** Build the complete home page HTML */
function buildHomeHTML() {
  const recent = historyService.getRecent(6);
  const favorites = favoritesService.getAll();
  const featured = TOOLS.filter(t => t.featured).slice(0, 8);

  return `
    <div class="home-content animate-fade-in" id="home-root">

      <!-- ── Hero ─────────────────────────────────────── -->
      <section class="home-hero" aria-labelledby="hero-title">

        <!-- Star field layer B (layer A is ::after, these two twinkle out of phase) -->
        <div class="hero-star-layer" aria-hidden="true"></div>

        <!-- All hero content sits above the star layers -->
        <div class="hero-inner">

        <div class="hero-badge" aria-hidden="true">
          <span class="hero-badge-dot"></span>
          Orion &middot; ${TOOLS.length}+ Developer Tools &middot; No Backend Required
        </div>

        <h1 id="hero-title" class="hero-title">
          Navigate the Universe<br>
          <span class="gradient-text">of Code</span>
        </h1>

        <p class="hero-subtitle">
          Your all-in-one developer toolkit for formatting, validating,
          generating, and testing &mdash; entirely in your browser.
          Fast, private, and works offline.
        </p>

        <!-- Big Search Bar -->
        <div class="hero-search-wrap">
          <button class="hero-search-box" id="hero-search-btn" aria-label="Search developer tools — press Ctrl+K or Cmd+K">
            <svg class="hero-search-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span class="hero-search-placeholder">Search ${TOOLS.length}+ developer tools...</span>
            <kbd class="hero-search-kbd">Ctrl+K</kbd>
          </button>
          <div class="hero-popular-tags" aria-label="Popular tools">
            <span class="hero-popular-label">Popular:</span>
            ${featured.slice(0, 5).map(t =>
    `<a href="#/tool/${t.id}" class="hero-popular-tag">${escapeHtml(t.name)}</a>`
  ).join('')}
          </div>
        </div>

        <!-- Stats row -->
        <div class="hero-stats" aria-label="Statistics">
          <div class="hero-stat">
            <div class="hero-stat-value">${TOOLS.length}+</div>
            <div class="hero-stat-label">Developer Tools</div>
          </div>
          <div class="hero-stat-divider" aria-hidden="true"></div>
          <div class="hero-stat">
            <div class="hero-stat-value">100%</div>
            <div class="hero-stat-label">Browser-Based</div>
          </div>
          <div class="hero-stat-divider" aria-hidden="true"></div>
          <div class="hero-stat">
            <div class="hero-stat-value">0</div>
            <div class="hero-stat-label">Backend Required</div>
          </div>
          <div class="hero-stat-divider" aria-hidden="true"></div>
          <div class="hero-stat">
            <div class="hero-stat-value">PWA</div>
            <div class="hero-stat-label">Works Offline</div>
          </div>
        </div>

        </div> <!-- /.hero-inner -->

      </section>

      <!-- ── Main Content ──────────────────────────────── -->
      <div class="home-main-content">

        ${buildFeaturedSection(featured)}

        ${recent.length > 0 ? buildRecentSection(recent) : ''}
        ${favorites.length > 0 ? buildFavoritesSection(favorites) : ''}

        <!-- All Tools -->
        <section class="home-section" aria-labelledby="all-tools-title">
          <div class="section-header">
            <div>
              <h2 id="all-tools-title" class="section-title">All Tools</h2>
              <p class="section-subtitle">Browse by category or search above</p>
            </div>
          </div>

          <div class="category-filter" role="tablist" aria-label="Filter tools by category" id="category-filter">
            <button class="category-btn active" data-category="all" role="tab" aria-selected="true">
              All
              <span class="category-btn-count">${TOOLS.length}</span>
            </button>
            ${Object.values(TOOL_CATEGORIES).map(cat => {
    const count = TOOLS.filter(t => t.category === cat.id).length;
    return `
              <button class="category-btn" data-category="${cat.id}" role="tab" aria-selected="false">
                ${cat.label}
                <span class="category-btn-count">${count}</span>
              </button>`;
  }).join('')}
          </div>

          <div id="tools-grid" class="tools-grid stagger-children" role="tabpanel" aria-label="Tools list">
            <!-- Rendered by JS -->
          </div>
        </section>

        ${buildFeaturesSection()}

        ${buildFooter()}

      </div>
    </div>`;
}

/** Build the featured tools strip */
function buildFeaturedSection(featured) {
  return `
    <section class="home-section" aria-labelledby="featured-title">
      <div class="section-header">
        <div>
          <h2 id="featured-title" class="section-title">Featured Tools</h2>
          <p class="section-subtitle">Most popular — jump right in</p>
        </div>
      </div>
      <div class="featured-tools-grid">
        ${featured.map(tool => `
          <a href="#/tool/${tool.id}" class="featured-tool-card" aria-label="Open ${escapeHtml(tool.name)}">
            <div class="featured-tool-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="${tool.icon}"/>
              </svg>
            </div>
            <div class="featured-tool-body">
              <span class="featured-tool-name">${escapeHtml(tool.name)}</span>
              <span class="featured-tool-desc">${escapeHtml(tool.description)}</span>
            </div>
            <svg class="featured-tool-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>`).join('')}
      </div>
    </section>`;
}

/** Build the recent tools section */
function buildRecentSection(recent) {
  return `
    <section class="home-section" aria-labelledby="recent-title">
      <div class="section-header">
        <div>
          <h2 id="recent-title" class="section-title">Recently Used</h2>
        </div>
      </div>
      <div class="quick-access-row">
        ${recent.map(({ tool, timestamp }) => `
          <a href="#/tool/${tool.id}" class="quick-access-item" aria-label="Open ${tool.name}">
            <div class="quick-access-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="${tool.icon}"/>
              </svg>
            </div>
            <span class="quick-access-name">${escapeHtml(tool.name)}</span>
          </a>`).join('')}
      </div>
    </section>`;
}

/** Build the favorites section */
function buildFavoritesSection(favorites) {
  return `
    <section class="home-section" aria-labelledby="favorites-title">
      <div class="section-header">
        <div>
          <h2 id="favorites-title" class="section-title">Favorites</h2>
        </div>
        <a href="#" id="manage-favorites-link" class="section-action" aria-label="Manage favorites">Manage →</a>
      </div>
      <div class="quick-access-row">
        ${favorites.map(tool => `
          <a href="#/tool/${tool.id}" class="quick-access-item" aria-label="Open ${tool.name}">
            <div class="quick-access-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="${tool.icon}"/>
              </svg>
            </div>
            <span class="quick-access-name">${escapeHtml(tool.name)}</span>
          </a>`).join('')}
      </div>
    </section>`;
}

/** Build the features section */
function buildFeaturesSection() {
  const features = [
    {
      icon: '<path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>',
      color: '#22c55e',
      title: 'Entirely Browser-Based',
      desc: 'All processing happens client-side. Your data never leaves your machine.',
    },
    {
      icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
      color: '#3b82f6',
      title: 'Privacy First',
      desc: 'No tracking, no analytics, no data collection. Your work stays private.',
    },
    {
      icon: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
      color: '#f59e0b',
      title: 'Works Offline',
      desc: 'Installable as a PWA. Use all tools even without an internet connection.',
    },
    {
      icon: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
      color: '#8b5cf6',
      title: 'Open Source',
      desc: 'Fully open source and MIT licensed. Contribute, fork, and customise freely.',
    },
  ];

  return `
    <section class="home-section" aria-labelledby="features-title">
      <div class="section-header">
        <h2 id="features-title" class="section-title">Why Orion?</h2>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4);">
        ${features.map(f => `
          <div class="feature-card">
            <div class="feature-card-icon" style="background: ${f.color}1a;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${f.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                ${f.icon}
              </svg>
            </div>
            <h3 class="feature-card-title">${escapeHtml(f.title)}</h3>
            <p class="feature-card-text">${escapeHtml(f.desc)}</p>
          </div>`).join('')}
      </div>
    </section>`;
}

/**
 * Build the mega footer.
 */
function buildFooter() {
  const year = new Date().getFullYear();
  return `
    <footer class="home-footer" aria-label="Site footer">
      <div class="home-footer-inner">

        <!-- Brand column -->
        <div class="footer-brand">
          <div class="footer-logo">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#047857"/><stop offset="1" stop-color="#34d399"/>
                </linearGradient>
              </defs>
              <rect width="48" height="48" rx="13" fill="url(#footerLogoGrad)"/>
              <line x1="14" y1="24" x2="24" y2="21" stroke="white" stroke-width="0.8" stroke-opacity="0.7"/>
              <line x1="24" y1="21" x2="34" y2="22" stroke="white" stroke-width="0.8" stroke-opacity="0.7"/>
              <circle cx="14" cy="24" r="2.4" fill="white"/>
              <circle cx="24" cy="21" r="2.4" fill="white"/>
              <circle cx="34" cy="22" r="2.4" fill="white"/>
              <circle cx="11" cy="11" r="1.8" fill="white" fill-opacity="0.7"/>
              <circle cx="37" cy="38" r="2.2" fill="white" fill-opacity="0.9"/>
              <circle cx="11" cy="39" r="1.6" fill="white" fill-opacity="0.6"/>
            </svg>
            <div class="footer-logo-text">
              <span class="footer-logo-company">CodeX</span>
              <span class="footer-logo-product">Orion Toolkit</span>
            </div>
          </div>
          <p class="footer-tagline">
            Free, open-source developer tools that run entirely in your browser.
            No backend, no tracking, no account required.
          </p>
          <!-- Social links -->
          <div class="footer-social">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="footer-social-link" aria-label="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" class="footer-social-link" aria-label="Twitter / X">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="mailto:hello@codex.dev" class="footer-social-link" aria-label="Email">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Link columns -->
        <div class="footer-cols">

          <div class="footer-col">
            <h4 class="footer-col-title">Product</h4>
            <ul class="footer-col-links">
              <li><a href="#/" class="footer-link">Home</a></li>
              <li><a href="#/tool/json-formatter" class="footer-link">JSON Formatter</a></li>
              <li><a href="#/tool/api-tester" class="footer-link">API Tester</a></li>
              <li><a href="#/tool/regex-tester" class="footer-link">Regex Tester</a></li>
              <li><a href="#/tool/jwt-decoder" class="footer-link">JWT Decoder</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4 class="footer-col-title">Tools</h4>
            <ul class="footer-col-links">
              <li><a href="#/tool/uuid-generator" class="footer-link">UUID Generator</a></li>
              <li><a href="#/tool/hash-generator" class="footer-link">Hash Generator</a></li>
              <li><a href="#/tool/base64-tool" class="footer-link">Base64 Encoder</a></li>
              <li><a href="#/tool/url-encoder" class="footer-link">URL Encoder</a></li>
              <li><a href="#/tool/color-picker" class="footer-link">Color Picker</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4 class="footer-col-title">Company</h4>
            <ul class="footer-col-links">
              <li><a href="#" class="footer-link">About CodeX</a></li>
              <li><a href="#" class="footer-link">Blog</a></li>
              <li><a href="#" class="footer-link">Careers</a></li>
              <li><a href="https://paypal.me/vimantha.dilshan" target="_blank" rel="noopener noreferrer" class="footer-link footer-link-donate">
                ♥ Donate
              </a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4 class="footer-col-title">Legal</h4>
            <ul class="footer-col-links">
              <li><a href="#" class="footer-link">Privacy Policy</a></li>
              <li><a href="#" class="footer-link">Terms of Use</a></li>
              <li><a href="#" class="footer-link">MIT License</a></li>
              <li><a href="#" class="footer-link">Changelog</a></li>
            </ul>
          </div>

        </div>
      </div>

      <!-- Bottom bar -->
      <div class="footer-bottom">
        <span>© ${year} <strong>CodeX</strong>. All rights reserved.</span>
        <span class="footer-bottom-sep">·</span>
        <span>Built with ♥ for developers worldwide</span>
        <span class="footer-bottom-sep">·</span>
        <span>Powered by <a href="#/" class="footer-link">Orion</a></span>
        <span class="footer-bottom-sep">·</span>
        <span>CodeX by Vimantha Dilshan</span>
        <span class="footer-bottom-sep">·</span>
        <span><a href="https://www.linkedin.com/in/vimantha-dilshan/" target="_blank" rel="noopener noreferrer" class="footer-link">LinkedIn</a></span>
      </div>
    </footer>`;
}

/**
 * Render the tools grid for the given category.
 * @param {HTMLElement} container
 * @param {string}      category
 */
function renderToolsGrid(container, category) {
  const grid = container.querySelector('#tools-grid');
  if (!grid) return;

  const filtered = category === 'all'
    ? TOOLS
    : TOOLS.filter(t => t.category === category);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <p class="empty-state-title">No tools in this category yet</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(tool => buildToolCard(tool)).join('');

  // Wire favorite buttons
  grid.querySelectorAll('[data-fav-btn]').forEach(btn => {
    const toolId = btn.dataset.favBtn;
    updateFavoriteBtn(btn, favoritesService.isFavorite(toolId));
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const isFav = favoritesService.toggle(toolId);
      updateFavoriteBtn(btn, isFav);
    });
  });
}

/** Build a single tool card HTML string */
function buildToolCard(tool) {
  const isFav = favoritesService.isFavorite(tool.id);
  return `
    <a href="#/tool/${tool.id}" class="tool-card" aria-label="Open ${escapeHtml(tool.name)}">
      <div class="tool-card-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="${tool.icon}"/>
        </svg>
      </div>
      <div class="tool-card-content">
        <div class="tool-card-name">
          ${escapeHtml(tool.name)}
          ${tool.new ? '<span class="badge badge-primary" style="font-size:9px; margin-left:4px;">NEW</span>' : ''}
        </div>
        <div class="tool-card-description">${escapeHtml(tool.description)}</div>
        <div class="tool-card-tags">
          ${tool.keywords.slice(0, 3).map(k => `<span class="tag">${escapeHtml(k)}</span>`).join('')}
        </div>
      </div>
      <button
        class="copy-btn tool-card-favorite"
        data-fav-btn="${tool.id}"
        aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
        title="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>
    </a>`;
}

/** Update a favorite button's visual state */
function updateFavoriteBtn(btn, isFav) {
  const svg = btn.querySelector('svg');
  if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
  btn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
  btn.style.color = isFav ? 'var(--color-warning)' : '';
}

/** Bind all home page event listeners */
function bindHomeEvents(container) {
  // Hero search button
  container.querySelector('#hero-search-btn')?.addEventListener('click', () => {
    commandPaletteService.open();
  });

  // Manage favorites link
  container.querySelector('#manage-favorites-link')?.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('favorites-btn')?.click();
  });

  // Category filter buttons
  container.querySelector('#category-filter')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-category]');
    if (!btn) return;

    activeCategory = btn.dataset.category;

    // Update active state
    container.querySelectorAll('[data-category]').forEach(b => {
      b.classList.toggle('active', b.dataset.category === activeCategory);
      b.setAttribute('aria-selected', String(b.dataset.category === activeCategory));
    });

    renderToolsGrid(container, activeCategory);
  });

  // Listen for favorites changes to update cards
  const offFavAdd = eventBus.on(EVENTS.FAVORITE_ADD, () => refreshFavButtons(container));
  const offFavRemove = eventBus.on(EVENTS.FAVORITE_REMOVE, () => refreshFavButtons(container));

  // Cleanup when navigating away
  eventBus.once(EVENTS.ROUTE_BEFORE_CHANGE, () => {
    offFavAdd();
    offFavRemove();
  });
}

/** Refresh favorite button states without re-rendering the whole grid */
function refreshFavButtons(container) {
  container.querySelectorAll('[data-fav-btn]').forEach(btn => {
    updateFavoriteBtn(btn, favoritesService.isFavorite(btn.dataset.favBtn));
  });
}
