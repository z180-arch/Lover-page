# Feature Registry

> 每个功能的状态 / 配置 API / 运行时模块 / 依赖 / QA / 文档。
> **加功能必须在此登记；删功能必须把条目改成 `removed` 并说明原因。**

**最后更新**：2026-09-15

图例：`stable` 已实测可用 · `partial` 部分实现 · `planned` 已设计未实现 ·
`backlog` 已识别未设计 · `removed` 已移除 · `blocked` 依赖未满足

---

## 1. 核心运行时

| 功能 | 状态 | 配置 API | 运行时模块 | 依赖 | QA | 文档 |
|---|---|---|---|---|---|---|
| Config 系统（唯一内容入口） | stable | `config.js` 全部 | `config.js` | — | `@probe` | `CONFIG_SCHEMA.md` |
| 分享链接（diff 传输） | stable | `?conf=` | `config-system.js` | — | `@share` | `ARCHITECTURE.md` |
| 形状 + 值校验（严格 schema） | stable | 以 `DEFAULT_CONFIG` 为形状基准；未知字段/类型不符/危险键一律拒绝；`EXTRA_SHAPES` 补声明显式支持的字段 | `config-system.js` | `diagnostics.js`（先加载） | **`config-suite.js` 99 断言** | `docs/architecture/CONFIG_CONTRACT.md` |
| 原型污染防护 | stable | — | `validate()` + `mergeSafe()` + `define()` 三层 | — | `config-suite.js` §3（6 探针） | `CONFIG_CONTRACT.md` §4.1 |
| 运行时诊断通道 | stable | — | `diagnostics.js` → `window.LPDiagnostics` | — | `config-suite.js` §8 | `CONFIG_CONTRACT.md` §10 |
| 状态机 + 章节旅程 | stable | `experience.chapters` | `state.js` | — | 全流程 steps | `ARCHITECTURE.md` |
| View Transitions 转场 | stable | — | `state.js` `withViewTransition()` | 浏览器原生（Baseline 2025.10），不支持则直接切换 | 全流程 steps | `ARCHITECTURE.md` |
| 面板溶解（构图随主题/章节变化） | stable | 主题的 `container.dissolveSteps` | `state.js` `syncDissolve()` | — | `@theme` 的 `dissolve` 字段 | ADR-003 |
| **主题令牌层** | stable | `metadata.template` / `?theme=` | `theme.js` + `themes/*` | — | `steps-theme-check.txt` | ADR-003、`THEME_REGISTRY.md` |
| 章节声明化（章名/启用/顺序） | stable | `experience.chapters[].{id,label,title,enabled,progress}` | `state.js` + `script.js` | — | 全流程 steps | ADR-002 |
| 空章节 / 停用章节自动跳过 | stable | 内容为空数组 或 `enabled: false` | `script.js` `showNextQuestion()` | — | 全流程 steps | `ARCHITECTURE.md` |
| 运行时错误探针（QA 用） | stable | — | `index.html` 内联 | — | `@probe` 读 `window.__lpErrors` | `AGENT_DEVELOPMENT_CONTRACT.md` §3 |

## 2. 八个章节

| 章节 | 状态 | 配置 API | 运行时模块 | 视觉语言 | QA | 文档 |
|---|---|---|---|---|---|---|
| 序 · 首页 | stable | `home.*`、`person.*`、`valentineName` | `script.js` | 舞台卡 + 大标题 | steps | — |
| 壹 · 默契 | stable | `quiz.*` | `script.js` `buildQuizOptions/answerQuiz` | 对话选项 | steps | — |
| 贰 · 心动 | stable | `meter.*`、`loveMessages.*`、`meter.thresholds.*` | `js/chapters/gauge.js`（`window.LPGauge`）+ `script.js` 薄封装 | 模拟仪器（SVG 刻度盘 + 阻尼指针 + 量程限位 + 爆表峰值） | steps + `@check` + `module-suite.js` | `ARCHITECTURE.md` |
| 叁 · 想问你 | stable | `randomQuestions[]`、`questionAgainBtn/questionNextBtn` | `script.js` `showRandomQuestion` | 编辑设计引文（folio + 细线） | steps | — |
| 肆 · 小事 | stable | `smallThings[]`、`smallThingsTitle` | `script.js` `showSmallThing` | 便签纸（横格周期 == `line-height`） | steps | — |
| 伍 · 私人档案 | stable | `photos[]`、`photoTexts.*` | `script.js` `renderPhoto/buildContactSheet/buildPhotoLightbox` | 美术馆展签 + 联系印样索引 | steps + `@diag` + `@cfgsec` | `MEDIA_GUIDE.md` |
| 陆 · 来信 | stable | `story.letters[]`、`sound.voice*` | `script.js` `renderLetter/toggleVoice` | 私人信笺 + 语音播放器 | steps | — |
| 柒 · 惊喜 | stable | `surprises[]`、`surpriseBtn*` | `script.js` `nextSurprise` | 信封三层（袋/盖/纸）`rotateX(118deg)` | steps + `@env` | `ARCHITECTURE.md` |
| 终 · 落幕 | stable | `ending.*` | `script.js` `celebrate/createHeartExplosion` | 电影结尾（面板溶解 + 花瓣迸发） | steps | — |

