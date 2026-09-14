# MEDIA GUIDE — 素材规范

所有素材放 `config.media` 约定的目录，文件名用英文小写 + 连字符（如 `2026-04-lake.webp`），避免中文与空格。

## 照片

| 项 | 规格 |
|---|---|
| 格式 | WebP 优先（JPG 兜底） |
| 轮播图（thumb） | 宽 ≤640px，质量 q75，单张 <100KB |
| 灯箱原图（full） | 长边 ≤1600–2000px，质量 q80，单张 150–400KB |
| 原始底片 | 备份在仓库外，不入 Git |

字段映射：`src` = 灯箱原图，`thumb` = 轮播小图（省略则用 src），`title` = alt 文本，`date`/`location` = 展签，`description` = 说明文字。

批量转换：`magick *.jpg -resize 1600x -quality 80 out.webp`

## 视频

- 格式：WebM(VP9) 优先 + MP4(H.264) 兜底，`<video>` 双 `<source>`
- 单段 ≤3MB、时长 ≤10s；**禁止 GIF**（体积大 5–100 倍）
- 每段配 poster 静帧（webp/jpg，第一帧即可）
- 属性必须齐全：`muted loop playsinline`，否则移动端无法自动播放

## 音频

| 类型 | 格式 | 建议 |
|---|---|---|
| BGM | MP3 128kbps | 3–5 分钟，`assets/audio/bgm.mp3`，音量在 `sound.volume` 调 |
| 语音 | MP3/M4A 单声道 96kbps | 单条 ≤60s，放 `assets/voice/`，填入信件 `audio` 字段 |

音量渐变时长在 `sound.fadeMs`，微音效音色在 `sound.tick`。

## 图像处理速查

```bash
# JPG → WebP
magick input.jpg -resize 1600x -quality 80 output.webp
# 白底 → 透明（第一屏主视觉用，等价 multiply 效果）
# 参考 assets/art/redoute-gallica-bloom.webp 的生成方式（见 git 历史脚本）
```

## 参考

- [web.dev: Serve responsive images](https://web.dev/articles/serve-responsive-images)
- [web.dev: Image performance](https://web.dev/learn/performance/image-performance)
