# ADR-003 — Theme 令牌层

- **状态**：Accepted **（本轮已实施并浏览器实测）**
- **日期**：2026-09-15
- **相关**：ADR-002、`docs/design/THEME_REGISTRY.md`

## Context

v1 的 `theme.js` 只做一件事：把 `config.colors.*` 与 `config.theme.fonts.*`
写成 CSS 变量（`--background-color-1/2`、`--button-color`、`--text-color`、`--font-body`）。

而 `styles.css` 的 `:root` 早已长出一套**真正的**令牌体系：
`--paper` / `--paper-2` / `--paper-3` / `--panel` / `--ink` / `--ink-soft` /
`--ink-faint` / `--accent` / `--accent-deep` / `--hairline` / `--shadow-*` /
`--space-*` / `--dur-*` / `--ease-out`。

## Problem

**两套令牌互不相通，且新的那套（`theme.*`）不通向任何地方。**

具体后果（全部在浏览器里实测到）：

1. **深色主题不可能成立。** 改 `config.theme.colors.gradient` 只改 mesh 背景色，
   而 `--paper` / `--ink` / `--accent` / `--panel` 全部写死在 `:root`。
   于是「换主题」= 换背景，白卡与深墨纹丝不动。
2. **`config.colors` 与 `config.theme.colors` 语义重叠**，改一个不改另一个会得到
   不一致的视觉。
3. **ROADMAP 里「至少两套主题」的验证目标无法达成** —— 因为主题层实际上不存在。
4. **业务 CSS 仍有散落色值**（`.note-slip` 的 `#fdfaf3`、`.envelope-flap` 的
   `linear-gradient(#f7eadd,#efdccb)`、`.editorial` 的白色 wash、火漆 `#bb6860`、
   便签横格的 `rgba(74,58,51,0.13)`……）—— 即使主题层存在，这些也不会跟着走。

### 实施过程中暴露的真实缺陷（值得记录）

**缺陷 A：兼容层把主题反向拽回默认值。**
初版的遗留键映射写成「只要 `config.colors.textColor` 存在就覆盖 `ink`」。
出厂的 `config.js` 里 `colors.textColor = '#4a3a33'`，于是
**三套主题的 `--ink` 全部变成 `#4a3a33`、`--accent` 全部变成 `#a8544f`** ——
`night-archive` 的浅墨字变回深棕，实测在深底上几乎不可读。

**缺陷 B：第一屏进入按钮硬编码色值，在暗色主题下变成一块浅灰盒子。**
`.intro-enter { background: rgba(255,253,250,.16); border: 1px solid rgba(74,58,51,.36) }`
——在 `night-archive` 下渲染成一个与深色环境格格不入的灰白矩形（有截图为证）。

**缺陷 C：面板透明/溶解后，`--ink-faint` 不过 AA。**
`--ink-faint` 原本是按「对 `--paper` 4.9:1」标定的。但
`modern-paper` 的面板是 `transparent`、`warm-paper` 在 section 8 与落幕时溶解面板
—— 这两种情况下文字不再落在 `--paper` 上，而是落在 **mesh gradient canvas** 上，
而 canvas 的最深色（`warm-paper` 的 `#f3d5cb`）比 `--paper` 暗得多：

```
--ink-faint #7a6a62 vs 最深 mesh #f3d5cb  →  3.74:1   ✗ 不过 AA 4.5:1
```

## Options

| 方案 | 说明 | 评价 |
|---|---|---|
| A 只改 `config.theme.colors` 的消费方 | 让 `theme.colors` 也写 `--paper/--ink` | 只解决一半：字体/间距/动效/材质仍然不可换 |
| B 用 CSS 类名切主题 | `body[data-theme="x"]` + 大段覆盖 | **拒绝**：主题越多样式表越膨胀，且主题差异无法被程序读取 |
| C **Theme preset 对象 + 令牌应用层** | `themes/*.js` 声明完整视觉语言 → `theme.js` 写入 CSS 自定义属性 | **采用** |
| D 引入设计令牌工具链（Style Dictionary 等） | 标准化 | **拒绝**：需要构建步骤，与零构建分发冲突 |

## Decision

### 1. 三层结构

```
themes/<name>.js        主题 preset：**完整视觉语言**（自包含、可独立阅读、可复制改造）
themes/index.js         注册表 + 解析（?theme= > config.metadata.template > 兜底）
theme.js                令牌应用层：preset + 实例覆盖 → CSS 自定义属性
styles.css :root        仅作「主题没加载成功」时的兜底，**不是主题开关**
```

