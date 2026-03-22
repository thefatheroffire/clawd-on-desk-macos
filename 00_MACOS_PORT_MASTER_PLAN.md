# macOS Port Master Plan for `clawd-on-desk`

## Start Here

This file is the single source of truth for the macOS port.

Project root rule:

- All future project files must live inside the `macos_clawd/` folder.
- The `macos_clawd/` folder is intended to be uploaded to GitHub as one self-contained project root.
- Unless explicitly noted otherwise, all paths in this document are relative to the folder containing this file.

Chinese mirror:

- `00_MACOS_PORT_MASTER_PLAN.zh-CN.md`

Sync rule:

- If both files exist, keep progress-related sections synchronized.
- When in doubt, treat this English file as the canonical progress record.

Every future session must resume work by reading these sections in order:

1. `Progress Snapshot`
2. `Current Blockers`
3. `Next Action`
4. `Module Board`
5. `Session Log`

If this file is kept up to date, we can reopen the terminal at any time, read the top section, and continue from the exact stopping point.

## Project Goal

Based on the public repository below, build a working macOS version that preserves the Windows app's core behavior as much as possible, but targets Gemini as the primary local model integration:

- Upstream repo: `https://github.com/rullerzhou-afk/clawd-on-desk`
- Upstream app type: Electron desktop pet reacting to Claude Code hook events
- Original stated platform: Windows 11 only
- Our target integration: `Gemini`, not Claude Code
- Porting strategy: reuse the desktop pet app architecture, replace the upstream Claude-specific event source with a Gemini-compatible local adapter

## Core Rules

- This file must be updated at the end of every working session.
- Only one module can be marked `IN PROGRESS` at a time.
- Every code or config change must be reflected in `Module Board` and `Session Log`.
- Every test run must record command, result, and date in `Verification Notes`.
- If a blocker appears, write it into `Current Blockers` immediately instead of relying on memory.
- Do not remove failed ideas from this file. Move them into `Decision Log` so future sessions do not repeat dead ends.

## Status Legend

- `NOT STARTED`
- `IN PROGRESS`
- `BLOCKED`
- `DONE`

---

## Progress Snapshot

- Last updated: `2026-03-22`
- Current phase: `Phase 3 - Gemini integration hardening`
- Current module: `M6 - Packaging and App Distribution`
- Overall status: `IN PROGRESS`
- Source code present locally: `Yes`
- Local implementation started: `Yes`
- Last verified result: `Verified both machine-wide modes now work from Desktop: normal gemini still auto-launches the pet through user-level hooks, and the new gemini-no-pet command now kills any live pet process, runs Gemini successfully with a hook-free isolated Gemini home, adds no new pet-hook log entries, and leaves 127.0.0.1:23333 free afterward`
- Next milestone: `Start M6 standalone macOS app packaging so the pet can be launched from Finder or the desktop instead of only from the project workspace`

## Current Blockers

- Automated window inspection is blocked right now because `osascript` / `System Events` does not have macOS Accessibility permission in this environment (`-25211`), so true window-count and window-bounds checks still need either manual eyeballs or granted automation access.
- Gemini CLI still emits duplicate `SessionEnd` hooks in non-interactive runs, but the local app now suppresses back-to-back duplicates at the `/state` ingress; this is now mitigated locally but remains a known upstream behavior to monitor.
- There is not yet a packaged standalone macOS `.app`; the current working flows (`gemini` and `gemini-no-pet`) both depend on the source tree remaining at its current installed location.
- If the app directory moves or the setup is reproduced on another machine, both the global Gemini hooks and the `~/.local/bin/gemini-no-pet` command must be reinstalled so their target locations stay correct.
- The upstream clone contains its own `.git` history, which should not be shipped unchanged inside the final single-folder GitHub project.
- Multi-session or multi-task Gemini behavior has not been validated yet.
- `macos_clawd/` is now initialized as a local Git repository and published to `git@github.com:thefatheroffire/clawd-on-desk-macos.git`; future pushes can continue over SSH as long as the current GitHub SSH key remains available on this machine.

## Next Action

Primary next action:

- Begin `M6 - Packaging and App Distribution` by defining the standalone macOS `.app` path and deciding how the global Gemini hooks should target the packaged app instead of the source-tree launcher.

Immediately after that:

- Perform a true visual verification pass of the packaged or manually launched live app on macOS.
- Validate whether Gemini needs any multi-session or per-task `session_id` handling beyond the current CLI-provided session IDs.
- Decide how and when to remove the upstream reference `.git` history from the final publishable tree.

Operational publishing follow-up:

- Keep using the SSH remote `git@github.com:thefatheroffire/clawd-on-desk-macos.git` for future pushes from the local `macos_clawd/` Git repository.

Suggested initial commands:

```bash
gemini -p "Reply with OK only." --output-format json
lsof -nP -iTCP:23333 -sTCP:LISTEN
tail -n 20 ../macos_clawd/apps/clawd-on-desk-macos/logs/gemini-hook-events.jsonl
```

Optional manual startup path if you want the pet visible before Gemini work begins:

```bash
cd apps/clawd-on-desk-macos
npm start
```

If we choose a different active-worktree strategy later, record it in `Workspace Map` before implementation continues.

---

## Command Reference

Use this section as the single source of truth for the commands that are currently expected to work.

- Normal Gemini with the pet enabled from any directory:
  ```bash
  gemini
  ```
- One-shot non-interactive check with the pet enabled:
  ```bash
  gemini -p "Reply with OK only." --output-format json
  ```
- Gemini without the pet from any directory:
  ```bash
  gemini-no-pet
  ```
- One-shot non-interactive check without the pet:
  ```bash
  gemini-no-pet -p "Reply with OK only." --output-format json
  ```
- Manually start the pet from the source tree:
  ```bash
  cd ../macos_clawd/apps/clawd-on-desk-macos
  npm start
  ```
- Check whether the pet is currently running on the local state port:
  ```bash
  lsof -nP -iTCP:23333 -sTCP:LISTEN
  ```
- Stop the currently running pet process if it is listening on `23333`:
  ```bash
  pids=$(lsof -tiTCP:23333 -sTCP:LISTEN)
  [ -n "$pids" ] && kill $pids
  ```
- Read the latest pet hook log entries:
  ```bash
  tail -n 20 ../macos_clawd/apps/clawd-on-desk-macos/logs/gemini-hook-events.jsonl
  ```
- Reinstall or refresh the global pet-enabled Gemini hooks after moving the repo or changing machines:
  ```bash
  cd ../macos_clawd/apps/clawd-on-desk-macos
  npm run gemini:install-global-hooks
  ```
- Reinstall or refresh the global `gemini-no-pet` command after moving the repo or changing machines:
  ```bash
  cd ../macos_clawd/apps/clawd-on-desk-macos
  npm run gemini:install-no-pet-command
  ```

## Assumptions

- Primary target machine is macOS.
- Primary build target should be Apple Silicon first.
- After Apple Silicon works, decide whether to add Intel or universal packaging.
- We want to preserve upstream behavior before redesigning anything.
- Gemini is the only required local model integration for the first release.
- Claude Code compatibility is optional and not required for the first release.
- We will keep the upstream app architecture where practical, but the event source will be adapted for Gemini.
- The `macos_clawd/` folder is the only working root for this project and the future GitHub upload unit.

