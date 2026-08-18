/**
 * Docker Generator Tool
 * =====================
 * Wizard to generate docker-compose.yml + Dockerfile for common stacks.
 *
 * @module tools/docker-generator
 */

import { clipboardService } from '../../assets/js/services/clipboard.service.js';
import { downloadService } from '../../assets/js/services/download.service.js';
import { toastService } from '../../assets/js/services/toast.service.js';
import { escapeHtml } from '../../assets/js/utils/dom.utils.js';

export function mount(container) {
    container.innerHTML = buildUI();
    bindEvents(container);
    generate(container); // generate defaults on mount
}

// ─── UI ─────────────────────────────────────────────────────────

const SERVICES = [
    { id: 'node', label: 'Node.js', icon: '🟩' },
    { id: 'python', label: 'Python', icon: '🐍' },
    { id: 'php', label: 'PHP (Apache)', icon: '🐘' },
    { id: 'nginx', label: 'Nginx', icon: '🟢' },
    { id: 'postgres', label: 'PostgreSQL', icon: '🐘' },
    { id: 'mysql', label: 'MySQL', icon: '🐬' },
    { id: 'mongo', label: 'MongoDB', icon: '🍃' },
    { id: 'redis', label: 'Redis', icon: '🔴' },
    { id: 'rabbitmq', label: 'RabbitMQ', icon: '🐇' },
    { id: 'elasticsearch', label: 'Elasticsearch', icon: '🔍' },
];

function buildUI() {
    return `
    <div class="tool-page" id="docker-root">
      <div class="tool-header">
        <div class="tool-header-left">
          <div class="tool-header-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div class="tool-header-info">
            <h1 class="tool-title">Docker Generator</h1>
            <p class="tool-description">Generate production-ready Dockerfile and docker-compose.yml from a visual wizard.</p>
          </div>
        </div>
        <div class="tool-header-actions">
          <button class="btn btn-primary" id="docker-generate-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
            Generate
          </button>
        </div>
      </div>

      <div class="tool-layout-split" style="gap: var(--space-4); align-items: flex-start;">

        <!-- Config Panel -->
        <div style="width: 360px; flex-shrink: 0; display: flex; flex-direction: column; gap: var(--space-4);">

          <!-- Project Info -->
          <div class="tool-panel">
            <div class="tool-panel-header"><div class="tool-panel-title">Project Settings</div></div>
            <div class="tool-panel-body" style="padding: var(--space-4);">
              <div class="form-group">
                <label class="form-label" for="docker-project-name">Project name</label>
                <input type="text" id="docker-project-name" class="input input-mono" value="my-app" autocomplete="off" />
              </div>
              <div class="form-group">
                <label class="form-label" for="docker-network">Network name</label>
                <input type="text" id="docker-network" class="input input-mono" value="app-network" autocomplete="off" />
              </div>
              <div class="form-group">
                <label class="form-label" for="docker-compose-version">Compose version</label>
                <select class="select" id="docker-compose-version">
                  <option value="3.8" selected>3.8</option>
                  <option value="3.9">3.9</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Services -->
          <div class="tool-panel">
            <div class="tool-panel-header"><div class="tool-panel-title">Services</div></div>
            <div class="tool-panel-body" style="padding: var(--space-4);">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2);">
                ${SERVICES.map(s => `
                  <label class="checkbox-item" style="gap: var(--space-2);">
                    <input type="checkbox" class="docker-service" data-service="${s.id}" ${['node', 'postgres'].includes(s.id) ? 'checked' : ''} />
                    <span class="checkbox-label">${s.icon} ${s.label}</span>
                  </label>`).join('')}
              </div>
            </div>
          </div>

          <!-- App Config -->
          <div class="tool-panel" id="docker-app-config">
            <div class="tool-panel-header"><div class="tool-panel-title">App Config</div></div>
            <div class="tool-panel-body" style="padding: var(--space-4);">
              <div class="form-group">
                <label class="form-label" for="docker-app-port">App Port</label>
                <input type="text" id="docker-app-port" class="input input-mono" value="3000" autocomplete="off" />
              </div>
              <div class="form-group">
                <label class="form-label" for="docker-node-version">Node version</label>
                <select class="select" id="docker-node-version">
                  <option value="20-alpine" selected>20-alpine (recommended)</option>
                  <option value="18-alpine">18-alpine</option>
                  <option value="lts-alpine">lts-alpine</option>
                  <option value="20">20 (full)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="checkbox-item">
                  <input type="checkbox" id="docker-hot-reload" checked />
                  <span class="checkbox-label">Hot reload (volume mount)</span>
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-item">
                  <input type="checkbox" id="docker-env-file" checked />
                  <span class="checkbox-label">Use .env file</span>
                </label>
              </div>
            </div>
          </div>

        </div>

        <!-- Output Tabs -->
        <div style="flex: 1; min-width: 0;">
          <div class="tool-panel">
            <div class="tool-tabs">
              <button class="tool-tab active" data-dtab="compose">docker-compose.yml</button>
              <button class="tool-tab" data-dtab="dockerfile">Dockerfile</button>
              <button class="tool-tab" data-dtab="env">.env.example</button>
              <button class="tool-tab" data-dtab="gitignore">.gitignore snippets</button>
            </div>

            <!-- Output area per tab -->
            ${['compose', 'dockerfile', 'env', 'gitignore'].map(tab => `
              <div id="dtab-${tab}" style="${tab !== 'compose' ? 'display:none;' : ''}">
                <div class="tool-panel-header">
                  <div class="tool-panel-title">${tabLabel(tab)}</div>
                  <div class="tool-panel-actions">
                    <button class="copy-btn docker-copy-btn" data-output="${tab}" aria-label="Copy ${tab}">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copy
                    </button>
                    <button class="copy-btn docker-download-btn" data-output="${tab}" aria-label="Download ${tab}">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Download
                    </button>
                  </div>
                </div>
                <div style="overflow: auto;">
                  <pre style="margin:0;"><code id="docker-out-${tab}" class="language-yaml" style="padding: var(--space-4); display: block; min-height: 400px;"></code></pre>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

function tabLabel(tab) {
    const labels = { compose: 'docker-compose.yml', dockerfile: 'Dockerfile', env: '.env.example', gitignore: '.gitignore (snippets)' };
    return labels[tab] ?? tab;
}

// ─── Events ─────────────────────────────────────────────────────

function bindEvents(container) {
    container.querySelector('#docker-generate-btn')?.addEventListener('click', () => generate(container));

    container.querySelectorAll('[data-dtab]').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('[data-dtab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            ['compose', 'dockerfile', 'env', 'gitignore'].forEach(t => {
                const el = container.querySelector(`#dtab-${t}`);
                if (el) el.style.display = t === tab.dataset.dtab ? '' : 'none';
            });
        });
    });

    container.querySelectorAll('.docker-copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const codeEl = container.querySelector(`#docker-out-${btn.dataset.output}`);
            if (codeEl?.textContent) clipboardService.copyWithFeedback(codeEl.textContent, btn);
        });
    });

    container.querySelectorAll('.docker-download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const codeEl = container.querySelector(`#docker-out-${btn.dataset.output}`);
            if (codeEl?.textContent) {
                const name = { compose: 'docker-compose.yml', dockerfile: 'Dockerfile', env: '.env.example', gitignore: '.gitignore' }[btn.dataset.output] ?? 'output.txt';
                downloadService.text(codeEl.textContent, name);
            }
        });
    });

    // Auto-regenerate on input change
    ['docker-project-name', 'docker-network', 'docker-compose-version', 'docker-app-port', 'docker-node-version'].forEach(id => {
        container.querySelector(`#${id}`)?.addEventListener('change', () => generate(container));
    });
    ['docker-hot-reload', 'docker-env-file'].forEach(id => {
        container.querySelector(`#${id}`)?.addEventListener('change', () => generate(container));
    });
    container.querySelectorAll('.docker-service').forEach(cb => {
        cb.addEventListener('change', () => generate(container));
    });
}

