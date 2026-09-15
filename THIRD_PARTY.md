# Third-Party Acknowledgements

本项目在个人学习与私享用途中复用了以下开源成果与公有领域素材。许可证以各来源实际声明为准。

| Component | Source | License | What was reused |
|---|---|---|---|
| mesh-gradient.js v0.0.5 | https://github.com/anup-a/mesh-gradient.js （基于 Stripe 渐变与 Kevin Hufnagl 整理版；内含 Ashima Arts simplex noise, MIT） | MIT (c) 2022 Anup Aglawe | site 级动态 Mesh Gradient 背景（`vendor/mesh-gradient.esm.js`，jsDelivr +esm 构建）。npm 构建未含动画循环，本项目从外部以极慢速率推进其 `u_time` uniform 实现"光的呼吸"，shader/渲染/噪声均为库实现 |
| 《Les Roses》玫瑰铜版画 | Pierre-Joseph Redouté (1759–1840)，扫描件来自 Wikimedia Commons（"Redoute - Rosa gallica purpuro-violacea magna.jpg"） | Public Domain（PD-old-70） | 第一屏主视觉 `assets/art/redoute-gallica-bloom.webp`。由源扫描件离线处理：裁切花冠窗口、白底转 alpha（un-multiply）、底缘渐隐烘焙 |
| valentine2026 母版 | https://github.com/ianjiteshan/valentine2026 | MIT (c) 2026 Anjitesh Shandilya | 单页多游戏骨架、Love Meter 机制、分享链接、音乐控制基础；流程由"求爱"改为情侣小游戏 |
| 照片 | assets/photos/landscape-*.jpg | Unsplash License（免费商用） | 展示示例图；`holographic-src.jpg` 为个人照片 |
| 背景音乐 | assets/audio/bgm.mp3 | 个人素材 | 无第三方版权内容 |

## 备注

- 旧版第一屏改编自 hvccj/particle-rose 的粒子玫瑰与 Three.js 依赖已移除（git 历史 baseline 提交中保留）。
- 后续照片"全息卡片"计划采用 LerSent001/holo-card（MIT）或参照 simeydotme/pokemon-cards-css（GPL-3.0）自行实现，当前已预留 `config.photos` 数据接口。

## 1.2.0 选型调研结论（为什么这一版没有新增依赖）

「章节视觉语言分化」这一版先做了开源调研，结论是**相关方向没有可直接移植的成熟方案**，因此全部自行实现，且只使用 CSS / SVG / 原生 Web API：

| 方向 | 调研结论 | 本项目做法 |
|---|---|---|
| 模拟仪表盘（指针/刻度/峰值） | 高星方案几乎都是 React 组件（react-gauge-chart、react-vertical-gauge 等）或需要 D3 的通用刻度生成器；与零构建 vanilla 架构不兼容 | 自研：SVG 弧用 `pathLength="100"` 归一化后以 `stroke-dasharray` 画进度，指针用 `transform-box: view-box` + `rotate()` 配阻尼缓动；刻度由极坐标在 JS 里生成 |
| 信封 / 信件开启动画 | 网上多为 CodePen 片段，无许可证明确、长期维护的库 | 自研：袋 / 盖 / 纸三层，`perspective` 只给容器、翻盖自己 `rotateX(118deg)`，刻意避开 iOS Safari 的 `preserve-3d` × `overflow:hidden` 冲突 |
| 联系印样 / 胶片条 | 无必要依赖 —— 原生 `scroll-snap` 已能覆盖 | 自研：`scroll-snap-type: x proximity`，滚动条用 `scrollbar-width: none` 隐藏（**不是** `overflow: hidden`，否则不可滑） |
| 纸张质感 / 便签 | 现成库都依赖 `backdrop-filter`（iOS 破版且开销大） | 自研：`repeating-linear-gradient` 横格（周期严格等于 `line-height`）+ `feTurbulence` data-URI 噪点 + 胶带色块 |
| 光标/倾斜类交互 | `vanilla-tilt.js`（MIT）可安全移植；`pokemon-cards-css`（GPL-3.0）只可借鉴思路 | 本版未做；留给全息卡片专项（见 ROADMAP） |
| 极简 schema 校验 | 不想引入 AJV（体积与构建成本不匹配） | 自研 `config-system.js`：以 `DEFAULT_CONFIG` 为形状基准递归 sanitize，新增字段无需改校验代码 |

结论一并记录在 `docs/ROADMAP.md`，避免下次重复调研。

