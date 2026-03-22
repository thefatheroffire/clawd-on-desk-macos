#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const APP_ROOT = path.resolve(__dirname, "..");
const SOURCE_SCRIPT = path.join(APP_ROOT, "tools", "gemini-no-pet.js");
const TARGET_DIR = path.join(os.homedir(), ".local", "bin");
const TARGET_PATH = path.join(TARGET_DIR, "gemini-no-pet");

main();

function main() {
  if (!fs.existsSync(SOURCE_SCRIPT)) {
    throw new Error(`Source script not found: ${SOURCE_SCRIPT}`);
  }

  fs.mkdirSync(TARGET_DIR, { recursive: true });

  try {
    const existingStat = fs.lstatSync(TARGET_PATH);
    if (existingStat.isSymbolicLink() || existingStat.isFile()) {
      fs.unlinkSync(TARGET_PATH);
    } else {
      throw new Error(`Target path exists and is not replaceable: ${TARGET_PATH}`);
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  fs.symlinkSync(SOURCE_SCRIPT, TARGET_PATH);
  fs.chmodSync(SOURCE_SCRIPT, 0o755);

  console.log(`Installed gemini-no-pet at ${TARGET_PATH}`);
}
