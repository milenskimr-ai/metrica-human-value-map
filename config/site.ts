/** Public base URL. Set NEXT_PUBLIC_SITE_URL per environment; production target is cx.metrica.bg. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://cx.metrica.bg").replace(/\/$/, "");
