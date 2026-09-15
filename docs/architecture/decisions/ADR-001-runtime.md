# ADR-001 — Runtime 形态与模块边界

- **状态**：Accepted（部分实施）
- **日期**：2026-09-15
- **决策者**：本轮 Agent
- **相关**：ADR-002、`docs/architecture/CURRENT_STATE.md`

## Context

Runtime 是零构建的纯静态单页：`index.html` 顺序加载若干 classic script，
靠全局变量互相通信（`window.VALENTINE_CONFIG` / `window.appState` / `window.LPTheme`），
页面内还用 `onclick="showNextQuestion(2)"` 这类内联事件处理器。

`script.js` 当前 **948 行**（39 KB），承担：config 校验、DOM 文案填充、
漂浮元素生成、章节路由与跳过、默契测试、仪表几何与刻度、随机问题、随机小任务、
照片（渲染 + GLightbox 灯箱 + 联系印样）、信件（渲染 + 语音播放）、Web Audio 合成音效、
随机惊喜、落幕与花瓣迸发、重玩复位、音乐播放器、分享按钮。

`state.js` 95 行、`theme.js` 约 240 行、`config-system.js` 200 行、
`js/intro.js` 143 行（ESM）。

## Problem

1. 一个 Agent 要改「信件章」必须在一个 948 行的文件里定位，且改动附近有 6 个不相关职责。
   这违反「读一个文件就知道怎么改」的目标。
2. 模块边界在**权限上**已经存在（每章一个 renderer 函数 + 一个 `#questionN` section），
   但在**文件上**不存在。
3. 但同时：真正的 God Object 风险是「继续长到 3000+ 行」。
   948 行尚未失控，**为拆而拆会带来真实回归风险**（内联 onclick 依赖全局函数名、
   classic script 的执行顺序、`?v=` 缓存）。

## Options

| 方案 | 说明 | 评价 |
|---|---|---|
| A 保持现状 | 不拆 | 短期零风险，但每次改动都在一个 948 行文件里定位，长期必然劣化 |
| B 全量 ESM 化 + 按目录重写 | `src/**` 分几十个模块，`type="module"` | **拒绝**：会破坏内联 onclick（模块作用域不产生全局）、
引入加载顺序与循环依赖问题、无法在不跑完整视觉回归的情况下保证体验不变 |
| C 建立兼容层的**增量拆模块** | 只把**真正自包含、无 DOM/无全局依赖**的职责移出，其余保持；
新模块挂到命名空间并保留旧全局名 | **采用** |
| D 引入打包器（Vite/rollup）解决依赖 | 有构建步骤 | **拒绝**：见 ADR-002/架构调研；零构建是本项目的分发前提 |

## Decision

**采用 C。** 具体规则：

1. **只拆满足全部条件的职责**：无 DOM 依赖、无对其它模块的隐式依赖、可独立测试。
   已具备条件的两块：
   - `Sound`（Web Audio 合成微音效）——纯 API 封装，只读 `config.sound`
   - 仪表几何（`gaugeAngleFor` / `gaugePolar` / `buildGaugeTicks` 的角度计算）——纯数学
2. **不拆**章节 renderer：它们共享受理 DOM 结构、`config`、`Sound`、`themeTokens()`，
   拆开后需要引入事件总线，收益小于风险。**保留在 `script.js`，但在文件中用
   清晰的章节分隔注释保持可读性。**
3. **新的独立职责一律先进 `js/`**（`js/intro.js` 已是 ESM 先例），
   **不要继续往 `script.js` 加**。`script.js` 只保留「页面级编排 + 章节 renderer」。
4. **拆分必须保留全局函数名**（内联 onclick 依赖），通过显式
   `window.<name> = <name>` 建立兼容层，不得静默改名。
5. **禁止一次性重写。** 每拆一块都必须是可独立提交、可独立回归的。
6. **硬门槛**：`script.js` 超过 **1400 行**即触发「必须先拆分再继续加功能」。
   当前 948 行 → 距门槛仍有空间，但分工已明确。

## Trade-offs

- 接受「`script.js` 仍然偏大」这一现状，换取**零回归风险的持续演进**。
- 接受全局命名空间（这是零构建 + 内联 onclick 的既有约束，不是本轮引入的）。
- 未来若某天真要上构建器，正确的路径是：先写 ADR → 建立兼容层 →
  分模块迁移 → 每步都保持现有体验 → **不允许一次性 rewrite**。

## Migration

已实施：`theme.js` 被重写为**令牌应用层**（见 ADR-003），把原本混在
`script.js` 里的「主题解析」职责收拢到一个有明确契约的文件，并暴露
`window.LPTheme.current()` 作为唯一查询入口。

未实施（留给后续）：`Sound` 与仪表几何的提取。触发条件 = 需要改这两块，
或 `script.js` 接近 1400 行。
