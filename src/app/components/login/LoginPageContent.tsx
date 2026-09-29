"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/components/global/UserInfo";
import AuthToast from "@/app/components/global/AuthToast";
import { WsnaFullNameBlue, MicrosoftIcon } from "@/app/utils/icons";
import { clearStaleInteractionStatus, type AuthSource } from "@/app/lib/authClient";
import { useStandaloneViewportGap } from "@/app/hooks/useStandaloneViewportGap";

// ─────────────────────────────────────────────────────────────────────────────
// DISCLOSURE ICONS
// Single-use, scoped to this file. Stroke-based so they inherit color via
// currentColor, matching the icon style already used elsewhere in the app.
// If a second accordion pattern appears elsewhere in the app later, promote
// these to icons.tsx at that point - not before, per YAGNI.
// ─────────────────────────────────────────────────────────────────────────────
function DisclosurePlusIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function DisclosureMinusIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            <path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCLOSURE ITEM
// One reusable accordion row, used twice below. Fully self-contained state -
// the two disclosures are independent per the approved design (opening one
// never affects the other). Follows the dl > dt > button, then dd structure
// required by the design handoff, with the native `hidden` attribute doing
// the show/hide work - no animation, no height measurement. If needed make 
// this a separate component to use somewhere else. 
//
// ─────────────────────────────────────────────────────────────────────────────
interface DisclosureItemProps {
    id: string;
    question: string;
    className?: string;
    children: React.ReactNode;
}

