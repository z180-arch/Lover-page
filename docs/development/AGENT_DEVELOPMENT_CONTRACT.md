# Agent Development Contract

> `AGENTS.md` 是摘要与入口；**本文件是完整契约**。两者冲突时以本文件为准。

本项目的长期目标是成为一个**能被下一代 AI Coding Agent 持续维护和扩展**的工程底座。
这份契约把这个目标写成可执行的义务与禁止项。

---

## 1. Agent 必须做的事

| # | 义务 | 具体做法 | 验收证据 |
|---|---|---|---|
| 1 | **先读文档** | `AGENTS.md` → `docs/architecture/CURRENT_STATE.md` → `docs/ROADMAP.md` → `docs/research/OPEN_SOURCE_REFERENCE_INDEX.md` | 能在回答里指出本次改动影响哪些模块 |
| 2 | **检查 Git** | `git status` / `git log --oneline -20` / `git tag` / `git ls-remote origin` | 记录起始 HEAD |
| 3 | **检查当前架构** | 读要改的文件全文，而不是只看 diff 上下文 | 说明改动点与上下游依赖 |
| 4 | **先搜成熟实现** | 按 §6 的优先级搜 GitHub，记录到 `OPEN_SOURCE_REFERENCE_INDEX.md` | 索引里有新条目或「已查无可用」的结论 |
| 5 | **检查许可证** | 每个候选都核实许可证与维护状态 | `LICENSE_RESEARCH.md` 有记录 |
| 6 | **先验证再修改** | 改动前先跑 QA 确认基线是绿的 | `tools/qa/run.sh steps-regression.txt` 输出 |
| 7 | **保持模块边界** | 见 `AGENTS.md` §7 | 没有新增跨模块的隐式依赖 |
| 8 | **跑 QA** | 见 §3 的命令清单 | 浏览器实测输出 |
| 9 | **更新文档** | CHANGELOG / ROADMAP / 相关 registry / ADR | 文档与代码一致 |
| 10 | **提交 Git checkpoint** | 分阶段独立 commit，写清 What / Why / Validation | `git log` |

---

## 2. Agent 禁止的事

```
blind rewrite              不读现有实现就重写
force push / 改写历史       除非用户明确要求
删除素材且无备份
盲目删除兼容代码            先确认没有调用点
无理由引入依赖              每加一个依赖都要有 ADR
复制许可证不兼容的代码       GPL/AGPL/LGPL/商业限制 → 只借鉴思路
伪造测试结果                没有实测就不能说「通过」
未在浏览器实测就声称视觉质量
把「工具打分通过」当成审美裁判  见 §5
用 Python/Shell 批量改未读取的文件（尤其编码敏感路径）
只改代码不改 `?v=N`（缓存导致「改了没生效」的假象）
```

---

## 3. QA 命令与门槛

```bash
python -m http.server 8899 --bind 127.0.0.1 &
tools/qa/run.sh steps-mobile-320.txt
tools/qa/run.sh steps-mobile-390.txt
tools/qa/run.sh steps-regression.txt
tools/qa/run.sh steps-visual-audit.txt
tools/qa/run.sh steps-theme-check.txt
agent-browser a11y --tags wcag2a,wcag2aa,wcag21a,wcag21aa
```

**必须全部成立才可提交**：

| 门槛 | 判据 |
|---|---|
| 0 critical JS 错误 | `window.__lpErrors` 为空（页面内置了错误探针，`tools/qa/probe.js` 会打印） |
| 0 横向溢出 | `@diag` 的 `horizontalOverflow: false` |
| 0 critical/serious a11y violations | axe-core `violations: 0` |
| 触摸目标 ≥44px | `@diag` 的 `underSizedTargets: []` |
| 对比度 | 三档墨色 + `--ink-canvas` 全部 ≥4.5:1，**且要手工核算**（axe 算不出 canvas 底色） |
| 重玩可用 | 走到尾声 → `#replayBtn` → 能重新走完 |
| 分享往返 | `@share` 的往返校验 |
| 空 config 安全 | 清空任一内容数组 → 该章自动跳过，不出现空白页 |
| reduced motion | 动效退化为终态 |

