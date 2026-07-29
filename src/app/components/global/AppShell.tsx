"use client";

import Header from "@/app/components/mobile/header";
import BottomNav from "@/app/components/mobile/bottomNav";
import HeaderPC from "@/app/components/desktop/header";
import { UserProvider } from "@/app/components/global/UserInfo";

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    return (
        <UserProvider>
            <Header />
            <HeaderPC />
            {children}
            <BottomNav />
        </UserProvider>
    );
}