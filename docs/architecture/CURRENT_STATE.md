# Lover-page · 当前状态（Current State）

> 这份文件是**给下一个 Agent 的第一份事实快照**。
> 它必须随每次实质性改动更新。不确定的数字不要写进来 —— 去实测。

**最后更新**：2026-09-15

---

## 1. 仓库事实

| 项 | 值 |
|---|---|
| 远程 | `https://github.com/z180-arch/Lover-page.git` |
| 主分支 | `main` |
| 历史基线 tag | `v1-template-foundation` · `v1.3-theme-layer` · `v1.4-config-contract` |
| 本轮起始 HEAD | `55832c2`（上一轮 1.3.1 的收口提交） |
| 技术栈 | 零构建 / 零框架 / 纯静态 / Vanilla JS + CSS + HTML |
| 依赖安装步骤 | **无**（无 `package.json`、无 `node_modules`） |
| 运行方式 | `python -m http.server 8899 --bind 127.0.0.1` |
| 部署 | 任意静态托管（同源、相对路径、vendor 本地化、无 CDN） |
| 脚本加载顺序 | `themes/*` → `config` → **`diagnostics`** → `config-system` → `state` → `theme` → `vendor` → `js/core/text` → `js/chapters/gauge` → `script.js` → `js/intro.js`（顺序是契约，见 CONFIG_CONTRACT §10） |

## 2. 文件职责

```
index.html            章节 DOM 骨架 + 脚本加载顺序 + 运行时错误探针
config.js             唯一内容入口（导出 DEFAULT_CONFIG / VALENTINE_CONFIG）
config-system.js      ?conf= 分享链接：校验 diff → 安全深合并（473 行）
diagnostics.js        window.LPDiagnostics —— 运行时诊断注册表（175 行）
state.js              appState 状态机 + 章节旅程 + 面板溶解标记 + View Transitions
theme.js              主题令牌应用层（preset + 实例覆盖 → CSS 自定义属性）
script.js             页面编排 + 各章节 renderer + 声音 + 分享（943 行）
js/core/text.js       （拆分）window.LPText = esc / textPool / pickRandom（56 行）
js/chapters/gauge.js  （拆分）window.LPGauge = 刻度盘几何与计算（142 行）
js/intro.js           （ESM）第一屏 + site 级 mesh gradient
styles.css            :root 令牌兜底 + 全站样式（含每章视觉语言）
css/intro.css         第一屏样式
themes/warm-paper.js  主题 preset（默认）
themes/night-archive.js
themes/modern-paper.js
themes/index.js       preset 注册表 + 解析
vendor/               mesh-gradient（MIT）· GLightbox（MIT）
tools/media/          image-dims.js   零依赖图片尺寸探针（JPEG/PNG/WebP 头解析，--json / --snippet）
tools/qa/             真实浏览器 QA + Node 回归：
                        run.sh                 本地运行器（Windows 上 dirname 缺失，见 AGENTS §5）
                        build-batch.js         steps.txt → batch JSON（@name 展开为 .qa/<name>.js）
                        diag.js / probe.js / theme.js / contrast.js / probe-contract.js
                        config-suite.js        ★ 99 断言：契约 / 安全 / 兼容（vm 独立 realm）
                        module-suite.js        ★ 63 断言：LPText / LPGauge 纯函数
                        steps-mobile-320 / steps-mobile-390 / steps-regression
                        steps-theme-check（三主题确定性巡章）/ steps-contrast（像素回读）
                        steps-contrast-intro（开场页像素回读）/ steps-regression（320 真实点击）
                        steps-config-security（注入面 / 尺寸预留 / 非法配置诊断）
docs/research/        调研记忆（避免重复调研）
docs/architecture/    架构 · ADR · ★ CONFIG_CONTRACT.md（配置的唯一权威契约）
docs/design/          设计系统 · 主题注册表 · COMPOSITION_SYSTEM（8 章叙事骨架分析）
docs/qa/              PERFORMANCE_BASELINE.md（真实测得的性能基线）
docs/product/         功能注册表
```

## 3. 章节状态

