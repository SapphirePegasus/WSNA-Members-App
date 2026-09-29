import {
    getDataverseTenantId,
    getDataverseClientId,
    getDataverseClientSecret,
    getDataverseUrl,
} from "@/app/lib/env";

// ─────────────────────────────────────────────────────────────────────────────
// DATAVERSE CLIENT
// Handles authentication and all HTTP communication with Microsoft Dataverse.
//
// Error handling:
//   - Raw error response bodies are never logged in full
//   - Only the HTTP status code and a sanitized error code are logged
//   - The full error detail is captured but stored separately from the
//     message that propagates up the call stack
//   - This prevents internal schema details leaking into log aggregators
// ─────────────────────────────────────────────────────────────────────────────

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// SANITIZE DATAVERSE ERROR
// Extracts only the safe parts of a Dataverse OData error response.
// The full body is never logged - only the error code, which is a short
// string like "0x80040217" or "ObjectDoesNotExist" that identifies the
// error type without exposing schema internals.
//
// The full detail is returned separately so it can be used for debugging
// in a controlled way - for example, only in development mode.
// ─────────────────────────────────────────────────────────────────────────────
interface SanitizedError {
    code: string;
    fullDetail: string; // never log this directly in production
}

async function sanitizeDataverseError(
    res: Response
): Promise<SanitizedError> {
    let fullDetail = "[could not read response body]";
    let code = `HTTP_${res.status}`;

    try {
        const text = await res.text();
        fullDetail = text;

        // Dataverse OData errors follow a predictable JSON shape:
        // { "error": { "code": "...", "message": "..." } }
        // Extract only the code - message often contains table/field names
        const parsed = JSON.parse(text) as {
            error?: { code?: string; message?: string };
        };

        if (parsed?.error?.code) {
            code = parsed.error.code;
        }
    } catch {
        // Body was not JSON or could not be read - use the HTTP status code only
    }

    return { code, fullDetail };
}

// ─────────────────────────────────────────────────────────────────────────────
// SANITIZE TOKEN ERROR
// Microsoft token endpoint errors are OAuth standard:
// { "error": "...", "error_description": "..." }
// The error_description often contains tenant and credential details.
// We log only the error code, never the description.
// ─────────────────────────────────────────────────────────────────────────────
async function sanitizeTokenError(
    res: Response
): Promise<SanitizedError> {
    let fullDetail = "[could not read response body]";
    let code = `HTTP_${res.status}`;

    try {
        const text = await res.text();
        fullDetail = text;

        // OAuth error response: { "error": "...", "error_description": "..." }
        const parsed = JSON.parse(text) as {
            error?: string;
            error_description?: string;
        };

        if (parsed?.error) {
            code = parsed.error;
        }
    } catch {
        // Body was not JSON - use HTTP status only
    }

    return { code, fullDetail };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET DATAVERSE ACCESS TOKEN
// Acquires a client credentials token from Microsoft Identity Platform.
// Token is cached with a 60 second safety margin on expiry.
// ─────────────────────────────────────────────────────────────────────────────
async function getDataverseAccessToken(): Promise<string> {
    const now = Date.now();

    if (cachedToken && cachedToken.expiresAt > now + 60_000) {
        return cachedToken.accessToken;
    }

    const tenantId = getDataverseTenantId();
    const clientId = getDataverseClientId();
    const clientSecret = getDataverseClientSecret();
    const dataverseUrl = getDataverseUrl();

    const tokenResponse = await fetch(
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
        }
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

        throw new Error(
            `Failed to acquire Dataverse token - code: ${code}`
        );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token as string;
    const expiresIn = tokenData.expires_in as number;

    cachedToken = {
        accessToken,
        expiresAt: Date.now() + expiresIn * 1000,
    };

    return accessToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// CALL DATAVERSE
// Makes an authenticated request to the Dataverse Web API.
// All requests include OData headers required for Dataverse v9.2.
// ─────────────────────────────────────────────────────────────────────────────
export async function callDataverse(path: string, init?: RequestInit) {
    const dataverseUrl = getDataverseUrl();
    const token = await getDataverseAccessToken();

    const res = await fetch(`${dataverseUrl}${path}`, {
        ...init,
        headers: {
            ...(init?.headers || {}),
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json; charset=utf-8",
            Prefer: 'odata.include-annotations="*"',
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
        },
    });

    if (!res.ok) {
        const { code, fullDetail } = await sanitizeDataverseError(res);

        // Log only the error code - never the full OData error body in production
        console.error(
            `[dataverse] API error - status: ${res.status}, code: ${code}, path: ${path}`
        );

        // In development, log full detail to aid debugging
        if (process.env.NODE_ENV === "development") {
            console.error("[dataverse] Error detail (dev only):", fullDetail);
        }

        throw new Error(
            `Dataverse API error - status: ${res.status}, code: ${code}`
        );
    }

    return res.json();
}