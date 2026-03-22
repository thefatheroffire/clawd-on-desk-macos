# `clawd-on-desk` macOS 移植总计划

## 从这里开始

这份文件是 macOS 移植工作的中文镜像说明。

项目根目录规则：

- 后续所有项目内容都必须放在 `macos_clawd/` 文件夹内。
- `macos_clawd/` 将作为未来直接上传到 GitHub 的自包含项目根目录。
- 除非特别说明，本文档里的所有路径都默认相对于当前这个文件所在的目录。

规范进度真源如下：

- 英文主文件：`00_MACOS_PORT_MASTER_PLAN.md`
- 中文镜像文件：`00_MACOS_PORT_MASTER_PLAN.zh-CN.md`

同步规则：

- 如果两份文件都存在，所有和进度相关的区块都必须保持同步。
- 如果中英文内容出现冲突，默认以英文主文件为准，并尽快把中文文件补齐。

未来每次重新开始工作时，都必须按下面顺序阅读：

1. `Progress Snapshot / 进度快照`
2. `Current Blockers / 当前阻塞`
3. `Next Action / 下一步行动`
4. `Module Board / 模块看板`
5. `Session Log / 会话日志`

只要这份文件和英文主文件保持更新，我们每次重新打开终端时，都可以直接从当前准确进度继续。

## 项目目标

基于下面这个公开仓库，构建一个可在 macOS 上运行的版本，并尽可能保留原 Windows 应用的核心行为，但项目的一期目标模型改为 Gemini：

- 上游仓库：`https://github.com/rullerzhou-afk/clawd-on-desk`
- 上游应用类型：基于 Electron 的桌宠，会对 Claude Code 的 hook 事件做实时响应
- 上游原始声明平台：Windows 11 only
- 我们的目标集成模型：`Gemini`，不是 Claude Code
- 当前移植策略：复用桌宠应用架构，把上游依赖 Claude 的事件来源替换成兼容 Gemini 的本地适配层

## 核心规则

- 每次工作会话结束时，都必须更新这份文件和英文主文件。
- 任意时刻只能有一个模块被标记为 `IN PROGRESS`。
- 每一次代码或配置变更，都必须反映到 `Module Board` 和 `Session Log`。
- 每一次测试执行，都必须在 `Verification Notes` 中记录命令、结果和日期。
- 一旦出现阻塞，不要依赖记忆，必须马上写进 `Current Blockers`。
- 不要删除失败的方案，把它们移动到 `Decision Log`，避免未来重复踩坑。

## 状态说明

- `NOT STARTED`
- `IN PROGRESS`
- `BLOCKED`
- `DONE`

---

## Progress Snapshot / 进度快照

- Last updated / 最后更新：`2026-03-22`
- Current phase / 当前阶段：`Phase 3 - Gemini integration hardening`
- Current module / 当前模块：`M6 - Packaging and App Distribution`
- Overall status / 总体状态：`IN PROGRESS`
- Source code present locally / 本地是否已有源码：`Yes`
- Local implementation started / 本地是否已开始实现：`Yes`
- Last verified result / 最近一次确认结果：`已经验证这台机器上的两种 Gemini 模式都能在 Desktop 下工作：普通 gemini 仍会通过用户级 hooks 自动拉起桌宠，而新的 gemini-no-pet 会先关掉 23333 上正在运行的桌宠进程，再用一个不带 hooks 的隔离 Gemini home 正常跑完 Gemini；整个过程中不会新增任何桌宠 hook 日志，而且结束后 127.0.0.1:23333 依然保持空闲`
- Next milestone / 下一里程碑：`开始 M6 独立 macOS 应用打包，让桌宠可以从 Finder 或桌面双击启动，而不是只依赖项目工作区里的命令行`

## Current Blockers / 当前阻塞

- 目前没法自动化读取窗口数量和坐标，因为当前环境里的 `osascript` / `System Events` 没有 macOS“辅助功能”权限（错误 `-25211`）；所以真正的窗口目检还需要人工确认，或者先放开这类自动化权限。
- Gemini CLI 在非交互运行里依然会发出重复的 `SessionEnd` hooks，不过本地应用已经在 `/state` 入口做了短时间去重；这现在属于本地已缓解但仍需关注的上游行为。
- 目前还没有打包成可独立启动的 macOS `.app`；当前两条可用流程（`gemini` 和 `gemini-no-pet`）都依赖当前源码目录保持在现有安装位置。
- 如果后面移动了项目目录，或者换到另一台机器上，用户级 Gemini hooks 和 `~/.local/bin/gemini-no-pet` 这两个全局入口都需要重新安装一次，保证它们仍然指向正确的位置。
- 上游 clone 目录包含自己的 `.git` 历史，后续不能原样跟最终单文件夹 GitHub 项目一起发布。
- 还没有验证 Gemini 在多任务或多会话情况下是否需要不同的 `session_id` 策略。
- `macos_clawd/` 现在已经初始化成本地 Git 仓库，并且已经通过 SSH 发布到 `git@github.com:thefatheroffire/clawd-on-desk-macos.git`；只要这台机器继续保留当前 GitHub SSH key，后续推送都可以继续走 SSH。

## Next Action / 下一步行动

当前最优先动作：

- 开始 `M6 - Packaging and App Distribution`，先定义独立 macOS `.app` 的启动路径，并决定全局 Gemini hooks 后面应该如何改指向打包后的应用，而不是源码树里的启动器。

紧接着要做：

- 对打包后或手动启动的 live 应用做一次真正的 macOS 窗口目检。
- 验证 Gemini 现有 CLI 提供的 `session_id` 是否已经足够，还是后面还要补多会话处理。
- 决定最终发布前如何处理上游参考目录里的 `.git` 历史。

发布侧待办：

- 后续继续通过 SSH 远程 `git@github.com:thefatheroffire/clawd-on-desk-macos.git` 推送本地 `macos_clawd/` 仓库的更新。

建议起手命令：

```bash
gemini -p "Reply with OK only." --output-format json
lsof -nP -iTCP:23333 -sTCP:LISTEN
tail -n 20 ../macos_clawd/apps/clawd-on-desk-macos/logs/gemini-hook-events.jsonl
```

如果你想在开始 Gemini 任务前就先把桌宠显示出来，也可以继续手动启动：

```bash
cd apps/clawd-on-desk-macos
npm start
```

如果后续采用了不同的活动工作副本方案，必须先在 `Workspace Map / 工作区映射` 里写明，再继续实现。

---

## Command Reference / 可用指令

这里作为当前“可直接照着用”的命令真源，后续如果有变动，优先更新这一段。

- 在任意目录使用带桌宠的正常 Gemini：
  ```bash
  gemini
  ```
- 带桌宠的一次性非交互测试：
  ```bash
  gemini -p "Reply with OK only." --output-format json
  ```
- 在任意目录使用不带桌宠的 Gemini：
  ```bash
  gemini-no-pet
  ```
- 不带桌宠的一次性非交互测试：
  ```bash
  gemini-no-pet -p "Reply with OK only." --output-format json
  ```
- 从源码目录手动启动桌宠：
  ```bash
  cd ../macos_clawd/apps/clawd-on-desk-macos
  npm start
  ```
- 检查桌宠当前是否占用了本地状态端口：
  ```bash
  lsof -nP -iTCP:23333 -sTCP:LISTEN
  ```
- 如果桌宠当前正在监听 `23333`，就把它关掉：
  ```bash
  pids=$(lsof -tiTCP:23333 -sTCP:LISTEN)
  [ -n "$pids" ] && kill $pids
  ```
- 查看最新的桌宠 hook 日志：
  ```bash
  tail -n 20 ../macos_clawd/apps/clawd-on-desk-macos/logs/gemini-hook-events.jsonl
  ```
- 在移动仓库目录或换机器后，重新安装或刷新“带桌宠”的全局 Gemini hooks：
  ```bash
  cd ../macos_clawd/apps/clawd-on-desk-macos
  npm run gemini:install-global-hooks
  ```
