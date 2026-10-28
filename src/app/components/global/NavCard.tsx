import Link from "next/link";
import React from "react";

interface NavCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
}

export default function NavCard({ icon, title, description, href }: NavCardProps) {
    return (
        <Link href={href} className="block h-full">
            <div className="bg-[#f4f4f4] rounded-xl p-5 flex flex-col gap-3 hover:bg-gray-200 transition-colors cursor-pointer h-full">
                <div className="w-6 h-6 text-foreground">
                    {icon}
                </div>
                <div className="flex flex-col gap-1 flex-1">
                    <h3 className="text-lg font-bold text-foreground">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-snug line-clamp-3">
                        {description}
                    </p>
                </div>
                <span className="text-sm text-primary font-medium">
                    View &rsaquo;
                </span>
            </div>
        </Link>
    );
}