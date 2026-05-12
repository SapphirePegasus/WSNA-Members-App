import AppShell from "@/app/components/global/AppShell";

export default function PagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppShell>{children}</AppShell>;
}