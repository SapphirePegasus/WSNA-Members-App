// Logs only the error class and message, never the raw object, which can
// carry causes, request URLs or upstream bodies.
export function logSafeError(scope: string, err: unknown): void {
    if (err instanceof Error) {
        console.error(`[${scope}] ${err.name}: ${err.message}`);
    } else {
        console.error(`[${scope}] Non-Error value thrown`);
    }
}