# AGENTS.md — Lover-page Agent 开发协议

> **任何 AI Agent（Claude / GPT / DeepSeek / Gemini / Cursor / Codex / WorkBuddy / ZCode…）
> 在改动本仓库前，必须先读这份文件。**
> 它不是介绍，是**操作契约**。完整版见
> [docs/development/AGENT_DEVELOPMENT_CONTRACT.md](docs/development/AGENT_DEVELOPMENT_CONTRACT.md)。

---

## 1. 这个项目是什么

**Personal Emotional Art Experience（私人情感艺术体验系统）**，当前仓库是它的第一个
Reference Implementation：一个为特定的人打开时具有强烈情绪反馈的私人互动网页。

它同时要满足三层：

| 层 | 要求 |
|---|---|
| 艺术展示 | 第一眼要像一件作品，不像网页 Demo，不像 AI 生成的模板 |
| 情绪体验 | 八章各有自己的视觉语言，章与章之间形成情绪节奏 |
| 模板产品 | 同一份 Runtime + 换 config/theme/素材 = 另一个体验，不改核心代码 |

**长期方向**：`Config + Assets + Theme → Static Experience → Export`。
**不是**情侣网页，**不是**表白模板，**不是**功能越多越好的产品。

---

## 2. 架构速览（60 秒）

零构建、零框架、纯静态。`git clone` 后用任意静态服务器打开即运行，**没有 `npm install`**。

```
index.html
  ├── themes/*.js        主题 preset（完整视觉语言，脚本最先加载）
  ├── themes/index.js    主题注册表与解析（含 ?theme= 临时预览）
  ├── config.js          唯一内容入口 → window.DEFAULT_CONFIG（diff 基准，不可污染）
  │                                     window.VALENTINE_CONFIG（运行时配置，必须是深拷贝）
  ├── diagnostics.js     window.LPDiagnostics 运行时诊断通道（必须在 config-system 之前加载）
  ├── config-system.js   ?conf= 分享链接：校验 diff → 安全深合并（先校验，再合并）
  ├── state.js           window.appState 状态机 + 章节旅程 + 面板溶解标记
  ├── theme.js           令牌应用层：preset + config 覆盖 → CSS 自定义属性
  ├── js/core/text.js    （拆分）window.LPText = esc / textPool / pickRandom
  ├── js/chapters/gauge.js （拆分）window.LPGauge = 刻度盘几何与计算
  ├── script.js          各章节 renderer + 游戏逻辑 + 声音 + 分享
  └── js/intro.js        （ESM）第一屏 + site 级 mesh gradient 背景
```

**脚本加载顺序是契约的一部分**（`config` → `diagnostics` → `config-system` …），
改动顺序前先看 `docs/architecture/CONFIG_CONTRACT.md` §10。

**唯一内容入口是 `config.js`。** 想让内容可配置而去找别的地方，方向就错了。

**字段级的权威说明在 `docs/architecture/CONFIG_CONTRACT.md`** —— 8 个 Schema 的逐字段表、
每个字段的**实际读取方**、拒绝语义、诊断 code。想知道「有没有这个字段」「谁在读它」，查契约，不要靠猜。

**唯一视觉入口是 `themes/*.js` + `styles.css` 的 `:root` 令牌。**
业务 CSS 里出现明确色值 = 缺陷。

---

## 3. 铁律（违反即视为改错）

1. **不引入构建器 / 框架 / CMS / 数据库。** 除非调研证明当前架构已成瓶颈，
   且先写 `docs/architecture/decisions/` 的 ADR + 迁移计划，再分阶段迁移。
   **禁止一次性 rewrite。**
2. **不删现有功能**，不重写状态机或 config 系统。
3. **每章必须有自己的视觉语言。** 禁止新章节做成「kicker + 标题 + 一排同款实心按钮」。
4. **不为「更高级」加粒子 / 霓虹 / 烟花 / WebGL 特效 / 光标把戏。**
5. **所有颜色 / 字体 / 字号 / 间距 / 时长走 `:root` 令牌**，禁止在业务 CSS 里写明确色值。
6. **三档墨色 + canvas 墨色必须过 WCAG AA（≥4.5:1），且必须是实色**（alpha 叠在
   mesh gradient 上对比度不可预测）。
7. **交互元素命中区 ≥44px**（视觉可以更小，用 `min-height` 放大命中区）。
8. **每个动效必须有 `prefers-reduced-motion: reduce` 兜底。**
9. **改 CSS/JS 后必须递增 `index.html` 里的 `?v=N`**（子资源缓存）。
10. **禁止 `force push` / 改写历史 / 删除 `v1-template-foundation` tag。**
11. **引用外部代码前必须核实许可证。** GPL / AGPL / LGPL / 商业限制许可证
    ——**只能借鉴思路，不可复制代码**（见 §6）。
