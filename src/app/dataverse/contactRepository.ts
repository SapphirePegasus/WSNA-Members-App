import { callDataverse } from "./dataverseClient";

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
].join(",");

const CONTACT_EXPAND = [
    "parentcustomerid_account($select=accountnumber,name,wsna_accounttype)",
    "wsna_district($select=wsna_name)",
].join(",");

const FACILITY_ACCOUNT_TYPE = 551050000;

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

    districtCode: string | null;    // wsna_name (e.g. "NW")

}

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

function normalizeContact(raw: RawContactDataverse): ContactRecord {
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
        primaryFacilityCode: isValidFacility ? account!.accountnumber : null,
        primaryFacilityName: isValidFacility ? (account!.name ?? null) : null,
        districtCode: raw.wsna_district?.wsna_name ?? null,
    };
}

export async function getContactByEmail(
    email: string
): Promise<ContactRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const encodedEmail = encodeURIComponent(normalizedEmail);

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