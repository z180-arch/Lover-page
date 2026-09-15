# ADR-004 — Media 系统

- **状态**：Accepted（部分实施）
- **日期**：2026-09-15
- **相关**：`docs/MEDIA_GUIDE.md`、ADR-005

## Context

素材通过 `config.media` 声明的目录约定引用（不引入「素材清单」这种第二真相源）：

```js
media: {
  photos: "./assets/photos/", videos: "./assets/videos/",
  audio: "./assets/audio/",   voice: "./assets/voice/", art: "./assets/art/"
}
```

实际使用形态：

```js
photos: [{ src, thumb, caption, description, date, place, title }]
story.letters: [{ date, title, content, image, audio }]
sound: { bgm, volume, uiTick, tick, fadeMs, voiceEnabled, voiceTexts }
```

灯箱用本地化的 **GLightbox（MIT）**，视频走内联 `<video>` 播放。

## Problem

1. **没有图片尺寸信息。** `renderPhoto()` 只有 `src`，图片加载完成前容器高度未知
   → 触发 CLS。而 `PHOTO_SIZE` 之类的固定宽高比在真实照片上会裁切。
2. **没有坐标化的裁切意图。** 竖构图人物照放进横容器时，只能居中裁 ——
   主体的脸可能被切掉（`object-position` 无法从 config 控制）。
3. **没有响应式候选。** 所有设备下载同一份图；`thumb` 与 `src` 是仅有的两档，
   且 `thumb` 只用于联系印样。
4. **没有格式协商。** WebP/AVIF 是手工转好的单份文件，不是 `<picture>` 候选。
5. **没有懒加载策略分层**：首图 / 相邻预取 / 远处懒加载是硬编码在 renderer 里的。
6. **素材来源与许可证没有结构化记录** —— 只在 `THIRD_PARTY.md` 里以散文记录。

## Options

| 方案 | 说明 | 评价 |
|---|---|---|
| A 现状 | `src` + `thumb` + `caption` | 简单，但 CLS 与裁切问题无解 |
| B 引入图片服务/CDN 做变换 | 云端 `?w=` 参数 | **拒绝**：破坏「静态、可离线、可自托管」的核心属性 |
| C **扩展 media schema + 离线预处理脚本** | config 声明 `width/height/focalPoint/tags/srcset`；由 `tools/media/` 里的离线脚本生成候选尺寸 | **采用** |
| D 引入 `<img loading=lazy>` + 原生 `srcset` 而不做预处理 | 需要手工准备多份 | 与 C 相同，但把负担留给用户 —— C 把这一步自动化 |

## Decision

### 1. media schema 扩展方向

```js
{
  src,                    // 展示用（full）
  thumb,                  // 索引/胶片条用
  alt,                    // 无障碍必需（缺省会从 caption 派生并告警）
  caption,                // 短说明（展签下方）
  description,            // 长说明（灯箱内）
  title,                  // 灯箱/索引的可读名
  date, place,            // 展签（美术馆惯例：时间 + 地点）
  width, height,          // **必需**：用于 aspect-ratio 占位 → 消除 CLS
  focalPoint: [x, y],     // 裁切焦点（0–1），映射到 object-position
  srcset: [{ src, width }],// 响应式候选（离线生成）
  tags                    // 未来：筛选/分组
}
```

音频：

```js
{ src, title, artist, duration, volume, loop }
```

语音（信件用）：

```js
{ src, transcript, chapter }
```

### 2. 分阶段实施顺序（按「用户能感知到的收益 / 成本」排序）

| 优先级 | 项 | 理由 |
|---|---|---|
| P0 | `width` / `height` → `aspect-ratio` 占位 | 直接消除 CLS，改动小 |
| P0 | `focalPoint` → `object-position` | 竖构图人物照不被切脸，改动小 |
| P1 | `alt` 缺失告警（语义校验层，见 ADR-002） | 无障碍；当前 `alt` 取 `p.title \|\| '回忆'`，语义弱 |
| P1 | `srcset` + 离线预处理脚本 | 移动端流量与 LCP |
| P2 | WebP/AVIF 协商（`<picture>`） | 需要在同一次离线处理里产出多格式 |
| P2 | `tags` 筛选 | 需要真实素材规模支撑，否则是空功能 |

**刻意不做**：素材清单文件（`manifest.json`）。
`config.js` 已经是唯一真相源；再加一层清单会引入同步问题。

### 3. 离线预处理，不做构建系统

多尺寸/多格式的生成放在 `tools/media/` 下的**独立脚本**，由用户在有需要时手动跑一次，
产物提交进仓库。**这不是构建步骤** —— 网页运行时仍然零构建、零依赖。

这与「字体子集化」是同一模式（见 ADR-005 / ROADMAP）。

### 4. 素材来源与许可证结构化

新增素材时必须记录：`author` / `source`（URL）/ `license` / `retrieved`。
优先来源：Wikimedia Commons、Openverse、Unsplash、Pexels、NASA、Gallica、
Internet Archive、Rawpixel Public Domain。

**艺术作品优先 Public Domain / CC0 / 明确允许商用。**

## Trade-offs

- 接受「用户要为每张照片填 `width/height`」这一负担。
  **缓解**：离线脚本可以自动回填（读图元数据），用户只需跑一次。
- `srcset` 增加配置体积；分享链接只携带 diff，且部署型用法里 config 随站点走，
  所以体积不是问题（详见 ADR-002 的 diff 论证）。

## Migration

**本轮未改动 media 数据结构**（避免与主题层改动混在一起，违反「分阶段独立提交」）。
已完成的相邻工作：照片章的面板溶解（section 6 在 `night-archive` 下溶解，
让照片直接落在背景上）已由 ADR-003 的 `container.dissolveSteps` 覆盖。

**下一轮第一优先项**：`width`/`height`/`focalPoint` 三个字段 + renderer 消费 +
`docs/MEDIA_GUIDE.md` 更新。这是本 ADR 明确指定的实施起点。
