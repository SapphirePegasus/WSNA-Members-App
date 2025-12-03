import { callDataverse } from "./dataverseClient";

export interface ContactRecord {
    //Add any column here to get it inside components/global/UserInfo.tsx
    contactid: string;
    fullname?: string;
    emailaddress1?: string;
    employeeid?: string; //wsna id
    wsna_aftid?: string; //aft id
    department?: string; //ana id
    [key: string]: any;
}

export async function getContactByEmail(email: string): Promise<ContactRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();
    //const filter = `emailaddress1 eq '${normalizedEmail}'`;
    //const encodedFilter = `$filter=${encodeURIComponent(filter)}`;
    //const path = `/api/data/v9.2/contacts?${encodedFilter}`;
    const encodedEmail = encodeURIComponent(normalizedEmail);
    const encodedFilter = `$filter=emailaddress1%20eq%20%27${encodedEmail}%27`;
    const path = `/api/data/v9.2/contacts?${encodedFilter}`;

    //LOGS
    //console.log("📧 [Dataverse Lookup] Incoming email:", email);
    //console.log("🔧 Normalized email:", normalizedEmail);
    //console.log("🌐 Encoded filter:", encodedFilter);
    //console.log("🚀 Dataverse Request URL:", process.env.DATAVERSE_URL + path);

    const data = await callDataverse(path);

    if (!data.value || data.value.length === 0) {
        console.warn("No matching contact in Dataverse for:", normalizedEmail);
        return null;
    }

    return data.value[0] as ContactRecord;
}