- 在移动仓库目录或换机器后，重新安装或刷新全局 `gemini-no-pet` 命令：
  ```bash
  cd ../macos_clawd/apps/clawd-on-desk-macos
  npm run gemini:install-no-pet-command
  ```

## Assumptions / 当前假设

- 主要目标机器是 macOS。
- 第一优先构建目标是 Apple Silicon。
- 等 Apple Silicon 跑通之后，再决定是否补 Intel 或 universal 包。
- 第一阶段优先保留上游行为，而不是立刻做设计重构。
- Gemini 是第一版唯一必须支持的本地模型集成。
- Claude Code 兼容性不是第一版必需项。
- 在可行的前提下保留上游应用架构，但事件来源会改造成适配 Gemini。
- `macos_clawd/` 是这个项目唯一的工作根目录，也是未来上传 GitHub 的目录单元。

如果任何假设发生变化，必须先更新这里，再继续实现。

## Workspace Map / 工作区映射

后续所有工作的项目根目录：

- 当前这个文件所在的目录，也就是 `macos_clawd/`

该根目录下的计划布局：

- `upstream/clawd-on-desk/`
  - 尽量保持原样的上游参考副本
- `apps/clawd-on-desk-macos/`
  - 实际进行 macOS 移植开发的目录或 worktree
- `README.md`
  - 当前项目入口说明，简化描述了相对上游的改动和已支持的指令
- `README.zh-CN.md`
  - 根目录入口说明的中文镜像文件
- `00_MACOS_PORT_MASTER_PLAN.md`
  - 英文主文件，进度真源
- `00_MACOS_PORT_MASTER_PLAN.zh-CN.md`
  - 中文镜像文件，方便阅读和续接

当前实际布局：

- `README.md` 已存在
- `README.zh-CN.md` 已存在
- `00_MACOS_PORT_MASTER_PLAN.md` 已存在
- `00_MACOS_PORT_MASTER_PLAN.zh-CN.md` 已存在
- `upstream/` 已存在
- `apps/` 已存在
- `upstream/clawd-on-desk/` 已存在
- `apps/clawd-on-desk-macos/` 已存在，已经包含复制出来的工作副本和依赖
- 上游参考 commit：`fff1e43474d24e1777f6715bb2e4dc2c96cf8757`

---

## Delivery Definition / 完成定义

只有在下面这些条件都满足时，macOS 版本才算功能上完成：

- 应用能在 macOS 上启动且不崩溃。
- 透明桌宠窗口能正确渲染。
- 窗口拖拽正常。
- 点击穿透能正常工作，或者至少有文档明确说明 macOS 下的安全替代方案。
- Gemini 活动事件或 Gemini 派生适配事件能成功到达应用。
- idle、thinking、working、notification、error、completion 等关键状态切换正常。
- macOS 上的托盘或菜单栏控制可用。
- 重启后位置持久化正常。
- 至少可以生成一种可分发的 macOS 构建产物。
- 所有 macOS 特有限制都有明确文档说明。

---

## Phase Map / 阶段地图

### Phase 0 - Planning / 规划阶段

- 创建这份总计划
- 定义工作区结构
- 定义进度追踪规则

### Phase 1 - Upstream Intake / 接入上游源码

- 将上游代码拉入当前工作区
- 记录上游版本和 commit SHA
- 盘点文件、依赖和运行时要求
- 记录所有 Windows 特有假设

### Phase 2 - Baseline macOS Run / 原样运行基线验证

- 安装依赖
- 在不改代码的前提下尝试直接在 macOS 上运行
- 捕获精确的失败、警告和行为差异
- 把发现的问题整理成兼容性清单

### Phase 3 - Platform Compatibility Refactor / 平台兼容改造

- 适配 Electron 主进程在 macOS 上的行为
- 适配依赖平台特性的渲染与交互行为
- 用兼容 Gemini 的事件适配层替换 Claude 专属事件来源
- 验证托盘、启动项和持久化行为

### Phase 4 - Packaging and Distribution / 打包与分发

- 增加 macOS 构建配置
- 准备 `.icns` 图标资源
- 生成未签名的开发构建
- 视情况补充签名与 notarization 流程

### Phase 5 - Stabilization / 稳定化收尾

- 执行手工回归检查
- 修复边界问题
- 记录已知限制
- 准备发布说明和使用文档

---

## Module Board / 模块看板

### M0 - Workspace Initialization / 工作区初始化

- Status / 状态：`DONE`
- Goal / 目标：把上游项目带进 `macos_clawd/` 工作根目录，并建立 macOS 工作结构
- Tasks / 任务：
  - [x] 创建这份总计划
  - [x] 将整个项目收敛到 `macos_clawd/`
  - [x] 将上游仓库导入或 clone 到本地
  - [x] 记录上游 commit SHA
  - [x] 创建 `upstream/` 和 `apps/` 目录结构
  - [x] 决定 macOS 移植将在 `apps/clawd-on-desk-macos/` 这个复制后的应用目录中进行
- Deliverables / 交付物：
  - 本地已有源码
  - 这份文件里记录了工作区布局
  - 已记录上游版本信息
- Completion criteria / 完成标准：
  - 我们可以明确指出一个真实存在的本地源码路径

### M1 - Upstream Audit / 上游审计

- Status / 状态：`DONE`
- Goal / 目标：弄清 Windows 版本到底做了什么，以及哪些逻辑是平台相关的
- Audit focus / 审计重点：
  - `package.json`
  - `src/main.js`
  - `src/renderer.js`
  - `src/preload.js`
  - `src/index.html`
  - `hooks/clawd-hook.js`
  - `hooks/install.js`
  - 打包配置与图标资源
- Tasks / 任务：
  - [x] 记录依赖版本
  - [x] 记录 Electron 入口点
  - [x] 记录上游应用使用到的所有 Claude hook 事件
  - [x] 起草一份 Gemini 侧的事件到桌宠状态映射表
  - [x] 区分仅打包相关逻辑和运行时逻辑
  - [ ] 通过实际运行验证所有 Windows 专属 API 和假设
- Deliverables / 交付物：
  - 架构摘要
  - 兼容性清单
  - 风险列表
- Completion criteria / 完成标准：
  - 我们已经基于文件内容明确知道哪些点必须为 macOS 调整

### M2 - Baseline Run on macOS / macOS 原样运行基线

- Status / 状态：`BLOCKED`
- Goal / 目标：先观察真实行为，再决定怎么改
- Tasks / 任务：
  - [x] 安装依赖
  - [x] 在不改代码的前提下运行应用
  - [x] 捕获启动错误
  - [ ] 确认窗口是否出现
  - [x] 确认本地状态入口能否接收手动事件或适配层事件
  - [ ] 记录所有正常和异常行为
- Deliverables / 交付物：
  - 基线运行记录
  - 第一批失败项清单
  - 优先修复顺序
- Completion criteria / 完成标准：
  - 我们知道真正的首批兼容性问题，而不是靠猜

### M3 - Electron Main Process Port / Electron 主进程移植

- Status / 状态：`NOT STARTED`
- Goal / 目标：让 Electron 主进程在 macOS 上正常工作
- Focus areas / 关注点：
  - BrowserWindow 创建方式
  - 透明窗口行为
  - always-on-top 和焦点处理
  - 屏幕边界和停靠逻辑
  - 托盘或菜单栏集成
  - 单实例锁
  - 登录启动或开机自启行为
  - 持久化路径和配置路径
- Tasks / 任务：
  - [ ] 审查所有 BrowserWindow 参数的 macOS 兼容性
  - [ ] 验证 macOS 下的点击穿透方案
  - [ ] 验证托盘图标行为和资源格式要求
  - [ ] 验证 macOS 启动项行为
  - [ ] 验证单实例处理
- Deliverables / 交付物：
  - 可在 macOS 上运行的主进程行为
  - 与 Windows 的差异说明
- Completion criteria / 完成标准：
  - 应用能在 macOS 上作为桌面伴侣常驻并稳定工作

### M4 - Renderer and Interaction Port / 渲染与交互移植

