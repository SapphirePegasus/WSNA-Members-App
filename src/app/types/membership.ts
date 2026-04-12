
export interface MembershipLink {
    title: string;
    url: string | null;
}

export interface MembershipLinksResponse {
    localUnits: MembershipLink[];
    regional: MembershipLink | null;
    wsnaBenefits: MembershipLink | null;
    nationalNurses: MembershipLink | null;
    nationalUnion: MembershipLink | null;
}
export interface MembershipLinksRequest {
    facilityCode: string | null;     // accountnumber from the primary account
    districtCode: string | null;     // wsna_name from wsna_district table
    isUnionMember: boolean;
}