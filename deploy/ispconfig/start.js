/**
 * Start script for hosts WITHOUT shell access or a process manager (e.g. ISPConfig).
 * Run it every minute from an ISPConfig cron job:
 *
 *   cd /var/www/clients/clientX/webY/private/hvm && node start.js >> app.log 2>&1
 *
 * - If the app already answers on its port, this run exits immediately (no second copy).
 * - Otherwise it loads hvm-settings.env from this folder and starts the Next.js server,
 *   bound to 127.0.0.1 only — Nginx is the only way in.
 * - Upload an (empty) file named restart.txt to this folder to restart the app:
 *   the running copy exits within 5 seconds and the next cron run starts it again.
 * - If the app crashes or the server reboots, the next cron run (≤ 1 minute) starts it.
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");

const dir = __dirname;
const restartFile = path.join(dir, "restart.txt");
const logFile = path.join(dir, "app.log");
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

// 1. Settings: KEY=value lines; the value is everything after the first "=" (no quotes needed).
// Deliberately NOT named .env*: Next.js would re-read such a file and expand "$" in values,
// silently changing passwords that contain "$".
loadEnvFile(path.join(dir, "hvm-settings.env"));
process.env.PORT = process.env.PORT || "3100";
process.env.HOSTNAME = "127.0.0.1"; // never listen on public interfaces
process.env.NODE_ENV = "production";

// 2. Already running? Then there is nothing to do.
const probe = net.connect({ host: "127.0.0.1", port: Number(process.env.PORT) });
probe.setTimeout(3000);
probe.once("connect", () => { probe.destroy(); process.exit(0); });
probe.once("timeout", () => { probe.destroy(); process.exit(0); });
probe.once("error", () => start());

function start() {
  try {
    if (fs.statSync(logFile).size > 5 * 1024 * 1024) fs.truncateSync(logFile, 0); // keep the log small
  } catch {}
  fs.rmSync(restartFile, { force: true });
  log(`starting ${readRevision()} on 127.0.0.1:${process.env.PORT}`);
  setInterval(() => {
    if (fs.existsSync(restartFile)) {
      log("restart.txt found — exiting; the next cron run starts the app again");
      fs.rmSync(restartFile, { force: true });
      process.exit(0);
    }
  }, 5000);
  require("./server.js");
}

function loadEnvFile(file) {
  let text;
  try { text = fs.readFileSync(file, "utf8"); } catch { log(`WARNING: ${file} not found`); return; }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.length > 1 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0]) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

function readRevision() {
  try { return `revision ${fs.readFileSync(path.join(dir, "REVISION"), "utf8").trim()}`; } catch { return "app"; }
}