- Status / 状态：`NOT STARTED`
- Goal / 目标：让动画、拖拽、悬停和交互行为在 macOS 上保持正常
- Focus areas / 关注点：
  - 拖拽交互
  - Pointer Capture 相关假设
  - 眼球跟随
  - mini mode 边缘检测
  - 实体区域可点击与透明区域穿透的命中逻辑
- Tasks / 任务：
  - [ ] 验证拖拽行为
  - [ ] 验证鼠标跟随行为
  - [ ] 验证 macOS 屏幕边缘下的 mini mode
  - [ ] 验证点击反馈
  - [ ] 验证睡眠与唤醒过渡
- Deliverables / 交付物：
  - 在 macOS 上可工作的渲染层交互
  - 所有交互妥协点的清单
- Completion criteria / 完成标准：
  - 核心桌宠交互稳定、可预测

### M5 - Gemini Integration and Event Pipeline / Gemini 集成与事件链路

- Status / 状态：`IN PROGRESS`
- Goal / 目标：让桌宠在 macOS 上由 Gemini 活动驱动
- Known facts / 已知事实：
  - 上游项目通过 `~/.claude/settings.json` 接入 Claude Code
  - 上游 hook 侧会向 `127.0.0.1:23333` 发送事件
  - 我们当前目标环境只有 Gemini，因此需要 Gemini 侧适配器或包装层
  - 本地 `gemini` CLI 支持通过 `.gemini/settings.json` 配置项目级 hooks
- Tasks / 任务：
  - [x] 找出真实的本地 Gemini 工作流如何发出可用的活动信号
  - [x] 定义一套兼容桌宠状态机的 Gemini 到状态映射
  - [x] 实现或改造一个 Gemini 侧事件发送器，向 `127.0.0.1:23333` 发消息
  - [x] 安装项目级 Gemini hooks，让这个工作区里直接运行 `gemini` 就能触发桌宠桥接
  - [x] 验证事件负载兼容性
  - [x] 在 live 应用入口兼容 Gemini 的 SessionEnd 事件名，并抑制短时间重复 SessionEnd
  - [ ] 如果 Gemini 使用模式需要，验证多任务或多会话行为
- Deliverables / 交付物：
  - 可工作的 Gemini 集成路径
  - 可工作的本地事件接收链路
- Completion criteria / 完成标准：
  - 一个真实的 Gemini 驱动事件可以在 macOS 上驱动桌宠状态变化

### M6 - Packaging for macOS / macOS 打包

- Status / 状态：`NOT STARTED`
- Goal / 目标：提供 macOS 构建路径，而不再只是 Windows-only 打包
- Focus areas / 关注点：
  - `electron-builder` 的 mac 目标配置
  - `.icns` 图标生成
  - `dmg` 或 `zip` 目标
  - arm64 和可选 universal 构建
  - 如有需要则补充 hardened runtime、签名与 notarization
- Tasks / 任务：
  - [ ] 在 `package.json` 或独立 builder 配置里加入 mac 构建配置
  - [ ] 准备图标资源
  - [ ] 构建未签名开发包
  - [ ] 测试打包后应用的启动
  - [ ] 决定签名和 notarization 是现在做还是后续做
- Deliverables / 交付物：
  - 可运行的开发构建产物
  - 打包说明
- Completion criteria / 完成标准：
  - 我们能在开发模式之外启动一个打包后的 macOS 应用

### M7 - QA and Release Readiness / QA 与发布准备

- Status / 状态：`NOT STARTED`
- Goal / 目标：稳定 macOS 版本并记录当前限制
- Tasks / 任务：
  - [ ] 执行手工状态测试
  - [ ] 执行 Gemini 驱动或适配层驱动测试
  - [ ] 测试重启后持久化
  - [ ] 测试多显示器摆放
  - [ ] 测试菜单栏控制
  - [ ] 记录已知问题和规避方式
- Deliverables / 交付物：
  - 发布检查清单
  - 已知问题列表
  - 使用说明
- Completion criteria / 完成标准：
  - 这个移植版已经可用，且未来维护成本清晰可控

---

## Architecture Audit Notes / 架构审计笔记

- 已审计的上游版本：`0.3.2`
- 上游参考 commit：`fff1e43474d24e1777f6715bb2e4dc2c96cf8757`
- 运行时技术栈：Electron `^41.0.2`、electron-builder `^26.8.1`、CommonJS
- Electron 入口点：主进程在 `src/main.js`，preload 桥在 `src/preload.js`，渲染层由 `src/index.html` 和 `src/renderer.js` 启动
- 本地状态入口：`src/main.js` 会启动 `127.0.0.1:23333` 上的 HTTP 服务，并接收 `POST /state`
- 可接收的事件负载结构：`{ state, svg?, session_id?, event? }`
- 会话模型：主进程维护一个 `sessions` 映射表，按优先级决定显示状态，并让一次性状态在定时器后自动回退
- 渲染层职责：拖拽处理、点击反馈、SVG 切换、眼球跟随、mini mode 交互
- Claude 专属部分：`hooks/install.js` 会修改 `~/.claude/settings.json`，`hooks/clawd-hook.js` 会把 Claude 事件映射成桌宠状态并发送 HTTP 请求，应用启动时还会自动注册 Claude hooks
- 上游已经包含不少 macOS 支持：`src/main.js` 里有 `isMac` 分支、托盘模板图标、Dock/Menu Bar 开关、浮动窗口行为，以及 `build:mac` 和 DMG 打包配置
- 仅打包相关逻辑主要集中在 `package.json` 的 build 配置和图标资源选择，真正的运行时逻辑主要集中在 `src/main.js`、`src/renderer.js`、`src/preload.js` 和 hook 脚本
- 当前架构结论：最小可行的 Gemini 版本不是重写整个应用，而是保留 Electron 应用和 `/state` 服务，只把 Claude 专属的注册与发送层替换成 Gemini 适配器

## Provisional Gemini Mapping / 初版 Gemini 事件映射

- `gemini_session_start` 或包装层启动可映射到 `idle`
- `gemini_prompt_submit` 可映射到 `thinking`
- `gemini_response_start` 或 `gemini_tool_start` 可映射到 `working`
- `gemini_tool_success` 可保持或回到 `working`
- `gemini_error` 或 `gemini_tool_error` 可映射到 `error`
- `gemini_task_complete` 可映射到 `attention`
- `gemini_attention_needed` 可映射到 `notification`
- `gemini_background_file_create` 如果工作流能暴露出来，可映射到 `carrying`
- `gemini_cleanup_or_compaction` 如果工作流能暴露出来，可映射到 `sweeping`
- `juggling` 和 `conducting` 在 v1 应视为可选状态，除非 Gemini 真的暴露出子任务或多代理信号
- `session_id` 先默认使用稳定的本地值，后续再看 Gemini 工作流能否提供更好的任务标识

## Gemini CLI Hook Integration Notes / Gemini CLI Hook 集成笔记

- 当前环境里实际发现的本地 CLI：Homebrew 安装的 `gemini-cli 0.34.0`，入口命令就是 `gemini`
- 当前选定的集成路径：使用 `apps/clawd-on-desk-macos/.gemini/settings.json` 里的项目级 hooks，而不是额外包一层自定义 `gemini` 包装命令
- 当前桥接脚本：`apps/clawd-on-desk-macos/hooks/gemini-hook.js`
- 当前桥接行为：从 stdin 接收 Gemini hook JSON，基于 `hook_event_name` 映射状态，向 `apps/clawd-on-desk-macos/logs/gemini-hook-events.jsonl` 追加紧凑 JSONL 日志，并以 best-effort 方式投递，这样桌宠没启动时也不会反过来影响 Gemini
- 已验证的真实 hook 链路：`gemini -p "Reply with OK only." --output-format json` 会触发 `SessionStart -> BeforeAgent -> PreCompress -> AfterAgent -> SessionEnd`
- 当前观察到的开放问题：同一次非交互运行里 `SessionEnd` 出现了两次，如果交互模式里也重复，就值得补一个去重逻辑

---

## Baseline Run Notes / 基线运行笔记