## 3. 媒体与内容

| 功能 | 状态 | 配置 API | 依赖 | QA | 文档 |
|---|---|---|---|---|---|
| 照片展示 + 展签 | stable | `photos[].{src,thumb,caption,description,date,place,title}` | — | steps | `MEDIA_GUIDE.md` |
| 照片灯箱（全屏 / 滑动 / 键盘） | stable | 同上 | **GLightbox（MIT，本地 vendor）** | steps | `THIRD_PARTY.md` |
| 照片联系印样（横向索引） | stable | 同上（≥2 张才显示） | 原生 `scroll-snap` | steps | — |
| 视频（内联播放） | stable | `photos[].src` 为视频扩展名即自动识别 | 原生 `<video>` | — | `MEDIA_GUIDE.md` |
| 照片 `width/height`（尺寸预留，防 CLS） | **stable** | `photos[].width/height` | `photoMediaHtml()` 写原生属性 | `steps-config-security`（`attrW` 与 `naturalW` 一致） | ADR-004、`CONTRACT §6.4` |
| 照片 `focalPoint`（裁切焦点） | **stable** | `photos[].focalPoint.{x,y}`（0~1 归一化，渲染层夹取） | `photoFocus()` → `--photo-focus` → `object-position` | `steps-config-security` | ADR-004、`CONTRACT §6.4` |
| 照片 `alt`（无障碍替代文本） | **stable** | `photos[].alt`（留空退化到 `title` → 通用描述） | `photoMediaHtml()` | `steps-config-security` | `CONTRACT §6.4` |
| 图片尺寸探针 | **stable** | — | `tools/media/image-dims.js`（零依赖解析 JPEG/PNG/WebP 头） | 用于填上面三个字段 | `AGENTS.md` §5 |
| 照片 `srcset` / AVIF | backlog | 需离线预处理脚本 | `tools/media/`（已有 `image-dims.js`） | — | ADR-004 |
| 信件（多封 / 日期 / 配图） | stable | `story.letters[].{date,title,content,image,audio}` | — | steps | `CONFIG_SCHEMA.md` |
| 语音信件播放器 | stable | `story.letters[].audio`、`sound.voiceEnabled/voiceTexts/fadeMs` | 原生 `<audio>` + `requestAnimationFrame` 渐变 | steps | — |
| 时间轴 / 共同经历 | **planned** | `story.timeline[]`（字段已预留） | — | — | ROADMAP |
| 约定清单 | backlog | `story.promises[]`（字段已预留） | — | — | ROADMAP |

## 4. 声音

| 功能 | 状态 | 配置 API | 依赖 | QA |
|---|---|---|---|---|
| 背景音乐（音量渐入渐出） | stable | `music.enabled/autoplay/musicUrl/volume`、`sound.bgm/fadeMs` | 原生 `<audio>` | steps |
| iOS autoplay 兜底（首次手势解锁） | stable | `music.autoplay` | — | 需真机复核 |
| 章节切换微音效（合成，零素材） | stable | `sound.uiTick/tick.{freqs,gain,decayMs}` | **Web Audio API**（无库） | steps |
| 第一屏音乐开关 | stable | `sound.*` | — | steps |
| 音量持久化 | **backlog** | 计划 `localStorage` | — | — |
| 章节级音频（每章不同 BGM） | backlog | — | — | — |

## 5. 平台能力

