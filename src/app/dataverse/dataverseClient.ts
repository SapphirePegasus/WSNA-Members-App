import {
    getDataverseTenantId,
    getDataverseClientId,
    getDataverseClientSecret,
    getDataverseUrl,
} from "@/app/lib/env";
import { LIMITS } from "@/config/limits";
import { logEvent } from "@/app/lib/safeLog";
import {
    UpstreamUnavailableError,
    fetchWithTimeout,
    readJson,
    retryAfterSeconds,
    DEFAULT_RETRY_AFTER_SECONDS,
} from "@/app/lib/upstream";

// ─────────────────────────────────────────────────────────────────────────────
// DATAVERSE CLIENT
// Handles authentication and all HTTP communication with Microsoft Dataverse.
//
//   - Every call has a hard timeout.
//   - 429 / 5xx / timeouts become UpstreamUnavailableError (routes answer 503
//     with Retry-After). There are NO automatic retries: a retry would spend
//     more of the tenant's daily request pool, and the client retries on its
//     next load anyway.
//   - The access token is cached and fetched single-flight.
//   - Every HTTP request emits a "dataverse.request" event. The daily count of
//     those is your consumption of the tenant's request pool (Microsoft's
//     admin-center reports do not cover Dataverse).
//
// Privacy (PRIV-01): raw error bodies are never logged in production; only the
// status and a sanitized code are. The request path is logged WITHOUT its
// query string or record keys (filters carry emails, keys carry CRM GUIDs).
// ─────────────────────────────────────────────────────────────────────────────

// Every call must target the Web API on the configured host. This stops a
// future caller from building a path that sends the bearer token elsewhere.
const API_PATH_PREFIX = "/api/data/v9.2/";
const TOKEN_REFRESH_MARGIN_MS = 60_000;

let cachedToken: { accessToken: string; expiresAt: number } | null = null;
let tokenInflight: Promise<string> | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// PATH FOR LOG (PRIV-01)
// Drops the query string (OData $filter values contain member emails) and
// replaces parenthesised record keys, e.g. contacts(<guid>).
// ─────────────────────────────────────────────────────────────────────────────
function pathForLog(path: string): string {
    return path.split("?")[0].replace(/\([^)]*\)/g, "(redacted)");
}

// ─────────────────────────────────────────────────────────────────────────────
// SANITIZE ERRORS
// Extract only the short error code from Dataverse / token endpoint error
// bodies. Messages often contain table, field, tenant and credential details,
// so the full text is never logged in production.
// ─────────────────────────────────────────────────────────────────────────────
interface SanitizedError {
    code: string;
    fullDetail: string; // development only - never log in production
}

async function sanitizeDataverseError(res: Response): Promise<SanitizedError> {
    let fullDetail = "[could not read response body]";
    let code = `HTTP_${res.status}`;

    try {
        const text = await res.text();
        fullDetail = text;

        // { "error": { "code": "...", "message": "..." } }
        const parsed = JSON.parse(text) as {
            error?: { code?: string; message?: string };
        };
        if (parsed?.error?.code) code = parsed.error.code;
    } catch {
        // Not JSON or unreadable - keep the HTTP status code only.
    }

    return { code, fullDetail };
}

async function sanitizeTokenError(res: Response): Promise<SanitizedError> {
    let fullDetail = "[could not read response body]";
    let code = `HTTP_${res.status}`;

    try {
        const text = await res.text();
        fullDetail = text;

        // { "error": "...", "error_description": "..." }
        const parsed = JSON.parse(text) as {
            error?: string;
            error_description?: string;
        };
        if (parsed?.error) code = parsed.error;
    } catch {
        // Not JSON - keep the HTTP status code only.
    }

    return { code, fullDetail };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS TOKEN
// Client-credentials token, cached with a 60 s safety margin. Single-flight:
// concurrent callers share ONE in-flight request instead of each calling the
// token endpoint.
// ─────────────────────────────────────────────────────────────────────────────
function parseTokenResponse(data: unknown): {
    accessToken: string;
    expiresInSeconds: number;
} {
    const record =
        typeof data === "object" && data !== null
            ? (data as { access_token?: unknown; expires_in?: unknown })
            : {};
    const expiresInSeconds = Number(record.expires_in);

    if (
        typeof record.access_token !== "string" ||
        record.access_token === "" ||
        !Number.isFinite(expiresInSeconds) ||
        expiresInSeconds <= 0
    ) {
        throw new UpstreamUnavailableError("upstream-error");
    }

    return { accessToken: record.access_token, expiresInSeconds };
}

async function requestAccessToken(): Promise<string> {
    const tenantId = getDataverseTenantId();
    const clientId = getDataverseClientId();
    const clientSecret = getDataverseClientSecret();
    const dataverseUrl = getDataverseUrl();

    const tokenResponse = await fetchWithTimeout(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                scope: `${dataverseUrl}/.default`,
                grant_type: "client_credentials",
            }),
        },
        LIMITS.upstream.timeoutMs
    );

    if (!tokenResponse.ok) {
        const { code, fullDetail } = await sanitizeTokenError(tokenResponse);

        // Log only the error code - never the full detail in production
        console.error(
            `[dataverse] Token acquisition failed - status: ${tokenResponse.status}, code: ${code}`
        );

        // In development, log full detail to aid debugging
        if (process.env.NODE_ENV === "development") {
            console.error("[dataverse] Token error detail (dev only):", fullDetail);
        }

        // 429 / 5xx from the identity platform are transient. Anything else
        // (invalid_client, invalid_scope, ...) is a configuration fault that
        // retrying cannot fix, so it stays a plain Error (route answers 500).
        if (tokenResponse.status === 429 || tokenResponse.status >= 500) {
            throw new UpstreamUnavailableError(
                "upstream-error",
                retryAfterSeconds(tokenResponse.headers.get("Retry-After"))
            );
        }

        throw new Error(`Failed to acquire Dataverse token - code: ${code}`);
    }

    const { accessToken, expiresInSeconds } = parseTokenResponse(
        await readJson(tokenResponse)
    );

    cachedToken = {
        accessToken,
        expiresAt: Date.now() + expiresInSeconds * 1_000,
    };

    return accessToken;
}

