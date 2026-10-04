// ─────────────────────────────────────────────────────────────────────────────
// Bounded token-bucket rate limiter.
// Token bucket (not fixed window): allows the short bursts real clients
// produce while capping sustained rate, with no window-boundary double-burst.
//
//   - Bounded memory: at most maxKeys buckets, least-recently-used evicted.
//     Eviction resets that key to a full bucket - an acceptable, bounded
//     failure mode (needs > maxKeys distinct keys to trigger).
//   - Idle, fully-refilled buckets are dropped from the head; no full scans.
//   - Monotonic clock; a wall-clock step cannot grant extra tokens.
//
// State is per process: on serverless each instance has its own limiter.
// ─────────────────────────────────────────────────────────────────────────────

interface Bucket {
    tokens: number;
    updatedAt: number;
}

export interface RateLimitDecision {
    allowed: boolean;
    retryAfterSeconds: number; // 0 when allowed
}

export interface TokenBucketOptions {
    capacity: number; // maximum burst
    refillPerSecond: number; // sustained rate
    maxKeys: number;
}

export class TokenBucketLimiter {
    private readonly buckets = new Map<string, Bucket>();
    private readonly capacity: number;
    private readonly refillPerSecond: number;
    private readonly maxKeys: number;
    private readonly idleToFullMs: number;

    constructor(options: TokenBucketOptions) {
        if (!Number.isInteger(options.capacity) || options.capacity < 1) {
            throw new RangeError("[rateLimit] capacity must be a positive integer");
        }
        if (!(options.refillPerSecond > 0) || !Number.isFinite(options.refillPerSecond)) {
            throw new RangeError("[rateLimit] refillPerSecond must be a positive number");
        }
        if (!Number.isInteger(options.maxKeys) || options.maxKeys < 1) {
            throw new RangeError("[rateLimit] maxKeys must be a positive integer");
        }
        this.capacity = options.capacity;
        this.refillPerSecond = options.refillPerSecond;
        this.maxKeys = options.maxKeys;
        this.idleToFullMs = (options.capacity / options.refillPerSecond) * 1_000;
    }

    consume(key: string): RateLimitDecision {
        const now = performance.now();
        this.evictIdleFromHead(now);

        let tokens = this.capacity;
        const existing = this.buckets.get(key);
        if (existing) {
            const elapsedSeconds = Math.max(0, (now - existing.updatedAt) / 1_000);
            tokens = Math.min(
                this.capacity,
                existing.tokens + elapsedSeconds * this.refillPerSecond
            );
            this.buckets.delete(key); // re-insert below => most recently used
        }

        const allowed = tokens >= 1;
        if (allowed) tokens -= 1;

        this.buckets.set(key, { tokens, updatedAt: now });

        while (this.buckets.size > this.maxKeys) {
            const oldest = this.buckets.keys().next();
            if (oldest.done) break;
            this.buckets.delete(oldest.value);
        }

        return {
            allowed,
            retryAfterSeconds: allowed
                ? 0
                : Math.max(1, Math.ceil((1 - tokens) / this.refillPerSecond)),
        };
    }

    // A bucket idle long enough to be full again equals a brand-new one, so
    // dropping it is lossless.
    private evictIdleFromHead(now: number): void {
        for (const [key, bucket] of this.buckets) {
            if (now - bucket.updatedAt < this.idleToFullMs) break;
            this.buckets.delete(key);
        }
    }
}

// "N requests per minute" with a one-minute burst allowance.
export function createPerMinuteLimiter(
    limitPerMinute: number,
    maxKeys: number
): TokenBucketLimiter {
    return new TokenBucketLimiter({
        capacity: limitPerMinute,
        refillPerSecond: limitPerMinute / 60,
        maxKeys,
    });
}