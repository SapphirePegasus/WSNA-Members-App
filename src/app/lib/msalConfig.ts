// src/lib/msalConfig.ts
import { PublicClientApplication, type Configuration } from "@azure/msal-browser";

const clientId = process.env.NEXT_PUBLIC_MSAL_CLIENT_ID!;
const tenantIdOrCommon = process.env.NEXT_PUBLIC_MSAL_TENANT || "common"; // set tenant or "common"
const redirectUri = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantIdOrCommon}`, // tenant or 'common'
    redirectUri,
  },
  cache: {
    cacheLocation: "localStorage", // or "sessionStorage" — choose what fits your app
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      // helpful for debugging
      loggerCallback: (/*level, message*/) => {
        // you can filter logs here
        // console.log(level, message);
      },
      piiLoggingEnabled: false,
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
