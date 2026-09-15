# Changelog

## 1.4.0 — harden（2026-09-15）

**把「配置系统看起来是安全的」变成「配置系统被证明是安全的」，并顺手拆掉 `script.js` 的第一层边界。**

这轮的起点是一份不信任上一轮结论的独立审查：先复核 git 状态与全部架构文档，
再把 `config-system.js` 的每一条声明都写成可执行断言去证伪。结果是**它说的和它做的不一样** ——
`?conf=` 是唯一从外部不可信输入进入运行时的入口，而它当时有 6 个真实缺陷（不是理论风险）。

### fix(config) — P0：实测撞到的 6 个真实缺陷

全部由 `tools/qa/config-suite.js` 复现并锁死，修复后 99 条断言通过。

| # | 缺陷 | 实际后果 | 修法 |
|---|---|---|---|
| 1 | **原型污染** | `?conf=eyJfX3Byb3RvX18i...`（`{"__proto__":{...}}`）真的写进了 `Object.prototype`。`JSON.parse` 会把 `__proto__` 建成**自有属性**，所以它确实能走到合并逻辑里 | 危险键黑名单 + `define()`（`Object.defineProperty`）赋值 + 合并层二次跳过，三层防护 |
| 2 | **未知字段不被拒绝** | `theme.unknownField` / `person.evilField` / 数组项里的未知子字段全部**照单全收**。旧 `sanitize()` 只看值的类型，从不检查 key 是否在 schema 里 —— 于是「拒绝未知字段」这条结论从未成立 | `hasOwn(base,k)` 白名单，未知 key 记录 `unknown-field` 后丢弃 |
| 3 | **类型不匹配不被拒绝** | `quiz.answer: "two"` 会被接受；更糟的是**非法值被丢弃后默认值也一起丢了** —— `answer` 整个消失，而不是回退到默认的 `2` | 按默认值类型做叶子类型检查；非法 → 丢弃该项 → **父级保留默认值** |
| 4 | **空串被静默丢弃** | `photos[0].caption: ""` 无法清空一个字段，总是回退默认文案 | 字符串分支区分「空串（合法值）」与「类型不符」 |
| 5 | **深合并无深度守卫** | 深层嵌套有栈溢出风险 | `LIMITS.depth = 8`，`mergeSafe()` 递归前先判 |
| 6 | **`?conf=` 无长度上限** | 一个几 MB 的参数会被完整 `atob` + `JSON.parse` —— 把「打开链接」变成拒绝服务 | 解码**前**检查 `LIMITS.encoded = 24000` |

### fix(config) — 顺序错了：改为「先校验 diff，再合并」

原管线是「先深合并、再 sanitize 合并结果」。这个顺序同时造成缺陷 #2 和 #3 ——
非法值先进入配置，sanitize 只能做事后补救，而它没有 schema 信息。

新管线：

```
默认值 + diff → validate(diff, DEFAULTS) → mergeSafe(clone(DEFAULTS), clean) → 运行时配置
                     ↑ 先校验                 ↑ 再合并
```

副作用修正：diff 为空时分享链接**不再带 `conf=e30=`**（base64 的 `{}`）。
旧行为无害，但让链接看起来像带参数，收件人还要白跑一遍解码 + 校验。

### feat(config) — 真 schema 校验层 + 契约文档

- 新增 **`docs/architecture/CONFIG_CONTRACT.md`**：8 个 Schema（Metadata / Media / Theme /
  Content / Experience / Story / Sound / Person）的逐字段表，含类型、默认值、**实测 grep 出来的
  读取方**、兼容矩阵、拒绝语义表、诊断 code 表，以及「改一个字段要动哪六处」的强制清单。
