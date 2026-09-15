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

### 下一步（按价值排序）

1. **容器形态也是同构的（P2，最高价值）**
   现在八章都活在同一个 `.container` 面板卡里 —— 这是「页面长得一样」残留的最强信号。章节内部的材质已经分化，但外层包装仍是同一张卡。
   方向：让容器按章节改变形态或退场（例如档案/来信章让卡片溶掉、正文直接落在纸底上；落幕页已经这么做了，可推广）。
   必须先找成熟案例对比，禁止凭感觉改。

2. **照片全息卡片 `photos[].style = "holo"`（V1 遗留）**
   调研结论：
   - `simeydotme/pokemon-cards-css`（GPL-3.0，~5k★）—— 效果最好，但 **copyleft 传染，只能借鉴思路，不可复制代码**。
   - `vanilla-tilt.js`（MIT）—— 可安全移植的 tilt 部分。
   - 方案：移植 MIT 的 tilt 计算，shine/glare 层自行实现（多层 `radial-gradient` + `mix-blend-mode`），必须提供触摸回退（`prefers-hover` / 指针类型判断）。
   - 风险：`mix-blend-mode` 在本项目有过合成器踩坑史（见 ARCHITECTURE 已知约束），需要单独验证。

3. **字体子集化**
   `--font-body` 依赖系统宋体栈，Windows / Android 上中文衬线渲染不一致（本项目的排版质感有相当部分压在这上面）。
   方向：按 `config` 实际出现的字符生成 Noto Serif SC 子集 webfont，本地托管（不引 CDN，保持 zero-build）。注意子集文件仍需本地构建步骤 → 需要一个「离线预处理」的小脚本，而不是引入构建系统。

4. **主题预设包**
   `warm-paper` 之外的 1–2 套（如 `night-rose` / `ink-garden`）。这是验证「schema 真正有效」的硬指标（§44 要求至少两个主题）。
   注意：theme 里目前仍有若干硬编码的纸色/墨色混在 `styles.css` 的令牌里，需要先检查换主题时是否所有面都跟着走。

5. **时间轴 / 共同经历章**
   Editorial Timeline / Museum Archive / Photo Essay 方向，不要做成「恋爱时间线模板」。数据字段 `story.timeline` 已预留。

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

## 明确不做
- 不引入构建器 / 框架 / 重型 CMS
- 不为「更高级」加 WebGL、粒子、shader
- 不提前做在线编辑器与云后端
- 不为抽象而抽象（每加一个 schema 字段都要回答：用户为什么要改、renderer 为什么要知道、能不能从已有字段推导）
