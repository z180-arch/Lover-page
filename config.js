// ============================================
// 💕 情侣互动小网页 —— 所有个人内容都在这里改 💕
// 基于 ianjiteshan/valentine2026 (MIT) 二次修改
// 想换文案 / 照片 / 问题 / 音乐，只改本文件即可。
// ============================================

const CONFIG = {
    // 浏览器标签页标题
    pageTitle: "和你一起玩 💕",

    // —— 第一屏开场（产品化：换人只改这里）——
    intro: {
        title: "我们的小小世界",
        subtitle: "A little world, just for us.",
        enterBtn: "进　入"
    },

    // —— 主题层（产品化：视觉参数全部可换）——
    theme: {
        gradient: ["#f7ece2", "#f3d5cb", "#f7ddc0", "#f2e6d9"],  // mesh gradient 四色
        rose: "./assets/art/redoute-gallica-bloom.webp",          // 第一屏主视觉
        petalColors: ["#dda3ab", "#c4777f"],                      // 花瓣双色
        motionSpeed: 700                                          // 渐变呼吸速率（越小越慢）
    },

    // 首页最上方的英文手写标题（母版原样）。
    // 想带上对方名字就填，比如 "Mia"，会显示成 “Mia, my love...”；留空则只显示 “My love...”
    valentineName: "",

    // —— 首页 ——
    home: {
        title: "今天想和我玩什么？",   // 中文标题（在英文标题下方）
        subtitle: "随便选一个",          // 副标题
        startBtn: "开始玩"               // 开始按钮（沿用母版按钮样式）
    },

    // —— 小游戏 1：默契测试 ——（沿用母版 Question + Button 的 UI）
    quiz: {
        text: "你觉得我会选哪个？",
        options: ["一起看电影", "一起出去散步", "一起吃东西", "在家躺着"],
        answer: 2,                 // 正确答案的下标（0 开始）。2 = “一起吃东西”，改成你心里的答案即可
        correctText: "还挺了解我的。",
        wrongText: "你是不是还没完全摸清我。",
        nextBtn: "下一个"
    },

    // —— 小游戏 2：Love Meter（完整保留母版可超过 100% 的机制）——
    meter: {
        text: "今天的默契有多少？",   // 拖动滑块，往右拖到底
        startText: "默契值",
        doneText: "今天也算不错。",   // 点“下一个”前的小结
        nextBtn: "下一个"
    },
    // 拖过不同数值时出现的趣味文案（母版机制：>100 / >1000 / >5000）
    loveMessages: {
        extreme: "哇，默契直接爆表了！！",
        high: "默契拉满，冲出去了！",
        normal: "超过 100% 啦"
    },

    // —— 小游戏 3：随机问题（点“再来一个”随机切换）——
    randomQuestions: [
        "如果明天突然放假，你最想和我去哪里？",
        "最近有什么事情让你觉得很开心？",
        "如果现在可以一起去吃东西，你想吃什么？",
        "我们最近做过的事情里，你最想再来一次什么？",
        "如果今天只能一起做一件事，你会选什么？",
        "你觉得我最近最可爱的一个瞬间是什么？"
    ],
    questionAgainBtn: "再来一个",
    questionNextBtn: "下一个",

    // —— 小游戏 4：随机小任务（点“换一个”随机切换，约 50 件轻松小事）——
    smallThingsTitle: "今天做一件小事",
    smallThings: [
        "一起听完我们唱的那首歌",
        "拍一张今天的照片",
        "一起散步十分钟",
        "一起找一家没吃过的店",
        "互相发一张今天看到的东西",
        "一起看一集喜欢的东西",
        "一起下厨做一顿简单的饭",
        "窝在沙发上一起看部电影",
        "一起去超市把购物车塞满",
        "交换一首最近循环的歌",
        "给对方写一张小便签",
        "一起看一次日落",
        "一起拼一幅拼图",
        "一起做一次小烘焙",
        "选一天都不刷短视频",
        "一起整理房间的一个角落",
        "一起追一部剧从头看到尾",
        "一起去逛一次菜市场",
        "手牵手压一次马路",
        "去公园坐一会儿发发呆",
        "一起做一杯奶茶或饮品",
        "互相给对方搭一套衣服",
        "泡杯热茶慢慢聊聊天",
        "一起玩一局双人小游戏",
        "一起去骑一次自行车",
        "吃一顿热气腾腾的火锅",
        "一起去喂一次流浪小猫",
        "拍一张搞怪的合照",
        "一起列一个想吃的美食清单",
        "一起做一顿慢悠悠的早餐",
        "晚上出门看看月亮",
        "一起去书店各挑一本书",
        "放着歌一起大扫除",
        "互相说今天最开心的一件小事",
        "去江边、湖边或者海边走走",
        "一起吃同一支冰淇淋",
        "搭个毯子小屋窝着看片",
        "一起去坐一次摩天轮",
        "一起做个手工小物件",
        "互相按摩放松十分钟",
        "去爬一座不高的小山",
        "点上小蜡烛吃顿简单晚餐",
        "一起录一段合唱或搞怪视频",
        "一起计划一次小小的出行",
        "去买一束不贵的小花",
        "比赛谁先把对方逗笑",
        "画一幅丑丑的小画送给对方",
        "一起去便利店买夜宵",
        "互相说三个喜欢对方的小瞬间",
        "闭眼让对方喂东西，猜猜是什么",
        "在地图上一起标记想去的地方",
        "一起泡个脚，聊聊最近"
    ],
    smallThingAgainBtn: "换一个",
    smallThingNextBtn: "下一个",

    // —— 风景照片（免费可商用 Unsplash 素材，已下载到本地 ./assets/photos/）——
    // 想换成自己的图，把文件放进 assets/photos 并改这里的 src / caption 即可。
    // 可选字段：date / place（美术馆展签用，不填则不显示该栏）
    photos: [
        { src: "./assets/photos/landscape-01.jpg", caption: "看到好看的天，第一反应是想发给你。" },
        { src: "./assets/photos/landscape-02.jpg", caption: "想和你一起去很高很高的地方看看。" },
        { src: "./assets/photos/landscape-03.jpg", caption: "雾蒙蒙的树林，很安静，像和你待着的时候。" },
        { src: "./assets/photos/landscape-04.jpg", caption: "以后一起去这样的湖边走走吧。" },
        { src: "./assets/photos/landscape-05.jpg", caption: "花开的时候，觉得世界都软了一点。" },
        { src: "./assets/photos/landscape-06.jpg", caption: "风很舒服的日子，会想起你。" },
        { src: "./assets/photos/landscape-07.jpg", caption: "今晚的星星，分你一半。" },
        { src: "./assets/photos/landscape-08.jpg", caption: "随便走走也挺好，只要是和你一起。" }
    ],
    photoNextBtn: "下一个",

    // —— 信件 / 回忆（陆·来信）——
    // 结构：{ date, title, content, image?, audio? }，为空数组时该章自动跳过
    // audio 放 ./assets/voice/ 下的语音片段（mp3/m4a），可选
    letters: [
        {
            date: "",
            title: "第一封信",
            content: "这一栏留给你们的故事。把想说的话写在这里，对方打开网页时，会在最合适的地方读到它。",
            image: "",
            audio: ""
        }
    ],
    letterAgainBtn: "下一封",
    letterNextBtn: "下一个",

    // —— 声音（产品化：可关）——
    sound: {
        enabled: true,
        uiTick: true       // 章节切换的极轻提示音（Web Audio 合成，无素材）
    },

    // —— 随机惊喜（点礼物盒随机出一句）——
    surpriseBtn: "点一下，看看是什么",
    surprises: [
        "今天也偷偷喜欢你一下。",
        "恭喜你，抽到了今天的小惊喜。",
        "这句话没有什么特别的，就是突然想给你。",
        "今天的任务：开心一点。",
        "你已经解锁了一个没什么用但很可爱的东西。"
    ],
    surpriseAgainBtn: "再抽一个",
    surpriseNextBtn: "下一个",

    // —— 结束页（轻松，不沉重）——
    ending: {
        title: "今天先玩到这里。",
        message: "下次再一起玩。",
        emojis: "",
        replayBtn: "再玩一次"
    },

    // ============================================
    // 以下为母版视觉/动画/音乐依赖项，默认保留，一般不用改
    // ============================================

    // 背景漂浮元素（母版原有，保留）
    floatingEmojis: {
        hearts: ['❤️', '💖', '💝', '💗', '💓'],
        bears: ['🧸', '🐻']
    },

    // 配色（与第一屏同一视觉系统：暖奶油底 / 墨色文字 / 玫瑰强调色）
    colors: {
        backgroundStart: "#f7ece2",
        backgroundEnd: "#f3d5cb",
        buttonBackground: "#a8544f",
        buttonHover: "#8f403c",
        textColor: "#4a3a33"
    },

    // 动画参数（母版原值，保持不动）
    animations: {
        floatDuration: "15s",
        floatDistance: "50px",
        bounceSpeed: "0.5s",
        heartExplosionSize: 1.5
    },

    // 背景音乐：使用本地文件（我们自己唱的歌），不用任何网络音乐
    music: {
        enabled: true,
        autoplay: true,                       // 浏览器允许时自动播放，被拦截时点页面任意处会播放
        musicUrl: "./assets/audio/bgm.mp3",   // 本地音乐路径
        startText: "放音乐",
        stopText: "暂停",
        volume: 0.5
    }
};

// Export for use in other scripts
window.DEFAULT_CONFIG = CONFIG;
window.VALENTINE_CONFIG = { ...CONFIG };
