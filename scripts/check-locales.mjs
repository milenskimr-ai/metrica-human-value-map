// Verifies that every locale file has exactly the same keys.
// Run: npm run check:locales
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "locales");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

const keysets = Object.fromEntries(
  files.map((f) => [f, new Set(flatten(JSON.parse(readFileSync(join(dir, f), "utf8"))))]),
);

let ok = true;
for (const a of files) {
  for (const b of files) {
    if (a === b) continue;
    const missing = [...keysets[a]].filter((k) => !keysets[b].has(k));
    if (missing.length) {
      ok = false;
      console.error(`Missing in ${b} (present in ${a}):\n  ${missing.join("\n  ")}`);
    }
  }
}
if (!ok) process.exit(1);
console.log(`Locales OK (${files.join(", ")})`);
