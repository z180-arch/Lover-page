# ARCHITECTURE

Lover-page 是零框架、零构建的纯静态单页应用。所有状态在内存里，所有内容在一个 `config.js`。

## 分层

```
config.js ──► theme.js ──► CSS 变量（令牌）
    │
    ├──► config-system.js（?conf= 分享配置：校验 diff → 安全深合并，顺序见下）
    ├──► diagnostics.js（LPDiagnostics 运行时诊断通道，先于 config-system 加载）
    ├──► script.js（内容渲染 + 游戏逻辑 + 章节视觉层）
    ├──► state.js（currentStep 状态机 + View Transitions + 章节旅程）
    ├──► js/core/text.js（esc / textPool / pickRandom）
    ├──► js/chapters/gauge.js（刻度盘几何与计算）
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

`window.DEFAULT_CONFIG` = 本文件内容（**不可被污染**，它是分享链接 diff 的基准）。
`window.VALENTINE_CONFIG` = 运行时生效配置，必须是 `DEFAULT_CONFIG` 的**深拷贝** —— 浅拷贝会让两者共享嵌套对象，运行时改动反过来改掉基准，使 diff 失真。

### config-system（config-system.js）
把配置塞进 URL 的分享机制。**权威契约见 `docs/architecture/CONFIG_CONTRACT.md`**，本文件是它的唯一执行者。

管线（**顺序是契约的一部分**）：

```
DEFAULT_CONFIG + diff → validate(diff, DEFAULTS) → mergeSafe(clone(DEFAULTS)) → 运行时配置
                             ↑ 先校验 diff                 ↑ 再合并
```

1. **diff**：递归比对 `DEFAULT_CONFIG`，只保留不同的部分（数组整体替换、对象逐键递归）。
   - 为什么不是全量：全量序列化约 4–5KB、base64 后约 7KB，聊天软件常截断；且任何字段改名都会让旧链接失效。
   - 部署型用法（用户直接改 `config.js` 再部署）下 diff 天然为空 —— 这是**正确**的，因为收件人打开的是同一个站点，内容已经在文件里。
2. **校验 diff**：以 `DEFAULT_CONFIG` 为形状基准递归比对 —— 拒绝未知字段、类型不符、危险键
   （`__proto__` / `constructor` / `prototype`）、超长字符串/数组、超深嵌套。非法部分**根本不会进入合并**，
   所以该位置天然保留默认值。每条拒绝都进 `LPDiagnostics`（`config` 区域）。
3. **安全深合并**：把校验后的 diff 合回 `DEFAULT_CONFIG` 的副本；赋值走 `Object.defineProperty`，
   避免触发 setter 或把 `__proto__` 当成原型赋值。

> **顺序为什么不能反**：早期实现是「先深合并、再 sanitize 合并结果」。那有两个后果 ——
> 未知字段会先被合并进来（旧 `sanitize` 只看值的类型，从不检查 key 在不在 schema 里），
> 且非法值被丢弃后**默认值也一起丢了**（`quiz.answer` 收到字符串会变成字段消失，而不是回退默认答案）。
> 改成先校验后，两个问题都不存在。改动这一段的顺序前请先读 `config-system.js` 的文件头注释。

**形状 = 默认值的形状**，所以「默认值没展示但渲染层确实支持的字段」必须由 `EXTRA_SHAPES` 显式声明
（`home.enTitle` / `meter.thresholds` / `ending.shareCopiedText` / 顶层 legacy `letters` 等 4 个字段
就是加固后实测被误伤、再补回来的）。新增这类字段时同步六处，清单见契约 §12。

历史教训：旧实现的校验硬编码在 `config.questions.*` / `config.celebration`（早已从 schema 移除的字段）上，
且强制 `musicUrl` 以 `https://` 开头，导致分享链接会丢掉 `photos/story/theme/sound/experience/person` 和本地 BGM。
更硬的一课是**原型污染曾经真的成立**：`JSON.parse` 会把 `{"__proto__":{…}}` 建成自有属性，
所以它确实能走到合并逻辑里并改写 `Object.prototype`。现在有 6 个探针锁在 `tools/qa/config-suite.js` 第 3 组。

### diagnostics（diagnostics.js）
`window.LPDiagnostics` —— 统一的、可机读的诊断通道。7 个固定区域
（`config / theme / chapters / media / runtime / performance / a11y`），每区域上限 200 条、
前 40 条进 console，**永远不抛异常**（诊断自己坏掉不能连累运行时）。
`report()` 输出运行摘要；需要真实布局的项（A11y / Overflow）如实标 `n/a`，由调用方注入，不编数字。
配置写错时先看这里，不要靠猜。

### theme（theme.js）
把 `config.colors`、`config.theme.fonts` 写入 CSS 变量。所有样式引用令牌（见 styles.css `:root`），禁止 inline 色值。

### renderer（script.js）
每个章节一个渲染函数：`buildQuizOptions / updateGauge / renderPhoto / renderLetter / nextSurprise` 等。照片与信件遵循同一交互模式（单件展示 + 上一/下一 + 计数），数据驱动。

