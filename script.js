// Initialize configuration
const config = window.VALENTINE_CONFIG;

// Validate configuration
function validateConfig() {
    const warnings = [];

    // Check required fields
    if (!config.pageTitle) {
        warnings.push("pageTitle is not set! Using default.");
        config.pageTitle = "和你一起玩 💕";
    }

    // Validate colors
    const isValidHex = (hex) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    if (config.colors) {
        Object.entries(config.colors).forEach(([key, value]) => {
            if (!isValidHex(value)) {
                warnings.push(`Invalid color for ${key}! Using default.`);
                config.colors[key] = getDefaultColor(key);
            }
        });
    }

    // Validate animation values
    if (config.animations && parseFloat(config.animations.floatDuration) < 5) {
        warnings.push("Float duration too short! Setting to 5s minimum.");
        config.animations.floatDuration = "5s";
    }
    if (config.animations && (config.animations.heartExplosionSize < 1 || config.animations.heartExplosionSize > 3)) {
        warnings.push("Heart explosion size should be between 1 and 3! Using default.");
        config.animations.heartExplosionSize = 1.5;
    }

    if (warnings.length > 0) {
        console.warn("⚠️ Configuration Warnings:");
        warnings.forEach(warning => console.warn("- " + warning));
    }
}

// Default color values
function getDefaultColor(key) {
    const defaults = {
        backgroundStart: "#ffafbd",
        backgroundEnd: "#ffc3a0",
        buttonBackground: "#ff6b6b",
        buttonHover: "#ff8787",
        textColor: "#ff4757"
    };
    return defaults[key];
}

// Set page title
document.title = config.pageTitle;

// ============================================================
// 初始化各步骤文案（全部来自 config.js）
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    validateConfig();

    // 首页：h1 为母版英文手写标题（最上方），h2 为中文标题，副标题在其下
    const enPrefix = config.valentineName ? `${config.valentineName}, ` : '';
    document.getElementById('valentineTitle').textContent = `${enPrefix}my love...`;
    document.getElementById('homeTitle').textContent = config.home.title;
    document.getElementById('homeSubtitle').textContent = config.home.subtitle;
    document.getElementById('homeStartBtn').textContent = config.home.startBtn;

    // 小游戏1 默契测试
    document.getElementById('quizText').textContent = config.quiz.text;
    document.getElementById('quizNextBtn').textContent = config.quiz.nextBtn;
    buildQuizOptions();

    // 小游戏2 Love Meter
    document.getElementById('meterText').textContent = config.meter.text;
    document.getElementById('startText').textContent = config.meter.startText;
    document.getElementById('meterNextBtn').textContent = config.meter.nextBtn;

    // 小游戏3 随机问题
    document.getElementById('questionAgainBtn').textContent = config.questionAgainBtn;
    document.getElementById('questionNextBtn').textContent = config.questionNextBtn;
    showRandomQuestion();

    // 小游戏4 随机小任务
    document.getElementById('smallThingsTitle').textContent = config.smallThingsTitle;
    document.getElementById('smallThingAgainBtn').textContent = config.smallThingAgainBtn;
    document.getElementById('smallThingNextBtn').textContent = config.smallThingNextBtn;
    showSmallThing();

    // 照片（先建灯箱再渲染，保证首张即可点开）
    document.getElementById('photoNextBtn').textContent = config.photoNextBtn;
    buildPhotoLightbox();
    renderPhoto();

    // 随机惊喜
    document.getElementById('surpriseBtn').textContent = config.surpriseBtn;
    document.getElementById('surpriseAgainBtn').textContent = config.surpriseAgainBtn;
    document.getElementById('surpriseNextBtn').textContent = config.surpriseNextBtn;

    // 结束页
    document.getElementById('replayBtn').textContent = config.ending.replayBtn;

    // Create initial floating elements（母版原有，保留）
    createFloatingElements();

    // Setup music player（母版原有，保留）
    setupMusicPlayer();

    // Setup Share Button（母版原有，保留）
    setupShareButton();
});

// ============================================================
// 母版原有：浮动爱心和熊（完整保留）
// ============================================================
function createFloatingElements() {
    const container = document.querySelector('.floating-elements');
    if (!container) return;
    container.innerHTML = '';

    // 极少量花瓣，慢速飘落；纯 CSS 形状，不用 emoji
    const PETAL_COUNT = window.innerWidth < 640 ? 5 : 9;
    for (let i = 0; i < PETAL_COUNT; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.setProperty('--fall-duration', 12 + Math.random() * 10 + 's');
        petal.style.setProperty('--fall-delay', Math.random() * 14 + 's');
        petal.style.setProperty('--fall-distance', (Math.random() * 90 - 45) + 'px');
        container.appendChild(petal);
    }
}

