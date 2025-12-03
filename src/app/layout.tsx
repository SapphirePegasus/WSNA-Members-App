import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/mobile/header";
import BottomNav from "./components/mobile/bottomNav";
import HeaderPC from "./components/desktop/header";
import MsalProviderClient from "./components/global/MsalProviderClient";
import { UserProvider } from "./components/global/UserInfo";

export const metadata: Metadata = {
  title: "WSNA Members App",
  description: "An app created by Prittam Bhattacharyya for WSNA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <MsalProviderClient>
          <UserProvider>
            <Header />
            <HeaderPC />
            {children}
            <BottomNav />
          </UserProvider>
        </MsalProviderClient>
      </body>
    </html>
  );
}
