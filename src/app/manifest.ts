import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "학급 관리 · 대전대신고 2-9", short_name: "학급 관리",
    start_url: "/", scope: "/", display: "standalone", lang: "ko",
    background_color: "#0e0e10", theme_color: "#0e0e10",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}