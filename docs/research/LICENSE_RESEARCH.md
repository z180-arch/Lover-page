# License Research

> 引用任何外部代码/素材前先查这里。**没有记录 = 没有核实。**
> 判定口径：能否**复制代码进本仓库**。

**最后更新**：2026-09-15

---

## 1. 判定表

| 许可证 | 可否复制代码 | 附加义务 | 本仓库实例 |
|---|---|---|---|
| MIT | ✅ | 保留版权声明与许可文本 | mesh-gradient.js、GLightbox、vanilla2026 母版 |
| BSD-2/3-Clause | ✅ | 保留版权声明，3-Clause 另禁署名背书 | — |
| Apache-2.0 | ✅ | 保留 NOTICE、声明修改、含专利授权 | — |
| ISC | ✅ | 保留版权声明 | — |
| CC0 / Public Domain | ✅ | 无（仍建议记录来源） | Redouté《Les Roses》扫描件 |
| Unsplash License | ✅ 免费商用 | 不得转售/再分发原始照片、不得组建同类图库 | `assets/photos/landscape-*.jpg` |
| **GPL-2.0 / GPL-3.0** | ❌ | 传染：衍生作品必须以 GPL 发布 | ⚠️ `simeydotme/pokemon-cards-css` |
| **AGPL-3.0** | ❌ | 更严：网络服务使用也触发源码开放 | — |
| **LGPL** | ⚠️ 动态链接例外 | 静态复制进本仓库仍属传染 | — |
| **商业双许可（GPL + paid）** | ❌ | 闭源/商用需购买 | lightGallery、Fancybox v6、Flickity |

## 2. 本项目语境下的特殊说明

### 本项目自己的许可证

根目录 `LICENSE` 决定本仓库的分发条件。**在把任何新依赖 vendor 进仓库之前，
先确认它与本仓库 LICENSE 兼容。** 把 GPL 代码复制进 MIT 项目 = 让整个项目
事实上变成 GPL —— 这是不可逆的污染。

### GPL 项目可以怎么用

```
✅ 读它的源码，理解它怎么实现某个效果
✅ 看它的 demo 页面，提取视觉目标
✅ 用它的实现思路，自己重写
❌ 复制任何一行它的 CSS / JS / HTML 进本仓库
❌ 把它的构建产物 vendor 进来
❌ 逐行"翻译"成自己的写法（仍是衍生作品）
```

要类似效果时，**优先找 MIT / BSD / Apache 的替代实现**；
找不到就自研。如果一定要用 GPL 项目，必须先做明确的许可证兼容性判断，
并记录结论 —— 不允许「先用了再说」。

### 素材（图片/音乐/字体）与代码分开判定

| 来源 | 状态 |
|---|---|
| Wikimedia Commons（PD-old-70） | ✅ 可用，记录来源 URL 与作者 |
| Gallica（BnF） | ✅ 公有领域扫描件可用 |
| Internet Archive | ⚠️ 逐项判定，站内有非 PD 内容 |
| NASA | ✅ 多数为公有领域，个别含第三方版权，逐项判定 |
| Rawpixel Public Domain / Openverse | ✅ 有 PD/CC0 筛选，仍要逐项确认 |
| Unsplash / Pexels | ✅ 免费商用，但**不得转售或组建同类图库** |

**已入库素材的来源登记见 `THIRD_PARTY.md`。** 新增素材必须同时更新该文件。

### 字体

当前**不托管任何 webfont**，全部走系统字体栈。
若未来引入 Noto Serif SC / LXGW WenKai 等，注意：

- Noto 系列：**SIL Open Font License 1.1** —— 可自由使用/嵌入/再分发，
  但**不得单独售卖字体本身**，衍生字体不得使用保留字体名（RFN）。
- LXGW WenKai（霞鹜文楷）：**SIL OFL 1.1**，同样条件；且它是基于
  FONTWORKS 的 Klee One 的衍生，需保留上游声明。
- 子集化产物仍是衍生字体，**必须携带 OFL 文本**。

---

## 3. 已核实的项目清单

| 项目 | 许可证 | 核实依据 | 结论 |
|---|---|---|---|
| anup-a/mesh-gradient.js | MIT | 仓库 LICENSE + README | ✅ 已 vendor |
| biati-digital/glightbox | MIT | 仓库 LICENSE | ✅ 已 vendor |
| ianjiteshan/valentine2026 | MIT | 仓库 LICENSE | ✅ 二次修改 |
| micku7zu/vanilla-tilt.js | MIT | 仓库 LICENSE + npm metadata（Snyk 亦标 MIT） | ✅ 可移植（本次未用） |
| dimsemenov/PhotoSwipe | MIT | 官网 License 段明确 "free for personal or commercial projects (MIT license)" | ✅ 可用（暂缓） |
| simeydotme/pokemon-cards-css | **GPL-3.0** | 仓库 LICENSE | ❌ **仅研究，不可复制** |
| lightGallery | GPL-3.0 / 商业 | 官方许可说明（开源用 GPLv3，闭源需商业许可） | ❌ |
| Fancybox v6 | GPL / 商业 | 官方许可说明 | ❌ |
| Flickity | GPL-3.0 / 商业 | 官方许可说明 | ❌ |
| Swiper | MIT | 仓库 LICENSE（Copyright (c) 2019 Vladimir Kharlampidi） | ✅ 可用（不需要） |
| Nutlope/hallmark | MIT | 仓库 LICENSE（"Initial commit: Hallmark v0.2.0"） | ✅ 可用（未安装） |
| Pierre-Joseph Redouté《Les Roses》扫描件 | Public Domain (PD-old-70) | 作者逝世 1840，Wikimedia Commons 标注 PD | ✅ 已入库 |
| Unsplash 素材 | Unsplash License | 官方许可页 | ✅ 已入库 |

---

## 4. 每引入一个新依赖必须回答的问题

1. 许可证是什么？**核实依据是哪一个文件/页面**（不能是二手博客）。
2. 与本仓库 `LICENSE` 兼容吗？
3. 需要更新 `NOTICE` 吗？
4. 需要更新 `THIRD_PARTY.md` 吗（说明**复用了什么**，而不只是名字）？
5. 是**直接复制代码**，还是只借鉴思路？—— 这个区别决定了义务。
6. 它的维护状态如何？如果已 Inactive，是否值得自己实现以避免锁死在一个不再更新的依赖上？
7. 它有运行时依赖吗？（本项目要求零运行时依赖的传递闭包）