- 已在 `apps/clawd-on-desk-macos/` 下建立工作副本，复制时没有带入上游嵌套 `.git`
- 依赖通过 `NPM_CONFIG_CACHE=.npm-cache npm ci` 安装成功
- 第一次直接执行 `npm start` 启动失败，原因不是源码本身，而是当前终端环境导出了 `ELECTRON_RUN_AS_NODE=1`，导致 Electron 以 Node 模式运行
- 在当前环境里，正确的启动方式是 `env -u ELECTRON_RUN_AS_NODE npm start`
- 在修正环境变量后，应用成功启动，并输出了 Claude hook 自动注册日志，以及 `Clawd state server listening on 127.0.0.1:23333`
- 对 `127.0.0.1:23333/state` 发出的手动 POST 请求，`thinking` 和 `attention` 测试事件都返回了 `ok`，说明未来的 Gemini 适配层可以直接复用这条事件入口
- 目前这轮基线只证明了进程启动成功和接口可用，窗口是否真实显示、交互是否正常还需要进一步目视确认

---

## Gemini Integration Notes / Gemini 集成笔记

- `package.json` 现在通过 `node tools/start-electron.js` 启动应用，而不是直接调用 Electron
- `tools/start-electron.js` 会在拉起 Electron 前移除 `ELECTRON_RUN_AS_NODE`
- `src/main.js` 现在默认关闭 Claude hook 自动注册，只有设置 `CLAWD_ENABLE_CLAUDE_HOOKS=1` 才会重新打开
- `hooks/gemini-hook.js` 现在既支持位置参数和 flag，也能直接消费真实 Gemini hook stdin 载荷
- 桥接脚本现在支持 best-effort 模式，并会把事件以 JSONL 形式记录到 `logs/gemini-hook-events.jsonl`
- JSONL 日志现在还会附带 HTTP 响应体，后续排查 `ok` 和 `duplicate_ignored` 之类结果会更直接
- `apps/clawd-on-desk-macos/.gemini/settings.json` 已经安装了项目级 Gemini hooks，因此只要在这个工作区里直接运行 `gemini`，桌宠就会自动收到事件
- 已验证的真实 Gemini CLI hook 路径包括：`SessionStart`、`BeforeAgent`、`PreCompress`、`AfterAgent` 和 `SessionEnd`
- `src/main.js` 现在已经兼容 `gemini_session_end` 这类 Gemini 生命周期事件名，并会在短时间内抑制重复 SessionEnd
- 已验证的 live `/state` 去重行为：同一个 session 连续两次立即发送 `gemini_session_end`，服务端会先返回 `ok`，再返回 `duplicate_ignored`

---

## macOS Risk Register / macOS 风险登记

这些是最需要尽早验证的高风险区域：

- 透明窗口的点击穿透在 macOS 上可能和 Windows 行为不同。
- 托盘行为可能需要 macOS 专用图标资源和菜单处理方式。
- 开机自启在不同 macOS 版本上的行为可能不同，必须单独验证。
- 打包后如果 Electron `asar` 布局不同，hook 路径可能失效。
- 未签名应用可能被 Gatekeeper 拦截，取决于打包方式。
- 指针、焦点和 always-on-top 行为可能需要 macOS 专属绕过方案。
- mini mode 和边缘吸附逻辑可能需要根据 macOS 屏幕坐标重新调参。
- 本地 Gemini 工作流可能没有直接暴露出和 Claude Code 等价的生命周期事件，因此适配层可能需要做近似推断。

---

## Decision Log / 决策日志

### 2026-03-22

- Decision / 决策：使用一份总 markdown 作为进度真源。
- Reason / 原因：未来会话需要一个确定的恢复入口。

- Decision / 决策：后续所有项目内容都放进 `macos_clawd/`。
- Reason / 原因：这个文件夹之后要能作为一个自包含目录直接上传到 GitHub。

- Decision / 决策：把 Gemini 作为这个项目的主要目标模型集成。
- Reason / 原因：当前本地环境只有 Gemini 可用，因此 Gemini-first 是唯一实际可交付的一期目标。

- Decision / 决策：使用 `apps/clawd-on-desk-macos/` 作为移植工作的活动目录，同时保留 `upstream/clawd-on-desk/` 作为参考副本。
- Reason / 原因：这样可以把上游参考源码和我们的 Gemini/macOS 实现隔离开，避免直接污染参考基线。

- Decision / 决策：先保留上游 Electron 应用和 `/state` 服务模型，只把 Claude 专属的 hook 注册和事件发送层替换成 Gemini 适配器。
- Reason / 原因：这是改动面最小、也最能保留已审计运行时行为的方案。

- Decision / 决策：在工作副本里直接用自定义启动器处理 `ELECTRON_RUN_AS_NODE`，而不是每次手动 unset。
- Reason / 原因：这样可以让 `npm start` 本身就稳定可用，避免后续会话反复踩同一个环境坑。

- Decision / 决策：默认关闭 Claude hook 自动注册，并把 Claude 兼容改成显式 opt-in。
- Reason / 原因：当前项目已经转向 Gemini-first，不应该再在每次启动时修改 `~/.claude/settings.json`。

- Decision / 决策：先保留上游行为，再考虑 macOS 原生体验优化。
- Reason / 原因：行为对齐比一开始就重构更容易验证。

- Decision / 决策：除非后续有新要求，否则优先支持 Apple Silicon。
- Reason / 原因：这是当前最可能的运行环境，也能降低初始范围。

- Decision / 决策：增加一份中文镜像文档。
- Reason / 原因：便于你直接阅读和管理进度，同时保留英文主文件作为规范真源以防止漂移。

- Decision / 决策：通过 `.gemini/settings.json` 里的项目级 Gemini hooks 接入，而不是额外包装 `gemini` 命令。
- Reason / 原因：你本来的使用方式就是直接输入 `gemini`，而原生项目级 hooks 能保留这个工作流，同时还能直接拿到真实的 session_id 和 hook 事件载荷。

- Decision / 决策：让 Gemini 桥接以 best-effort 方式运行，并把每次 hook 投递追加记录到 `logs/gemini-hook-events.jsonl`。
- Reason / 原因：桌宠集成不应该阻塞 Gemini 的正常使用，而追加式 JSONL 日志能让后续调试和恢复工作更稳定。

- Decision / 决策：不要等 Gemini CLI 上游修复重复 `SessionEnd`，而是在本地 Electron 应用入口直接容忍并抑制这类短时间重复结束事件。
- Reason / 原因：在 `/state` 入口做事件名兼容和短时间去重的成本很低，而且比假设上游永远只发一次结束事件更稳妥。

---

## Verification Notes / 验证记录

这里必须使用追加式记录，不要覆盖历史结果。

模板：

```text
Date:
Module:
Command:
Result:
Notes:
```

