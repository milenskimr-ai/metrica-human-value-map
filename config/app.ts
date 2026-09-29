/**
 * General app settings.
 */

export const APP_CONFIG = {
  /** Conference mode default. Per-device override: ?conference=1 or ?conference=0 */
  conferenceModeDefault: process.env.NEXT_PUBLIC_CONFERENCE_MODE === "true",

  /**
   * Conference mode only: after this many seconds without any tap/scroll/key,
   * show the "Still there?" warning; after the warning, reset for the next visitor.
   */
  idleTimeoutSeconds: 90,
  idleWarningSeconds: 10,

  /** "Talk to Metrica" button target. TODO: confirm with Metrica. */
  contactUrl: "https://metrica.bg",

  /** Privacy policy link shown under the consent checkbox. TODO: confirm with Metrica. Empty = hidden. */
  privacyPolicyUrl: "",

  /**
   * Bump whenever the consent wording in /locales changes.
   * Stored with every lead so each consent can be traced to the exact text shown.
   */
  consentVersion: "2026-09-v1",
} as const;
