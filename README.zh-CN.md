# macos_clawd

这个项目是基于公开仓库 `rullerzhou-afk/clawd-on-desk` 做出来的 `macOS + Gemini` 适配版本。

它不是上游仓库的原样镜像。当前目标是在尽量保留桌宠行为的前提下，把原本偏 `Windows + Claude` 的工作流，改造成 `macOS + Gemini CLI` 的工作流。

更详细的进度记录在：

- `00_MACOS_PORT_MASTER_PLAN.md`
- `00_MACOS_PORT_MASTER_PLAN.zh-CN.md`

## 相对上游做了哪些改动

### 1. 工作区结构调整

- `upstream/clawd-on-desk/`
  - 上游参考副本
- `apps/clawd-on-desk-macos/`
  - 当前实际开发和运行目录

### 2. 以 Gemini 替代 Claude 作为主集成模型

- 应用默认不再依赖 Claude-first 的启动逻辑。
- Gemini 事件通过下面这层桥接进入桌宠：
  - `apps/clawd-on-desk-macos/hooks/gemini-hook.js`
- 这层桥接会把 Gemini hooks 事件转换成桌宠状态，并发送到本地 `/state` 服务。

### 3. 支持任意目录下的 `gemini`

- 现在带桌宠的 Gemini 集成已经迁移到用户级 `~/.gemini/settings.json`。
- 所以这台机器上在任意目录运行 `gemini`，都可以自动拉起桌宠。

### 4. 新增 `gemini-no-pet`

- 现在额外提供了一个全局命令 `gemini-no-pet`。
- 它会先关闭当前正在运行的桌宠。
- 然后用一个不带 hooks 的隔离 Gemini home 启动 Gemini，这样 Gemini 还能正常工作，但桌宠不会响应。

### 5. macOS 启动兼容性处理

- 新增了 `apps/clawd-on-desk-macos/tools/start-electron.js` 来处理 `ELECTRON_RUN_AS_NODE` 环境问题。
- 这让 Electron 在当前 macOS 终端环境里能更稳定地启动。

### 6. 状态链路增强

- SessionStart 已支持自动拉起桌宠。
- 应用入口层已经对重复 SessionEnd 做了短时间去重。
- Gemini 桥接日志统一写入：
  - `apps/clawd-on-desk-macos/logs/gemini-hook-events.jsonl`

## 现在可以直接用的命令

### 带桌宠的正常 Gemini

在任意目录执行：

```bash
gemini
```

一次性测试：

```bash
gemini -p "Reply with OK only." --output-format json
```

### 不带桌宠的 Gemini

在任意目录执行：

```bash
gemini-no-pet
```

一次性测试：

```bash
gemini-no-pet -p "Reply with OK only." --output-format json
```

### 手动启动桌宠

```bash
cd ../macos_clawd/apps/clawd-on-desk-macos
npm start
```

### 检查桌宠是否正在运行

```bash
lsof -nP -iTCP:23333 -sTCP:LISTEN
```

### 手动关闭桌宠

```bash
pids=$(lsof -tiTCP:23333 -sTCP:LISTEN)
[ -n "$pids" ] && kill $pids
```

### 查看最近的桌宠日志

```bash
tail -n 20 ../macos_clawd/apps/clawd-on-desk-macos/logs/gemini-hook-events.jsonl
```

### 重新安装带桌宠的全局 Gemini hooks

当仓库目录变化，或者换机器后，需要重新执行：

```bash
cd ../macos_clawd/apps/clawd-on-desk-macos
npm run gemini:install-global-hooks
```

### 重新安装 `gemini-no-pet`

```bash
cd ../macos_clawd/apps/clawd-on-desk-macos
npm run gemini:install-no-pet-command
```

## 当前状态

- `gemini` 现在已经可以在这台机器上的任意目录自动拉起桌宠。
- `gemini-no-pet` 现在已经可以在任意目录运行 Gemini 且不触发桌宠。
- 当前还没有打包好的独立 macOS `.app`。
- 下一条主线目标是把当前源码运行形态推进成可从 Finder 双击启动的应用。

## 注意事项

- 这两个全局入口目前都依赖当前仓库所在的现有安装位置。
- 如果你移动了 `macos_clawd/`，需要重新安装全局 hooks 和 `gemini-no-pet`。
- 由于当前缺少 macOS“辅助功能”权限，部分 UI 检查仍然需要人工确认。
