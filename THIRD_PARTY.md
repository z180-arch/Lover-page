# Third-Party Acknowledgements

本项目在个人学习与私享用途中复用了以下开源成果。许可证以各仓库实际声明为准。

| Component | Source | Repository | License | What was reused | Local modifications |
|---|---|---|---|---|---|
| particle-rose | hvccj | https://github.com/hvccj/particle-rose | MIT（README 声明 MIT License；仓库根目录无独立 LICENSE 文件） | 7 层花瓣黄金角叶序参数化曲面（arch/recurve/cup/tilt/bow/twist/widthProfile）、花萼/花茎/叶片几何、散射→玫瑰收敛（convergence）、呼吸缩放、加法混合软圆点材质、背景星点、缓慢飘落花瓣 | 剔除 MediaPipe Hands / 摄像头 / 鼠标拖拽 / 键盘快捷键 / 原 UI 与 loading；整合为全屏 `#particle-overlay`；荧光粉红改克制暗红→玫红→暖白高光；粒子数/星点/花瓣数按设备分级；收敛缓动改平滑；新增「进入」电影式转场与 `window.ParticleIntro.show()/hide()` 重放 API |
| Three.js | three.js | https://github.com/mrdoob/three.js | MIT | r160 核心渲染（Scene / PerspectiveCamera / Points / BufferGeometry / PointsMaterial / CanvasTexture），jsDelivr CDN UMD 全局引入 | 无修改 |
| valentine2026 母版 | ianjiteshan | https://github.com/ianjiteshan/valentine2026 | MIT | 单页多游戏骨架、浮动元素、按钮/Love Meter/庆祝/音乐控制基础 | 流程由“求爱”改为情侣小游戏；新增第一屏粒子开场 |
| 字体 | Google Fonts | https://fonts.google.com | SIL OFL 1.1 | Dancing Script、Poppins | 无修改 |

## 备注

- 复用的粒子玫瑰代码位于 `js/particle-intro.js`，文件头部已注明来源与修改。
- 背景音乐 `assets/audio/bgm.mp3` 与 `assets/photos/landscape-*.jpg` 为个人素材，未引入第三方网络素材。
