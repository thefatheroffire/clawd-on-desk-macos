#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawn } = require("child_process");

const APP_ROOT = path.resolve(__dirname, "..");
const DEFAULT_GEMINI_BIN = "gemini";
const DEFAULT_PORT = 23333;
const SOURCE_GEMINI_HOME = path.join(os.homedir(), ".gemini");
const QUIET_HOME_ROOT = path.join(APP_ROOT, ".gemini", "no-pet-home");
const QUIET_GEMINI_HOME = path.join(QUIET_HOME_ROOT, ".gemini");
const SYNC_FILES = [
  "google_accounts.json",
  "installation_id",
  "oauth_creds.json",
  "projects.json",
  "state.json",
  "trustedFolders.json",
  "trusted_hooks.json",
];

main();

function main() {
  prepareQuietGeminiHome();
  stopPetByPort(DEFAULT_PORT);
  launchGemini(process.argv.slice(2));
}

function prepareQuietGeminiHome() {
  fs.mkdirSync(QUIET_GEMINI_HOME, { recursive: true });

  for (const fileName of SYNC_FILES) {
    syncOptionalFile(path.join(SOURCE_GEMINI_HOME, fileName), path.join(QUIET_GEMINI_HOME, fileName));
  }

  const sourceSettings = readJsonFile(path.join(SOURCE_GEMINI_HOME, "settings.json"));
  const quietSettings = {
    ...sourceSettings,
    hooksConfig: {
      ...(sourceSettings.hooksConfig || {}),
      enabled: false,
    },
    hooks: {},
  };

  fs.writeFileSync(path.join(QUIET_GEMINI_HOME, "settings.json"), `${JSON.stringify(quietSettings, null, 2)}\n`);
}

function syncOptionalFile(sourcePath, destinationPath) {
  if (!fs.existsSync(sourcePath)) {
    return;
  }
  fs.copyFileSync(sourcePath, destinationPath);
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

function stopPetByPort(port) {
  const pids = findListeningPids(port);
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (_err) {
      // Best effort only. If the process is already gone or inaccessible,
      // Gemini should still continue.
    }
  }
}

function findListeningPids(port) {
  try {
    const output = execFileSync("lsof", ["-tiTCP:" + String(port), "-sTCP:LISTEN"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return output
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
  } catch (_err) {
    return [];
  }
}

function launchGemini(args) {
  const env = {
    ...process.env,
    GEMINI_CLI_HOME: QUIET_HOME_ROOT,
  };

  const child = spawn(DEFAULT_GEMINI_BIN, args, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code || 0);
  });
}