// 母版原有：步骤切换（完整保留）
function showNextQuestion(questionNumber) {
    window.appState.setState({ currentStep: questionNumber });
}

// 母版原有：会“逃跑”的按钮（函数保留，母版交互不删除）
function moveButton(button) {
    const x = Math.random() * (window.innerWidth - button.offsetWidth);
    const y = Math.random() * (window.innerHeight - button.offsetHeight);
    button.style.position = 'fixed';
    button.style.left = x + 'px';
    button.style.top = y + 'px';
}

// ============================================================
// 小游戏 1：默契测试（沿用母版 Question + Button UI）
// ============================================================
let quizAnswered = false;
function buildQuizOptions() {
    quizAnswered = false;
    const wrap = document.getElementById('quizOptions');
    const fb = document.getElementById('quizFeedback');
    const next = document.getElementById('quizNextBtn');
    wrap.innerHTML = '';
    fb.textContent = '';
    next.classList.add('hidden');

    config.quiz.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'cute-btn option-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => answerQuiz(i, btn));
        wrap.appendChild(btn);
    });
}

function answerQuiz(i, btn) {
    if (quizAnswered) return;
    quizAnswered = true;
    const fb = document.getElementById('quizFeedback');
    const all = document.querySelectorAll('#quizOptions .option-btn');
    all.forEach(b => b.disabled = true);
    if (i === config.quiz.answer) {
        fb.textContent = config.quiz.correctText;
        btn.classList.add('option-correct');
    } else {
        fb.textContent = config.quiz.wrongText;
        btn.classList.add('option-wrong');
        // 标出正确选项，轻松一点
        if (all[config.quiz.answer]) all[config.quiz.answer].classList.add('option-correct');
    }
    document.getElementById('quizNextBtn').classList.remove('hidden');
}

// ============================================================
// 小游戏 2：Love Meter（母版机制完整保留，仅文案来自 config）
// ============================================================
const loveMeter = document.getElementById('loveMeter');
const loveValue = document.getElementById('loveValue');
const extraLove = document.getElementById('extraLove');

function setInitialPosition() {
    loveMeter.value = 100;
    loveValue.textContent = 100;
    loveMeter.style.width = '100%';
}

loveMeter.addEventListener('input', () => {
    const value = parseInt(loveMeter.value);
    loveValue.textContent = value;
    window.appState.setState({ loveValue: value });

    if (value > 100) {
        extraLove.classList.remove('hidden');
        const overflowPercentage = (value - 100) / 9900;
        const extraWidth = overflowPercentage * window.innerWidth * 0.8;
        loveMeter.style.width = `calc(100% + ${extraWidth}px)`;
        loveMeter.style.transition = 'width 0.3s';

        if (value >= 5000) {
            extraLove.classList.add('super-love');
            extraLove.textContent = config.loveMessages.extreme;
        } else if (value > 1000) {
            extraLove.classList.remove('super-love');
            extraLove.textContent = config.loveMessages.high;
        } else {
            extraLove.classList.remove('super-love');
            extraLove.textContent = config.loveMessages.normal;
        }
    } else {
        extraLove.classList.add('hidden');
        extraLove.classList.remove('super-love');
        loveMeter.style.width = '100%';
    }
});

window.addEventListener('DOMContentLoaded', setInitialPosition);
window.addEventListener('load', setInitialPosition);

// 点“下一个”：先给一句小结，再进入下一步
function finishMeter() {
    const extra = document.getElementById('extraLove');
    const fb = document.createElement('p');
    fb.className = 'game-feedback';
    fb.textContent = config.meter.doneText;
    if (!extra.parentElement.querySelector('.meter-done')) {
        fb.classList.add('meter-done');
        extra.parentElement.appendChild(fb);
    }
    setTimeout(() => showNextQuestion(4), 900);
}

// ============================================================
// 小游戏 3：随机问题
// ============================================================
let lastQuestionIdx = -1;
function pickRandom(arr, lastIdx) {
    if (arr.length === 1) return 0;
    let i;
    do { i = Math.floor(Math.random() * arr.length); } while (i === lastIdx);
    return i;
}
function replaySwapAnimation(el) {
    if (!el) return;
    el.classList.remove('is-swapping');
    void el.offsetWidth; /* 强制重排以重触发动画 */
    el.classList.add('is-swapping');
}

function showRandomQuestion() {
    lastQuestionIdx = pickRandom(config.randomQuestions, lastQuestionIdx);
    const el = document.getElementById('randomQuestionText');
    el.textContent = config.randomQuestions[lastQuestionIdx];
    replaySwapAnimation(el);
}
function nextRandomQuestion() { showRandomQuestion(); }

