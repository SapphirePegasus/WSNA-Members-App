import type { Metadata } from "next";
import AuthGuard from "@/app/components/global/AuthGuard";
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
      <MembershipPageContent />
    </AuthGuard>
  );
}