"use client";

import React, { useState } from "react";
import { useUser } from "@/app/components/global/UserInfo";
import AuthToast from "@/app/components/global/AuthToast";
import { WsnaFullNameBlue } from "@/app/utils/icons";

export default function LoginButton() {
  const { user, status, login, authError, clearAuthError, retry } =
    useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (source: "workforce" | "external") => {
    setIsLoading(true);
    const onFocus = () => setTimeout(() => setIsLoading(false), 500);
    window.addEventListener("focus", onFocus, { once: true });
    try {
      await login(source);
    } catch {
    } finally {
      window.removeEventListener("focus", onFocus);
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsLoading(true);
    try {
      await retry();
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if auth is in-flight after the popup resolved
  const isAuthInProgress = isLoading || status === "loading";

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
              Sign in with your WSNA account
            </p>
            <button
              onClick={() => handleLogin("workforce")}
              disabled={isAuthInProgress}
              className="
                inline-flex items-center justify-center gap-2
                px-5 py-2 rounded-full
                bg-primary text-white text-sm font-medium
                hover:opacity-90 transition
                disabled:opacity-70 disabled:cursor-not-allowed
              "
            >
              {isAuthInProgress ? (
                <>
                  <span
                    className="
                      w-4 h-4 rounded-full
                      border-2 border-white/30 border-t-white
                      animate-spin
                    "
                  />
                  Please Wait...
                </>
              ) : (
                "Sign in"
              )}
            </button>

            {/* Email one-time-passcode entry point - for users without a
                Microsoft account. Kept visually secondary on purpose so the
                existing sign-in experience is unchanged. */}
            <p className="mt-4 text-xs text-[#1f3c5b]">
              Can't login above?{" "}
              <button
                type="button"
                onClick={() => handleLogin("external")}
                disabled={isAuthInProgress}
                className="
                  underline underline-offset-2 font-medium
                  hover:opacity-80 transition
                  disabled:opacity-70 disabled:cursor-not-allowed
                "
              >
                Click here
              </button>
            </p>
          </div>
        ) : (
          // User is signed in but auth/membership check is still resolving
          // Show minimal state - no debug text
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold text-[#0a2a4a] mb-2">
              Welcome
            </h1>
            <div className="text-sm sm:text-base md:text-lg text-gray-700 space-y-1">
              <p className="font-medium">{user.name}</p>
            </div>
            {isAuthInProgress && (
              <div className="flex justify-center pt-2">
                <span
                  className="
                    w-5 h-5 rounded-full
                    border-2 border-primary/30 border-t-primary
                    animate-spin
                  "
                />
                &nbsp; Please Wait...
              </div>
            )}
          </div>
        )}
      </div>

      <AuthToast
        error={authError}
        onRetry={handleRetry}
        onDismiss={clearAuthError}
      />
    </div>
  );
}