// ============================================================
// 小游戏 4：随机小任务
// ============================================================
let lastThingIdx = -1;
function showSmallThing() {
    lastThingIdx = pickRandom(config.smallThings, lastThingIdx);
    const el = document.getElementById('smallThingText');
    el.textContent = config.smallThings[lastThingIdx];
    replaySwapAnimation(el);
}
function nextSmallThing() { showSmallThing(); }

// ============================================================
// 照片（母版无此区域，使用母版按钮 / 配色变量做最简单展示）
// ============================================================
let photoIndex = 0;
let photoLightbox = null;

/* 灯箱：GLightbox (MIT, 本地 vendor)。只收录图片；视频走内联播放。
   照片多时建议提供 thumb/full 双份 WebP（见 README），href 用 full 大图。 */
function buildPhotoLightbox() {
    if (typeof GLightbox === 'undefined') return;
    const elements = (config.photos || [])
        .filter(p => !/\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(p.src || ''))
        .map(p => ({ href: p.src, type: 'image', description: p.caption || '' }));
    if (!elements.length) return;
    photoLightbox = GLightbox({ elements: elements, loop: true, touchNavigation: true });
}

function imageIndexAmongPhotos(idx) {
    const list = config.photos || [];
    let n = 0;
    for (let i = 0; i < idx && i < list.length; i++) {
        if (!/\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(list[i].src || '')) n++;
    }
    return n;
}

function renderPhoto() {
    const stage = document.getElementById('photoStage');
    const caption = document.getElementById('photoCaption');
    const list = config.photos || [];
    if (!list.length) {
        stage.innerHTML = '<div class="photo-frame"><div class="photo-error">还没有放进照片。</div></div>';
        caption.textContent = '';
        return;
    }
    const p = list[photoIndex];
    const isVideo = /\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(p.src || '');
    stage.innerHTML = isVideo
        ? `<div class="photo-frame is-loading"><video src="${p.src}" controls playsinline loop muted></video></div>`
        : `<div class="photo-frame is-loading"><img src="${p.src}" alt="回忆" loading="lazy" /></div>`;
    caption.textContent = p.caption || '';

    const frame = stage.querySelector('.photo-frame');
    const img = stage.querySelector('img');
    const video = stage.querySelector('video');
    if (img) {
        if (img.complete && img.naturalWidth) frame.classList.remove('is-loading');
        img.addEventListener('load', () => frame.classList.remove('is-loading'));
        img.addEventListener('error', () => {
            frame.classList.remove('is-loading');
            frame.innerHTML = '<div class="photo-error">这张照片暂时加载不出来。</div>';
        });
        if (photoLightbox) {
            frame.classList.add('is-clickable');
            frame.setAttribute('role', 'button');
            frame.setAttribute('tabindex', '0');
            frame.setAttribute('aria-label', '全屏查看这张照片');
            const openLb = () => photoLightbox.openAt(imageIndexAmongPhotos(photoIndex));
            frame.addEventListener('click', openLb);
            frame.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(); }
            });
        }
        // 相邻照片预取，切上一张/下一张时不用等网络
        const list = config.photos || [];
        [photoIndex + 1, photoIndex - 1].forEach(i => {
            const p = list[(i + list.length) % list.length];
            if (p && !/\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(p.src || '')) {
                const im = new Image();
                im.src = p.src;
            }
        });
    }
    if (video) {
        video.muted = true;
        video.addEventListener('loadeddata', () => frame.classList.remove('is-loading'));
        video.addEventListener('error', () => {
            frame.classList.remove('is-loading');
            frame.innerHTML = '<div class="photo-error">这段视频暂时加载不出来。</div>';
        });
        const pp = video.play();
        if (pp && pp.catch) pp.catch(() => {});
    }
}
function nextPhoto() {
    if (!config.photos || !config.photos.length) return;
    photoIndex = (photoIndex + 1) % config.photos.length;
    renderPhoto();
}
function prevPhoto() {
    if (!config.photos || !config.photos.length) return;
    photoIndex = (photoIndex - 1 + config.photos.length) % config.photos.length;
    renderPhoto();
}

// ============================================================
// 随机惊喜
// ============================================================
function nextSurprise() {
    const list = config.surprises;
    const txt = document.getElementById('surpriseText');
    txt.textContent = list[Math.floor(Math.random() * list.length)];
    txt.classList.add('is-on');
    document.getElementById('surpriseAgainBtn').classList.remove('hidden');
    document.getElementById('surpriseNextBtn').classList.remove('hidden');
}