// ─── Generator ──────────────────────────────────────────────────

function generate(container) {
    const projectName = container.querySelector('#docker-project-name')?.value || 'my-app';
    const network = container.querySelector('#docker-network')?.value || 'app-network';
    const version = container.querySelector('#docker-compose-version')?.value || '3.8';
    const appPort = container.querySelector('#docker-app-port')?.value || '3000';
    const nodeVersion = container.querySelector('#docker-node-version')?.value || '20-alpine';
    const hotReload = container.querySelector('#docker-hot-reload')?.checked ?? true;
    const useEnvFile = container.querySelector('#docker-env-file')?.checked ?? true;

    const selected = [...container.querySelectorAll('.docker-service:checked')].map(c => c.dataset.service);

    const files = {
        compose: generateCompose(projectName, network, version, appPort, selected, hotReload, useEnvFile),
        dockerfile: generateDockerfile(selected, nodeVersion, appPort),
        env: generateEnv(selected),
        gitignore: generateGitignore(),
    };

    Object.entries(files).forEach(([tab, code]) => {
        const el = container.querySelector(`#docker-out-${tab}`);
        if (el) {
            el.textContent = code;
            if (window.hljs) window.hljs.highlightElement(el);
        }
    });
}

function generateCompose(projectName, network, version, appPort, services, hotReload, useEnvFile) {
    const lines = [`version: '${version}'`, '', 'services:'];

    services.forEach(svc => {
        switch (svc) {
            case 'node':
                lines.push(`  app:`);
                lines.push(`    build:`);
                lines.push(`      context: .`);
                lines.push(`      dockerfile: Dockerfile`);
                lines.push(`    container_name: ${projectName}-app`);
                lines.push(`    ports:`);
                lines.push(`      - "${appPort}:${appPort}"`);
                if (hotReload) {
                    lines.push(`    volumes:`);
                    lines.push(`      - .:/app`);
                    lines.push(`      - /app/node_modules`);
                }
                if (useEnvFile) lines.push(`    env_file:\n      - .env`);
                lines.push(`    networks:\n      - ${network}`);
                lines.push(`    restart: unless-stopped`);
                if (services.includes('postgres')) lines.push(`    depends_on:\n      - postgres`);
                if (services.includes('mysql')) lines.push(`    depends_on:\n      - mysql`);
                if (services.includes('redis')) lines.push(`    depends_on:\n      - redis`);
                break;

            case 'python':
                lines.push(`  app:`);
                lines.push(`    build:\n      context: .\n      dockerfile: Dockerfile`);
                lines.push(`    container_name: ${projectName}-app`);
                lines.push(`    ports:\n      - "${appPort}:${appPort}"`);
                if (hotReload) lines.push(`    volumes:\n      - .:/app`);
                if (useEnvFile) lines.push(`    env_file:\n      - .env`);
                lines.push(`    networks:\n      - ${network}`);
                lines.push(`    restart: unless-stopped`);
                break;

            case 'nginx':
                lines.push(`  nginx:`);
                lines.push(`    image: nginx:alpine`);
                lines.push(`    container_name: ${projectName}-nginx`);
                lines.push(`    ports:\n      - "80:80"\n      - "443:443"`);
                lines.push(`    volumes:\n      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro\n      - ./nginx/certs:/etc/nginx/certs:ro`);
                lines.push(`    networks:\n      - ${network}`);
                lines.push(`    restart: unless-stopped`);
                if (services.includes('node') || services.includes('python')) {
                    lines.push(`    depends_on:\n      - app`);
                }
                break;

            case 'postgres':
                lines.push(`  postgres:`);
                lines.push(`    image: postgres:15-alpine`);
                lines.push(`    container_name: ${projectName}-postgres`);
                lines.push(`    environment:`);
                lines.push(`      POSTGRES_USER: \${POSTGRES_USER:-postgres}`);
                lines.push(`      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-secret}`);
                lines.push(`      POSTGRES_DB: \${POSTGRES_DB:-${projectName}}`);
                lines.push(`    volumes:\n      - postgres_data:/var/lib/postgresql/data`);
                lines.push(`    ports:\n      - "5432:5432"`);
                lines.push(`    networks:\n      - ${network}`);
                lines.push(`    restart: unless-stopped`);
                break;

            case 'mysql':
                lines.push(`  mysql:`);
                lines.push(`    image: mysql:8`);
                lines.push(`    container_name: ${projectName}-mysql`);
                lines.push(`    environment:`);
                lines.push(`      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD:-secret}`);
                lines.push(`      MYSQL_DATABASE: \${MYSQL_DATABASE:-${projectName}}`);
                lines.push(`      MYSQL_USER: \${MYSQL_USER:-user}`);
                lines.push(`      MYSQL_PASSWORD: \${MYSQL_PASSWORD:-secret}`);
                lines.push(`    volumes:\n      - mysql_data:/var/lib/mysql`);
                lines.push(`    ports:\n      - "3306:3306"`);
                lines.push(`    networks:\n      - ${network}`);
                lines.push(`    restart: unless-stopped`);
                break;

            case 'mongo':
                lines.push(`  mongo:`);
                lines.push(`    image: mongo:7`);
                lines.push(`    container_name: ${projectName}-mongo`);
                lines.push(`    environment:`);
                lines.push(`      MONGO_INITDB_ROOT_USERNAME: \${MONGO_USER:-root}`);
                lines.push(`      MONGO_INITDB_ROOT_PASSWORD: \${MONGO_PASSWORD:-secret}`);
                lines.push(`    volumes:\n      - mongo_data:/data/db`);
                lines.push(`    ports:\n      - "27017:27017"`);
                lines.push(`    networks:\n      - ${network}`);
                lines.push(`    restart: unless-stopped`);
                break;

            case 'redis':
                lines.push(`  redis:`);
                lines.push(`    image: redis:7-alpine`);
                lines.push(`    container_name: ${projectName}-redis`);
                lines.push(`    command: redis-server --appendonly yes`);
                lines.push(`    volumes:\n      - redis_data:/data`);
                lines.push(`    ports:\n      - "6379:6379"`);
                lines.push(`    networks:\n      - ${network}`);
                lines.push(`    restart: unless-stopped`);
                break;

            case 'rabbitmq':
                lines.push(`  rabbitmq:`);
                lines.push(`    image: rabbitmq:3-management-alpine`);
                lines.push(`    container_name: ${projectName}-rabbitmq`);
                lines.push(`    environment:`);
                lines.push(`      RABBITMQ_DEFAULT_USER: \${RABBITMQ_USER:-guest}`);
                lines.push(`      RABBITMQ_DEFAULT_PASS: \${RABBITMQ_PASS:-guest}`);
                lines.push(`    ports:\n      - "5672:5672"\n      - "15672:15672"`);
                lines.push(`    networks:\n      - ${network}`);
                lines.push(`    restart: unless-stopped`);
                break;

            case 'elasticsearch':
                lines.push(`  elasticsearch:`);
                lines.push(`    image: elasticsearch:8.11.0`);
                lines.push(`    container_name: ${projectName}-elasticsearch`);
                lines.push(`    environment:`);
                lines.push(`      - discovery.type=single-node`);
                lines.push(`      - xpack.security.enabled=false`);
                lines.push(`      - ES_JAVA_OPTS=-Xms512m -Xmx512m`);
                lines.push(`    volumes:\n      - es_data:/usr/share/elasticsearch/data`);
                lines.push(`    ports:\n      - "9200:9200"`);
                lines.push(`    networks:\n      - ${network}`);
                lines.push(`    restart: unless-stopped`);
                break;
        }
        lines.push('');
    });

    // Volumes
    const volumeMap = { postgres: 'postgres_data', mysql: 'mysql_data', mongo: 'mongo_data', redis: 'redis_data', elasticsearch: 'es_data' };
    const volumes = services.filter(s => volumeMap[s]).map(s => volumeMap[s]);
    if (volumes.length) {
        lines.push('volumes:');
        volumes.forEach(v => lines.push(`  ${v}:`));
        lines.push('');
    }

    lines.push('networks:');
    lines.push(`  ${network}:`);
    lines.push(`    driver: bridge`);

    return lines.join('\n');
}

