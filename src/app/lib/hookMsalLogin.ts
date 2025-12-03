import { AccountInfo } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";

export function useMsalLogin() {
    const { instance, accounts } = useMsal();
    const [user, setUser] = useState<AccountInfo | null>(accounts[0] || null);

    const login = async () => {
        const request = { scopes: ["openid", "profile", "email", "User.Read"], prompt: "select_account" };
        try {
            await instance.loginPopup(request);
            const allAccounts = instance.getAllAccounts();
            if (allAccounts.length > 0) setUser(allAccounts[0]);
        } catch (err) {
            console.error(err);
        }
    };

    const logout = async () => {
        try {
            if (user) await instance.logoutPopup({ account: user });
            setUser(null);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (accounts.length > 0) setUser(accounts[0]);
        else setUser(null);
    }, [accounts]);

    return { user, login, logout };
}
