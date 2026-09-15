# Composition System · 页面构图系统审计

> 审计对象：`D:\新建文件夹\my lover`（GitHub: z180-arch/Lover-page）
> 审计依据：**静态代码实测**，非推测、非截图。
> 读了什么：`index.html`、`styles.css`（全 1390 行）、`css/intro.css`、`state.js`、`script.js`、`themes/warm-paper.js` / `night-archive.js` / `modern-paper.js`、`theme.js`、`docs/design/THEME_REGISTRY.md`、`docs/architecture/CURRENT_STATE.md`。
> 方法声明：本审计**未启动浏览器、未依赖截图**。所有「某章长这样」的结论都来自 DOM 结构 + CSS 规则 + 选择器/数值的逐一核对。迁移阶段的浏览器验证是**后续动作**，不是本审计的前提（见 §4 验证闸门）。
> 范围约束：本文件**只新增**，不修改任何现有文件。

---

## 0. 一个必须先说清的架构事实

当前 9 个屏**共用同一个 `<main class="container">`**（`index.html:40`，`styles.css:227`）。它不是「每章一张卡」，而是「一个舞台卡，里面切 9 张 section」。章节切换由 `script.js` 对 `.question-section`/`.celebration` 切 `.hidden` 完成（`state.js:91` 的 subscribe 回调），**没有任何构图类（composition class）被注入**——`script.js` 里出现的 class 只有 `.hidden`、`.is-over`、`.is-swapping`、`.is-current`、`.is-open`、`.option-correct`、`.meter-done`、`.is-revealing`、`.is-loading`、`.is-clickable`、`.is-playing`（`script.js` grep 结果），无一与构图相关。

这意味着两件事，决定了后面所有结论：

1. **「面板卡」是全站主题资产，不是某章资产。** 卡的形态来自 `themes/*.js` 的 `container.*`（`background`/`border`/`radius`/`shadow`/`padding`），经 `theme.js` 写成 `--panel-*`（`theme.js:172-176`），由 `.container` 消费（`styles.css:230-234`）。「某章有没有卡」由 `container.dissolveSteps` 决定（`warm-paper='8,celebration'`、`night-archive='6,7,8,celebration'`、`modern-paper=''`），经 `state.js:syncDissolve` 写入 `body[data-dissolve]`，再由 `styles.css:245-250` 把卡变透明。
2. **任何「构图」只能落在 `<section>` 内部**（或一个加在 section 上的类），不能重写外层 `.container` 的面板/背景/边框——那是主题的地盘，动了就与 `THEME_REGISTRY.md §5` 明示的「`dissolveSteps` 是主题×章节耦合点、刻意保留」冲突。

第 3 节的所有 composition 都遵守这条边界。

---

## 1. 现状实测：每章真实的构图是什么

表内「容器形态」按主题分列，因为同一章在不同主题下带不带卡不同（§0 事实 1）。