If any assumption changes, update this section before implementation continues.

## Workspace Map

Project root for all future work:

- the directory containing this file, currently `macos_clawd/`

Planned layout inside that root:

- `upstream/clawd-on-desk/`
  - untouched or near-untouched upstream reference copy
- `apps/clawd-on-desk-macos/`
  - active macOS port worktree or copied implementation
- `README.md`
  - simplified project entry document describing the macOS/Gemini adaptation and the currently supported commands
- `README.zh-CN.md`
  - Chinese mirror of the simplified root README
- `00_MACOS_PORT_MASTER_PLAN.md`
  - this file, the resume and handoff source of truth
- `00_MACOS_PORT_MASTER_PLAN.zh-CN.md`
  - synchronized Chinese mirror for reading and handoff

Actual layout:

- `README.md` exists
- `README.zh-CN.md` exists
- `00_MACOS_PORT_MASTER_PLAN.md` exists
- `00_MACOS_PORT_MASTER_PLAN.zh-CN.md` exists
- `upstream/` exists
- `apps/` exists
- `upstream/clawd-on-desk/` exists
- `apps/clawd-on-desk-macos/` exists and contains the copied working app plus dependencies
- upstream reference commit: `fff1e43474d24e1777f6715bb2e4dc2c96cf8757`

---

## Delivery Definition

The macOS version is considered functionally complete only when all of the following are true:

- The app launches on macOS without crashing.
- The transparent desktop pet window renders correctly.
- Window dragging works.
- Click-through behavior works or has a documented macOS-safe fallback.
- Gemini activity events or Gemini-derived adapter events reach the app successfully.
- State switching works across idle, thinking, working, notification, error, and completion states.
- Tray or menu-bar controls work on macOS.
- Position persistence works across restarts.
- At least one distributable macOS build target exists.
- macOS-specific limitations are documented clearly.

---

## Phase Map

### Phase 0 - Planning

- Create this master plan
- Define workspace structure
- Define progress tracking rules

### Phase 1 - Upstream Intake

- Pull the upstream code into the workspace
- Capture upstream version and commit SHA
- Inventory files, dependencies, and runtime expectations
- Record Windows-specific assumptions

### Phase 2 - Baseline macOS Run

- Install dependencies
- Attempt to run the unmodified app on macOS
- Capture exact failures, warnings, and behavior gaps
- Convert findings into a compatibility checklist

### Phase 3 - Platform Compatibility Refactor

- Adapt Electron main-process behavior for macOS
- Adapt renderer behaviors that depend on platform-specific pointer or window behavior
- Replace the Claude-specific event source with a Gemini-compatible event adapter
- Validate tray, startup, and persistence behavior

### Phase 4 - Packaging and Distribution

- Add macOS build config
- Prepare `.icns` assets
- Produce unsigned development build
- Optionally add signing and notarization steps

### Phase 5 - Stabilization

- Run manual regression checks
- Fix edge cases
- Document known limitations
- Prepare release notes and usage docs

---

## Module Board

### M0 - Workspace Initialization

- Status: `DONE`
- Goal: get the upstream project into the `macos_clawd/` working root and establish the macOS working structure
- Tasks:
  - [x] Create this master plan
  - [x] Consolidate the project under `macos_clawd/`
  - [x] Import or clone the upstream repository locally
  - [x] Record upstream commit SHA
  - [x] Create `upstream/` and `apps/` structure
  - [x] Decide that the macOS port will use a copied app directory under `apps/clawd-on-desk-macos/`
- Deliverables:
  - Local source present
  - Workspace layout recorded in this file
  - Upstream revision recorded
- Completion criteria:
  - We can point to a real local path containing the source

### M1 - Upstream Audit

- Status: `DONE`
- Goal: understand exactly what the Windows version does and where platform-specific logic lives
- Audit focus:
  - `package.json`
  - `src/main.js`
  - `src/renderer.js`
  - `src/preload.js`
  - `src/index.html`
  - `hooks/clawd-hook.js`
  - `hooks/install.js`
  - packaging config and icon assets
- Tasks:
  - [x] Record dependency versions
  - [x] Record Electron entrypoints
  - [x] Record all upstream Claude hook events used by the app
  - [x] Draft a Gemini-side event mapping for equivalent pet states
  - [x] Identify packaging-only logic vs runtime logic
  - [ ] Identify all Windows-specific APIs and assumptions through actual runtime validation
- Deliverables:
  - Architecture summary
  - Compatibility checklist
  - Risk list
- Completion criteria:
  - We have a file-backed understanding of what must change for macOS

### M2 - Baseline Run on macOS

- Status: `BLOCKED`
- Goal: observe actual behavior before changing code
- Tasks:
  - [x] Install dependencies
  - [x] Run the app unmodified on macOS
  - [x] Capture startup errors
  - [ ] Verify whether the window appears
  - [x] Verify whether the local state endpoint can receive manual or adapter-driven events
  - [ ] Record all broken and working behaviors
- Deliverables:
  - Baseline run notes
  - First failure list
  - Prioritized fix order
- Completion criteria:
  - We know the first real incompatibilities instead of guessing

### M3 - Electron Main Process Port

- Status: `NOT STARTED`
- Goal: make the Electron main process behave correctly on macOS
- Focus areas:
  - BrowserWindow creation
  - transparent window behavior
  - always-on-top and focus handling
  - screen bounds and docking behavior
  - tray or menu bar integration
  - single-instance locking
  - login item or auto-start behavior
  - persistence paths and config paths
- Tasks:
  - [ ] Review all BrowserWindow flags for macOS compatibility
  - [ ] Validate click-through strategy on macOS
  - [ ] Validate tray icon behavior and asset format requirements
  - [ ] Validate startup behavior on macOS
  - [ ] Validate single-instance handling
- Deliverables:
  - macOS-compatible main-process behavior
  - documented differences from Windows
- Completion criteria:
  - The app can stay resident and behave like a desktop companion on macOS

### M4 - Renderer and Interaction Port

- Status: `NOT STARTED`
- Goal: keep animation, drag, hover, and interaction behavior working on macOS
- Focus areas:
  - drag interactions
  - pointer capture assumptions
  - eye tracking
  - mini mode edge detection
  - hit-testing for clickable body vs transparent region
- Tasks:
  - [ ] Verify drag behavior
  - [ ] Verify cursor-follow behavior
  - [ ] Verify mini mode on macOS screen edges
  - [ ] Verify click reactions
  - [ ] Verify wake and sleep transitions
- Deliverables:
  - working renderer behavior on macOS
  - list of any interaction compromises
- Completion criteria:
  - Core pet interactions feel stable and predictable

### M5 - Gemini Integration and Event Pipeline

- Status: `IN PROGRESS`
- Goal: drive the pet from Gemini activity on macOS
- Known facts:
  - the upstream project is wired for Claude Code via `~/.claude/settings.json`
  - the upstream hook side posts events to `127.0.0.1:23333`
  - our target environment only has Gemini locally, so a Gemini-side adapter or wrapper is required
  - the local `gemini` CLI supports project-level hooks via `.gemini/settings.json`
