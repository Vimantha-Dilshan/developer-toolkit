/**
 * Tool Registry
 * =============
 * Central registry for all developer tools.
 * Adding a new tool only requires registering it here.
 *
 * @module config/tools
 */

/**
 * @typedef {Object} ToolDefinition
 * @property {string}   id          - Unique tool identifier (used in URL)
 * @property {string}   name        - Display name
 * @property {string}   description - Short description
 * @property {string}   category    - Category key
 * @property {string[]} keywords    - Search keywords
 * @property {string}   icon        - SVG path data for the icon
 * @property {string}   module      - Path to the tool's JS module
 * @property {boolean}  [featured]  - Whether to show on hero section
 * @property {boolean}  [new]       - Show "NEW" badge
 * @property {string}   [shortcut]  - Keyboard shortcut (e.g. "shift+j")
 */

export const TOOL_CATEGORIES = Object.freeze({
    formatters: { id: 'formatters', label: 'Formatters', icon: '{ }' },
    generators: { id: 'generators', label: 'Generators', icon: '✨' },
    testers: { id: 'testers', label: 'Testers', icon: '🧪' },
    converters: { id: 'converters', label: 'Converters', icon: '↔' },
    analyzers: { id: 'analyzers', label: 'Analyzers', icon: '🔍' },
    encoders: { id: 'encoders', label: 'Encoders', icon: '🔐' },
    design: { id: 'design', label: 'Design', icon: '🎨' },
    ai: { id: 'ai', label: 'AI Powered', icon: '🤖' },
});

