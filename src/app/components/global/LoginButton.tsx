"use client";

import React from "react";
import { useUser } from "@/app/components/global/UserInfo";

export default function LoginButton() {
  const { user, contact, status, login, logout } = useUser();

  const displayName = user?.name || "";
  const email = user?.email || "";

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "50px" }}>
      {user ? (
        <>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 600 }}>{displayName}</span>
            <span style={{ fontSize: 12 }}>{email}</span>
            <span style={{ fontSize: 12 }}>WSNA ID: {contact?.employeeid}</span>
            <span style={{ fontSize: 12 }}>AFT ID: {contact?.wsna_aftid}</span>
            <span style={{ fontSize: 12 }}>ANA ID: {contact?.department}</span>

            {/* Show membership status message below email */}
            {status === "loading" && (
              <span style={{ fontSize: 11, color: "gray" }}>Checking membership...</span>
            )}
            {status === "not-registered" && (
              <span style={{ fontSize: 11, color: "red" }}>
                Not registered in WSNA database
              </span>
            )}
            {status === "registered" && (
              <span style={{ fontSize: 11, color: "green" }}>
                Registered in WSNA
              </span>
            )}

            <button onClick={logout}>Sign out</button>

          </div>


        </>
      ) : (
        <button onClick={login}>Click Here to Sign In</button>
      )}
    </div>
  );
}
