"use client";

import {
  MembershipCardIcon,
  MembershipCardIconPLACEHOLDER,
  WsnaFullName,
  ExternalLinkIcon,
  ArrowRightIcon,
} from "@/app/utils/icons";
import { useUser } from "@/app/components/global/UserInfo";
import { useMembershipLinks } from "@/app/hooks/useMembershipLinks";
import type {
  MembershipLinksResponse,
  MembershipLink,
} from "@/app/types/membership";
import type { ContactRecord } from "@/app/dataverse/contactRepository";
import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERSHIP CARD SECTION
//
// contact is typed as ContactRecord & Record<string, unknown> to allow access
// to OData annotation fields (e.g. _wsna_membertype_value@OData...) that are
// present on the raw Dataverse response but not formally declared on
// ContactRecord. Once those fields are added to ContactRecord and CONTACT_SELECT
// in contactRepository.ts, the Record<string, unknown> intersection can be
// removed and the type tightened to ContactRecord only.
//
// membershipCategory drives ID visibility:
//   "member"     → all three ID blocks rendered
//   "non-member" → ID blocks hidden, rest of card unchanged
// ─────────────────────────────────────────────────────────────────────────────
type ContactWithAnnotations = ContactRecord & Record<string, unknown>;

function MembershipCardSection({
  contact,
}: {
  contact: ContactWithAnnotations;
}) {
  const isMember = contact.membershipCategory === "member";

  return (
    <div className="w-full flex justify-center px-4 py-6 md:p-8 bg-gradient-to-b from-[#eff6ff] to-[#dbeafe]">
      <div className="w-full max-w-lg rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] bg-white overflow-hidden">

        {/* ── Card header ───────────────────────────────────────────── */}
        <div className="bg-primary-500 text-white px-4 py-3 flex justify-between items-center">
          <WsnaFullName />
          <span className="text-sm md:text-base font-medium">
            {contact["_wsna_membertype_value@OData.Community.Display.V1.FormattedValue"] as string | undefined}
          </span>
          {isMember ? <>Member</> : <>Non-Member</>}
        </div>

        <div className="px-5 py-4 md:px-6 md:py-5 space-y-4 md:space-y-5">

          {/* ── Name + member since ───────────────────────────────── */}
          <div>
            <p className="text-xl md:text-2xl font-bold">
              {[contact.fullname, contact.wsna_credentials]
                .map((v) => v?.trim())
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              WSNA Member Since{" "}
              {contact.wsna_datejoined &&
                new Intl.DateTimeFormat("en", {
                  year: "numeric",
                }).format(new Date(contact.wsna_datejoined))}
            </p>
          </div>

          <div className="border-t border-gray-200" />

          {/* ── ID numbers — visible to members only ──────────────── */}
          {isMember && (
            <div className="space-y-3 md:space-y-4">

              {/* WSNA Member ID */}
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 pt-1 mb-1 mx-1 shrink-0">
                  <MembershipCardIcon />
                </span>
                <div>
                  <p className="text-base md:text-lg tracking-wide font-medium">
                    {contact.employeeid
                      ?.toString()
                      .replace(/,/g, "") ?? "NOT FOUND"}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">
                    WSNA Member ID
                  </p>
                </div>
              </div>

              {/* ANA Member ID — only if present */}
              {contact.department && (
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 mb-1 mx-1 shrink-0">
                    <MembershipCardIconPLACEHOLDER />
                  </span>
                  <div>
                    <p className="text-base md:text-lg tracking-wide font-medium">
                      {contact.department
                        .toString()
                        .replace(/,/g, "")}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      ANA Member ID
                    </p>
                  </div>
                </div>
              )}

              {/* AFT Member ID — only if present */}
              {contact.wsna_aftid && (
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 mb-1 mx-1 shrink-0">
                    <MembershipCardIconPLACEHOLDER />
                  </span>
                  <div>
                    <p className="text-base md:text-lg tracking-wide font-medium">
                      {contact.wsna_aftid
                        .toString()
                        .replace(/,/g, "")}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      AFT Member ID
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LINK ROW
// Unchanged — renders a single membership link in three states:
//   internal link (local unit) → ArrowRightIcon, target _self
//   external link              → ExternalLinkIcon, target _blank
//   no URL                     → plain div, no anchor
// ─────────────────────────────────────────────────────────────────────────────
function LinkRow({
  link,
  subtitle,
  isInternal = false,
}: {
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
    </a >
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LINKS SECTION — unchanged
// ─────────────────────────────────────────────────────────────────────────────
function LinksSection({ links }: { links: MembershipLinksResponse }) {
  return (
    <div className="w-full flex px-4 md:px-6 justify-center">
      <div className="w-full max-w-lg py-4 md:py-6">

        {links.localUnits.map((link, i) => (
          <LinkRow
            key={i}
            link={link}
            subtitle="Local Unit Member"
            isInternal={true}
          />
        ))}

        {links.regional && (
          <LinkRow
            link={links.regional}
            subtitle="Regional Nurses Association Member"
          />
        )}

        {links.wsnaBenefits && (
          <LinkRow
            link={links.wsnaBenefits}
            subtitle="WSNA Member Benefits"
          />
        )}

        {links.nationalNurses && (
          <LinkRow
            link={links.nationalNurses}
            subtitle="Premier Member Benefits"
          />
        )}

        {links.nationalUnion && (
          <LinkRow
            link={links.nationalUnion}
            subtitle="Member Discounts"
          />
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LINKS LOADING SKELETON — unchanged
// ─────────────────────────────────────────────────────────────────────────────
function LinksSectionSkeleton() {
  return (
    <div className="w-full flex px-4 md:px-6 justify-center">
      <div className="w-full max-w-lg py-4 md:py-6 animate-pulse space-y-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex justify-between items-center py-3 border-b border-gray-200"
          >
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-48" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </div>
            <div className="h-4 w-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LINKS ERROR STATE — unchanged
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERSHIP CARD — root component, unchanged orchestration
// ─────────────────────────────────────────────────────────────────────────────
export default function MembershipCard() {
  const { contact } = useUser();
  const { data, loading, error } = useMembershipLinks();

  if (!contact) return null;

  return (
    <>
      <MembershipCardSection
        contact={contact as ContactWithAnnotations}
      />

      {loading && <LinksSectionSkeleton />}
      {error && !loading && <LinksSectionError />}
      {data && !loading && !error && <LinksSection links={data} />}
    </>
  );
}