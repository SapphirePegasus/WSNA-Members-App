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
//
// Note on navigateToLoginRequestUrl: in @azure/msal-browser v4+ (we're on
// v5.5.0) this is no longer part of BrowserAuthOptions here - it moved to
// a parameter on handleRedirectPromise() itself. See authClient.ts
// (resumeSession), where it's set to false for the same reason it would
// have lived here in v3: both flows use loginRedirect, always initiated
// from "/", and MSAL's default is to silently navigate the SPA back to
// that URL once handleRedirectPromise() resolves - which would fight our
// own redirect/page.tsx navigation to the deep-link target or /home.
// ─────────────────────────────────────────────────────────────────────────────
const sharedCacheAndSystem = {
  cache: {
    cacheLocation: "sessionStorage" as const,
  },
  system: {
    loggerOptions: {
      loggerCallback: () => { },
      piiLoggingEnabled: false,
    },
  },
  // `satisfies` forces excess-property checking on this literal, so a
  // mistyped or unsupported MSAL option name fails compilation instead of
  // being silently ignored at runtime.
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