"use client";

import { MembershipCardIcon, MembershipCardIconPLACEHOLDER, WsnaFullName, ExternalLinkIcon, ArrowRightIcon } from "@/app/utils/icons";
import { useUser } from "@/app/components/global/UserInfo";
import { useMembershipLinks } from "@/app/hooks/useMembershipLinks";
import type { MembershipLinksResponse, MembershipLink } from "@/app/types/membership";
import React from "react";

function MembershipCardSection({ contact }: { contact: any }) {
  return (
    <div className="w-full flex justify-center px-4 py-6 md:p-8 bg-gradient-to-b from-[#eff6ff] to-[#dbeafe]">
      <div className="w-full max-w-lg rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] bg-white overflow-hidden">
        <div className="bg-primary-500 text-white px-4 py-3 flex justify-between items-center">
          <WsnaFullName />
          <span className="text-sm md:text-base font-medium">
            {contact?.["_wsna_membertype_value@OData.Community.Display.V1.FormattedValue"]}
          </span>
        </div>
        <div className="px-5 py-4 md:px-6 md:py-5 space-y-4 md:space-y-5">
          <div>
            <p className="text-xl md:text-2xl font-bold">
              {[contact?.fullname, contact?.wsna_credentials]
                .map((v: string | undefined) => v?.trim())
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              WSNA member since{" "}
              {contact?.wsna_datejoined &&
                new Intl.DateTimeFormat("en", { year: "numeric" }).format(
                  new Date(contact.wsna_datejoined)
                )}
            </p>
          </div>

          <div className="border-t border-gray-200" />

          <div className="space-y-3 md:space-y-4">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 mb-1 mx-1 shrink-0">
                <MembershipCardIcon />
              </span>
              <div>
                <p className="text-base md:text-lg tracking-wide font-medium">
                  {contact?.employeeid?.toString().replace(/,/g, "") || "NOT FOUND"}
                </p>
                <p className="text-xs md:text-sm text-gray-500">WSNA member number</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-6 h-6 mb-1 mx-1 shrink-0">
                <MembershipCardIconPLACEHOLDER />
              </span>
              <div>
                <p className="text-base md:text-lg tracking-wide font-medium">
                  {contact?.department?.toString().replace(/,/g, "") || "NOT FOUND"}
                </p>
                <p className="text-xs md:text-sm text-gray-500">ANA member number</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-6 h-6 mb-1 mx-1 shrink-0">
                <MembershipCardIconPLACEHOLDER />
              </span>
              <div>
                <p className="text-base md:text-lg tracking-wide font-medium">
                  {contact?.wsna_aftid?.toString().replace(/,/g, "") || "NOT FOUND"}
                </p>
                <p className="text-xs md:text-sm text-gray-500">AFT member number</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function LinkRow({ link, subtitle, isInternal = false }: {
  link: MembershipLink;
  subtitle: string;
  isInternal?: boolean;
}) {
  const inner = (
    <div className="flex justify-between items-center cursor-pointer py-3 border-b border-gray-200">
      <div>
        <p className="font-semibold text-base md:text-lg">{link.title}</p>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {link.url && (isInternal ? <ArrowRightIcon /> : <ExternalLinkIcon />)}
    </div>
  );

  if (!link.url) return <div>{inner}</div>;

  return (
    <a
      href={link.url}
      target={isInternal ? "_self" : "_blank"}
      rel={isInternal ? undefined : "noopener noreferrer"}
    >
      {inner}
    </a>
  );
}

function LinksSection({ links }: { links: MembershipLinksResponse }) {
  return (
    <div className="w-full flex px-4 md:px-6 justify-center">
      <div className="w-full max-w-lg py-4 md:py-6">

        {/* 1. Local Unit  */}
        {links.localUnits.map((link, i) => (
          <LinkRow key={i} link={link} subtitle="Local Unit Member" isInternal={true} />
        ))}

        {/* 2. Regional Nurses Association */}
        {links.regional && (
          <LinkRow link={links.regional} subtitle="Regional Nurses Association Member" />
        )}

        {/* 3. WSNA Membership Benefits */}
        {links.wsnaBenefits && (
          <LinkRow link={links.wsnaBenefits} subtitle="WSNA Member Benefits" />
        )}

        {/* 4. National Nurses Association */}
        {links.nationalNurses && (
          <LinkRow link={links.nationalNurses} subtitle="Premier Member Benefits" />
        )}

        {/* 5. National Union — union members only, filtered server-side */}
        {links.nationalUnion && (
          <LinkRow link={links.nationalUnion} subtitle="Member Discounts" />
        )}

      </div>
    </div>
  );
}


function LinksSectionError() {
  return (
    <div className="w-full flex px-6 justify-center">
      <div className="w-[500px] py-8">
        <p className="text-gray-500 text-sm text-center">
          Unable to load membership links. Please try again later.
        </p>
      </div>
    </div>
  );
}

export default function MembershipCard() {
  const { contact } = useUser();
  const { data, loading, error } = useMembershipLinks();

  if (!contact) return null;

  return (
    <>
      <MembershipCardSection contact={contact} />

      {loading && <div></div>}
      {error && !loading && <LinksSectionError />}
      {data && !loading && !error && <LinksSection links={data} />}
    </>
  );
}
