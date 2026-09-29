// ─────────────────────────────────────────────────────────────────────────────
// A single resolved membership link shown on the membership card.
// `url` is null when the data source returned no URL - the UI renders the
// title as plain text with no anchor or external link icon in that case,
// per the spec's edge case handling.
// ─────────────────────────────────────────────────────────────────────────────
export interface MembershipLink {
    title: string;
    url: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// The full response shape returned by /api/membershiplinks.
//
// localUnits     - ordered array, primary facility first. Empty array when
//                  the member has no resolvable facility or GraphQL finds no
//                  matching local unit.
// regional       - null when no regional association matches the district code,
//                  or when the member has no district assigned.
// nationalNurses - null when GraphQL returns no nationalNursesAssociation entry.
// nationalUnion  - null when member is not a union member, or no entry found.
//
// ─────────────────────────────────────────────────────────────────────────────
export interface MembershipLinksResponse {
    localUnits: MembershipLink[];
    regional: MembershipLink | null;
    wsnaBenefits: MembershipLink | null;
    nationalNurses: MembershipLink | null;
    nationalUnion: MembershipLink | null;
}
// ─────────────────────────────────────────────────────────────────────────────
// The request payload sent from the client hook to /api/membershiplinks.
// All fields are derived from the enriched contact stored in UserContext -
// the caller never constructs this manually.
// ─────────────────────────────────────────────────────────────────────────────
export interface MembershipLinksRequest {
    facilityCode: string | null;     // accountnumber from the primary account
    districtCode: string | null;     // wsna_name from wsna_district table
    isUnionMember: boolean;
}