- Tasks:
  - [x] Identify how the real local Gemini workflow can emit usable activity signals
  - [x] Define a Gemini-to-state mapping compatible with the desktop pet
  - [x] Implement or adapt a Gemini-side event sender to `127.0.0.1:23333`
  - [x] Install project-local Gemini hooks so plain `gemini` runs in this workspace trigger the pet bridge
  - [x] Verify event payload compatibility
  - [x] Normalize Gemini session-end handling and suppress duplicate SessionEnd bursts at the live app ingress
  - [ ] Verify multi-session or multi-task behavior if Gemini usage patterns require it
- Deliverables:
  - working Gemini integration path
  - working local event ingestion
- Completion criteria:
  - A real Gemini-driven event changes the pet state on macOS

### M6 - Packaging for macOS

- Status: `NOT STARTED`
- Goal: produce a macOS build path instead of Windows-only packaging
- Focus areas:
  - `electron-builder` mac target config
  - `.icns` icon generation
  - `dmg` or `zip` target
  - arm64 and optional universal builds
  - hardened runtime, signing, and notarization if needed
- Tasks:
  - [ ] Add mac build config to `package.json` or dedicated builder config
  - [ ] Prepare icon assets
  - [ ] Build unsigned development package
  - [ ] Test packaged app launch
  - [ ] Decide whether signing/notarization is in scope now or later
- Deliverables:
  - working development build artifact
  - packaging notes
- Completion criteria:
  - We can launch a packaged macOS build outside dev mode

### M7 - QA and Release Readiness

- Status: `NOT STARTED`
- Goal: stabilize the macOS port and document its current limits
- Tasks:
  - [ ] Run manual state tests
  - [ ] Run Gemini-triggered or adapter-triggered tests
  - [ ] Test restart persistence
  - [ ] Test multi-monitor placement
  - [ ] Test menu-bar controls
  - [ ] Document known issues and workarounds
- Deliverables:
  - release checklist
  - known issues list
  - usage notes
- Completion criteria:
  - The port is usable and future maintenance is straightforward

---

## Architecture Audit Notes

- Upstream version audited: `0.3.2`
- Upstream reference commit: `fff1e43474d24e1777f6715bb2e4dc2c96cf8757`
- Runtime stack: Electron `^41.0.2`, electron-builder `^26.8.1`, CommonJS
- Electron entrypoints: main process in `src/main.js`, preload bridge in `src/preload.js`, renderer bootstrapped from `src/index.html` and `src/renderer.js`
- Local state ingress: `src/main.js` starts an HTTP server on `127.0.0.1:23333` and accepts `POST /state`
- Accepted event payload shape: `{ state, svg?, session_id?, event? }`
- Session model: the main process maintains a `sessions` map, resolves display state by priority, and auto-returns one-shot states after timers expire
- Renderer responsibility: drag handling, click reactions, SVG swaps, eye tracking, and mini-mode interactions
- Claude-specific surface area: `hooks/install.js` mutates `~/.claude/settings.json`, `hooks/clawd-hook.js` maps Claude events to pet states, and app startup auto-registers Claude hooks
- macOS-specific support already exists upstream: `isMac` branches in `src/main.js`, tray template icons, Dock/Menu Bar toggles, floating window behavior, `build:mac`, and DMG packaging config
- Packaging-only logic is primarily in `package.json` build config and asset selection, while the live runtime logic is concentrated in `src/main.js`, `src/renderer.js`, `src/preload.js`, and the hook scripts
- Current architectural conclusion: the smallest viable Gemini port is to keep the Electron app and `/state` server intact, then replace the Claude-specific installer and sender with a Gemini-side adapter

## Provisional Gemini Mapping

- `gemini_session_start` or wrapper startup maps to `idle`
- `gemini_prompt_submit` maps to `thinking`
- `gemini_response_start` or `gemini_tool_start` maps to `working`
- `gemini_tool_success` keeps or returns to `working`
- `gemini_error` or `gemini_tool_error` maps to `error`
- `gemini_task_complete` maps to `attention`
- `gemini_attention_needed` maps to `notification`
- `gemini_background_file_create` can map to `carrying` if the workflow exposes it
- `gemini_cleanup_or_compaction` can map to `sweeping` if the workflow exposes it
- `juggling` and `conducting` should be treated as optional v1 states unless Gemini exposes real subtask or multi-agent signals
- `session_id` should default to a stable local value until we confirm whether the Gemini workflow exposes a better task identifier

## Gemini CLI Hook Integration Notes

- Local CLI discovered in this environment: Homebrew `gemini-cli 0.34.0`, invoked as `gemini`
- Selected integration path: project-local hooks in `apps/clawd-on-desk-macos/.gemini/settings.json`, not a custom wrapper around the `gemini` command
- Active bridge script: `apps/clawd-on-desk-macos/hooks/gemini-hook.js`
- Bridge behavior: consumes Gemini hook JSON from stdin, maps `hook_event_name` values to pet states, logs compact JSONL traces to `apps/clawd-on-desk-macos/logs/gemini-hook-events.jsonl`, and uses best-effort delivery so Gemini still works if the pet app is not running
- Verified real hook chain from `gemini -p "Reply with OK only." --output-format json`: `SessionStart -> BeforeAgent -> PreCompress -> AfterAgent -> SessionEnd`
- Open observation: the same non-interactive run emitted `SessionEnd` twice, so dedupe may be worth adding if that repeats in interactive use

---

## Baseline Run Notes

- Working copy created at `apps/clawd-on-desk-macos/` by copying the upstream source without the embedded `.git` directory
- Dependencies installed successfully with `NPM_CONFIG_CACHE=.npm-cache npm ci`
- First launch attempt with plain `npm start` failed because the terminal exports `ELECTRON_RUN_AS_NODE=1`, which makes Electron behave like Node and breaks `require("electron")`
- Correct launch command in this environment is `env -u ELECTRON_RUN_AS_NODE npm start`
- With that environment fix applied, the app launched successfully and logged both Claude hook auto-registration and `Clawd state server listening on 127.0.0.1:23333`
- Manual POST requests to `127.0.0.1:23333/state` returned `ok` for `thinking` and `attention` test events, confirming that a Gemini adapter can drive the existing event ingress path
- Visual GUI confirmation is still pending because this run only established successful process startup and endpoint behavior

---

## Gemini Integration Notes

