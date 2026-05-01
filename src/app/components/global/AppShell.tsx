"use client";

import Header from "@/app/components/mobile/header";
import BottomNav from "@/app/components/mobile/bottomNav";
import HeaderPC from "@/app/components/desktop/header";
import MsalProviderClient from "@/app/components/global/MsalProviderClient";
import { UserProvider } from "@/app/components/global/UserInfo";

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    return (
        <MsalProviderClient>
            <UserProvider>
                <Header />
                <HeaderPC />
                {children}
                <BottomNav />
            </UserProvider>
        </MsalProviderClient>
    );
}