# Changelog

## 1.3.1 — verify（2026-09-15）

**主题验证收口：把「0 violations」从一句结论变成可复现的证据，并修掉 QA 工具链的假失败。**

### test(qa) — canvas 像素回读对比度（新增能力）

- 新增 `tools/qa/contrast.js`（`@contrast`）与 `tools/qa/steps-contrast.txt`。
  做法：把 WebGL canvas `drawImage` 回 2D 上下文后**逐像素求 min/max RGB**，
  得到整屏真正渲染过的深浅极值，再对「自身到 body 都没有不透明背景」的文字节点
  逐一算对比度（并按字号/字重取 4.5 或 3.0 的阈值）。
- 这一步替代了原先把 axe 的 `incomplete: color-contrast` 记成「已手工核对」的**口说无凭**：
  现在有可重跑的命令与数字。三套主题实测结果：

  | 主题 | canvas 实测色域 | 最差节点 | 结果 |
  |---|---|---|---|
  | warm-paper | `rgb(242,213,192)` → `rgb(247,236,225)` | `.share-btn` | **4.69:1** ✓ |
  | night-archive | `rgb(12,10,9)` → `rgb(36,29,24)` | `.chapter-kicker` | **4.94:1** ✓ |
  | modern-paper | `rgb(233,230,224)` → `rgb(250,249,247)` | `.share-btn` | **5.59:1** ✓ |

  全局最低 4.69:1（原按 token 推算为 4.73:1；实测更严，以实测为准）。
  另发现 `--accent` 用作 11px 小字时（`.chapter-kicker`）只有 4.94:1 —— 通过但余量小，
  已写进 `THEME_REGISTRY.md` 的「最容易失守的位置」。

### fix(qa) — 主题巡检的假失败（重要）

`steps-theme-check.txt` 原来靠「连点按钮」走完八章。实测发现**跨主题只差几百毫秒的
固定 `wait` 就会在章节切换瞬间点到 0×0 的元素上**：`getBoundingClientRect()` 返回全零、
`elementFromPoint()` 返回 `<html>`，agent-browser 报「元素被 `<canvas#bg-canvas>` 遮挡」，
于是三套主题里两套的断言**整体假失败**。

差点被当成「canvas 真实遮挡按钮」的真缺陷去改 CSS。用诊断批次量出真实 rect 后才定位。

- 改为**状态驱动巡章**：`window.appState.setState({currentStep:N})` 逐章进入并断言。
  覆盖从「一键点到底」变成 **8 章 × 3 主题全覆盖**，且完全确定。
- 加了 `?theme=does-not-exist` 的兜底断言（必须退回 `warm-paper` 且 `window.__lpErrors` 为空）。
- 结果：**115 条命令 0 失败**，7 次错误采样全为 `no-errors`。
- 真实点击的最小证明保留在 `steps-regression.txt`（320×568 信封全流程）。

### fix(runtime) — `state.js` 注释与实现不符

`currentStep: 1, // 1~7` 与实际的 1~8（序 + 壹-柒，另加惊喜）不符，已订正。

> 本条只改注释、无运行时差异，因此**未递增 `?v=`** —— `v=17` 是 1.3.0 本轮开发期刚设的，
> 从未作为已发布版本对外存在过，不存在「用户缓存了旧 state.js」的情况。
> 下一位 Agent：如果改了**有行为差异**的 CSS/JS，请照常递增 `?v=`。

### docs — 三处同步

- `AGENTS.md` §5：补齐 `agent-browser batch` **不要接管道**（接 `tail`/`head` 会 `SIGTERM`
  且输出为空）、**多章巡检用 `appState.setState` 而非连点按钮**、`!eval` 必须同行的坑；
  并给出绕开 `run.sh` 里 `dirname` 缺失的稳妥命令写法。
- `docs/architecture/CURRENT_STATE.md` §5：量化基线改为本次实测值，新增
  「QA 工具链的两个坑」小节。
- `docs/design/THEME_REGISTRY.md` §2/§2.1/§3/§4：补「`dissolveSteps` 声明 ↔ 实测逐章吻合」、
  未知主题兜底实测、像素回读结果，并更新加主题的验证步骤。

### docs(sync) — 与 1.3.0 对齐

