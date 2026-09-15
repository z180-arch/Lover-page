# CONFIG_CONTRACT — 配置契约

> **这份文档是配置的唯一权威契约。** `config.js`（默认值）与 `config-system.js`（执行者）
> 都必须与它一致。三者不一致时，**以本文档为准去改代码**，不要反过来改文档去迎合代码。

| 角色 | 文件 | 职责 |
|---|---|---|
| 默认值 / 基准 | `config.js` → `window.DEFAULT_CONFIG` | 提供每个字段的类型与形状，也是分享链接 diff 的基准 |
| 执行者 | `config-system.js` | 校验不可信输入、安全深合并、生成/解析分享链接 |
| 契约 | 本文档 | 说明字段语义、读写双方、兼容规则与变更流程 |

阅读顺序建议：先看 §1 的不变量，再看 §5 的 `EXTRA_SHAPES`（最容易踩的坑），
然后按需查 §6 的字段表。

---

## 1. 核心规则：形状就是默认值的形状

校验层没有一份独立的 schema 表 —— 它把 `DEFAULT_CONFIG` **当作** schema 递归比对：

- 默认值是**对象** → 该位置是对象，且**只允许默认值里出现过的 key**（未知 key 拒绝）
- 默认值是**数组** → 该位置是数组；数组**整体替换**（不逐项合并）；项形状取自默认值第一项
- 默认值是**字符串 / 数字 / 布尔** → 该位置是叶子，类型必须一致
- 默认值是**空对象 `{}` / 空数组 `[]`** → 该位置是**开放槽位**，形状由用户决定（见 §4）

这条规则的直接后果：**默认值没写的字段，用户就无法通过分享链接设置它。**
这是刻意的取舍（宁可拒绝也不要静默接受未知字段），但它有一个真实代价 ——
见 §5。

### 五个不变量

1. **默认值永不被污染。** `DEFAULT_CONFIG` 是 diff 的基准，运行时拿到的是深拷贝。
   任何路径都不能改到基准，否则分享链接会带上虚假差异。
2. **非法输入不进入运行时。** 校验发生在合并**之前**（顺序见 §2）。非法值被丢弃后，
   该位置**保留默认值**，而不是变成空/残缺。
3. **`?conf=` 是唯一的不可信入口。** 任何来自 URL 的东西都必须走完整管线。
4. **契约外的字段不可达。** 新增一个用户能设置的字段 = 同时更新默认值（或 `EXTRA_SHAPES`）
   + 渲染层读取方 + 文档 + QA。
5. **没有读取方的字段不进契约。** 每个字段都要能回答「用户为什么要改、renderer 为什么要知道」。

---

## 2. 校验管线

```
window.DEFAULT_CONFIG  ─┐
                        ├─→ validate(diff, DEFAULTS)  →  mergeSafe(clone(DEFAULTS), clean)  →  VALENTINE_CONFIG
?conf= → decodeConfig ──┘        ↑ 先校验 diff                     ↑ 再合并
```

**顺序是契约的一部分。** 早期实现是「先深合并、再 sanitize 合并结果」，有两个后果：

1. 未知字段与类型错误的值会先被合并进来，sanitize 只看值的类型、从不检查 key 是否在契约里 ——
   于是「拒绝未知字段」这条结论从来没有真正成立过；
2. 非法值被丢弃后**默认值也一起丢了**。例：`quiz.answer` 收到字符串 `"two"`，
   结果是 `answer` 字段整个消失，而不是回退到默认的 `2`。

改成「先校验 diff」之后，非法部分根本不会进入合并，默认值天然保留。

校验失败（例如深嵌套导致递归异常）时 `resolveConfig()` 捕获异常并**整体回退默认配置**，
绝不返回半残对象；同时走 `console.error` 与诊断通道。

---

## 3. 硬上限（`ValentineConfig.LIMITS`）

