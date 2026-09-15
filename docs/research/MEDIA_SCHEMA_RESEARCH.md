# 媒体（照片）Schema 调研：零构建静态站点的图片稳定 / 响应式 / 焦点裁切

> **一句话结论（最重要的取舍）**：这个项目是纯静态、零构建、零框架，照片只有 8 张本地 jpg；最务实、收益最大且零维护成本的落地方式是 **给 `photos[]` 每项加 `width`/`height` + 可选 `focalPoint`，用原生 `loading="lazy"`（首屏主图用 `eager`/`fetchpriority="high"`）+ CSS `object-fit: cover` + `object-position` 驱动焦点**。**不要引入 srcset 多分辨率管道、不要引入 `<picture>`+AVIF/WebP 自动转换、不要引入任何构建器/打包器/懒加载库作为必需依赖**——这些对 8 张私人照片是过度工程，且违反「放进目录就能跑」的硬约束。

核实时间：**2026-09-15**。所有 stars / 许可证 / commit 日期均来自 GitHub API / 仓库 LICENSE 文件实测，未凭记忆断言。

---

## 1. 零构建静态站点防 CLS 的标准做法

### 现代写法
给每个 `<img>` 加上 **`width` / `height` 属性（写图片原始像素尺寸，无单位）**，再在 CSS 里写 `height: auto; max-width: 100%;`（或 `width: 100%`）。例：

```html
<img src="landscape-01.jpg" width="1600" height="1067" alt="...">
```
```css
img { height: auto; max-width: 100%; }
```

### 浏览器机制（核心）
自 2019 年起，现代浏览器会把 `<img>` 的 `width`/`height` 属性**当作 aspect-ratio 的呈现提示**：在图片下载、解码之前，浏览器就用 `width / height` 算出固有宽高比，并据此预留容器高度，从而消除 CLS。该提示的 CSS 优先级为 0，会被作者 CSS 覆盖（web.dev 称其以 `img[Attributes Style] { aspect-ratio: auto 640 / 360; }` 形式存在）。

- 权威说明 1：web.dev《Optimize Cumulative Layout Shift》—— "Modern browsers set the default aspect ratio of images based on an image's width and height attributes... set those attributes on the image and including `height: auto`"。（https://web.dev/optimize-cls/）
- 权威说明 2：web.dev《Key performance issues》—— "Starting in 2019, browser behavior was updated to handle the width and height attributes differently... divide these values to determine an img element's intrinsic aspect ratio prior to the page being rendered."（https://web.dev/learn/images/performance-issues）

### 关键坑（务必避免）
**不要用 `width: auto; height: auto; max-width: 100%;` 这种「响应式老写法」**。`width: auto` 会覆盖浏览器从属性算出的宽度，使未加载图片被解析为 0×0，空间预留失效，CLS 照旧发生；且 `aspect-ratio` CSS 也救不回来（因为宽度为 0 时比值为 0）。正确只写 `height: auto; max-width: 100%;`。

- 来源：corewebvitals.io《Fix Layout Shift caused by auto sizing image》—— "The `width: auto` declaration is the problem. It overrides the width that the browser calculates from your HTML width and height attributes..."（http://corewebvitals.io/pagespeed/fix-layout-shift-caused-by-auto-sizing-image）

> 对本项目的含义：在 `config.js` 的 `photos[]` 里补 `width`/`height`，并在 `styles.css` 里确认画廊图片用的是 `height: auto` 而非 `width: auto`。这是**唯一必须的代码改动**，且零成本。

---

## 2. 响应式图片在「无构建」前提下的现实选择

### srcset + sizes（手写）现实吗？
`srcset="x-400.jpg 400w, x-800.jpg 800w" sizes="(max-width:768px) 100vw, 50vw"` 的前提是**你真有多个分辨率的文件**。无构建环境下，这意味着你要手动用工具（如 ImageMagick / squoosh.app）把每张图导出 2–4 种尺寸并手动维护清单——对 8 张私人照片属于高维护、低收益。

