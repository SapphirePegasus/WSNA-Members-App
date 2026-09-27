// ─────────────────────────────────────────────────────────────────────────────
// Supported file kind values as returned by Craft CMS.
// Using a union type (not a plain string) so every consumer gets compile-time
// exhaustiveness checking - if Craft adds a new kind, TypeScript will flag it.
// ─────────────────────────────────────────────────────────────────────────────
export type FileKind =
    | "audio"
    | "compressed"
    | "excel"
    | "image"
    | "pdf"
    | "powerpoint"
    | "text"
    | "word"
    | "unknown"; // fallback for anything Craft returns that we haven't mapped

// ─────────────────────────────────────────────────────────────────────────────
// A single downloadable file asset attached to a topic.
// Field names match the GraphQL query exactly so the API response can be
// assigned directly without a mapping step.
// ─────────────────────────────────────────────────────────────────────────────
export interface FileAsset {
    id: string;
    title: string;
    subtitle: string | null; // max 75 chars as per spec; null when not provided
    url: string;
    size: number; // raw bytes - formatted in the UI layer, never here
    kind: FileKind;
}

// ─────────────────────────────────────────────────────────────────────────────
// A raw topic entry exactly as returned by the GraphQL flat list.
// `level`, `lft`, and `parent` are the Craft CMS structural fields we need
// to rebuild the hierarchy client-side.
// ─────────────────────────────────────────────────────────────────────────────
export interface RawTopicEntry {
    id: string;
    title: string;
    slug: string;
    level: number; // 1 | 2 | 3
    lft: number;
    rgt: number;
    parent: { id: string } | null;
    description: string | null; // max 400 chars as per spec; null when not set
    files: FileAsset[];
}

// ─────────────────────────────────────────────────────────────────────────────
// A topic node after the flat list has been processed into a tree.
// `children` holds nested subtopics at the next level down.
// This is the shape every UI component works with - never the raw flat entry.
// ─────────────────────────────────────────────────────────────────────────────
export interface TopicNode {
    id: string;
    title: string;
    level: number;
    description: string | null;
    files: FileAsset[];
    children: TopicNode[];
}

// ─────────────────────────────────────────────────────────────────────────────
// The shape of the API route's JSON response.
// Keeping it explicit means the hook knows exactly what to expect and any
// future shape change is caught at compile time, not at runtime.
// ─────────────────────────────────────────────────────────────────────────────
export interface ResourcesApiResponse {
    topics: RawTopicEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// The Craft CMS section identifier passed as a query-string param to the API
// route, and as a prop to the Resources component.
// Typing it as a string (not a union) keeps it open-ended - new sections can
// be added in Craft without touching this file.
// ─────────────────────────────────────────────────────────────────────────────
export type ResourceSection = string; // e.g. "appResourceTopics_Growth"