import { UserProvider } from "@/app/components/global/UserInfo";

export default function PagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <UserProvider>{children}</UserProvider>;
}

