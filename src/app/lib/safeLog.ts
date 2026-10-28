// ─────────────────────────────────────────────────────────────────────────────
// Safe logging (PRIV-01).
// Production logs must never contain emails, tokens, authorization headers,
// secrets, CRM identifiers or raw bodies. Rules:
//   1. Never log a raw error OBJECT (it can carry causes, URLs, upstream bodies).
//   2. Sanitise even our own messages: redaction is defence in depth.
// ─────────────────────────────────────────────────────────────────────────────

const REGEX_INPUT_CAP = 2_000; // bounds regex work on hostile/huge messages
const MAX_MESSAGE_LENGTH = 300;

const CONTROL_CHARS = /[\u0000-\u001f\u007f]+/g; // blocks log injection
const BEARER = /Bearer\s+\S+/gi;
const JWT_LIKE = /eyJ[\w-]+\.[\w-]+\.[\w-]*/g;
const EMAIL_LIKE = /[^\s@]+@[^\s@]+/g;
const GUID =
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

function sanitizeMessage(message: string): string {
    return message
        .slice(0, REGEX_INPUT_CAP)
        .replace(CONTROL_CHARS, " ")
        .replace(BEARER, "[redacted-token]")
        .replace(JWT_LIKE, "[redacted-token]")
        .replace(EMAIL_LIKE, "[redacted-email]")
        .replace(GUID, "[redacted-id]")
        .slice(0, MAX_MESSAGE_LENGTH);
}

// Short machine codes only (e.g. ECONNRESET).
function safeCode(err: Error): string | null {
    const code = (err as { code?: unknown }).code;
    return typeof code === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(code)
        ? code
        : null;
}

// Replaces `console.error("...", err)` everywhere in server code.
export function logSafeError(scope: string, err: unknown): void {
    if (err instanceof Error) {
        const code = safeCode(err);
        console.error(
            `[${scope}] ${err.name}${code ? `(${code})` : ""}: ${sanitizeMessage(err.message)}`
        );
        return;
    }
    console.error(`[${scope}] Non-Error value thrown (${typeof err})`);
}

// Structured single-line JSON metric events for log aggregation (e.g. the
// daily Dataverse request count). NEVER pass an email, token, GUID or any
// identifier as a field value - only outcomes, counters and status codes.
type EventFields = Readonly<Record<string, string | number | boolean>>;

export function logEvent(event: string, fields: EventFields = {}): void {
    console.info(JSON.stringify({ event, ...fields }));
}