function generateDockerfile(services, nodeVersion, appPort) {
    if (services.includes('node')) {
        return `# Build stage
FROM node:${nodeVersion} AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:${nodeVersion}
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE ${appPort}
USER node
CMD ["node", "src/index.js"]`;
    }

    if (services.includes('python')) {
        return `FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN addgroup --system app && adduser --system --group app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chown -R app:app /app

USER app

EXPOSE ${appPort}

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${appPort}"]`;
    }

    if (services.includes('php')) {
        return `FROM php:8.2-apache

RUN apt-get update && apt-get install -y \\
    libpng-dev libzip-dev zip unzip \\
    && docker-php-ext-install pdo_mysql gd zip \\
    && a2enmod rewrite

WORKDIR /var/www/html

COPY . .

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]`;
    }

    return `# Base image
FROM alpine:3.18

WORKDIR /app
COPY . .
EXPOSE ${appPort}
CMD ["sh"]`;
}

function generateEnv(services) {
    const lines = [
        `# Application`,
        `NODE_ENV=development`,
        `PORT=3000`,
        `APP_SECRET=change-this-to-a-secure-random-string`,
        '',
    ];

    if (services.includes('postgres')) {
        lines.push(`# PostgreSQL`, `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=secret`, `POSTGRES_DB=myapp`, `DATABASE_URL=postgresql://postgres:secret@postgres:5432/myapp`, '');
    }
    if (services.includes('mysql')) {
        lines.push(`# MySQL`, `MYSQL_ROOT_PASSWORD=secret`, `MYSQL_DATABASE=myapp`, `MYSQL_USER=user`, `MYSQL_PASSWORD=secret`, `DATABASE_URL=mysql://user:secret@mysql:3306/myapp`, '');
    }
    if (services.includes('mongo')) {
        lines.push(`# MongoDB`, `MONGO_USER=root`, `MONGO_PASSWORD=secret`, `MONGO_URL=mongodb://root:secret@mongo:27017/myapp`, '');
    }
    if (services.includes('redis')) {
        lines.push(`# Redis`, `REDIS_URL=redis://redis:6379`, '');
    }
    if (services.includes('rabbitmq')) {
        lines.push(`# RabbitMQ`, `RABBITMQ_USER=guest`, `RABBITMQ_PASS=guest`, `AMQP_URL=amqp://guest:guest@rabbitmq:5672`, '');
    }

    return lines.join('\n');
}

function generateGitignore() {
    return `# Docker
.env
.env.local
.env.*.local
docker-compose.override.yml

# Node
node_modules/
dist/
build/
.next/

# Python
__pycache__/
*.pyc
*.pyo
venv/
.venv/
*.egg-info/

# General
.DS_Store
Thumbs.db
*.log
coverage/
.cache/`;
}
