# Lover-page

**高级艺术展示型私人情感网页生成系统**——当前仓库是第一个真实案例：一个给特定的人打开时具有强烈情绪反馈的私人互动网页。

打开的人会经历：动态渐变与铜版画玫瑰的开场 → 八个情绪章节（默契、心动、低语、小事、私人档案、来信、惊喜、落幕）→ 花瓣落幕。手机打开即可分享。

## 当前能力

- 动态艺术背景（mesh gradient 呼吸，site 级延续全站）
- 第一屏主视觉（公有领域铜版画玫瑰，alpha 烘焙融入背景）
- 私人照片档案馆（展签、揭幕动画、全屏灯箱）
- 信件系统（含语音播放）
- 互动测试（默契问答、Love Meter）、随机问题与小任务
- 声音系统（BGM 音量渐变、章节微音效、语音）
- 全部内容与主题由 `config.js` 驱动

## 快速开始

```bash
python -m http.server 8000   # 打开 http://127.0.0.1:8000
```

改内容只动 `config.js`；做自己的主题见 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)。

## 文档

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 架构与模块
- [docs/CONFIG_SCHEMA.md](docs/CONFIG_SCHEMA.md) — config 字段全解
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — 开发约束与测试清单
- [docs/ROADMAP.md](docs/ROADMAP.md) — V1 模板化 / V2 编辑器 / V3 生成器

## 未来方向

用户上传照片、语音、音乐、文字，选择主题，自动生成一个手机打开即可访问的私人情感网页（见 ROADMAP）。

## Credits

见 [THIRD_PARTY.md](THIRD_PARTY.md)（mesh-gradient.js MIT · Redouté 版画公有领域 · valentine2026 母版 MIT）。
