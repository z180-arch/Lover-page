# ROADMAP

## 进行中 — 真实私有化（当前阶段）

产品定位已从「模板化」推进到「Reference Implementation」：先把一份优秀的私人体验做到足够好，再抽象成产品。
核心指标不是功能数量，而是：**收件人打开后觉得「这是专门为我做的」**。

### 已完成
- [x] Theme / Content / Experience 三层 schema
- [x] 章节旅程数据化、空章节自动跳过（`CHAPTER_CONTENT_COUNT`）
- [x] 照片展签（date/place/description/thumb）
- [x] 信件系统（含语音播放）
- [x] V1 硬编码迁移收口
- [x] **章节视觉语言分化**（贰 仪器 / 叁 编辑排版 / 肆 便签 / 伍 联系印样 / 柒 信封）—— 解决「八章同构」
- [x] **动作层级**（solid / ghost / text + 窄屏成对布局）
- [x] **分享链接修复**：schema 驱动 + diff 传输 + 默认值深拷贝
- [x] **a11y 实测修复**：墨色令牌达 AA、触摸目标 ≥44px
- [x] **可复现浏览器 QA 工具链**（`tools/qa/`，320 / 390 / 回归三套步骤）
- [x] **主题令牌层**（`themes/*.js` 预设 → `themes/index.js` 解析 → `theme.js` 写 CSS 变量）—— `config.theme.colors` 真正落到令牌
- [x] **容器形态不再同构**：`container.dissolveSteps` 让章节按需溶掉面板卡（解决本页原第 1 项）
- [x] **三套主题预设**：`warm-paper` / `night-archive` / `modern-paper`（满足 §44「至少两个主题」，且实测 10 项客观指标两两不同）
- [x] **章节可命名 / 可关闭**：`experience.chapters[].title` 成为 kicker 唯一来源、`enabled` 支持整章跳关
- [x] **Agent 接棒文档**：`AGENTS.md` + `AGENT_DEVELOPMENT_CONTRACT.md` + ADR-001..005 + 5 份 research 索引

### 下一步（按价值排序）

1. **字体子集化（现在最高价值）**
   `--font-body` 依赖系统宋体栈，Windows / Android 上中文衬线渲染不一致（本项目的排版质感有相当部分压在这上面）。
   方向：按 `config` 实际出现的字符生成 Noto Serif SC 子集 webfont，本地托管（不引 CDN，保持 zero-build）。
   注意子集文件仍需本地构建步骤 → 需要一个「离线预处理」的小脚本，而不是引入构建系统。
   3 套主题已就位，字体是**唯一**还没被主题层接管的大块 —— 主题切换目前换了字阶/字重/字距，但没换字面。

2. **照片全息卡片 `photos[].style = "holo"`（V1 遗留）**
   调研结论：
   - `simeydotme/pokemon-cards-css`（GPL-3.0，~5k★）—— 效果最好，但 **copyleft 传染，只能借鉴思路，不可复制代码**。
   - `vanilla-tilt.js`（MIT）—— 可安全移植的 tilt 部分。
   - 方案：移植 MIT 的 tilt 计算，shine/glare 层自行实现（多层 `radial-gradient` + `mix-blend-mode`），必须提供触摸回退（`prefers-hover` / 指针类型判断）。
   - 风险：`mix-blend-mode` 在本项目有过合成器踩坑史（见 ARCHITECTURE 已知约束），需要单独验证。

3. **性能基线（LCP / CLS / INP）**
   `docs/architecture/CURRENT_STATE.md` 已如实标注「未测量」。首屏有一个 canvas mesh gradient + 10 张 jpg，
   需要在真实 4G 节流下量一次，并决定是否对首屏图加 `loading` / `decoding` 策略。
   注意：**先测量再优化**，不要凭直觉加懒加载。

4. **时间轴 / 共同经历章**
   Editorial Timeline / Museum Archive / Photo Essay 方向，不要做成「恋爱时间线模板」。数据字段 `story.timeline` 已预留。
   这一章适合成为第 4 套主题的验证样本（新章节 + 新主题一起做，能同时压测 schema 的两端）。

5. **主题预设扩展（第 4–5 套）**
   现有 3 套已覆盖「暖纸 / 暗房 / 编辑」三种极端。下一套建议走**材质**方向而非配色方向
   （例如布纹 / 活页夹），用来检验令牌层是否真的与「纸」解耦。
   ⚠️ 已知残留：`styles.css` 里仍有少量纸色写死在具体选择器里（不在 `:root` 令牌内），
   加第 4 套主题前应先做一次「硬编码色审计」，否则新主题会在细节处露馅。

## V2 — 编辑器
- [ ] 本地表单生成 config.js（照片上传、文案填写、主题挑选、实时预览）
- [ ] 语音录制/上传 + 信件 audio 自动挂载
- [ ] 一键部署（GitHub Pages / Cloudflare Pages 模板仓库）

## V3 — 生成器
- [ ] 用户上传素材 → AI 辅助撰写信件/时间轴文案 → 自动产出私人网页
- [ ] 多主题视觉模型（按素材色调自动选主题）

## 原则
每个 V 版本保持：零构建、零框架、config 驱动、320px 优先。

## 参考（数据-模板分离思想）
- 11ty 数据级联：默认主题 + 用户覆盖分层，而非巨型单一 config
- Astro Content Collections：给 config 做结构校验（已用 config-system.js 的 schema 驱动校验落实，且不改 JSON 也能校验）
- Hugo 主题层叠：代码永远是模板，用户侧只放 config + assets 覆盖

## 调研结论存档（避免重复调研）
本轮把「选型问题」的答案落到了文件里，下次直接读，不要重新搜：

| 问题 | 结论 | 存档位置 |
|---|---|---|
| 要不要上构建器 / 框架？ | **不上**。A/B/C/D 四方案对比后维持 Vanilla 零构建 | `docs/research/ARCHITECTURE_RESEARCH.md` + `ADR-001` |
| 哪些开源项目可抄、哪些只能看？ | MIT/BSD/Apache/ISC/CC0/PD 可移植；GPL/AGPL/商业只能借鉴思路 | `docs/research/LICENSE_RESEARCH.md` |
| 视觉 / 交互参考有哪些？ | 已建索引，含各自 license | `docs/research/VISUAL_REFERENCE_INDEX.md`、`UX_RESEARCH.md` |
| 主题该怎么组织？ | 预设（结构）+ config（差异）两层，令牌走 CSS 变量 | `ADR-003` + `docs/design/THEME_REGISTRY.md` |
| 当前仓库到底什么状态？ | 事实快照 + 8 项已知问题（含未测性能） | `docs/architecture/CURRENT_STATE.md` |
| Agent 接手该守什么规矩？ | 13 条铁律 + 标准循环 + 命令速查 | `AGENTS.md`、`docs/development/AGENT_DEVELOPMENT_CONTRACT.md` |

## 明确不做
- 不引入构建器 / 框架 / 重型 CMS
- 不为「更高级」加 WebGL、粒子、shader
- 不提前做在线编辑器与云后端
- 不为抽象而抽象（每加一个 schema 字段都要回答：用户为什么要改、renderer 为什么要知道、能不能从已有字段推导）
- **不为了「支持更多主题」把主题系统改成插件市场** —— 3 套预设是证据，不是产品线