| 功能 | 状态 | 配置 API | 依赖 | QA |
|---|---|---|---|---|
| 复制分享链接 | stable | `ending.shareCopiedText` | `navigator.clipboard` | `@share` |
| reduced motion 兜底 | stable | — | `@media (prefers-reduced-motion)` | steps |
| 安全文本插入（`esc()`） | stable | — | `js/core/text.js` `window.LPText.esc` | **`innerhtml-guard.js`**：11 处注入点全部已转义/已声明 | `CONFIG_CONTRACT.md` §13 |
| 无障碍（AA 对比度 / ≥44px 命中区 / 语义） | stable | — | — | axe-core：**0 violations** |
| 响应式 320px 优先 | stable | — | — | `steps-mobile-320.txt` |
| 导出（ZIP / 一键部署） | **planned** | — | 计划 `tools/export/` | ADR-005 §4（当前靠「拷目录即可」） |
| 在线编辑器 | backlog | — | — | ROADMAP V2（无证据，不提前做） |
| `create-lover-page` 生成器 | backlog | — | — | ROADMAP V3（无证据，不提前做） |
| 数据库 / 账号 / 云同步 | **removed from scope** | — | — | ADR-002 §6、ARCHITECTURE_RESEARCH §4 |

## 6. QA 基础设施

| 功能 | 状态 | 位置 | 说明 |
|---|---|---|---|
| 完整八章流程走查（320 / 390） | stable | `tools/qa/steps-mobile-{320,390}.txt` | 截图 + 诊断 |
| 回归套件（信封几何 / 胶囊重叠 / 触摸目标） | stable | `steps-regression.txt` + `@check`/`@env` | 320px 已知碰撞点的持续看护 |
| 视觉审计（全流程逐章截图） | stable | `steps-visual-audit.txt` | 产物到 `.qa-out/` |
| **主题令牌自检** | stable | `steps-theme-check.txt` + `@theme` | §58 硬指标的可复现验证 |
| 初始化探针（逐项定位中断点） | stable | `@probe` | **本次排障的关键工具**：一次定位到 `themeTokens is not defined` |
| 分享往返校验 | stable | `@share` | diff 编解码正确性 |
| 批量 JSON 生成器 | stable | `tools/qa/build-batch.js` | steps 文件 → agent-browser batch JSON |
| **配置契约 / 安全回归（Node）** | stable | `tools/qa/config-suite.js` | **99 断言**，vm 独立 realm：未知字段 / 原型污染 6 探针 / 尺寸类型边界 / 损坏输入 / legacy 兼容 / 诊断 / 照片 schema / `EXTRA_SHAPES` |
| **拆分模块单元测试（Node）** | stable | `tools/qa/module-suite.js` | **63 断言**：`LPText` 注入不变量 + `LPGauge` NaN 安全 |
| **注入点静态守卫** | stable | `tools/qa/innerhtml-guard.js` | 每处 `innerHTML` 必须 `esc()` / 纯字面量 / 声明 `html-safe` |
| **配置安全真实浏览器批次** | stable | `steps-config-security.txt` | 注入面 / 尺寸预留 / 非法配置诊断 / legacy 照片 |
| **契约探针** | stable | `tools/qa/probe-contract.js` | 单独看某个 payload 产生了哪些诊断（核对契约文档时用） |
| 性能基线测量 | stable | `agent-browser vitals` + `docs/qa/PERFORMANCE_BASELINE.md` | LCP / CLS / TTFB / FCP（320 / 390 / 桌面） |

## 7. 本轮（1.4.0）状态变更摘要

| 变更 | 前 | 后 |
|---|---|---|
| 分享配置管线 | 先深合并、再 sanitize | **先校验 diff、再安全深合并** |
| 未知字段 | 照单全收（`sanitize` 只看值类型，不查 key） | 拒绝 + `unknown-field` 诊断 |
| 原型污染 | **真实可复现**（`__proto__` 改写 `Object.prototype`） | 三层防护 + 6 个探针锁死 |
| 类型不符 | 被接受；非法值丢弃后**默认值也丢** | 拒绝该字段，父级保留默认值 |
| `?conf=` 长度 | 无上限 | 24000 硬上限（解码前拦下） |
| 语义校验层 | `planned` | **stable**（契约文档 + 诊断通道） |
| 诊断能力 | 无（写错只表现为「某处没显示」） | `window.LPDiagnostics` 7 区域 + `report()` |
| 照片 `width/height` / `focalPoint` / `alt` | `planned` | **stable**（8 张默认图按实测像素填写） |
| `renderPhoto()` 转义 | 5 处未转义（真实 XSS 面） | 全部 `esc()`，并有静态守卫 |
| `script.js` | 987 行，全在单文件 | **943 行** + `js/core/text.js` + `js/chapters/gauge.js` |
| 性能数值 | 全部「未测量」 | LCP / CLS / TTFB / FCP 实测基线（INP 明确未测得） |
| 章节叙事骨架分析 | 无 | `docs/design/COMPOSITION_SYSTEM.md`（6 构图 + 逐章比对） |
| 单元测试 | `backlog` | **stable**（162 条断言，零依赖） |