- `docs/CONFIG_SCHEMA.md`：`## theme` 重写为「预设（结构）+ `config.theme`（差异）」两层模型，
  说明 `overrideIfChanged()` 只覆盖与 `warm-paper` 不同的值（避免陈旧默认值把预设拉回去）；
  `## experience` 补齐 `step/id/label/title/enabled/progress` 字段表与「跳章双保险」。
- `docs/ROADMAP.md`：勾掉已完成的容器形态、主题预设、章节命名/关闭三项；
  下一步重排为「字体子集化 → 全息卡片 → 性能基线 → 时间轴 → 第 4-5 套主题」；
  新增「调研结论存档」表，把六个选型问题的答案指向具体文件，避免下轮重复调研。
- `docs/architecture/CURRENT_STATE.md` §6：问题 5 订正为「信封壳/信纸对比度过低
  （颜色已全部令牌化，但暖纸主题下这组值本身区分度不够）」，问题 6 行数更新为 987。

## 1.3.0 — theme（2026-09-15）

**主题：把「主题」从一个名字变成真正存在的层；顺带修掉它暴露的跨主题缺陷；并建立 Agent 长期接管的工程底座。**

### feat(theme) — Theme Token Layer（本轮核心）

在此之前 `config.theme.colors.*` **从来没有驱动过 `styles.css` 真正的令牌**
（`--paper` / `--ink` / `--accent` / `--panel`）—— 改主题实际上只改了 mesh 背景色，
白卡与深墨纹丝不动，**深色主题在结构上不可能成立**。

现在：

- `themes/<name>.js` = 一个主题的**完整视觉语言**：`surface` / `ink` / `accent` / `lines` / `fx` /
  `container` / `type` / `motion` / `paper` / `mesh` / `petal` / `hero`。
  自包含、可独立阅读、可复制改造。
- `themes/index.js` = 注册表与解析（`?theme=` > `config.metadata.template` > 兜底）。
  名字打错会退回 `warm-paper` 并列出可用主题，**绝不出现无样式状态**。
- `theme.js` 重写为**令牌应用层**，暴露 `window.LPTheme.current()` 作为唯一查询入口，
  renderer 不再各自解析 `config.theme`。
- **`container` 令牌让换主题改变的是构图，不只是配色**：
  `--panel-bg / --panel-border / --panel-radius / --panel-shadow / --panel-pad`。
- **三套主题**：`warm-paper`（暖纸 · 博物馆编辑设计，默认）/ `night-archive`（暗夜档案 · 暗画廊）/
  `modern-paper`（现代纸本 · 极简编辑设计，**无面板卡 + 无衬线正文**）。
  三者在底色、墨色、强调色、面板形态、圆角、投影、正文字族、字距、动效基准、花瓣数、
  第一屏主视觉 **10 项指标上两两不同**（浏览器实测，见 `docs/design/THEME_REGISTRY.md`）。

### feat(container) — 面板溶解（章节构图多样化）

ROADMAP 里排第一的「容器形态同构」问题已解决：`.container` 形态由主题令牌决定，
且主题可声明哪些章节「溶掉面板」（内容直接落在背景上）。
`warm-paper` 溶 8 + 落幕；`night-archive` 溶 6/7/8 + 落幕；`modern-paper` 本来就没有面板。
原本只有落幕章硬编码的溶解，现在是主题的一个字段（`container.dissolveSteps`）。

### feat(config) — 章节声明化

`experience.chapters` 由「只影响旅程标签」升级为**章节的权威声明**：
`{ step, id, label, title, enabled, progress }`。

- `title` 成为本章 kicker 章名的**唯一来源**（此前硬编码在 `index.html`）
- `enabled: false` 可让某章从流程消失，无需改 renderer
- 加章节 / 改顺序 / 改名 / 停用章节**都不需要动状态机**

同时修掉一处视觉冗余：**旅程编号与章节 kicker 曾经印同一个字**（「壹」出现两次）。
现在分工明确 —— 旅程线负责编号与进度，kicker 只负责章名。

### fix(theme) — 这一层暴露的跨主题缺陷

