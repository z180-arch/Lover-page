# CONFIG_SCHEMA

所有内容在 `config.js`。五层结构（metadata / media / theme / Content / experience），均可独立替换。标 `?` 的字段可省略。

> **这份文档是「怎么改」的教程；字段级权威契约在 `docs/architecture/CONFIG_CONTRACT.md`。**
> 两者冲突时以契约为准。契约里有每个字段的类型、默认值、**实际读取方**、拒绝语义表和诊断 code 表。

## 一条必须先知道的规则：形状 = 默认值的形状

校验层没有独立的 schema 表 —— 它把 `config.js` 的默认值**当作** schema 递归比对：

- 默认值是对象 → 该位置只接受默认值里出现过的 key，**未知字段被拒绝**
- 默认值是数组 → **整体替换**，不逐项合并（所以「删掉一张照片」是可表达的）
- 默认值是空对象 `{}` / 空数组 `[]` → **开放槽位**，形状由你决定（`theme.components` 属于此类）

两个直接后果：

1. **默认值没写的字段，用户就无法通过分享链接设置它。** 所以「可选字段」也必须在默认值里声明 ——
   `photos[]` 的 `focalPoint` 每张图都显式写了，就是这个原因。
2. 渲染层在读、默认值却没有的字段，由 `config-system.js` 的 `EXTRA_SHAPES` 显式补声明
   （例如 `home.enTitle`、`meter.thresholds`、`ending.shareCopiedText`）。

**新增一个可配置字段时，六处必须同步**：默认值 / 执行者 / `CONFIG_CONTRACT.md` / 本文档 /
`examples/` / `tools/qa/config-suite.js`。详见契约 §12。

配置写错时不要靠猜 —— 打开控制台跑 `LPDiagnostics.report()`，或
`LPDiagnostics.list('config')` 看每一条被拒绝/修正的字段（含路径、期望类型、实际值、回退结果）。

> 主题不是「一层」，而是**两层**：`themes/*.js` 里的整套视觉预设（结构层），叠加 `config.theme` 里的实例级覆盖（差异层）。
> 详见下方 `## theme`。渲染管线：`themes/<preset>.js` → `themes/index.js`（解析）→ `theme.js`（合并 + 写 CSS 变量）。

## metadata — 模板实例信息
```js
metadata: { author: "", created: "2026-09", version: "1.0.0", template: "warm-paper" }
```

## media — 素材目录约定
```js
media: { photos: "./assets/photos/", videos: "./assets/videos/",
         audio: "./assets/audio/", voice: "./assets/voice/", art: "./assets/art/" }
```

## theme — 视觉层

### 主题来源与解析

主题名解析优先级（高 → 低）：

| 来源 | 写法 | 用途 |
|---|---|---|
| URL 参数 | `index.html?theme=night-archive` | 对比测试 / 临时预览，**不入库** |
| 实例声明 | `metadata.template: "night-archive"` | 正式来源 |
| 兜底 | `warm-paper` | 保证永远有主题可用 |

主题名打错、文件没加载 → 控制台报错并退回 `warm-paper`，**绝不出现无样式页面**。

### 内置预设

| 名 | 定位 | 关键差异 |
|---|---|---|
| `warm-paper` | 暖纸 · 默认 | 奶油纸底、`#a8544f` 砖红、圆角 14px 面板卡 |
| `night-archive` | 夜档案馆 | `#171412` 暗底、`#ece5db` 墨、圆角 6px、花瓣隐藏、更多章节溶掉面板 |
| `modern-paper` | 现代编辑 | 纯白无面板卡（`panel: transparent` / 圆角 0 / 无阴影）、无衬线正文、`#35506b` 钢蓝 |

注册表：`window.LPThemeRegistry`（`list() / has() / get() / resolve() / requestedName()`）+ `window.LP_THEMES`（预设本体）。
当前主题运行时查询：`window.LPTheme.name()` / `.current()`。

### 实例级覆盖（`config.theme`）

```js
theme: {
  colors: { gradient: ["#f7ece2","#f3d5cb","#f7ddc0","#f2e6d9"],  // mesh gradient 四色
            petalColors: ["#dda3ab", "#c4777f"] },
  fonts:  { body: "", outlier: "" },        // 留空 = 系统衬线栈；可填 webfont 路径或字体名
  hero:   { rose: "…/redoute-gallica-bloom.webp",   // 第一屏主视觉（透明底 webp）
            title: "我们的小小世界", subtitle: "A little world, just for us.",
            enterBtn: "进　入" },
  motion: { gradientSpeed: 700,             // 渐变呼吸速率（u_time/秒，越小越慢）
            gradientAmp: 130,               // 渐变形变幅度
            petalCount: 9,                  // 飘落花瓣数（移动端自动减半）
            petalFallDuration: [12, 22],    // 花瓣下落时长区间（秒）
            burstCount: 24,                 // 落幕花瓣迸发数量
            introFadeMs: 1500 },            // 开场离场总时长
  components: {}                            // 预留：photoStyle / letterStyle / buttonStyle
}
```

