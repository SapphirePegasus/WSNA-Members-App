// Owns all direct queries against the Dataverse "account" table.
//
// Currently, account data is retrieved via $expand on the contact query in
// contactRepository.ts (primary facility code and name). That covers the
// current application requirements.
//
// Add direct account queries here when needed - for example, if a future
// feature requires fetching all facilities for a dropdown, searching accounts
// by name, or retrieving account details not available through the contact
// expand.
//
// Usage pattern - always import callDataverse from dataverseClient:
//   import { callDataverse } from "./dataverseClient";
//
// Field selection pattern - follow contactRepository.ts:
//   1. Define an ACCOUNT_SELECT constant listing Dataverse column names
//   2. Define a RawAccountDataverse internal interface for the OData shape
//   3. Define an exported AccountRecord interface for the normalized shape
//   4. Write a normalizeAccount() function to convert raw → clean
//   5. Export named async functions for each query (e.g. getAccountByCode)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT FIELD REFERENCE
// These are the relevant columns in the Dataverse account table.
// Documented here for reference when writing future queries.
//
//   accountid        - primary key (GUID)
//   name             - facility display name
//   accountnumber    - facility code (e.g. "SJBEL") - used as GraphQL filter
//   wsna_accounttype - type discriminator; 551050000 = facility
//   wsna_district    - lookup to wsna_district table
//   statecode        - 0 = active, 1 = inactive
//
// Filter for valid facilities:
//   statecode eq 0 AND wsna_accounttype eq 551050000 AND accountnumber ne null
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ADD EXPORTS BELOW THIS LINE
// Each export should be a named async function following this signature:
//   export async function getSomething(param: Type): Promise<ReturnType | null>
// ─────────────────────────────────────────────────────────────────────────────

export { };