#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const APP_ROOT = path.resolve(__dirname, "..");
const GEMINI_DIR = path.join(os.homedir(), ".gemini");
const USER_SETTINGS_PATH = path.join(GEMINI_DIR, "settings.json");
const HOOK_SCRIPT_PATH = path.join(APP_ROOT, "hooks", "gemini-hook.js");
const LOG_FILE_PATH = path.join(APP_ROOT, "logs", "gemini-hook-events.jsonl");

const EVENT_HOOKS = {
  SessionStart: [
    createHook("clawd-session-start", `${buildBaseCommand()} --ensure-app --wait-for-app-ms 8000`, 10000),
  ],
  BeforeAgent: [createHook("clawd-before-agent", buildBaseCommand(), 3000)],
  BeforeTool: [createHook("clawd-before-tool", buildBaseCommand(), 3000)],
  AfterTool: [createHook("clawd-after-tool", buildBaseCommand(), 3000)],
  AfterAgent: [createHook("clawd-after-agent", buildBaseCommand(), 3000)],
  Notification: [createHook("clawd-notification", buildBaseCommand(), 3000)],
  SessionEnd: [createHook("clawd-session-end", buildBaseCommand(), 3000)],
  PreCompress: [createHook("clawd-pre-compress", buildBaseCommand(), 3000)],
};

main();

function main() {
  assertFileExists(HOOK_SCRIPT_PATH, "Gemini hook bridge");

  fs.mkdirSync(GEMINI_DIR, { recursive: true });
  const existingSettings = readJsonFile(USER_SETTINGS_PATH);
  const backupPath = backupSettingsIfPresent();
  const mergedSettings = buildMergedSettings(existingSettings);

  fs.writeFileSync(USER_SETTINGS_PATH, `${JSON.stringify(mergedSettings, null, 2)}\n`);

  console.log(`Updated global Gemini settings: ${USER_SETTINGS_PATH}`);
  if (backupPath) {
    console.log(`Backup created: ${backupPath}`);
  }
  console.log(`Global Clawd app root: ${APP_ROOT}`);
}

function buildMergedSettings(existingSettings) {
  const nextSettings = { ...existingSettings };
  const currentHooksConfig = existingSettings.hooksConfig || {};

  nextSettings.hooksConfig = {
    ...currentHooksConfig,
    enabled: true,
    notifications:
      typeof currentHooksConfig.notifications === "boolean" ? currentHooksConfig.notifications : false,
  };

  const nextHooks = { ...(existingSettings.hooks || {}) };
  for (const [eventName, hooks] of Object.entries(EVENT_HOOKS)) {
    const preservedDefinitions = removeExistingClawdHooks(nextHooks[eventName] || []);
    nextHooks[eventName] = preservedDefinitions.concat({
      matcher: "*",
      hooks,
    });
  }

  nextSettings.hooks = nextHooks;
  return nextSettings;
}

function removeExistingClawdHooks(definitions) {
  return definitions
    .map((definition) => {
      const hooks = Array.isArray(definition.hooks) ? definition.hooks : [];
      const preservedHooks = hooks.filter((hook) => !String(hook.name || "").startsWith("clawd-"));
      return preservedHooks.length > 0 ? { ...definition, hooks: preservedHooks } : null;
    })
    .filter(Boolean);
}

function createHook(name, command, timeout) {
  return {
    name,
    type: "command",
    command,
    timeout,
  };
}

function buildBaseCommand() {
  return [
    shellQuote(process.execPath),
    shellQuote(HOOK_SCRIPT_PATH),
    "--app-root",
    shellQuote(APP_ROOT),
    "--best-effort",
    "--silent",
    "--log-file",
    shellQuote(LOG_FILE_PATH),
  ].join(" ");
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
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

function backupSettingsIfPresent() {
  if (!fs.existsSync(USER_SETTINGS_PATH)) {
    return "";
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(GEMINI_DIR, `settings.backup.${timestamp}.json`);
  fs.copyFileSync(USER_SETTINGS_PATH, backupPath);
  return backupPath;
}

function assertFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found at ${filePath}`);
  }
}