### `<picture>` + AVIF/WebP fallback 维护成本？
需要先把每张 jpg 转成 AVIF/WebP，再写：
```html
<picture>
  <source srcset="x.avif" type="image/avif">
  <source srcset="x.webp" type="image/webp">
  <img src="x.jpg" width=".." height="..">
</picture>
```
「生成 AVIF/WebP」本身就是一个**图片处理管道**（哪怕你只手动跑一次），违背了零构建、放进目录就能跑的约束；且本项目 `media.photos` 目录约定是 jpg/webp 单文件。

### 如果用户只有一张 jpg，是否值得引入 srcset？
**不值得。** 单张优化过的 jpg（或手动转一次 webp）配合 `width`/`height` + `object-fit: cover`，在 8 图画廊里体积与体验都已足够。实测数据也表明：图片体积优化主要靠「减小传输体积」，而 `srcset` 的边际收益在桌面大屏才明显（web.dev 实验：Vodafone 把 LCP 改善 31% 带来 8% 销售提升，但这是百万级图站的结论，不适用本场景）。

### 明确取舍建议
- **默认不做 srcset、不做 `<picture>`。** 保持单文件（建议手动转一次 WebP 进一步瘦身，这是一次性人工操作，不算构建管道）。
- **只在一种情况考虑 `<picture>`/srcset**：用户明确要把同一张图在移动端/桌面端用不同裁切（art direction），且愿意手动维护多文件。本项目当前没有这个需求。
- 真正必做的是第 1 节的 `width`/`height`（防 CLS）和第 3 节的加载属性。

- 来源：web.dev《Responsive images》—— `max-inline-size: 100%; block-size: auto; aspect-ratio; object-fit: cover` 的响应式与裁切写法（https://web.dev/learn/design/responsive-images）；web.dev《Browser-level image lazy loading》（https://web.dev/i18n/zh/lazy-loading-images）。

---

## 3. `loading` / `decoding` / `fetchpriority` 的正确取值

场景：画廊有很多图（8 张），但首屏有 1 张主图（hero，`theme.hero.rose` + 画廊首图）。

### 取值建议
| 元素 | `loading` | `decoding` | `fetchpriority` |
|---|---|---|---|
| 首屏主图（hero / 画廊第 1 张，属 LCP） | `eager`（或不写） | `async` | `high`（全页最多 1 个） |
| 首屏外画廊图片 | `lazy` | `async` | 默认 `auto`（不写） |

- **`loading="lazy"`**：原生懒加载，图片进入视口前约 1250px（4G）才加载。Chrome 实验：4G 下 97.5% 的懒加载图在进入视口 10ms 内已加载完；2G 下 92.6%。**切勿对 LCP 图用 `lazy`**——这是最常见的 LCP 杀手（Web Almanac 2024：约 16% 移动页面对 LCP 图懒加载）。（https://web.dev/i18n/zh/lazy-loading-images）
- **`decoding="async"`**：图片解码不阻塞主线程/其他渲染，对所有图都安全可取。
- **`fetchpriority="high"`**：仅给**唯一**的 LCP 主图，告诉浏览器提前抓取。web.dev 引 Google Flights 实测：LCP 从 2.6s 降至 1.9s。注意：**全页最多一个 `high`**，多了浏览器无法区分、效果消失。Firefox 于 2024-10 跟进支持。（来源：MDN fetchpriority 参考 + xictron 实测汇总，见下）

### 浏览器支持（实测核实）
- `loading`：Chrome 77+、Firefox 75+、Safari 15.4+（~95%+）。不支持时**优雅降级为 eager**，无需 polyfill。
- `fetchpriority`：Chrome/Edge 101+，Firefox 132+，Safari 17.2+（MDN 标注 Baseline 2024「Newly available」）。不支持的浏览器直接忽略该属性，无害。
- `decoding`：Chrome 65+、Firefox 63+、Safari 14.1+，广泛支持。

- 来源：MDN《fetchpriority》—— 完整兼容表（https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/fetchpriority）；web.dev 懒加载文（https://web.dev/i18n/zh/lazy-loading-images）；xictron《Adaptive Image Loading》实测数据（https://www.xictron.com/en/blog/adaptive-image-loading-avif-lazy-shops-2026）。

> 对本项目的含义：画廊图统一 `loading="lazy" decoding="async"`；`theme.hero.rose` 与画廊首图（若首屏可见）用 `loading="eager" decoding="async" fetchpriority="high"`。注意全页只放一个 `fetchpriority="high"`。

