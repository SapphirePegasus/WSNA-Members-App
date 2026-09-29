import type { Metadata } from "next";
import NotAMemberContent from "./NotAMemberContent";

export const metadata: Metadata = {
    title: "Not a Member",
    description: "Your account was not found in the WSNA member database.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function NotAMemberPage() {
    return <NotAMemberContent />;
}