/** @type {ToolDefinition[]} */
export const TOOLS = Object.freeze([

    // ─── Formatters ────────────────────────────────────────────────
    {
        id: 'json-formatter',
        name: 'JSON Formatter',
        description: 'Format, validate, minify and explore JSON with syntax highlighting and tree view.',
        category: 'formatters',
        keywords: ['json', 'format', 'validate', 'pretty', 'minify', 'lint', 'tree'],
        icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
        module: '../../tools/json-formatter/index.js',
        featured: true,
        shortcut: 'shift+j',
    },
    {
        id: 'sql-formatter',
        name: 'SQL Formatter',
        description: 'Format SQL queries with support for MySQL, PostgreSQL, SQLite, Oracle, and SQL Server.',
        category: 'formatters',
        keywords: ['sql', 'format', 'query', 'mysql', 'postgres', 'postgresql', 'sqlite', 'oracle'],
        icon: 'M12 2C6.48 2 2 4.48 2 7.5v9C2 19.52 6.48 22 12 22s10-2.48 10-5.5v-9C22 4.48 17.52 2 12 2z',
        module: '../../tools/sql-formatter/index.js',
        featured: true,
        shortcut: 'shift+s',
    },
    {
        id: 'xml-formatter',
        name: 'XML Formatter',
        description: 'Format, minify, and validate XML documents.',
        category: 'formatters',
        keywords: ['xml', 'format', 'pretty', 'minify', 'validate', 'html'],
        icon: 'M16 18 22 12 16 6M8 6 2 12 8 18',
        module: '../../tools/xml-formatter/index.js',
    },
    {
        id: 'yaml-formatter',
        name: 'YAML Formatter',
        description: 'Format, validate, and convert YAML documents.',
        category: 'formatters',
        keywords: ['yaml', 'yml', 'format', 'validate', 'json', 'convert'],
        icon: 'M21 10H7M21 6H3M21 14H3M21 18H7',
        module: '../../tools/yaml-formatter/index.js',
    },

    // ─── Generators ────────────────────────────────────────────────
    {
        id: 'uuid-generator',
        name: 'UUID Generator',
        description: 'Generate UUID v1, v4, v7, ULID, and NanoID identifiers in bulk.',
        category: 'generators',
        keywords: ['uuid', 'guid', 'ulid', 'nanoid', 'unique', 'id', 'generate', 'v4', 'v7'],
        icon: 'M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0',
        module: '../../tools/uuid-generator/index.js',
        featured: true,
    },
    {
        id: 'password-generator',
        name: 'Password Generator',
        description: 'Generate cryptographically secure passwords with custom rules.',
        category: 'generators',
        keywords: ['password', 'generate', 'secure', 'random', 'passphrase', 'strong'],
        icon: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
        module: '../../tools/password-generator/index.js',
        featured: true,
    },
    {
        id: 'docker-generator',
        name: 'Docker Compose Generator',
        description: 'Visually generate docker-compose.yml and Dockerfiles for popular stacks.',
        category: 'generators',
        keywords: ['docker', 'compose', 'dockerfile', 'container', 'laravel', 'node', 'nginx', 'redis', 'postgres'],
        icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
        module: '../../tools/docker-generator/index.js',
    },
    {
        id: 'lorem-ipsum',
        name: 'Lorem Ipsum Generator',
        description: 'Generate placeholder Lorem Ipsum text for any design or layout.',
        category: 'generators',
        keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'dummy', 'copy', 'words', 'paragraphs'],
        icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
        module: '../../tools/lorem-ipsum/index.js',
    },
    {
        id: 'qr-generator',
        name: 'QR Code Generator',
        description: 'Generate QR codes for URLs, text, contact cards, and Wi-Fi credentials.',
        category: 'generators',
        keywords: ['qr', 'qrcode', 'barcode', 'scan', 'url', 'text', 'wifi', 'contact'],
        icon: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z',
        module: '../../tools/qr-generator/index.js',
        featured: true,
    },
    {
        id: 'barcode-generator',
        name: 'Barcode Generator',
        description: 'Generate CODE128, EAN-13, EAN-8, UPC-A, and other barcode types.',
        category: 'generators',
        keywords: ['barcode', 'code128', 'ean13', 'ean8', 'upc', 'scan', 'generate'],
        icon: 'M3 5v14 M8 5v14 M12 5v14 M17 5v14 M21 5v14',
        module: '../../tools/barcode-generator/index.js',
    },

    // ─── Testers ───────────────────────────────────────────────────
    {
        id: 'regex-tester',
        name: 'Regex Tester',
        description: 'Test regular expressions with live match highlighting, flags, and a reference cheatsheet.',
        category: 'testers',
        keywords: ['regex', 'regexp', 'regular expression', 'test', 'match', 'replace', 'pattern'],
        icon: 'M21 21l-4.35-4.35 M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
        module: '../../tools/regex-tester/index.js',
        featured: true,
        shortcut: 'shift+r',
    },
    {
        id: 'api-tester',
        name: 'API Tester',
        description: 'Test HTTP APIs directly in the browser. Supports GET, POST, PUT, PATCH, DELETE with headers, body, and auth.',
        category: 'testers',
        keywords: ['api', 'http', 'rest', 'get', 'post', 'put', 'patch', 'delete', 'request', 'postman', 'curl'],
        icon: 'M13 2 3 14 12 14 11 22 21 10 12 10 13 2',
        module: '../../tools/api-tester/index.js',
        featured: true,
        shortcut: 'shift+a',
    },
    {
        id: 'diff-checker',
        name: 'Diff Checker',
        description: 'Compare two text blocks side by side and highlight differences.',
        category: 'testers',
        keywords: ['diff', 'compare', 'difference', 'text', 'code', 'git'],
        icon: 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3',
        module: '../../tools/diff-checker/index.js',
    },
    {
        id: 'cron-parser',
        name: 'Cron Expression Parser',
        description: 'Parse and validate cron expressions with a human-readable description and next run times.',
        category: 'testers',
        keywords: ['cron', 'schedule', 'expression', 'timer', 'job', 'task', 'unix'],
        icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2',
        module: '../../tools/cron-parser/index.js',
    },

    // ─── Converters ────────────────────────────────────────────────
    {
        id: 'markdown-preview',
        name: 'Markdown Preview',
        description: 'Write and preview Markdown with GitHub-styled rendering, syntax highlighting and HTML export.',
        category: 'converters',
        keywords: ['markdown', 'md', 'preview', 'github', 'render', 'html', 'export'],
        icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
        module: '../../tools/markdown-preview/index.js',
        featured: true,
        shortcut: 'shift+m',
    },
    {
        id: 'curl-converter',
        name: 'cURL Converter',
        description: 'Convert cURL commands to Postman collections and vice versa.',
        category: 'converters',
        keywords: ['curl', 'postman', 'convert', 'http', 'api', 'request'],
        icon: 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3',
        module: '../../tools/curl-converter/index.js',
    },
    {
        id: 'csv-json',
        name: 'CSV ↔ JSON Converter',
        description: 'Convert CSV data to JSON and JSON arrays to CSV with live preview.',
        category: 'converters',
        keywords: ['csv', 'json', 'convert', 'table', 'spreadsheet', 'data'],
        icon: 'M3 3h18v18H3z M3 9h18M3 15h18M9 3v18M15 3v18',
        module: '../../tools/csv-json/index.js',
    },
    {
        id: 'timestamp-converter',
        name: 'Timestamp Converter',
        description: 'Convert Unix timestamps to human-readable dates and vice versa.',
        category: 'converters',
        keywords: ['timestamp', 'unix', 'epoch', 'date', 'time', 'convert', 'utc', 'timezone'],
        icon: 'M3 4h18v18H3z M16 2v4M8 2v4M3 10h18',
        module: '../../tools/timestamp-converter/index.js',
    },

    // ─── Analyzers ─────────────────────────────────────────────────
    {
        id: 'jwt-decoder',
        name: 'JWT Decoder',
        description: 'Decode and inspect JSON Web Tokens. Shows header, payload, claims, and expiration countdown.',
        category: 'analyzers',
        keywords: ['jwt', 'json web token', 'decode', 'auth', 'bearer', 'token', 'claims', 'header'],
        icon: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
        module: '../../tools/jwt-decoder/index.js',
        featured: true,
    },
    {
        id: 'env-comparator',
        name: 'ENV Comparator',
        description: 'Compare .env files, find missing keys, duplicates and extra variables.',
        category: 'analyzers',
        keywords: ['env', 'environment', 'compare', 'diff', 'variables', 'keys', 'dotenv'],
        icon: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
        module: '../../tools/env-comparator/index.js',
    },
    {
        id: 'json-compare',
        name: 'JSON Compare',
        description: 'Deep compare two JSON objects and highlight structural differences.',
        category: 'analyzers',
        keywords: ['json', 'compare', 'diff', 'difference', 'object', 'deep'],
        icon: 'M6 3h12l4 6-10 13L2 9z',
        module: '../../tools/json-compare/index.js',
    },
    {
        id: 'hash-generator',
        name: 'Hash Generator',
        description: 'Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 and other hashes.',
        category: 'analyzers',
        keywords: ['hash', 'md5', 'sha', 'sha256', 'sha512', 'sha1', 'checksum', 'hmac', 'crypto'],
        icon: 'M4 9h16M4 15h16M10 3 8 21M16 3l-2 18',
        module: '../../tools/hash-generator/index.js',
    },

    // ─── Encoders / Decoders ───────────────────────────────────────
    {
        id: 'base64-tool',
        name: 'Base64 Tool',
        description: 'Encode and decode Base64 strings, files, and images.',
        category: 'encoders',
        keywords: ['base64', 'encode', 'decode', 'binary', 'file', 'image', 'string'],
        icon: 'M4 7V4h16v3M9 20H4v-3m16 3h-5M12 4v16',
        module: '../../tools/base64-tool/index.js',
        featured: true,
    },
    {
        id: 'url-encoder',
        name: 'URL Encoder / Decoder',
        description: 'Encode and decode URL strings and query parameters.',
        category: 'encoders',
        keywords: ['url', 'encode', 'decode', 'urlencode', 'query', 'percent', 'escape'],
        icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
        module: '../../tools/url-encoder/index.js',
    },
    {
        id: 'html-encoder',
        name: 'HTML Encoder / Decoder',
        description: 'Encode and decode HTML entities to prevent XSS and display special characters.',
        category: 'encoders',
        keywords: ['html', 'encode', 'decode', 'entity', 'escape', 'xss', 'special'],
        icon: 'M16 18 22 12 16 6M8 6 2 12 8 18',
        module: '../../tools/html-encoder/index.js',
    },

    // ─── Design ────────────────────────────────────────────────────
    {
        id: 'color-picker',
        name: 'Color Picker',
        description: 'Pick colors and convert between HEX, RGB, HSL, HSB and CSS formats.',
        category: 'design',
        keywords: ['color', 'colour', 'hex', 'rgb', 'hsl', 'hsb', 'picker', 'palette', 'css'],
        icon: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125',
        module: '../../tools/color-picker/index.js',
        featured: true,
    },

    // ─── AI Powered ────────────────────────────────────────────────
    {
        id: 'ai-commit-generator',
        name: 'AI Commit Generator',
        description: 'Generate conventional commit messages from git diffs using OpenAI, Claude, or Gemini.',
        category: 'ai',
        keywords: ['ai', 'commit', 'git', 'diff', 'conventional', 'message', 'openai', 'claude', 'gemini'],
        icon: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z',
        module: '../../tools/ai-commit-generator/index.js',
        featured: true,
        new: true,
    },
    {
        id: 'openapi-viewer',
        name: 'OpenAPI Viewer',
        description: 'Upload and explore Swagger/OpenAPI specifications with interactive documentation.',
        category: 'ai',
        keywords: ['openapi', 'swagger', 'api', 'spec', 'documentation', 'rest', 'yaml', 'json'],
        icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
        module: '../../tools/openapi-viewer/index.js',
    },
]);

/**
 * Get all tools grouped by category.
 * @returns {Object.<string, ToolDefinition[]>}
 */
export function getToolsByCategory() {
    return TOOLS.reduce((acc, tool) => {
        if (!acc[tool.category]) acc[tool.category] = [];
        acc[tool.category].push(tool);
        return acc;
    }, {});
}

/**
 * Get a tool by its ID.
 * @param {string} id
 * @returns {ToolDefinition|undefined}
 */
export function getToolById(id) {
    return TOOLS.find(t => t.id === id);
}

/**
 * Get featured tools.
 * @returns {ToolDefinition[]}
 */
export function getFeaturedTools() {
    return TOOLS.filter(t => t.featured);
}

/**
 * Search tools by query string.
 * @param {string} query
 * @returns {ToolDefinition[]}
 */
export function searchTools(query) {
    if (!query || !query.trim()) return [...TOOLS];
    const q = query.toLowerCase().trim();
    return TOOLS.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some(k => k.includes(q))
    );
}
