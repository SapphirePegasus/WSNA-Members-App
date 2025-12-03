import { NextResponse } from "next/server";
import { getContactByEmail } from "@/app/dataverse/apiContact";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const contact = await getContactByEmail(email);

        if (!contact) {
            // already logged in apiContact
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({ found: true, contact });
    } catch (err) {
        console.error("Dataverse contact lookup failed:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
