# CONFIG_SCHEMA

所有内容在 `config.js`。五层结构，均可独立替换。标 `?` 的字段可省略。

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

## Content — 内容层（扁平键，向后兼容）
- `home: { title, subtitle, startBtn, enTitle? }`、`valentineName?`
- `person: { name, nickname, avatar, birthday, relationship }`（昵称优先用于首页英文标题）
- `quiz: { text, options[4], answer, correctText, wrongText, nextBtn }`（`options` 为空 → 该章自动跳过）
- `meter: { text, startText, doneText, nextBtn, thresholds?: {normal,high,extreme} }` + `loveMessages`
- `randomQuestions[]`、`smallThings[]`
- `photos[]`：`{ src, caption` + 可选 `thumb, title, date, place/location, description }`（旧格式 `{src,caption}` 完全兼容；thumb 用于索引条，src 用于灯箱原图）. `src` 以 `.mp4/.webm/.mov/.ogg/.m4v` 结尾即按视频渲染
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
  { step: 2, id: "quiz",   label: "壹", progress: 16, enabled: true },
  { step: 7, id: "letters", label: "陆", progress: 90, enabled: true },
  // … 省略 = 使用内置默认（序/壹-柒/终 + 自动进度）
] }
```
`label` / `progress` 覆盖旅程线；留空则用内置默认。

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
全息卡片：`photos[]` 条目加 `style: "holo"` 后由渲染器分发。数据接口已就位；调研结论是 pokemon-cards-css（GPL-3.0）只能借鉴思路，可直接移植的 MIT 候选是 vanilla-tilt.js，需自行叠加 shine/glare 层并提供触摸回退。见 ROADMAP。