| 限制 | 值 | 超限行为 | 诊断 code |
|---|---|---|---|
| 单个字符串 | 4000 字符 | 截断 | `string-too-long` |
| 单个数组元素数 | 500 | 截断 | `array-too-long` |
| 嵌套深度 | 8 | 丢弃该子树 | `depth-exceeded` |
| 单个对象 key 数 | 300 | 截断 | `too-many-keys` |
| `?conf=` 参数长度 | 24000 字符 | **解码前**直接拒绝整个链接 | `payload-too-long` |
| 分享链接软上限 | 8000 字符 | 仍可用，`console.warn` 提示可能被聊天软件截断 | —（仅警告） |

`encoded` 上限在 `atob` 之前检查：解码一个几 MB 的字符串没有任何合法用途，
而且它是唯一能让「打开链接」变成拒绝服务的手段。

---

## 4. 安全规则

### 4.1 危险键（任何层级）

`__proto__` / `constructor` / `prototype` 一律丢弃，code = `dangerous-key`。

**这不是理论风险。** `JSON.parse('{"__proto__":{"x":1}}')` 会把 `__proto__` 建成
**自有属性**（不是原型访问器），所以它真的能走到合并逻辑里，在旧实现下确实污染了
`Object.prototype`。实测可复现，见 `tools/qa/config-suite.js` 第 3 组（6 个探针）。

三层防护：

1. `validate()` / `validateOpen()` 丢弃危险键；
2. `mergeSafe()` 二次跳过（防御未来新增的旁路）；
3. 赋值一律走 `define()`（`Object.defineProperty`）—— 既不会触发 setter，
   也不会因为 key 是 `__proto__` 而变成原型赋值。

### 4.2 开放槽位

默认值是**空容器**的位置代表「形状由用户决定」：

- `theme.components`（`{}`）—— 预留给 `photoStyle / letterStyle / buttonStyle`
- `story.timeline` / `story.promises` / `story.memories`（`[]`）

这些位置**不做 key 白名单**，但**其它所有安全规则照常执行**（深度、长度、
危险键、类型）。用户在开放槽位里用了对象型值时记一条 `outside-contract`
（标量不记 —— 标量是开放槽位的正常用法，`"photoStyle": "holo"` 就是标量）。

---

## 5. `EXTRA_SHAPES` —— 默认值没展示、但渲染层确实支持的字段

因为「形状 = 默认值的形状」，而默认值是**范例**（只展示常用字段），
下面这些字段虽然渲染层在读，却不在任何默认值里。加固成「拒绝未知字段」之后，
它们会被当未知字段误伤 —— **这是实测撞到的真实回归**（4 个），
所以在 `config-system.js` 里用 `EXTRA_SHAPES` 显式声明。

| 路径 | 补充的字段 | 谁在读 |
|---|---|---|
| `photos[]` | `title` `description` `date` `place` `location` `thumb` | `script.js:478`（展签 date·place）、`script.js:486`（description/caption）、`script.js:455,563`（thumb） |
| `story.timeline[]` | `date` `title` `text` `photo` | 预留模块项形状（默认值是空数组，无法展示形状） |
| `story.promises[]` | `date` `text` | 同上 |
| `story.memories[]` | `date` `text` `photo` | 同上 |
| `letters[]` | `date` `title` `content` `image` `audio` | 顶层 legacy 别名的项形状，与 `story.letters` 一致 |
| `home` | `enTitle` | `script.js:104` 首页英文手写标题 |
| `meter` | `thresholds.{normal,high,extreme}` | `script.js:329` 默契值分档文案 |
| `ending` | `shareCopiedText` | `script.js:934` 复制成功后的按钮文案 |
| `''`（根） | `letters` | `script.js:224/622/675` 的 `config.letters` 回退路径 |

**规则**：`EXTRA_SHAPES` 只**补充**字段，绝不把整个对象变成开放槽位。
`home.evilField` 依然被拒绝（`config-suite.js` 第 10 组用负向断言锁住了这一点）。

新增字段的判断顺序：

1. 它出现在默认值里吗？是 → 本表**无需**改动（默认值优先）。
2. 渲染层读它吗？（`grep -oE "config\.[A-Za-z0-9_]+" script.js | sort -u`）读 → **必须**加进本表。
3. 只是「预留」、没有任何读取方 → **不要加**。见 §7。

