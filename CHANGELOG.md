# Changelog

## 1.2.0 — experience（2026-09-15）

**主题：解决「八章长得一模一样」，并把这一轮改造中暴露的真实缺陷修掉。**

### feat(experience) — 章节视觉语言分化

之前每一章都是「kicker + h2 + 一段文字 + 一排同款实心按钮」，八章同构。现在每章拥有独立的视觉语言，且全部只用现有设计令牌 + 纯 CSS/SVG，**没有引入任何新依赖**：

- **贰 · 心动 → 模拟仪器**：180° SVG 刻度盘、0/25/50/75/100 主刻度 + 5 分小刻度、带阻尼的指针、量程限位挡针、超量程后继续前压的指针、以及只记录「爆表之后」峰值的 drag pointer。数据层仍是原生 `<input type="range">`（键盘 / 触摸 / 读屏全部保留），仪表只是它的可视化。指针轴用 SVG 用户坐标（`transform-box: view-box`）。
- **叁 · 想问你 → 编辑设计引文**：大字号问题 + 上下细线 + `No. 05` folio（`oldstyle-nums`）+ `text-wrap: pretty`；「再来一个」降级为文字型动作。
- **肆 · 小事 → 便签纸**：横格周期与 `line-height` 严格相等的笔记纸、左侧装订线、顶部胶带、0.5° 轻旋转。
- **伍 · 私人档案 → 联系印样**：照片下方新增横向缩略图索引（`scroll-snap` + 隐藏滚动条但保留滑动），当前项以强调色描边标记。
- **柒 · 惊喜 → 信封开合**：信封袋 / 翻盖 / 信纸三层结构，翻盖 `rotateX(118deg)` 后仰露出背面，信纸从袋口升起。
- **动作层级**：建立 solid（唯一主行动） / ghost（重抽、回看） / text（最轻的软动作）三级，替代「一排同款红按钮」；窄屏成对动作并排，压缩纵向堆叠。

### fix(renderer) — 这一轮真实暴露的缺陷

- **信件章必然崩溃（P0）**：`renderLetter()` 在模板字符串里引用 `const vt`，而 `vt` 在 20 行之后才声明 —— TDZ `ReferenceError`。此前因为示例信件的 `audio` 是空串走短路而没暴露，**只要给信件配上语音，整章就会崩**。已把文案提取前置。
- **语音错误分支引用作用域外的 `vt`**（`toggleVoice` 的 `onerror`），播放失败时会二次抛错并让按钮卡住。
- **语音按钮文案硬编码**：`sound.voiceTexts` 只被部分读取，「播放语音/暂停」在别处写死，配置实际不生效。现统一为唯一来源。
- **`celebrate()` 连调两次 `createHeartExplosion()`**：落幕花瓣密度翻倍。
- **空数据死路（§31）**：`randomQuestions` / `smallThings` / `surprises` 为空数组时会渲染出字面量 `undefined`；`quiz.options` 为空时页面卡死无法前进。现在统一为一张「章节内容计数表」，内容为空的章节自动跳过，全部为空则直接进落幕。
- **重玩未复位**：`letterIndex` 不归零（重玩从上封信继续）、语音不停、信封不复位。
- **用户内容未转义**：`renderLetter` / `renderPhoto` 直接 innerHTML 拼接，配置里出现 `<` `&` 会破坏版式。已加 `esc()`。

### fix(share) — 分享链接实际是坏的

`config-system.js` 的校验仍停留在**已废弃的旧 schema**（`config.questions.*` / `config.celebration`），且强制 `musicUrl` 必须以 `https://` 开头。后果：分享链接会把 `photos / story / theme / sound / experience / person` 全部丢掉，并丢掉本地 BGM。

