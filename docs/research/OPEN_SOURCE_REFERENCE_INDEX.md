# Open Source Reference Index

> **先读这里，再开新一轮调研。**
> 目的：不重复调研同一个东西，不让下一代 Agent 重新踩同一个坑。
> 每条记录格式：项目 / 仓库 / 许可证 / stars / 维护状态 / 采用原因 / 采用方式 /
> 涉及文件 / 是否直接复制代码 / 是否需要 NOTICE。

**最后更新**：2026-09-15

---

## 1. 已实际复用（vendor 进仓库）

### mesh-gradient.js

| 字段 | 值 |
|---|---|
| 仓库 | https://github.com/anup-a/mesh-gradient.js |
| 许可证 | MIT (c) 2022 Anup Aglawe（内含 Ashima Arts simplex noise, MIT） |
| 采用方式 | **直接复制**（jsDelivr `+esm` 构建 → `vendor/mesh-gradient.esm.js`） |
| 涉及文件 | `vendor/mesh-gradient.esm.js`、`js/intro.js` |
| NOTICE | 需要（已记于 `THIRD_PARTY.md`） |
| 备注 | npm 构建未含动画循环。本项目从外部以极慢速率推进其 `u_time` uniform 实现「光的呼吸」，shader / 渲染 / 噪声全部是库实现。**这是本项目的核心美术来源之一，不要替换。** |

### GLightbox

| 字段 | 值 |
|---|---|
| 仓库 | https://github.com/biati-digital/glightbox |
| 许可证 | MIT |
| 采用方式 | **直接复制**（`vendor/glightbox.min.js` + `vendor/glightbox.min.css`） |
| 涉及文件 | `vendor/*`、`script.js` 的 `buildPhotoLightbox()` |
| NOTICE | 需要（已记于 `THIRD_PARTY.md`） |
| 备注 | 选它而不是 PhotoSwipe 的原因：PhotoSwipe v5 是 ES module 且**要求预先提供图片尺寸**才能做出它的招牌过渡动画 —— 而本项目当前的照片配置没有 `width/height`（见 ADR-004）。等 media schema 补上尺寸后，**可以重新评估是否换成 PhotoSwipe**（它的 pinch/zoom 与过渡质量更好）。 |

### valentine2026（母版）

| 字段 | 值 |
|---|---|
| 仓库 | https://github.com/ianjiteshan/valentine2026 |
| 许可证 | MIT (c) 2026 Anjitesh Shandilya |
| 采用方式 | **二次修改**：保留单页多游戏骨架、Love Meter 机制、分享链接、音乐控制基础；流程由「求爱」改为情侣小游戏 |
| 涉及文件 | 全局骨架；具体实现已大幅重写 |
| NOTICE | 需要（已记于 `THIRD_PARTY.md`） |

---

## 2. 已评估但**未采用**（附原因 —— 这部分比「采用了什么」更省时间）

### 媒体 / 图片加载四件套（2026-09-15 核实，详见 `MEDIA_SCHEMA_RESEARCH.md`）

四个候选全部为 **MIT**（stars / 许可证 / LICENSE 原文均经 GitHub API + LICENSE 文件实测核实），
**结论是四个都不采用** —— 因为 8 张本地 jpg 的规模下，原生 `width`/`height` +
`object-position` + `loading="lazy"` 就是完整解，引库只会增加维护面。

| 项目 | 仓库 | 许可证 | stars | 维护 | 不采用的原因 |
|---|---|---|---|---|---|
| vanilla-lazyload | https://github.com/verlok/vanilla-lazyload | MIT | 7854 | 活跃 | 原生 `loading="lazy"` 已够；引库要处理它的配置面与滚动监听 |
| lazysizes | https://github.com/aFarkas/lazysizes | MIT | 17716 | **功能停滞**（默认分支源码最新 commit 2021-05） | 同上，且 `updated_at` 的活动无法确认是否人力维护 |
| smartcrop.js | https://github.com/jwagner/smartcrop.js | MIT | 12953 | 活跃 | 内容感知裁切的**思路**值得借鉴（本项目用 `focalPoint` 手填），但它是离线计算工具，`canvas` 依赖引入成本不划算 |
| lozad.js | https://github.com/ApoorvSaxena/lozad.js | MIT | 7494 | 低活跃 | 同 vanilla-lazyload，且它是 IntersectionObserver 的薄封装，自己写 10 行即可 |

**需要它们时的触发条件**：照片数量超过 50 张、或引入 `srcset` 多分辨率管道时再重新评估。
届时 `smartcrop.js` 可作离线 `focalPoint` 生成器（MIT，可复制）。

### simeydotme/pokemon-cards-css