---

## 6. Schema 逐字段表

> 「读取方」列是**实测 grep 出来的**，不是推断。表里为空的位置说明当前没有任何读取方。

### 6.1 Metadata Schema

| 字段 | 类型 | 默认 | 读取方 | 说明 |
|---|---|---|---|---|
| `metadata.author` | string | `""` | — | 制作人署名 |
| `metadata.created` | string | `"2026-09"` | — | 实例创建时间（自由文本，不解析） |
| `metadata.version` | string | `"1.0.0"` | — | 实例版本 |
| `metadata.template` | string | `"warm-paper"` | `themes/index.js:42` | **主题预设名**，解析优先级见 §6.3 |

### 6.2 Media Schema（目录约定）

| 字段 | 类型 | 默认 | 读取方 |
|---|---|---|---|
| `media.photos` | string | `"./assets/photos/"` | — |
| `media.videos` | string | `"./assets/videos/"` | — |
| `media.audio` | string | `"./assets/audio/"` | — |
| `media.voice` | string | `"./assets/voice/"` | — |
| `media.art` | string | `"./assets/art/"` | — |

纯文档用途（告诉使用者「把文件放哪」）。素材路径在每个引用它们的字段里**各写一次**，
本组字段不参与路径拼接 —— 这是刻意的：URL 里拼路径会让相对路径语义变得不可预测。

### 6.3 Theme Schema

主题是**两层**：`themes/<preset>.js` 是结构（完整视觉语言），`config.theme` 是差异
（只写与 `warm-paper` 基准不同的值）。`theme.js` 的 `overrideIfChanged()` 只覆盖
「与基准不同」的字段 —— 所以**不要在 `config.theme` 里写预设已有的默认值**，
那会把切换预设的效果拉回基准。

解析优先级：`?theme=<name>`（URL，不入库）> `metadata.template` > `warm-paper`。
主题名无法解析时退回 `warm-paper` 并报错，绝不出现无样式页面。

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `theme.colors.gradient` | string[4] | 暖纸四色 | mesh 渐变四色 |
| `theme.colors.petalColors` | string[2] | `["#dda3ab","#c4777f"]` | 花瓣双色 |
| `theme.fonts.body` | string | `""` | 留空 = 系统衬线栈 |
| `theme.fonts.outlier` | string | `""` | 标题/点缀字体 |
| `theme.hero.rose` | string | 玫瑰 webp 路径 | 第一屏主视觉，留空 = 隐藏 |
| `theme.hero.title` | string | `"我们的小小世界"` | 第一屏标题 |
| `theme.hero.subtitle` | string | `"A little world, just for us."` | 第一屏副标题 |
| `theme.hero.enterBtn` | string | `"进　入"` | 进入按钮 |
| `theme.motion.gradientSpeed` | number | `700` | 渐变呼吸速率（越小越慢） |
| `theme.motion.gradientAmp` | number | `130` | 渐变形变幅度 |
| `theme.motion.petalCount` | number | `9` | 花瓣数（移动端自动减半） |
| `theme.motion.petalFallDuration` | number[2] | `[12,22]` | 下落时长区间（秒） |
| `theme.motion.burstCount` | number | `24` | 落幕花瓣迸发数 |
| `theme.motion.introFadeMs` | number | `1500` | 开场离场总时长 |
| `theme.components` | object | `{}` | **开放槽位**，预留 `photoStyle / letterStyle / buttonStyle` |

**数字字段没有区间校验**（`petalCount: 99999` 会被接受）。夹取是渲染层的责任 ——
契约层只保证类型与安全。改这里要同步改渲染层。

### 6.4 Content Schema

顶层扁平键。所有 `*Btn` / `*Text` 类字段都是 string，默认值即文案。

