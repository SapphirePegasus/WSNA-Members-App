import { callDataverse } from "./dataverseClient";

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT FIELD SELECTION
// This is the single source of truth for which contact columns are fetched.
// To add a new field: add it to CONTACT_SELECT below AND add it to
// ContactRecord interface below. Nothing else needs to change.
//
// Naming follows Dataverse logical column names exactly.
// ─────────────────────────────────────────────────────────────────────────────
const CONTACT_SELECT = [
    "contactid",
    "fullname",
    "emailaddress1",
    "employeeid",        // WSNA member number
    "wsna_aftid",        // AFT member number
    "department",        // ANA member number
    "wsna_showaft",      // union member flag
    "wsna_credentials",  // credentials suffix (e.g. RN, MN)
    "wsna_datejoined",   // member since date
    // ── ADD NEW CONTACT FIELDS HERE ──────────────────────────────────────────
    // Example: "wsna_somenewfield",
].join(",");

// ─────────────────────────────────────────────────────────────────────────────
// EXPAND DEFINITIONS
// Each expand retrieves related entity data in a single Dataverse call.
// parentcustomerid_account uses the polymorphic suffix (_account) to target
// only account-type lookups. If the contact's primary customer is not an
// account, this expand returns null safely.
//
// To add a new expand: add it to CONTACT_EXPAND and add the resolved fields
// to ContactRecord below.
// ─────────────────────────────────────────────────────────────────────────────
const CONTACT_EXPAND = [
    // Primary facility — polymorphic lookup, _account suffix required
    "parentcustomerid_account($select=accountnumber,name,wsna_accounttype)",
    // District — standard lookup to wsna_district table
    // wsna_name holds the short code (e.g. "NW"), not the long name
    "wsna_district($select=wsna_name)",
    // ── ADD NEW EXPANDS HERE ─────────────────────────────────────────────────
    // Example: "wsna_somerelatedtable($select=fieldname)",
].join(",");

// ─────────────────────────────────────────────────────────────────────────────
// FACILITY TYPE VALUE
// In the account table, wsna_accounttype = 551050000 identifies facility
// records. Any expanded account that does not match this value is not a
// valid facility and should be treated as null by the caller.
// ─────────────────────────────────────────────────────────────────────────────
const FACILITY_ACCOUNT_TYPE = 551050000;

// ─────────────────────────────────────────────────────────────────────────────
// ContactRecord
// The typed shape of a contact as used throughout the application.
// All related entity data is resolved into flat, typed fields here —
// no raw OData annotations or lookup IDs leak beyond this file.
//
// To add a new field: add it here AND add it to CONTACT_SELECT or
// CONTACT_EXPAND above.
// ─────────────────────────────────────────────────────────────────────────────
export interface ContactRecord {
    // ── Identity ─────────────────────────────────────────────────────────────
    contactid: string;
    fullname: string | null;
    emailaddress1: string | null;

    // ── Membership numbers ────────────────────────────────────────────────────
    employeeid: string | null;      // WSNA member number
    wsna_aftid: string | null;      // AFT member number
    department: string | null;      // ANA member number

    // ── Member profile ────────────────────────────────────────────────────────
    wsna_credentials: string | null;
    wsna_datejoined: string | null;
    wsna_showaft: boolean;           // true = union member

    // ── Resolved from parentcustomerid_account expand ─────────────────────────
    // null when no valid facility account is linked
    primaryFacilityCode: string | null;   // accountnumber (e.g. "SJBEL")
    primaryFacilityName: string | null;   // account name display value

    // ── Resolved from wsna_district expand ───────────────────────────────────
    // null when no district is assigned or district has no code
    districtCode: string | null;    // wsna_name (e.g. "NW")

    // ── ADD NEW RESOLVED FIELDS HERE ─────────────────────────────────────────
    // Follow the pattern above: typed field, null when not available,
    // comment explaining the source column and example value.
}

// ─────────────────────────────────────────────────────────────────────────────
// RAW DATAVERSE SHAPE
// Internal type only — never exported. Represents the raw OData response
// before we normalize it into ContactRecord. Keeps the normalization logic
// explicit and prevents raw Dataverse shapes from leaking into the rest of
// the application.
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
    // Expanded account — null if parentcustomerid is not an account
    parentcustomerid_account: {
        accountnumber: string | null;
        name: string | null;
        wsna_accounttype: number | null;
    } | null;
    // Expanded district
    wsna_district: {
        wsna_name: string | null;
    } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeContact
// Converts raw Dataverse OData response into a clean ContactRecord.
// All null-coalescing and facility type validation happens here.
// This is the only place in the codebase that knows about raw Dataverse
// field names and OData expand structures.
// ─────────────────────────────────────────────────────────────────────────────
function normalizeContact(raw: RawContactDataverse): ContactRecord {
    const account = raw.parentcustomerid_account;

    // Only treat the expanded account as a valid facility if it matches
    // the facility account type. Filters out "employer unknown" and any
    // non-facility account types that may be linked.
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
        primaryFacilityCode: isValidFacility ? account!.accountnumber : null,
        primaryFacilityName: isValidFacility ? (account!.name ?? null) : null,
        districtCode: raw.wsna_district?.wsna_name ?? null,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// getContactByEmail
// Fetches a single contact by email address with all required fields and
// related entity data resolved in one Dataverse call.
// Returns null if no matching contact is found.
// Throws on Dataverse API errors — the caller is responsible for catching.
// ─────────────────────────────────────────────────────────────────────────────
export async function getContactByEmail(
    email: string
): Promise<ContactRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const encodedEmail = encodeURIComponent(normalizedEmail);

    // Build expand string manually — do NOT use encodeURIComponent on the
    // full expand string. Parentheses and $select inside expand must remain
    // unencoded for Dataverse OData to parse them correctly.
    const select = CONTACT_SELECT;
    const expand = CONTACT_EXPAND;
    const filter = `emailaddress1%20eq%20%27${encodedEmail}%27`;

    const path =
        `/api/data/v9.2/contacts` +
        `?$select=${select}` +
        `&$filter=${filter}` +
        `&$expand=${expand}` +
        `&$top=1`;

    const data = await callDataverse(path);

    if (!data.value || data.value.length === 0) {
        return null;
    }

    return normalizeContact(data.value[0] as RawContactDataverse);
}