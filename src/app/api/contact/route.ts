import { NextResponse } from "next/server";
import { getContactByEmail } from "@/app/dataverse/contactRepository";
import { verifyAuth, VerifyAuthError } from "@/app/lib/verifyAuth";

export async function POST(req: Request) {
  try {
    // Auth: verify token and extract email
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

    // Query Dataverse
    const contact = await getContactByEmail(email);

    if (!contact) {
      return NextResponse.json({ found: false });
    }

    // Return contact
    return NextResponse.json({ found: true, contact });

  } catch (err) {
    console.error("[/api/contact] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}