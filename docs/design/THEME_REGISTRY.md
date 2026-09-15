# Theme Registry

> 每一个主题的预览、令牌、支持章节、已知限制与对比度实测。
> **加主题必须更新本文件；改主题必须复算对比度。**

**最后更新**：2026-09-15

---

## 1. 一览

| 名称 | 标签 | 面板形态 | 正文族 | 溶解章节 | 状态 |
|---|---|---|---|---|---|
| `warm-paper` | 暖纸 · 博物馆编辑设计 | 白卡 14px + 投影 | 中文衬线 | 8, 落幕 | stable（默认） |
| `night-archive` | 暗夜档案 · 暗画廊 | 深亚光卡 6px + 1px 暖边 | 中文衬线 | 6, 7, 8, 落幕 | stable |
| `modern-paper` | 现代纸本 · 极简编辑设计 | **无面板**（transparent / 0 / none） | **无衬线** | —（本来就无面板） | stable |

**选择方式**：`config.metadata.template = "<name>"`
**临时预览**：`index.html?theme=<name>`（不入库，用于对比与QA）
**未找到时的兜底**：退回 `warm-paper` 并打印可用主题列表（绝不出现无样式状态）

## 2. 客观差异（浏览器实测，非描述性文字）

由 `tools/qa/steps-theme-check.txt` 的 `@theme` 断言产出：

| 指标 | warm-paper | night-archive | modern-paper |
|---|---|---|---|
| `--paper` | `#fdf9f4` | `#171412` | `#ffffff` |
| `--ink` | `#4a3a33` | `#ece5db` | `#1d1c1a` |
| `--accent` | `#a8544f` | `#c27a5e` | `#35506b` |
| `--panel-bg` | `#fffbf6` | `#1e1a17` | `transparent` |
| `panelBg`（计算值） | `rgb(255,251,246)` | `rgb(30,26,23)` | `rgba(0,0,0,0)` |
| `panelRadius` | `14px` | `6px` | `0px` |
| `panelBoxShadow` | 暖投影 `0 18px 60px` | `0 0 0 1px` 暖边 + 深影 | `none` |
| `--font-body` | 衬线栈 | 衬线栈 | 无衬线栈 |
| `--fs-heading` | `clamp(19px,4.6vw,24px)` | 同左 | `clamp(20px,4.8vw,26px)` |
| `--track-display` | `0.04em` | `0.08em` | `-0.01em` |
| 动效基准 | `550ms` | `700ms` | `420ms` |
| 花瓣数 | 9 | 5 | 4 |
| 第一屏玫瑰 | shown | **hidden** | shown |
| `container.dissolveSteps`（声明） | `8,celebration` | `6,7,8,celebration` | （无） |
| 实测 `body[data-dissolve]` 为 `1` 的章节 | 8, 落幕 | **6, 7, 8, 落幕** | 无 |

> 这张表就是 §58「同一 Runtime + 不同 Theme = 不同体验」的证据。
> 注意面板形态与字体族的变化 —— 这不是「换配色」。
> 最后两行是同一件事的**声明与实测对照**：`dissolveSteps` 声明的是哪几章，
> `@theme` 逐章读出来的就是哪几章。2026-09-15 复跑，三套主题**逐章完全吻合**。

## 2.1 兜底行为（实测）

`index.html?theme=does-not-exist` → 控制台报错并**退回 warm-paper**，
`@theme` 读出 `--paper=#fdf9f4`、`--ink=#4a3a33`，`window.__lpErrors` 为空。
即：主题名写错不会让页面变成无样式，也不会抛未捕获异常。

## 3. 对比度实测（**手工核算，因为 axe 算不出 canvas 底色**）

`axe-core` 的 `incomplete: color-contrast` **不是通过**：页面底色是 mesh gradient
canvas，工具无法计算合成底色，只能标记「待复核」。本节是复核结果。

> **2026-09-15 起改为「像素回读法」**（更硬）：不再拿 token 推算最不利底色，
> 而是把 WebGL canvas `drawImage` 回 2D 上下文后**逐像素求 min/max RGB**，
> 拿到整屏真正渲染过的深浅极值，再逐一核对落在 canvas 上的文字节点。
> 工具：`tools/qa/contrast.js`，调用方式 `@contrast`，步骤文件 `tools/qa/steps-contrast.txt`。
>
> 下面的 token 推导值保留作对照 —— 两者一致，说明令牌标定没有算错。

### 实测（像素回读）

| 主题 | canvas 实测色域（min → max） | 最差节点 | 结果 |
|---|---|---|---|
| `warm-paper` | `rgb(242,213,192)` → `rgb(247,236,225)` | `.share-btn` `--ink-faint` 13.6px | **4.69:1** ✓ |
| `night-archive` | `rgb(12,10,9)` → `rgb(36,29,24)` | `.chapter-kicker` `--accent` 11px | **4.94:1** ✓ |
| `modern-paper` | `rgb(233,230,224)` → `rgb(250,249,247)` | `.share-btn` `--ink-faint` 13.6px | **5.59:1** ✓ |

**全局最低 = warm-paper `.share-btn` 的 4.69:1**（AA 门槛 4.5，余量 0.19）。
它落在 canvas 上、用最小号的 `--ink-faint` —— 这是整站最薄的一层，改暖纸
`ink.faint` 或 `mesh` 时必须重跑 `@contrast`。

方法：按 token 实际所处的**表面**取其最不利底色，用 WCAG 相对亮度公式复算。
`warm-paper` / `modern-paper` 的最深 mesh 色是其 4 个 mesh 色中最暗者
（`#f3d5cb` / `#e9e6e0`）；`night-archive` 取最亮者（`#241d18`）。

