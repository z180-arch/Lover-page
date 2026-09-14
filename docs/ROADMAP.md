# ROADMAP

## V1 — 模板化（当前阶段）
- [x] Theme / Content / Experience 三层 schema
- [x] 章节旅程数据化、空章节自动跳过
- [x] 照片展签（date/location/description/thumb）
- [x] 信件系统（含语音播放）
- [ ] 剩余硬编码迁移（架构评审清单）：Sound.tick 频率/增益 → `sound.tick`；花瓣与迸发数量 → `theme.motion`；开场/BGM/语音淡入淡出时长 → `motion/sound.fadeMs`；照片与语音占位文案 → content；分享成功文案 → `ending.shareCopiedText`；validateConfig 旧粉默认值清除；mesh `amp` → `theme.motion.gradientAmp`
- [ ] 照片全息卡片（`photos[].style:"holo"`）：参考 LerSent001/holo-card（MIT）输出自包含 HTML 嵌入，或按 pokemon-cards-css（GPL-3.0，仅借鉴）手写 tilt+blend
- [ ] 主题预设包（warm-paper 之外的 1-2 套：如 night-rose、ink-garden）
- [ ] 字体子集化：按 config 实际字符生成 Noto Serif SC 子集 webfont（解决 Windows/安卓宋体渲染）

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
- Astro Content Collections：给 config.json 做结构校验（可用 config-system.js 扩展，改 JSON 不改代码才可靠）
- Hugo 主题层叠：代码永远是模板，用户侧只放 config + assets 覆盖
