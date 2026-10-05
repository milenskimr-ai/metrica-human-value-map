import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

// Written once at build time as a plain robots.txt file (static export).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    host: SITE_URL,
  };
}
