import type { Metadata } from "next";
import AuthGuard from "@/app/components/global/AuthGuard";
import HomePageContent from "@/app/components/home/HomePageContent";

export const metadata: Metadata = {
    title: "Home",
    description: "Your WSNA member dashboard.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function HomePage() {
    return (
        <AuthGuard>
            <HomePageContent />
        </AuthGuard>
    );
}