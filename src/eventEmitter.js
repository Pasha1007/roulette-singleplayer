/***
 *  Regular event listening  - addListener(eventName, listener)
 *  Single-use event listening - once(eventName, listener)
 *  Event removal - off(eventName, listener)
 *  Publish an event - emit(eventName, ...args)
 */
export default class EventEmitter {
    constructor() {
        this._events = Object.create(null);
    }
    addListener = (eventName, listener) => {
        if (typeof listener !== 'function') {
            throw new TypeError('Listener must be a function');
        }

        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }
        this._events[eventName].push(listener);
        return this;
    };

    off = (eventName, listener) => {
        if (!this._events[eventName]) return this;

        if (!listener) {
            delete this._events[eventName];
            return this;
        }

        this._events[eventName] = this._events[eventName].filter((l) => l !== listener && l.origListener !== listener);

        if (this._events[eventName].length === 0) {
            delete this._events[eventName];
        }
        return this;
    };
    emit = (eventName, ...args) => {
        const listeners = this._events[eventName];
        if (listeners) {
            const copy = listeners.slice();
            for (const listener of copy) {
                listener.apply(this, args);
            }
        } else if (eventName === 'error') {
            throw new Error('Unhandled error event');
        }
        return this;
    };

    once = (eventName, listener) => {
        if (typeof listener !== 'function') {
            throw new TypeError('Listener must be a function');
        }
        const onceWrapper = (...args) => {
            this.off(eventName, onceWrapper);
            listener.apply(this, args);
        };
        onceWrapper.origListener = listener;
        return this.addListener(eventName, onceWrapper);
    };
}