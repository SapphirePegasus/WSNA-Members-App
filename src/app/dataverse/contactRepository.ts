import { callDataverse } from "./dataverseClient";
import { buildODataEqFilter } from "./odata";
import { normalizeEmail } from "@/app/lib/email";
import { logEvent } from "@/app/lib/safeLog";
import { UpstreamUnavailableError } from "@/app/lib/upstream";

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERSHIP TYPE CLASSIFICATION
// GUIDs sourced from wsna_membertype lookup table in Dataverse.
// These are the ONLY place GUIDs exist in the codebase — never exposed to
// the client. Classification result is a typed union, not a raw value.
//
// To add or remove a member type: edit only these sets.
// ─────────────────────────────────────────────────────────────────────────────
const MEMBER_TYPE_GUIDS = {
    member: new Set<string>([
        "32c28d28-bb1b-e611-80dc-5065f38bf1b1", // Member
        "2dc8ea40-bb1b-e611-80dc-5065f38bf1b1", // Professional Org
        "4f04bc5c-3ae1-e811-a969-000d3a3101b9", // Local Unit Program Member
        "b1b03706-4b47-e611-80e9-5065f38a5961", // Lifetime
        "fdc8ebd4-4a47-e611-80e9-5065f38a5961", // Honorary
        "66c52829-44e1-e811-a969-000d3a3101b9", // Organizational Affiliate Nurse
    ]),
    nonMember: new Set<string>([
        "cf6ae234-bb1b-e611-80dc-5065f38bf1b1", // Non-Member
        "afd74fb5-7e1b-e611-80e1-5065f38be1c1", // Religious Objector
        "1117ee19-4719-e611-80dc-5065f38bf1b1", // Agency Fee Payer
        "65ec631d-31a7-e811-a964-000d3a32c8b8", // Voluntary Fair Share Payer
    ]),
} as const;

// Required statuscode for a valid wsna_status.
const VALID_STATUS_CODES = new Set<number>([
    551050003, // Active
    551050000, // Pending
]);

export type MembershipCategory = "member" | "non-member";

// ─────────────────────────────────────────────────────────────────────────────
// classifyMembership
// Pure function — no side effects, fully testable.
// Returns null when the contact does not meet the criteria for either
// category (unrecognized), which the caller surfaces as a distinct state.
// ─────────────────────────────────────────────────────────────────────────────
function classifyMembership(
    statusCode: number | null,
    memberTypeGuid: string | null
): MembershipCategory | null {
    if (statusCode === null || !VALID_STATUS_CODES.has(statusCode)) return null;
    if (!memberTypeGuid) return null;

    const guid = memberTypeGuid.toLowerCase();

    if (MEMBER_TYPE_GUIDS.member.has(guid)) return "member";
    if (MEMBER_TYPE_GUIDS.nonMember.has(guid)) return "non-member";

    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT FIELD SELECTION
// This is the single source of truth for which contact columns are fetched.
// To add a new field: add it to CONTACT_SELECT below AND add it to
// ContactRecord interface below. Nothing else needs to change.
//
// statuscode and _wsna_membertype_value are intentionally NOT in ContactRecord.
// They are fetched for server-side classification only and discarded after use.
// ─────────────────────────────────────────────────────────────────────────────
const CONTACT_SELECT = [
    "contactid",
    "fullname",
    "emailaddress1",
    "employeeid",
    "wsna_aftid",
    "department",
    "wsna_showaft",
    "wsna_credentials",
    "wsna_datejoined",
    "statuscode",
    "_wsna_membertype_value",
    // ── ADD NEW CONTACT FIELDS BELOW ─────────────────────────────────────────
].join(",");

// ─────────────────────────────────────────────────────────────────────────────
// EXPAND DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const CONTACT_EXPAND = [
    "parentcustomerid_account($select=accountnumber,name,wsna_accounttype)",
    "wsna_district($select=wsna_name)",
    // ── ADD NEW EXPANDS BELOW ────────────────────────────────────────────────
].join(",");

const FACILITY_ACCOUNT_TYPE = 551050000;

// Rows requested per lookup. Two is the minimum that can reveal a duplicate.
const LOOKUP_PAGE_SIZE = 2;

// ─────────────────────────────────────────────────────────────────────────────
// ContactRecord
// Client-safe shape. No internal Dataverse fields, no GUIDs, no status codes.
// membershipCategory is the only classification signal exposed to consumers.
// ─────────────────────────────────────────────────────────────────────────────
export interface ContactRecord {
    // ── Identity ─────────────────────────────────────────────────────────────
    contactid: string;
    fullname: string | null;
    emailaddress1: string | null;

    // ── Membership numbers ────────────────────────────────────────────────────
    employeeid: string | null;
    wsna_aftid: string | null;
    department: string | null;

    // ── Member profile ────────────────────────────────────────────────────────
    wsna_credentials: string | null;
    wsna_datejoined: string | null;
    wsna_showaft: boolean;

    // ── Membership classification ─────────────────────────────────────────────
    // Derived server-side from statuscode + wsna_membertype lookup.
    // "member"     → full access, all IDs visible
    // "non-member" → limited access, IDs hidden
    membershipCategory: MembershipCategory;

