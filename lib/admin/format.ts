import type { Level } from "@/config/scoring";
import { createT } from "@/lib/i18n";
import type { AdminRow } from "./types";

/** The admin UI is English-only; answer labels come from the EN locale via stable IDs. */
export const adminT = createT("en");

const TZ = "Europe/Sofia";
const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" });

export const dayKey = (d: string | number) => new Date(d).toLocaleDateString("sv-SE", { timeZone: TZ });
export const formatDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "—");
export const opportunityName = (id: string) => adminT(`opportunity.categories.${id}.name`);
export const challengeName = (id: string | null) => (id ? adminT(`questions.biggest_challenge.answers.${id}`) : "—");
export const levelName = (l: Level) => adminT(`dimensions.automation.levels.${l}`);
export const fullName = (r: AdminRow) => [r.first_name, r.last_name].filter(Boolean).join(" ");