12. **`script.js` 单文件不得继续膨胀成 3000+ 行的 God Object。**
    新增独立职责请按 §7 的模块契约拆出去，**但不要为了模块化一次性重写整个项目**。
13. **不要在没有浏览器实测的情况下声称视觉质量。** CSS 好看 ≠ 浏览器里好看。
    以浏览器为准。
14. **所有 HTML 拼接必须走 `esc()`**（`js/core/text.js` 的 `window.LPText.esc`，
    `script.js` 里是薄封装）。它是本项目的**唯一**安全边界。
    新增一处 `innerHTML` 拼接后跑 `node tools/qa/innerhtml-guard.js` ——
    守卫要求要么用 `esc()`，要么写 `// html-safe: <理由>`，不允许沉默通过。
15. **axe 的 `incomplete: color-contrast` 必须逐条手工判定，不能当通过。**
    本站底色是 canvas 绘制的 mesh 渐变，axe 拿不到底色 → 相关节点永远进 `incomplete`。
    必须用 `@contrast`（像素回读）核对，并**注意测试脚本自身的盲区**：
    只要脚本开头有一步「关掉某个覆盖层」（如 `!click #introEnter`），
    那个覆盖层自身就必然没被测过。开场页曾因此漏测（已补 `steps-contrast-intro.txt`）。
    另外 **axe 的 `passes` 计数与页面状态相关**，报数时必须写明状态。
16. **性能数字必须写清口径**（单位 KiB/KB、含不含文档、百分比分母），
    并给出原始字节数。本项目踩过一次 ÷1000 与 ÷1024 混用造成的「假差额」。
    优化动作必须逐条对应 `docs/qa/PERFORMANCE_BASELINE.md` 里的数字，
    复跑同一套测量方式验证收益 —— **不要凭直觉加懒加载或预加载**。

---

## 4. 标准工作循环（每次接手都照做）

```
READ      AGENTS.md → docs/architecture/CURRENT_STATE.md → docs/ROADMAP.md
          → docs/research/OPEN_SOURCE_REFERENCE_INDEX.md（别重复调研）
   ↓
AUDIT     git status / git log / 当前 HEAD；跑一遍 QA 确认基线是绿的
   ↓
RESEARCH  先搜成熟实现与许可证，再决定要不要自己写
   ↓
DECIDE    有争议的技术决策写进 docs/architecture/decisions/ADR-xxx-*.md
   ↓
IMPLEMENT 小步改动，保持模块边界
   ↓
TEST      tools/qa/run.sh steps-mobile-320.txt && steps-regression.txt
   ↓
VISUAL QA 真实浏览器截图逐章看（tools/qa/steps-visual-audit.txt）
   ↓
A11Y QA   agent-browser a11y --tags wcag2a,wcag2aa,wcag21a,wcag21aa
   ↓
DOCUMENT  更新 CHANGELOG / ROADMAP / 相关 registry / ADR
   ↓
COMMIT    分阶段独立提交，message 写清 What / Why / Validation
```

**不要**：Read → 写代码 → Done。

---

## 5. 命令速查

```bash
# 起本地静态服务器（零构建项目没有 dev server）
python -m http.server 8899 --bind 127.0.0.1

# 真实浏览器 QA（需要 agent-browser：npm i -g agent-browser && agent-browser install）
tools/qa/run.sh steps-mobile-320.txt      # 320×568 完整八章流程
tools/qa/run.sh steps-mobile-390.txt      # 390×844 完整八章流程
tools/qa/run.sh steps-regression.txt      # 信封几何 / 音乐胶囊重叠 / 触摸目标
tools/qa/run.sh steps-visual-audit.txt    # 全流程逐章截图（产物在 .qa-out/）
tools/qa/run.sh steps-theme-check.txt     # 三主题确定性巡章 + 兜底（§58 Template 硬指标）
tools/qa/run.sh steps-contrast.txt        # canvas 像素回读对比度（@contrast）
tools/qa/run.sh steps-contrast-intro.txt  # 开场页对比度（必须在点掉 #introEnter **之前**测）
tools/qa/run.sh steps-config-security.txt # 注入面 / 尺寸预留 / 非法配置诊断（@cfgsec）

# 零依赖 Node 回归（不需要浏览器、不需要服务器 —— 改配置相关代码后必跑）
node tools/qa/config-suite.js             # 配置契约 / 安全 / 兼容（99 断言，vm 独立 realm）
node tools/qa/module-suite.js             # js/core + js/chapters 纯函数（63 断言）
node tools/qa/innerhtml-guard.js          # 转义覆盖面静态守卫（新增注入点必须 esc() 或注明 html-safe）

# 素材：读图片原始像素尺寸（写进 photos[].width/height 用）
node tools/media/image-dims.js assets/photos/*.jpg          # 人类可读
node tools/media/image-dims.js --snippet assets/photos/*.jpg # 直接产出可粘贴的字段片段

# 无障碍（基线：0 violations / 16 passes）
agent-browser a11y --tags wcag2a,wcag2aa,wcag21a,wcag21aa

# 临时预览某个主题（不入库）
http://127.0.0.1:8899/index.html?theme=night-archive

# 配置写错时的第一手证据（控制台）
LPDiagnostics.report()          # 摘要：Runtime / Theme / Config / Chapters / Media …
LPDiagnostics.list('config')    # 每一条被拒绝/修正的字段（路径 + 期望 + 实际 + 回退）
ValentineConfig.auditPayload(confValue)   # 只校验一个 ?conf= 载荷，无副作用
```