- `config-system.js` 成为契约的**唯一执行者**，文件头写明管线顺序与「为什么这样排序」。
- 发现并修掉「加固引入的回归」：默认值是**范例**，所以渲染层在读、默认值却没写的字段
  会被新校验误伤。实测撞到 **4 个**，用 `EXTRA_SHAPES` 显式声明补回：

  | 字段 | 谁在读 |
  |---|---|
  | `home.enTitle` | `script.js:104` 首页英文手写标题 |
  | `meter.thresholds.{normal,high,extreme}` | `script.js:329` 默契值分档文案 |
  | `ending.shareCopiedText` | `script.js:934` 复制成功后的按钮文案 |
  | 顶层 legacy `letters[]` | `script.js:224/622/675` 的回退路径 |

  同一张表还给 `story.timeline/promises/memories`（默认是空数组，无法展示项形状）
  和 `photos[]` 的 `title/description/date/place/location/thumb` 补了形状声明 ——
  否则用户无法通过分享链接设置这些渲染层**确实支持**的字段。

  关键约束：`EXTRA_SHAPES` 只**补充**字段，绝不把整个对象变成开放槽位。
  套件用负向断言锁住了这一点（`home.evilField` 依然被拒绝）。

### feat(diag) — `window.LPDiagnostics` 运行时诊断通道

配置写错时的旧表现是「某个地方就是没显示」，作者与 Agent 只能靠猜。

- 7 个固定区域：`config / theme / chapters / media / runtime / performance / a11y`；
  每区域上限 200 条（防畸形输入刷爆内存），前 40 条进 console（防刷屏淹掉真错误）。
- 永远不抛异常 —— 诊断自己坏掉不能连累运行时。
- `report()` 输出 `Runtime / Theme / Config / Chapters / Media / A11y / Overflow / JS Errors`；
  需要真实布局的项**如实标 `n/a`** 而不是编一个数字。
- 加载顺序成为契约的一部分：`config.js` → `diagnostics.js` → `config-system.js`。

### fix(media) — 照片 schema：尺寸预留 + 注入面

- `photos[]` 新增 `width` / `height` / `alt` / `focalPoint:{x,y}`，8 张默认图全部按
  **实测原始像素**填写（`node tools/media/image-dims.js` 读出，新增零依赖探针）。
  实测这 8 张图的比例并不统一（1.50 / 1.68 / 1.78）—— 这就是过去切图会顶一下下方内容的直接原因。
- 渲染层：`<img>` 带 `width`/`height` 属性 + `loading="lazy"` + `decoding="async"`；
  `focalPoint` 写进 `object-position`（渲染层做 0~100 夹取），CSS 走 `--photo-focus` 令牌。
- **修掉一处真实的 XSS 面**：`renderPhoto()` 是唯一没有走 `esc()` 的 renderer ——
  5 处配置值直接拼进 `innerHTML`（`src` / `alt` / `date` / `place` / 图注 / 错误文案）。
  实测 payload `"><img src=x onerror=…>` 现在被转义（`injectedImg: 0`）。

### feat(qa) — `innerhtml-guard.js`：把「靠记得」变成「有机制」

修掉 `renderPhoto()` 之后做了一次**完整审计**：全部源码里共 **11 处** HTML 注入点
（`innerHTML` / `insertAdjacentHTML`），逐个核对，结论是 0 处未转义 ——
其中 4 处是 `innerHTML = ''` 清空、1 处（`gauge.js`）只拼数字、其余 6 处全部走 `esc()`。

但审计是一次性的。新增 `tools/qa/innerhtml-guard.js`（零依赖、约 130 行）把结论固化成守卫：
每一处 `innerHTML =` 必须满足三者之一 ——

1. 表达式里出现 `esc(`
2. 表达式是**纯字面量**（含空串，无 `${}` / 无 `+` 拼接）
3. 同一行或上一行有 **`// html-safe: <理由>`** 注释

第 3 条是关键：它不是白名单，而是**要求作者陈述理由**。当前有 2 处使用它 ——
`script.js:484`（`photoMediaHtml()` / `plateHtml` 内部已 esc）与
`js/chapters/gauge.js:85`（`html` 只由 `fmt()` 和刻度数字拼成）。下一个人读到的是
一句说明，而不是一片沉默。

守卫同时充当**审计报告**：跑一次就知道总共有多少处注入点、分别靠什么保证安全。

### refactor(script) — 渐进拆分第一层（不重写）

按 ADR-001 的路径拆出两个**纯函数 / 纯计算**模块，`script.js` 里留同名薄封装，
所有既有 `window.*` 与全局函数签名不变：

