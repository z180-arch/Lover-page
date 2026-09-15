# Visual Reference Index

> 视觉参考与**素材来源**索引。
> 视觉参考：记录「学什么」，不记录「像什么」。
> 素材来源：记录 author / source / license / URL —— 这是入库的硬要求。

**最后更新**：2026-09-15

---

## 1. 已入库素材

| 素材 | 文件 | 作者 / 来源 | 许可证 | 处理 |
|---|---|---|---|---|
| 《Les Roses》玫瑰铜版画 | `assets/art/redoute-gallica-bloom.webp` | Pierre-Joseph Redouté (1759–1840)；Wikimedia Commons 扫描件 | **Public Domain**（PD-old-70） | 离线处理：裁切花冠窗口 → 白底转 alpha（un-multiply）→ 底缘渐隐烘焙 |
| 原扫描件（保留） | `assets/art/redoute-gallica-magna.jpg` | 同上 | Public Domain | 未处理原图 |
| 风景示例照片 ×8 | `assets/photos/landscape-0*.jpg` | Unsplash | **Unsplash License**（免费商用；不得转售原始照片或组建同类图库） | 展示用示例 |
| 个人照片 | `assets/photos/holographic-src.jpg` | 用户自有 | — | 全息卡片实验用 |
| 背景音乐 | `assets/audio/bgm.mp3` | 用户自有（自己唱的歌） | — | 不使用任何网络音乐 |
| mesh gradient shader | `vendor/mesh-gradient.esm.js` | anup-a/mesh-gradient.js (MIT)，内含 Ashima Arts simplex noise (MIT) | **MIT** | 直接 vendor |

**素材入库规则**（新增素材时照做）：

1. 优先来源：Wikimedia Commons / Gallica / Internet Archive / NASA / Openverse /
   Rawpixel Public Domain
2. 艺术作品优先 **Public Domain / CC0 / 明确允许商用**
3. 记录 `author` / `source URL` / `license` / `retrieved` 到本文件与 `THIRD_PARTY.md`
4. 图片尺寸控制在移动端可接受范围；大图必须做离线处理（**不是**运行时 CDN 变换）
5. 禁止：未经核实的"网上找的图"、水印图、需要署名的图但未署名

---

## 2. 视觉参考（学什么，不学什么）

> 标注规则同 `UX_RESEARCH.md`：`[本次核验]` = 本轮核实；`[既有认知]` = 通用知识待核验。

### 2.1 玫瑰铜版画本身 —— 本项目的美术基准

`[本次核验]` Redouté 的玫瑰是**植物学插画**（scientific illustration），不是装饰画。
它的特征是：单一主体、精确到结构与脉络、白底、无背景叙事、**没有情绪修饰**。

**这就是本项目的视觉语法来源**：克制的精确 + 大量留白 + 不解释。
**因此**：任何"给它加点氛围"的冲动（发光、滤镜、叠加纹理、动画粒子）都会削弱它。
**约束**：`night-archive` 下玫瑰退场，正是因为白底 alpha 铜版画压在暗底上
会变成一张贴纸 —— 削弱了它作为"插画的精确性"。

### 2.2 编辑设计（Editorial）

`[既有认知]`

| 学什么 | 不学什么 |
|---|---|
| 字号对比跨 4–6 倍（display vs folio） | 多栏栅格（移动端 320px 下不可行） |
| 小号元信息 + 宽字距（`0.22em`）承担层级 | 大段装饰性引号 / 首字下沉（在小屏上是噪声） |
| 细线分隔（1px hairline）而非阴影 | 卡片 + 阴影来分层（本项目已识别为同质化根源） |
| `text-wrap: pretty` 避免孤字 | 手动 `<br>` 断行（配置化后必然破版） |

**对应章节**：叁 · 想问你（`.editorial` + folio）、第一屏、落幕。

### 2.3 博物馆展签（Wall Label）

`[既有认知]` 学「两到三行、左对齐、小号、无边框」；
不学「作品名/年代/材质/尺寸」四行信息栏（会把关系做成物件档案）。

**对应章节**：伍 · 私人档案（`.photo-plate`）。

### 2.4 私人信笺

`[既有认知]` 学「左对齐 + 日期 + 署名的元信息层级 + 纸张材质（横格/折痕/胶带）」；
**不学手写字体**（中文手写 webfont 体积巨大、可读性差，且把"私人感"做成"可爱感"）。

**对应章节**：陆 · 来信、肆 · 小事（便签）。

### 2.5 电影片尾（Cinematic title sequence）

`[既有认知]` 学「主体退场后内容才出现」「一次性、缓慢、不可逆的离场」；
不学「大幅缩放 / 光晕 / 扫光」。

**对应章节**：终 · 落幕（面板溶解后文字直接浮在渐变上 + 花瓣迸发）。
**这是本项目目前最成功的一章** —— 它的构图语法（面板溶解）已被推广到
`container.dissolveSteps`，让其它章节也能采用（ADR-003）。

---

## 3. 视觉参考的来源清单（下一轮核实）

以下站点/项目**值得系统核验**，但本轮**未逐一浏览取证**，
因此不在此处写具体的「某作品用了某某手法」——那会是虚构引用。

| 来源 | 为什么值得看 |
|---|---|
| Awwwards Site of the Day | 编辑设计与滚动叙事的当代实践 |
| Godly | 偏高艺术方向的站点画廊 |
| Land-book / CSS Design Awards | 落地页构图的常见与非常见解法 |
| Codrops (tympanus.net) | 可运行的技术 demo（注意：CodePen/教程片段**通常无明确许可证**，只能学思路） |
| Wikimedia Commons | 公有领域艺术作品（本项目的素材主来源） |
| Gallica (BnF) / Internet Archive | 公有领域扫描件、纸张与印刷质感参考 |
| NYT Snow Fall 类叙事报道 | 节奏控制（见 `UX_RESEARCH.md` §2） |

**使用这些参考时的规则**：

```
✅ 提取手法，改写成本项目的语义
❌ 不做像素级复刻
❌ 不下载参考站的图片/代码
❌ 不引用无法核实许可证的 CodePen 片段
```

---

## 4. 「不学清单」（与 `UX_RESEARCH.md` §6 一致）

```
❌ 通用情人节网页的视觉符号（红心 / 粉红渐变 / 气球）
❌ AI 生成式构图（整页居中 + 紫粉渐变 + Inter + 圆角三卡片）
❌ 美术馆仿制品（把关系做成展品档案）
❌ 可爱化（emoji 装饰 / 手写字体 / 圆角气泡）
❌ 特效炫技（粒子 / 霓虹 / 光标跟随 / 巨幅视差）
```
