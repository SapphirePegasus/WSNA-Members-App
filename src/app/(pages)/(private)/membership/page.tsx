import type { Metadata } from "next";
import AuthGuard from "@/app/components/global/AuthGuard";
import { Suspense } from "react";
import MembershipPageContent from "@/app/components/membership/MembershipPageContent";

export const metadata: Metadata = {
  title: "My Membership",
  description: "View and manage your WSNA membership details.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MembershipPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <MembershipPageContent />
    </Suspense>
  );
}