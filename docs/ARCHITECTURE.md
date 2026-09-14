# ARCHITECTURE

Lover-page 是零框架、零构建的纯静态单页应用。所有状态在内存里，所有内容在一个 `config.js`。

## 分层

```
config.js ──► theme.js ──► CSS 变量（令牌）
    │
    ├──► script.js（内容渲染 + 游戏逻辑）
    ├──► state.js（currentStep 状态机 + View Transitions + 章节旅程）
    └──► js/intro.js（第一屏 + site 级背景，ESM）
```

## 模块

### state（state.js）
- `window.appState`：`{currentStep, isMusicPlaying, loveValue}` + 订阅者列表。
- `setState()` 触发订阅者；步骤切换包在 `document.startViewTransition()`（不支持的浏览器直接切换，CSS `sectionIn` 动画兜底）。
- 章节旅程：`journeyFor(step)` 优先读 `config.experience.chapters`，否则用内置 `DEFAULT_JOURNEY`。驱动 `#journeyLabel` 与 `#journeyFill`（进度细线）。
- `body[data-step]` 供 CSS 做步骤级差异（如庆祝页卡片溶解）。

### config（config.js）
唯一内容与主题入口。分五层：`metadata` / `media`（目录约定）/ `theme`（视觉）/ Content（文案与数据，扁平键）/ `experience`（章节）。详见 CONFIG_SCHEMA.md。

### theme（theme.js）
把 `config.colors`、`config.theme.fonts` 写入 CSS 变量。所有样式引用令牌（见 styles.css `:root`），禁止 inline 色值。

### renderer（script.js）
每个章节一个渲染函数：`buildQuizOptions/renderPhoto/renderLetter/nextSurprise` 等。照片与信件遵循同一交互模式（单件展示 + 上一/下一 + 计数），数据驱动、空数组自动跳过章节。

### chapter system
步骤 = `#questionN` section + 一个 kicker + 一个渲染函数。顺序由 HTML 里的 `onclick="showNextQuestion(n)"` 决定；`experience.chapters` 控制旅程标签与进度，`enabled/空数据` 控制跳过。

## 已知约束

- `#bg-canvas` 与混合元素之间不能出现 `position:fixed` 或 `z-index` 祖先（会隔离混合）——见 styles.css 内注释。
- Chrome 合成器：带 `mix-blend-mode` 的元素上跑完 opacity 动画（fill:both）会永久失效——已用 alpha 烘焙素材绕开。
- 子资源缓存：index.html 里的 `?v=N` 参数需在改 CSS/JS 后手动递增。