当前记录：

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
Command: N/A
Result: PASS
Notes: Added a Chinese mirror file for the macOS port master plan and defined sync rules with the English canonical file.
```

```text
Date: 2026-03-22
Module: M0
Command: mkdir -p macos_clawd/upstream macos_clawd/apps
Result: PASS
Notes: Confirmed macos_clawd as the self-contained project root and created the internal directory skeleton for future source import and implementation work.
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
Notes: 升级桥接脚本以消费真实 Gemini hook stdin 载荷，增加 best-effort 日志能力，并安装了项目级 Gemini hooks 配置，让这个工作区里直接运行 gemini 就能驱动桌宠。
```

```text
Date: 2026-03-22
Module: M5
Command: printf '{"hook_event_name":"BeforeAgent",...}' | node hooks/gemini-hook.js --strict --log-file logs/gemini-hook-events.jsonl
Result: PASS
Notes: 对运行中的应用做 live 验证时，BeforeAgent 被正确映射成 thinking，并从本地 /state 端点收到了 ok。
```

```text
Date: 2026-03-22
Module: M5
Command: printf '{"hook_event_name":"AfterTool","tool_response":{"error":"tool crashed"},...}' | node hooks/gemini-hook.js --strict --log-file logs/gemini-hook-events.jsonl
Result: PASS
Notes: 对运行中的应用做 live 验证时，AfterTool 错误载荷被正确映射成 gemini_tool_error，并从本地 /state 端点收到了 ok。
```

```text
Date: 2026-03-22
Module: M5
Command: GEMINI_CLI_NO_RELAUNCH=true gemini -p "Reply with OK only." --output-format json
Result: PASS
Notes: 一次真实 Gemini CLI 运行返回了 OK，并带来了真实 session_id；项目级 hooks 成功触发并到达桌宠桥接，事件链包括 SessionStart、BeforeAgent、PreCompress、AfterAgent 和 SessionEnd；这次运行里 SessionEnd 出现了两次，后续需要复核。
```

```text
Date: 2026-03-22
Module: M5
Command: patch src/main.js and hooks/gemini-hook.js
Result: PASS
Notes: 在主进程里补上了 Gemini 生命周期事件名兼容、live /state 入口的短时间重复 SessionEnd 抑制，并让 JSONL hook 日志记录 HTTP 响应体。
```

```text
Date: 2026-03-22
Module: M5
Command: node -e '...two back-to-back POST /state requests with event gemini_session_end...'
Result: PASS
Notes: live 入口验证时，第一次 SessionEnd 返回 ok，第二次立即返回 duplicate_ignored，说明应用侧去重已经生效。
```

```text
Date: 2026-03-22
Module: M3
Command: lsof -nP -iTCP:23333 -sTCP:LISTEN; lsappinfo info -pid 12916; osascript ...
Result: PARTIAL
Notes: 已确认 live 应用是一个前台 Electron 进程，并且拥有 127.0.0.1:23333 监听端口；但脚本化窗口检查被 System Events 缺少“辅助功能”权限阻断（错误 -25211）。
```

```text
Date: 2026-03-22
Module: M5
Command: patch hooks/gemini-hook.js and .gemini/settings.json
Result: PASS
Notes: 给 SessionStart 增加了自动拉起能力，让 Gemini 桥接在本地桌宠未启动时也能按需启动 Electron，并等待 /state 服务就绪，同时把 launched_app 和 app_ready 写入 JSONL 日志。
```

```text
Date: 2026-03-22
Module: M5
Command: GEMINI_CLI_NO_RELAUNCH=true gemini -p "Reply with OK only." --output-format json
Result: PASS
Notes: 在 127.0.0.1:23333 没有任何监听器的完全停止状态下，一次真实 Gemini CLI 运行成功通过项目级 SessionStart hook 自动拉起了 Electron 桌宠，返回了 OK，并在会话结束时把第二次重复 SessionEnd 记成了 duplicate_ignored。
```

```text
Date: 2026-03-22
Module: M3
Command: lsof -nP -iTCP:23333 -sTCP:LISTEN
Result: PASS
Notes: 已确认自动拉起后的新 Electron 进程再次占用了 127.0.0.1:23333 监听端口。
```

```text
Date: 2026-03-22
Module: M5
Command: patch hooks/gemini-hook.js, add tools/install-global-gemini-hooks.js, patch package.json, remove .gemini/settings.json
Result: PASS
Notes: 已把 Gemini hooks 从项目内方案迁移到可复用的全局安装方案，给桥接脚本补上固定 app 根目录支持，并删除项目级 hook 文件，避免用户级 hooks 启用后产生重复投递。
```

```text
Date: 2026-03-22
Module: M5
Command: node tools/install-global-gemini-hooks.js
Result: PASS
Notes: 已更新 ~/.gemini/settings.json 中的用户级 Clawd hooks，保留了原有用户设置，并自动备份到 ~/.gemini/settings.backup.2026-03-22T13-08-47-376Z.json。
```

```text
Date: 2026-03-22
Module: M5
Command: (from Desktop) GEMINI_CLI_NO_RELAUNCH=true gemini -p "Reply with OK only." --output-format json
Result: PASS
Notes: 已确认在项目目录之外的 Desktop 里执行一次真实 Gemini，也会通过用户级 hooks 自动拉起桌宠，不再依赖工作区内的 .gemini/settings.json。
```

```text
Date: 2026-03-22
Module: M3
Command: tail -n 6 logs/gemini-hook-events.jsonl; lsof -nP -iTCP:23333 -sTCP:LISTEN
Result: PASS
Notes: 已确认这次来自 Desktop 的会话在日志里记录了一个 Desktop 工作目录作为 cwd，SessionStart 带有 launched_app=true，而且随后 Electron 再次监听了 127.0.0.1:23333。
```

```text
Date: 2026-03-22
Module: M3
Command: kill 26482; lsof -nP -iTCP:23333 -sTCP:LISTEN
Result: PASS
Notes: 已在全局 hooks 验证结束后主动关闭测试用 Electron 进程，并确认 127.0.0.1:23333 当前没有监听器，这样下一次 Gemini 执行会再次走一条干净的自动拉起路径。
```

```text
Date: 2026-03-22
Module: M5
Command: patch .gitignore, add tools/gemini-no-pet.js, add tools/install-gemini-no-pet-command.js, patch package.json
Result: PASS
Notes: 已新增一个专门的无桌宠 Gemini 包装器：它会先关闭正在运行的桌宠进程，再用一个不带 hooks 的隔离 Gemini home 运行 Gemini，并且可以作为单独的全局命令安装，而不影响默认的 gemini 工作流。
```

```text
Date: 2026-03-22
Module: M5
Command: node tools/install-gemini-no-pet-command.js
Result: PASS
Notes: 已把全局 gemini-no-pet 命令安装到 ~/.local/bin/gemini-no-pet，所以现在可以在这台机器的任意目录里直接调用。
```

```text
Date: 2026-03-22
Module: M5
Command: (from Desktop) GEMINI_CLI_NO_RELAUNCH=true gemini-no-pet -p "Reply with OK only." --output-format json
Result: PASS
Notes: 在修正隔离 Gemini home 的路径层级之后，这个新命令已经能从 Desktop 返回 OK，而且不会为桌宠 JSONL 日志新增任何行，执行结束后 127.0.0.1:23333 也没有监听器。
```

```text
Date: 2026-03-22
Module: Documentation
Command: create macos_clawd/README.md
Result: PASS
Notes: 已新增一个简化版根目录 README，用更短的方式概括了相对上游的 macOS/Gemini 改造内容，以及当前已经支持的日常命令。
```

```text
Date: 2026-03-22
Module: Documentation
Command: create macos_clawd/README.zh-CN.md
Result: PASS
Notes: 已新增根目录 README 的中文镜像文件，这样现在项目根目录已经有中英文两份简化入口说明。
```

```text
Date: 2026-03-22
Module: Documentation
Command: scan maintained markdown files for home-directory path markers
Result: PASS
Notes: 已确认当前维护的项目 Markdown 文档不再暴露用户级文件系统路径；需要展示目录时，统一改成了类似 ../macos_clawd/apps/clawd-on-desk-macos 这样的相对写法。
```

```text
Date: 2026-03-22
Module: Publishing Prep
Command: git -C macos_clawd init && git -C macos_clawd remote add origin https://github.com/thefatheroffire/clawd-on-desk-macos.git
Result: PASS
Notes: 已经把 macos_clawd 初始化成一个可独立发布的本地 Git 仓库，新增了根目录 .gitignore 来挡住本地运行数据，并配置好了目标公开仓库的远程地址。
```

```text
Date: 2026-03-22
Module: Publishing Prep
Command: git -C macos_clawd push -u origin main
Result: FAIL
Notes: 在放开网络后，命令已经能连到 GitHub，但当前被本机的 GitHub HTTPS 凭据拦住了：`could not read Username for 'https://github.com': Device not configured`。
```

```text
Date: 2026-03-22
Module: Publishing Prep
Command: GIT_SSH_COMMAND='ssh -i ~/.ssh/id_rsa -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new' git -C macos_clawd push -u origin main
Result: PASS
Notes: 已经把 origin 改成 SSH，并成功把 main 分支发布到 git@github.com:thefatheroffire/clawd-on-desk-macos.git。
```

---

## Session Log / 会话日志

每个工作会话新增一条记录，最新记录放最上面。

### 2026-03-22 Session 21

- What happened / 本次发生了什么：
  - 已经在本地 `macos_clawd/` 仓库上创建了第一次提交，并把分支整理成了 `main`。
  - 实际对 `https://github.com/thefatheroffire/clawd-on-desk-macos.git` 跑了一次 `git push -u origin main`。
  - 已确认当前真正的阻塞点不是仓库结构，而是这台机器上的 GitHub HTTPS 认证还没给 `git` 配好。