// ============================================================
// 结束页（母版 Celebration + 爱心爆炸，完整保留）
// ============================================================
function celebrate() {
    window.appState.setState({ currentStep: 'celebration' });

    document.getElementById('celebrationTitle').textContent = config.ending.title;
    document.getElementById('celebrationMessage').textContent = config.ending.message;
    document.getElementById('celebrationEmojis').textContent = config.ending.emojis || '';
    createHeartExplosion();

    // 母版原有：爱心爆炸效果
    createHeartExplosion();
}

function createHeartExplosion() {
    const container = document.querySelector('.floating-elements');
    if (!container) return;
    for (let i = 0; i < 24; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal is-burst';
        petal.style.left = 20 + Math.random() * 60 + 'vw';
        petal.style.top = 18 + Math.random() * 24 + 'vh';
        petal.style.setProperty('--fall-distance', (Math.random() * 160 - 80) + 'px');
        petal.style.setProperty('--burst-duration', 2 + Math.random() * 1.6 + 's');
        petal.style.setProperty('--fall-delay', Math.random() * 0.6 + 's');
        container.appendChild(petal);
    }
}

// 再玩一次：把所有小游戏复位，回到首页
function replayGame() {
    // 清掉庆祝时爆炸出来的多余爱心，只保留初始浮动元素
    createFloatingElements();

    // 复位各游戏
    buildQuizOptions();
    setInitialPosition();
    extraLove.classList.add('hidden');
    document.querySelectorAll('.meter-done').forEach(e => e.remove());
    showRandomQuestion();
    showSmallThing();
    photoIndex = 0;
    renderPhoto();
    document.getElementById('surpriseText').textContent = '';
    document.getElementById('surpriseText').classList.remove('is-on');
    document.getElementById('surpriseAgainBtn').classList.add('hidden');
    document.getElementById('surpriseNextBtn').classList.add('hidden');

    // 逃跑按钮复位（母版交互）
    document.querySelectorAll('.cute-btn[style*="position: fixed"]').forEach(b => {
        b.style.position = ''; b.style.left = ''; b.style.top = '';
    });

    showNextQuestion(1);

    // 重新播放：再次显示开场（不改动上面的复位逻辑）
    if (window.Intro && typeof window.Intro.show === 'function') {
        window.Intro.show();
    }
}

// ============================================================
// 母版原有：音乐播放器（保留；音乐源为本地文件；增加首次点击兜底播放）
// ============================================================
function setupMusicPlayer() {
    const musicControls = document.getElementById('musicControls');
    const musicToggle = document.getElementById('musicToggle');
    const bgMusic = document.getElementById('bgMusic');
    const musicSource = document.getElementById('musicSource');

    if (!config.music.enabled) {
        musicControls.style.display = 'none';
        return;
    }

    musicSource.src = config.music.musicUrl;
    bgMusic.volume = config.music.volume || 0.5;
    bgMusic.load();

    // 尝试自动播放
    if (config.music.autoplay) {
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                window.appState.setState({ isMusicPlaying: true });
            }).catch(() => {
                console.log("Autoplay prevented by browser, will play on first tap.");
            });
        }
    }

    // 浏览器拦截自动播放时：第一次点击/触摸页面任意处即播放（只兜底一次）
    const tryPlayOnce = () => {
        if (bgMusic.paused) {
            const p = bgMusic.play();
            if (p && p.then) p.then(() => window.appState.setState({ isMusicPlaying: true })).catch(() => {});
        }
    };
    document.addEventListener('pointerdown', tryPlayOnce, { once: false });

    // 播放 / 暂停切换
    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (bgMusic.paused) {
            bgMusic.play();
            window.appState.setState({ isMusicPlaying: true });
        } else {
            bgMusic.pause();
            window.appState.setState({ isMusicPlaying: false });
        }
    });
}

// ============================================================
// 母版原有：分享链接（完整保留）
// ============================================================
function setupShareButton() {
    const shareBtn = document.getElementById('shareBtn');
    if (!shareBtn) return;

    shareBtn.addEventListener('click', () => {
        const fallback = () => {
            const originalText = shareBtn.textContent;
            shareBtn.textContent = "链接已复制 ❤️";
            setTimeout(() => { shareBtn.textContent = originalText; }, 2000);
        };
        if (window.ValentineConfig && window.ValentineConfig.copyShareLink) {
            window.ValentineConfig.copyShareLink().then(success => { if (success) fallback(); });
        } else {
            navigator.clipboard && navigator.clipboard.writeText(window.location.href).then(fallback).catch(() => {});
        }
    });
}
