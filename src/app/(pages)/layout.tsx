import { UserProvider } from "@/app/components/global/UserInfo";

export default function PagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <UserProvider>{children}</UserProvider>;
}

/*
import AppShell from "@/app/components/global/AppShell";

export default function PagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppShell>
            <div className="min-h-dvh">
                {children}
            </div>
        </AppShell>
    );
}*/

