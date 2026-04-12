import type { Configuration } from "@azure/msal-browser";

if (!process.env.NEXT_PUBLIC_MSAL_CLIENT_ID) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_MSAL_CLIENT_ID");
}

if (!process.env.NEXT_PUBLIC_MSAL_TENANT) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_MSAL_TENANT");
}

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_MSAL_TENANT}`,
    redirectUri: "/redirect",
    postLogoutRedirectUri: "/",
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