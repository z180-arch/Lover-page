# ADR-002 — Config 与运行时数据模型

- **状态**：Accepted
- **日期**：2026-09-15
- **相关**：ADR-003、`docs/CONFIG_SCHEMA.md`

## Context

`config.js` 定义 `CONFIG` 对象，导出两个全局：

```js
window.DEFAULT_CONFIG    = CONFIG                          // 分享链接 diff 的基准
window.VALENTINE_CONFIG  = JSON.parse(JSON.stringify(...)) // 运行时生效配置（深拷贝）
```

`config-system.js` 负责把「与默认值的差异」编码进 `?conf=` 参数，加载时深合并回默认值
再做 schema 驱动校验。

## Problem

1. **两套并存的配置命名空间**：v1 的 `colors` / `animations` / `music` / `floatingEmojis`
   与 V2 引入的 `theme` / `person` / `media` / `experience` / `story` / `sound`。
   `colors.backgroundStart` 与 `theme.colors.gradient` 语义重叠。
2. **`config.theme.colors` 从来没有驱动过真正的 CSS 令牌**（`--paper` / `--ink` /
   `--accent`）—— 所以「换主题」实际上只换了 mesh 背景色。详见 ADR-003。
3. **没有独立的校验层**：校验散在 `script.js` 的 `validateConfig()`、
   `config-system.js` 的 `sanitize()`、以及各 renderer 的防御性判断里。
   用户写错一个字段，得到的是「某处文案没出现」而不是一条明确报错。
4. 历史教训：分享链接的校验曾硬编码在**已废弃**的 `config.questions.*` /
   `config.celebration` 上，且强制 `musicUrl` 以 `https://` 开头，
   导致分享链接丢掉 `photos/story/theme/sound/experience/person` 和本地 BGM。

## Options

| 方案 | 说明 | 评价 |
|---|---|---|
| A 引入 AJV / JSON Schema | 标准化校验 | **拒绝**：体积与构建成本不匹配零构建定位 |
| B 保持「以 DEFAULT_CONFIG 为形状基准」的递归校验 | 现状 | **保留**（形状校验足够，且新增字段无需改代码） |
| C B + **独立的语义校验层** | 在形状校验之上补一层「值是否合理」并输出可读报告 | **采用** |
| D 把遗留键硬迁移掉 | 删掉 `config.colors` 等 | **拒绝**：会破坏已发布的 v1 实例 config（违反「不删现有功能」）；改为**兼容映射 + 弃用提示**（见 ADR-003） |

## Decision

1. **形状（schema）**：继续以 `DEFAULT_CONFIG` 为唯一形状基准，递归 sanitize。
   **新增字段不需要改校验代码** —— 这是这个设计最大的价值，不要破坏它。
2. **语义（值）**：由独立层负责，检查「形状对但值不合理」的情况，例如
   `quiz.answer` 超出 `options.length`、`photos` 条目缺 `src`、
   颜色不是合法 hex、`meter.thresholds` 非递增、`expectation.chapters[].step` 重复。
   输出**可读的报告**（`console.warn` 分组 + `window.LPConfigReport`），
   而不是让页面悄悄少一块内容。
3. **兼容**：遗留键（`colors` / `animations` / `music` / `floatingEmojis`）**保留**，
   但通过显式映射层接入新令牌体系，并在**实际被覆盖时**打印弃用提示。
   映射只在「值与 v1 出厂值不同」时生效 —— 否则出厂的 `config.js`
   会把每个换主题的实例拽回暖色（真实踩过的坑，见 ADR-003 复盘）。
4. **数据模型方向**（长期）：

```
Content → Media → Story → Interaction → Experience → Theme → Template → Export
```

   即：文案与数据（平坦键）→ 素材引用（`media` 目录约定 + 每项 metadata）
   → 叙事结构（`story`）→ 交互节拍（`experience.chapters`）→ 视觉层（`theme`）
   → 可替换的成套视觉语言（theme preset）→ 可导出（配置 + 素材 = 一个网页）。

5. **章节声明化**：`experience.chapters` 由「只影响旅程标签」升级为
   **章节的权威声明**：`{ step, id, label, title, enabled, progress }`。
   - `title` 是本章 kicker 章名的**唯一来源**（此前硬编码在 HTML 里）
   - `enabled: false` 可让某章从流程中消失，无需改 renderer
   - renderer 仍然存在（不是「配置驱动一切」的过度抽象），
     但**加章节/改顺序/改名/停用章节都不需要动状态机**

   刻意**不**做的：把章节做成 `type: "quiz"` 这样的插件工厂。
   当前只有一个实例、8 个固定章节，工厂模式只会增加间接层而收益为零。

6. **不引入数据库。** 核心产品是 `Config + Assets + Static Runtime`。
   在线编辑 / 账号 / 云同步 / 模板市场属于**有证据之后**才研究的方向。

## Trade-offs

- 保留遗留键意味着配置层长期有两套命名。
  **缓解**：兼容映射集中在 `theme.js` 的 `LEGACY_TO_TOKEN`，只有 5 个键，
  且新代码一律不引用遗留键。
- 语义校验层是「尽力而为」，不是强约束（配置错了页面仍要能跑，只是报警）。
  这是刻意的：收件人打开网页时不应该看到报错页。

## Migration

- 已完成：`experience.chapters` 声明化；kicker 章名改为读 config；
  `showNextQuestion()` 同时尊重 `enabled` 与「内容为空」两种跳过原因。
- **已完成（1.4.0）：语义校验层落地。** 但它没有按本 ADR 的设想拆成
  `config-validate.js` —— 而是并入了 `config-system.js`，因为这个文件的职责本来就是
  「不可信输入的校验 + 合并」，在校验与合并之间再插一层文件边界收益很小。
  新增的能力：
  - **严格 schema 校验**：未知字段 / 类型不符 / 危险键一律拒绝，每个拒绝都带路径与理由
  - **原型污染防护**（三层）—— 这轮实测发现旧的 `sanitize()` 顺序下污染**真的成立**
  - **`window.LPDiagnostics`** 诊断通道（`diagnostics.js`），7 个区域、有上限、绝不抛异常
  - **可执行回归**：`tools/qa/config-suite.js` 99 断言（vm 独立 realm）
  - **权威契约文档**：`docs/architecture/CONFIG_CONTRACT.md`（8 个 Schema 逐字段表）

  教训已写进 `CURRENT_STATE.md` 与 `ARCHITECTURE.md`：本 ADR 原先把
  「schema 驱动校验」记为已完成，但那条结论**没有任何断言支撑** ——
  这轮把它写成断言才发现「拒绝未知字段」从未真正成立。
  **没有断言支撑的结论只是措辞**，这条已升级为项目工作约定。
- 未完成：`script.js` 里遗留的 `validateConfig()`（只覆盖 `colors` hex 与 `animations` 范围）。
  它与 `config-system.js` 的严格校验职责重叠，且校验的是**运行时源码**而非不可信输入 ——
  建议在下一次动 config 相关代码时合并或删除，不要让它长期并存（会造成「到底谁在校验」的混乱）。
