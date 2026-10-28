// ─────────────────────────────────────────────────────────────────────────────
// Bounded in-memory TTL cache with single-flight loading.
//   - Single-flight: concurrent misses for one key share ONE loader call.
//   - Bounded: never more than maxEntries (least-recently-used evicted).
//   - Failures are never cached; every waiter sees the rejection.
//   - Amortised O(1); monotonic clock.
// Cached values are shared by reference: treat them as READ-ONLY.
// ─────────────────────────────────────────────────────────────────────────────

interface CacheEntry<V> {
    value: V;
    expiresAt: number;
}

export interface TtlCacheOptions {
    maxEntries: number;
    ttlMs: number;
}

export class TtlCache<V> {
    private readonly entries = new Map<string, CacheEntry<V>>();
    private readonly inflight = new Map<string, Promise<V>>();
    private readonly maxEntries: number;
    private readonly ttlMs: number;

    constructor(options: TtlCacheOptions) {
        if (!Number.isInteger(options.maxEntries) || options.maxEntries < 1) {
            throw new RangeError("[ttlCache] maxEntries must be a positive integer");
        }
        if (!(options.ttlMs > 0)) {
            throw new RangeError("[ttlCache] ttlMs must be positive");
        }
        this.maxEntries = options.maxEntries;
        this.ttlMs = options.ttlMs;
    }

    getOrLoad(key: string, loader: () => Promise<V>): Promise<V> {
        const now = performance.now();
        const hit = this.entries.get(key);

        if (hit) {
            if (hit.expiresAt > now) {
                this.entries.delete(key); // refresh recency
                this.entries.set(key, hit);
                return Promise.resolve(hit.value);
            }
            this.entries.delete(key);
        }

        const pending = this.inflight.get(key);
        if (pending) return pending;

        // Promise.resolve().then(loader) also turns a synchronous throw into
        // a rejection, so failure handling is uniform.
        const load = Promise.resolve()
            .then(loader)
            .then((value) => {
                this.store(key, value);
                return value;
            })
            .finally(() => {
                this.inflight.delete(key);
            });

        this.inflight.set(key, load);
        return load;
    }

    private store(key: string, value: V): void {
        const now = performance.now();

        for (const [existingKey, entry] of this.entries) {
            if (entry.expiresAt > now) break;
            this.entries.delete(existingKey);
        }

        this.entries.delete(key);
        this.entries.set(key, { value, expiresAt: now + this.ttlMs });

        while (this.entries.size > this.maxEntries) {
            const oldest = this.entries.keys().next();
            if (oldest.done) break;
            this.entries.delete(oldest.value);
        }
    }
}