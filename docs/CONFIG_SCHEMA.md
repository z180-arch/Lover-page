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
            petalColors: ["#dda3ab","#c4777f"] },
  fonts:  { body: "", outlier: "" },        // 留空 = 系统衬线栈；可填 webfont 路径或字体名
  hero:   { rose: "…/redoute-gallica-bloom.webp",   // 第一屏主视觉（透明底 webp）
            title: "我们的小小世界", subtitle: "A little world, just for us.",
            enterBtn: "进　入" },
  motion: { gradientSpeed: 700 },           // 渐变呼吸速率（u_time/秒，越小越慢）
  components: {}                            // 预留：photoStyle / letterStyle / buttonStyle
}
```

## Content — 内容层（扁平键，向后兼容）
- `home: { title, subtitle, startBtn, enTitle? }`、`valentineName?`
- `quiz: { text, options[4], answer, correctText, wrongText, nextBtn }`
- `meter: { text, startText, doneText, nextBtn, thresholds?: {normal,high,extreme} }` + `loveMessages`
- `randomQuestions[]`、`smallThings[]`
- `photos[]`：`{ src, caption` + 可选 `thumb, title, date, location, description }`（旧格式 `{src,caption}` 完全兼容；thumb 用于轮播，src 用于灯箱原图）
- `story.letters[]`：`{ date?, title, content, image?, audio? }`（空数组 → 该章自动跳过；兼容旧顶层 `letters[]`）
- `story.memories[]`：`{ date, text, photo }`（预留时间轴模块）
- `surprises[]`、`ending: { title, message, emojis?, replayBtn }`
- `music: { enabled, autoplay, musicUrl, startText, stopText }`
- `sound: { bgm?, volume, uiTick, voiceEnabled }`（bgm 留空沿用 music.musicUrl）
- `colors: { backgroundStart, backgroundEnd, buttonBackground, buttonHover, textColor }`（母版兼容映射）

## experience — 章节层
```js
experience: { chapters: [
  { step: 2, id: "quiz",   label: "壹", enabled: true },
  { step: 7, id: "letters", label: "陆", enabled: true, style: "letters" },
  // … 省略 = 使用内置默认（序/壹-柒/终 + 自动进度）
] }
```
`label`/`progress` 覆盖旅程线；`enabled:false` 或数据为空的章节自动跳过（letters 已实现，其余章节预留）。

## 未来方向
全息卡片：`photos[]` 条目加 `style: "holo"` 后由渲染器分发（数据接口已就位，见 ROADMAP V1.2）。
