let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getDataverseAccessToken(): Promise<string> {
    const now = Date.now();

    // reuse token if not expired (60s safety margin)
    if (cachedToken && cachedToken.expiresAt > now + 60_000) {
        return cachedToken.accessToken;
    }

    const tenantId = process.env.DATAVERSE_TENANT_ID!;
    const clientId = process.env.DATAVERSE_CLIENT_ID!;
    const clientSecret = process.env.DATAVERSE_CLIENT_SECRET!;
    const dataverseUrl = process.env.DATAVERSE_URL!;

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
        const errorText = await tokenResponse.text();
        console.error("Failed to get Dataverse token:", errorText);
        throw new Error("Failed to get Dataverse token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token as string;
    const expiresIn = tokenData.expires_in as number; // seconds

    cachedToken = {
        accessToken,
        expiresAt: Date.now() + expiresIn * 1000,
    };

    return accessToken;
}

export async function callDataverse(path: string, init?: RequestInit) {
    const dataverseUrl = process.env.DATAVERSE_URL!;
    const token = await getDataverseAccessToken();

    const res = await fetch(`${dataverseUrl}${path}`, {
        ...init,
        headers: {
            ...(init?.headers || {}),
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "Prefer": 'odata.include-annotations="*"',
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
        },
    });

    if (!res.ok) {
        const text = await res.text();
        console.error("Dataverse API error:", res.status, text);
        throw new Error(`Dataverse API error: ${res.status}`);
    }

    return res.json();
}
