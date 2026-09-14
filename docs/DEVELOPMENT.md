# DEVELOPMENT

## 运行

```bash
python -m http.server 8000
# 打开 http://127.0.0.1:8000
```

直接双击 index.html 大部分功能可用；音频/灯箱建议走 http。

## 改内容

只改 `config.js`。字段说明见 [CONFIG_SCHEMA.md](CONFIG_SCHEMA.md)。改完刷新即可。

## 做自己的主题

1. 复制 `assets/art/` 里的处理流程：主视觉图需**白底转 alpha**（透明 webp/png），第一屏才能融进渐变。
2. 改 `config.theme`：`colors.gradient`（四色）、`hero`（图+三行文案）、`motion.gradientSpeed`。
3. 可选：`config.theme.fonts` 填字体名或本地 webfont 路径。
4. 强调色等令牌在 `styles.css :root`，与 `config.colors` 保持一致。

## 修改代码后

index.html 引用的本地资源带 `?v=N` 版本参数。改了 CSS/JS 后**递增 N**，否则浏览器缓存会给你旧文件。

## 约束（改代码前必读）

- 玫瑰/混合元素祖先链上禁止 `position:fixed`、`z-index`、`opacity<1` 动画（会破坏混合或触发 Chrome 合成器 bug）。
- 所有颜色/字体/间距/时长必须走 `:root` 令牌。
- 动效必须有 `prefers-reduced-motion` 兜底。
- 可点击文字禁止换行（窄屏用单列布局解决）。

## 测试清单

320 / 375 / 390 / 414 / 1440 五档走完整流程（开场→八章→终→replay）；检查横向滚动、按钮换行、音频解锁、灯箱、快速连点。
