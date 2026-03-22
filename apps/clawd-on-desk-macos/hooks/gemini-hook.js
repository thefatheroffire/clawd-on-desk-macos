#!/usr/bin/env node
// Gemini event sender for Clawd on Desk.
// Usage examples:
//   node hooks/gemini-hook.js gemini_prompt_submit my-session
//   node hooks/gemini-hook.js --event gemini_task_complete --session my-session
//   echo '{"hook_event_name":"BeforeAgent","session_id":"job-1"}' | node hooks/gemini-hook.js --best-effort --silent

const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const EVENT_TO_STATE = {
  gemini_session_start: "idle",
  session_start: "idle",
  gemini_session_end: "sleeping",
  session_end: "sleeping",
  gemini_prompt_submit: "thinking",
  prompt_submit: "thinking",
  gemini_response_start: "working",
  response_start: "working",
  gemini_tool_start: "working",
  tool_start: "working",
  gemini_tool_success: "working",
  tool_success: "working",
  gemini_tool_error: "error",
  tool_error: "error",
  gemini_task_complete: "attention",
  task_complete: "attention",
  gemini_attention_needed: "notification",
  attention_needed: "notification",
  gemini_background_file_create: "carrying",
  background_file_create: "carrying",
  gemini_cleanup_or_compaction: "sweeping",
  cleanup_or_compaction: "sweeping",
};

const HOOK_EVENT_TO_EVENT = {
  session_start: "gemini_session_start",
  session_end: "gemini_session_end",
  before_agent: "gemini_prompt_submit",
  after_agent: "gemini_task_complete",
  before_tool: "gemini_tool_start",
  after_tool: "gemini_tool_success",
  notification: "gemini_attention_needed",
  pre_compress: "gemini_cleanup_or_compaction",
  before_model: "gemini_response_start",
  after_model: "gemini_response_start",
  before_tool_selection: "gemini_response_start",
};

const DIRECT_STATES = new Set([
  "idle",
  "thinking",
  "working",
  "error",
  "attention",
  "notification",
  "carrying",
  "sweeping",
  "sleeping",
  "juggling",
]);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const stdinPayload = await readJsonFromStdin();
  const input = buildInput(args, stdinPayload);
  const appRoot = resolveAppRoot(args.appRoot) || input.cwd;

  const event = resolveEvent(input);
  const state = resolveState(event, input.state);
  if (!state) {
    printUsage();
    process.exit(1);
  }

  const body = JSON.stringify({
    state,
    session_id: input.session_id,
    event,
  });

  const target = {
    host: args.host || "127.0.0.1",
    port: Number(args.port || 23333),
    path: args.path || "/state",
  };

  const appLaunch = args.ensureApp
    ? await ensureClawdRunning({
        appRoot,
        host: target.host,
        port: target.port,
        waitMs: Number(args.waitForAppMs || 8000),
      })
    : { launched: false, ready: true };

  let response = "";
  let deliveryError = "";

  try {
    response = await postState(body, target);
  } catch (err) {
    deliveryError = err instanceof Error ? err.message : String(err);
    if (!args.bestEffort) {
      throw err;
    }
  }

  if (args.logFile) {
    writeLogEntry(args.logFile, {
      timestamp: new Date().toISOString(),
      session_id: input.session_id,
      event,
      state,
      hook_event_name: input.hook_event_name || undefined,
      notification_type: input.notification_type || undefined,
      tool_name: input.tool_name || undefined,
      cwd: input.cwd,
      target: `${target.host}:${target.port}${target.path}`,
      launched_app: appLaunch.launched || undefined,
      app_ready: appLaunch.ready,
      ok: !deliveryError,
      response: response || undefined,
      error: deliveryError || undefined,
    });
  }

  if (!args.silent) {
    console.log(`sent ${event} -> ${state} (${input.session_id})`);
    if (response) {
      console.log(response);
    }
    if (appLaunch.launched) {
      console.log("auto-started Clawd app");
    }
    if (deliveryError) {
      console.warn(`best-effort delivery skipped: ${deliveryError}`);
    }
  }
}

function parseArgs(argv) {
  const result = {
    positionals: [],
    silent: false,
    bestEffort: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--event") {
      result.event = argv[++i] || "";
    } else if (arg === "--state") {
      result.state = argv[++i] || "";
    } else if (arg === "--session") {
      result.session = argv[++i] || "";
    } else if (arg === "--host") {
      result.host = argv[++i] || "";
    } else if (arg === "--port") {
      result.port = argv[++i] || "";
    } else if (arg === "--path") {
      result.path = argv[++i] || "";
    } else if (arg === "--log-file") {
      result.logFile = argv[++i] || "";
    } else if (arg === "--silent") {
      result.silent = true;
    } else if (arg === "--best-effort") {
      result.bestEffort = true;
    } else if (arg === "--strict") {
      result.bestEffort = false;
    } else if (arg === "--ensure-app") {
      result.ensureApp = true;
    } else if (arg === "--wait-for-app-ms") {
      result.waitForAppMs = argv[++i] || "";
    } else if (arg === "--app-root") {
      result.appRoot = argv[++i] || "";
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      result.positionals.push(arg);
    }
  }

  return result;
}

