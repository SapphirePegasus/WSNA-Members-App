import type { MetadataRoute } from "next";
import { routes } from "@/config/routes";

export default function robots(): MetadataRoute.Robots {
    // Derive disallowed paths from routes config - single source of truth
    const disallowedPaths = routes
        .filter((r) => !r.indexed)
        .map((r) => r.path);

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: disallowedPaths,
            },
        ],
        sitemap: "https://wsna.org/sitemap.xml",
    };
}