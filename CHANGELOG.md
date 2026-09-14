# Changelog

## 1.1.0 — productize（2026-09-15）

- 设计令牌系统：`:root` 全量令牌（paper/ink/accent/space/motion/font/fx），hallmark gate 48 通过
- 章节旅程：进度细线 + 壹-柒 kicker，`experience.chapters` 可覆盖
- 八章情绪化重构：美术馆展签照片、便签任务、拆信惊喜、电影结尾庆祝（卡片溶解）
- View Transitions（同文档）步骤转场，`sectionIn` 兜底
- 信件/回忆章节（陆·来信）：`story.letters`，空数组自动跳过，语音播放器
- 声音系统：BGM 音量渐变、Web Audio 章节微音效、`sound` 配置化
- config schema：metadata / media / theme / story / experience 分层，旧格式全兼容
- 人物照片移出流程（保留于 assets 供全息卡片）

## 1.0.0 — qa-passed（2026-09-15）

- 第一屏：A 暖奶油背景 + Redouté《Les Roses》玫瑰（白底烘焙 alpha）
- site 级 mesh gradient，全流程同一世界
- 全局视觉系统（去 emoji / 去 three.js / 去网络字体）
- 照片灯箱（GLightbox）、加载态、错误态
- grill-me 终审修复（键盘可访问、照片预取、caption 可读性）

## 1.0.0-baseline

- 母版 valentine2026（MIT）+ 粒子玫瑰第一屏（已被替换，历史保留）
