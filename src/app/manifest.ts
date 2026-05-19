import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "My WSNA | Member Portal",
        short_name: "My WSNA",
        description:
            "The official member portal for Washington State Nurses Association. Access your membership card, benefits, and professional growth resources.",
        start_url: "/home",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#0057b8",
        categories: ["business", "productivity"],
        icons: [
            {
                src: "/icons/favicon-16x16.png",
                sizes: "16x16",
                type: "image/png",
            },
            {
                src: "/icons/favicon-32x32.png",
                sizes: "32x32",
                type: "image/png",
            },
            {
                src: "/icons/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icons/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icons/icon-maskable-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/icons/icon-maskable-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
        shortcuts: [
            {
                name: "My Membership Card",
                short_name: "Membership",
                description: "View your WSNA membership card and benefits",
                url: "/membership",
                icons: [
                    {
                        src: "/icons/icon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                ],
            },
            {
                name: "My Growth Resources",
                short_name: "Growth",
                description: "Access professional development resources",
                url: "/growth",
                icons: [
                    {
                        src: "/icons/icon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                ],
            },
        ],
    };
}