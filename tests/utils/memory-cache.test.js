import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { MemoryCache } from '../../src/utils/memory-cache.js';



describe('MemoryCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test
    jest.useRealTimers();
  });

  it('should set and get a value', () => {
    const cache = new MemoryCache();
    cache.set('key1', { data: 'value1' });
    expect(cache.get('key1')).toEqual({ data: 'value1' });
  });

  it('should return undefined for a non-existent key', () => {
    const cache = new MemoryCache();
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should return undefined and delete a key if it has expired', () => {
    const cache = new MemoryCache(1000); // 1-second expiry
    cache.set('key1', 'value1');

    // Advance time by 1.1 seconds
    jest.advanceTimersByTime(1100);

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.store.has('key1')).toBe(false);
  });

  it('should not return an expired value with has()', () => {
    const cache = new MemoryCache(1000);
    cache.set('key1', 'value1');

    jest.advanceTimersByTime(1100);

    expect(cache.has('key1')).toBe(false);
  });

  it('should clear all entries', () => {
    const cache = new MemoryCache();
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
    expect(cache.store.size).toBe(0);
  });

  it('should cleanup only expired entries', () => {
    const cache = new MemoryCache(2000);
    cache.set('key_expired', 'value_expired');

    jest.advanceTimersByTime(2100);

    cache.set('key_fresh', 'value_fresh');
    cache.cleanup();

    expect(cache.has('key_expired')).toBe(false);
    expect(cache.has('key_fresh')).toBe(true);
  });
});
