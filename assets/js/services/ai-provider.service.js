/**
 * AI Provider Service
 * ====================
 * Abstraction over AI provider APIs for text generation tasks.
 * API keys are NEVER stored in localStorage or any persistent storage.
 * They are held only in session (module-level) memory.
 *
 * @module services/ai-provider
 * @security API keys are kept in memory only, never persisted.
 */

import { AI_PROVIDERS } from '../config/constants.js';

class AIProviderService {
    /** @type {Map<string, string>} Session-only API key store (not persisted) */
    #sessionKeys = new Map();

    /**
     * Store an API key for the current session only.
     * Key is NEVER written to localStorage.
     * @param {string} provider
     * @param {string} key
     */
    setSessionKey(provider, key) {
        // Basic format validation only — never log key value
        if (key && key.trim().length > 8) {
            this.#sessionKeys.set(provider, key.trim());
        }
    }

    /** Clear session keys */
    clearSessionKeys() {
        this.#sessionKeys.clear();
    }

    /**
     * Check if a session key exists for a provider.
     * @param {string} provider
     */
    hasKey(provider) {
        return this.#sessionKeys.has(provider);
    }

    /**
     * Generate text using the specified provider.
     * Falls back to local heuristics if no key is set.
     *
     * @param {string} provider
     * @param {string} prompt
     * @param {Object} [options]
     * @returns {Promise<string>}
     */
    async generate(provider, prompt, options = {}) {
        if (provider === AI_PROVIDERS.LOCAL.id || !this.hasKey(provider)) {
            return this.#localGenerate(prompt, options);
        }

        try {
            switch (provider) {
                case AI_PROVIDERS.OPENAI.id: return await this.#openai(prompt, options);
                case AI_PROVIDERS.CLAUDE.id: return await this.#claude(prompt, options);
                case AI_PROVIDERS.GEMINI.id: return await this.#gemini(prompt, options);
                default: return this.#localGenerate(prompt, options);
            }
        } catch (err) {
            console.warn('[AIProvider] API call failed, falling back to local:', err.message);
            return this.#localGenerate(prompt, options);
        }
    }

    /** OpenAI completion */
    async #openai(prompt, { maxTokens = 256 } = {}) {
        const key = this.#sessionKeys.get(AI_PROVIDERS.OPENAI.id);
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: 0.3,
            }),
        });
        if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() ?? '';
    }

    /** Anthropic Claude completion */
    async #claude(prompt, { maxTokens = 256 } = {}) {
        const key = this.#sessionKeys.get(AI_PROVIDERS.CLAUDE.id);
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: maxTokens,
                messages: [{ role: 'user', content: prompt }],
            }),
        });
        if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
        const data = await res.json();
        return data.content?.[0]?.text?.trim() ?? '';
    }

    /** Google Gemini completion */
    async #gemini(prompt, { maxTokens = 256 } = {}) {
        const key = this.#sessionKeys.get(AI_PROVIDERS.GEMINI.id);
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
                }),
            }
        );
        if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    }

    /**
     * Local heuristic generation (no API key required).
     * Analyses the diff to produce a conventional commit message.
     */
    #localGenerate(prompt, options = {}) {
        if (options.task === 'commit') {
            return this.#localCommitGen(options.diff ?? prompt);
        }
        return Promise.resolve('// Local generation not available for this task. Please provide an API key.');
    }

    /** Heuristic commit message generation from a git diff */
    #localCommitGen(diff) {
        const lines = diff.split('\n');
        const added = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
        const removed = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length;
        const files = [...new Set(lines.filter(l => l.startsWith('diff --git')).map(l => {
            const m = l.match(/b\/(.+)$/);
            return m ? m[1] : '';
        }).filter(Boolean))];

        const ext = files[0]?.split('.').pop() ?? '';
        const isTest = files.some(f => /test|spec/i.test(f));
        const isDocs = files.some(f => /readme|doc|\.md/i.test(f));
        const isStyle = files.some(f => /\.css|\.scss|\.less/i.test(f));
        const isConfig = files.some(f => /config|\.json|\.yml|\.yaml/i.test(f));

        let type = 'chore';
        if (isTest) type = 'test';
        else if (isDocs) type = 'docs';
        else if (isStyle) type = 'style';
        else if (isConfig) type = 'build';
        else if (added > removed * 2) type = 'feat';
        else if (removed > added * 2) type = 'refactor';
        else if (added > 0 && removed > 0) type = 'fix';

        const scope = files[0]
            ? files[0].split('/').slice(-1)[0].replace(/\.[^.]+$/, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
            : '';
        const description = `update ${files.length > 1 ? `${files.length} files` : files[0] ?? 'code'}`;

        const commit = `${type}${scope ? `(${scope})` : ''}: ${description}

${added > 0 ? `- Added ${added} line${added > 1 ? 's' : ''}` : ''}
${removed > 0 ? `- Removed ${removed} line${removed > 1 ? 's' : ''}` : ''}
${files.length ? `\nFiles changed:\n${files.map(f => `  - ${f}`).join('\n')}` : ''}`.trim();

        return Promise.resolve(commit);
    }
}

export const aiProviderService = new AIProviderService();
