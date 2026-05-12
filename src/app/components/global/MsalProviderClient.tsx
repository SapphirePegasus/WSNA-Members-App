"use client";

import React, { useState, useEffect } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "@/app/lib/msalConfig";

let msalInstance: PublicClientApplication | null = null;

function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}

export default function MsalProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [instance, setInstance] =
    useState<PublicClientApplication | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const client = getMsalInstance();
        await client.initialize();

        // Listen for the postMessage signal from the /auth popup page.
        // When the popup sends its URL, MSAL processes the auth response
        // and completes the loginPopup() promise in UserProvider.
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (typeof event.data !== "string") return;
          if (!event.data.includes("code=") && !event.data.includes("error=")) return;

          try {
            await client.handleRedirectPromise();
          } catch (err) {
            console.error("[MsalProviderClient] handleRedirectPromise failed:", err);
          }
        };

        window.addEventListener("message", handleMessage);
        setInstance(client);

        return () => {
          window.removeEventListener("message", handleMessage);
        };
      } catch (err) {
        console.error("[MsalProviderClient] Initialization failed:", err);
      }
    };

    init();
  }, []);

  if (!instance) return null;

  return <MsalProvider instance={instance}>{children}</MsalProvider>;
}