### 2. preset 必须描述整套视觉语言，不只是颜色

`surface` / `ink` / `accent` / `lines` / `fx` / `container` / `type` / `motion` /
`paper`（纸张材质）/ `mesh` / `petal` / `hero`。

**其中 `container` 是主题差异最直观的地方**：
`background` / `border` / `radius` / `shadow` / `padding` / `dissolveSteps`。
这让「换主题」改变的是**构图**，不只是配色 —— 例如 `modern-paper` 的
`background: transparent` 直接让面板卡不存在，内容落在纸面上。

### 3. 合并优先级（低 → 高）

```
preset  →  config.theme（实例级覆盖）  →  config.colors/animations（v1 遗留键）
```

**关键规则：只有「与 warm-paper 出厂值不同」的实例配置才算有意覆盖。**

出厂的 `config.js` 本身就是 warm-paper 的一份实例。如果它写
`theme.hero.rose = './assets/art/redoute-gallica-bloom.webp'`（与 warm-paper 相同），
那不是「用户有意指定玫瑰」，而是模板出厂值 —— 它不应该阻止 `night-archive`
把玫瑰退场。实现见 `theme.js` 的 `overrideIfChanged()` 与 `baseTheme()`。

> 这是本 ADR 最重要的教训：**模板系统的默认值不能有否决权。**
> 判断标准是「与基准是否不同」，不是「是否存在」。

### 4. `--ink-canvas`：按**所在表面**标定墨色，而不是按「有多淡」

新增第四档墨色，专供**直接落在背景画布上**的文字（当前是章节进度线编号）：

| 主题 | `--ink-canvas` | 对最深 mesh 色 |
|---|---|---|
| warm-paper | `#6b5a52` | 4.73:1 ✓ |
| night-archive | `#948a7d` | 4.90:1 ✓ |
| modern-paper | `#5c5955` | 5.59:1 ✓ |

`modern-paper` 的 `--ink-faint` 同时从 `#7b7772` 改为 `#67635e`
（因为该主题没有面板，所有 faint 文字都在 canvas 上）。

> 教训：**「在纸上」和「在画布上」必须分开标定。**
> 最容易失守的不是深色主题（浅字压深底对比度天然大），
> 而是「近白底 + 中灰字」这一组。

### 5. 业务 CSS 禁止明确色值

散落的 9 处色值全部收编进令牌（`--sheet-bg` / `--flap-bg` / `--tape` /
`--wash` / `--wash-2` / `--wash-hi` / `--seal` / `--accent-line` / `--ink-line`）。
现在 `styles.css` 与 `css/intro.css` 里的唯一硬编码色值位置是 `:root` 兜底
和 SVG data-URI 噪点。

### 6. 兼容层

v1 的 `config.colors.*` / `config.animations.*` 保留可用（映射到新令牌 +
打印弃用提示），`--background-color-1` 等旧变量名继续写入，任何仍引用它们的样式不受影响。

## Trade-offs

- **每个主题现在要写约 130 行 token**。可接受：主题是「成套视觉语言」，
  它本来就比「一组颜色」重；而且这 130 行是自包含的，一个 Agent 只读一个文件就能改。
- **`dissolveSteps` 是「主题 × 章节」的耦合点**。刻意保留：
  「哪一章应该没有卡片」是构图决策，属于主题；但它是 `container` 的一个字段，
  不是散落在 CSS 里的 `body[data-step="6"]` 硬编码。
- 深色主题下 Redouté 玫瑰退场（白底 alpha 铜版画压暗底像贴纸）。
  这是刻意的主题决策，不是缺陷。

## Migration

**已在同一轮完成，无迁移遗留。** 三套主题经浏览器实测（`steps-theme-check.txt`），
客观指标两两不同：

| token | warm-paper | night-archive | modern-paper |
|---|---|---|---|
| `--paper` | `#fdf9f4` | `#171412` | `#ffffff` |
| `--ink` | `#4a3a33` | `#ece5db` | `#1d1c1a` |
| `--accent` | `#a8544f` | `#c27a5e` | `#35506b` |
| `panelBg` | `rgb(255,251,246)` | `rgb(30,26,23)` | `rgba(0,0,0,0)` |
| `panelRadius` | `14px` | `6px` | `0px` |
| `--font-body` | 衬线栈 | 衬线栈 | 无衬线栈 |
| 第一屏玫瑰 | shown | **hidden** | shown |

**验证证据**：`tools/qa/steps-theme-check.txt`（3 主题 × 令牌 + 章节流程 + 截图），
axe-core 三主题各一次均 `violations: 0`。
