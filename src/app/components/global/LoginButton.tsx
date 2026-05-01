"use client";

import React from "react";
import { useUser } from "@/app/components/global/UserInfo";
import { WsnaFullNameBlue } from "@/app/utils/icons";

export default function LoginButton() {
  const { user, contact, status, login, logout } = useUser();

  return (
    <div
      className="
        min-h-screen
        bg-[url('/background.svg')]
        bg-center
        bg-cover
        bg-no-repeat
        flex
        flex-col
        fixed
        inset-0 
        z-50 
        overflow-hidden
      "
    >
      {/* PLEASE REMOVE FIXED, INSET, Z, OVERFLOW FROM ABOVE WHEN THERE IS DEDICATED /LOGIN PAGE */}
      {/* Logo */}
      <div className="m-8 flex justify-center md:justify-start">
        <WsnaFullNameBlue className="h-6 w-auto" />
      </div>

      {/* Center Content */}
      <div className="flex flex-1 items-center justify-center">
        {!user ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#0a2a4a] mb-2">
              My WSNA
            </h1>

            <p className="text-sm text-[#1f3c5b] mb-6">
              Sign in with your account that is registered with WSNA
            </p>

            <button
              onClick={login}
              className="px-5 py-2 rounded-full bg-primary text-white text-sm font-medium hover:opacity-90 transition"
            >
              Sign in
            </button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-semibold text-[#0a2a4a]">
              Welcome
            </h1>

            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-medium">{user.name}</p>
              <p>{user.email}</p>
              {/*<p>WSNA ID: {contact?.employeeid}</p>
              <p>AFT ID: {contact?.wsna_aftid}</p>
              <p>ANA ID: {contact?.department}</p>*/}

              {status === "loading" && (
                <p className="text-gray-500 text-xs">
                  Checking membership...
                </p>
              )}
              {status === "not-registered" && (
                <p className="text-red-500 text-xs">
                  Not registered in WSNA database
                </p>
              )}
              {status === "registered" && (
                <p className="text-green-600 text-xs">
                  Registered in WSNA
                </p>
              )}
            </div>

            <button
              onClick={logout}
              className="mt-4 px-5 py-2 rounded-full bg-primary text-white text-sm font-medium hover:opacity-90 transition"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}