- `package.json` now launches the app through `node tools/start-electron.js` instead of invoking Electron directly
- `tools/start-electron.js` removes `ELECTRON_RUN_AS_NODE` before spawning the Electron desktop process
- `src/main.js` now disables Claude hook auto-registration by default and only re-enables it if `CLAWD_ENABLE_CLAUDE_HOOKS=1`
- `hooks/gemini-hook.js` now accepts positional input, flag input, and real Gemini hook stdin payloads
- The bridge supports best-effort mode plus JSONL logging to `logs/gemini-hook-events.jsonl`
- The JSONL log now also records the HTTP response body so duplicate suppression can be audited later
- `apps/clawd-on-desk-macos/.gemini/settings.json` now installs project-level Gemini hooks so ordinary `gemini` runs inside this workspace drive the pet automatically
- Verified real Gemini CLI hook path: `SessionStart`, `BeforeAgent`, `PreCompress`, `AfterAgent`, and `SessionEnd` all reached the live `/state` endpoint in one `gemini -p` verification
- `src/main.js` now normalizes Gemini lifecycle event names such as `gemini_session_end` and suppresses back-to-back duplicate `SessionEnd` deliveries within a short window
- Verified direct `/state` dedupe behavior: two immediate `gemini_session_end` posts for the same session returned `ok` and then `duplicate_ignored`

---

## macOS Risk Register

These are the highest-risk areas to validate early:

- Transparent click-through windows can behave differently on macOS than on Windows.
- Tray behavior may need macOS-specific icon assets and menu handling.
- Auto-start behavior differs across macOS versions and may need dedicated testing.
- Packaged hook paths may break if Electron `asar` layout differs on macOS.
- Unsigned apps may be blocked by Gatekeeper depending on packaging method.
- Pointer, focus, and always-on-top behavior may need macOS-specific workarounds.
- Mini mode and edge snapping may need recalibration for macOS screen coordinates.
- The local Gemini workflow may not expose lifecycle events equivalent to Claude Code, so an adapter may need approximation logic.

---

## Decision Log

### 2026-03-22

- Decision: keep one master markdown file as the progress source of truth.
- Reason: future sessions need a deterministic place to resume from.

- Decision: keep all future project content under `macos_clawd/`.
- Reason: the folder needs to be directly uploadable to GitHub as a self-contained unit.

- Decision: make Gemini the primary target model integration for this project.
- Reason: the local environment only has Gemini available, so Gemini-first delivery is the only practical first milestone.

- Decision: use `apps/clawd-on-desk-macos/` as the active working directory for the port, while keeping `upstream/clawd-on-desk/` as the reference copy.
- Reason: this keeps the upstream source separate from our Gemini/macOS implementation and avoids modifying the reference baseline directly.

- Decision: keep the upstream Electron app and `/state` server model, and replace only the Claude-specific hook registration and event sender with a Gemini adapter first.
- Reason: this is the smallest change surface and preserves most of the audited runtime behavior.

- Decision: always launch the local Electron app with `ELECTRON_RUN_AS_NODE` unset in this terminal environment.
- Reason: the environment exports `ELECTRON_RUN_AS_NODE=1`, which causes Electron to run in Node mode and makes the baseline app fail before the GUI initializes.

- Decision: disable Claude hook auto-registration by default in the working copy and treat Claude compatibility as opt-in only.
- Reason: the target is Gemini-first, so touching `~/.claude/settings.json` on every launch is no longer appropriate.

- Decision: preserve upstream behavior first, optimize for native macOS polish second.
- Reason: parity is easier to verify than redesign during the first port.

- Decision: Apple Silicon is the first target unless a later requirement says otherwise.
- Reason: this is the most likely current macOS environment and reduces initial scope.

- Decision: integrate Gemini through project-local hooks in `.gemini/settings.json` instead of wrapping the `gemini` command.
- Reason: the user already works by typing `gemini`, and native project hooks preserve that workflow while exposing real session IDs and hook event payloads.

- Decision: keep the Gemini bridge best-effort and log every hook delivery to `logs/gemini-hook-events.jsonl`.
- Reason: desktop pet integration should never block Gemini usage, and an append-only JSONL log makes debugging and future session resumption easier.

- Decision: make the live Electron app tolerant of Gemini's duplicate `SessionEnd` emissions instead of waiting for Gemini CLI to change upstream behavior.
- Reason: the local app can cheaply normalize Gemini lifecycle names and suppress short duplicate bursts at the `/state` ingress, which is safer than assuming the source will only emit one end event.

---

## Verification Notes

Use this section as an append-only log of concrete verification results.

Template:

```text
Date:
Module:
Command:
Result:
Notes:
```

Current entries:

```text
Date: 2026-03-22
Module: M0
Command: N/A
Result: PASS
Notes: Created the master plan in an empty workspace. No source code imported yet.
```

```text
Date: 2026-03-22
Module: M0
Command: mkdir -p macos_clawd/upstream macos_clawd/apps
Result: PASS
Notes: Established macos_clawd as the self-contained project root and created the internal directory skeleton for future source import and port work.
```

```text
Date: 2026-03-22
Module: M0
Command: create macos_clawd/apps/.gitkeep and macos_clawd/upstream/.gitkeep
Result: PASS
Notes: Added placeholder files so the empty project structure can be preserved when macos_clawd is uploaded to GitHub.
```

```text
Date: 2026-03-22
Module: Planning
Command: update master plan target model from Claude Code to Gemini
Result: PASS
Notes: Reframed the project as a Gemini-first macOS port while preserving the upstream repository as the source architecture reference.
```

```text
Date: 2026-03-22
Module: M0
Command: git clone https://github.com/rullerzhou-afk/clawd-on-desk.git upstream/clawd-on-desk
Result: PASS
Notes: Imported the upstream repository into macos_clawd/upstream/clawd-on-desk.
```

```text
Date: 2026-03-22
Module: M0
Command: git -C upstream/clawd-on-desk rev-parse HEAD
Result: PASS
Notes: Recorded upstream commit SHA fff1e43474d24e1777f6715bb2e4dc2c96cf8757.
```

```text
Date: 2026-03-22
Module: M0
Command: mkdir -p apps/clawd-on-desk-macos
Result: PASS
Notes: Created the dedicated working app directory for the macOS and Gemini port.
```

```text
Date: 2026-03-22
Module: M0
Command: create apps/clawd-on-desk-macos/.gitkeep
Result: PASS
Notes: Added a placeholder file so the active working directory will be preserved when the project is committed to Git.
```

```text
Date: 2026-03-22
Module: M1
Command: audit package.json, src/main.js, src/renderer.js, src/preload.js, src/index.html, hooks/install.js, and hooks/clawd-hook.js
Result: PASS
Notes: Completed a first-pass architecture audit, identified the Claude-specific integration surface, and drafted the provisional Gemini event mapping.
```

```text
Date: 2026-03-22
Module: M2
Command: rsync -a --exclude '.git' upstream/clawd-on-desk/ apps/clawd-on-desk-macos/
Result: PASS
Notes: Created the active working copy without carrying over the embedded upstream Git history.
```

```text
Date: 2026-03-22
Module: M2
Command: NPM_CONFIG_CACHE=.npm-cache npm ci
Result: PASS
Notes: Installed the working copy dependencies successfully.
```

```text
Date: 2026-03-22
Module: M2
Command: npm start
Result: FAIL
Notes: Launch failed because the terminal environment exported ELECTRON_RUN_AS_NODE=1, causing Electron to behave like Node and making app.getPath unavailable.
```

```text
Date: 2026-03-22
Module: M2
Command: env -u ELECTRON_RUN_AS_NODE npm start
Result: PASS
Notes: App launched successfully and the local state server started on 127.0.0.1:23333.
```

