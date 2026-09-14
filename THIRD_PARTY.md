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
