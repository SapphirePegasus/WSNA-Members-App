import React from "react";

import {
    FileAudioIcon,
    FileArchiveIcon,
    FileExcelIcon,
    FileIcon,
    FileImageIcon,
    FilePdfIcon,
    FilePowerpointIcon,
    FileTextIcon,
    FileWordIcon,
} from "@/app/utils/icons";

import type { FileKind } from "@/app/types/resources";

// ─────────────────────────────────────────────────────────────────────────────
// Maps every known FileKind to its corresponding icon component.
// Using `Record<FileKind, ...>` forces TypeScript to verify that every member
// of the FileKind union has an entry here. Adding a new kind to the union
// without adding it to this map will be a compile error, not a silent gap.
// ─────────────────────────────────────────────────────────────────────────────
const FILE_ICON_MAP: Record<FileKind, React.FC<React.SVGProps<SVGSVGElement>>> =
{
    audio: FileAudioIcon,
    compressed: FileArchiveIcon,
    excel: FileExcelIcon,
    image: FileImageIcon,
    pdf: FilePdfIcon,
    powerpoint: FilePowerpointIcon,
    text: FileTextIcon,
    word: FileWordIcon,
    unknown: FileIcon,
};

// ─────────────────────────────────────────────────────────────────────────────
// Maps every known FileKind to its display color token.
// These are Tailwind CSS class strings applied to the icon wrapper and icon
// itself - grey at rest, blue on group hover - matching the org's design spec.
// ─────────────────────────────────────────────────────────────────────────────
const FILE_ICON_COLOR_MAP: Record<FileKind, string> = {
    audio: "text-zinc-500 group-hover:text-primary",
    compressed: "text-zinc-500 group-hover:text-primary",
    excel: "text-zinc-500 group-hover:text-primary",
    image: "text-zinc-500 group-hover:text-primary",
    pdf: "text-zinc-500 group-hover:text-primary",
    powerpoint: "text-zinc-500 group-hover:text-primary",
    text: "text-zinc-500 group-hover:text-primary",
    word: "text-zinc-500 group-hover:text-primary",
    unknown: "text-zinc-500 group-hover:text-primary",
};

// ─────────────────────────────────────────────────────────────────────────────
// Normalises whatever string Craft CMS returns into a valid FileKind.
// The GraphQL `kind` field is typed as string on the wire - this is the single
// point where we coerce it into our union and fall back safely to "unknown".
// Every other part of the codebase receives a FileKind, never a raw string.
// ─────────────────────────────────────────────────────────────────────────────
const VALID_KINDS = new Set<FileKind>([
    "audio",
    "compressed",
    "excel",
    "image",
    "pdf",
    "powerpoint",
    "text",
    "word",
    "unknown",
]);

export function normaliseFileKind(raw: string): FileKind {
    const lower = raw.toLowerCase() as FileKind;
    return VALID_KINDS.has(lower) ? lower : "unknown";
}

// ─────────────────────────────────────────────────────────────────────────────
// Returns the icon component for a given FileKind.
// Consumers never import individual icon components - they call this function.
// This is the only place that knows which SVG corresponds to which file type.
// ─────────────────────────────────────────────────────────────────────────────
export function getFileIcon(
    kind: FileKind
): React.FC<React.SVGProps<SVGSVGElement>> {
    return FILE_ICON_MAP[kind];
}

// ─────────────────────────────────────────────────────────────────────────────
// Returns the Tailwind colour classes for a given FileKind.
// Kept here alongside the icon map so both concerns change together if the
// design system ever updates its colour tokens.
// ─────────────────────────────────────────────────────────────────────────────
export function getFileIconColorClass(kind: FileKind): string {
    return FILE_ICON_COLOR_MAP[kind];
}