- Current truth / 当前真实状态：
  - 本地 Git 历史已经就位，仓库处于可以发布的状态。
  - 首次推送现在卡在 GitHub 凭据层，或者后续可以改走 SSH 这类已认证传输方式。
  - 当前目标远程仍然是 `origin -> https://github.com/thefatheroffire/clawd-on-desk-macos.git`。
- Recommended next step / 建议下一步：
  - 先在这台机器上完成 GitHub 认证、确认公开仓库已存在，然后重新执行 `git -C macos_clawd push -u origin main`。

### 2026-03-22 Session 22

- What happened / 本次发生了什么：
  - 把 `origin` 从 HTTPS 切到了 SSH：`git@github.com:thefatheroffire/clawd-on-desk-macos.git`。
  - 复用了本机的 `~/.ssh/id_rsa`，通过 `GIT_SSH_COMMAND` 成功把 `main` 推到了 GitHub。
  - 已确认本地分支现在开始跟踪 `origin/main`。
- Current truth / 当前真实状态：
  - 公开仓库现在已经在 GitHub 上线，本地 `macos_clawd/` 仓库也已经通过 SSH 和它连通。
  - 只要这台机器继续保留当前 GitHub SSH key，后续推送都应该可以继续通过 SSH 完成。
  - 主线实现任务现在重新回到打包和应用分发。
- Recommended next step / 建议下一步：
  - 继续推进 `M6 - Packaging and App Distribution`，后续新提交继续通过 SSH 推送到 `origin/main`。

### 2026-03-22 Session 20

- What happened / 本次发生了什么：
  - 开始把 `macos_clawd/` 整理成一个可以单独公开发布的 Git 仓库。
  - 新增了根目录 `.gitignore`，把 `upstream/`、依赖目录、日志、缓存以及本地 Gemini 运行数据都排除在未来的 GitHub 上传之外。
  - 在 `macos_clawd/` 里初始化了本地 Git 仓库，暂存了当前可发布的项目文件，并把 `origin` 设置成 `https://github.com/thefatheroffire/clawd-on-desk-macos.git`。
- Current truth / 当前真实状态：
  - 现在本地工作区已经处在一个适合“第一次提交 / 第一次推送”的干净状态。
  - `.gemini/`、`.npm-cache/`、`logs/`、`node_modules/` 和 `upstream/` 这类敏感或本地专属目录目前都不会进入版本控制。
  - 这台机器没有 `gh`，所以远程仓库创建和首轮推送还需要通过 GitHub 网页端，或者在远程仓库存在后直接走认证过的 `git push`。
- Recommended next step / 建议下一步：
  - 创建或确认公开仓库 `thefatheroffire/clawd-on-desk-macos`，然后在本地 `macos_clawd/` 完成首次提交并把 `main` 推到 `origin`。

### 2026-03-22 Session 19

- What happened / 本次发生了什么：
  - 把 `macos_clawd/` 下我们维护的 Markdown 文档里剩余的用户机器路径示例继续清掉了。
  - 对外展示的命令示例统一改成了类似 `../macos_clawd/apps/clawd-on-desk-macos` 这样的相对路径，而不再暴露真实文件系统地址。
  - 又做了一轮搜索确认：根目录双语 README、双语主计划，以及活动应用目录里的双语 README 都不再包含用户专属 home 目录字符串。
- Current truth / 当前真实状态：
  - 现在对外可读的项目 Markdown 已经可以直接分享，不会暴露本机用户名或完整工作站路径。
  - 实际应用目录名仍然保持 `clawd-on-desk-macos`；这次只做了基路径写法脱敏，没有改真实文件夹名称。
  - 下一条主线任务仍然是打包。
- Recommended next step / 建议下一步：
  - 开始 `M6 - Packaging and App Distribution`，等独立 `.app` 工作流出来后，再回头更新根目录双语 README。

### 2026-03-22 Session 18

- What happened / 本次发生了什么：
  - 在发现主计划里先记录了 `README.md`、但磁盘上实际还没有这个文件之后，真正把根目录 `README.md` 创建出来了。
  - 新增了 `README.zh-CN.md`，作为根目录简化入口文档的中文镜像。
  - 更新了工作区映射和验证记录，让文档里写的当前布局和实际文件系统状态重新一致。
- Current truth / 当前真实状态：
  - 现在 `macos_clawd/` 根目录已经真实存在 `README.md` 和 `README.zh-CN.md` 两个入口文件。
  - 这对根目录 README 现在是快速入口，而两份 master plan 仍然是详细断点恢复真源。
  - 下一条主线任务仍然是打包。
- Recommended next step / 建议下一步：
  - 开始 `M6 - Packaging and App Distribution`，等打包后的 `.app` 工作流出来后，再回来同步更新这两份根目录 README。

### 2026-03-22 Session 17

- What happened / 本次发生了什么：
  - 在 `macos_clawd/` 根目录新增了 `README.md`，作为简化版项目入口文档。
  - 把两份 master plan 的核心内容收敛成更短的项目说明，重点解释了相对上游做了哪些改动，以及现在有哪些命令可以直接使用。
  - 更新了工作区映射，让新的根目录 README 也被记录进当前项目布局。
- Current truth / 当前真实状态：
  - 现在 `macos_clawd/` 根目录除了详细主计划外，也有了一份适合快速阅读的入口说明。
  - README 是简化版入口，真正的断点恢复和详细上下文仍然以两份 master plan 为准。
  - 下一条主线实现任务仍然是打包。
- Recommended next step / 建议下一步：
  - 开始 `M6 - Packaging and App Distribution`，等打包流程出来后，再回来补一版 README 的独立 `.app` 使用说明。

### 2026-03-22 Session 15

- What happened / 本次发生了什么：
  - 新增了专门的 `gemini-no-pet` 包装器：它会准备一个不带 hooks 的隔离 Gemini home，先终止 `23333` 端口上的桌宠进程，再启动正常的 Gemini CLI，并继续复用同一套用户认证信息。
  - 新增了 `tools/install-gemini-no-pet-command.js`，并把这个命令安装成了全局可用的 `~/.local/bin/gemini-no-pet`。
  - 第一次验证时踩到了一个路径 bug，因为 `GEMINI_CLI_HOME` 指到了嵌套的 `.gemini` 目录本身；修好 home 根目录层级之后，我重新跑通了整条链路。
  - 已经从 `Desktop` 实测确认：`gemini-no-pet -p "Reply with OK only." --output-format json` 会返回 `OK`、不会为桌宠 hook 日志新增任何记录，并且执行结束后 `127.0.0.1:23333` 仍然空闲。
- Current truth / 当前真实状态：
  - 这台机器现在已经有两条明确的 Gemini 使用模式：`gemini` 用于自动桌宠联动，`gemini-no-pet` 用于无桌宠运行 Gemini。
  - 这两个命令现在都已经可用，而且当前环境是干净状态，`23333` 上没有桌宠监听器。
  - 下一条真正的主线工作仍然是打包。
- Recommended next step / 建议下一步：
  - 开始 `M6 - Packaging and App Distribution`，然后决定这两个全局命令后面应该如何改指向打包后的 macOS 应用路径。

### 2026-03-22 Session 16

- What happened / 本次发生了什么：
  - 在 `gemini-no-pet` 验证通过之后，对主计划做了同步收口。
  - 新增了一段命令参考区，把当前支持的日常指令都列了出来，包括正常 Gemini、无桌宠 Gemini、手动启动桌宠、查看日志、关闭桌宠，以及重新安装两个全局入口的方法。
