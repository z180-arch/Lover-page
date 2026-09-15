# ADR-001 — Runtime 形态与模块边界

- **状态**：Accepted（部分实施）
- **日期**：2026-09-15
- **决策者**：本轮 Agent
- **相关**：ADR-002、`docs/architecture/CURRENT_STATE.md`

## Context

Runtime 是零构建的纯静态单页：`index.html` 顺序加载若干 classic script，
靠全局变量互相通信（`window.VALENTINE_CONFIG` / `window.appState` / `window.LPTheme`），
页面内还用 `onclick="showNextQuestion(2)"` 这类内联事件处理器。

`script.js` 当前 **948 行**（39 KB，拆分第一层后 941 行 —— 见 §Migration 的实施记录），
承担：config 校验、DOM 文案填充、
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

### 实施记录 · 第一层（2026-09-15，CHANGELOG 1.4.0）

已拆出两个模块，`script.js` 948 → **941 行**：

| 模块 | 命名空间 | 内容 | 为什么它符合「无 DOM / 无隐式依赖 / 可独立测试」 |
|---|---|---|---|
| `js/core/text.js` | `window.LPText` | `esc` / `textPool` / `pickRandom` | 纯字符串函数。**本 ADR 原先没把它列为候选** —— 是这轮审计发现 `esc()` 是全项目唯一的安全边界、而它当时藏在一个 941 行的文件里、没有任何测试。安全边界必须能独立测试，这个理由比「行数」强 |
| `js/chapters/gauge.js` | `window.LPGauge` | 刻度盘几何与计算（`GEOMETRY` / `angleFor` / `polar` / `fillPercent` / `fmt` / `buildTicks` / `update` / `resetPeak`） | 纯数学 + 有限的 SVG 拼装，与 config/DOM 无耦合 |

**兼容层的实际做法（与 §Decision 3 的方向相反，但结论一致）**：不是「拆出去的模块
显式注册回全局」，而是**新模块挂自己的命名空间，`script.js` 保留薄封装**：

```js
const esc = window.LPText.esc;                            // 值
const buildGaugeTicks = () => window.LPGauge.buildTicks(); // 函数：包一层，不直接赋引用
```

理由：内联 `onclick="showNextQuestion(2)"` 依赖的全局函数名**本来就没有被移动**
（它们全留在 `script.js`，见 §Decision 2「不拆章节 renderer」），所以「保留全局名」
这条约束在这两个模块上并不适用 —— 需要保持的是**本文件内的调用点**不用改。
包一层而不是直接赋引用，是为了避免将来换实现时旧引用被缓存住。

同时移除了一条**没有被保留价值的兼容别名**：`gaugeAngleFor` 在拆分后没有任何调用方，
留着一个无人使用的别名会让下一个人误以为有人在用。已在文件里写明
「需要 `angleFor` 时直接写 `window.LPGauge.angleFor`，不要再往 `script.js` 加别名」。

**拆分直接暴露了一个真实缺陷**：`fillPercent(NaN)` 返回 `NaN`（`Math.min/max(NaN)` 仍是 `NaN`），
于是 `strokeDasharray="NaN 100"` —— 弧线会**静默画不出来**，没有报错、没有可见异常。
`tools/qa/module-suite.js` 现在用 63 条断言锁住这类「静默失败」。

**未实施（留给后续）**：`Sound`（Web Audio 合成微音效）的提取。触发条件 = 需要改它，
或 `script.js` 接近 1400 行。

**下一步的拆分候选**（按 ADR 的准入条件筛过）：照片渲染（`renderPhoto` /
`photoMediaHtml` / `photoFocus` / `buildContactSheet`）—— 它有明确的输入（`config.photos`）
与输出（DOM 字符串），且已经有独立的浏览器批次 `steps-config-security.txt` 覆盖，
是下一个「可独立回归」的合理单位。