| # | 章 id / 章名 | 情绪作用 | 实际使用的构图模式（从代码读出） | 容器形态（面板卡） | 版式特征 | 垂直节奏来源（具体数值） | 与前/后章的视觉关系 |
|---|---|---|---|---|---|---|---|
| 1 | `#question1` 序 / home | 入口·邀约 | 单列居中**标题屏**：容器级 `h1#valentineTitle`（`index.html:45`，仅 step1 显示，`state.js:102`）+ section 内 `h2#homeTitle` + `.home-sub` + 单一 `cute-btn`。**无 `.chapter-kicker`、无专属物件类** | warm/night：带卡；modern：无卡 | 单列居中，`text-align:center`（继承 `.container`），无 kicker | `.container` padding `var(--space-xl) var(--space-l) var(--space-l)` = 48/32/32 + margin 24（`styles.css:232-238`）；`h1` mb `var(--space-s)`=16；`.home-sub` margin `calc(-1*24) 0 32`（`styles.css:331`）；`.button-group` mb 24/8（`styles.css:341`） | 入口，前无。后 `#question2` 同为居中带卡（warm/night）→ **连续** |
| 2 | `#question2` 壹·默契 quiz | 破冰·轻游戏 | 单列居中 + **2 列选项网格**。关键：**8 章里唯一没有专属物件类的章**——只有 `.option-group`（`grid-template-columns: minmax(0,1fr) minmax(0,1fr)`，`styles.css:431-435`） | warm/night：带卡；modern：无卡 | 单列居中，kicker + `h2` + 选项 2 列（≤480 单列，`styles.css:1341`）+ `.game-feedback` + 主按钮 | kicker mb `var(--space-s)`=16（`styles.css:296`）；`h2` mb `var(--space-l)`=32（`styles.css:320`）；`.option-group` margin 24/0/8；`.button-group` 24/8 | 与 1、3 同为居中带卡 → **连续**；但它是 bare-centered，与 home 视觉**近乎同构**——这是差异化缺口（见 §2） |
| 3 | `#question3` 贰·心动 meter | 情感量化·把玩 | 居中固定宽**「仪表」子卡**（card-in-card）：`.love-meter.instrument`，内含 SVG `gauge` + 读数 + 图例 + 原生 `range` | warm/night：带卡（卡里有卡）；modern：无卡，仪表子卡仍在 | 单列居中，kicker + `h2` + 仪表（width `min(320px,100%)`、`margin:auto`，`styles.css:476-478`）+ 主按钮 | `.instrument` margin `var(--space-m) auto var(--space-l)`=24/auto/32，padding 16/16/8（`styles.css:479`）；仪表内部 读数 mb `var(--space-2xs)`=8、图例 mb 8 | 前 quiz 居中带卡 → **连续**（面板态不变）；物件从「选项」跃迁为「测量仪表」——首个明显视觉跃迁 |
| 4 | `#question4` 叁·想问你 questions | 亲密提问 | 左对齐**编辑设计引文**：`figure.editorial`（`border-top/bottom:1px hairline` + `.editorial-folio` 绝对右上 + `blockquote` 大字号） | warm/night：带卡；modern：无卡 | 单列但 **`text-align:left`**（覆盖 `.container` 的 center，`styles.css:692`） | `.editorial` margin 24/0/32，padding 32/0/24（`styles.css:686-689`）；`.editorial-question` `min-height:3.9em`、字号 `clamp(1.22rem,3.4vw,1.65rem)` | 前 meter 居中 → **断裂**（对齐翻转 left）；是首个打破居中的章，对比最强 |
| 5 | `#question5` 肆·小事 smallthings | 温柔小事·便签 | 居中固定宽**「便签」子卡**：`.note-slip`（`ruled paper` 横格 + `.note-tape` + `rotate(-0.5deg)`，文字 `text-align:left`） | warm/night：带卡；modern：无卡 | 单列居中，kicker + 便签（width `min(360px,100%)`、`margin:auto`，`styles.css:769-772`）+ `.button-group.paired` | `.note-slip` margin 24/auto/32（`styles.css:772`）；`.note-body` `line-height:34px` 须等于横格周期（`styles.css:820`） | 前 editorial 左对齐 → 回到居中（但物件从引文变便签）；与 meter(3) 同属「居中固定宽子卡」**家族，同构度高** |
| 6 | `#question6` 伍·私人档案 photos | 共享记忆·展陈 | 全宽**影像 + 联系印样索引**：`.photo-stage`(flex 居中) + `.photo-frame`(图 `max-height:48vh`) + `nav.contact-sheet`(横向 scroll，56px cell) + `.photo-caption` | **主题相关**：warm 带卡；night `step6` **溶解（无卡）**；modern 无卡 | 单列，图出血到容器宽；`.contact-sheet` 横向滚动（`scrollbar-width:none`，`styles.css:919-932`） | `.photo-stage` margin 16/auto/8；`.contact-sheet` margin 16/0/8（`styles.css:844,922`）；`.photo-caption` margin 8/3/3 | **主题相关断裂点**：night 在 5→6 切到溶解（卡消失），warm 仍带卡。首个「影像出血容器宽」的全幅章 |
| 7 | `#question7` 陆·来信 letters | 深度通信·信笺 | 左对齐**信笺卡**：`.letter-stage > .letter-card`（`padding 32/24`、左对齐、`box-shadow`、揭幕动效 `letterOpen`）+ `.voice-btn`。`#letterHint` **复用 `.photo-caption` 类**（`index.html:164`） | warm 带卡；night `step7` 溶解；modern 无卡 | 单列左对齐，kicker + 信笺卡（含日期/标题/图/正文/语音） | `.letter-stage` margin 16/0/8；`.letter-card` padding 32/24（`styles.css:998-1008`） | night 6→7 **连续**（都溶解）；warm 6→7 带卡连续。与 surprise(8) 同属「纸+书写+揭幕」**epistolary 家族**（7=信笺卡，8=信封） |
| 8 | `#question8` 柒·惊喜 surprise | 礼物·高潮前奏 | 居中**三层信封**：`.envelope`(`.envelope-shell`/`.envelope-flap`/`.envelope-sheet`，`rotateX(118deg)`，`padding-top:24%` 预留翻盖空间） | warm & night 均**溶解**（step8）；modern 无卡 | 单列居中，kicker + 信封（`aspect-ratio:8/5`、`perspective:700px`）+ `.button-group.paired` | `.envelope` margin 16/0/8，`padding-top:24%`（`styles.css:1086-1089`，**这 24% 是为翻盖留的几何空间，不是内容留白**） | warm 7→8 **断裂**（7 带卡，8 溶解）；night 连续（都溶解）。与 7 同 epistolary 家族但几何特殊 |
| — | `#celebration` 落幕 | 收束·庆祝 | 溶解全屏 + 花瓣迸发。**所有主题强制溶解**（`body[data-step="celebration"] .container` 透明，`styles.css:246`） | **无卡（三主题一致）** | 单列居中，`h2` 放大 `clamp(1.5rem,3vw,2rem)`（`styles.css:1224-1227`）+ `.celebration-text`×2 + 重玩按钮 | `.celebration-text` margin 8/0；`h2` 放大；`.button-group` 24/8 | 与 8 **连续**（都溶解）——endgame 一段无卡。与 1（入口带卡）形成「有卡→无卡」环形对照 |

**跨章的「过渡语言」统一机制**（与构图无关但影响观感）：每张 `.question-section` 有 `sectionIn` 淡入+上移 14px（`styles.css:1230-1238`）；外层 `.container` 带 `view-transition-name:stage`（`styles.css:239`），切章时整卡交叉溶解（`styles.css:1241-1245`）。所以「连续/断裂」在面板态一致时表现为「卡内换内容」，在溶解切换时表现为「卡整体隐去」。

---

## 2. 判断：八章是否真的形成了「视觉叙事」

**结论：有叙事骨架，但还差一口气——外框没参与递进，且「默契」章是唯一没拿到专属视觉语言的章。它不是「8 个漂亮组件」那么空，但也远没到「被精心编排的构图系统」。**

支持「有叙事」的硬证据：

- **编号 + 进度线给了贯穿感**：`.journey-label`/`.journey-line`（`styles.css:253-284`）随 `DEFAULT_JOURNEY`（`state.js:28-38`）逐章推进 0→100%，每章顶部 `.chapter-kicker` 用同一套 `.chapter-kicker` 样式（`styles.css:291-298`）。这是一套**统一的外壳语法**，说明章节是被「装订成一册」而不是各写各的。
- **物件亲密感逐级上升**：测试(选项网格) → 仪表(把玩) → 引文(提问) → 便签(小事) → 展陈(记忆) → 信笺(通信) → 信封(礼物) → 落幕。**对象从「可玩控件」走向「私人物件」**，情绪曲线有方向。
- **溶解在尾部加码，像「逐章卸下框架」**：`night-archive` 让 6/7/8/落幕 全部溶解——越往后越「无卡、直接落在深底上」；`warm-paper` 至少让 8/落幕 溶解。`dissolveSteps` 是**主题级叙事决策**，不是随机默认值（`THEME_REGISTRY.md §1` 实测逐章吻合）。这是「外框随情绪退场」的真实证据。

反对「已成型」的硬证据（诚实点名）：

- **外框本身是静态的**。9 屏共用一个 `.container`（`styles.css:227`）。warm-paper 下 1–7 章的卡**完全一样**（同 background/border/radius/shadow/padding），唯独靠 section 内部物件区分。也就是说「递进」发生在**物件层**，不在**舞台层**——舞台从序到柒一字未变（除非溶解触发）。
- **「默契」章(壹, `#question2`)是裸的**。它是 8 章里唯一没有专属物件类的：没有 `.instrument`/`.editorial`/`.note-slip`/`.photo-frame`/`.letter-card`/`.envelope`，只有通用 `.option-group` 2 列网格。结果它和 home(序) **视觉近乎同构**（都是「kicker + 标题 + 居中控件 + 按钮」），是整条线里最弱的一环。前一轮「章节视觉语言分化」列了 贰/叁/肆/伍/柒，**漏了 壹**——这是真实缺口，不是我挑刺。
- **有两个同构家族未被刻意拉开**：`meter(3)` 与 `smallthings(5)` 都是「居中固定宽子卡（card-in-card）」——一个仪表壳、一个便签壳，骨架一致，只差内部装饰。`letters(7)` 与 `surprise(8)` 都是「纸 + 书写 + 揭幕」的 epistolary 物件。这不一定是坏事（家族感也是叙事），但**当前没有用构图层把它们显式归为家族**，全靠作者心里的默契，后续加主题/加章时容易漂。

一句话：叙事**靠物件序列 + 编号 + 溶解加码**撑着，骨架成立；但舞台层不参与递进、且壹章掉队，所以现在更准确地说是「**装订成册的 8 个物件，其中 7 个各有语言、1 个还是通用表单**」，而不是一套自洽的构图系统。

---

## 3. 定义 Composition（页面构图模式）

### 设计原则（先定边界，再定模式）

- **Composition 只管 `<section>` 的脚手架**：对齐方式、内容测量宽度（measure）、内部物件最大宽（object width）、垂直节奏档位。**不碰**物件内部装饰（刻度/横格/信封几何）、**不碰**面板卡（那是 `--panel-*` + `dissolveSteps` 的主题资产）。
- **实现形态**：在 `index.html` 的 `<section>` 上加 `compose-<name>` 类（静态，无需 renderer 注入；与现有「renderer 只切 `.hidden`」的模型兼容）。类只设少量 CSS 自定义属性 / 对齐，物件类（`.instrument` 等）继续管自己的样子。
- **数量**：6 个。落幕(coda) 与 序(home) **不纳入**（见 §4 与 §5）。

### 3.1 `compose-centered`（单列居中·默认舞台）
- **定义**：最朴素的居中窄栏舞台——kicker + 标题 + 居中内容 + 底部动作。它解决「没有专属物件的章也需要一个稳定、可读的默认骨架」。
- **适用**：`#question1`（序）、`#question2`（壹·默契）。`#question2` 是它最该服务的对象（bare-centered 缺口）。
- **CSS 契约（控制）**：
  - 对齐：`text-align: center`（显式声明，覆盖任何继承异常）
  - 内容测量宽：沿用 `.container` 的 `max-width:560px`，不额外限制
  - 垂直节奏：沿用现有 `--space-*`（kicker mb `var(--space-s)`=16；`h2` mb `var(--space-l)`=32；`.button-group` mb 24/8）
  - 选项网格：交给 `.option-group` 自己（2 列→≤480 单列），composition 不声明列数
- **不控制**：面板形态（主题所有）；`.option-group` 的列数/间距；任何物件装饰。
- **现有规则归属**：该归它的——`.home-sub` 的负 margin 收紧（`styles.css:331`）、`.button-group` 居中。不该动的——`.option-group` 的 `grid-template-columns`（`styles.css:431`，属 quiz 控件，不是构图）。

### 3.2 `compose-instrument`（居中·固定宽测量物件）
- **定义**：把「单一可视化测量控件」居中陈列的舞台——卡里有卡，物件锁定一个舒适固定宽。解决「仪表/量规这类需要被‘端详’的物件不能被拉宽」。
- **适用**：`#question3`（贰·心动）。
- **CSS 契约（控制）**：
  - 对齐：`text-align: center`
  - 物件最大宽：`--compose-object: min(320px,100%)`（与现有 `.instrument` width 一致，`styles.css:477`）
  - 垂直节奏：物件上下 `var(--space-m)`/`var(--space-l)`（24/32，同 `.instrument` margin）
- **不控制**：仪表内部（SVG `gauge-*`、`gauge-readout`、range 轨道/拇指、`is-over` 爆表态）——全在 `.instrument`/`.slider` 里，composition 不碰。
- **现有规则归属**：该归它的——`.instrument` 的居中 + 固定宽 + 上下 margin（`styles.css:475-484`）。不该动的——`.instrument` 内部的 `background`/`border`/`box-shadow`/刻度线（属仪表皮肤，且已令牌化，换主题要跟着走）。

### 3.3 `compose-editorial`（左对齐·测量引文栏）
- **定义**：用版面而非组件说话的引文舞台——左对齐、上下细线、folio 编号。解决「大段提问/箴言需要被‘阅读’而不是被‘点’」。
- **适用**：`#question4`（叁·想问你）。
- **CSS 契约（控制）**：
  - 对齐：**`text-align: left`**（关键，覆盖 `.container` 的 center，现有 `.editorial` 已是 left，`styles.css:692`）
  - 内容测量宽：`--compose-measure: 38em`（引文可比默认栏略宽，避免短行碎断；现有 `blockquote` 用 `clamp(1.22rem,3.4vw,1.65rem)` + `text-wrap:pretty`）
  - 上下细线 + folio 定位：交给 `.editorial`/`.editorial-folio`（现有 `styles.css:686-747`）
  - 垂直节奏：`.editorial` margin 24/0/32、padding 32/0/24（沿用）
- **不控制**：引文字号/字距（已由 `--fs-*`/`--track-*` 令牌管）、`is-swapping` 文字动效、folio 数字样式。
- **现有规则归属**：该归它的——`.editorial` 的 `text-align:left` + 上下 hairline + folio 绝对定位。不该动的——`.editorial-question` 的 `min-height`/`text-wrap`（属内容排版，换主题字号会变，不该写死在 composition）。

### 3.4 `compose-memo`（居中·固定宽便签物件）
- **定义**：把「一张便签/纸条」居中陈列的舞台——带胶带、横格、轻微旋转的纸。解决与 `compose-instrument` 同类需求（居中固定宽物件）但语义是「手写小事」而非「测量」。
- **适用**：`#question5`（肆·小事）。
- **CSS 契约（控制）**：
  - 对齐：`text-align: center`（外层），物件内部文字 left 由 `.note-slip` 管
  - 物件最大宽：`--compose-object: min(360px,100%)`（同 `.note-slip` width，`styles.css:771`）
  - 垂直节奏：物件上下 `var(--space-m)`/`var(--space-l)`（同 `.note-slip` margin 24/auto/32）
- **不控制**：`.note-slip` 的 `rotate(-0.5deg)`、`.note-tape`、横格 `repeating-linear-gradient`、`line-height:34px` 与横格周期必须相等的约束（`styles.css:769-831`，属便签皮肤，动一个会破坏「字压在线上」）。
- **现有规则归属**：该归它的——`.note-slip` 的居中 + 固定宽 + 上下 margin。不该动的——内部 `transform:rotate` 与横格背景（几何耦合，见 §5 反例）。

### 3.5 `compose-archive`（全宽·影像 + 索引栏）
- **定义**：影像出血到容器宽、下方挂一条横向胶片索引的展陈舞台。解决「照片章需要大图 + 可扫索引，不能被窄栏/居中挤成缩略图」。
- **适用**：`#question6`（伍·私人档案）。
- **CSS 契约（控制）**：
  - 对齐：`text-align: center`（图与索引居中于栏内）
  - 内容测量宽：`--compose-measure: 100%`（图吃满容器宽，现有 `.photo-frame` `width:100%`，`styles.css:850-857`）
  - 索引栏：横向滚动由 `.contact-sheet` 管（`scrollbar-width:none` 等，沿用）
  - 垂直节奏：`.photo-stage` margin 16/auto/8、`.contact-sheet` margin 16/0/8、`.photo-caption` 8/3/3（沿用）
- **不控制**：`.photo-frame` 边框/`shimmer` 加载态/`.is-revealing` 揭幕、`contact-cell` 的 56px 尺寸与当前态高亮、GLightbox caption 样式。
- **现有规则归属**：该归它的——`.photo-stage` 的居中 + 全宽、`.contact-sheet` 全宽横滚。不该动的——`contact-cell` 的 `width/height:56px`（导航手感，且 ≤360 改 48px 是响应式，`styles.css:1356`，属控件）。

### 3.6 `compose-epistolary`（纸 + 书写 + 揭幕·信笺/信封家族）
- **定义**：「一封写给人看的纸」家族舞台——左对齐信笺卡，或居中交互信封，共同点是有书写内容 + 揭幕/开启动效。解决「来信与惊喜同源（都是信），应在构图层被认作一家」。
- **适用**：`#question7`（陆·来信）、`#question8`（柒·惊喜）。
- **CSS 契约（控制）**：
  - 对齐：信笺(7) `text-align: left`；信封(8) 外层居中、内部由 `.envelope` 管
  - 内容测量宽：沿用容器（信笺吃满、信封吃满）
  - 揭幕动效钩子：仅声明「本屏有开启动效」，具体 `letterOpen`/`rotateX(118deg)` 交给物件
  - 垂直节奏：`.letter-stage` margin 16/0/8、`.letter-card` padding 32/24（7）；`.envelope` margin 16/0/8（8，沿用）
- **不控制（重点，见 §5 反例）**：**`.envelope` 的 `padding-top:24%`**（翻盖几何预留，`styles.css:1088`）、`aspect-ratio:8/5`、`perspective:700px`、`rotateX(118deg)` 切换时机——这些是信封专属几何，绝不能吸进 composition，否则会破坏「翻盖不顶标题、闭合态信纸不露边」的已验证约束（`CURRENT_STATE.md §5` 信封几何通过；`styles.css:1082-1202` 注释详述）。
- **现有规则归属**：该归它的——「7 与 8 都是 epistolary」这一家族声明、对齐与节奏档位。不该动的——信封三层几何、信笺卡 `box-shadow`/揭幕动画细节。

> 为什么不是 7 个（把信封单独拆出）：信封与信笺语义同源、且各自动效/几何都已在 `.envelope`/`.letter-card` 里自洽，再拆一个 `compose-envelope` 会让计数超 6，且 envelope 的几何必须留在物件类里（§5 反例 2），composition 层拿不到额外可复用逻辑。故合为 `compose-epistolary`，信封作「带几何约束的变体」。

---

## 4. 迁移建议（必须渐进、可验证）

**总原则：不要一次性把所有章改成 composition schema。** 现在 9 屏能跑、a11y 0 violation、三主题令牌两两不同（`CURRENT_STATE.md §5`、`THEME_REGISTRY.md §2`）。任何重构的首要目标是「**观感与行为零回归**」，不是「代码更优雅」。

### 阶段 1（最低风险、最共识）—— 先做 2 个
挑 **`compose-editorial`（Q4）** 与 **`compose-memo`（Q5）**：
- 理由：两者已有自洽的专属物件类（`.editorial` / `.note-slip`），composition 只是把「左对齐 / 居中固定宽 + 节奏」显式声明为类，**不碰物件内部一行**；它们不依赖 `.option-group`、`.contact-sheet`、信封几何等易碎机械，回归面最小。
- 做法：在 `index.html` 给 `#question4` 加 `class="question-section compose-editorial"`、给 `#question5` 加 `compose-memo`（其余 HTML 不变）；在 `styles.css` 末尾新增两条极薄规则（仅 `text-align` + `--compose-object`/`--compose-measure` + 沿用现有 margin），**不删不改任何现有 `.editorial`/`.note-slip` 规则**。
- **验证闸门（必须全绿才进阶段 2）**：
  1. `?theme=warm-paper|night-archive|modern-paper` 三主题逐章目视，Q4/Q5 观感与重构前像素级一致；
  2. `agent-browser a11y` 三主题均 `violations:0`；
  3. 320/390 宽度无横向溢出（`@diag horizontalOverflow:false`）；
  4. 溶解行为不变：`body[data-dissolve]` 在 Q8/落幕 仍=1（warm）、Q6/7/8/落幕 仍=1（night）、modern 始终无卡——用 `window.appState.setState({currentStep:N})` 巡章核对（`CURRENT_STATE.md §5` 方法 2）。

### 阶段 2（物件家族化）—— `compose-instrument`(Q3) + `compose-archive`(Q6)
- 同样只加类 + 薄规则；`compose-archive` 注意 Q6 在 night 下是溶解态，验证溶解切换在 5→6 仍成立。

### 阶段 3（家族收口）—— `compose-epistolary`(Q7, Q8)
- 把 7、8 标为同一家族；**严守 §3.6「不控制」**：信封几何一行不迁。验证信封闭合态不露边、翻盖不顶标题（`@env`）。

### 阶段 4（默认收口，可选）—— `compose-centered`(Q1, Q2)
- Q2 是最该受益的（bare-centered 缺口），但 Q1(home) 的 `h1#valentineTitle` 在容器级、与 title 揭示强耦合，**建议 Q1 不纳入**（见下「不应归入」）。

### 明确**不应**归入任何 composition 的章
- **`#celebration` 落幕（coda）**：已是 `body[data-step="celebration"] .container` 特例强制溶解（`styles.css:246`）+ `h2` 放大特例（`styles.css:1224`）。它是「所有主题都无卡」的**不变量**，吸进 composition 会把这条跨主题不变量降级成「某章声明」，风险高、收益零。保留特殊。
- **`#question1` 序（home）**：大标题 `h1#valentineTitle` 在 `<main>` 容器级、仅 step1 显示（`state.js:99-103`），其脚手架与「章节揭示」耦合。给它套 composition 类几乎不解决任何问题，反而可能干扰标题揭示。**至少阶段 1–4 不纳入**；若日后要，也只标 `compose-centered` 作文档用途、不加新 CSS。
- **「默契」Q2 的处理建议**：它裸奔是真实缺口。阶段 4 可给它 `compose-centered`（纯文档/对称用途，无新 CSS），或**更推荐**另起一个轻量物件（如「对话气泡卡」）让它真正拿到专属语言——但那是「视觉语言分化」任务，不是本 composition 系统的职责，超出本文件范围，仅在此点名。

---

## 5. 风险与反例

### 把构图抽象化的核心风险
**为了「统一」而抹平章节差异，正好与「每章必须有自己视觉语言」的既有约束正面冲突。** 上一轮「章节视觉语言分化」已经为 贰/叁/肆/伍/柒 各造了专属物件类；如果 composition 系统越过「脚手架」边界、去统管物件的皮肤/几何，就会把「7 个各有语言」重新压回「几个同款框」——回到本次审计在 §2 指出的「外框静态、只靠物件区分」困境，甚至更糟（连物件都归一并了）。边界纪律（§3 设计原则）就是为挡这一风险：**composition = 脚手架，物件类 = 皮肤/几何，主题 = 面板/令牌**。三层各管各的。

### 反例 1：「底部动作栏」不该被吸进 composition
`.button-group`（居中 flex、`gap:var(--space-2xs)`、`margin:24/0/8`，`styles.css:336-342`）是所有章共用的**控件/动作栏**，不是构图。把它写进某个 composition（例如「compose-centered 负责把按钮放底部」）会混淆「脚手架」与「共享组件」：quiz 的按钮、meter 的按钮、letters 的按钮本质是一个组件，应继续由 `.button-group` 管，composition 只决定「这一屏整体对齐」，不决定按钮在哪。

### 反例 2：`compose-epistolary` 不该吸收信封几何
`.envelope` 的 `padding-top:24%` 是「翻盖后仰 + 信纸升起的上方预留空间」（`styles.css:1088` 注释），`aspect-ratio:8/5` + `perspective:700px` + `rotateX(118deg)` 切换时机是 iOS Safari 兼容性取舍（不用 `preserve-3d`，`styles.css:1080-1096`）。若为了「epistolary 家族统一」把这些提进 `compose-epistolary`，会：
- 破坏「翻盖翻到 118° 不顶到上方章节标题」的已验证约束；
- 破坏「闭合态信纸整张落在信封袋竖直范围内、底部不露白边」的约束（`styles.css:1114` 注释）；
- 信笺(7) 根本不需要 `padding-top:24%` / `aspect-ratio`，强行套会凭空撑出一大块空白。
**正确做法**：信封几何留在 `.envelope`；`compose-epistolary` 只声明「这是 epistolary 家族 + 左对齐(信笺)/居中(信封) + 有揭幕动效」，不动几何。

### 反例 3：composition 不该声明面板/背景/边框
「某章带不带卡」是主题资产：`--panel-*`（`theme.js:172-176`）由 `themes/*.js` 的 `container.*` 提供，`dissolveSteps` 决定哪些章溶解（`THEME_REGISTRY.md §5` 明示这是刻意保留的耦合点）。任何 composition 都**禁止**写 `background`/`border`/`border-radius`/`box-shadow` 到 section 或容器——否则换主题时「warm 白卡 / night 深卡 / modern 无卡」的三态会失效，且 `body[data-dissolve]` 的溶解机制被架空。composition 的「容器形态」一栏在 §1 只是**实测记录**，不是它要控制的东西。

---

## 附：本审计的未验证项
- **未跑真实浏览器**：所有结论来自静态代码核对，未用 `agent-browser` 截图或 `tools/qa` 实测。§1 的「观感」描述是对 DOM+CSS 的推断，不是像素级目检；若需像素级确认，按 §4 验证闸门执行三主题巡章即可。
- **`config.experience.chapters` 覆盖路径未穷举**：`state.js` 允许 config 整体覆盖章节（label/progress/enabled），本审计按内置默认 8 章+落幕分析；若实例改了章节顺序/启停，composition 的适用映射需按实际 `step` 重新对。
- **`?theme=` / `config.metadata.template` 解析链未端到端验证**：依赖 `THEME_REGISTRY.md §2` 已记录的「三主题逐章吻合」实测，未在本审计重跑。
