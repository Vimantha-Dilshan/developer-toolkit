/**
 * Event Bus
 * =========
 * Lightweight publish-subscribe event system for decoupled communication
 * between modules. Uses the singleton pattern via module-level export.
 *
 * @module core/event-bus
 */

class EventBus {
    /** @type {Map<string, Set<Function>>} */
    #listeners = new Map();

    /**
     * Subscribe to an event.
     * @param {string}   event   - Event name
     * @param {Function} handler - Handler function
     * @returns {Function} Unsubscribe function
     */
    on(event, handler) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set());
        }
        this.#listeners.get(event).add(handler);
        // Return cleanup function
        return () => this.off(event, handler);
    }

    /**
     * Subscribe to an event only once.
     * @param {string}   event
     * @param {Function} handler
     * @returns {Function} Unsubscribe function
     */
    once(event, handler) {
        const wrapper = (data) => {
            handler(data);
            this.off(event, wrapper);
        };
        return this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event.
     * @param {string}   event
     * @param {Function} handler
     */
    off(event, handler) {
        this.#listeners.get(event)?.delete(handler);
    }

    /**
     * Emit an event with optional payload.
     * @param {string} event
     * @param {*}      [data]
     */
    emit(event, data) {
        this.#listeners.get(event)?.forEach(handler => {
            try {
                handler(data);
            } catch (err) {
                console.error(`[EventBus] Error in handler for "${event}":`, err);
            }
        });
    }

    /**
     * Remove all listeners for a given event, or all events if no argument.
     * @param {string} [event]
     */
    clear(event) {
        if (event) {
            this.#listeners.delete(event);
        } else {
            this.#listeners.clear();
        }
    }

    /**
     * Returns the number of listeners for an event.
     * @param {string} event
     * @returns {number}
     */
    listenerCount(event) {
        return this.#listeners.get(event)?.size ?? 0;
    }
}

/** Singleton EventBus instance used application-wide */
export const eventBus = new EventBus();