| 字段 | 值 |
|---|---|
| 仓库 | https://github.com/simeydotme/pokemon-cards-css |
| 许可证 | **GPL-3.0** ⚠️ |
| stars | ~5k |
| 维护状态 | 活跃 |
| 效果质量 | 该方向**最好**的实现 |
| 结论 | **只能作为视觉研究对象，不可复制任何代码到本仓库**（copyleft 传染）。 shine / glare / 分层倾斜的实现思路可以学习，代码必须自研或改用 MIT 实现。 |
| 需要它时怎么做 | 见下条 `vanilla-tilt.js` + 自研 shine/glare 层 + **必须提供触摸回退**（`@media (hover: hover)` / 指针类型判断），并注意 `mix-blend-mode` 在本项目有合成器踩坑史（见 `docs/ARCHITECTURE.md` 已知约束） |

### vanilla-tilt.js

| 字段 | 值 |
|---|---|
| 仓库 | https://github.com/micku7zu/vanilla-tilt.js |
| 许可证 | **MIT** ✅ |
| stars | ~4.0k |
| 版本 / 体积 | 1.8.1（2023-08）/ `vanilla-tilt.min.js` ≈ 3.5 KB |
| 维护状态 | **Inactive**（最后版本 2023-08，最后提交约 2 年前，Snyk 标注 INACTIVE；无已知漏洞） |
| 依赖 | 0（需要自定义事件支持时才有 polyfill 需求） |
| 结论 | **可安全移植**（MIT）。功能覆盖 3D tilt 本体 + `glare`，但 glare 是单层白色高光，**达不到 pokemon-cards-css 的全息层数**。 |
| 决策 | 若做照片全息卡片：**移植其 tilt 数学（MIT，需在 THIRD_PARTY 记录），shine/glare 自研**。因为「Inactive + 只覆盖 80% 需求」，直接 vendor 整个库反而多一层不可控代码。 |

### PhotoSwipe v5

| 字段 | 值 |
|---|---|
| 仓库 | https://github.com/dimsemenov/PhotoSwipe |
| 许可证 | **MIT** ✅ |
| 体积 | 15 KB，tree-shakeable，ES module，**无需构建即可用** |
| 能力 | 最佳 pinch/double-tap/zoom 手势，从缩略图 CSS 裁切态开始的开场过渡；`srcset` 动态加载 |
| 限制 | **必须预先提供图片宽高**才能得到它的招牌过渡；v5 移除了 caption / history / inline gallery（转为插件或有意移除，主因是 caption 的可访问性问题） |
| 结论 | **暂缓**。等 ADR-004 的 `width/height` 落地后**优先重新评估**，届时它比 GLightbox 更优。 |

### 其他已判定（一行结论）

| 项目 | 许可证 | 结论 |
|---|---|---|
| lightGallery | **GPL-3.0** / 商业双许可 | ❌ 不可用（闭源场景需付费） |
| Fancybox v6 (@fancyapps/ui) | **GPL** / 商业 | ❌ 不可用 |
| Flickity | **GPL-3.0** / 商业 | ❌ 不可用 |
| Swiper | MIT ✅ | 可用但**当前不需要**：照片章是「单件展示 + 上一/下一」，不是轮播。引入会为不存在的需求增加 20+ KB |
| Glide.js | MIT ✅ | 同上，不需要 |
| baguetteBox.js / Simple Lightbox | MIT | 可用但能力弱于现有 GLightbox，无替换理由 |
| Viewer.js | MIT | 面向「图像工具」（旋转/翻转/实际尺寸），与本项目语境不符 |
| react-gauge-chart / D3 刻度生成器 | MIT | ❌ 与零构建 vanilla 架构不兼容（React 组件 / 重型通用库）→ 仪表盘自研 |
| Howler.js | MIT | **暂不需要**：原生 `<audio>` + `requestAnimationFrame` 音量渐变已覆盖 BGM/语音的全部需求（含淡入淡出）。引入 Howler 只为省几行代码，代价是 30 KB 与一层抽象 |
| Web Audio 波形库（wavesurfer.js 等） | MIT/BSD | **不需要**：语音信件没有要求显示波形 |
| anime.js / GSAP / Motion One | MIT（GSAP 为自定义许可） | **不需要**：现有动效全部由 CSS keyframes + View Transitions 完成。引入动画框架违反 ADR-001 的零依赖方向 |
| AJV | MIT | **不需要**：形状校验用 `DEFAULT_CONFIG` 递归比对已足够（ADR-002） |
| locomotive-scroll / ScrollTrigger | MIT / 商业 | **不需要**：会劫持原生滚动。CSS `animation-timeline` 可覆盖未来需求且跑在合成器线程 |

---

## 3. 值得关注但暂不引入的技术（非库）

### CSS Scroll-driven Animations