```text
Date: 2026-03-22
Module: M2
Command: curl -s -X POST http://127.0.0.1:23333/state ...
Result: PASS
Notes: Manual thinking and attention test events both returned ok, confirming the Gemini-style adapter path can target the existing /state endpoint.
```

```text
Date: 2026-03-22
Module: M5
Command: patch package.json, src/main.js, .gitignore, add tools/start-electron.js, add hooks/gemini-hook.js
Result: PASS
Notes: Switched the working copy to Gemini-first startup behavior, disabled Claude auto-registration by default, and added the first Gemini event sender CLI.
```

```text
Date: 2026-03-22
Module: M5
Command: npm start
Result: PASS
Notes: Startup now succeeds via the custom launcher and logs Gemini mode instead of auto-registering Claude hooks.
```

```text
Date: 2026-03-22
Module: M5
Command: node hooks/gemini-hook.js gemini_prompt_submit gemini-test-2
Result: PASS
Notes: Gemini sender mapped the prompt event to thinking and received ok from the local state endpoint.
```

```text
Date: 2026-03-22
Module: M5
Command: node hooks/gemini-hook.js gemini_task_complete gemini-test-2
Result: PASS
Notes: Gemini sender mapped the completion event to attention and received ok from the local state endpoint.
```

```text
Date: 2026-03-22
Module: M5
Command: patch hooks/gemini-hook.js, .gitignore, add .gemini/settings.json
Result: PASS
Notes: Upgraded the bridge to consume real Gemini hook stdin payloads, added best-effort logging, and installed project-local Gemini hook configuration so plain gemini runs in this workspace can drive the pet.
```

```text
Date: 2026-03-22
Module: M5
Command: printf '{"hook_event_name":"BeforeAgent",...}' | node hooks/gemini-hook.js --strict --log-file logs/gemini-hook-events.jsonl
Result: PASS
Notes: Live verification against the running app mapped BeforeAgent to thinking and received ok from the local /state endpoint.
```

```text
Date: 2026-03-22
Module: M5
Command: printf '{"hook_event_name":"AfterTool","tool_response":{"error":"tool crashed"},...}' | node hooks/gemini-hook.js --strict --log-file logs/gemini-hook-events.jsonl
Result: PASS
Notes: Live verification against the running app mapped an AfterTool error payload to gemini_tool_error and received ok from the local /state endpoint.
```

```text
Date: 2026-03-22
Module: M5
Command: GEMINI_CLI_NO_RELAUNCH=true gemini -p "Reply with OK only." --output-format json
Result: PASS
Notes: A real Gemini CLI run produced a live session_id, returned OK, and triggered project-level hooks that reached the pet bridge with SessionStart, BeforeAgent, PreCompress, AfterAgent, and SessionEnd events; SessionEnd appeared twice in this run and should be reviewed.
```

```text
Date: 2026-03-22
Module: M5
Command: patch src/main.js and hooks/gemini-hook.js
Result: PASS
Notes: Added Gemini lifecycle event normalization in the main process, suppressed short duplicate SessionEnd bursts at the live /state ingress, and expanded JSONL hook logging to include the HTTP response body.
```

```text
Date: 2026-03-22
Module: M5
Command: node -e '...two back-to-back POST /state requests with event gemini_session_end...'
Result: PASS
Notes: Live ingress verification returned ok for the first SessionEnd and duplicate_ignored for the second, confirming app-side duplicate suppression.
```

```text
Date: 2026-03-22
Module: M3
Command: lsof -nP -iTCP:23333 -sTCP:LISTEN; lsappinfo info -pid 12916; osascript ...
Result: PARTIAL
Notes: Confirmed the live app is a foreground Electron process owning 127.0.0.1:23333, but scripted window inspection is blocked because System Events lacks Accessibility permission in this environment (error -25211).
```

```text
Date: 2026-03-22
Module: M5
Command: patch hooks/gemini-hook.js and .gemini/settings.json
Result: PASS
Notes: Added SessionStart auto-launch support so the Gemini bridge can start the Electron pet on demand, wait for the local /state server, and record launched_app/app_ready status in JSONL logs.
```

```text
Date: 2026-03-22
Module: M5
Command: GEMINI_CLI_NO_RELAUNCH=true gemini -p "Reply with OK only." --output-format json
Result: PASS
Notes: From a fully stopped state with no listener on 127.0.0.1:23333, a real Gemini CLI run auto-launched the Electron pet through the project SessionStart hook, returned OK, and produced a full hook lifecycle ending with a duplicate_ignored response on the second SessionEnd delivery.
```

```text
Date: 2026-03-22
Module: M3
Command: lsof -nP -iTCP:23333 -sTCP:LISTEN
Result: PASS
Notes: Confirmed that the post-auto-start app was again listening on 127.0.0.1:23333 under a new Electron PID.
```

```text
Date: 2026-03-22
Module: M5
Command: patch hooks/gemini-hook.js, add tools/install-global-gemini-hooks.js, patch package.json, remove .gemini/settings.json
Result: PASS
Notes: Migrated from workspace-local Gemini hooks to a reusable global-hooks installer, added fixed app-root support in the bridge, and removed the project-level hook file to avoid duplicate deliveries when user-level hooks are active.
```

```text
Date: 2026-03-22
Module: M5
Command: node tools/install-global-gemini-hooks.js
Result: PASS
Notes: Updated ~/.gemini/settings.json with user-level Clawd hook commands, preserved existing user settings, and created a backup at ~/.gemini/settings.backup.2026-03-22T13-08-47-376Z.json.
```

```text
Date: 2026-03-22
Module: M5
Command: (from Desktop) GEMINI_CLI_NO_RELAUNCH=true gemini -p "Reply with OK only." --output-format json
Result: PASS
Notes: Confirmed that a real Gemini run from Desktop, outside the project folder, auto-launched the pet through user-level hooks and no longer depended on a workspace-local .gemini/settings.json file.
```

```text
Date: 2026-03-22
Module: M3
Command: tail -n 6 logs/gemini-hook-events.jsonl; lsof -nP -iTCP:23333 -sTCP:LISTEN
Result: PASS
Notes: Verified the Desktop-sourced session logged a Desktop working directory as cwd, the SessionStart hook recorded launched_app=true, and Electron was listening on 127.0.0.1:23333 afterward.
```

```text
Date: 2026-03-22
Module: M3
Command: kill 26482; lsof -nP -iTCP:23333 -sTCP:LISTEN
Result: PASS
Notes: Stopped the verification Electron process after the global-hook validation run and confirmed that 127.0.0.1:23333 is now free so the next Gemini execution will exercise a clean auto-start path again.
```

```text
Date: 2026-03-22
Module: M5
Command: patch .gitignore, add tools/gemini-no-pet.js, add tools/install-gemini-no-pet-command.js, patch package.json
Result: PASS
Notes: Added a dedicated hook-free Gemini wrapper that kills any live pet process, runs Gemini against an isolated no-pet Gemini home, and can be installed as a separate global command without affecting the default gemini workflow.
```

