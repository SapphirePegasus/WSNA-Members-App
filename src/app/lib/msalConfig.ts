import type { Configuration } from "@azure/msal-browser";
import {
  getMsalClientId,
  getMsalTenant,
  getMsalRedirectUri,
  getExternalClientId,
  getExternalTenantId,
  getExternalTenantSubdomain,
} from "@/app/lib/env";

// ─────────────────────────────────────────────────────────────────────────────
// Two MSAL configurations, one per identity system:
//
//   WORKFORCE - https://login.microsoftonline.com/{common}
//     Existing users: @wsna.org staff and personal Microsoft accounts.
//     Identical to the pre-External-ID behaviour. Do not change.
//
//   EXTERNAL  - https://{subdomain}.ciamlogin.com/{tenant-id}
//     Entra External ID tenant. Email one-time-passcode sign-in for users
//     without a Microsoft account.
//
// Configs are built lazily (functions, not module-level constants) so a
// missing EXTERNAL_* variable can never break the workforce sign-in path,
// and vice versa. Failure stays isolated to the flow that needs the value.
//
// knownAuthorities note (do not remove either entry): the External ID
// discovery document serves its jwks_uri on {subdomain}.ciamlogin.com but
// reports its issuer on {tenant-id}.ciamlogin.com. MSAL validates the
// issuer host against this list - with only the subdomain present, login
// aborts with endpoints_resolution_error / issuer_validation_failed.
// ─────────────────────────────────────────────────────────────────────────────

// `satisfies` forces excess-property checking on this literal, so a
// mistyped or removed MSAL option name fails compilation instead of being
// silently ignored at runtime. (windowHashTimeout, the v3/v4 name for the
// popup timeout, was removed in msal-browser v5 - exactly the failure mode
// this annotation exists to catch.)
const sharedCacheAndSystem = {
  cache: {
    cacheLocation: "sessionStorage" as const,
  },
  system: {
    // How long MSAL waits for the popup's response (via the redirect-bridge
    // BroadcastChannel) before failing the login. The v5 default is 60_000ms
    // (DEFAULT_POPUP_TIMEOUT_MS) - too short for email one-time-passcode
    // flows, where the user has to switch to their inbox, wait for the
    // code, and type it. 5 minutes is realistic. The silent-iframe timeout
    // (iframeBridgeTimeout, default 10s) is intentionally left alone.
    popupBridgeTimeout: 300_000,
    loggerOptions: {
      loggerCallback: () => { },
      piiLoggingEnabled: false,
    },
  },
} satisfies Pick<Configuration, "cache" | "system">;

export function getWorkforceMsalConfig(): Configuration {
  return {
    auth: {
      clientId: getMsalClientId(),
      authority: `https://login.microsoftonline.com/${getMsalTenant()}`,
      redirectUri: getMsalRedirectUri(),
      postLogoutRedirectUri: "/redirect",
    },
    ...sharedCacheAndSystem,
  };
}

export function getExternalMsalConfig(): Configuration {
  const subdomain = getExternalTenantSubdomain();
  const tenantId = getExternalTenantId();

  return {
    auth: {
      clientId: getExternalClientId(),
      authority: `https://${subdomain}.ciamlogin.com/${tenantId}`,
      knownAuthorities: [
        `${subdomain}.ciamlogin.com`,
        `${tenantId}.ciamlogin.com`,
      ],
      redirectUri: getMsalRedirectUri(),
      postLogoutRedirectUri: "/redirect",
    },
    ...sharedCacheAndSystem,
  };
}

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
  prompt: "select_account" as const,
};

