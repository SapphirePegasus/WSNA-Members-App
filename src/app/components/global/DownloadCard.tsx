"use client";

import React from "react";
import { getFileIcon, getFileIconColorClass } from "@/app/lib/fileIconMap";
import { formatFileSize, formatFileKindLabel } from "@/app/lib/resourcesUtils";
import type { FileAsset } from "@/app/types/resources";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// Accepts a FileAsset directly — the parent component destructures nothing,
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
// Pure presentational — no state, no side effects, no data fetching.
//
// Structure (matches org HTML reference exactly):
//   outer wrapper div (rounded border, max-width)
//   └── anchor (group, flex row, hover border, shadow)
//       ├── icon column (grey bg → blue on hover, rounded-l)
//       │   └── file type SVG icon
//       └── content column (white bg, rounded-r)
//           ├── title + optional subtitle
//           └── file size + file type label
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
                aria-label={`Download ${file.title} — ${formattedSize} ${kindLabel}`}
                className="group flex flex-row w-full border-2 border-transparent hover:border-blue-400 rounded-lg transition-colors justify-between items-center hover:no-underline shadow-sm bg-gray-100 h-full text-left"
            >
                {/* ── Icon column ───────────────────────────────────────────────── */}
                <div className="flex items-center bg-gray-100 w-10 text-center group-hover:bg-blue-50 self-stretch justify-center shrink-0 rounded-l-lg transition-colors">
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
                    <div className="w-full text-sm font-medium pl-4 pr-4 md:pr-8 text-blue-700 group-hover:text-blue-600 self-center transition-colors">
                        {file.title}
                        {file.subtitle && (
                            <div className="text-xs text-gray-500 mt-1 font-normal">
                                {file.subtitle}
                            </div>
                        )}
                    </div>

                    {/* File size + kind label */}
                    <div className="pr-3 py-1 shrink-0 pl-4 md:pl-0 md:w-20">
                        <div className="flex md:flex-col text-gray-500">
                            <div className="text-xs w-16 mb-1">{formattedSize}</div>
                            <div className="text-xs md:w-10">{kindLabel}</div>
                        </div>
                    </div>
                </div>
            </a>
        </div>
    );
}