- 改为 **schema 驱动**：以 `DEFAULT_CONFIG` 为形状基准递归校验，新增字段无需改这个文件。
- 改为 **diff 传输**：只编码「与默认值不同的部分」。实测把 8 个类别全部改动后 diff 从 129B / 2 键 提升到 621B / 8 键，链接长度 954 字符。
- **`config.js` 的深浅拷贝 bug**：`VALENTINE_CONFIG = { ...CONFIG }` 是浅拷贝，与 `DEFAULT_CONFIG` 共享全部嵌套对象，任何运行时改动都会污染 diff 基准 —— 这正是上面「只剩 2 个键」的直接原因。改为深拷贝。
- 新增 `ValentineConfig.debugSharePayload()` 与 `resolveFromEncoded()` 供测试与调试。

### fix(a11y) — 实测出来的，不是猜的

- **`--ink-faint` / `--ink-soft` 本身不达 WCAG AA**：axe-core 实测 `.plate-seq`（「1 / 8」展签序号）对比度仅 2.1:1。三档墨色改为实色：`#4a3a33` 10.3:1 / `#6b5a52` 6.3:1 / `#7a6a62` 4.9:1（对 `--paper`）。顺带解决 alpha 文本叠在 mesh gradient 上导致 axe 只能标「待复核」的问题。
- **触摸目标 < 44px**：音乐胶囊与分享按钮实测 34px 高，滑块命中区 22px 高，开场「进入」按钮 40px 高。均已修到 ≥44px（视觉不变，只放大命中区）。
- **`.intro-sub` 叠加 `opacity: .85`** 把对比度压到约 4.1:1，已移除。
- **音乐胶囊压住章节进度线**：窄屏改为给 `.container` 预留 60px 顶内边距（注意 `≤360px` 的 `padding` 简写会覆盖 `≤480px` 的值，必须重声明）。
- 复测结果：首页 / 档案 / 心动三章 **axe-core 0 violations**（剩余条目是 canvas 背景导致的「需人工复核」，已逐项数值核对达标）。

### fix(layout)

- 信封闭合态信纸底部会露出信封 12px 白边（`translateY` 位移过大）。闭合位移由 58% 收到 42%，实测 `sheetBottomInsideShell=true`。
- 信封展开时按钮从 1 个变 2 个导致 20px 版面跳动。改为窄屏成对布局，闭合/展开始终同一行高，实测 `#envelope` 在两种状态下位置完全一致。
- 照片章在 320px 令音乐胶囊与进度线重叠（`≤360px` 覆盖所致），已修。

### docs & tools

- 新增 `tools/qa/`：可复现的真实浏览器 QA（`build-batch.js` 把人类可读的 steps 翻译成 agent-browser 的 batch JSON；`diag/check/env/share` 是注入页面的诊断脚本；`run.sh` 一键跑）。320 / 390 / 回归三套步骤已入库。
- THIRD_PARTY / ARCHITECTURE / CONFIG_SCHEMA / ROADMAP 同步。

---

## 1.1.0 — productize（2026-09-15）

- 设计令牌系统：`:root` 全量令牌（paper/ink/accent/space/motion/font/fx），hallmark gate 48 通过
- 章节旅程：进度细线 + 壹-柒 kicker，`experience.chapters` 可覆盖
- 八章情绪化重构：美术馆展签照片、便签任务、拆信惊喜、电影结尾庆祝（卡片溶解）
- View Transitions（同文档）步骤转场，`sectionIn` 兜底
- 信件/回忆章节（陆·来信）：`story.letters`，空数组自动跳过，语音播放器
- 声音系统：BGM 音量渐变、Web Audio 章节微音效、`sound` 配置化
- config schema：metadata / media / theme / story / experience 分层，旧格式全兼容
- 人物照片移出流程（保留于 assets 供全息卡片）

## 1.0.0 — qa-passed（2026-09-15）

- 第一屏：A 暖奶油背景 + Redouté《Les Roses》玫瑰（白底烘焙 alpha）
- site 级 mesh gradient，全流程同一世界
- 全局视觉系统（去 emoji / 去 three.js / 去网络字体）
- 照片灯箱（GLightbox）、加载态、错误态
- grill-me 终审修复（键盘可访问、照片预取、caption 可读性）

## 1.0.0-baseline

- 母版 valentine2026（MIT）+ 粒子玫瑰第一屏（已被替换，历史保留）