| 字段 | 类型 | 默认 | 读取方 / 备注 |
|---|---|---|---|
| `pageTitle` | string | `"和你一起玩"` | `script.js` 写入 `<title>` |
| `valentineName` | string | `""` | `script.js` 生成首页英文标题前缀 |
| `home.title` | string | `"今天想和我玩什么？"` | |
| `home.subtitle` | string | `"随便选一个"` | |
| `home.startBtn` | string | `"开始玩"` | |
| `home.enTitle` | string | — **见 §5** | `script.js:104`，留空则用 `'my love...'` |
| `quiz.text` | string | — | |
| `quiz.options` | string[4] | 4 个选项 | **空数组 → 该章自动跳过** |
| `quiz.answer` | number | `2` | 正确选项下标（0 起） |
| `quiz.correctText` / `wrongText` | string | — | |
| `quiz.nextBtn` | string | `"下一个"` | |
| `meter.text` / `startText` / `doneText` / `nextBtn` | string | — | |
| `meter.doneDelayMs` | number | `900` | 小结停留时长 |
| `meter.thresholds.{normal,high,extreme}` | number | — **见 §5** | `script.js:329` |
| `loveMessages.{extreme,high,normal}` | string | — | 滑块越过分档时的文案 |
| `randomQuestions` | string[] | 6 条 | **空数组 → 该章自动跳过** |
| `questionAgainBtn` / `questionNextBtn` | string | — | |
| `smallThingsTitle` | string | — | |
| `smallThings` | string[] | 53 条 | **空数组 → 该章自动跳过** |
| `smallThingAgainBtn` / `smallThingNextBtn` | string | — | |
| `photoNextBtn` / `photoPrevBtn` | string | — | |
| `letterAgainBtn` / `letterNextBtn` | string | — | |
| `surpriseBtn` / `surpriseAgainBtn` / `surpriseNextBtn` | string | — | |
| `surprises` | string[] | 5 条 | **空数组 → 该章自动跳过** |
| `ending.title` / `message` / `emojis` / `replayBtn` | string | — | |
| `ending.shareCopiedText` | string | — **见 §5** | `script.js:934` |

#### `photos[]`（Media Schema 的核心）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `src` | string | **是** | — | 图片或视频路径。以 `.mp4/.webm/.mov/.ogg/.m4v` 结尾按视频渲染 |
| `caption` | string | 否 | — | 图注 |
| `width` / `height` | number | 强烈建议 | — | 原始像素尺寸。**有它浏览器才能在图片下载完之前预留正确高度**，否则每次切图都会顶一下下方内容（CLS） |
| `alt` | string | 否 | — | 无障碍替代文本 |
| `date` | string | 否 | — | 展签「日期」 |
| `place` / `location` | string | 否 | — | 展签「地点」（`place` 优先，`location` 为别名） |
| `description` | string | 否 | — | 优先于 `caption` 作为图注 |
| `title` | string | 否 | — | 灯箱标题 |
| `focalPoint` | `{x,y}` number | 否 | `{0.5,0.5}` | 归一化构图焦点（0~1）。竖图或主体偏一侧时决定裁切保留哪里，渲染层做 0~100 夹取 |
| `thumb` | string | 否 | — | 索引条缩略图，不填则用原图 |

- **数组整体替换**，不做逐项合并 —— 逐项合并会让「用户删掉一张照片」无法表达。
- 因此「项里类型错的字段」的语义是**从该项消失**，而不是「回退成默认照片的值」。
- 旧格式 `{ src, caption }` 完全兼容，不产生任何诊断噪音。
- 不知道尺寸？跑 `node tools/media/image-dims.js assets/photos/*.jpg`。

### 6.5 Experience Schema

```js
experience: { chapters: [{ step, id, label, title, enabled, progress }] }
```

| 字段 | 类型 | 默认 | 读取方 | 说明 |
|---|---|---|---|---|
| `step` | number | 1…8 | `state.js:48` | 对应 `#questionN` 的序号，**主键，不可重复** |
| `id` | string | `home/quiz/...` | — | 模块标识。**当前无读取方**，保留给扩展 |
| `label` | string | `序/壹…柒` | `state.js:59,111` | 旅程线编号 |
| `title` | string | `""` / 章名 | `script.js:183` | 本章 kicker 章名，**唯一来源**；留空则不显示 |
| `enabled` | boolean | `true` | `state.js:54` | `false` = 整章跳过（不渲染、不计入进度） |
| `progress` | number | 0…96 | `state.js:112` | 进度线百分比 |

