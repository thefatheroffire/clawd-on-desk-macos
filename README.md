# macos_clawd

This project is a macOS + Gemini adaptation of the public repository `rullerzhou-afk/clawd-on-desk`.

It is not a raw mirror of the upstream repo. The goal here is to preserve the desktop pet behavior where practical, while replacing the original Windows + Claude-oriented workflow with a macOS + Gemini CLI workflow.

Detailed progress tracking lives in:

- `00_MACOS_PORT_MASTER_PLAN.md`
- `00_MACOS_PORT_MASTER_PLAN.zh-CN.md`

## What Changed From Upstream

### 1. Workspace Layout

- `upstream/clawd-on-desk/`
  - upstream reference copy
- `apps/clawd-on-desk-macos/`
  - active macOS working app

### 2. Gemini Replaces Claude As The Primary Integration

- The app no longer depends on Claude-first startup behavior.
- Gemini events are bridged through:
  - `apps/clawd-on-desk-macos/hooks/gemini-hook.js`
- The bridge converts Gemini hook events into pet states and sends them to the local `/state` endpoint.

### 3. Global `gemini` Support

- Pet-enabled Gemini integration now lives in user-level `~/.gemini/settings.json`.
- Because of that, running `gemini` from any directory on this machine can auto-launch the pet.

### 4. Added `gemini-no-pet`

- A separate global command `gemini-no-pet` was added.
- It shuts down the pet if it is already running.
- It launches Gemini with an isolated hook-free Gemini home, so Gemini still works but the pet does not react.

### 5. macOS Startup Compatibility

- `apps/clawd-on-desk-macos/tools/start-electron.js` was added to handle the `ELECTRON_RUN_AS_NODE` environment issue.
- This makes Electron startup reliable in the current macOS terminal environment.

### 6. State Pipeline Improvements

- SessionStart can auto-launch the pet.
- Duplicate SessionEnd bursts are suppressed at the app ingress.
- Gemini bridge logs are written to:
  - `apps/clawd-on-desk-macos/logs/gemini-hook-events.jsonl`

## Commands You Can Use Now

### Normal Gemini With The Pet

From any directory:

```bash
gemini
```

One-shot test:

```bash
gemini -p "Reply with OK only." --output-format json
```

### Gemini Without The Pet

From any directory:

```bash
gemini-no-pet
```

One-shot test:

```bash
gemini-no-pet -p "Reply with OK only." --output-format json
```

### Manually Start The Pet

```bash
cd ../macos_clawd/apps/clawd-on-desk-macos
npm start
```

### Check Whether The Pet Is Running

```bash
lsof -nP -iTCP:23333 -sTCP:LISTEN
```

### Stop The Pet Manually

```bash
pids=$(lsof -tiTCP:23333 -sTCP:LISTEN)
[ -n "$pids" ] && kill $pids
```

### Read Recent Pet Logs

```bash
tail -n 20 ../macos_clawd/apps/clawd-on-desk-macos/logs/gemini-hook-events.jsonl
```

### Reinstall Global Pet-Enabled Gemini Hooks

Use this after moving the repo or setting up another machine:

```bash
cd ../macos_clawd/apps/clawd-on-desk-macos
npm run gemini:install-global-hooks
```

### Reinstall `gemini-no-pet`

```bash
cd ../macos_clawd/apps/clawd-on-desk-macos
npm run gemini:install-no-pet-command
```

## Current Status

- `gemini` can now auto-launch the pet from any directory on this machine.
- `gemini-no-pet` can now run Gemini from any directory without triggering the pet.
- There is not yet a packaged standalone macOS `.app`.
- The next major milestone is packaging the current source-tree workflow into a Finder-launchable app.

## Notes

- Both global entry points currently depend on this repo living at its current installed location.
- If `macos_clawd/` moves, reinstall the global hooks and the `gemini-no-pet` command.
- UI automation is still limited by missing macOS Accessibility permission, so some UI checks still require manual confirmation.
