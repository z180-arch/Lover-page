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
- 三档墨色（`--ink` / `--ink-soft` / `--ink-faint`）必须是**实色**：alpha 叠在 mesh gradient 上对比度不可预测，且会掉到 WCAG AA 以下。新加小字前先核对对比度（对 `--paper` 需 ≥ 4.5:1）。
- 交互元素命中区 ≥ 44px。视觉可以更小，用 `min-height` 放大命中区（不要靠加 padding 把视觉撑大）。
- 媒体查询里 `padding` 之类的**简写会吃掉更宽断点的单条属性**：`≤360px` 里写 `padding` 会把 `≤480px` 设的 `padding-top` 覆盖掉，必须重声明。
- 新增章节 = `#questionN` section + kicker + 渲染函数 + `showNextQuestion` 串联 + 在 `CHAPTER_CONTENT_COUNT` 加一行（保证空数据自动跳过）。
- 每章要有自己的视觉语言；禁止「kicker + 标题 + 一排同款实心按钮」的新章节。动作按 solid / ghost / text 三级取用（见 ARCHITECTURE 的动作层级）。

## 测试清单

### 手动
320 / 375 / 390 / 414 / 1440 五档走完整流程（开场→八章→终→replay）；检查横向滚动、按钮换行、音频解锁、灯箱、快速连点。

### 自动化（真实浏览器）

```bash
python -m http.server 8899 --bind 127.0.0.1 &
tools/qa/run.sh steps-mobile-320.txt    # 完整流程 + 每步布局诊断
tools/qa/run.sh steps-regression.txt    # 信封几何 / 音乐胶囊重叠 / 触摸目标
```

`tools/qa/` 里的 `diag.js`（横向溢出、触摸目标、可见按钮）、`check.js`（信封三态几何、胶囊与进度线是否重叠）、`env.js`、`share.js`（分享链接 diff 往返）。

补充：改内容/样式后跑一次 axe-core（`agent-browser a11y --tags wcag2a,wcag2aa,wcag21a,wcag21aa`）。当前基线是 **0 violations**；若出现 `incomplete: color-contrast`，多半是 canvas 背景让工具算不出底色，需要手工数值核对，不要当成已通过。