跳过一章是**双保险**：`enabled: false`（结构层）与内容为空（数据层，
见 `script.js` 的 `CHAPTER_CONTENT_COUNT`）任一成立即跳过。两者独立 ——
想临时关掉一章用 `enabled`，忘了填内容由判空兜住。

数组项形状同样**来自默认值第一项**，所以这 6 个字段都必须在默认值里声明。
`experience: { chapters: [] }` 是合法输入，语义是「全部章节都不声明」，
`state.js` 会退回 v1 行为（每章都启用、游标信息取默认）。

### 6.6 Story Schema

| 字段 | 类型 | 默认 | 读取方 / 备注 |
|---|---|---|---|
| `story.letters[]` | object[] | 1 封示例信 | `script.js:622,675`。**空数组 → 该章自动跳过** |
| `story.letters[].date` / `title` / `content` | string | — | |
| `story.letters[].image` | string | `""` | 配图 |
| `story.letters[].audio` | string | `""` | 填了才出现语音播放按钮 |
| `story.timeline[]` | object[] | `[]` | 预留（时间轴模块），项形状见 §5 |
| `story.promises[]` | object[] | `[]` | 预留（约定清单模块），项形状见 §5 |
| `story.memories[]` | object[] | `[]` | 预留（时间轴模块），项形状见 §5 |
| `letters`（**顶层 legacy 别名**） | object[] | — | `script.js:224/622/675` 的回退路径。`story.letters` 优先 |

### 6.7 Sound Schema

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `sound.bgm` | string | `""` | 留空 = 沿用 `music.musicUrl` |
| `sound.volume` | number | `0.5` | |
| `sound.uiTick` | boolean | `true` | 章节切换提示音（Web Audio 合成，无素材） |
| `sound.tick.freqs` | number[2] | `[1244,1866]` | 提示音音色 |
| `sound.tick.gain` | number | `0.045` | |
| `sound.tick.decayMs` | number | `220` | |
| `sound.fadeMs.{bgmIn,bgmOut,voiceIn,voiceOut}` | number | 1400/500/800/400 | 音量渐变时长 |
| `sound.voiceEnabled` | boolean | `true` | 信件语音播放器开关 |
| `sound.voiceTexts.{play,pause,error}` | string | — | 语音按钮文案的**唯一**来源 |
| `music.enabled` | boolean | `true` | |
| `music.autoplay` | boolean | `true` | 被拦截时点页面任意处播放 |
| `music.musicUrl` | string | `"./assets/audio/bgm.mp3"` | **本地相对路径，不会被强制改写成 https** |
| `music.startText` / `stopText` | string | `"放音乐"` / `"暂停"` | |
| `music.volume` | number | `0.5` | |

`sound.*` 与 `music.*` 目前并存（`sound.bgm` 留空时回落到 `music.musicUrl`）。
新代码一律读 `sound.*`；`music.*` 是母版遗留层，为兼容不动。

### 6.8 Person Schema

| 字段 | 类型 | 默认 | 读取方 |
|---|---|---|---|
| `person.name` | string | `""` | `script.js` |
| `person.nickname` | string | `""` | `script.js`，优先用于首页英文标题 |
| `person.avatar` | string | `""` | **无读取方**，保留给全息卡片 |
| `person.birthday` | string | `""` | **无读取方**，保留 |
| `person.relationship` | string | `""` | **无读取方**，保留 |

### 6.9 母版兼容层（不是产品化接口）

