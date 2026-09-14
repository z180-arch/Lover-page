// ============================================================
// 示例模板：极简版（example-minimal）
// 只保留最小内容：无信件、无语音、单张照片、少量章节文案。
// 用法：把本文件内容复制为 config.js（或用 examples/preview.html 预览）。
// 完整字段说明见 docs/CONFIG_SCHEMA.md
// ============================================================

window.DEFAULT_CONFIG = {
    metadata: { author: "minimal", created: "2026-09", version: "1.0.0", template: "warm-paper" },
    media: { photos: "./assets/photos/", videos: "./assets/videos/", audio: "./assets/audio/", voice: "./assets/voice/", art: "./assets/art/" },

    pageTitle: "我们的小小世界",

    person: { name: "", nickname: "", avatar: "", birthday: "", relationship: "" },

    theme: {
        colors: {
            gradient: ["#f7ece2", "#f3d5cb", "#f7ddc0", "#f2e6d9"],
            petalColors: ["#dda3ab", "#c4777f"]
        },
        fonts: { body: "", outlier: "" },
        hero: {
            rose: "./assets/art/redoute-gallica-bloom.webp",
            title: "我们的小小世界",
            subtitle: "A little world, just for us.",
            enterBtn: "进　入"
        },
        motion: { gradientSpeed: 700, gradientAmp: 130, petalCount: 6, petalFallDuration: [12, 20], burstCount: 18, introFadeMs: 1500 },
        components: {}
    },

    experience: { chapters: [] },

    home: { title: "今天想和我玩什么？", subtitle: "随便选一个", startBtn: "开始玩" },
    quiz: {
        text: "你觉得我会选哪个？",
        options: ["看电影", "散步", "吃东西", "宅家"],
        answer: 2,
        correctText: "还挺了解我的。",
        wrongText: "再猜猜。"
    },
    meter: { text: "今天的默契有多少？", startText: "默契值", doneText: "今天也算不错。", doneDelayMs: 900, thresholds: { normal: 100, high: 1000, extreme: 5000 } },
    loveMessages: { extreme: "默契直接爆表了！！", high: "默契拉满！", normal: "超过 100% 啦" },

    randomQuestions: ["如果明天突然放假，你最想和我去哪里？", "最近有什么让你开心的事？"],
    smallThings: ["一起散步十分钟", "交换一首最近循环的歌"],

    photos: [
        { src: "./assets/photos/landscape-01.jpg", caption: "看到好看的天，第一反应是想发给你。" }
    ],
    photoTexts: { empty: "还没有放进照片。", error: "这张照片暂时加载不出来。", videoError: "这段视频暂时加载不出来。" },

    story: { letters: [], memories: [], timeline: [], promises: [] },
    letterAgainBtn: "下一封",
    letterNextBtn: "下一个",

    surprises: ["今天也偷偷喜欢你一下。", "恭喜你，抽到了今天的小惊喜。"],
    ending: { title: "今天先玩到这里。", message: "下次再一起玩。", emojis: "", replayBtn: "再玩一次", shareCopiedText: "链接已复制" },

    sound: {
        bgm: "", volume: 0.5, uiTick: false,
        tick: { freqs: [1244, 1866], gain: 0.045 },
        fadeMs: { bgmIn: 1400, bgmOut: 500, voiceIn: 800, voiceOut: 400 },
        voiceEnabled: false, voiceTexts: { play: "播放语音", pause: "暂停", error: "暂时无法播放" }
    },
    music: { enabled: true, autoplay: true, musicUrl: "./assets/audio/bgm.mp3", startText: "放音乐", stopText: "暂停" },

    colors: {
        backgroundStart: "#f7ece2", backgroundEnd: "#f3d5cb",
        buttonBackground: "#a8544f", buttonHover: "#8f403c", textColor: "#4a3a33"
    },
    animations: { floatDuration: "15s", floatDistance: "50px", bounceSpeed: "0.5s", heartExplosionSize: 1.5 }
};

window.VALENTINE_CONFIG = { ...window.DEFAULT_CONFIG };
