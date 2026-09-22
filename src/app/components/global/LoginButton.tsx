"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/app/components/global/UserInfo";
import AuthToast from "@/app/components/global/AuthToast";
import { WsnaFullNameBlue } from "@/app/utils/icons";

// ── TEMP (MOB-05/08/09 diagnosis): delete this block and every <TempDebugLabel /> after QA ──
const TEMP_DEBUG_LABEL = true;
const PRODUCTION_HOST = "my.wsna.org"; // never shows on production
const MODES = ["off", "red-canvas", "gap-fix"] as const;
const UNITS = ["vh", "lvh", "svh", "dvh"] as const;

export function TempDebugLabel() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState(0);
  const modeRef = useRef(0);

  // Mode 1: paint the page canvas red to see whether the webview covers the gap.
  useEffect(() => {
    if (!TEMP_DEBUG_LABEL || window.location.hostname === PRODUCTION_HOST) return;
    const root = document.documentElement;
    if (mode === 1) root.style.background = "#ff0000";
    return () => {
      root.style.background = "";
    };
  }, [mode]);

  useEffect(() => {
    if (!TEMP_DEBUG_LABEL || window.location.hostname === PRODUCTION_HOST) return;

    const root = document.documentElement;

    // Probe resolving env(safe-area-inset-*) into pixels.
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;visibility:hidden;pointer-events:none;" +
      "padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0;";
    document.body.appendChild(probe);

    // Probes measuring what each viewport unit resolves to.
    const unitProbes = UNITS.map((u) => {
      const el = document.createElement("div");
      el.style.cssText = `position:fixed;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:100${u};`;
      document.body.appendChild(el);
      return [u, el] as const;
    });

    let maxGap = 0;
    const r = (n: number) => Math.round(n * 10) / 10;

    const update = () => {
      const vv = window.visualViewport;
      const top = vv?.offsetTop ?? 0;
      const bottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
      const cs = getComputedStyle(probe);
      const insetTop = parseFloat(cs.paddingTop) || 0;
      const standalone =
        (navigator as Navigator & { standalone?: boolean }).standalone === true;

      // Experimental workaround: only applies on the exact known signature
      // (installed iOS app, viewport short by exactly the top inset).
      const rawGap = Math.round(window.screen.height - window.innerHeight);
      const gap =
        standalone && rawGap > 0 && Math.abs(rawGap - insetTop) <= 2 ? rawGap : 0;
      if (modeRef.current === 2) root.style.setProperty("--vv-gap", `${gap}px`);
      else root.style.removeProperty("--vv-gap");

      const nav = Array.from(document.querySelectorAll("nav")).find(
        (n) => getComputedStyle(n).position === "fixed"
      );
      const navRect = nav?.getBoundingClientRect();
      const header = document.querySelector("header");
      const panel = document
        .querySelector('[role="dialog"]')
        ?.getBoundingClientRect();

      // Positive gap = bar floats above the visible bottom (MOB-05).
      if (navRect) maxGap = Math.max(maxGap, bottom - navRect.bottom);

      const lines = [
        `standalone ${String((navigator as Navigator & { standalone?: boolean }).standalone)}`,
        `inner ${window.innerWidth}x${window.innerHeight} clientH ${root.clientHeight}`,
        `visual ${vv ? `${r(vv.width)}x${r(vv.height)} top=${r(vv.offsetTop)}` : "n/a"}`,
        `screen ${window.screen.width}x${window.screen.height} outer ${window.outerWidth}x${window.outerHeight}`,
        `units ${unitProbes.map(([u, el]) => `${u}=${Math.round(el.getBoundingClientRect().height)}`).join(" ")}`,
        `inset T=${cs.paddingTop} B=${cs.paddingBottom}`,
        `gap raw=${rawGap} applied=${gap}`,
      ];
      if (header) {
        lines.push(`header padT=${getComputedStyle(header).paddingTop} top=${r(header.getBoundingClientRect().top - top)}`);
      }
      if (navRect) {
        lines.push(`nav h=${r(navRect.height)} gap=${r(bottom - navRect.bottom)} max=${r(maxGap)}`);
      }
      if (panel) {
        lines.push(`panel T=${r(panel.top - top)} B=${r(bottom - panel.bottom)} L=${r(panel.left)} R=${r(window.innerWidth - panel.right)}`);
      }
      setText(lines.join("\n"));
    };

    const interval = window.setInterval(update, 300);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("pageshow", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("pageshow", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      root.style.removeProperty("--vv-gap");
      probe.remove();
      unitProbes.forEach(([, el]) => el.remove());
    };
  }, []);

  if (!text) return null;
  return (
    <button
      type="button"
      aria-label="Debug: tap to change experiment"
      onClick={() => {
        const next = (modeRef.current + 1) % MODES.length;
        modeRef.current = next;
        setMode(next);
      }}
      className="fixed left-2 top-1/2 z-[100] -translate-y-1/2 whitespace-pre rounded bg-black/80 p-2 text-left font-mono text-[10px] leading-tight text-lime-300"
    >
      {`mode: ${MODES[mode]} (tap to change)\n${text}`}
    </button>
  );
}

export default function LoginButton() {
  const { user, status, login, authError, clearAuthError, retry } =
    useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (source: "workforce" | "external") => {
    setIsLoading(true);
    try {
      // On success this never returns - the page navigates away.
      await login(source);
    } catch {
      // login() already mapped and surfaced the error via authError.
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
    <>
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
        inset-x-0
        top-0
        z-50
        overflow-hidden
        "
        style={{ bottom: "calc(-1 * var(--vv-gap, 0px))" }}
      >
        {/* Logo */}

        {/* Logo */}
        <div
          className="mx-8 mb-8 flex justify-center md:justify-start"
          style={{ marginTop: "max(2rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))" }}
        >
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
      <TempDebugLabel />
    </>
  );
}