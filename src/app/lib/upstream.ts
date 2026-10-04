// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers for calls to upstream systems (Dataverse, Craft CMS).
//
//   UpstreamUnavailableError - "the upstream cannot serve this right now".
//       Routes map it to HTTP 503 + Retry-After. Deliberately distinct from
//       "not eligible", so an outage is never shown as "not a member".
//   fetchWithTimeout - every outbound call has a hard deadline.
//   readJson         - body read errors / malformed bodies become upstream errors.
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_RETRY_AFTER_SECONDS = 5;
const MAX_RETRY_AFTER_SECONDS = 60;

export type UpstreamFailureReason =
    | "timeout"
    | "network"
    | "throttled" // upstream returned 429
    | "upstream-error"; // 5xx or malformed response

export class UpstreamUnavailableError extends Error {
    constructor(
        public readonly reason: UpstreamFailureReason,
        public readonly retryAfterSeconds: number = DEFAULT_RETRY_AFTER_SECONDS
    ) {
        super(`Upstream unavailable: ${reason}`);
        this.name = "UpstreamUnavailableError";
    }
}

function isTimeoutError(err: unknown): boolean {
    return (
        typeof err === "object" &&
        err !== null &&
        (err as { name?: unknown }).name === "TimeoutError"
    );
}

// The deadline stays armed while the response BODY is read, so a stalled
// stream is also bounded.
export async function fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number
): Promise<Response> {
    try {
        return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
        throw new UpstreamUnavailableError(isTimeoutError(err) ? "timeout" : "network");
    }
}

export async function readJson(res: Response): Promise<unknown> {
    try {
        return await res.json();
    } catch (err) {
        throw new UpstreamUnavailableError(
            isTimeoutError(err) ? "timeout" : "upstream-error"
        );
    }
}

// Retry-After is delta-seconds or an HTTP-date (RFC 9110). What we tell OUR
// client to wait: at least 1 s, at most a minute.
export function retryAfterSeconds(header: string | null): number {
    if (header === null) return DEFAULT_RETRY_AFTER_SECONDS;

    const value = header.trim();
    let seconds: number;

    if (/^\d+$/.test(value)) {
        seconds = Number(value);
    } else {
        const ms = Date.parse(value) - Date.now();
        if (Number.isNaN(ms)) return DEFAULT_RETRY_AFTER_SECONDS;
        seconds = Math.ceil(ms / 1_000);
    }

    return Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(1, seconds));
}