    // ── Resolved from parentcustomerid_account expand ─────────────────────────
    primaryFacilityCode: string | null;
    primaryFacilityName: string | null;

    // ── Resolved from wsna_district expand ───────────────────────────────────
    districtCode: string | null;

    // ── ADD NEW RESOLVED FIELDS HERE ─────────────────────────────────────────
}

// ─────────────────────────────────────────────────────────────────────────────
// RAW DATAVERSE SHAPE
// Internal only — never exported. Raw OData wire format before normalisation.
// statuscode and _wsna_membertype_value are present here ONLY.
// ─────────────────────────────────────────────────────────────────────────────
interface RawContactDataverse {
    contactid: string;
    fullname: string | null;
    emailaddress1: string | null;
    employeeid: string | null;
    wsna_aftid: string | null;
    department: string | null;
    wsna_showaft: boolean | null;
    wsna_credentials: string | null;
    wsna_datejoined: string | null;
    statuscode: number | null;
    _wsna_membertype_value: string | null;
    parentcustomerid_account: {
        accountnumber: string | null;
        name: string | null;
        wsna_accounttype: number | null;
    } | null;
    wsna_district: {
        wsna_name: string | null;
    } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeContact
// Converts raw Dataverse OData response into a clean ContactRecord.
// Classification happens here. Raw fields are discarded after use.
// Returns null if the contact's membertype/status does not qualify for access.
// ─────────────────────────────────────────────────────────────────────────────
function normalizeContact(
    raw: RawContactDataverse
): ContactRecord | null {
    const membershipCategory = classifyMembership(
        raw.statuscode,
        raw._wsna_membertype_value
    );

    // Contact exists in Dataverse but does not belong to any recognised
    // membership category — signal as null so the caller can distinguish
    // this from "contact not found at all".
    if (membershipCategory === null) return null;

    const account = raw.parentcustomerid_account;

    const isValidFacility =
        account !== null &&
        account.wsna_accounttype === FACILITY_ACCOUNT_TYPE &&
        account.accountnumber !== null &&
        account.accountnumber.trim() !== "";

    return {
        contactid: raw.contactid,
        fullname: raw.fullname ?? null,
        emailaddress1: raw.emailaddress1 ?? null,
        employeeid: raw.employeeid ?? null,
        wsna_aftid: raw.wsna_aftid ?? null,
        department: raw.department ?? null,
        wsna_showaft: raw.wsna_showaft ?? false,
        wsna_credentials: raw.wsna_credentials ?? null,
        wsna_datejoined: raw.wsna_datejoined ?? null,
        membershipCategory,
        primaryFacilityCode: isValidFacility ? account!.accountnumber : null,
        primaryFacilityName: isValidFacility ? (account!.name ?? null) : null,
        districtCode: raw.wsna_district?.wsna_name ?? null,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// RETURN TYPE
// Three distinct outcomes the caller must handle explicitly:
//   ContactRecord   → contact found and classified (member or non-member)
//   null            → no usable record: not found, or more than one match
//   "unrecognized"  → contact found but membertype/status matches no category
//
// Failure to REACH Dataverse is never one of these outcomes. It is thrown as
// UpstreamUnavailableError, so an outage is never mistaken for "not a member".
// ─────────────────────────────────────────────────────────────────────────────
export type GetContactResult = ContactRecord | null | "unrecognized";

// A response that is not a well-formed OData collection is an upstream fault.
// Treating a missing `value` as "not found" would turn a malformed response
// into a false "you are not a member".
function extractRows(data: unknown): RawContactDataverse[] {
    if (
        typeof data === "object" &&
        data !== null &&
        Array.isArray((data as { value?: unknown }).value)
    ) {
        return (data as { value: RawContactDataverse[] }).value;
    }
    throw new UpstreamUnavailableError("upstream-error");
}

// ─────────────────────────────────────────────────────────────────────────────
// getContactByEmail
//
// DATA-01: the email is OData-escaped (apostrophes doubled) and then
// URI-encoded inside buildODataEqFilter - two layers, one helper.
//
// REVIEW-06: requests two rows so a duplicate is detectable. Email uniqueness
// is enforced in Dataverse, so more than one row should be impossible; if it
// ever happens the lookup fails closed (no usable record) and emits an
// alertable event that contains no email.
// ─────────────────────────────────────────────────────────────────────────────
export async function getContactByEmail(
    email: string
): Promise<GetContactResult> {
    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail === null) return null;

    const filter = buildODataEqFilter("emailaddress1", normalizedEmail);

    const path =
        `/api/data/v9.2/contacts` +
        `?$select=${CONTACT_SELECT}` +
        `&$filter=${filter}` +
        `&$expand=${CONTACT_EXPAND}` +
        `&$top=${LOOKUP_PAGE_SIZE}`;

    const rows = extractRows(await callDataverse(path));

    if (rows.length === 0) return null;

    if (rows.length > 1) {
        logEvent("contact.ambiguous");
        return null;
    }

    const contact = normalizeContact(rows[0]);

    // Contact row exists but membertype/status is unrecognised.
    // Distinct from null (not found) so the API route and UI
    // can show the correct messaging.
    if (contact === null) return "unrecognized";

    return contact;
}