```text
Date: 2026-03-22
Module: M5
Command: node tools/install-gemini-no-pet-command.js
Result: PASS
Notes: Installed a global gemini-no-pet symlink at ~/.local/bin/gemini-no-pet so the command is now available from any directory on this machine.
```

```text
Date: 2026-03-22
Module: M5
Command: (from Desktop) GEMINI_CLI_NO_RELAUNCH=true gemini-no-pet -p "Reply with OK only." --output-format json
Result: PASS
Notes: After fixing the isolated Gemini home path, the new command returned OK from Desktop, did not append any new lines to the pet hook JSONL log, and left 127.0.0.1:23333 without a listener.
```

```text
Date: 2026-03-22
Module: Documentation
Command: create macos_clawd/README.md
Result: PASS
Notes: Added a simplified root README that summarizes the macOS/Gemini adaptation work relative to the upstream project and lists the currently supported commands.
```

```text
Date: 2026-03-22
Module: Documentation
Command: create macos_clawd/README.zh-CN.md
Result: PASS
Notes: Added a Chinese mirror for the simplified root README so the project root now has bilingual entry documentation.
```

```text
Date: 2026-03-22
Module: Documentation
Command: scan maintained markdown files for home-directory path markers
Result: PASS
Notes: Confirmed the maintained project markdown files no longer expose user-specific filesystem paths; command examples now use relative forms such as ../macos_clawd/apps/clawd-on-desk-macos where needed.
```

```text
Date: 2026-03-22
Module: Publishing Prep
Command: git -C macos_clawd init && git -C macos_clawd remote add origin https://github.com/thefatheroffire/clawd-on-desk-macos.git
Result: PASS
Notes: Initialized macos_clawd as a standalone local Git repository for publishing, added a root .gitignore to keep local-only runtime data out of version control, and configured the intended public GitHub remote URL.
```

```text
Date: 2026-03-22
Module: Publishing Prep
Command: git -C macos_clawd push -u origin main
Result: FAIL
Notes: Network resolution succeeded after escalation, but GitHub HTTPS push is currently blocked on local credentials: `could not read Username for 'https://github.com': Device not configured`.
```

```text
Date: 2026-03-22
Module: Publishing Prep
Command: GIT_SSH_COMMAND='ssh -i ~/.ssh/id_rsa -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new' git -C macos_clawd push -u origin main
Result: PASS
Notes: Switched origin to SSH and successfully published branch main to git@github.com:thefatheroffire/clawd-on-desk-macos.git.
```

---

## Session Log

Use one new entry per work session. Newest entry goes on top.

### 2026-03-22 Session 21

- What happened:
  - Created the first local commit for the publishable `macos_clawd/` repository on branch `main`.
  - Attempted the first `git push -u origin main` against `https://github.com/thefatheroffire/clawd-on-desk-macos.git`.
  - Confirmed that the current blocker is GitHub HTTPS authentication on this machine, not repository structure or local Git state.
- Current truth:
  - Local Git history now exists and is ready to publish.
  - The push flow is waiting on GitHub credentials or an alternate authenticated transport such as SSH.
  - The intended remote remains `origin -> https://github.com/thefatheroffire/clawd-on-desk-macos.git`.
- Recommended next step:
  - Authenticate GitHub access for `git` on this machine, verify that the public repo exists, and rerun `git -C macos_clawd push -u origin main`.

### 2026-03-22 Session 22

- What happened:
  - Switched `origin` from HTTPS to SSH: `git@github.com:thefatheroffire/clawd-on-desk-macos.git`.
  - Reused the local `~/.ssh/id_rsa` key with `GIT_SSH_COMMAND` and successfully pushed `main` to GitHub.
  - Verified that the local branch now tracks `origin/main`.
- Current truth:
  - The public repository is now live on GitHub and the local `macos_clawd/` repo is connected to it over SSH.
  - Future pushes should continue to work through the SSH remote as long as this machine keeps access to the same GitHub SSH key.
  - The main implementation track is back to packaging and app distribution.
- Recommended next step:
  - Continue with `M6 - Packaging and App Distribution`, then push follow-up commits to `origin/main` over SSH.

### 2026-03-22 Session 20

- What happened:
  - Prepared `macos_clawd/` for publishing as its own public Git repository.
  - Added a root `.gitignore` that excludes `upstream/`, dependency folders, logs, caches, and local Gemini runtime data from the future GitHub upload.
  - Initialized a local Git repository in `macos_clawd/`, staged the publishable project files, and set `origin` to `https://github.com/thefatheroffire/clawd-on-desk-macos.git`.
- Current truth:
  - The local workspace is now in a clean “ready to first commit / push” state for a public repository.
  - Sensitive local-only directories such as `.gemini/`, `.npm-cache/`, `logs/`, `node_modules/`, and `upstream/` are currently excluded from version control.
  - The machine does not have `gh`, so remote repository creation and the first push still depend on either the GitHub web UI or a direct authenticated `git push` after the repo exists.
- Recommended next step:
  - Create or confirm the public GitHub repo `thefatheroffire/clawd-on-desk-macos`, make the first commit in `macos_clawd/`, and push `main` to `origin`.

### 2026-03-22 Session 19

- What happened:
  - Scrubbed the remaining user-specific path examples from the maintained markdown docs under `macos_clawd/`.
  - Standardized public command examples to relative project paths such as `../macos_clawd/apps/clawd-on-desk-macos` instead of machine-specific filesystem addresses.
  - Verified that the root README pair, the bilingual master plans, and the active app README pair no longer contain user-specific home-directory strings.
- Current truth:
  - The project-facing markdown docs are now safe to share without exposing the local username or full workstation path.
  - The actual app folder name remains `clawd-on-desk-macos`; only the base path notation was sanitized.
  - Packaging is still the next implementation milestone.
- Recommended next step:
  - Start `M6 - Packaging and App Distribution`, then update the root README pair again once the standalone `.app` workflow exists.

### 2026-03-22 Session 18

- What happened:
  - Actually created the missing root `README.md` file on disk after noticing the master plan had recorded it before the file physically existed.
  - Added `README.zh-CN.md` as the Chinese mirror of the simplified root project entry document.
  - Updated the workspace map and verification log so the documented layout now matches the real filesystem state.
- Current truth:
  - The root of `macos_clawd/` now really contains both `README.md` and `README.zh-CN.md`.
  - The root README pair is now the fast project entry point, while the master plans remain the detailed recovery source of truth.
  - Packaging is still the next implementation milestone.
- Recommended next step:
  - Start `M6 - Packaging and App Distribution`, then update both root READMEs again once the packaged `.app` workflow exists.

### 2026-03-22 Session 17

- What happened:
  - Created `macos_clawd/README.md` as a simplified entry document in the project root.
  - Condensed the two master plans into a shorter project-facing summary focused on what changed from upstream and which commands are now available.
  - Updated the workspace map so the new root README is treated as part of the actual project layout.
- Current truth:
  - `macos_clawd/` now has both detailed recovery plans and a faster project-entry README.
  - The README is intentionally simplified; the two master plan files remain the authoritative resume documents.
  - Packaging is still the next implementation milestone.
- Recommended next step:
  - Start `M6 - Packaging and App Distribution`, then refresh the README again once the packaged `.app` workflow exists.

