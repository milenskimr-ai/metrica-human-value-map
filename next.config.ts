import type { NextConfig } from "next";

/**
 * Static export: `npm run build` writes plain HTML/CSS/JS to out/.
 * Nothing runs Node.js on the server — the PHP backend lives in php/api/
 * (see scripts/build-php-site.sh, which combines both into the upload package).
 *
 * Security headers can't be set by a static export; the CSP is a <meta> tag in
 * app/layout.tsx, the PHP endpoints send their own headers, and DEPLOYMENT.md lists
 * optional Nginx directives for the rest (HSTS, X-Frame-Options).
 */
const nextConfig: NextConfig = {
  output: "export",
  // /admin → admin/index.html, served by Nginx as a plain directory index (no rewrite rules)
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