- `js/core/text.js` → `window.LPText` = `esc` / `textPool` / `pickRandom`
- `js/chapters/gauge.js` → `window.LPGauge` = 刻度盘几何与计算

拆分暴露了一个真实缺陷：`fillPercent(NaN)` 返回 `NaN`，于是 `strokeDasharray="NaN 100"` ——
弧线会**静默画不出来**。已加 `Number.isFinite` 守卫。

### test(qa) — 从「跑一遍看看」变成「跑一遍断言」

| 套件 | 断言 | 覆盖 |
|---|---|---|
| `tools/qa/config-suite.js` | **99** | 合法覆盖 / 未知字段 / 原型污染（6 探针）/ 尺寸类型边界 / 损坏输入 / 本地 BGM / legacy 兼容 / 诊断输出 / 照片 schema / `EXTRA_SHAPES` / examples 一致性 |
| `tools/qa/module-suite.js` | **63** | `LPText`（含注入不变量）/ `LPGauge`（含 NaN 安全） |
| `tools/qa/steps-config-security.txt` | — | 真实浏览器：注入面、尺寸预留、非法配置诊断、legacy 照片兼容 |

两套 Node 套件用 `vm` 造**独立 realm**，每个用例一份独立 `Object.prototype` ——
原型污染既不会串到下一个用例，也能被独立检出。零依赖、零构建、不需要浏览器。

第 11 组是**示例与契约的一致性守卫**：把 `examples/*.js` 里的 `DEFAULT_CONFIG` 当作一个
`?conf=` 载荷，喂给与首屏完全相同的解析路径，断言它不产生任何诊断。理由是示例会被使用者
照抄 —— 示例里有契约外的字段（或拼错的字段名），抄的人就会踩到一个自己看不懂的静默拒绝。

同时修掉 `tools/qa/theme.js` 的一处**假失败**：`touchUnder44` 会撞上开场动画里
缩放中的按钮（量到 43.x px）。现改为跳过正在动画的元素并输出
`measured=N animating=N`，让「哪些没量」变成可见信息而不是隐藏的通过。

### fix(examples) — 示例页因为我这轮拆分而坏掉（自查发现）

`examples/preview.html` 只加载了 `script.js`，没有加载本轮新拆出的
`js/core/text.js`（`window.LPText`）和 `js/chapters/gauge.js`（`window.LPGauge`），
也没有加载 `diagnostics.js`。`script.js` 顶部的兼容层是 `const esc = window.LPText.esc;` ——
模块缺失会直接抛 `TypeError`，**整个示例页白屏**。

拆分时只改了 `index.html` 的加载列表，忘了示例页也在加载同一批文件。
已补齐三个脚本并按主站对齐 `?v=18`。

顺手修掉两处与项目自身规则不一致的地方：

- `examples/*.js` 里 `window.VALENTINE_CONFIG = { ...window.DEFAULT_CONFIG }` 是**浅拷贝** ——
  正是 `config.js` 注释里明确警告过的写法（浅拷贝会让运行时改动污染 diff 基准）。已改为深拷贝。
- 示例的照片条目补上 `width/height/alt/focalPoint`，让示例真正演示本轮的媒体 schema
  （`example-romantic` 还给星空图加了 `focalPoint: {x: 0.5, y: 0.35}` 作为裁切焦点的用法示例）。

### docs

- 新增 `docs/architecture/CONFIG_CONTRACT.md`、`docs/design/COMPOSITION_SYSTEM.md`、
  `docs/research/MEDIA_SCHEMA_RESEARCH.md`、`docs/qa/PERFORMANCE_BASELINE.md`
- `docs/CONFIG_SCHEMA.md` 指向契约文档并说明「形状 = 默认值的形状」这条规则
- `docs/architecture/CURRENT_STATE.md`、`docs/ROADMAP.md`、`AGENTS.md` 同步本轮的
  新工具、新套件与新已知问题

### 版本号

`index.html` 全部 `?v=17` → **`?v=18`**（这一轮改了有行为差异的 CSS 与 JS）。

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