> **实测补记（2026-09-15，性能基线轮）—— `loading="lazy"` 有一个它管不到的地方**：
> 本站曾出现「两张只属于第 6 步相册的图在首屏被完整下载、占首屏 transfer 33.5%」的问题。
> 直觉答案「给它们加 `loading="lazy"` 就好了」是**错的**，加完测出来零效果。真实根因是
> `script.js` 的相邻照片预取用了 **`new Image()` 手动预取**（`script.js:518-541`）——
> 该属性只作用于**解析出的 `<img>` 元素**，对 JS 手动创建的 `Image` 对象**完全无效**。
> 修复方式不是加属性，而是在预取前加**可见性守卫**（`if (!section.classList.contains('hidden'))`）。
> 教训：`loading="lazy"` 的正确性只覆盖「HTML 里的图片」；只要代码里存在 `new Image()` /
> `fetch()` / `IntersectionObserver` 之外的任何主动预取路径，懒加载策略就必须逐条重新审计，
> 不能靠属性推断。详见 `docs/qa/PERFORMANCE_BASELINE.md` 的修复前后对照。

---

## 4. `object-position` 配合 focalPoint 的标准做法

### 映射关系（确认正确）
`focalPoint: { x, y }` 归一化到 `0..1` 时，渲染为：
```css
object-position: calc(x * 100%) calc(y * 100%);
```
即 `focalPoint: {x:0.5, y:0.3}` → `object-position: 50% 30%`。**这是正确的**，因为 CSS `object-position` 的语义是：把图片自身的「X% 处」对齐到容器的「X% 处」——这正是 focal point（焦点保持在框内可见区域中心）的标准实现，与 `background-position` 行为一致。

### `object-fit: cover` 下 focal point 的语义
- `object-fit: cover`：图片按自身宽高比放大到铺满容器，超出部分裁切，不变形。
- `object-position`（默认 `50% 50%` 居中）决定裁切时**保留哪一块**。竖构图照片用居中裁切可能切掉主体（人像头部/脚部），把焦点设到主体位置即可避免。
- 权威写法（web.dev）：
  ```css
  img { max-inline-size: 100%; block-size: auto; aspect-ratio: 2/1; object-fit: cover; object-position: top center; }
  ```
  "You can change the position of the image crop using the object-position property. This adjusts the focus of the crop, so you can make sure the most important part of the image is still visible."（https://web.dev/learn/design/responsive-images）
- MDN《object-position》参考（https://developer.mozilla.org/en-US/docs/Web/CSS/object-position）。

### 实现要点
- `focalPoint` 应作为 `photos[]` 的可选字段（缺省 `{x:0.5, y:0.5}`）。
- `object-position` 只在 `object-fit: cover` 且图片被裁切时才有可见效果，务必与 `object-fit: cover` 配套。
- 也可把焦点误配导致主体被裁的问题，通过手动调 `focalPoint` 修正，无需改图。

> 对本项目的含义：`styles.css` 画廊图用 `object-fit: cover`；JS 渲染时读 `photo.focalPoint`（回退 0.5/0.5）写入 `style="object-position: X% Y%"`。这是第二个推荐代码改动，零依赖。

---

## 5. 开源参考项目（已实测核实）

> 核实方式：GitHub Search API（`stargazers_count`）+ 仓库 `LICENSE` 文件原文 + 默认分支最新 commit（`list_commits`，per_page=1）。核实时间 2026-09-15。

### 5.1 vanilla-lazyload
- **URL**：https://github.com/verlok/vanilla-lazyload
- **许可证**：**MIT**（LICENSE 原文："MIT License, Copyright (c) 2025 Andrea Verlicchi"）—— 可复制代码（需保留版权声明）
- **Stars**：**7,854**（2026-09-15 查）
- **最近维护**：默认分支最新 commit 2026-09-11（dependabot 依赖 bump）—— 活跃
- **可参考思路**：纯 Vanilla JS、单文件、基于 IntersectionObserver 的懒加载；明确支持 `srcset`/`sizes`、响应式图片、原生 `loading`、`fetchpriority`、`aspect-ratio` 占位防 CLS。README 有大量「如何用 data 属性 + CSS aspect-ratio 预留空间」范例。
- **可复制性**：MIT，**可复制/借鉴**（保留 LICENSE）。
- **零构建可移植性**：**高**。单个 `lazyload.min.js` 丢进 `vendor/` 即可，`new LazyLoad()` 初始化，无构建、无依赖，完全契合本项目约束。

