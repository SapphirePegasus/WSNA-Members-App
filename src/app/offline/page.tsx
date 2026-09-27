import type { Metadata } from "next";
import OfflinePageContent from "./OfflinePageContent";

export const metadata: Metadata = {
    title: "You are offline",
    robots: { index: false, follow: false },
};

export default function OfflinePage() {
    return <OfflinePageContent />;
}