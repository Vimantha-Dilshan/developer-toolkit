/**
 * Application Constants
 * =====================
 * Immutable constants used across the application.
 *
 * @module config/constants
 */

/** LocalStorage Keys */
export const STORAGE_KEYS = Object.freeze({
    THEME: 'devtk_theme',
    SETTINGS: 'devtk_settings',
    FAVORITES: 'devtk_favorites',
    RECENT_TOOLS: 'devtk_recent',
    PWA_DISMISSED: 'devtk_pwa_dismissed',
    API_REQUESTS: 'devtk_api_requests',
});

/** Event names for the EventBus */
export const EVENTS = Object.freeze({
    // Navigation
    ROUTE_CHANGE: 'route:change',
    ROUTE_BEFORE_CHANGE: 'route:beforeChange',

    // Theme
    THEME_CHANGE: 'theme:change',

    // Tools
    TOOL_OPEN: 'tool:open',
    TOOL_CLOSE: 'tool:close',

    // Favorites
    FAVORITE_ADD: 'favorite:add',
    FAVORITE_REMOVE: 'favorite:remove',

    // History
    HISTORY_UPDATE: 'history:update',

    // Settings
    SETTINGS_CHANGE: 'settings:change',
    SETTINGS_RESET: 'settings:reset',

    // UI
    SIDEBAR_TOGGLE: 'sidebar:toggle',
    SIDEBAR_COLLAPSE: 'sidebar:collapse',
    MODAL_OPEN: 'modal:open',
    MODAL_CLOSE: 'modal:close',
    TOAST_SHOW: 'toast:show',
    COMMAND_PALETTE_OPEN: 'commandPalette:open',
    COMMAND_PALETTE_CLOSE: 'commandPalette:close',

    // Clipboard
    COPY_SUCCESS: 'clipboard:copy:success',
    COPY_FAIL: 'clipboard:copy:fail',
});

/** HTTP Methods */
export const HTTP_METHODS = Object.freeze(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

/** Code Languages for syntax highlighting */
export const LANGUAGES = Object.freeze({
    JSON: 'json',
    SQL: 'sql',
    XML: 'xml',
    YAML: 'yaml',
    HTML: 'html',
    CSS: 'css',
    JAVASCRIPT: 'javascript',
    TYPESCRIPT: 'typescript',
    MARKDOWN: 'markdown',
    BASH: 'bash',
    PYTHON: 'python',
    DOCKERFILE: 'dockerfile',
});

/** UUID Versions */
export const UUID_VERSIONS = Object.freeze({
    V1: 'v1',
    V4: 'v4',
    V7: 'v7',
    ULID: 'ulid',
    NANOID: 'nanoid',
});

/** SQL Dialects */
export const SQL_DIALECTS = Object.freeze({
    MYSQL: 'mysql',
    POSTGRESQL: 'postgresql',
    SQLITE: 'sqlite',
    TSQL: 'tsql',
    ORACLE: 'oracle',
    MARIADB: 'mariadb',
});

/** Hash Algorithms */
export const HASH_ALGORITHMS = Object.freeze(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']);

/** Regex Flags */
export const REGEX_FLAGS = Object.freeze({
    g: { label: 'global', description: 'Find all matches (not just first)' },
    i: { label: 'insensitive', description: 'Case-insensitive matching' },
    m: { label: 'multiline', description: '^ and $ match start/end of each line' },
    s: { label: 'dotAll', description: '. also matches newlines' },
    u: { label: 'unicode', description: 'Enable Unicode features' },
    y: { label: 'sticky', description: 'Match from lastIndex position only' },
    d: { label: 'indices', description: 'Generate indices for substrings' },
});

/** AI Providers */
export const AI_PROVIDERS = Object.freeze({
    LOCAL: { id: 'local', label: 'Local (Heuristic)' },
    OPENAI: { id: 'openai', label: 'OpenAI GPT', placeholder: 'sk-...' },
    CLAUDE: { id: 'claude', label: 'Anthropic Claude', placeholder: 'sk-ant-...' },
    GEMINI: { id: 'gemini', label: 'Google Gemini', placeholder: 'AIza...' },
});

/** Commit Styles */
export const COMMIT_STYLES = Object.freeze({
    CONVENTIONAL: { id: 'conventional', label: 'Conventional Commits' },
    SEMANTIC: { id: 'semantic', label: 'Semantic Versioning' },
    GITMOJI: { id: 'gitmoji', label: 'Gitmoji' },
    FREE: { id: 'free', label: 'Free Form' },
});

/** Conventional Commit Types */
export const COMMIT_TYPES = Object.freeze([
    { type: 'feat', emoji: '✨', description: 'New feature' },
    { type: 'fix', emoji: '🐛', description: 'Bug fix' },
    { type: 'docs', emoji: '📝', description: 'Documentation only' },
    { type: 'style', emoji: '💅', description: 'Formatting, no logic change' },
    { type: 'refactor', emoji: '♻️', description: 'Code change, no fix or feature' },
    { type: 'perf', emoji: '⚡️', description: 'Performance improvement' },
    { type: 'test', emoji: '✅', description: 'Add or update tests' },
    { type: 'build', emoji: '🏗️', description: 'Build system or deps' },
    { type: 'ci', emoji: '🔧', description: 'CI configuration' },
    { type: 'chore', emoji: '🔨', description: 'Other changes' },
    { type: 'revert', emoji: '⏪', description: 'Revert a commit' },
]);

/** Docker Services */
export const DOCKER_SERVICES = Object.freeze({
    LARAVEL: { id: 'laravel', label: 'Laravel (PHP)', port: 9000 },
    NODE: { id: 'node', label: 'Node.js', port: 3000 },
    REACT: { id: 'react', label: 'React (Node)', port: 3000 },
    VUE: { id: 'vue', label: 'Vue (Node)', port: 8080 },
    REDIS: { id: 'redis', label: 'Redis', port: 6379 },
    MYSQL: { id: 'mysql', label: 'MySQL 8', port: 3306 },
    POSTGRES: { id: 'postgres', label: 'PostgreSQL', port: 5432 },
    NGINX: { id: 'nginx', label: 'Nginx', port: 80 },
    MONGODB: { id: 'mongodb', label: 'MongoDB', port: 27017 },
    PHPMYADMIN: { id: 'phpmyadmin', label: 'phpMyAdmin', port: 8080 },
    MAILHOG: { id: 'mailhog', label: 'Mailhog', port: 8025 },
    MINIO: { id: 'minio', label: 'MinIO (S3)', port: 9000 },
});