- Current truth / 当前真实状态：
  - 现在文档里已经不只是实现历史，也包含了当前这套项目真正可用的操作面。
  - 下次恢复工作时，可以直接从命令参考区加上当前阶段和阻塞信息继续。
  - 打包仍然是下一条主要实现主线。
- Recommended next step / 建议下一步：
  - 开始 `M6 - Packaging and App Distribution`，等打包后的 `.app` 路径确定后，再回来更新这份命令参考区。

### 2026-03-22 Session 14

- What happened / 本次发生了什么：
  - 对第一次全局 hooks 验证完成后的项目状态做了同步收口。
  - 明确确认现在的机器级 Gemini 集成已经是新的基线，不再以旧的项目级 hooks 方案为准。
  - 记录了验证结束后测试用 Electron 进程已经被主动关闭，`127.0.0.1:23333` 目前空闲，方便下一次再做干净冷启动。
- Current truth / 当前真实状态：
  - 现在的活动基线已经是：在这台机器上的任意目录执行 `gemini`，由用户级 Gemini hooks 自动拉起桌宠。
  - 当前环境是空闲且干净的，所以下一轮手测或打包工作都会从可预测状态开始。
  - 现在真正的主线工作已经是打包。
- Recommended next step / 建议下一步：
  - 开始 `M6 - Packaging and App Distribution`，然后把全局 hook 安装器的目标切到打包后的应用路径。

### 2026-03-22 Session 13

- What happened / 本次发生了什么：
  - 给 `hooks/gemini-hook.js` 增加了固定 app 根目录支持，让桥接脚本在 Gemini 从项目目录外启动时也能正确拉起桌宠。
  - 新增了 `tools/install-global-gemini-hooks.js` 和对应的 package script，用来把用户级 Gemini hooks 安装或刷新到 `~/.gemini/settings.json`。
  - 删除了工作区内的 `.gemini/settings.json`，避免在全局 hooks 生效后出现重复注册和重复投递。
  - 在带备份保护的前提下安装了全局 hooks，然后从 `Desktop` 执行了一次真实 `GEMINI_CLI_NO_RELAUNCH=true gemini -p "Reply with OK only." --output-format json`。
  - 从日志中确认这次 Desktop 发起的运行成功自动拉起了桌宠，`cwd` 被记录成一个 Desktop 工作目录，并且重复 SessionEnd 依然会被安全处理成 `duplicate_ignored`。
- Current truth / 当前真实状态：
  - 现在这台机器上，从任意工作目录执行 `gemini` 都可以自动拉起桌宠，包括 `Desktop`。
  - 当前方案仍然通过当前安装位置指向源码树，所以如果以后移动仓库目录或换机器，需要重新安装一次全局 hooks。
  - 下一个重点已经不是事件桥接，而是打包。
- Recommended next step / 建议下一步：
  - 开始 `M6 - Packaging and App Distribution`，然后把全局 hooks 的目标从源码树启动器切到打包后的 macOS 应用。

### 2026-03-22 Session 12

- What happened / 本次发生了什么：
  - 对最近这轮 Gemini 集成后的用户可见行为做了收口确认。
  - 明确记录了当前自动拉起能力是“工作区范围内生效”的：在 `apps/clawd-on-desk-macos` 里运行 `gemini` 能拉起桌宠，但目前还没有一个可以在 Finder 或桌面双击启动的独立 `.app`。
  - 把后续重点从桥接正确性切换到独立应用打包，同时保留现有 Gemini hooks 链路作为运行时基础。
- Current truth / 当前真实状态：
  - 当前版本已经适合在项目目录里用终端驱动 Gemini 和桌宠联动。
  - 桌面图标或双击启动体验还没有实现。
  - 下一个真正有价值的里程碑已经不再是桥接能不能工作，而是独立 macOS 应用打包和启动体验。
- Recommended next step / 建议下一步：
  - 开始 `M6 - Packaging and App Distribution`，然后再从打包后的应用路径补做窗口目检和多会话验证。

### 2026-03-22 Session 11

- What happened / 本次发生了什么：
  - 扩展了 `hooks/gemini-hook.js`，让 SessionStart 在本地没有桌宠监听器时可以自动拉起 Electron 应用。
  - 更新了 `.gemini/settings.json`，让项目级 Gemini SessionStart hooks 现在会带着 `--ensure-app` 调用桥接脚本。
  - 先停掉了已有 Electron 进程，确认 `127.0.0.1:23333` 空闲，然后从完全停止状态执行了一次真实 `GEMINI_CLI_NO_RELAUNCH=true gemini -p "Reply with OK only." --output-format json`。
  - 从日志里确认 SessionStart 记录了 `launched_app: true` 和 `app_ready: true`，并在命令结束后再次确认 Electron 重新占用了 `127.0.0.1:23333`。
  - 观察到第二次 SessionEnd 现在会返回 `duplicate_ignored`，这和 Session 10 中加入的本地入口去重一致。
- Current truth / 当前真实状态：
  - 现在的日常使用路径已经是 `cd apps/clawd-on-desk-macos && gemini ...`；如果桌宠没开，它会在 SessionStart 自动拉起。
  - Gemini 事件桥接已经不再是主要不确定项，剩下的重点是视觉确认、多会话行为，以及最终发布前的清理工作。
  - Gemini CLI 仍然会在执行前提示项目级 hooks，这件事需要作为预期信任流程写进文档。
- Recommended next step / 建议下一步：
  - 在一次正常 Gemini 使用过程中人工看着自动拉起的桌宠窗口，再继续做多会话或并发任务验证。

### 2026-03-22 Session 10

- What happened / 本次发生了什么：
  - 修改了 `src/main.js`，让 live 应用现在能正确理解 `gemini_session_end` 这类 Gemini 生命周期事件，而不再只认 Claude 风格的 `SessionEnd`。
  - 在 `/state` 入口增加了短时间重复 SessionEnd 抑制。
  - 扩展了 `hooks/gemini-hook.js` 的 JSONL 日志，让每条记录现在都会带上 HTTP 响应体。
  - 用两次紧贴的 direct `/state` 请求验证了去重，返回值分别是 `ok` 和 `duplicate_ignored`。
  - 通过 `lsof` 和 `lsappinfo` 确认了 live 应用是一个前台 Electron 进程，并且正在监听 `127.0.0.1:23333`。
- Current truth / 当前真实状态：
  - 即使 Gemini CLI 在非交互模式里还会发出两次 `SessionEnd`，本地应用现在也已经在入口层面把这个问题缓解掉了。
  - 当前主要未完成项已经不是 Gemini 事件链路，而是真实窗口和交互的视觉确认。
  - 用脚本自动读取窗口信息这件事，目前被 macOS“辅助功能”权限缺失卡住了。
- Recommended next step / 建议下一步：
  - 对 live 桌宠窗口和控制做一次真正的目检；如果还想继续做终端驱动的窗口检查，就先给当前自动化链路补上“辅助功能”权限，然后再继续多会话 Gemini 验证。

### 2026-03-22 Session 9

- What happened / 本次发生了什么：
  - 确认了本地真实工作流就是 Homebrew 安装的 `gemini` CLI，而且它支持项目级 hooks。
  - 在 `apps/clawd-on-desk-macos/.gemini/settings.json` 里安装了项目级 hooks，所以现在只要在这个工作区里直接运行 `gemini`，就会自动调用桌宠桥接。
  - 升级了 `hooks/gemini-hook.js`，让它能消费真实 Gemini hook stdin 载荷、基于 `hook_event_name` 推导事件、写入 JSONL 调试日志，并以 best-effort 模式运行，避免桌宠没开时影响 Gemini。
  - 用手工 Gemini 风格载荷和一次真实的 `GEMINI_CLI_NO_RELAUNCH=true gemini -p "Reply with OK only." --output-format json` 做了 live 验证。
- Current truth / 当前真实状态：
  - 真实 Gemini CLI 到 live `/state` 服务的端到端集成已经打通。
  - 当前 M5 剩下的重点是打磨边界行为：一次真实运行里出现了重复 `SessionEnd`，而多会话行为还没有验证。
  - macOS 桌宠界面的视觉确认依然没做完。