### chapter system
步骤 = `#questionN` section + 一个 kicker + 一个渲染函数。顺序由 HTML 里的 `onclick="showNextQuestion(n)"` 决定；`experience.chapters` 控制旅程标签与进度。

**空章节跳过**：`CHAPTER_CONTENT_COUNT` 是一张 `step → 内容条数` 的表，`showNextQuestion()` 会沿表向前跳过内容为 0 的章节，全部为空则直接进入落幕。新增章节只需在这张表加一行，避免出现空白页或点不动的按钮。

### 章节视觉语言（styles.css）
硬约束：**每一章不能只是「kicker + 标题 + 一排同款按钮」**。每章有自己的材质与形态，但共用同一套令牌与动作层级。

| 章 | 视觉语言 | 关键实现 |
|---|---|---|
| 序 · 首页 | 舞台卡 | `.container` 面板 |
| 壹 · 默契 | 对话选项 | `.option-group` 网格 |
| 贰 · 心动 | 模拟仪器 | SVG 刻度盘 + 阻尼指针，`pathLength="100"` 画弧，`transform-box: view-box` 旋转 |
| 叁 · 想问你 | 编辑设计引文 | `.editorial` 细线 + folio + `text-wrap: pretty` |
| 肆 · 小事 | 便签纸 | `.note-slip` 横格周期 == `line-height` |
| 伍 · 私人档案 | 美术馆档案 | `.photo-frame` 展签 + `.contact-sheet` 联系印样 |
| 陆 · 来信 | 私人信笺 | `.letter-card` |
| 柒 · 惊喜 | 信封 | `.envelope` 袋/盖/纸三层 + `rotateX(118deg)` |
| 终 · 落幕 | 电影结尾 | `body[data-step="celebration"]` 卡片溶解 |

**动作层级**（替代「一排同款红按钮」）：
- `.cute-btn`（solid）— 每章唯一的主行动
- `.cute-btn.ghost` — 次级：重抽、回看
- `.cute-btn.text-action` — 最轻的软动作
- `.button-group.paired` — 窄屏成对并排，压缩纵向堆叠；`.cute-btn.full-row` 单独出现时占满整行

### 无障碍基线
- 三档墨色全部是**实色**而非 rgba alpha（alpha 叠在 mesh gradient 上对比度不可预测，且 axe 只能标「待复核」）：`--ink` 10.3:1 / `--ink-soft` 6.3:1 / `--ink-faint` 4.9:1（对 `--paper`）。
- 交互元素命中区 ≥ 44px（视觉可以更小，用 `min-height` 放大命中区，例如音乐胶囊、滑块）。
- 所有动效在 `prefers-reduced-motion: reduce` 下退化为终态。

## 已知约束

- `#bg-canvas` 与混合元素之间不能出现 `position:fixed` 或 `z-index` 祖先（会隔离混合）——见 styles.css 内注释。
- Chrome 合成器：带 `mix-blend-mode` 的元素上跑完 opacity 动画（fill:both）会永久失效——已用 alpha 烘焙素材绕开。
- **iOS Safari**：`transform-style: preserve-3d` 与 `overflow: hidden` 落在同一元素上会丢失 3D。信封因此只在 `.envelope-inner` 上给 `perspective`，翻盖自己做 `rotateX`，不使用 `preserve-3d`。
- 避免 `backdrop-filter`（iOS 上破版且开销大）。纸张质感用 `repeating-linear-gradient` + `feTurbulence` data-URI 噪点实现。
- 横向滚动条用 `scrollbar-width: none` / `::-webkit-scrollbar` 隐藏，**不能**用 `overflow: hidden`（那样就彻底不能滑了）。
- 媒体查询简写会覆盖更宽断点里的单条属性：`@media (max-width: 360px)` 里的 `padding` 简写会吃掉 `≤480px` 设置的 `padding-top`，必须重声明。
- 子资源缓存：index.html 里的 `?v=N` 参数需在改 CSS/JS 后手动递增。

## QA

`tools/qa/` 是可复现的真实浏览器 QA。零构建项目没有 dev server，用任意静态服务器起 `127.0.0.1`，然后：

```bash
python -m http.server 8899 --bind 127.0.0.1 &
tools/qa/run.sh steps-mobile-320.txt
```

batches 必须在**同一个 agent-browser 进程**内跑完（`build-batch.js` 生成 JSON，`agent-browser batch < json`），否则浏览器 daemon 会随命令结束被回收，页面状态不跨调用保留。

`steps-mobile-320.txt` / `steps-mobile-390.txt` 走完整八章流程；`steps-regression.txt` 复核信封几何、音乐胶囊与进度线的重叠、触摸目标尺寸。诊断脚本 `diag.js`（布局/溢出/触摸目标）、`check.js`（信封几何与胶囊重叠）、`env.js`（信封三态测量）、`share.js`（分享链接往返）。