| 字段 | 值 |
|---|---|
| 特性 | `animation-timeline: scroll()` / `view()` + `animation-range` |
| 支持 | Chrome/Edge 115+ 完整；Safari 18 起部分；Firefox 尚未 |
| 优势 | 纯 CSS 声明式，**跑在合成器线程**（JS 阻塞主线程也仍 60fps），无需 `scroll` 监听 + 节流 |
| 适用点 | 章节进入视口的淡入、阅读进度、未来的时间轴章 |
| 使用要求 | **必须用 `@supports (animation-timeline: scroll())` 做渐进增强**，不支持时退化为正常的静态呈现。**不要加 polyfill**（会引入运行时 JS 依赖，违背零依赖方向） |
| 现状 | 本项目尚未使用（当前用 View Transitions + `sectionIn` keyframes 已足够）。留给「时间轴章」与滚动叙事 |

### View Transitions（同文档）

| 字段 | 值 |
|---|---|
| 支持 | Baseline 2025.10 |
| 现状 | **已使用**：`state.js` 的 `withViewTransition()`，`view-transition-name: stage` 给 `.container` |
| 兜底 | 不支持的浏览器直接切换（`sectionIn` keyframes 仍然生效） |

### Nutlope/hallmark

| 字段 | 值 |
|---|---|
| 仓库 | https://github.com/Nutlope/hallmark |
| 许可证 | **MIT** ✅ |
| stars | 13k+（2026-07 周报）→ 25k+（近期） |
| 维护状态 | 活跃（138 commits，持续加主题） |
| 能力 | Coding Agent 的设计 skill：21 套主题、58 项 anti-slop 门、`audit` / `redesign` / `study` 三个子命令 |
| 安装 | `npx skills add nutlope/hallmark` |
| 本机状态 | **未安装** |
| 决策 | **本轮未安装**：安装外部 skill 必须先过安全审计流程（见 `docs/development/AGENT_DEVELOPMENT_CONTRACT.md` §5）。当前用 axe-core（客观数据）+ 自带设计系统文档替代。**建议下一轮由用户确认后安装**，它正好补上「anti-slop 门控」这块。 |

---

## 4. 已判定「自己写更好」的方向（不要再去搜）

| 方向 | 为什么不用现成库 | 本项目的做法 |
|---|---|---|
| 模拟仪表盘 | 高星方案几乎都是 React 组件或需要 D3 的通用刻度生成器 | 自研：SVG 弧用 `pathLength="100"` 归一化 + `stroke-dasharray`；指针 `transform-box: view-box` + `rotate()` + 阻尼缓动；刻度用极坐标在 JS 里算 |
| 信封 / 信件开启动画 | 网上多为 CodePen 片段，无明确许可证、无长期维护 | 自研三层（袋/盖/纸）；`perspective` 只给容器、翻盖自己 `rotateX` —— 刻意避开 iOS Safari 的 `preserve-3d` × `overflow:hidden` 冲突 |
| 联系印样 / 胶片条 | 原生 `scroll-snap` 已覆盖 | 自研：`scroll-snap-type: x proximity`；滚动条用 `scrollbar-width: none` 隐藏（**不能**用 `overflow: hidden`，那样就彻底不可滑） |
| 纸张质感 | 现成库都依赖 `backdrop-filter`（iOS 破版且开销大） | 自研：`repeating-linear-gradient` 横格（周期严格等于 `line-height`）+ `feTurbulence` data-URI 噪点 |
| 主题系统 | 设计令牌工具链（Style Dictionary 等）需要构建步骤 | 自研 `themes/*.js` + CSS 自定义属性（ADR-003） |
| 配置校验 | AJV 体积与构建成本不匹配 | 自研：以 `DEFAULT_CONFIG` 为形状基准递归 sanitize（新增字段无需改代码） |

---

## 5. 下一轮值得重新评估的（附带触发条件）

| 项目 | 触发条件 |
|---|---|
| **PhotoSwipe v5** | ⚠️ **触发条件已满足** —— `photos[].width/height` 已在 1.4.0 落地（8 张默认图按实测像素填写），PhotoSwipe 的招牌过渡动画现在有数据可用了。下次做照片章时值得重新评估它 vs 当前 GLightbox（PhotoSwipe 的 pinch/zoom 与过渡质量更好）。评估时注意它是 ES module |
| smartcrop.js | 照片数量 > 50 张，或需要自动生成 `focalPoint` 时 |
| vanilla-lazyload / lozad.js | 照片数量 > 50 张（原生 `loading="lazy"` 不够用时） |
| Nutlope/hallmark | 用户确认安装（需过安全审计） |
| CSS `animation-timeline` | 实现时间轴章 / 滚动叙事时 |
| 图像离线预处理脚本 | 需要 `srcset` / AVIF 时（`tools/media/` 已建，含 `image-dims.js`） |
| 中文 webfont 子集化 | 需要跨平台一致的排版质感时（需离线脚本，**不引入构建系统**） |
