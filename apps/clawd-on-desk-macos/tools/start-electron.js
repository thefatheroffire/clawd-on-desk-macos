#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

const electronBinary = require("electron");
const projectRoot = path.resolve(__dirname, "..");
const env = { ...process.env };

// Some terminal environments export ELECTRON_RUN_AS_NODE=1, which prevents
// the desktop app from booting normally. Strip it for the child Electron app.
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinary, ["."], {
  cwd: projectRoot,
  env,
  stdio: "inherit",
});

child.on("error", (err) => {
  console.error(`Failed to launch Electron: ${err.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code || 0);
});
