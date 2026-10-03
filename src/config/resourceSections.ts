export const RELEASED_RESOURCE_SECTIONS = [
    "appResourceTopics_Growth",
    "appResourceTopics_Membership",
] as const;

export type ReleasedResourceSection =
    (typeof RELEASED_RESOURCE_SECTIONS)[number];

const RELEASED = new Set<string>(RELEASED_RESOURCE_SECTIONS);

export function isReleasedResourceSection(
    value: string
): value is ReleasedResourceSection {
    return RELEASED.has(value);
}