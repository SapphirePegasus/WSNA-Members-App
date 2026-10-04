import type { NextRequest } from "next/server";
import { authorizeContactLookup } from "@/app/lib/authorizeMember";
import {
  clearEligibilityCookie,
  internalErrorResponse,
  jsonNoStore,
} from "@/app/lib/apiResponse";
import { logSafeError } from "@/app/lib/safeLog";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contact
//
// The authoritative eligibility check. authorizeContactLookup runs the whole
// pipeline (identity token, per-identity rate limit, Dataverse lookup) and
// returns one of three outcomes:
//
//   rejected - 401 / 429 / 503 / 500, already built. A Dataverse OUTAGE is a
//              503, never "not a member".
//   denied   - authenticated but not eligible:
//                not-registered → no usable contact row for this email
//                unrecognized   → contact found but membertype/status matches
//                                 no recognised category
//              The `reason` never exposes Dataverse field names, GUIDs or
//              status codes. Any proof cookie is cleared.
//   eligible - contact record returned and a fresh eligibility proof cookie
//              is set for the Craft-backed routes.
//
// The response contract (found / reason / contact) is unchanged, so the client
// needs no change.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeContactLookup(req);

    if (auth.kind === "rejected") return auth.response;

    if (auth.kind === "denied") {
      return clearEligibilityCookie(
        jsonNoStore({ found: false, reason: auth.reason })
      );
    }

    return auth.applyProof(jsonNoStore({ found: true, contact: auth.contact }));
  } catch (err) {
    logSafeError("api/contact", err);
    return internalErrorResponse();
  }
}