| 字段 | 读取方 | 说明 |
|---|---|---|
| `colors.{backgroundStart,backgroundEnd,buttonBackground,buttonHover,textColor}` | `theme.js` | 映射到 CSS 变量。新代码应改 `themes/*.js` |
| `animations.{floatDuration,floatDistance,bounceSpeed,heartExplosionSize}` | `theme.js` | 母版动画参数 |
| `floatingEmojis.{hearts,bears}` | **无读取方** | 母版遗留，见 §7 |

---

## 7. 已声明但当前没有读取方的字段（保留区）

这些字段在默认值里存在，所以能通过校验，但**当前没有任何渲染层读取它们**：

`metadata.author` / `metadata.created` / `metadata.version`、
整个 `media.*`、`experience.chapters[].id`、`person.avatar` / `birthday` / `relationship`、
`floatingEmojis.*`。

处理原则：

- **不删**（属现有功能，且删掉会破坏已有配置的兼容性）；
- **不要在这个基础上写新代码** —— 它们不代表已实现的语义；
- 将来要用它们时，必须**先有读取方**，再更新本文档。

---

## 8. 拒绝语义（哪些情况会丢什么）

| 情况 | 结果 | 诊断 code |
|---|---|---|
| 未知字段（非开放槽位） | 该字段丢弃，同层其它字段照常生效 | `unknown-field` |
| 类型不匹配（叶子） | 该字段丢弃 → **父级保留默认值** | `type-mismatch` |
| 类型不匹配（数组本身收到非数组） | 整个数组丢弃 → 保留默认数组 | `type-mismatch` |
| 空字符串 | **合法**，保留（否则无法清空一个字段） | — |
| `null` | 丢弃。本项目「空」的表示是空串 / 空数组，不引入第三种空值 | `null-value` |
| `NaN` / `Infinity` | 丢弃（JSON 里不会出现，但防御动态构造的 payload） | `non-finite-number` |
| 数字字段收到布尔 | 丢弃 | `type-mismatch` |
| 开放槽位里出现对象 | 保留，但记一条（标量不记） | `outside-contract` |
| 危险键 | 丢弃 | `dangerous-key` |
| 超长字符串 / 数组 / key 数 | 截断 | `string-too-long` / `array-too-long` / `too-many-keys` |
| 嵌套超深 | 丢弃该子树 | `depth-exceeded` |
| `?conf=` 非法 base64 / 非法 JSON / 顶层非对象 | **整个链接忽略**，用 `config.js` | `payload-rejected` |
| `?conf=` 超长 | 同上（解码前拦下） | `payload-too-long` |

「父级保留默认值」是这套语义里最重要的一条：一处写错不会连累同一个对象里的其它字段。

---

## 9. 分享链接（`?conf=`）

- 链接只携带**与默认值不同的部分**（diff）。直接改 `config.js` 再部署时 diff 天然为空 ——
  这是正确的：收件人打开的是同一个站点，内容已经在文件里。
- diff 为空时**不写 `conf` 参数**（早先会写一个 `conf=e30=`，即 base64 的 `{}`：无害，
  但让链接看起来像带参数，收件人还白跑一遍解码 + 校验）。
- 链接超过 8000 字符会在控制台告警。
- 实测把 `metadata/person/theme/photos/story/sound/experience/pageTitle` 全部改掉后约 **950 字符**；
  受 24000 字符硬上限保护。

调试 API（都在 `window.ValentineConfig` 上）：

| API | 用途 |
|---|---|
| `debugSharePayload()` | 看当前 diff 与体积、顶层 key 列表 |
| `resolveFromEncoded(conf)` | 给定 `conf` 参数还原完整配置，**走与首屏完全相同的路径** |
| `auditPayload(conf)` | 只校验一个 payload，返回被拒绝/修正的字段清单，无副作用 |
| `generateShareLink()` / `copyShareLink()` | 生成 / 复制 |

---

## 10. 诊断契约（`window.LPDiagnostics`）

配置写错时，过去的表现是「某个地方就是没显示」，作者与 Agent 只能靠猜。
`diagnostics.js` 提供一个统一的、可机读的诊断通道。

