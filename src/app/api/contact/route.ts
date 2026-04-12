// src/app/api/contact/route.ts

import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify, decodeJwt } from "jose";
import { getContactByEmail } from "@/app/dataverse/contactRepository";

// ─────────────────────────────────────────────────────────────────────────────
// JWKS endpoint — tenant-independent, supports any Microsoft account type.
// Works for both organizational and personal Microsoft accounts.
// ─────────────────────────────────────────────────────────────────────────────
const JWKS = createRemoteJWKSet(
  new URL(
    "https://login.microsoftonline.com/common/discovery/v2.0/keys"
  )
);

export async function POST(req: Request) {
  try {
    // ── Step 1: Extract token ─────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or malformed Authorization header" },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7);

    // ── Step 2: Decode to extract tenant ID ───────────────────────────────
    // The issuer must be constructed from the token's own tid claim.
    // This is the correct pattern for multi-tenant apps per Microsoft docs.
    let tid: string;
    try {
      const decoded = decodeJwt(idToken);
      tid = decoded.tid as string;

      if (!tid) {
        return NextResponse.json(
          { error: "Token missing tid claim" },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to decode token" },
        { status: 401 }
      );
    }

    // ── Step 3: Verify signature and claims ───────────────────────────────
    let email: string | undefined;

    try {
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: `https://login.microsoftonline.com/${tid}/v2.0`,
        audience: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID,
      });

      email =
        (payload.email as string | undefined) ??
        (payload.preferred_username as string | undefined);
    } catch (err) {
      console.error("[/api/contact] Token verification failed:", err);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // ── Step 4: Validate extracted email ──────────────────────────────────
    if (!email) {
      return NextResponse.json(
        { error: "Token does not contain a verifiable email claim" },
        { status: 422 }
      );
    }

    // ── Step 5: Query Dataverse via repository ────────────────────────────
    // getContactByEmail now returns an enriched ContactRecord with
    // primaryFacilityCode and districtCode resolved from related tables
    // in a single Dataverse call. No additional lookups needed here.
    const contact = await getContactByEmail(email);

    if (!contact) {
      return NextResponse.json({ found: false });
    }

    // ── Step 6: Return enriched contact ───────────────────────────────────
    // The full ContactRecord is returned to the client. UserProvider stores
    // it in context, making primaryFacilityCode and districtCode available
    // to any component without additional API calls.
    return NextResponse.json({ found: true, contact });

  } catch (err) {
    console.error("[/api/contact] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
