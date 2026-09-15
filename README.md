# Lover-page

**高级艺术展示型私人情感网页生成系统**——当前仓库是第一个真实案例：一个给特定的人打开时具有强烈情绪反馈的私人互动网页。

打开的人会经历：动态渐变与铜版画玫瑰的开场 → 八个情绪章节（默契、心动、低语、小事、私人档案、来信、惊喜、落幕）→ 花瓣落幕。手机打开即可分享。

## 当前能力

- 动态艺术背景（mesh gradient 呼吸，site 级延续全站）
- 第一屏主视觉（公有领域铜版画玫瑰，alpha 烘焙融入背景）
- **每章独立的视觉语言**——不是「八张一样的卡」：
  - 贰 · 心动 → 模拟仪器（SVG 刻度盘、阻尼指针、量程限位、爆表峰值标记）
  - 叁 · 想问你 → 编辑设计引文（folio 编号、细线、`text-wrap: pretty`）
  - 肆 · 小事 → 便签纸（横格与 `line-height` 严格对齐、胶带、装订线）
  - 伍 · 私人档案 → 美术馆展签 + 联系印样缩略图索引
  - 柒 · 惊喜 → 信封开合（翻盖后仰、信纸从袋口升起）
- 私人照片档案馆（展签、揭幕动画、全屏灯箱、联系印样索引）
- 照片按**原始像素尺寸**预留高度（`photos[].width/height`）+ `focalPoint` 裁切焦点 —— 切图不再顶动下方内容
- 信件系统（含语音播放）
- 互动测试（默契问答、Love Meter）、随机问题与小任务
- 声音系统（BGM 音量渐变、章节微音效、语音）
- 内容为空数组的章节自动跳过，全部为空直接进落幕——不会出现空白页或点不动的按钮
- 全部内容与主题由 `config.js` 驱动；复制本页链接只携带与默认值的差异
- **配置写错会告诉你哪里错**：`?conf=` 载荷经过严格 schema 校验（未知字段 / 类型不符 / 原型污染一律拒绝），
  每条拒绝都进 `window.LPDiagnostics` 可机读通道。字段契约见 [docs/architecture/CONFIG_CONTRACT.md](docs/architecture/CONFIG_CONTRACT.md)
- 无障碍：WCAG AA 对比度（axe-core 实测 0 violations）、触摸目标 ≥44px、支持 `prefers-reduced-motion`

## 快速开始

```bash
python -m http.server 8000   # 打开 http://127.0.0.1:8000
```

改内容只动 `config.js`；做自己的主题见 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)。

## 测试

零依赖、不需要浏览器、不需要装任何东西（改配置或渲染逻辑后先跑这三个）：

```bash
node tools/qa/config-suite.js      # 配置契约 / 安全 / 兼容（99 断言）
node tools/qa/module-suite.js      # js/core + js/chapters 纯函数（63 断言）
node tools/qa/innerhtml-guard.js   # HTML 注入点转义守卫
```

真实浏览器 QA（需要 `agent-browser`）：

```bash
python -m http.server 8899 --bind 127.0.0.1 &
tools/qa/run.sh steps-mobile-320.txt     # 320px 完整八章流程
tools/qa/run.sh steps-regression.txt     # 信封几何 / 胶囊重叠 / 触摸目标回归
tools/qa/run.sh steps-config-security.txt # 注入面 / 尺寸预留 / 非法配置诊断
```

见 [tools/qa/](tools/qa/) 与 [AGENTS.md](AGENTS.md) §5（含已踩过的坑）。

## 文档

- [AGENTS.md](AGENTS.md) — **改这个仓库前先读这份**（铁律 + 标准循环 + 命令速查）
- [docs/architecture/CONFIG_CONTRACT.md](docs/architecture/CONFIG_CONTRACT.md) — 配置字段的**权威契约**（类型/默认值/读取方/拒绝语义）
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 架构、章节视觉语言、无障碍基线、已知约束
- [docs/CONFIG_SCHEMA.md](docs/CONFIG_SCHEMA.md) — config 字段全解（教程视角）
- [docs/architecture/CURRENT_STATE.md](docs/architecture/CURRENT_STATE.md) — 事实快照 + 已知问题
- [docs/qa/PERFORMANCE_BASELINE.md](docs/qa/PERFORMANCE_BASELINE.md) — 实测性能基线（LCP / CLS / TTFB / FCP）
- [docs/design/COMPOSITION_SYSTEM.md](docs/design/COMPOSITION_SYSTEM.md) — 六种构图与逐章叙事骨架分析
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — 开发约束与测试清单
- [docs/MEDIA_GUIDE.md](docs/MEDIA_GUIDE.md) — 素材规格
- [docs/ROADMAP.md](docs/ROADMAP.md) — 当前阶段 / V2 编辑器 / V3 生成器
- [CHANGELOG.md](CHANGELOG.md) — 版本变更

## 未来方向

用户上传照片、语音、音乐、文字，选择主题，自动生成一个手机打开即可访问的私人情感网页（见 ROADMAP）。

## Credits

见 [THIRD_PARTY.md](THIRD_PARTY.md)（mesh-gradient.js MIT · Redouté 版画公有领域 · valentine2026 母版 MIT）。
