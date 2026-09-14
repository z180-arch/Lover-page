# 和你一起玩 · 情侣互动小网页

一个轻松、好玩、带点小惊喜的情侣互动网页，适合在一起之后偶尔拿出来一起玩。
整体气质：暖奶油色动态渐变 + 植物铜版画玫瑰 + 衬线排版——像一件私人数字作品，而不是情人节模板。

## 游戏流程

开场（玫瑰 + 渐变呼吸）→ 首页 → 默契测试 → Love Meter → 随机问题 → 随机小任务 → 照片 → 随机惊喜 → 结束 → 再玩一次

## 只改一个文件就能换全部内容

所有个人内容都在 **`config.js`**：

- `home`：首页标题 / 副标题 / 开始按钮
- `quiz`：默契测试题目、四个选项、正确答案下标 `answer`、对错文案
- `meter` / `loveMessages`：Love Meter 文案
- `randomQuestions`：随机问题库
- `smallThings`：随机小任务库
- `photos`：照片 / 视频（放 `assets/photos/`，支持 jpg/png/webp/mp4；`src` + `caption`）
- `surprises`：随机惊喜文案
- `ending`：结束页与"再玩一次"
- `music.musicUrl`：背景音乐路径（默认 `./assets/audio/bgm.mp3`）
- `colors`：全局配色（与第一屏同一视觉系统）

## 本地预览

```bash
python -m http.server 8000
# 浏览器打开 http://127.0.0.1:8000
```

## 部署

纯静态页面（HTML + CSS + JS，无构建、无框架），可直接部署到 GitHub Pages / Netlify / Cloudflare Pages。

## 目录结构

```
├── index.html         # 页面结构（含第一屏开场 markup）
├── styles.css         # 全局视觉系统（与第一屏同一世界）
├── css/intro.css      # 第一屏开场样式
├── js/intro.js        # 开场 + site 级动态背景驱动
├── vendor/
│   └── mesh-gradient.esm.js   # mesh-gradient.js (MIT)，本地化
├── assets/
│   ├── art/           # Redouté《Les Roses》铜版画（公有领域，白底已烘焙为 alpha）
│   ├── audio/bgm.mp3  # 背景音乐
│   └── photos/        # 照片 / 视频
├── config.js          # ★ 所有个人内容在这里改
├── config-system.js   # 链接配置系统
├── state.js           # 轻量状态管理
├── theme.js           # config 配色 -> CSS 变量
├── script.js          # 游戏逻辑
└── LICENSE            # MIT License
```

## Credits / Licenses

- **动态背景**：[anup-a/mesh-gradient.js](https://github.com/anup-a/mesh-gradient.js)，MIT。
- **第一屏玫瑰**：Pierre-Joseph Redouté《Les Roses》(1817–1824) 铜版画，公有领域。
- **母版骨架**：[ianjiteshan/valentine2026](https://github.com/ianjiteshan/valentine2026)，MIT。
- 详见 [THIRD_PARTY.md](./THIRD_PARTY.md)。