| step | id | 章名 | 视觉语言 | 状态 |
|---|---|---|---|---|
| 1 | `home` | 序 | 舞台卡 + 大标题 | stable |
| 2 | `quiz` | 默契 | 对话选项 | stable |
| 3 | `meter` | 心动 | 模拟仪器（SVG 刻度盘 + 阻尼指针 + 量程限位 + 爆表峰值） | stable |
| 4 | `questions` | 想问你 | 编辑设计引文（folio + 细线 + `text-wrap: pretty`） | stable |
| 5 | `smallthings` | 小事 | 便签纸（横格周期 == `line-height`） | stable |
| 6 | `photos` | 私人档案 | 美术馆展签 + 联系印样索引 | stable |
| 7 | `letters` | 来信 | 私人信笺 + 语音播放器 | stable |
| 8 | `surprise` | 惊喜 | 信封三层（袋/盖/纸）`rotateX(118deg)` | stable |
| — | `celebration` | 落幕 | 电影结尾（面板溶解 + 花瓣迸发） | stable |

## 4. 主题状态

| 名称 | 标签 | 面板 | 溶解章节 | 状态 |
|---|---|---|---|---|
| `warm-paper` | 暖纸 · 博物馆编辑设计 | 白卡 14px | 8, 落幕 | stable（默认） |
| `night-archive` | 暗夜档案 · 暗画廊 | 深卡 6px | 6, 7, 8, 落幕 | stable |
| `modern-paper` | 现代纸本 · 极简编辑设计 | **无面板** | — | stable |

选择方式：`config.metadata.template`，临时预览用 `?theme=<name>`。

## 5. 已实测的量化基线

全部由 `tools/qa/` 的真实浏览器运行产出，**不是估算**。

| 指标 | 结果 | 证据来源 |
|---|---|---|
| 运行时 JS 错误 | **0** | `window.__lpErrors`（`tools/qa/probe.js`）；7 次采样全为 `no-errors` |
| 横向溢出 | **无**（320 / 390，三主题） | `@diag` 的 `horizontalOverflow: false` |
| 触摸目标 <44px | **0 个** | `@diag` 的 `underSizedTargets: []` |
| axe-core violations | **0**（`passes: 16`，需先关开场页；未关时 `passes: 15`，见下注） | `agent-browser a11y --tags wcag2a,wcag2aa,wcag21a,wcag21aa` |
| axe `incomplete: color-contrast` | 2 节点（`#musicToggle` / `#smallThingText`）→ **已用像素回读手工判定通过** | `@contrast` |
| 对比度（canvas 像素回读） | 最低 **4.69:1**（warm-paper `.share-btn`） | `tools/qa/steps-contrast.txt` |
| **开场页**对比度（三主题） | **PASS**：warm-paper `4.69:1` / night-archive `7.54:1` / modern-paper `5.59:1`，最差节点均为 `#introSub` | `tools/qa/steps-contrast-intro.txt` |
| 首屏总 transfer（修复后） | **491.61 KiB**（修复前 729.71 KiB，−32.63%）；请求数 24→22 | `docs/qa/PERFORMANCE_BASELINE.md` §3.5 |
| 音乐胶囊 × 章节进度线重叠 | 无 | `@check` |
| 信封几何（闭合态信纸不露边） | 通过 | `@env` |
| 三主题令牌区分度 | 两两不同（10 项指标） | `steps-theme-check.txt` |
| `dissolveSteps` 声明 ↔ 实际 | 三套主题**逐章吻合** | `@theme` 逐章采样 |
| 未知主题名兜底 | 退回 `warm-paper`，无未捕获异常 | `?theme=does-not-exist` |
| 主题 QA 批次失败项 | **0 / 115 条命令** | `steps-theme-check.txt` |
| 配置契约 / 安全断言 | **99 passed / 0 failed** | `node tools/qa/config-suite.js` |
| 拆分模块单元断言 | **63 passed / 0 failed** | `node tools/qa/module-suite.js` |
| 注入面（`renderPhoto`） | 恶意 `date` payload 被转义，`injectedImg: 0` | `steps-config-security.txt` |
| 照片尺寸预留 | `attrW/attrH` 与 `naturalW/naturalH` 一致，`object-position` 由 `focalPoint` 驱动 | `steps-config-security.txt` |
| 非法 `?conf=` 诊断 | 4 条诊断（`unknown-field` ×2 / `type-mismatch` ×2），配置回退默认 | `steps-config-security.txt` |
| 旧格式 photos 兼容 | 0 诊断、`attrW: null`（渲染层能处理缺失） | `steps-config-security.txt` |

