# 💕 和你一起玩 · 情侣互动小网页

一个轻松、好玩、带点小惊喜的情侣互动网页，适合在一起之后偶尔拿出来一起玩。
基于开源项目 **[ianjiteshan/valentine2026](https://github.com/ianjiteshan/valentine2026)**（MIT License）二次修改，保留了母版的浮动爱心、可爱按钮、Love Meter、爱心爆炸庆祝、音乐控制等全部视觉与交互，仅把“求成为 Valentine”的流程改成了“情侣小游戏”流程。

## 游戏流程

首页 → 默契测试 → Love Meter → 随机问题 → 随机小任务 → 照片 → 随机惊喜 → 结束 → 再玩一次

## 只改一个文件就能换全部内容

所有个人内容都在 **`config.js`**：

- `home`：首页标题 / 副标题 / 开始按钮
- `quiz`：默契测试题目、四个选项、正确答案下标 `answer`、对错文案
- `meter` / `loveMessages`：Love Meter 文案
- `randomQuestions`：随机问题库
- `smallThings`：随机小任务库
- `photos`：照片 / 视频（放到 `assets/photos/`，支持 jpg/png/mp4）
- `surprises`：随机惊喜文案
- `ending`：结束页与“再玩一次”
- `music.musicUrl`：背景音乐路径（默认 `./assets/audio/bgm.mp3`）
- `colors` / `animations` / `floatingEmojis`：母版视觉参数，默认保持不变

## 本地预览

```bash
python -m http.server 8000
# 浏览器打开 http://127.0.0.1:8000
```

（直接双击 index.html 也能运行；本地音乐在个别浏览器下需要通过 http 访问。）

## 部署

纯静态页面（HTML + CSS + JavaScript，无构建、无框架），可直接部署到 GitHub Pages / Netlify / Cloudflare Pages：推送代码后会自动部署。

## 目录结构

```
├── index.html         # 页面结构
├── styles.css         # 样式（母版样式 + 少量游戏样式）
├── config.js          # ★ 所有个人内容在这里改
├── config-system.js   # 母版：链接配置系统（保留）
├── state.js           # 母版：轻量状态管理
├── theme.js           # 母版：主题变量应用
├── script.js          # 游戏逻辑（保留母版函数 + 小游戏逻辑）
├── assets/
│   ├── audio/bgm.mp3  # 自己的背景音乐
│   └── photos/        # 自己的照片 / 视频
└── LICENSE            # MIT License
```

## Credits / Licenses

- **母版项目**：[ianjiteshan/valentine2026](https://github.com/ianjiteshan/valentine2026)
  License: MIT（Copyright (c) 2026 Anjitesh Shandilya），详见 [LICENSE](./LICENSE)。
  本项目在其基础上修改内容与流程，未删除原版权声明。
- **第一屏粒子玫瑰开场**：[hvccj/particle-rose](https://github.com/hvccj/particle-rose)
  License: MIT（其 README 声明 MIT License；仓库未含独立 LICENSE 文件）。
  复用其 7 层花瓣黄金角叶序参数化曲面、花萼/花茎/叶片、散射→玫瑰收敛、呼吸、星点与飘落花瓣；
  已剔除其 MediaPipe 手势 / 摄像头 / 鼠标交互与原 UI，并改克制配色、按设备分级粒子数。详见 [THIRD_PARTY.md](./THIRD_PARTY.md)。
- **Three.js**：[mrdoob/three.js](https://github.com/mrdoob/three.js)，License: MIT，r160 UMD（jsDelivr CDN 引入）。
- 字体：Google Fonts（Dancing Script、Poppins），SIL OFL。
- 背景音乐与照片为个人素材，未使用任何第三方网络音乐 / 图片。
