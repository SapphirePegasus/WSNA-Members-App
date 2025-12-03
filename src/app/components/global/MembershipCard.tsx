"use client";

import { MembershipCardIcon, MembershipCardIconPLACEHOLDER, WsnaFullName, ExternalLinkIcon, ArrowRightIcon } from "@/app/utils/icons";
import { useUser } from "@/app/components/global/UserInfo";
import React from "react";

// CARDS SECTION FUNCTION

function MembershipCardSection({ contact }: { contact: any }) {
  return (
    <div className="w-full flex justify-center p-8 bg-gradient-to-b from-[#eff6ff] to-[#dbeafe]">
      <div className="w-[500px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] bg-white overflow-hidden">
        <div className="bg-primary-500 text-white px-5 py-3 flex justify-between items-center">
          <WsnaFullName />
          <span className="text-[16px] font-medium">{contact?.["_wsna_membertype_value@OData.Community.Display.V1.FormattedValue"]}</span>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-[24px] font-bold">{contact?.fullname}, {contact?.wsna_credentials}</p>
            <p className="text-gray-500 text-[16px]">WSNA member since {contact?.wsna_datejoined && new Intl.DateTimeFormat("en", { year: "numeric" }).format(new Date(contact.wsna_datejoined))}</p>
          </div>

          <div className="border-t border-gray-200"></div>

          <div className="space-y-4">

            <div className="flex items-start gap-2">
              <span className="w-6 h-6 mb-1 mx-1"><MembershipCardIcon /></span>
              <div>
                <p className="text-[18px] tracking-wide font-medium">{contact?.employeeid?.toString().replace(/,/g, "") || "NOT FOUND"}</p>
                <p className="text-[16px] text-gray-500">WSNA member number</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-6 h-6 mb-1 mx-1"><MembershipCardIconPLACEHOLDER /></span>
              <div>
                <p className="text-[18px] tracking-wide font-medium">{contact?.department?.toString().replace(/,/g, "") || "NOT FOUND"}</p>
                <p className="text-[16px] text-gray-500">ANA member number</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-6 h-6 mb-1 mx-1"><MembershipCardIconPLACEHOLDER /></span>
              <div>
                <p className="text-[18px] tracking-wide font-medium">{contact?.wsna_aftid?.toString().replace(/,/g, "") || "NOT FOUND"}</p>
                <p className="text-[16px] text-gray-500">AFT member number</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// LINKS SECTION FUNCTION

function LinksSection({ contact }: { contact: any }) {

  const [links, setLinks] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function fetchLinks() {
      try {
        const res = await fetch("/api/membershiplinks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            localUnitFormatted:contact?.["_wsna_localunit_value@OData.Community.Display.V1.FormattedValue"],
            districtCode: contact?.["_wsna_district_value@OData.Community.Display.V1.FormattedValue"],
            isUnionMember: contact?.wsna_showaft === true
          }),
        });

        const data = await res.json();
        setLinks(data);
      } catch (err) {
        console.error("Membership links fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }

    if (contact) fetchLinks();
  }, [contact]);

  if (loading) return <div className="px-6 py-8 text-gray-500">Loading links…</div>;
  if (!links) return <div className="px-6 py-8 text-gray-500">No links available.</div>;

  return (
    <div className="w-full flex px-6 justify-center">
      <div className="w-[500px] py-8 space-y-6">

        {/* 1. Local Unit */}
        {links.localUnits?.map((unit: any, i: number) => (
          <a
            key={i}
            href={unit.url}
            className="flex justify-between items-center cursor-pointer py-3 border-b"
          >
            <div>
              <p className="font-medium text-[18px]">{unit.title}</p>
              <p className="text-[14px] text-gray-500">Local Unit Member</p>
            </div>
            <ArrowRightIcon />
          </a>
        ))}


        {/* 2. Regional Nurses Association */}
        {links.regional && (
          <a
            href={links.regional.url || "#"}
            target="_blank"
            className="flex justify-between items-center cursor-pointer py-3 border-b"
          >
            <div>
              <p className="font-medium text-[18px]">{links.regional.title}</p>
              <p className="text-[14px] text-gray-500">Regional Nurses Association Member</p>
            </div>
            {links.regional.url && <ExternalLinkIcon />}
          </a>
        )}

        {/* 3. WSNA Membership Benefits */}
        {links.wsnaBenefits && (
          <a
            href={links.wsnaBenefits.url || "#"}
            target="_blank"
            className="flex justify-between items-center cursor-pointer py-3 border-b"
          >
            <div>
              <p className="font-medium text-[18px]">{links.wsnaBenefits.title}</p>
              <p className="text-[14px] text-gray-500">Union Member Benefits</p>
            </div>
            {links.wsnaBenefits.url && <ExternalLinkIcon />}
          </a>
        )}

        {/* 4. National Nurses Association */}
        {links.nationalNurses && (
          <a
            href={links.nationalNurses.url || "#"}
            target="_blank"
            className="flex justify-between items-center cursor-pointer py-3 border-b"
          >
            <div>
              <p className="font-medium text-[18px]">{links.nationalNurses.title}</p>
              <p className="text-[14px] text-gray-500">Premier Member Benefits</p>
            </div>
            {links.nationalNurses.url && <ExternalLinkIcon />}
          </a>
        )}

        {/* 5. National Union (Union members only) */}
        {links.nationalUnion && (
          <a
            href={links.nationalUnion.url || "#"}
            target="_blank"
            className="flex justify-between items-center cursor-pointer py-3 border-b"
          >
            <div>
              <p className="font-medium text-[18px]">{links.nationalUnion.title}</p>
              <p className="text-[14px] text-gray-500">Member Discounts</p>
            </div>
            {links.nationalUnion.url && <ExternalLinkIcon />}
          </a>
        )}

      </div>
    </div>
  );
}

export default function MembershipCard() {

  const { contact } = useUser();

  return (
    <>
      {/* CARD SECTION */}
      <MembershipCardSection contact={contact} />

      {/* LINKS SECTION */}
      <LinksSection contact={contact} />
    </>
  );
}
