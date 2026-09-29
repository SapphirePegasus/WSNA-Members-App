import { NextResponse } from "next/server";
import { getContactByEmail } from "@/app/dataverse/contactRepository";
import { verifyAuth, VerifyAuthError } from "@/app/lib/verifyAuth";

export async function POST(req: Request) {
  try {
    // ── Auth guard ────────────────────────────────────────────────────────
    let email: string;
    try {
      email = await verifyAuth(req);
    } catch (err) {
      if (err instanceof VerifyAuthError) {
        return NextResponse.json(
          { error: err.message },
          { status: err.status }
        );
      }
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // ── Query Dataverse ───────────────────────────────────────────────────
    const result = await getContactByEmail(email);

    // ── Handle all three outcomes explicitly ──────────────────────────────
    //
    // null          → no contact row found for this email
    // "unrecognized"→ contact found but membertype/status matches no
    //                 recognised category — treated as access denied,
    //                 distinct reason surfaced so the client can show
    //                 appropriate messaging without knowing internal details
    // ContactRecord → contact found and classified, safe to return
    //
    // The `reason` field is intentionally generic — it never exposes
    // internal Dataverse field names, GUIDs, or status codes to the client.
    // ─────────────────────────────────────────────────────────────────────

    if (result === null) {
      return NextResponse.json({ found: false, reason: "not-registered" });
    }

    if (result === "unrecognized") {
      return NextResponse.json({ found: false, reason: "unrecognized" });
    }

    return NextResponse.json({ found: true, contact: result });

  } catch (err) {
    console.error("[/api/contact] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}