function buildInput(args, stdinPayload) {
  const cwd = stdinPayload.cwd || process.cwd();

  return {
    rawEvent: args.event || stdinPayload.event || stdinPayload.hook_event_name || args.positionals[0] || "",
    state: args.state || stdinPayload.state || "",
    session_id:
      args.session ||
      stdinPayload.session_id ||
      stdinPayload.sessionId ||
      args.positionals[1] ||
      fallbackSessionId(cwd),
    hook_event_name: normalizeKey(stdinPayload.hook_event_name),
    notification_type: normalizeKey(stdinPayload.notification_type),
    tool_name: normalizeKey(stdinPayload.tool_name),
    cwd,
    payload: stdinPayload,
  };
}

function readJsonFromStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve({});
      return;
    }

    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => {
      const raw = Buffer.concat(chunks).toString().trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed && typeof parsed === "object" ? parsed : {});
      } catch {
        resolve({});
      }
    });
    process.stdin.resume();
  });
}

function fallbackSessionId(cwd) {
  return `gemini-${path.basename(cwd || process.cwd()) || "default"}`;
}

function resolveAppRoot(value) {
  const candidate = String(value || "").trim();
  if (!candidate) {
    return "";
  }
  return path.resolve(candidate);
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolveEvent(input) {
  const normalizedEvent = normalizeKey(input.rawEvent);
  const sourceEvent = normalizedEvent || input.hook_event_name;

  if (!sourceEvent) {
    return input.state ? `state:${normalizeKey(input.state)}` : "";
  }

  if (sourceEvent === "after_tool") {
    return hasErrorSignal(input.payload.tool_response) ? "gemini_tool_error" : "gemini_tool_success";
  }

  if (sourceEvent === "notification") {
    return hasErrorSignal(input.payload.notification_type) ||
      hasErrorSignal(input.payload.message) ||
      hasErrorSignal(input.payload.details)
      ? "gemini_tool_error"
      : "gemini_attention_needed";
  }

  return HOOK_EVENT_TO_EVENT[sourceEvent] || sourceEvent;
}

function resolveState(event, state) {
  const normalizedState = normalizeKey(state);
  if (DIRECT_STATES.has(normalizedState)) {
    return normalizedState;
  }

  const normalizedEvent = normalizeKey(event);
  return EVENT_TO_STATE[normalizedEvent] || "";
}

function hasErrorSignal(value, depth = 0) {
  if (!value || depth > 3) {
    return false;
  }

  if (typeof value === "string") {
    const text = normalizeKey(value);
    return ["error", "fail", "failure", "exception", "timeout", "denied", "blocked"].some((token) =>
      text.includes(token)
    );
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasErrorSignal(item, depth + 1));
  }

  if (typeof value === "object") {
    return Object.entries(value).some(([key, nestedValue]) => {
      if (["error", "errors", "stderr", "exception"].includes(normalizeKey(key)) && nestedValue) {
        return true;
      }
      return hasErrorSignal(nestedValue, depth + 1);
    });
  }

  return false;
}

function writeLogEntry(filePath, entry) {
  try {
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    fs.appendFileSync(resolvedPath, `${JSON.stringify(entry)}\n`);
  } catch (_err) {
    // Logging must never break Gemini workflow or hook execution.
  }
}

function postState(body, target) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: target.host,
        port: target.port,
        path: target.path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 1000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const responseBody = Buffer.concat(chunks).toString().trim();
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseBody);
            return;
          }
          reject(new Error(`Request failed with status ${res.statusCode}: ${responseBody}`));
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.end(body);
  });
}

async function ensureClawdRunning(options) {
  if (await isPortOpen(options.host, options.port)) {
    return { launched: false, ready: true };
  }

  launchClawdApp(options.appRoot);
  const ready = await waitForPort(options.host, options.port, options.waitMs);
  return { launched: true, ready };
}

function launchClawdApp(appRoot) {
  const launcherPath = path.join(appRoot, "tools", "start-electron.js");
  if (!fs.existsSync(launcherPath)) {
    throw new Error(`Clawd launcher not found at ${launcherPath}`);
  }
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const child = spawn(process.execPath, [launcherPath], {
    cwd: appRoot,
    env,
    detached: true,
    stdio: "ignore",
  });

  child.unref();
}

function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForPort(host, port, waitMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < waitMs) {
    if (await isPortOpen(host, port)) {
      return true;
    }
    await sleep(250);
  }
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printUsage() {
  console.log("Usage: node hooks/gemini-hook.js <event_or_state> [session_id]");
  console.log("       node hooks/gemini-hook.js --event <event> --session <session_id>");
  console.log("       node hooks/gemini-hook.js --state <state> --session <session_id>");
  console.log(
    "       node hooks/gemini-hook.js --app-root /abs/path/to/app --ensure-app --best-effort --silent --log-file /abs/path/to/logs/gemini-hook-events.jsonl"
  );
}

main().catch((err) => {
  console.error(`Gemini hook failed: ${err.message}`);
  process.exit(1);
});
