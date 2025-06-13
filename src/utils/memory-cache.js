/**
 * Simple in-memory cache with time-based expiry.
 * Provides minimal API: get, set, has, cleanup, clear.
 * Default timeout: 30 minutes.
 *
 * This utility is extracted to follow SRP and enable reuse / testing.
 */
export class MemoryCache {
  /**
   * @param {number} timeoutMs – expiry duration in milliseconds
   */
  constructor(timeoutMs = 30 * 60 * 1000) {
    this.timeoutMs = timeoutMs;
    this.store = new Map();
  }

  /**
   * Store a value under a key and timestamp it.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    this.store.set(key, { value, timestamp: Date.now() });
  }

  /**
   * Retrieve a value if not expired; otherwise undefined.
   * @param {string} key
   * @returns {*|undefined}
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > this.timeoutMs) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Whether a non-expired value exists for key.
   * @param {string} key
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * Remove all expired entries.
   */
  cleanup() {
    const now = Date.now();
    for (const [key, { timestamp }] of this.store.entries()) {
      if (now - timestamp > this.timeoutMs) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear entire cache.
   */
  clear() {
    this.store.clear();
  }
}

export default MemoryCache;
