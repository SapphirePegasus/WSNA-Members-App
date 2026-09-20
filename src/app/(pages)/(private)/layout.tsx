import PrivateShell from "@/app/components/global/PrivateShell";

export default function PrivateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <PrivateShell>{children}</PrivateShell>;
}