**重要：这里只写「与预设不同」的值。** `theme.js` 的 `overrideIfChanged()` 只覆盖与 `warm-paper`
基准不同的字段 —— 这样切换预设时不会被 `config.theme` 里的陈旧默认值拉回暖纸色。
预设里已有的结构（`surface / ink / accent / lines / type / container / mesh / petal / paper`）
不需要在 `config.js` 里重复声明。

### 预设声明的字段（`themes/*.js`）

| 组 | 字段 | 落到 CSS 变量 |
|---|---|---|
| `surface` | `paper / paper2 / paper3 / panel / panelAlt` | `--paper*`、`--panel-bg` |
| `ink` | `ink / soft / faint / muted / canvas` | `--ink`、`--ink-soft`、`--ink-faint`、`--ink-muted`、`--ink-canvas` |
| `accent` | `main / deep / onAccent / soft` | `--accent*`、`--button-color` |
| `lines` | `hairline / hairlineStrong / line / lineStrong` | `--hairline*`、`--ink-line` |
| `type` | `display / body / scale / weight / tracking` | `--font-*`、`--fs-*`、`--fw-*`、`--track-*` |
| `container` | `background / border / radius / shadow / padding / dissolveSteps` | `--panel-*` |
| `fx` / `motion` | 阴影与动效时长 | `--shadow-*` |
| `mesh` / `petal` | 首屏渐变与花瓣色 | `--mesh-*`、`--petal-*`、legacy `--background-color-*` |
| `paper` | `sheet / flap / tape / wash* / seal / accentLine` | `--sheet-bg`、`--flap-bg`、`--tape`、`--wash*`、`--seal` |
| `hero` | `rose` | 第一屏主视觉（留空 = 隐藏） |

**`container.dissolveSteps`**（逗号分隔的 step 清单 + `celebration`）决定哪些章节「溶掉」面板卡 ——
正文直接落在纸底上，解决「八章同一张卡」的同构问题。`state.js` 的 `syncDissolve()` 写入
`body[data-dissolve]`，CSS 据此淡出面板。

### 对比度要求

四档墨色里，落在**最深纸底或面板溶解后**正文上的必须是 `--ink-canvas`（≥4.5:1），
`--ink-faint` 只用于浅底。已用浏览器实测三套主题（见 `docs/design/THEME_REGISTRY.md`），
axe-core 的 `color-contrast` 对本项目**不可信** —— mesh gradient 由 canvas 绘制，工具算不出底色，必须手工换算。

## Content — 内容层（扁平键，向后兼容）
- `home: { title, subtitle, startBtn, enTitle? }`、`valentineName?`
- `person: { name, nickname, avatar, birthday, relationship }`（昵称优先用于首页英文标题）
- `quiz: { text, options[4], answer, correctText, wrongText, nextBtn }`（`options` 为空 → 该章自动跳过）
- `meter: { text, startText, doneText, nextBtn, thresholds?: {normal,high,extreme} }` + `loveMessages`
- `randomQuestions[]`、`smallThings[]`
- `photos[]`：`{ src, caption, width?, height?, alt?, focalPoint?, thumb?, title?, description?, date?, place?/location? }`
  （旧格式 `{src,caption}` 完全兼容，不产生任何警告；thumb 用于索引条，src 用于灯箱原图）。`src` 以 `.mp4/.webm/.mov/.ogg/.m4v` 结尾即按视频渲染。

  | 字段 | 为什么值得填 |
  |---|---|
  | `width` / `height` | **强烈建议填**。原始像素尺寸 —— 有它浏览器才能在图片下载完之前就预留正确高度，否则每次切图都会把下方内容顶一下（CLS 布局偏移）。不知尺寸跑 `node tools/media/image-dims.js assets/photos/*.jpg` |
  | `focalPoint` | `{x, y}` 归一化 0~1 的构图焦点。竖图或主体偏一侧时决定裁切保留哪里，默认 `{0.5, 0.5}` 即居中（= 旧行为） |
  | `alt` | 无障碍替代文本。留空退化为通用描述；信息性图片建议填 |
  | `date` / `place` | 美术馆展签的「日期 · 地点」，留空则整栏不显示 |
- `photoNextBtn`、`photoPrevBtn`（照片章的前后导航文案）
- `story.letters[]`：`{ date?, title, content, image?, audio? }`（空数组 → 该章自动跳过；兼容旧顶层 `letters[]`）
- `story.timeline[]` / `story.memories[]` / `story.promises[]`：预留（时间轴模块）
- `surprises[]`（空数组 → 该章自动跳过）、`ending: { title, message, emojis?, replayBtn, shareCopiedText? }`
- `music: { enabled, autoplay, musicUrl, startText, stopText }`
- `sound: { bgm?, volume, uiTick, tick?, fadeMs?, voiceEnabled, voiceTexts? }`
  - `bgm` 留空沿用 `music.musicUrl`
  - `voiceTexts: { play, pause, error }` —— 语音按钮文案的**唯一**来源
  - `fadeMs: { bgmIn, bgmOut, voiceIn, voiceOut }`、`tick: { freqs, gain, decayMs }`