### 5.2 lazysizes
- **URL**：https://github.com/aFarkas/lazysizes
- **许可证**：**MIT**（LICENSE 原文："The MIT License (MIT), Copyright (c) 2015 Alexander Farkas"）—— 可复制代码
- **Stars**：**17,716**（2026-09-15 查）
- **最近维护**：默认分支（gh-pages）最新**源代码 commit 为 2021-05-17**；仓库 metadata `updated_at` 显示 2026-09-11（多为 dependabot / 仓库元数据活动，非功能更新）。**实际功能已基本停滞约 5 年**。
- **可参考思路**：经典高性能懒加载，`data-src`/`data-srcset` 模式、自动检测可见性变化、响应式图片、`data-sizes="auto"` 自动 sizes。曾是 web.dev 懒加载文章的对照基准。
- **可复制性**：MIT，**可复制/借鉴**。
- **零构建可移植性**：中。功能强但依赖 `data-src` 改写 DOM 模式，且原生 `loading="lazy"` 已覆盖其大部分价值；对本项目属**过度方案**，仅作思路参考，不建议引入。

### 5.3 smartcrop.js
- **URL**：https://github.com/jwagner/smartcrop.js
- **许可证**：**MIT**（LICENSE 文件为标准 MIT 许可正文，开头 "Copyright (c) 2016 Jonas Wagner"，未带 "MIT License" 字样但文本即 MIT）—— 可复制代码
- **Stars**：**12,953**（2026-09-15 查）
- **最近维护**：默认分支最新 commit 2024-03-16（仅 README 更新）；核心库长期稳定、少改动。
- **可参考思路**：**内容感知智能裁切**——在浏览器/Node 里分析图片，输出「最佳裁切框 / 焦点区域」（含 `x,y,width,height` 与 confidence）。这正是我们 `focalPoint` 字段的「自动计算」源头：可**在本地 Node 一次性跑** smartcrop 算出每张图的焦点，把结果写进 `config.js` 的 `focalPoint`，运行时不再依赖它。
- **可复制性**：MIT，**可复制/借鉴**（含算法思路与代码）。
- **零构建可移植性**：**高（但仅作离线计算工具）**。运行时无需引入；用它当「一次性 CLI/脚本」产出 `focalPoint` 值最合适。注意它依赖 canvas，浏览器端运行需 DOM，CLI 端需 `canvas` 包——所以定位为「开发期辅助」，产物是写进 config 的纯数字。

### 5.4 lozad.js
- **URL**：https://github.com/ApoorvSaxena/lozad.js（注意：owner 是 **ApoorvSaxena**，非 obetomuniz）
- **许可证**：**MIT**（LICENSE 原文："The MIT License (MIT), Copyright (c) 2017 Apoorv Saxena"）—— 可复制代码
- **Stars**：**7,494**（2026-09-15 查）
- **最近维护**：默认分支最新 commit 2025-09-14（dependabot 依赖 bump）—— 基本维护中（仅依赖更新）
- **可参考思路**：极轻量（~1KB）、零依赖、纯 JS 的 IntersectionObserver 懒加载，支持响应式图片/iframe。比 vanilla-lazyload 更小。
- **可复制性**：MIT，**可复制/借鉴**。
- **零构建可移植性**：**高**。单文件丢进 `vendor/` 即用。但鉴于原生 `loading="lazy"` 已满足本项目需求，引入它的增量收益有限，可作「想要更小体积懒加载库」时的备选。

### 许可证清单（一句话）
四个项目**全部为 MIT**，均可在保留版权声明的前提下复制/借鉴代码；其中 vanilla-lazyload 与 lozad.js 最适合作为「drop-in 单文件库」，smartcrop.js 适合作离线计算 focalPoint 的工具，lazysizes 功能停滞、仅作思路参考。

---

## 6. 明确「不要做什么」（基于零构建约束）