- **兼容层把主题反向拽回默认值**：遗留键映射写成「只要 `config.colors.textColor` 存在就覆盖
  `--ink`」，而出厂 `config.js` 里就写着 `#4a3a33` → **三套主题的 `--ink` 全部变成 `#4a3a33`、
  `--accent` 全部变成 `#a8544f`**，`night-archive` 的浅墨字在深底上几乎不可读。
  改为「只有与 warm-paper 出厂值不同才算有意覆盖」（`overrideIfChanged()`）。
  **教训：模板系统的默认值不能有否决权。**
- **第一屏进入按钮硬编码色值**（`rgba(255,253,250,.16)` + `rgba(74,58,51,.36)`），
  在 `night-archive` 下渲染成一块与深色环境格格不入的灰白矩形。已令牌化并截图验证修复。
- **`--ink-faint` 在画布上不过 AA**：该档原本按「对 `--paper` 4.9:1」标定，但面板透明/
  溶解后文字落在 mesh gradient canvas 上，而 canvas 最深色比 `--paper` 暗得多 ——
  实测 `warm-paper` 只有 **3.74:1**。新增第四档 `--ink-canvas`（按**所在表面**标定，
  而非按"有多淡"），并因同一原因把 `modern-paper` 的 `faint` 从 `#7b7772` 改为 `#67635e`
  （初版实测 **4.45:1**，差 0.05 就不过 AA）。
- **业务 CSS 里 9 处硬编码色值**收编进令牌：`--sheet-bg` / `--flap-bg` / `--tape` /
  `--wash` / `--wash-2` / `--wash-hi` / `--seal` / `--accent-line` / `--ink-line`。
  现在唯一允许出现色值的地方是 `:root` 兜底与 SVG data-URI 噪点。

### fix(runtime) — 初始化中断（P0，由新增的错误探针定位）

`script.js` 的 `themeTokens()` 在重写过程中丢失定义，导致 `DOMContentLoaded` 初始化
**在第一步就抛 `ReferenceError` 中断**。后果非常隐蔽：页面能打开、能点击，
但首页标题、选项、照片、信件全部是空的 —— 而控制台报错在批量 QA 里看不到。

- 修复 `themeTokens()` 定义位置。
- **`index.html` 新增运行时错误探针**（`window.__lpErrors`，不参与渲染、无副作用），
  `tools/qa/probe.js` 会读取它 —— 没有这个，这类缺陷只能靠肉眼对比截图发现。

### chore(qa) — 新增 QA 能力

- `steps-theme-check.txt` + `@theme`：**主题令牌自检**，把 §58「同一 Runtime + 不同 Theme =
  不同体验」变成可复现的断言（10 项指标 + 溶解状态 + 触摸目标 + 横向溢出）。
- `steps-visual-audit.txt`：全流程逐章截图，产物写入 `.qa-out/`，用于「改动前后用图片对比
  而不是靠记忆」。
- `@probe`：初始化探针，逐项列出各章节是否被填充 —— 本次排障的关键工具。
- `tools/qa/*.js` 诊断脚本只能使用**块注释**（`build-batch.js` 会把文件压成一行注入），
  已写进 `AGENTS.md` 的踩坑清单。

### docs — Agent 接管底座

新增：

- `AGENTS.md`（根目录）— Agent 开发协议：架构速览 / 13 条铁律 / 标准工作循环 /
  命令速查 / 开源与许可证规则 / 模块契约 / 需要停下来问用户的三种情况
- `docs/development/AGENT_DEVELOPMENT_CONTRACT.md` — 完整契约（10 项义务 / 禁止清单 /
  QA 门槛 / 文档义务矩阵 / 交接检查清单）
- `docs/architecture/CURRENT_STATE.md` — 当前状态事实快照（含诚实记录的 8 项已知问题）
- `docs/architecture/decisions/ADR-001..005` — runtime / config / theme / media / template
- `docs/research/` — `OPEN_SOURCE_REFERENCE_INDEX` / `LICENSE_RESEARCH` / `UX_RESEARCH` /
  `ARCHITECTURE_RESEARCH` / `VISUAL_REFERENCE_INDEX`
- `docs/product/FEATURE_REGISTRY.md`、`docs/design/THEME_REGISTRY.md`

### refactor — 技术栈决策：**保留零构建 Vanilla**

