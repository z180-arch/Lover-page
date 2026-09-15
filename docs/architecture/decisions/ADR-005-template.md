# ADR-005 — Template / Theme Preset 与导出

- **状态**：Accepted（部分实施）
- **日期**：2026-09-15
- **相关**：ADR-003、`docs/design/THEME_REGISTRY.md`、`docs/product/FEATURE_REGISTRY.md`

## Context

长期目标：

```
Content → Media → Story → Interaction → Experience → Theme → Template → Export
```

最终要能说出这句话并且它成立：

> **一个配置 + 一组资源 = 一个可直接打开/部署的网页。**

## Problem

1. 「Template」与「Theme」的边界在本轮之前是模糊的。
   到底「换成 `modern-paper`」算换主题还是换模板？
2. 没有可验证的判据说明「模板系统真的成立」。
   §58 要求：**同一个 Runtime + 两个明显不同的 Config/Theme = 两个不同体验**。
   在此之前这条**无法通过** —— 因为主题层本身不存在（ADR-003）。
3. 导出（ZIP / GitHub Pages / Netlify / Cloudflare Pages）与模板是两件事，
   容易混淆成「先做导出再做模板」。

## Options

| 方案 | 说明 | 评价 |
|---|---|---|
| A 把 Theme 与 Template 合并成一个概念 | 更简单 | **拒绝**：两者变化频率与所有权不同（主题是视觉语言，模板是页面构成习惯） |
| B 现在就把模板做成一等公民 | `templates/editorial/`… 每个带 layout + 章节构成 + 默认 config | **拒绝**：当前只有一个真实实例，抽象会基于猜测而非证据 |
| C **先把 Theme preset 做实**，Template 作为「preset + 章节构成 + 默认 config」的组合，等第二个真实实例出现再抽取 |  | **采用** |
| D 先做导出（ZIP 打包） | 用户能感知 | **推迟**：导出应建立在「模板系统稳定」之后，否则导出的是一个易变的东西 |

## Decision

### 1. 概念边界

| 概念 | 定义 | 谁改 | 变化频率 |
|---|---|---|---|
| **Runtime** | 状态机 + renderer + 令牌应用层。**所有模板共用，不复制** | 开发者 | 低 |
| **Theme preset** | 完整视觉语言：surface / ink / accent / lines / fx / container / type / motion / paper / mesh / petal / hero | 设计者 | 中 |
| **Config** | 一个实例的内容：人物、文案、照片、信件、惊喜、章节启用状态 | 收件人/制作者 | 高 |
| **Template** | `Theme preset` + `章节构成` + `默认 config` 的**组合约定** | 设计者 | 中 |
| **Export** | 把以上打包成一个可独立运行的站点 | 工具 | — |

**核心 Runtime 绝不能因为 Template 不同而被复制。** 这是这个架构存在的理由。

### 2. 本轮达成的验证（§58 硬指标）

同一个 Runtime，三套 preset，浏览器实测结果两两不同：

| 指标 | warm-paper | night-archive | modern-paper |
|---|---|---|---|
| 底色 | `#fdf9f4` 暖奶油 | `#171412` 近黑暖墨 | `#ffffff` 近白 |
| 墨色 | `#4a3a33` 深棕 | `#ece5db` 浅米 | `#1d1c1a` 冷黑 |
| 强调色 | `#a8544f` 玫瑰 | `#c27a5e` 烛铜 | `#35506b` 墨蓝 |
| 面板卡 | 白卡 + 14px 圆角 + 投影 | 深亚光卡 + 6px 圆角 + 1px 暖边 | **不存在**（transparent / 0 / none） |
| 正文族 | 中文衬线 | 中文衬线 | **无衬线** |
| 标题字距 | `0.04em` | `0.08em` | `-0.01em` |
| 动效 | 基准 | 放慢（550→700ms） | 收紧（550→420ms） |
| 花瓣数 | 9 | 5 | 4 |
| 面板溶解章节 | 8, 落幕 | 6, 7, 8, 落幕 | —（本来就无面板） |
| 第一屏 | 玫瑰 + 暖纸 | **玫瑰退场**，纯字排版 | 玫瑰 + 冷白 |

**这不是「同一个模板换颜色」。** 用 `modern-paper` 打开和用 `warm-paper` 打开，
得到的是两种不同的版式语法（有面板 vs 无面板），而不是两种配色。

### 3. 刻意不做的事

- **不做 `templates/` 目录。** 当前 `themes/` 已能表达「成套视觉语言」，
  而「章节构成」已由 `config.experience.chapters` 表达。
  再加一层 `templates/` 只是把这两者重新包一次 —— **等第二个真实实例出现**，
  如果那时发现确实需要预设的章节构成组合，再抽。
- **不做 `create-lover-page` 生成器。** 在「配置 + 素材 = 网页」还没有被
  第二个真实用户验证之前，生成器只能生成给第一个用户看的东西。
- **不做 SaaS / 账号 / 云端保存 / 模板市场。** 无证据。
- **不做导出，但保证导出可行**：零构建 + 相对路径 + 本地 vendor + 无外部 CDN
  已经保证了「整个目录拷走就能跑」。这是**导出能力的充分条件**，
  不需要现在写打包脚本。

### 4. 导出路径（已具备，未包装）

```
仓库根目录
  → 拷贝整个目录到任意静态托管（GitHub Pages / Netlify / Cloudflare Pages / 本地服务器）
  → 打开 index.html
```

验证：`python -m http.server` 起在 `127.0.0.1`，全部资源同源加载，
无外部网络请求（唯一例外见 `THIRD_PARTY.md`：素材与字体都已本地化）。

未来若要包一层 `Export`，正确的做法是**打包脚本**，而不是把运行时改成需要服务的形态。

## Trade-offs

- 接受「Template 暂时不是一等概念」这件事。**这是刻意的**：
  过早抽象会基于猜测，而猜测会在第二个实例出现时被推翻。
- 接受三套主题各自维护约 130 行 token（重复度约 80%）。
  **缓解**：重复的是**结构**而不是**值**，这是主题该有的样子；
  而且一个 Agent 只读一个文件就能改一个主题。
  若将来主题超过 6 套，再考虑抽出共享骨架（届时已有足够样本决定哪些字段该共享）。

## Migration

已实施：`themes/` 三套 preset + 注册表 + 令牌应用层；`metadata.template` 选择主题；
`?theme=` 临时预览；`container.dissolveSteps` 让构图随主题变化。

**未实施且明确排在后面的**：`templates/` 抽取、`create-lover-page`、
在线编辑器、导出打包脚本。触发条件见 `docs/ROADMAP.md`。