1. **不要引入构建器 / 打包器**（webpack、Vite、Rollup、esbuild 等）作为项目必需步骤。本项目硬约束是「放进目录就能跑」，任何 `npm run build` 都违背它。需要压缩/转格式时，用一次性外部工具（如 squoosh.app、ImageMagick）手工处理，产物直接进 `assets/`。
2. **不要引入 srcset 多分辨率自动生成管道**。需要多文件 + 维护清单，对 8 张私人照片 ROI 极低，且通常依赖构建脚本。
3. **不要引入 `<picture>` + AVIF/WebP 自动转换**。AVIF/WebP 的生成本身就是图片处理管道；若要做，只能「手工转一次」并把单文件放进 `media.photos`，不要写转换脚本进仓库。
4. **不要把懒加载库当作必需依赖**。原生 `loading="lazy"` 已覆盖本项目需求；vanilla-lazyload / lozad.js 仅在你想要增强（如 blur-up 占位、更细的 rootMargin）时可选，且必须本地化进 `vendor/`（约束：vendor 全部本地化，禁 CDN）。
5. **不要引入 CDN 依赖 / 在线字体 / 在线图床**。所有资源本地化，离线可跑。
6. **不要引入服务端 / Node 运行时依赖到运行时**。smartcrop.js 只允许作为「开发期一次性脚本」算 focalPoint，产物是写进 `config.js` 的数字，运行时不需要它。
7. **不要对首屏 LCP 主图用 `loading="lazy"`**，也不要在页面放超过 1 个 `fetchpriority="high"`（见第 3 节）。

---

## 参考文献（真实 URL）

- web.dev《Optimize Cumulative Layout Shift》— https://web.dev/optimize-cls/
- web.dev《Key performance issues》(images & CLS) — https://web.dev/learn/images/performance-issues
- web.dev《Responsive images》— https://web.dev/learn/design/responsive-images
- web.dev《Browser-level image lazy loading》— https://web.dev/i18n/zh/lazy-loading-images
- MDN《fetchpriority》— https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/fetchpriority
- MDN《object-position》— https://developer.mozilla.org/en-US/docs/Web/CSS/object-position
- corewebvitals.io《Fix Layout Shift caused by auto sizing image》— http://corewebvitals.io/pagespeed/fix-layout-shift-caused-by-auto-sizing-image
- xictron《Adaptive Image Loading: AVIF, Lazy & Responsive 2026》(fetchpriority 实测数据) — https://www.xictron.com/en/blog/adaptive-image-loading-avif-lazy-shops-2026
- vanilla-lazyload — https://github.com/verlok/vanilla-lazyload
- lazysizes — https://github.com/aFarkas/lazysizes
- smartcrop.js — https://github.com/jwagner/smartcrop.js
- lozad.js — https://github.com/ApoorvSaxena/lozad.js

---

## 未能核实的事项（如实列出）

- **lazysizes 的「真实功能活跃度」**：默认分支（gh-pages）最新**源代码 commit 是 2021-05-17**；仓库 `updated_at` 显示 2026-09-11，但我无法确认该活动是 dependabot 还是人力维护（GitHub API 未直接区分）。结论按「功能停滞约 5 年」表述，但未逐条核对所有近期 commit 内容。
- **smartcrop.js 在浏览器端 vs Node 端运行的完整依赖清单**：我只核实了它是 MIT 且能做内容感知裁切，未实际运行其 CLI 验证 `canvas` 依赖在本地 Node 下的安装成本。
- **caniuse 的具体百分比数字**（loading ~95.82%、fetchpriority ~93.74%）：来自第三方博客（xictron）转述，非我直接查 caniuse 官网核实；浏览器版本门槛以 MDN 兼容表为准（已核实）。
- **Google Flights LCP 2.6s→1.9s 的原始实验**：来自 web.dev（经 xictron 引用），我未打开 web.dev 原始案例页逐一核对数字，仅引用其结论。
- **本项目照片的实际像素尺寸 / 是否含竖构图**：仅读了 `config.js` 的 schema，未打开 `./assets/photos/` 里的真实图片核实宽高比，因此无法断言哪几张需要 `focalPoint` 修正——这属于用户后续填数据时的决策。
- **`fetchpriority` 在 Safari 17.2 之前版本的精确行为**：MDN 标注 17.2 起支持（Baseline 2024），更早版本直接忽略属性（无害），我未做真机验证。