比较了 A 当前 / B Vite / C React+Vite / D Astro 四个方案（10 项指标），
结论是**保留方案 A**，理由与三个明确的「迁移触发条件」记入
`docs/research/ARCHITECTURE_RESEARCH.md`。本轮一个 Agent 在同一会话内完成主题层重构 +
章节声明化 + 无障碍修复，**零构建等待、零依赖安装** —— 架构尚未成为瓶颈。

**本轮没有新增任何运行时依赖。** 主题层、面板溶解、章节声明化全部由
CSS 自定义属性 + 原生 DOM 完成。

## 1.2.0 — experience（2026-09-15）

**主题：解决「八章长得一模一样」，并把这一轮改造中暴露的真实缺陷修掉。**

### feat(experience) — 章节视觉语言分化

之前每一章都是「kicker + h2 + 一段文字 + 一排同款实心按钮」，八章同构。现在每章拥有独立的视觉语言，且全部只用现有设计令牌 + 纯 CSS/SVG，**没有引入任何新依赖**：

- **贰 · 心动 → 模拟仪器**：180° SVG 刻度盘、0/25/50/75/100 主刻度 + 5 分小刻度、带阻尼的指针、量程限位挡针、超量程后继续前压的指针、以及只记录「爆表之后」峰值的 drag pointer。数据层仍是原生 `<input type="range">`（键盘 / 触摸 / 读屏全部保留），仪表只是它的可视化。指针轴用 SVG 用户坐标（`transform-box: view-box`）。
- **叁 · 想问你 → 编辑设计引文**：大字号问题 + 上下细线 + `No. 05` folio（`oldstyle-nums`）+ `text-wrap: pretty`；「再来一个」降级为文字型动作。
- **肆 · 小事 → 便签纸**：横格周期与 `line-height` 严格相等的笔记纸、左侧装订线、顶部胶带、0.5° 轻旋转。
- **伍 · 私人档案 → 联系印样**：照片下方新增横向缩略图索引（`scroll-snap` + 隐藏滚动条但保留滑动），当前项以强调色描边标记。
- **柒 · 惊喜 → 信封开合**：信封袋 / 翻盖 / 信纸三层结构，翻盖 `rotateX(118deg)` 后仰露出背面，信纸从袋口升起。
- **动作层级**：建立 solid（唯一主行动） / ghost（重抽、回看） / text（最轻的软动作）三级，替代「一排同款红按钮」；窄屏成对动作并排，压缩纵向堆叠。

### fix(renderer) — 这一轮真实暴露的缺陷

- **信件章必然崩溃（P0）**：`renderLetter()` 在模板字符串里引用 `const vt`，而 `vt` 在 20 行之后才声明 —— TDZ `ReferenceError`。此前因为示例信件的 `audio` 是空串走短路而没暴露，**只要给信件配上语音，整章就会崩**。已把文案提取前置。
- **语音错误分支引用作用域外的 `vt`**（`toggleVoice` 的 `onerror`），播放失败时会二次抛错并让按钮卡住。
- **语音按钮文案硬编码**：`sound.voiceTexts` 只被部分读取，「播放语音/暂停」在别处写死，配置实际不生效。现统一为唯一来源。
- **`celebrate()` 连调两次 `createHeartExplosion()`**：落幕花瓣密度翻倍。
- **空数据死路（§31）**：`randomQuestions` / `smallThings` / `surprises` 为空数组时会渲染出字面量 `undefined`；`quiz.options` 为空时页面卡死无法前进。现在统一为一张「章节内容计数表」，内容为空的章节自动跳过，全部为空则直接进落幕。
- **重玩未复位**：`letterIndex` 不归零（重玩从上封信继续）、语音不停、信封不复位。
- **用户内容未转义**：`renderLetter` / `renderPhoto` 直接 innerHTML 拼接，配置里出现 `<` `&` 会破坏版式。已加 `esc()`。

### fix(share) — 分享链接实际是坏的

`config-system.js` 的校验仍停留在**已废弃的旧 schema**（`config.questions.*` / `config.celebration`），且强制 `musicUrl` 必须以 `https://` 开头。后果：分享链接会把 `photos / story / theme / sound / experience / person` 全部丢掉，并丢掉本地 BGM。

