"use client";

import React from "react";
import { getFileIcon, getFileIconColorClass } from "@/app/lib/fileIconMap";
import { formatFileSize, formatFileKindLabel } from "@/app/lib/resourcesUtils";
import type { FileAsset } from "@/app/types/resources";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// Accepts a FileAsset directly - the parent component destructures nothing,
// just passes the asset object through. This keeps the call site clean and
// means adding a new field to FileAsset automatically makes it available here
// without changing the component signature.
// ─────────────────────────────────────────────────────────────────────────────
interface DownloadCardProps {
    file: FileAsset;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD CARD
// Renders a single downloadable file card matching the org design system spec.
// Opens in a new tab with the appropriate security attributes.
// Pure presentational - no state, no side effects, no data fetching.
// ─────────────────────────────────────────────────────────────────────────────
export default function DownloadCard({ file }: DownloadCardProps) {
    const IconComponent = getFileIcon(file.kind);
    const iconColorClass = getFileIconColorClass(file.kind);
    const formattedSize = formatFileSize(file.size);
    const kindLabel = formatFileKindLabel(file.kind);

    return (
        <div className="rounded-lg border border-white bg-white max-w-md lg:max-w-lg h-full">
            <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Download ${file.title} - ${formattedSize} ${kindLabel}`}
                className="group flex flex-row w-full border-2 border-zinc-300 hover:border-primary-300 rounded-lg transition-colors justify-between items-center shadow-sm bg-zinc-100 h-full text-left"
            >
                {/* ── Icon column ───────────────────────────────────────────────── */}
                <div className="flex items-center bg-zinc-100 w-10 text-center group-hover:bg-primary-100 self-stretch justify-center shrink-0 rounded-l-lg transition-colors">
                    <div className={`w-4 py-4 ${iconColorClass}`}>
                        <IconComponent
                            aria-hidden="true"
                            focusable="false"
                            className="w-full h-full"
                        />
                    </div>
                </div>

                {/* ── Content column ────────────────────────────────────────────── */}
                <div className="w-full flex flex-col md:flex-row md:justify-between gap-y-1 py-4 md:items-center bg-white rounded-r-lg h-full">

                    {/* Title + subtitle */}
                    <div className="w-full text-sm font-medium pl-4 pr-4 md:pr-8 self-center transition-colors">
                        <span className="text-primary">
                            {file.title}
                        </span>
                        {file.subtitle && (
                            <div className="text-xs text-zinc-500 mt-1 font-normal group-hover:text-primary">
                                {file.subtitle}
                            </div>
                        )}
                    </div>

                    {/* File size + kind label - side by side */}
                    <div className="pr-3 py-1 shrink-0 pl-4 md:pl-0">
                        <div className="flex flex-row items-center gap-2 text-zinc-500 group-hover:text-primary">
                            <span className="text-xs">{formattedSize}</span>
                            <span className="text-xs">{kindLabel}</span>
                        </div>
                    </div>
                </div>
            </a>
        </div>
    );
}