---

## 4. 文档义务矩阵

| 改动类型 | 必须同步 |
|---|---|
| 加/改 config 字段 | `docs/CONFIG_SCHEMA.md`、`config.js` 注释、`CHANGELOG.md` |
| 加主题 | `docs/design/THEME_REGISTRY.md`、`themes/index.js`、`CHANGELOG.md` |
| 加章节/模块 | `docs/product/FEATURE_REGISTRY.md`、`docs/ARCHITECTURE.md`、`CHANGELOG.md` |
| 加外部依赖/素材 | `THIRD_PARTY.md`、`NOTICE`、`docs/research/OPEN_SOURCE_REFERENCE_INDEX.md` |
| 技术选型决策 | `docs/architecture/decisions/ADR-xxx-*.md` |
| 视觉改动 | `docs/visual-prototype/` 或 `.qa-out/` 截图 + `CHANGELOG.md` |
| 阶段完成 | `docs/ROADMAP.md`、`CHANGELOG.md`、`docs/architecture/CURRENT_STATE.md` |

**不要重复创建职责相同的文档。已存在的就更新它。**

---

## 5. 关于设计审计工具

`Nutlope/hallmark`（MIT，25k+ ★）存在且可安装（`npx skills add nutlope/hallmark`），
但**本机未安装**；且安装外部 skill 前必须过脚本安全审计流程。

当前可用的替代：

- 本项目自带的设计审计基线：`docs/design/DESIGN_SYSTEM.md`
- agent-browser + axe-core（客观数据）
- 本仓库既有的 48 项 hallmark gate 记录（见 CHANGELOG `93634dc`）

**审计工具不是最终审美裁判。** 如果某条规则与产品真实视觉目标冲突：

```
记录例外 → 解释原因 → 保留设计
```

**不要为了通过工具把网页做成模板化的「AI 无味设计」。**
反过来，也**不要用「工具是主观的」当借口跳过客观项**（对比度、命中区、溢出、错误）。

---

## 6. 调研前置规则（避免重复调研）

新 Agent **不要**重新搜一遍同样的东西。先读：

- `docs/research/OPEN_SOURCE_REFERENCE_INDEX.md` — 已评估过的实现与结论
- `docs/research/UX_RESEARCH.md` — 已分析过的 UX 参考与「哪一章可以借鉴什么」
- `docs/research/ARCHITECTURE_RESEARCH.md` — 技术栈决策论证
- `docs/research/VISUAL_REFERENCE_INDEX.md` — 视觉参考与素材来源
- `docs/research/LICENSE_RESEARCH.md` — 许可证判定表
- `THIRD_PARTY.md` — 已实际复用的东西与用法

只有在「索引里没有 + 需求真实存在」时才开新一轮调研，并把结论回写索引。

---

## 7. 分支与提交

推荐分支前缀：`feature/*`、`refactor/*`、`research/*`、`fix/*`。

提交粒度：**每个完整逻辑阶段一次**，message 用
`feat|fix|refactor|docs|test|perf|chore(scope): 一句话`，
正文写 **What / Why / Validation**。

**禁止** `everything-final-final2` / `update` / `fix bug` 这类 message。

---

## 8. Agent 交接检查清单

下一位 Agent 必须能做到：

```
git clone
 ↓ 读 AGENTS.md（3 分钟）
 ↓ 读 docs/architecture/CURRENT_STATE.md（3 分钟）
 ↓ 读 docs/ROADMAP.md + docs/research/OPEN_SOURCE_REFERENCE_INDEX.md
 ↓ 起静态服务器 + 跑 tools/qa/run.sh steps-regression.txt
 ↓ 读要改的那一个模块文件
 ↓ 开始开发
```

而不是：

```
打开 script.js → 猜
```

如果上面这条链路走不通，**那本身就是本轮要修的最高优先级缺陷**。