- 改为 **schema 驱动**：以 `DEFAULT_CONFIG` 为形状基准递归校验，新增字段无需改这个文件。
- 改为 **diff 传输**：只编码「与默认值不同的部分」。实测把 8 个类别全部改动后 diff 从 129B / 2 键 提升到 621B / 8 键，链接长度 954 字符。
- **`config.js` 的深浅拷贝 bug**：`VALENTINE_CONFIG = { ...CONFIG }` 是浅拷贝，与 `DEFAULT_CONFIG` 共享全部嵌套对象，任何运行时改动都会污染 diff 基准 —— 这正是上面「只剩 2 个键」的直接原因。改为深拷贝。
- 新增 `ValentineConfig.debugSharePayload()` 与 `resolveFromEncoded()` 供测试与调试。

### fix(a11y) — 实测出来的，不是猜的

- **`--ink-faint` / `--ink-soft` 本身不达 WCAG AA**：axe-core 实测 `.plate-seq`（「1 / 8」展签序号）对比度仅 2.1:1。三档墨色改为实色：`#4a3a33` 10.3:1 / `#6b5a52` 6.3:1 / `#7a6a62` 4.9:1（对 `--paper`）。顺带解决 alpha 文本叠在 mesh gradient 上导致 axe 只能标「待复核」的问题。
- **触摸目标 < 44px**：音乐胶囊与分享按钮实测 34px 高，滑块命中区 22px 高，开场「进入」按钮 40px 高。均已修到 ≥44px（视觉不变，只放大命中区）。
- **`.intro-sub` 叠加 `opacity: .85`** 把对比度压到约 4.1:1，已移除。
- **音乐胶囊压住章节进度线**：窄屏改为给 `.container` 预留 60px 顶内边距（注意 `≤360px` 的 `padding` 简写会覆盖 `≤480px` 的值，必须重声明）。
- 复测结果：首页 / 档案 / 心动三章 **axe-core 0 violations**（剩余条目是 canvas 背景导致的「需人工复核」，已逐项数值核对达标）。

### fix(layout)

- 信封闭合态信纸底部会露出信封 12px 白边（`translateY` 位移过大）。闭合位移由 58% 收到 42%，实测 `sheetBottomInsideShell=true`。
- 信封展开时按钮从 1 个变 2 个导致 20px 版面跳动。改为窄屏成对布局，闭合/展开始终同一行高，实测 `#envelope` 在两种状态下位置完全一致。
- 照片章在 320px 令音乐胶囊与进度线重叠（`≤360px` 覆盖所致），已修。

### docs & tools

- 新增 `tools/qa/`：可复现的真实浏览器 QA（`build-batch.js` 把人类可读的 steps 翻译成 agent-browser 的 batch JSON；`diag/check/env/share` 是注入页面的诊断脚本；`run.sh` 一键跑）。320 / 390 / 回归三套步骤已入库。
- THIRD_PARTY / ARCHITECTURE / CONFIG_SCHEMA / ROADMAP 同步。

---

## 1.1.0 — productize（2026-09-15）

- 设计令牌系统：`:root` 全量令牌（paper/ink/accent/space/motion/font/fx），hallmark gate 48 通过
- 章节旅程：进度细线 + 壹-柒 kicker，`experience.chapters` 可覆盖
- 八章情绪化重构：美术馆展签照片、便签任务、拆信惊喜、电影结尾庆祝（卡片溶解）
- View Transitions（同文档）步骤转场，`sectionIn` 兜底
- 信件/回忆章节（陆·来信）：`story.letters`，空数组自动跳过，语音播放器
- 声音系统：BGM 音量渐变、Web Audio 章节微音效、`sound` 配置化
- config schema：metadata / media / theme / story / experience 分层，旧格式全兼容
- 人物照片移出流程（保留于 assets 供全息卡片）

## 1.0.0 — qa-passed（2026-09-15）

- 第一屏：A 暖奶油背景 + Redouté《Les Roses》玫瑰（白底烘焙 alpha）
- site 级 mesh gradient，全流程同一世界
- 全局视觉系统（去 emoji / 去 three.js / 去网络字体）
- 照片灯箱（GLightbox）、加载态、错误态
- grill-me 终审修复（键盘可访问、照片预取、caption 可读性）

## 1.0.0-baseline

- 母版 valentine2026（MIT）+ 粒子玫瑰第一屏（已被替换，历史保留）