function DisclosureItem({ id, question, className, children }: DisclosureItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerId = `${id}-trigger`;
    const answerId = `${id}-answer`;

    return (
        <div className={className}>
            <dt>
                <button
                    type="button"
                    id={triggerId}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setIsOpen((open) => !open)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                    <span className="text-sm font-bold sm:text-base">{question}</span>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-zinc-400 md:size-8">
                        {isOpen ? (
                            <DisclosureMinusIcon className="size-4" />
                        ) : (
                            <DisclosurePlusIcon className="size-4" />
                        )}
                    </span>
                </button>
            </dt>
            <dd
                id={answerId}
                role="region"
                aria-labelledby={triggerId}
                hidden={!isOpen}
                className="overflow-hidden pt-3 pr-10 text-sm leading-6 text-zinc-950 motion-reduce:transition-none sm:text-base md:pr-12"
            >
                {children}
            </dd>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE CONTENT
//
// Minor changes are made to the size and layout so that its responsive and
// looks equally good on all devices. The design handoff did not have any 
// responsive typography rules so the developer has chosen industry standard
// sizing and layout rules and applied here. If needed these can be updated
// in future.
//
// Layout is a normal scrollable document (min-h-dvh, no `fixed` positioning)
// so expanded disclosure content pushes the footer down and scrolls, rather
// than being clipped by a fixed-height overlay.
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPageContent() {
    const { user, status, login, authError, clearAuthError, retry } = useUser();

    // PWA-01: extends the shell to the full screen on cold launch of the
    // installed iOS app, where WebKit reports a viewport that is short by the
    // top safe-area inset. No-op everywhere else.
    useStandaloneViewportGap();

    const [loadingSource, setLoadingSource] = useState<AuthSource | null>(null);
    const isLoggingIn = loadingSource !== null;

    // ── Abandoned-redirect recovery ─────────────────────────────────────────
    // loginRedirect() navigates the whole page away. If the user presses the
    // browser Back button before the identity provider round-trip completes,
    // most browsers restore this page from the back-forward cache (bfcache)
    // exactly as it was frozen - including the in-memory `loadingSource`
    // state above - rather than a fresh mount. Without this, the clicked
    // button stays stuck on "Please Wait..." forever, since nothing ever
    // resets it.
    //
    // `pageshow` with `event.persisted === true` is the standard, documented
    // signal for "this page just came back from bfcache" (as opposed to a
    // fresh load, where React state would already start at its default and
    // this handler is a no-op).

    useEffect(() => {
        function handlePageShow(event: PageTransitionEvent) {
            if (!event.persisted) return;
            setLoadingSource(null);
            clearStaleInteractionStatus();
        }

        window.addEventListener("pageshow", handlePageShow);
        return () => window.removeEventListener("pageshow", handlePageShow);
    }, []);

    const handleLogin = async (source: AuthSource) => {
        setLoadingSource(source);
        try {
            // On success this never returns - the whole page navigates away.
            await login(source);
        } catch {
            // login() already mapped and surfaced the error via authError.
            setLoadingSource(null);
        }
    };

    const [isRetrying, setIsRetrying] = useState(false);
    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await retry();
        } finally {
            setIsRetrying(false);
        }
    };
    const isAuthInProgress = isRetrying || status === "loading";

    return (
        <div
            className="flex w-full flex-col overflow-y-auto bg-[url('/background.svg')] bg-cover bg-center bg-no-repeat"
            style={{ minHeight: "calc(100dvh + var(--standalone-vh-gap, 0px))" }}
        >
            <div
                className="mx-6 mb-6 flex justify-center md:justify-start"
                style={{ paddingTop: "max(2rem, calc(env(safe-area-inset-top, 0px) + 1rem))" }}
            >
                <WsnaFullNameBlue className="h-6 w-auto" />
            </div>

            {/* Sign-in chooser / pending state */}
            <div className="flex flex-1 items-center justify-center px-4 py-6">
                {!user ? (
                    <div className="w-full max-w-md rounded-2xl bg-[#FAFAFA] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                            Sign in to My WSNA
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Use the primary email address on your WSNA record.
                        </p>

                        {/* Microsoft account */}
                        <div className="mt-5">
                            <p className="text-sm font-bold text-foreground">Microsoft account</p>
                            <button
                                type="button"
                                onClick={() => handleLogin("workforce")}
                                disabled={isLoggingIn}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-foreground transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loadingSource === "workforce" ? (
                                    <>
                                        <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                                        Please Wait...
                                    </>
                                ) : (
                                    <>
                                        <MicrosoftIcon className="size-4" />
                                        Continue with Microsoft
                                    </>
                                )}
                            </button>
                            <p className="mt-2 text-xs leading-5 text-gray-500">
                                Use a WSNA staff account or a personal Microsoft account.
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="my-4 flex items-center gap-3">
                            <div className="h-px flex-1 bg-zinc-300" />
                            <span className="text-xs text-gray-500">or</span>
                            <div className="h-px flex-1 bg-zinc-300" />
                        </div>

                        {/* Email code */}
                        <div>
                            <p className="text-sm font-bold text-foreground">Email code</p>
                            <button
                                type="button"
                                onClick={() => handleLogin("external")}
                                disabled={isLoggingIn}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loadingSource === "external" ? (
                                    <>
                                        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Please Wait...
                                    </>
                                ) : (
                                    "Continue with email"
                                )}
                            </button>
                            <p className="mt-2 text-xs leading-5 text-gray-500">
                                We&apos;ll email you a one-time code. No password required.
                                <br />
                                First time? On the next screen, select No account? Create one. This creates a
                                sign-in account&mdash;not a WSNA membership.
                            </p>
                        </div>

                        {/* Disclosures */}
                        <dl className="mt-5 divide-y divide-zinc-400/40">
                            <DisclosureItem
                                id="how-access-works"
                                question="How access works"
                                className="pb-4"
                            >
                                Whichever sign-in method you choose, use the primary email address on your
                                WSNA record&mdash;usually the address where you receive WSNA newsletters and
                                other updates. Two checks take place: first, your sign-in method confirms
                                your identity; then My WSNA checks whether the email address you logged in
                                with matches an eligible WSNA record.
                            </DisclosureItem>
                            <DisclosureItem
                                id="which-sign-in-option"
                                question="Which sign-in option should I use?"
                                className="pt-4"
                            >
                                Choose Microsoft if you use a WSNA staff account or a personal Microsoft
                                account that uses the primary email address on your WSNA record.
                                Otherwise&mdash;or if you&apos;re unsure&mdash;choose Email code.
                            </DisclosureItem>
                        </dl>
                    </div>
                ) : (
                    // Signed in, membership check still resolving - unchanged behavior.
                    <div className="space-y-3 text-center">
                        <h1 className="mb-2 text-3xl font-bold text-[#0a2a4a] sm:text-4xl">Welcome</h1>
                        <div className="space-y-1 text-sm text-gray-700 sm:text-base">
                            <p className="font-medium">{user.name}</p>
                            <a
                                href="/home"
                                className="font-medium text-primary hover:underline"
                            >
                                Click Here to load the Homepage
                            </a>
                        </div>
                        {isAuthInProgress && (
                            <div className="flex justify-center pt-2">
                                <span className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                                &nbsp; Please Wait...
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Page-level support */}
            <div className="flex flex-col items-center gap-2 px-4 pb-safe pb-4 text-sm sm:flex-row sm:justify-center sm:gap-5">
                <p className="text-gray-500">
                    Need help signing in?{" "}
                    <a
                        href="mailto:membership@wsna.org"
                        className="font-medium text-primary hover:underline"
                    >
                        Contact WSNA &rsaquo;
                    </a>
                </p>
                <p className="text-gray-500">
                    Not a member yet?{" "}
                    <a
                        href="https://www.wsna.org/membership"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                    >
                        Learn about joining WSNA &rsaquo;
                    </a>
                </p>
            </div>

            <AuthToast error={authError} onRetry={handleRetry} onDismiss={clearAuthError} />
        </div>
    );
}