- `colors: { backgroundStart, backgroundEnd, buttonBackground, buttonHover, textColor }`（母版兼容映射）
- `photoTexts: { empty, error, videoError }`

### 空数据处理（重要）
内容为空的章节会被**自动跳过**，规则集中在 `script.js` 的 `CHAPTER_CONTENT_COUNT`：

| step | 章 | 判空依据 |
|---|---|---|
| 2 | 壹 · 默契 | `quiz.options` |
| 4 | 叁 · 想问你 | `randomQuestions` |
| 5 | 肆 · 小事 | `smallThings` |
| 6 | 伍 · 私人档案 | `photos` |
| 7 | 陆 · 来信 | `story.letters` |
| 8 | 柒 · 惊喜 | `surprises` |

全部为空时直接进入落幕页 —— 不会出现空白页、字面量 `undefined` 或点不动的前进按钮。

## experience — 章节层
```js
experience: { chapters: [
  { step: 2, id: "quiz",    label: "壹", title: "默契", enabled: true, progress: 16 },
  { step: 7, id: "letters", label: "陆", title: "来信", enabled: true, progress: 90 },
  // … 省略 = 使用内置默认（序/壹-柒/终 + 自动进度）
] }
```

| 字段 | 含义 | 谁来读 |
|---|---|---|
| `step` | 对应 `#questionN` 的序号，**主键，不可重复** | `state.js` 路由 |
| `id` | 模块标识（`home / quiz / meter / questions / smallthings / photos / letters / surprise`） | 无耦合读取，便于扩展 |
| `label` | 旅程线编号（序 / 壹 … 柒） | `state.js → journeyFor()` |
| `title` | 本章 kicker 章名，**唯一来源**；留空则不显示 kicker | `script.js → renderChapterKickers()` |
| `enabled` | `false` = 整章跳过（不渲染、不计入进度） | `state.js → chapterEnabled()` |
| `progress` | 进度线百分比 | `state.js → journeyFor()` |

**跳章是双保险**：`enabled: false`（结构层）与内容为空（数据层，见上表 `CHAPTER_CONTENT_COUNT`）
任一成立即跳过。两者独立 —— 想临时关掉一章用 `enabled`，忘了填内容则由判空兜住。

新增章节时：在 `chapters[]` 里加一行 + 在 `index.html` 加对应 `#questionN` 结构，
**不需要动 renderer 的分发逻辑**。

## 分享链接（`?conf=`）

`复制本页链接` 生成的 URL 只携带**与 `config.js` 默认值不同的部分**（diff），加载时深合并回默认值再做 schema 校验。

- 用户直接改 `config.js` 再部署时，diff 天然为空 —— 这是正确的：收件人打开的是同一个站点，内容已在文件里。
- 运行时覆盖（将来的编辑器、控制台调试）才会产生 diff。实测把 `metadata/person/theme/photos/story/sound/experience/pageTitle` 全部改掉后链接约 950 字符；链接超过 8000 字符会在控制台告警。
- 调试：`ValentineConfig.debugSharePayload()` 看 diff 与体积；`ValentineConfig.resolveFromEncoded(conf)` 走一遍与首屏加载完全相同的解析路径。

## 动作层级（渲染约定，不是配置）

每个章节按真实层级取用，保证「只有唯一主行动」：

| 类 | 语义 | 典型 |
|---|---|---|
| `.cute-btn` | solid — 唯一主行动 | 下一个 / 开始玩 |
| `.cute-btn.ghost` | 次级 | 换一个 / 上一张 / 下一封 / 再抽一个 |
| `.cute-btn.text-action` | 最轻 | 再来一个（换提问） |
| `.button-group.paired` | 窄屏成对并排 | 小事 / 档案 / 惊喜章 |

## 未来方向
全息卡片：`photos[]` 条目加 `style: "holo"` 后由渲染器分发。调研结论是 pokemon-cards-css（GPL-3.0）只能借鉴思路，可直接移植的 MIT 候选是 vanilla-tilt.js，需自行叠加 shine/glare 层并提供触摸回退。见 ROADMAP。

> ⚠️ `style` **目前不在契约里** —— 因为它还没有任何渲染层读取方，而契约的规则是
> 「没有读取方的字段不进契约」（见 CONFIG_CONTRACT §7）。加它的正确顺序是：
> **先写渲染器 → 再声明字段 → 六处同步**，而不是先往 `config.js` 里放一个没人读的字段。