> ⚠️ `run.sh` 内部用 `dirname` 定位自身路径。本沙箱的 PortableGit 在 shell 启动
> 那一刻 PATH 还没带上 coreutils，会出现 `dirname: command not found` 并把路径拼错。
> 稳妥写法（不依赖 run.sh）：
> ```bash
> export PATH="/usr/bin:/bin:$PATH"
> ag=$(/usr/bin/dirname "D:/…/Lover-page")   # 或直接写绝对路径
> node tools/qa/build-batch.js .qa-out/x.batch.json tools/qa/steps-xxx.txt
> agent-browser close --all
> agent-browser batch < .qa-out/x.batch.json > .qa-out/x.log 2>&1
> ```

**agent-browser 踩坑（已复现多次）**：
- `batch` 必须 stdin 传 JSON，且**一次 batch 要在同一个进程内跑完** —— 浏览器 daemon
  随命令结束被回收，页面状态不跨调用保留。用 `tools/qa/build-batch.js` 生成。
- **若 `batch` / `open` 静默挂住不动，先 `agent-browser close --all` 清掉陈旧 daemon 再重试。**
  这是最常见的「命令莫名其妙卡死」原因。
- **不要把 `batch` 的输出接管道**（`... | tail -40` / `| head`）。实测会以 `SIGTERM`
  中止、输出为空、EXIT=1，看起来像「命令挂了」其实是管道把 stdin/信号搞坏了。
  正确做法：`> .qa-out/x.log 2>&1` 落盘后再读。
- **多章巡检不要用「连点按钮」**。固定 `wait` 撞上章节切换的瞬间会点到 0×0 的元素：
  `getBoundingClientRect()` 返回全零、`elementFromPoint()` 返回 `<html>` 或 canvas，
  断言会**整体假失败**（本项目曾因此误判成「canvas 遮挡按钮」）。巡章一律用
  `window.appState.setState({currentStep:N})`；真实点击留在
  `steps-regression.txt` 里做最小证明。
- `tools/qa/*.js` 诊断脚本会被压成一行内联注入，
  **只能用块注释 `/* */`，不能用行注释 `//`**，否则 eval 报 `Unexpected end of input`。
  同理，`!eval` 后面的表达式**必须写在同一行**。
- `axe-core` 的 `incomplete: color-contrast` **不是通过** —— 页面底色是 mesh gradient
  canvas，工具算不出合成底色。用 `@contrast`（`tools/qa/contrast.js`）做像素回读核算，
  或按 `docs/design/THEME_REGISTRY.md` §3 的方法手工复算。

**Git 环境限制**：本沙箱可能无法写入 `refs/remotes/*`，`git status` 会显示 `[gone]`。
用 `git ls-remote origin` 对比哈希确认同步，不要被误导。

---

## 6. 开源复用与许可证规则

优先级：**成熟度 > 真实使用案例 > stars/forks > 维护状态 > 许可证 > API 简洁度 > 与当前架构兼容性**

| 许可证 | 可否复制代码 |
|---|---|
| MIT / BSD / Apache-2.0 / ISC / CC0 / Public Domain | ✅ 可以，需在 `THIRD_PARTY.md` 记录 |
| GPL-3.0 / AGPL-3.0 / LGPL / 商业限制 | ❌ **只能作为视觉/思路研究对象** |

已确认的具体条目见 [docs/research/LICENSE_RESEARCH.md](docs/research/LICENSE_RESEARCH.md)。
特别是 `simeydotme/pokemon-cards-css` = **GPL-3.0，不可复制代码**。

任何外部实现都必须在
[docs/research/OPEN_SOURCE_REFERENCE_INDEX.md](docs/research/OPEN_SOURCE_REFERENCE_INDEX.md)
留下记录：项目 / 仓库 / 许可证 / stars / 维护状态 / 采用原因 / 采用方式 /
涉及文件 / 是否直接复制代码 / 是否需要 NOTICE。

