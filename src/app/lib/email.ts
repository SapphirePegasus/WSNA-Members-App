// ─────────────────────────────────────────────────────────────────────────────
// Email normalisation - ONE definition used for Dataverse lookups, rate-limit
// keys and proof binding, so they can never disagree about identity.
// The address comes from a signature-verified token, so this is a guard rail.
// Both regexes are linear-time. Apostrophes are valid and allowed (DATA-01).
// ─────────────────────────────────────────────────────────────────────────────

export const EMAIL_MAX_LENGTH = 254; // practical RFC 5321 maximum
const RAW_INPUT_CAP = 1_024;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+$/;

// Returns the canonical form, or null when the value is not a usable address.
export function normalizeEmail(raw: string): string | null {
    if (raw.length === 0 || raw.length > RAW_INPUT_CAP) return null;

    const value = raw.trim().toLowerCase();
    if (value.length === 0 || value.length > EMAIL_MAX_LENGTH) return null;

    return EMAIL_SHAPE.test(value) ? value : null;
}