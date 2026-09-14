// ============================================================
// 示例模板：浪漫夜色版（example-romantic）
// 与默认 warm-paper 同一套代码，仅换 config：
//   深暖夜色渐变 + 玫瑰金强调 + 信件（含语音字段示例）
// 用法：复制为 config.js，或用 examples/preview.html 直接预览。
// ============================================================

window.DEFAULT_CONFIG = {
    metadata: { author: "romantic", created: "2026-09", version: "1.0.0", template: "night-rose" },
    media: { photos: "./assets/photos/", videos: "./assets/videos/", audio: "./assets/audio/", voice: "./assets/voice/", art: "./assets/art/" },

    pageTitle: "今晚的小世界",

    person: { name: "", nickname: "Mia", avatar: "", birthday: "", relationship: "" },

    theme: {
        colors: {
            // 暮色玫瑰：深暖底 + 玫瑰金雾
            gradient: ["#3d2b30", "#6e4a4d", "#9c6a67", "#c79a92"],
            petalColors: ["#d9a7a0", "#b98079"]
        },
        fonts: { body: "", outlier: "" },
        hero: {
            // 深色主题注意：当前 alpha 玫瑰为深色墨水，深底上近乎隐形。
            // 想在深底用玫瑰：需一张浅色/金色调的透明底主视觉。
            // 设为 "" 则第一屏无玫瑰（构图自动居中）。
            rose: "./assets/art/redoute-gallica-bloom.webp",
            title: "晚安，我的小世界",
            subtitle: "Every little world begins with you.",
            enterBtn: "轻　触"
        },
        motion: { gradientSpeed: 420, gradientAmp: 170, petalCount: 12, petalFallDuration: [14, 26], burstCount: 30, introFadeMs: 1800 },
        components: {}
    },

    experience: { chapters: [] },

    home: { title: "今晚想和我玩什么？", subtitle: "夜还长", startBtn: "开始玩", enTitle: "goodnight, my love..." },

    quiz: {
        text: "猜猜今晚我想带你去哪？",
        options: ["江边吹风", "看一场午夜电影", "吃一顿热腾腾的", "在家窝着"],
        answer: 1,
        correctText: "心有灵犀。",
        wrongText: "那我明晚再问你。"
    },
    meter: { text: "今晚的心动有多少？", startText: "心动值", doneText: "记录在案。", doneDelayMs: 900, thresholds: { normal: 100, high: 1000, extreme: 5000 } },
    loveMessages: { extreme: "心动值冲破夜空！！", high: "夜色都被你点亮了。", normal: "超过 100% 啦" },

    randomQuestions: ["如果现在推门出去，你想先去哪里？", "今晚的月亮想分你一半。"],
    smallThings: ["一起看一次夜景", "睡前交换今天最开心的事"],

    photos: [
        { src: "./assets/photos/landscape-04.jpg", caption: "以后一起去这样的湖边走走吧。" },
        { src: "./assets/photos/landscape-07.jpg", caption: "今晚的星星，分你一半。" }
    ],
    photoTexts: { empty: "还没有放进照片。", error: "这张照片暂时加载不出来。", videoError: "这段视频暂时加载不出来。" },

    story: {
        letters: [
            {
                date: "某年某月",
                title: "写给夜晚的你",
                content: "这封信替我守夜。\n等你读到它的时候，希望今天所有的疲惫都已经上岸。",
                image: "",
                audio: ""   // 填 ./assets/voice/xxx.mp3 即可出现播放按钮
            }
        ],
        memories: [], timeline: [], promises: []
    },
    letterAgainBtn: "下一封",
    letterNextBtn: "下一个",

    surprises: ["今晚的风替我抱了你一下。", "梦里见。"],
    ending: { title: "今晚到此为止。", message: "晚安，好梦。", emojis: "", replayBtn: "再读一遍", shareCopiedText: "链接已复制" },

    sound: {
        bgm: "", volume: 0.45, uiTick: true,
        tick: { freqs: [880, 1320], gain: 0.04 },
        fadeMs: { bgmIn: 2000, bgmOut: 700, voiceIn: 800, voiceOut: 400 },
        voiceEnabled: true, voiceTexts: { play: "听她说", pause: "暂停", error: "暂时无法播放" }
    },
    music: { enabled: true, autoplay: true, musicUrl: "./assets/audio/bgm.mp3", startText: "放音乐", stopText: "暂停" },

    colors: {
        backgroundStart: "#3d2b30", backgroundEnd: "#6e4a4d",
        buttonBackground: "#c79a92", buttonHover: "#b4837c", textColor: "#f3e7db"
    },
    animations: { floatDuration: "15s", floatDistance: "50px", bounceSpeed: "0.5s", heartExplosionSize: 1.5 }
};

window.VALENTINE_CONFIG = { ...window.DEFAULT_CONFIG };
