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
| 历史基线 tag | `v1-template-foundation` |
| 本轮起始 HEAD | `df6b8e9` |
| 技术栈 | 零构建 / 零框架 / 纯静态 / Vanilla JS + CSS + HTML |
| 依赖安装步骤 | **无**（无 `package.json`、无 `node_modules`） |
| 运行方式 | `python -m http.server 8899 --bind 127.0.0.1` |
| 部署 | 任意静态托管（同源、相对路径、vendor 本地化、无 CDN） |

## 2. 文件职责

```
index.html            章节 DOM 骨架 + 脚本加载顺序 + 运行时错误探针
config.js             唯一内容入口（导出 DEFAULT_CONFIG / VALENTINE_CONFIG）
config-system.js      ?conf= 分享链接（diff → 深合并 → 形状校验）
state.js              appState 状态机 + 章节旅程 + 面板溶解标记 + View Transitions
theme.js              主题令牌应用层（preset + 实例覆盖 → CSS 自定义属性）
script.js             页面编排 + 各章节 renderer + 声音 + 分享（987 行）
js/intro.js           （ESM）第一屏 + site 级 mesh gradient
styles.css            :root 令牌兜底 + 全站样式（含每章视觉语言）
css/intro.css         第一屏样式
themes/warm-paper.js  主题 preset（默认）
themes/night-archive.js
themes/modern-paper.js
themes/index.js       preset 注册表 + 解析
vendor/               mesh-gradient（MIT）· GLightbox（MIT）
tools/qa/             真实浏览器 QA：
                        run.sh              本地运行器（注意 Windows 上 dirname 缺失，
                                            手动用 node build-batch.js + agent-browser batch）
                        build-batch.js      steps.txt → batch JSON（@name 展开为 .qa/<name>.js）
                        diag.js / probe.js / theme.js / contrast.js   诊断脚本
                        steps-mobile-320 / steps-mobile-390 / steps-regression
                        steps-theme-check（三主题确定性巡章）/ steps-contrast（像素回读）
docs/research/        调研记忆（避免重复调研）
docs/architecture/    架构与 ADR
docs/product/         功能注册表
docs/design/          设计系统与主题注册表
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
| axe-core violations | **0**（`passes: 16`） | `agent-browser a11y --tags wcag2a,wcag2aa,wcag21a,wcag21aa` |
| axe `incomplete: color-contrast` | 2 节点（`#musicToggle` / `#smallThingText`）→ **已用像素回读手工判定通过** | `@contrast` |
| 对比度（canvas 像素回读） | 最低 **4.69:1**（warm-paper `.share-btn`） | `tools/qa/steps-contrast.txt` |
| 音乐胶囊 × 章节进度线重叠 | 无 | `@check` |
| 信封几何（闭合态信纸不露边） | 通过 | `@env` |
| 三主题令牌区分度 | 两两不同（10 项指标） | `steps-theme-check.txt` |
| `dissolveSteps` 声明 ↔ 实际 | 三套主题**逐章吻合** | `@theme` 逐章采样 |
| 未知主题名兜底 | 退回 `warm-paper`，无未捕获异常 | `?theme=does-not-exist` |
| 主题 QA 批次失败项 | **0 / 115 条命令** | `steps-theme-check.txt` |

**尚未测量**：LCP / CLS / INP 实际数值。零构建项目没有 Lighthouse 集成，
且网格渐变 canvas 会在不同设备上表现不同。**不要声称性能数字**，
直到有人真的用 Lighthouse 在这台机器上跑过并记录结果。

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

| # | 问题 | 影响 | 位置 |
|---|---|---|---|
| 1 | 语义校验层缺失 | 配置写错只表现为「某处文案没出现」，没有明确报错 | ADR-002 §Migration |
| 2 | `photos` 无 `width/height` | 图片加载前容器高度未知 → 潜在 CLS | ADR-004 |
| 3 | `photos` 无 `focalPoint` | 竖构图照片居中裁切，可能切到主体 | ADR-004 |
| 4 | 字体子集化未做 | Windows/Android 上中文衬线渲染不一致；排版质感依赖系统字体 | ROADMAP |
| 5 | 信封壳 / 信纸对比度过低 | 两者都是浅奶油（`#fdfaf3→#f7eadd` vs `#f7eadd→#efdccb`），材质的「厚度感」仍不足，读起来偏平。**颜色已全部令牌化**（`--sheet-bg` / `--flap-bg` / `--tape` / `--seal`），所以换主题会跟着走，但暖纸主题下这组值本身区分度不够 | 视觉审计 |
| 6 | `script.js` 987 行 | 接近但未超 ADR-001 的 1400 行门槛（本轮 +39 行：kicker 渲染、跳章判定、主题取值） | ADR-001 |
| 7 | 时间轴章未实现 | `story.timeline` 字段已预留但无 renderer | ROADMAP |
| 8 | `--ink-muted` 已加入令牌但无使用点 | 死令牌（纯装饰档预留） | styles.css |

## 7. 明确不做（不要再"顺手加上"）

- 构建器 / 框架 / TypeScript 迁移（无证据证明是瓶颈）
- 数据库 / 后端 / 账号 / 云同步 / 在线编辑器 / 模板市场
- WebGL / 粒子 / shader 特效
- `templates/` 目录抽取（等第二个真实实例）
- `create-lover-page` 生成器（等「配置+素材=网页」被验证）
- SaaS 化

依据见 `AGENTS.md` §3 与各 ADR 的 Trade-offs。