**性能数值**：LCP / CLS / TTFB / FCP 已用 `agent-browser vitals` 在 320×568 / 390×844 / 1440×900
真实测得（本地 http、无 gzip，**不代表线上数字**），见 `docs/qa/PERFORMANCE_BASELINE.md`。
INP 在纯加载场景下测不到（无交互输入），文档里如实标注为未测得 —— 不要从别处借一个数字来填。

> **一屏盲区（2026-09-15 发现，已补）**：`steps-contrast.txt` 每段都是
> `wait → !click #introEnter → @contrast`，即**先关开场页再测**。于是开场页的
> `#introTitle` / `#introSub` / `#introEnter` 永远 `display:none`，axe 跳过、
> `@contrast` 也跳过 —— 每个访客看到的第一屏，反而成了唯一没有对比度证据的一屏。
> 已新增 `tools/qa/steps-contrast-intro.txt` 补上（在点掉之前测）。
> **教训：只要测试脚本开头有一步「关掉某个覆盖层」，那个覆盖层自身就必然成为盲区。**
>
> **axe 的 `passes` 数与页面状态相关**：开场页未关时 15（3 个开场页节点落入
> `incomplete`），关掉后 16。两次 `violations` 都是 0。**报数时必须写清是什么状态**，
> 否则会被误读成「无障碍退步了」。

### QA 工具链的两个坑（踩过，别重踩）

1. **`agent-browser batch` 不要接管道**。`... | tail -40` 会让批次以 `SIGTERM` 中止、
   输出为空（EXIT=1）。要截取尾部就重定向到文件再读：
   `agent-browser batch < x.batch.json > .qa-out/x.log 2>&1`。另外批次前先
   `agent-browser close --all` 清掉残留 daemon，否则会挂住。
2. **不要用「连点按钮」做多章巡检**。390×844 下三套主题只差几百毫秒的固定 `wait`，
   就会在章节切换的瞬间点到 0×0 的元素上，`getBoundingClientRect()` 返回全零、
   `elementFromPoint` 返回 `<html>`，于是断言**全部假失败**（曾误判为
   「canvas 遮挡按钮」）。巡章请用 `window.appState.setState({currentStep:N})`，
   确定、且能覆盖全部 8 章；真实点击的最小证明留给 `steps-regression.txt`。

## 6. 已知问题（真实存在，未修）

**本轮（1.4.0）已解决、从下表移除**：语义校验层缺失（现由 `config-system.js` + `diagnostics.js`
+ `CONFIG_CONTRACT.md` 三层承担）、`photos` 无 `width/height`、`photos` 无 `focalPoint`、
`renderPhoto()` 的注入面、`fillPercent(NaN)` 静默画不出弧线、`touchUnder44` 假失败、
`esc()` 覆盖面无机制保障（新增 `tools/qa/innerhtml-guard.js`）。

**1.5.0 已解决、从下表移除**：两张相册图在首屏被无条件预取（占首屏 transfer 32.8%）——
已加可见性守卫，首屏 729.71 → 491.61 KiB；预取 URL 与渲染层不一致（`p.src` vs
`p.thumb || p.src`）；开场页对比度盲区（新增 `steps-contrast-intro.txt`）。

