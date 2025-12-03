// src/components/MsalProviderClient.tsx
"use client";
import React from "react";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "@/app/lib/msalConfig";

export default function MsalProviderClient({ children }: { children: React.ReactNode }) {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