function getDataverseAccessToken(): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_REFRESH_MARGIN_MS) {
        return Promise.resolve(cachedToken.accessToken);
    }
    if (tokenInflight) return tokenInflight;

    tokenInflight = requestAccessToken().finally(() => {
        tokenInflight = null;
    });
    return tokenInflight;
}

// One metric event per HTTP request to Dataverse. Contains only an outcome
// label, a status and a duration - never a path, identifier or personal data.
function logRequest(outcome: string, startedAt: number, status?: number): void {
    const fields: Record<string, string | number | boolean> = {
        outcome,
        durationMs: Math.round(performance.now() - startedAt),
    };
    if (status !== undefined) fields.status = status;
    logEvent("dataverse.request", fields);
}

// ─────────────────────────────────────────────────────────────────────────────
// CALL DATAVERSE
// Makes an authenticated request to the Dataverse Web API (v9.2 OData headers).
//
// Throws:
//   UpstreamUnavailableError - timeout, network failure, 429, 5xx. Callers
//       answer 503 + Retry-After.
//   Error                    - Dataverse rejected the request (4xx) or a
//       configuration fault. Callers answer 500.
// Returns the parsed JSON body as `unknown`; callers must validate its shape.
// ─────────────────────────────────────────────────────────────────────────────
export async function callDataverse(
    path: string,
    init?: RequestInit
): Promise<unknown> {
    if (!path.startsWith(API_PATH_PREFIX)) {
        throw new Error("[dataverse] Invalid request path");
    }

    const token = await getDataverseAccessToken();

    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json; charset=utf-8");
    headers.set("Prefer", 'odata.include-annotations="*"');
    headers.set("OData-MaxVersion", "4.0");
    headers.set("OData-Version", "4.0");

    const startedAt = performance.now();

    let res: Response;
    try {
        res = await fetchWithTimeout(
            `${getDataverseUrl()}${path}`,
            { ...init, headers },
            LIMITS.upstream.timeoutMs
        );
    } catch (err) {
        logRequest(err instanceof UpstreamUnavailableError ? err.reason : "error", startedAt);
        throw err;
    }

    if (!res.ok) {
        const { code, fullDetail } = await sanitizeDataverseError(res);

        // Log only the error code and a redacted path - never the query
        // string, record keys, or the full OData error body.
        console.error(
            `[dataverse] API error - status: ${res.status}, code: ${code}, path: ${pathForLog(path)}`
        );

        // In development, log full detail to aid debugging
        if (process.env.NODE_ENV === "development") {
            console.error("[dataverse] Error detail (dev only):", fullDetail);
        }

        if (res.status === 429) {
            logRequest("throttled", startedAt, res.status);
            throw new UpstreamUnavailableError(
                "throttled",
                retryAfterSeconds(res.headers.get("Retry-After"))
            );
        }
        if (res.status >= 500) {
            logRequest("server_error", startedAt, res.status);
            throw new UpstreamUnavailableError("upstream-error", DEFAULT_RETRY_AFTER_SECONDS);
        }

        logRequest("client_error", startedAt, res.status);
        throw new Error(`Dataverse API error - status: ${res.status}, code: ${code}`);
    }

    try {
        const data = await readJson(res);
        logRequest("ok", startedAt, res.status);
        return data;
    } catch (err) {
        logRequest(
            err instanceof UpstreamUnavailableError ? err.reason : "error",
            startedAt,
            res.status
        );
        throw err;
    }
}