- Recommended next step / 建议下一步：
  - 让应用保持启动，继续用正常 `gemini` 命令做实际使用，同时目检窗口和控制行为，然后决定重复 `SessionEnd` 是要在桥接层去重还是只记成文档说明。

### 2026-03-22 Session 8

- What happened / 本次发生了什么：
  - 修改了工作副本的启动方式，让 `npm start` 现在会通过自定义 Electron 启动器自动去掉 `ELECTRON_RUN_AS_NODE`。
  - 默认关闭了 Claude hook 自动注册。
  - 新增了 `hooks/gemini-hook.js`，作为第一版 Gemini 侧事件发送器。
  - 验证了新的 Gemini sender 可以通过 live `/state` 入口驱动 `thinking` 和 `attention` 状态。
- Current truth / 当前真实状态：
  - 工作副本现在已经有了真实的 Gemini 集成入口，不再只是规划阶段。
  - 启动过程不再受当前终端环境变量影响。
  - 现在缺的不是协议，而是你的真实本地 Gemini 工作流该如何自动调用这个 sender。
- Recommended next step / 建议下一步：
  - 把真实的 Gemini 工作流或包装层接到 `hooks/gemini-hook.js` 上，然后验证一条完整的 Gemini 任务生命周期，并继续补做桌面 UI 的目视确认。

### 2026-03-22 Session 7

- What happened / 本次发生了什么：
  - 在 `apps/clawd-on-desk-macos/` 中建立了活动工作副本。
  - 用 `npm ci` 成功安装了依赖。
  - 把第一次启动失败定位成环境问题：`ELECTRON_RUN_AS_NODE=1`。
  - 在去掉该环境变量后成功启动了应用，并确认本地 `/state` 服务已经起来。
  - 对 `/state` 做了手动 `thinking` 和 `attention` 事件注入，两个请求都返回了 `ok`。
- Current truth / 当前真实状态：
  - 当前环境下，只要去掉 `ELECTRON_RUN_AS_NODE`，这份基线应用就能启动。
  - 现有 `/state` 入口已经能接收 Gemini 风格的外部事件。
  - 启动时仍会自动注册 Claude hooks，这一块下一步需要去掉或替换。
- Recommended next step / 建议下一步：
  - 修改工作副本，关闭 Claude hook 自动注册，然后实现第一版 Gemini 事件发送器，并继续基于 `/state` 这条已验证的协议推进。

### 2026-03-22 Session 6

- What happened / 本次发生了什么：
  - 审计了上游运行时架构、渲染层流程、hook 安装器和 hook 发送器。
  - 确认上游应用已经包含不少 macOS 支持和打包分支。
  - 识别出最小可行的 Gemini 方案：保留 Electron 应用和 `/state` 服务，只替换 Claude 专属 hook 层。
  - 在文档里写入了初版 Gemini 到桌宠状态的映射。
- Current truth / 当前真实状态：
  - 我们已经足够理解上游应用，可以开始构建实际工作副本。
  - 本地 Gemini 的精确信号来源还没锁定，所以适配器实现还没有开始。
  - macOS 上的真实运行验证仍然待做。
- Recommended next step / 建议下一步：
  - 将上游应用复制到 `apps/clawd-on-desk-macos/`，去掉嵌套 `.git`，然后启动一次基线运行并配合手动 `/state` 测试。

### 2026-03-22 Session 5

- What happened / 本次发生了什么：
  - 将上游仓库 clone 到了 `macos_clawd/upstream/clawd-on-desk`。
  - 记录了上游 commit `fff1e43474d24e1777f6715bb2e4dc2c96cf8757`。
  - 创建了 `apps/clawd-on-desk-macos/` 作为移植工作的活动目录。
  - 在活动目录里补了 `.gitkeep`，保证之后进入 Git 时不会丢失。
  - 项目状态从工作区初始化推进到了上游审计阶段。
- Current truth / 当前真实状态：
  - 上游源码已经在本地可读。
  - 活动实现目录已经存在，但仍然是空的。
  - 下一步关键工作是审计上游应用，并定义 Gemini 适配方案。
- Recommended next step / 建议下一步：
  - 读取上游入口文件和 hook 文件，然后把 Claude 驱动的状态流映射成 Gemini 驱动信号。

### 2026-03-22 Session 4

- What happened / 本次发生了什么：
  - 把项目目标模型从 Claude Code 切换成了 Gemini。
  - 更新了计划文档，明确上游仓库只是架构参考，而不是最终集成目标。
  - 将集成工作重新定义为通过 Gemini 侧适配层驱动桌宠状态入口。
- Current truth / 当前真实状态：
  - 上游代码仍然需要导入。
  - 第一版发布目标已经改成 macOS 上的 Gemini-first。
- Recommended next step / 建议下一步：
  - 将上游仓库 clone 到 `macos_clawd/upstream/clawd-on-desk`，然后审计哪些上游事件和桌宠状态需要 Gemini 等价映射。

### 2026-03-22 Session 3

- What happened / 本次发生了什么：
  - 确认后续所有内容都应放在 `macos_clawd/` 下。
  - 在 `macos_clawd/` 内创建了 `upstream/` 和 `apps/`。
  - 增加了 `.gitkeep` 占位文件，保证空目录进入 Git 后也能保留。
  - 更新了计划文件，使这个文件夹未来可以直接作为自包含项目上传到 GitHub。
- Current truth / 当前真实状态：
  - 当前项目根目录已经确定为 `macos_clawd/`。
  - 规划文档和目录骨架都已就位，但上游源码仍未导入。
- Recommended next step / 建议下一步：
  - 将上游仓库 clone 到 `macos_clawd/upstream/clawd-on-desk`，继续完成 M0。

### 2026-03-22 Session 2

- What happened / 本次发生了什么：
  - 新增了中文镜像文件。
  - 明确了英文主文件和中文镜像文件之间的同步规则。
- Current truth / 当前真实状态：
  - 本地仍然没有上游源码。
  - macOS 移植工作尚未进入代码实现阶段。
- Recommended next step / 建议下一步：
  - 导入上游仓库，继续完成 M0。

### 2026-03-22 Session 1

- What happened / 本次发生了什么：
  - 确认了上游仓库是公开可读的。
  - 确认当前工作区为空。
  - 创建了总计划文件，保证后续会话可以续接。
- Current truth / 当前真实状态：
  - 还没有本地源码。
  - 还没有开始 macOS 实现工作。
- Recommended next step / 建议下一步：
  - 导入上游仓库并开始完成 M0。

---

## Resume Protocol / 恢复协议

未来每次开始新会话时：

1. 如果是从父级工作区进入，先打开 `macos_clawd/00_MACOS_PORT_MASTER_PLAN.md`。
2. 优先阅读 `Progress Snapshot / 进度快照`。
3. 阅读 `Current Blockers / 当前阻塞`。
4. 执行 `Next Action / 下一步行动`，除非用户给了新的优先级。
5. 如果要切换模块，先更新 `Progress Snapshot / 进度快照`。

未来每次结束会话时：

1. 更新 `Last updated / 最后更新`。
2. 更新 `Current phase / 当前阶段`、`Current module / 当前模块`、`Overall status / 总体状态`。
3. 更新对应模块状态。
4. 每个有意义的测试或命令结果，都要新增一条 `Verification Notes / 验证记录`。
5. 在最上方新增一条 `Session Log / 会话日志`。
6. 重写 `Next Action / 下一步行动`，保证下一次进入时无需猜测。
7. 同步英文主文件和中文镜像文件的进度区块。

---

## Quick Resume Prompt for Future Sessions / 未来会话快速恢复提示

如果未来会话只需要一句恢复指令，可以使用：

`先读 macos_clawd/00_MACOS_PORT_MASTER_PLAN.md，再核对 macos_clawd/00_MACOS_PORT_MASTER_PLAN.zh-CN.md，信任 Progress Snapshot 和 Module Board，然后继续执行 Next Action，除非用户给了新的优先级。`
