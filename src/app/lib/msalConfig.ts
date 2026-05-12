import type { Configuration } from "@azure/msal-browser";
import {
  getMsalClientId,
  getMsalTenant,
  getMsalRedirectUri,
} from "@/app/lib/env";

// msalConfig and loginRequest are plain objects - their property values
// are functions called here at module evaluation time. This is fine on
// the server. On the client, Next.js inlines NEXT_PUBLIC_ literals before
// the module evaluates, so the getters resolve correctly in both contexts.
export const msalConfig: Configuration = {
  auth: {
    clientId: getMsalClientId(),
    authority: `https://login.microsoftonline.com/${getMsalTenant()}`,
    redirectUri: getMsalRedirectUri(),
    postLogoutRedirectUri: "/redirect",
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
  system: {
    loggerOptions: {
      loggerCallback: () => { },
      piiLoggingEnabled: false,
    },
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
  prompt: "select_account" as const,
};