"use client";

import { useEffect } from "react";
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

export default function RedirectPage() {
    useEffect(() => {
        broadcastResponseToMainFrame().catch((error: Error) => {
            console.error("[MSAL Redirect Bridge] Error:", error);
        });
    }, []);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                width: "100vw",
                backgroundColor: "#ffffff",
                gap: "16px",
            }}
        >
            {/* WSNA brand color spinner — matches --primary: #0057b8 from globals.css */}
            <div
                style={{
                    width: "36px",
                    height: "36px",
                    border: "4px solid #e5e7eb",
                    borderTopColor: "#0057b8",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                }}
            />
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
            <p
                style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: "14px",
                    color: "#6b7280",
                    margin: 0,
                }}
            >
                Signing you in...
            </p>
        </div>
    );
}



/*"use client";

import { useEffect } from "react";
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

export default function RedirectPage() {
    useEffect(() => {
        broadcastResponseToMainFrame().catch((error: Error) => {
            console.error("[MSAL Redirect Bridge] Error:", error);
        });
    }, []);

    return <p>Processing authentication...</p>;
}*/