- 区域（固定集合，不拼写漂移）：`config / theme / chapters / media / runtime / performance / a11y`
- 每区域上限 200 条（防畸形容器刷爆内存），前 40 条进 console（防刷屏淹掉真错误）
- 永远不抛异常 —— 诊断自己坏掉不能连累运行时
- `LPDiagnostics.report()` 输出 `Runtime / Theme / Config / Chapters / Media / A11y / Overflow / JS Errors` 摘要；
  需要真实布局的项（A11y / Overflow）**如实标 `n/a`**，由调用方注入

加载顺序是契约的一部分：`config.js` → `diagnostics.js` → `config-system.js`
（校验层需要诊断通道存在）。`config-system.js` 在 `LPDiagnostics` 缺失时会退回 `console.warn`。

想直接看某个 payload 产生了什么诊断：`node tools/qa/probe-contract.js`。

---

## 11. 兼容矩阵（旧配置）

| 旧写法 | 现在 | 是否产生诊断 |
|---|---|---|
| `photos: [{ src, caption }]` | 完全可用，渲染结果与从前一致 | 否 |
| `letters: [...]`（顶层） | 走 `story.letters` 的回退路径 | 否 |
| `experience: { chapters: [] }` | 合法，`state.js` 退回 v1 行为 | 否 |
| 只有 `music` 没有 `sound` | 可用，`sound.bgm` 留空时回落 `music.musicUrl` | 否 |
| 只有 `colors` 没有主题预设 | 可用，`theme.js` 做母版映射 | 否 |
| 缺 `width`/`height` 的照片 | 可用（渲染层必须能处理缺失） | 否 |

**「旧配置不产生诊断噪音」是被断言锁住的**：`config-suite.js` 第 9 组检查
旧格式 photos 加载后 `LPDiagnostics.count('config') === 0`。

---

## 12. 改一个字段要动哪些地方（强制清单）

任何字段的增删改，必须**同时**更新：

1. **默认值** —— `config.js`（首选）或 `config-system.js` 的 `EXTRA_SHAPES`（当默认值无法展示形状时）
2. **执行者** —— 通常无需改 `config-system.js`（它跟着默认值走）；只有新增 `EXTRA_SHAPES` 条目或改 `LIMITS` 才动
3. **文档** —— 本文档 §6 的字段表 + §5 的 `EXTRA_SHAPES` 表（如适用）
4. **`docs/CONFIG_SCHEMA.md`** —— 面向使用者的「怎么改」说明（这份是契约，那份是教程）
5. **示例** —— `examples/example-*.js` 里体现一次真实用法
6. **QA** —— `tools/qa/config-suite.js` 加断言（至少一条正向「能设置」+ 一条负向「同层未知字段仍被拒绝」）

验证命令：

```bash
node tools/qa/config-suite.js     # 配置契约 / 安全 / 兼容（99 断言）
node tools/qa/module-suite.js     # 拆分出去的纯函数模块（63 断言）
tools/qa/run.sh steps-config-security.txt   # 真实浏览器：注入面 + 尺寸预留 + 诊断
```

**退出码 0 才算改完。** 三个都跑，不要只跑一个。

---

## 13. 已知边界（写下来，避免被当成 bug）

1. **数字字段不做区间校验。** `petalCount: 99999`、`volume: 900` 都会被接受。
   夹取在渲染层。契约层只保证类型与安全。
2. **字符串不做 URL / 路径校验。** `photos[0].src` 可以是 `javascript:`。渲染层负责转义
   （`esc()` 是唯一安全边界），但**不负责协议白名单** —— 这是当前的真实缺口，
   记录在 `docs/architecture/CURRENT_STATE.md`。
3. **`?conf=` 是唯一入口，但主题名走 `?theme=`。** 两者都是 URL 参数，主题名只做
   「注册表里有没有」的检查，不做内容校验（它只是个名字）。
4. **`LIMITS.depth = 8` 是经验值。** 合法配置最深路径是
   `experience.chapters[0].progress`（3 层），8 层给了足够冗余；
   真正的目的是让「深层嵌套 DoS」不可能成立，而不是精确建模。
