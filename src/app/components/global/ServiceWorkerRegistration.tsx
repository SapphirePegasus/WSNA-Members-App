"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        // Service workers require HTTPS or localhost
        // Skip registration in unsupported environments
        if (
            typeof window === "undefined" ||
            !("serviceWorker" in navigator)
        ) {
            return;
        }

        // Only register in production
        // In development the SW would intercept HMR and break fast refresh
        if (process.env.NODE_ENV !== "production") {
            return;
        }

        let registration: ServiceWorkerRegistration | null = null;

        async function registerSW() {
            try {
                // Fetch the SW script HEAD to read the build timestamp
                // injected by next.config.ts — used to name cache stores
                const swHead = await fetch("/sw.js", { method: "HEAD" });
                const buildTimestamp =
                    swHead.headers.get("X-Build-Timestamp") || "v1";

                // Pass the timestamp to the SW via postMessage after registration
                registration = await navigator.serviceWorker.register(
                    "/sw.js",
                    {
                        scope: "/",
                        // updateViaCache: none means the browser always
                        // fetches the SW script from the network bypassing
                        // the HTTP cache — critical for picking up updates
                        updateViaCache: "none",
                    }
                );

                // Send build timestamp to the SW so it names caches correctly
                const sw =
                    registration.installing ||
                    registration.waiting ||
                    registration.active;

                sw?.postMessage({
                    type: "SET_BUILD_TIMESTAMP",
                    timestamp: buildTimestamp,
                });

                // Check for updates every time the user visits
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration?.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        // New SW installed and waiting to activate
                        // At this point we could show an "update available"
                        // toast — wired up via the update handler below
                        if (
                            newWorker.state === "installed" &&
                            navigator.serviceWorker.controller
                        ) {
                            handleUpdate(newWorker);
                        }
                    });
                });

                // Detect controller change and reload to activate new SW
                navigator.serviceWorker.addEventListener(
                    "controllerchange",
                    () => {
                        window.location.reload();
                    }
                );

            } catch (error) {
                // Log but never throw — SW failure must never break the app
                console.error("[SW] Registration failed:", error);
            }
        }

        // Defer registration until after page load
        // This avoids competing with critical resources on first paint
        if (document.readyState === "complete") {
            registerSW();
        } else {
            window.addEventListener("load", registerSW, { once: true });
        }

        return () => {
            // Nothing to clean up — SW lifecycle is independent of React
        };
    }, []);

    // Renders nothing — purely a side-effect component
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE HANDLER
// When a new service worker is waiting, send it a skip-waiting message
// so it activates immediately. The controllerchange listener above will
// then trigger a reload to pick up the new SW.
//
// In a future iteration we can replace the skipWaiting call here with
// a toast UI that lets the user choose when to update.
// ─────────────────────────────────────────────────────────────────────────────
function handleUpdate(worker: ServiceWorker) {
    worker.postMessage({ type: "SKIP_WAITING" });
}