**禁止出现「参考了某项目」这种没有出处的表述。**

---

## 7. 模块契约（新增独立职责时照这个做）

一个 Agent 应该只读**一个文件**就知道怎么改它。达到这个标准的模块：

```
themes/<name>.js     一个主题的全部视觉语言（自包含、可独立阅读）
tools/qa/<probe>.js  一个诊断断言（块注释、返回字符串、无副作用）
```

拆分原则：

- **只有在实际承担独立职责时才拆文件**，不要机械创建几十个空模块。
- 新章节 → 在 `config.experience.chapters` 加一项 + 一个 renderer 函数 +
  在 `CHAPTER_CONTENT_COUNT` 加一行 + 一个视觉语言（CSS 段）。
  不需要改状态机，也不需要改分享系统（它是 schema 驱动的）。
- 新主题 → 复制一个 `themes/*.js` → 改 token → 在 `themes/index.js` 注册
  → 写 `docs/design/THEME_REGISTRY.md` → 跑 `steps-theme-check.txt`。
- 新诊断 → 加 `tools/qa/<name>.js` + 在 steps 文件里用 `@<name>` 引用。

新建独立职责时必须同步的六处（默认值 / 执行者 / 契约 / CONFIG_SCHEMA / examples / QA）
见 `docs/architecture/CONFIG_CONTRACT.md` §12。

`script.js` 的拆分状态（见 ADR-001）：**已完成** `js/core/text.js`（`esc` / `textPool` / `pickRandom`）
与 `js/chapters/gauge.js`（刻度盘几何与计算）。**待拆**：`Sound`（无 DOM 依赖的合成音效）、
照片渲染。拆分时**必须保留全局函数名**（HTML 里有 `onclick="showNextQuestion(2)"` 这类内联调用），
做法是在 `script.js` 里留一行薄封装：

```js
const esc = window.LPText.esc;                              // 值
const gaugeAngleFor = (v) => window.LPGauge.angleFor(v);    // 函数（注意：不要直接赋引用，
                                                            // 否则将来换实现时旧引用会被缓存住）
```

**拆分的目的是给下一个 Agent 一个可单独读懂的文件，不是为了行数好看。**
没有真实职责边界时不要拆。

---

## 8. 当前状态与下一步

- 当前 HEAD 与各章状态见 [docs/architecture/CURRENT_STATE.md](docs/architecture/CURRENT_STATE.md)
- 配置字段的权威说明见 [docs/architecture/CONFIG_CONTRACT.md](docs/architecture/CONFIG_CONTRACT.md)
- 性能基线（实测）见 [docs/qa/PERFORMANCE_BASELINE.md](docs/qa/PERFORMANCE_BASELINE.md)
- 8 章叙事骨架分析见 [docs/design/COMPOSITION_SYSTEM.md](docs/design/COMPOSITION_SYSTEM.md)
- 功能清单见 [docs/product/FEATURE_REGISTRY.md](docs/product/FEATURE_REGISTRY.md)
- 主题清单见 [docs/design/THEME_REGISTRY.md](docs/design/THEME_REGISTRY.md)
- 下一步优先级见 [docs/ROADMAP.md](docs/ROADMAP.md)

**已识别但未做（不要以为是遗漏）**：
- 字体子集化（需要一个离线预处理脚本，不能因此引入构建系统）—— 当前最高价值项
- 按 `PERFORMANCE_BASELINE.md` 的数字做性能优化（先有数字再动手，不要凭直觉加懒加载）
- 时间轴 / 共同经历章（`story.timeline` 字段已预留，契约已声明项形状）
- 全息照片卡片（`vanilla-tilt.js` MIT 可移植，shine/glare 需自研 + 触摸回退；
  注意 `photos[].style` 目前**不在契约里**，要先有读取方再声明字段）
- 组合系统渐进落地（`docs/design/COMPOSITION_SYSTEM.md`；一次一章，从 editorial / memo 开始）
- `esc()` 覆盖面的静态检查（本轮手工审计发现并修掉了 `renderPhoto()` 的漏点，
  但还没有机制阻止下一个人再漏一次）
- 在线编辑器 / 云端保存 / 账号 / 模板市场（**当前无证据证明需要，不要提前做**）

---

## 9. 需要停下来问用户的情况

只有三种：

- **A** 需要无法推测的私人素材（真实照片 / 音乐 / 语音 / 私人内容）
- **B** 不可逆的 Git / 账号 / 权限风险
- **C** 两个架构方案存在重大产品级冲突，且**实验无法判断**

其他情况：**自行决策，记录原因，继续开发。**
