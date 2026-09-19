"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface MobileMenuContextType {
    isOpen: boolean;
    open: () => void;
    close: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | null>(null);

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);

    return (
        <MobileMenuContext.Provider value={{ isOpen, open, close }}>
            {children}
        </MobileMenuContext.Provider>
    );
}

export function useMobileMenu(): MobileMenuContextType {
    const ctx = useContext(MobileMenuContext);
    if (!ctx) {
        throw new Error("useMobileMenu must be used inside MobileMenuProvider");
    }
    return ctx;
}