| # | 问题 | 影响 | 位置 |
|---|---|---|---|
| 1 | **字符串字段没有协议白名单** | `photos[0].src` 可以是 `javascript:` / `data:text/html,…`。转义（`esc()`）挡住了标签注入，但**不挡协议**。当前威胁模型是「自己改自己的 config」，所以可接受 —— 但做在线编辑器之前必须补 | `config-system.js` §13 |
| 3 | 字体子集化未做 | Windows/Android 上中文衬线渲染不一致；排版质感依赖系统字体 | ROADMAP |
| 4 | 信封壳 / 信纸对比度过低 | 两者都是浅奶油（`#fdfaf3→#f7eadd` vs `#f7eadd→#efdccb`），材质的「厚度感」不足，读起来偏平。**颜色已全部令牌化**（`--sheet-bg` / `--flap-bg` / `--tape` / `--seal`），换主题会跟着走，但暖纸主题下这组值本身区分度不够 | 视觉审计 |
| 5 | 默契章（壹）缺少「自己的物类」 | `docs/design/COMPOSITION_SYSTEM.md` 逐章比对 8 章的叙事骨架，发现其余各章都有专属视觉语言，唯有「默契」只是「对话选项」，还没像首页那样有一个可辨识的核心物件（首页有舞台卡 + 玫瑰、档案章有展签 + 印样索引） | COMPOSITION_SYSTEM §5 |
| 6 | `script.js` 943 行 | 低于 ADR-001 的 1400 行门槛，拆分第一层已落地（`js/core/text.js` + `js/chapters/gauge.js`）。下一层目标见 ADR-001，**不要为拆而拆** | ADR-001 |
| 7 | 时间轴章未实现 | `story.timeline` / `promises` / `memories` 字段已预留且契约已声明项形状，但无 renderer | ROADMAP |
| 8 | `--ink-muted` 已加入令牌但无使用点 | 死令牌（纯装饰档预留） | styles.css |
| 9 | 契约里的「保留区」字段没有读取方 | `metadata.author/created/version`、整个 `media.*`、`experience.chapters[].id`、`person.avatar/birthday/relationship`、`floatingEmojis.*` 能通过校验但没有渲染层读它们。**不要在这个基础上写新代码** | CONFIG_CONTRACT §7 |
| 10 | 数字字段无区间校验 | `theme.motion.petalCount: 99999`、`sound.volume: 900` 都会被接受；夹取在渲染层。契约层只保证类型与安全 | CONFIG_CONTRACT §13 |
| 11 | 无 CSP | 静态站可加 `Content-Security-Policy` meta，但当前内联脚本较多，加了会破。需要先分离内联脚本 | index.html |
| 12 | **LCP 主图 `redoute-gallica-bloom.webp` 未优化** | 198.60 KiB 单文件不分视口下发，占首屏 transfer **40.4%**（优化后占比反而升高）。320/390 小屏严重过剩，是当前 LCP 的主要成本。**基线 §5 假设 2** | `assets/art/` |
| 13 | **LCP 测不准** | 注入式 `PerformanceObserver` 在浏览器上下文冷启动首跳有注册竞态，捕获率低（本轮 390 仅 1/5）；且首页开场缩放动画本身导致 LCP 在 644–3364ms 间抖动。**结论：本项目的 LCP 在自动化冷启动下无法稳定定量**，改善需先在动画结束后读 `buffered` 条目重做测量方法 | PERFORMANCE_BASELINE §2.6 |
| 14 | 首屏 JS 仍有 95.70 KiB 与首屏无关 | `vendor/glightbox.min.js`（55.27）+ `mesh-gradient.esm.js`（26.71）+ `glightbox.min.css`（13.72），仅第 6 步/装饰用，却同步阻塞首屏。**基线 §5 假设 3**。注意 `mesh-gradient` 是 canvas 底衬依赖，延迟它要先确认不影响首屏观感 | PERFORMANCE_BASELINE §5 |

## 7. 明确不做（不要再"顺手加上"）

- 构建器 / 框架 / TypeScript 迁移（无证据证明是瓶颈）
- 数据库 / 后端 / 账号 / 云同步 / 在线编辑器 / 模板市场
- WebGL / 粒子 / shader 特效
- `templates/` 目录抽取（等第二个真实实例）
- `create-lover-page` 生成器（等「配置+素材=网页」被验证）
- SaaS 化

依据见 `AGENTS.md` §3 与各 ADR 的 Trade-offs。
