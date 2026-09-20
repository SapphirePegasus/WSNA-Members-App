"use client";

import Header from "@/app/components/mobile/header";
import BottomNav from "@/app/components/mobile/bottomNav";
import HeaderPC from "@/app/components/desktop/header";
import { UserProvider } from "@/app/components/global/UserInfo";
import { MobileMenuProvider, useMobileMenu } from "@/app/contexts/MobileMenuContext";
import { UserMenuPanel } from "@/app/components/mobile/userMenuOverlay";

interface AppShellProps {
    children: React.ReactNode;
}

function AppShellContent({ children }: AppShellProps) {
    const { isOpen } = useMobileMenu();

    return (
        <>
            <div inert={isOpen || undefined}>
                <Header />
                <HeaderPC />
                {children}
                <BottomNav
                    hideOnScrollDown={true}
                    unhideOnScrollUp={true}
                    unhideOnScrollStop={false}
                />
            </div>
            <UserMenuPanel />
        </>
    );
}

export default function AppShell({ children }: AppShellProps) {
    return (
        <UserProvider>
            <MobileMenuProvider>
                <AppShellContent>{children}</AppShellContent>
            </MobileMenuProvider>
        </UserProvider>
    );
}