### 2026-03-22 Session 15

- What happened:
  - Added a dedicated `gemini-no-pet` wrapper that prepares a hook-free isolated Gemini home, terminates any live pet process on port `23333`, and then launches the normal Gemini CLI with the same user credentials.
  - Added `tools/install-gemini-no-pet-command.js` and installed the command globally at `~/.local/bin/gemini-no-pet`.
  - Hit one verification bug on the first pass because `GEMINI_CLI_HOME` was pointed at the nested `.gemini` directory instead of the home root, then fixed the path layout and reran the validation.
  - Verified from `Desktop` that `gemini-no-pet -p "Reply with OK only." --output-format json` returned `OK`, added no new pet-hook log entries, and left `127.0.0.1:23333` free.
- Current truth:
  - This machine now has two explicit Gemini operating modes: `gemini` for auto-pet behavior, and `gemini-no-pet` for Gemini without the pet.
  - Both commands are working, and the environment is currently clean with no pet listener bound to port `23333`.
  - The next major effort is still packaging the app.
- Recommended next step:
  - Start `M6 - Packaging and App Distribution`, then decide how both global commands should target the packaged macOS app path.

### 2026-03-22 Session 16

- What happened:
  - Synced the master plan after the `gemini-no-pet` implementation was verified.
  - Added a command reference section that lists the currently supported day-to-day commands for normal Gemini, no-pet Gemini, manual pet startup, log inspection, process shutdown, and reinstalling the two global entry points.
- Current truth:
  - The docs now capture the practical operating surface of the project, not just the implementation history.
  - A future resume can start directly from the command reference plus the current phase and blocker sections.
  - Packaging is still the next main implementation task.
- Recommended next step:
  - Start `M6 - Packaging and App Distribution`, then update the command reference again once the packaged `.app` path exists.

### 2026-03-22 Session 14

- What happened:
  - Synced the project state after the first successful global-hooks validation.
  - Confirmed that the machine-wide Gemini integration is now the current baseline, not the older workspace-local setup.
  - Recorded that the verification Electron process was intentionally stopped after testing, leaving `127.0.0.1:23333` free for the next clean cold-start run.
- Current truth:
  - The active baseline is now: run `gemini` from any directory on this machine and let user-level Gemini hooks auto-launch the pet.
  - The environment is currently idle and clean, so the next manual test or packaging step starts from a predictable state.
  - Packaging is now the main open workstream.
- Recommended next step:
  - Start `M6 - Packaging and App Distribution`, then retarget the global hook installer toward the packaged app path.

### 2026-03-22 Session 13

- What happened:
  - Added fixed app-root support to `hooks/gemini-hook.js` so the bridge can launch the pet even when Gemini is started outside the project directory.
  - Added `tools/install-global-gemini-hooks.js` and a matching package script to install or refresh user-level Gemini hooks in `~/.gemini/settings.json`.
  - Removed the workspace-local `.gemini/settings.json` file so the project no longer double-registers hooks when global hooks are active.
  - Installed the global hooks with backup protection and then ran a real `GEMINI_CLI_NO_RELAUNCH=true gemini -p "Reply with OK only." --output-format json` from `Desktop`.
  - Verified from logs that the Desktop-based run auto-started the pet, logged a Desktop working directory as `cwd`, and still handled duplicate SessionEnd safely with `duplicate_ignored`.
- Current truth:
  - `gemini` can now auto-launch the pet from any working directory on this machine, including Desktop, because the integration lives in user-level Gemini settings rather than project-local settings.
  - The current solution still targets the source tree by its installed location, so moving the repo or setting up a second machine requires reinstalling the global hooks.
  - The next priority is packaging, not event transport.
- Recommended next step:
  - Start `M6 - Packaging and App Distribution`, then repoint the global hook installer so it can target the packaged macOS app instead of the source-tree launcher.

### 2026-03-22 Session 12

- What happened:
  - Clarified the current user-facing behavior after the latest Gemini integration work.
  - Confirmed that the existing auto-start flow is workspace-scoped: running `gemini` inside `apps/clawd-on-desk-macos` can launch the pet, but there is not yet a Finder- or desktop-launchable standalone `.app`.
  - Reframed the next project step toward packaging, while preserving the already working Gemini hook pipeline as the runtime foundation.
- Current truth:
  - The current build is operational for terminal-driven Gemini usage from the project directory.
  - A desktop icon or double-click launch experience has not been implemented yet.
  - The next meaningful milestone is no longer bridge correctness; it is standalone macOS app packaging and launch ergonomics.
- Recommended next step:
  - Start `M6 - Packaging and App Distribution`, then revisit visual verification and multi-session validation from the packaged app path.

### 2026-03-22 Session 11

- What happened:
  - Extended `hooks/gemini-hook.js` so SessionStart can auto-launch the Electron app if no local pet listener is already present.
  - Updated `.gemini/settings.json` so project-level Gemini SessionStart hooks now call the bridge with `--ensure-app`.
  - Stopped the existing Electron process, confirmed `127.0.0.1:23333` was free, and then ran a real `GEMINI_CLI_NO_RELAUNCH=true gemini -p "Reply with OK only." --output-format json` cold-start test.
  - Verified from logs that SessionStart recorded `launched_app: true` and `app_ready: true`, and confirmed afterward that Electron reclaimed `127.0.0.1:23333`.
  - Observed that the second SessionEnd delivery now comes back as `duplicate_ignored`, which matches the local ingress dedupe added in Session 10.
- Current truth:
  - The day-to-day workflow is now `cd apps/clawd-on-desk-macos && gemini ...`; a stopped pet app will auto-launch on SessionStart.
  - The Gemini event bridge is no longer the main uncertainty. The remaining gaps are visual confirmation, multi-session behavior, and final publishability cleanup.
  - Gemini CLI still warns about project-level hooks before execution, which should be documented as part of the expected trust flow.
- Recommended next step:
  - Manually watch the auto-started pet window during a normal Gemini run, then move on to multi-session or concurrent-task validation.

### 2026-03-22 Session 10

- What happened:
  - Patched `src/main.js` so the live app now understands Gemini lifecycle names such as `gemini_session_end` instead of only Claude-style `SessionEnd`.
  - Added short-window duplicate suppression for repeated SessionEnd deliveries at the `/state` ingress.
  - Expanded `hooks/gemini-hook.js` logging so JSONL entries now include the HTTP response body.
  - Confirmed with two back-to-back direct `/state` posts that the app returns `ok` and then `duplicate_ignored`.
  - Confirmed via `lsof` and `lsappinfo` that the live app is a foreground Electron process listening on `127.0.0.1:23333`.
- Current truth:
  - Duplicate SessionEnd handling is now mitigated locally even though Gemini CLI still emits two SessionEnd hooks in non-interactive runs.
  - The main unresolved gap is visual UI verification, not the Gemini event pipeline.
  - Scripted window inspection is currently blocked by missing macOS Accessibility permission for `System Events`.
- Recommended next step:
  - Do a true visual pass of the live pet window and controls, or grant Accessibility permission if terminal-driven UI inspection is still desired, then move on to multi-session Gemini validation.

