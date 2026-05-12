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
    <AuthGuard>
      <Suspense fallback={
        <div className="w-full h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <MembershipPageContent />
      </Suspense>
    </AuthGuard>
  );
}