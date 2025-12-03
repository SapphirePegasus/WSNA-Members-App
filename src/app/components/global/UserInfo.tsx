"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";

interface User {
    name: string;
    email: string;
    account: any;
}

interface ContactData {
    //To add any column here first add it inside dataverse/apiContact.tsx
    contactid: string;
    fullname?: string;
    emailaddress1?: string;
    employeeid?: string; //wsna id
    wsna_aftid?: string; //aft id
    department?: string; //ana id
    [key: string]: any;
}

interface UserContextType {
    user: User | null;
    contact: ContactData | null;
    status: "loading" | "registered" | "not-registered" | "signed-out";
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { instance, accounts } = useMsal();
    const [user, setUser] = useState<User | null>(null);
    const [contact, setContact] = useState<ContactData | null>(null);
    const [status, setStatus] = useState<"loading" | "registered" | "not-registered" | "signed-out">("signed-out");

    useEffect(() => {
        if (accounts.length > 0) {
            const acc = accounts[0];
            setUser({ name: acc.name || "", email: acc.username || "", account: acc });

            // Start checking membership
            setStatus("loading");
            fetchContact(acc.username);
        } else {
            setUser(null);
            setContact(null);
            setStatus("signed-out");
        }
    }, [accounts]);

    const fetchContact = async (email: string) => {
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (data.found) {
                setContact(data.contact);
                setStatus("registered");
            } else {
                setContact(null);
                setStatus("not-registered");
            }
        } catch (err) {
            console.error("Error fetching contact:", err);
            setStatus("not-registered");
        }
    };

    const login = async () => {
        try {
            const request = { scopes: ["openid", "profile", "email"], prompt: "select_account" };
            await instance.loginPopup(request);
            // accounts will update; useEffect above will run
        } catch (err) {
            console.error("Login error:", err);
        }
    };

    const logout = async () => {
        try {
            if (user?.account) {
                await instance.logoutPopup({ account: user.account });
            } else {
                await instance.logoutPopup();
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            setUser(null);
            setContact(null);
            setStatus("signed-out");
        }
    };

    return (
        <UserContext.Provider value={{ user, contact, status, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser(): UserContextType {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used inside UserProvider");
    return ctx;
}