### 2026-03-22 Session 9

- What happened:
  - Confirmed that the local Gemini workflow is the Homebrew `gemini` CLI and that it supports project-level hooks.
  - Added `apps/clawd-on-desk-macos/.gemini/settings.json` so plain `gemini` runs inside that workspace now invoke the pet bridge automatically.
  - Upgraded `hooks/gemini-hook.js` to consume real Gemini hook stdin payloads, derive events from `hook_event_name`, log JSONL traces, and run in best-effort mode so Gemini is not blocked if the pet app is closed.
  - Verified live delivery with manual Gemini-style payloads and a real `GEMINI_CLI_NO_RELAUNCH=true gemini -p "Reply with OK only." --output-format json` call.
- Current truth:
  - Real Gemini CLI integration now works end-to-end from project-local hooks to the live `/state` server.
  - The main remaining M5 questions are polish and edge behavior: one real run emitted `SessionEnd` twice, and multi-session behavior is still untested.
  - Visual confirmation of the macOS desktop pet UI is still pending.
- Recommended next step:
  - Run the live app while using normal `gemini` commands, visually verify the window and controls, then decide whether duplicate `SessionEnd` should be deduplicated in the bridge or just documented.

### 2026-03-22 Session 8

- What happened:
  - Patched the working copy so `npm start` now launches through a custom Electron wrapper that removes `ELECTRON_RUN_AS_NODE`.
  - Disabled Claude hook auto-registration by default in Gemini mode.
  - Added `hooks/gemini-hook.js` as the first Gemini-side event sender.
  - Verified that the new Gemini sender can drive `thinking` and `attention` states through the live `/state` endpoint.
- Current truth:
  - The working copy now has a real Gemini integration surface, not just a plan.
  - Startup is no longer blocked by the terminal environment because the custom launcher strips the problematic Electron flag.
  - The remaining unknown is how the actual local Gemini workflow should call the new sender automatically.
- Recommended next step:
  - Connect the real local Gemini workflow or wrapper to `hooks/gemini-hook.js`, then validate a full Gemini-driven task lifecycle and visually confirm the desktop UI behavior.

### 2026-03-22 Session 7

- What happened:
  - Created the active working copy in `apps/clawd-on-desk-macos/`.
  - Installed dependencies successfully with `npm ci`.
  - Diagnosed the first launch failure as an environment issue caused by `ELECTRON_RUN_AS_NODE=1`.
  - Relaunched successfully with `ELECTRON_RUN_AS_NODE` unset and confirmed the local `/state` server came up.
  - Verified manual `thinking` and `attention` events against `127.0.0.1:23333/state`, both returning `ok`.
- Current truth:
  - The baseline app is now launchable in this environment if Electron is started with `ELECTRON_RUN_AS_NODE` unset.
  - The existing `/state` ingress path already works for Gemini-style external events.
  - Claude auto-registration still happens on startup and should be removed or replaced next.
- Recommended next step:
  - Patch the working copy to disable Claude hook auto-registration, then implement the first Gemini-side event sender and keep using the validated `/state` contract.

### 2026-03-22 Session 6

- What happened:
  - Audited the upstream runtime architecture, renderer flow, hook installer, and hook sender.
  - Confirmed that the upstream app already contains meaningful macOS support and packaging branches.
  - Identified the smallest viable Gemini strategy: keep the Electron app and `/state` server, then replace the Claude-specific hook layer with a Gemini adapter.
  - Drafted a provisional Gemini-to-state mapping in this file.
- Current truth:
  - The upstream app is now understood well enough to begin building the active working copy.
  - The exact local Gemini signal source is still unknown, so the adapter implementation is not started yet.
  - Runtime validation on macOS is still pending.
- Recommended next step:
  - Copy the upstream app into `apps/clawd-on-desk-macos/`, remove the embedded `.git`, and run the first baseline launch with manual `/state` testing.

### 2026-03-22 Session 5

- What happened:
  - Cloned the upstream repository into `macos_clawd/upstream/clawd-on-desk`.
  - Recorded upstream commit `fff1e43474d24e1777f6715bb2e4dc2c96cf8757`.
  - Created `apps/clawd-on-desk-macos/` as the active working directory for the port.
  - Added `.gitkeep` inside the active working directory so it is preserved in Git.
  - Advanced the project from workspace setup into upstream audit.
- Current truth:
  - Upstream source is available locally.
  - The active implementation directory exists but is still empty.
  - The next critical step is to audit the upstream app and define the Gemini adapter approach.
- Recommended next step:
  - Read the upstream entrypoints and hook files, then map their Claude-driven state flow onto Gemini-driven signals.

### 2026-03-22 Session 4

- What happened:
  - Switched the project target model from Claude Code to Gemini.
  - Updated the plan to treat the upstream repo as an architecture reference, not as the final integration target.
  - Reframed the integration work around a Gemini-side adapter that can drive the pet state endpoint.
- Current truth:
  - The upstream code still needs to be imported.
  - The first release target is now Gemini-first on macOS.
- Recommended next step:
  - Clone the upstream repository into `macos_clawd/upstream/clawd-on-desk`, then audit which upstream events and pet states need Gemini equivalents.

### 2026-03-22 Session 3

- What happened:
  - Confirmed that all future work should live under `macos_clawd/`.
  - Created `upstream/` and `apps/` inside `macos_clawd/`.
  - Added `.gitkeep` placeholders so the empty structure can be retained in Git.
  - Updated the plan so the folder can later be uploaded to GitHub as a self-contained project root.
- Current truth:
  - The project root is now `macos_clawd/`.
  - Planning files and directory skeleton exist, but upstream source code is still missing.
- Recommended next step:
  - Clone the upstream repository into `macos_clawd/upstream/clawd-on-desk` and continue M0.

### 2026-03-22 Session 1

- What happened:
  - Confirmed the upstream repository is publicly readable.
  - Confirmed the current workspace is empty.
  - Created this master plan file to make future work resumable.
- Current truth:
  - No local source code yet.
  - No macOS implementation work has started yet.
- Recommended next step:
  - Import the upstream repository and begin M0 completion.

---

## Resume Protocol

At the start of every future session:

1. If starting from the parent workspace, open `macos_clawd/00_MACOS_PORT_MASTER_PLAN.md` first.
2. Read `Progress Snapshot`.
3. Read `Current Blockers`.
4. Execute `Next Action` unless a newer blocker or user request changes priority.
5. Update `Progress Snapshot` before switching to a different module.

At the end of every future session:

1. Update `Last updated`.
2. Update `Current phase`, `Current module`, and `Overall status`.
3. Update the relevant module status.
4. Append one `Verification Notes` entry for every meaningful test or command result.
5. Add a new `Session Log` entry at the top.
6. Rewrite `Next Action` so the next session can continue without guessing.

---

## Quick Resume Prompt for Future Sessions

If a future session needs a one-line instruction, use this:

`Read macos_clawd/00_MACOS_PORT_MASTER_PLAN.md from top to bottom, trust the Progress Snapshot and Module Board, then continue the Next Action unless the user gives a newer priority.`
