import type { Metadata } from "next";
import AuthGuard from "@/app/components/global/AuthGuard";
import GrowthPageContent from "@/app/components/growth/GrowthPageContent";

export const metadata: Metadata = {
  title: "My Growth",
  description: "Access your WSNA professional growth resources.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GrowthPage() {
  return (
    <AuthGuard>
      <GrowthPageContent />
    </AuthGuard>
  );
}