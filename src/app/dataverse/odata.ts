// Pure helpers for Dataverse OData query fragments. No imports, no I/O,
// so they can be unit tested in isolation.

const FIELD_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

// OData requires a literal apostrophe inside a string literal to be doubled.
export function escapeODataString(value: string): string {
    return value.replace(/'/g, "''");
}

// Escape (OData layer) THEN encode (URL layer). Order matters, so both
// steps live in one function. `field` is developer-supplied, never user
// input; it is validated anyway so future misuse fails.
export function buildODataEqFilter(field: string, value: string): string {
    if (!FIELD_NAME_PATTERN.test(field)) {
        throw new Error("[odata] Invalid field name");
    }
    return encodeURIComponent(`${field} eq '${escapeODataString(value)}'`);
}