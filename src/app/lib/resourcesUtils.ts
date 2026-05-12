import type { RawTopicEntry, TopicNode } from "@/app/types/resources";

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT FILE SIZE
// Converts raw bytes from the Craft CMS GraphQL response into a readable
// string matching the design pattern (e.g. "148 KB", "1 MB").
// ─────────────────────────────────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) return "0 KB";

    const KB = 1024;
    const MB = 1024 * KB;
    const GB = 1024 * MB;

    if (bytes >= GB) return `${Math.floor(bytes / GB)} GB`;
    if (bytes >= MB) return `${Math.floor(bytes / MB)} MB`;
    return `${Math.floor(bytes / KB)} KB`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT FILE KIND LABEL
// Converts the normalised FileKind string into the uppercase display label
// shown on the card (e.g. "pdf" → "PDF", "word" → "WORD").
// Kept separate from fileIconMap.ts because label formatting is a display
// concern, while icon mapping is a component-binding concern.
// ─────────────────────────────────────────────────────────────────────────────
export function formatFileKindLabel(kind: string): string {
    if (kind === "compressed") return "ZIP";
    return kind.toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC HAS VISIBLE CONTENT
// Recursively determines whether a topic node should be rendered at all.
// A topic is visible if it directly has files, or if any of its descendants
// (at any depth) have files. Topics with no files anywhere in their subtree
// are silently omitted as per the spec.
// This runs on the tree after it has been built, not on raw entries, because
// we need the full subtree available to check descendants.
// ─────────────────────────────────────────────────────────────────────────────
export function topicHasVisibleContent(topic: TopicNode): boolean {
    if (topic.files.length > 0) return true;
    return topic.children.some(topicHasVisibleContent);
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD TOPIC TREE
// Converts the flat ordered list returned by GraphQL into a typed tree of
// TopicNode objects. Uses parent.id references (not lft/rgt) because parent
// references are explicit and safe - lft/rgt nested-set arithmetic is
// fragile if Craft ever returns entries out of order.
//
// Algorithm:
//   1. Build a Map<id, TopicNode> for O(1) parent lookup.
//   2. Walk the flat list once: attach each entry to its parent's children
//      array, or to the root array if it has no parent.
//   3. After building, filter the root array to only nodes with visible
//      content (recursion handles subtrees).
//
// Time complexity: O(n) - single pass through the flat list.
// ─────────────────────────────────────────────────────────────────────────────
export function buildTopicTree(entries: RawTopicEntry[]): TopicNode[] {
    // Step 1 - initialise every entry as a TopicNode with an empty children array
    const nodeMap = new Map<string, TopicNode>();

    for (const entry of entries) {
        nodeMap.set(entry.id, {
            id: entry.id,
            title: entry.title,
            level: entry.level,
            description:
                entry.description && entry.description.trim().length > 0
                    ? entry.description.trim()
                    : null,
            files: entry.files,
            children: [],
        });
    }

    // Step 2 - wire up parent → child relationships
    const roots: TopicNode[] = [];

    for (const entry of entries) {
        const node = nodeMap.get(entry.id);
        if (!node) continue;

        if (entry.parent?.id) {
            const parentNode = nodeMap.get(entry.parent.id);
            if (parentNode) {
                parentNode.children.push(node);
            } else {
                // Parent referenced but not found in the result set.
                // Treat as a root rather than silently dropping the node.
                roots.push(node);
            }
        } else {
            roots.push(node);
        }
    }

    // Step 3 - prune topics with no visible content anywhere in their subtree
    return roots.filter(topicHasVisibleContent);
}