### warm-paper

| token | 值 | 表面 | 结果 |
|---|---|---|---|
| `--ink` | `#4a3a33` | `--paper` `#fdf9f4` | **10.3:1** ✓ |
| `--ink-soft` | `#6b5a52` | `--paper` | **6.3:1** ✓ |
| `--ink-faint` | `#7a6a62` | `--paper` / `--panel` `#fffbf6` | **4.9:1 / 5.0:1** ✓ |
| `--ink-canvas` | `#6b5a52` | 最深 mesh `#f3d5cb` | **4.73:1** ✓（实测 4.69） |
| `--accent` | `#a8544f` | `--panel` | **5.3:1** ✓ |
| `--accent-ink` | `#fdf7f1` | `--accent`（按钮 hover） | **4.88:1** ✓ |

### night-archive

| token | 值 | 表面 | 结果 |
|---|---|---|---|
| `--ink` | `#ece5db` | `--panel` `#1e1a17` | **13.8:1** ✓ |
| `--ink-soft` | `#b8ada1` | `--panel` | **7.8:1** ✓ |
| `--ink-faint` | `#948a7d` | `--panel` | **5.1:1** ✓ |
| `--ink-canvas` | `#948a7d` | 最亮 mesh `#241d18` | **4.90:1** ✓ |
| `--accent` | `#c27a5e` | `--panel` | **5.1:1** ✓ |

### modern-paper

| token | 值 | 表面 | 结果 |
|---|---|---|---|
| `--ink` | `#1d1c1a` | 最深 mesh `#e9e6e0` | **13.7:1** ✓ |
| `--ink-soft` | `#5c5955` | 最深 mesh | **5.6:1** ✓ |
| `--ink-faint` | `#67635e` | 最深 mesh | **4.8:1** ✓ |
| `--ink-canvas` | `#5c5955` | 最深 mesh | **5.59:1** ✓ |
| `--accent` | `#35506b` | 最深 mesh | **6.7:1** ✓ |

**全部 ≥ WCAG AA 4.5:1。最低项为 warm-paper `.share-btn` = 4.69:1（像素回读实测）。**

### 加主题时必看：最容易失守的位置

```
❌ 近白底 + 中灰字（"faint" 档）—— 差 0.05 就会不过
   modern-paper 的 faint 初版是 #7b7772，实测 4.45:1，仅差 0.05
❌ 用 --accent 当小号正文色
   night-archive 的 .chapter-kicker = #c27a5e @11px = 4.94:1，是通过了，
   但 accent 一旦调暗一点点就会跌出去。accent 用于装饰线是安全的，
   用于小字必须单独复算。
✅ 深色主题的正文反而不容易失守（浅字压深底对比度天然大）
```

**规则**：`--ink-faint` 按**它实际所处的表面**标定。

- 主题有实色面板 → 按 `--panel` 标定
- 主题面板透明 / 某章溶解 → 该处的文字按**最深 mesh 色**标定，
  或改用 `--ink-canvas`

## 4. 新增一个主题的步骤

1. 复制 `themes/warm-paper.js` → `themes/<name>.js`
2. 改**全部** token（不只颜色）：`surface` / `ink` / `accent` / `lines` / `fx` /
   `container` / `type` / `motion` / `paper` / `mesh` / `petal` / `hero`
3. 回答三个问题（否则这个主题不值得存在）：
   - 它的**版式语法**和已有主题有什么不同？（不只是配色）
   - 它的 `container` 形态是什么？（卡 / 深卡 / 无面板 / 其它）
   - 它的**动效节奏**为什么是这个速度？
4. 在 `themes/index.js` 无需改动（注册表自动读取 `window.LP_THEMES` 的键）
5. 在 `index.html` 加 `<script src="themes/<name>.js?v=N">`（**必须早于 `config.js`**）
6. **复算对比度**，把结果写进本文件 §3
7. 跑 `tools/qa/steps-theme-check.txt`（确定性的状态驱动巡章），确认令牌两两不同
8. 跑 `tools/qa/steps-contrast.txt`（`@contrast` 像素回读），确认无 `FAIL`
9. 跑 `agent-browser a11y`（该主题下 `violations` 必须为 0；`incomplete: color-contrast` 由第 8 步兜住）
10. 用 `.qa-out/` 截图逐章目视检查（**不要只看变量值**）
11. 更新本文件 §1、`docs/architecture/CURRENT_STATE.md`、`CHANGELOG.md`

## 5. 已知限制

| 限制 | 说明 |
|---|---|
| `night-archive` 下玫瑰退场 | Redouté 是白底 alpha 铜版画，压在暗底上像贴纸。这是**刻意的主题决策**，不是缺陷。`intro.js` 已有「主题未提供主视觉则隐藏玫瑰舞台」的分支 |
| 中文衬线在两个主题里是同一套系统字体栈 | 字体子集化是独立课题（需要离线预处理脚本，不能因此引入构建系统）。**当前 Windows / Android 上中文衬线渲染不一致** |
| 三套主题 token 重复度约 80% | 刻意保留：重复的是**结构**不是**值**。一个 Agent 只读一个文件就能改一个主题。若主题超过 6 套再考虑抽共享骨架 |
| `dissolveSteps` 是「主题 × 章节」的耦合点 | 刻意保留：「哪一章应该没有卡片」是构图决策，属于主题。但它是 `container` 的**一个字段**，不是散落在 CSS 里的 `body[data-step="6"]` 硬编码 |
| 无主题预览图 | 本文件没有截图。预览用 `?theme=<name>` 实时看，或用 `steps-visual-audit.txt` 产出到 `.qa-out/` |
