// Initialize configuration
const config = window.VALENTINE_CONFIG;

/* 当前生效的主题令牌（preset + config.theme 合并后的结果）。
 * renderer 一律从这里读视觉参数，不要再各自去翻 config.theme ——
 * 否则「主题 preset 提供的值」会被绕过，换主题时行为不一致。
 * 定义处必须早于任何调用点（曾因缺失本函数导致初始化在第一步就中断）。 */
function themeTokens() {
    if (window.LPTheme && typeof window.LPTheme.current === 'function') {
        return window.LPTheme.current();
    }
    return (config && config.theme) || {};
}

// Validate configuration
function validateConfig() {
    const warnings = [];

    // Check required fields
    if (!config.pageTitle) {
        warnings.push("pageTitle is not set! Using default.");
        config.pageTitle = "和你一起玩";
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

/* ============================================================
 * 兼容层（对应 AGENTS.md 的「Legacy API → Compatibility Layer → New Module」）
 *
 * script.js 是个 1000 行的编排文件，正在按「有独立职责 + 有独立测试价值」
 * 的标准渐进拆分。已抽出的模块通过同名薄封装接回来，所以：
 *   - index.html 里 15 处内联 onclick（showNextQuestion / finishMeter / celebrate…）
 *     一行都不用改；
 *   - 本文件内部上百个调用点也不用改；
 *   - 但实现已经搬到能单独测试的地方去了。
 *
 * 已抽出：
 *   js/core/text.js      esc / textPool / pickRandom —— esc 是全站唯一的安全边界
 *   js/chapters/gauge.js 仪表几何与绘制 —— 纯计算，可无浏览器单测
 * ============================================================ */
const esc = window.LPText.esc;
const textPool = window.LPText.textPool;
const pickRandom = window.LPText.pickRandom;

// Default color values
function getDefaultColor(key) {
    const defaults = {
        backgroundStart: "#f7ece2",
        backgroundEnd: "#f3d5cb",
        buttonBackground: "#a8544f",
        buttonHover: "#8f403c",
        textColor: "#4a3a33"
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

    // 章节章名（config.experience.chapters[].title → kicker）
    renderChapterKickers();

    // 第一屏开场文案：theme preset 的 hero 优先，config.theme.hero 作为实例级覆盖
    const introTitle = document.getElementById('introTitle');
    const introSub = document.getElementById('introSub');
    const introEnter = document.getElementById('introEnter');
    const hero = (themeTokens() && themeTokens().hero) || (config.theme && config.theme.hero) || {};
    if (introTitle && hero.title) introTitle.textContent = hero.title;
    if (introSub && hero.subtitle) introSub.textContent = hero.subtitle;
    if (introEnter && hero.enterBtn) introEnter.textContent = hero.enterBtn;

    // 首页：h1 为母版英文手写标题（最上方），h2 为中文标题，副标题在其下
    const enTitle = (config.home && config.home.enTitle) || 'my love...';
    const nick = (config.person && (config.person.nickname || config.person.name)) || config.valentineName;
    const enPrefix = nick ? `${nick}, ` : '';
    document.getElementById('valentineTitle').textContent = `${enPrefix}${enTitle}`;
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

    // 照片（先建灯箱 + 联系印样，再渲染，保证首张即可点开、胶片条已就位）
    document.getElementById('photoPrevBtn').textContent = config.photoPrevBtn || '上一张';
    document.getElementById('photoNextBtn').textContent = config.photoNextBtn;
    buildPhotoLightbox();
    buildContactSheet();
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

    // 信件章文案 + 初始状态
    document.getElementById('letterAgainBtn').textContent = config.letterAgainBtn;
    document.getElementById('letterNextBtn').textContent = config.letterNextBtn;
    renderLetter();

    // AudioContext 需要用户手势解锁：开场按钮点击时预热
    document.getElementById('introEnter').addEventListener('click', () => Sound.ensure(), { once: true });

    // 初始章节旅程（state 订阅只在变化时触发）
    document.body.dataset.step = '1';
    const fill = document.getElementById('journeyFill');
    if (fill) fill.style.setProperty('--journey-progress', '0%');
    syncDissolve(1);
});

/* 章节 kicker 章名：唯一来源是 config.experience.chapters[].title。
 * journey 负责编号与进度，kicker 只负责章名 —— 两处不再印同一个字（v1 的视觉冗余）。
 * 空 title（如首页）则隐藏 kicker，而不是留一条空行。 */
function renderChapterKickers() {
    const list = (typeof chapterList === 'function') ? chapterList() : [];
    document.querySelectorAll('.question-section').forEach((section) => {
        const m = /^question(\d+)$/.exec(section.id || '');
        if (!m) return;
        const kicker = section.querySelector('.chapter-kicker');
        if (!kicker) return;
        const chapter = list.find(c => String(c.step) === m[1]);
        const title = chapter && chapter.title;
        if (!title) {
            kicker.setAttribute('hidden', '');
            return;
        }
        kicker.removeAttribute('hidden');
        kicker.textContent = title;
    });
}

// ============================================================
// 母版原有：浮动爱心和熊（完整保留）
// ============================================================
function createFloatingElements() {
    const container = document.querySelector('.floating-elements');
    if (!container) return;
    container.innerHTML = '';

    // 极少量花瓣，慢速飘落；纯 CSS 形状，不用 emoji
    const motion = themeTokens().motion || {};
    const fallRange = motion.petalFallDuration || [12, 22];
    const PETAL_COUNT = Math.round((window.innerWidth < 640 ? 0.5 : 1) * (motion.petalCount || 9));
    for (let i = 0; i < PETAL_COUNT; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.setProperty('--fall-duration', fallRange[0] + Math.random() * (fallRange[1] - fallRange[0]) + 's');
        petal.style.setProperty('--fall-delay', Math.random() * 14 + 's');
        petal.style.setProperty('--fall-distance', (Math.random() * 90 - 45) + 'px');
        container.appendChild(petal);
    }
}

// 母版原有：步骤切换（完整保留）+ 产品化：空章节自动跳过
/* 内容为空的章节直接跳过：避免收信人走到「空白页 / 只有一行占位文字 / 点不动的按钮」（§31）。
   与 letters 原有的跳过逻辑统一为一张表，新增章节只在这里加一行。 */
const CHAPTER_CONTENT_COUNT = {
    2: () => ((config.quiz && config.quiz.options) || []).length,
    4: () => textPool(config.randomQuestions).length,
    5: () => textPool(config.smallThings).length,
    6: () => (config.photos || []).length,
    7: () => (((config.story && config.story.letters) || config.letters) || []).length,
    8: () => textPool(config.surprises).length
};

function showNextQuestion(questionNumber) {
    let n = Number(questionNumber);

    // 向前跳过所有「被禁用」或「无内容」的章节；全部不可用时直接进入结尾（而不是停在空页）
    let guard = 0;
    while (guard++ < 12) {
        const disabled = typeof window.chapterEnabled === 'function' && !window.chapterEnabled(n);
        const empty = CHAPTER_CONTENT_COUNT[n] && CHAPTER_CONTENT_COUNT[n]() === 0;
        if (!disabled && !empty) break;
        n += 1;
    }
    if (n > 8) {
        celebrate();
        return;
    }

    if (config.sound && config.sound.uiTick) Sound.tick();
    window.appState.setState({ currentStep: n });
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
// 视觉层：模拟仪表的实时读数（纯 SVG，无依赖、无构建）
// ============================================================
const loveMeter = document.getElementById('loveMeter');
const loveValue = document.getElementById('loveValue');
const extraLove = document.getElementById('extraLove');

/* 仪表几何与绘制已抽到 js/chapters/gauge.js。这里保留同名薄封装，
 * 让散落在本文件里的调用点与 DOMContentLoaded 初始化不用改。 */
const gaugeAngleFor = (v) => window.LPGauge.angleFor(v);
const buildGaugeTicks = () => window.LPGauge.buildTicks();
const updateGauge = (v) => window.LPGauge.update(v);
const resetGaugePeak = () => window.LPGauge.resetPeak();

function setInitialPosition() {
    loveMeter.value = 100;
    loveValue.textContent = 100;
    resetGaugePeak();
    updateGauge(100);
}

loveMeter.addEventListener('input', () => {
    const value = parseInt(loveMeter.value, 10) || 0;
    loveValue.textContent = value;
    updateGauge(value);
    window.appState.setState({ loveValue: value });

    if (value > 100) {
        extraLove.classList.remove('hidden');

        const th = Object.assign({ normal: 100, high: 1000, extreme: 5000 },
            (config.meter && config.meter.thresholds) || {});
        if (value >= th.extreme) {
            extraLove.classList.add('super-love');
            extraLove.textContent = config.loveMessages.extreme;
        } else if (value > th.high) {
            extraLove.classList.remove('super-love');
            extraLove.textContent = config.loveMessages.high;
        } else {
            extraLove.classList.remove('super-love');
            extraLove.textContent = config.loveMessages.normal;
        }
    } else {
        extraLove.classList.add('hidden');
        extraLove.classList.remove('super-love');
    }
});

window.addEventListener('DOMContentLoaded', () => { buildGaugeTicks(); setInitialPosition(); });
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
    setTimeout(() => showNextQuestion(4),
        (config.meter && config.meter.doneDelayMs) || 900);
}

// ============================================================
// 小游戏 3：随机问题
// ============================================================
let lastQuestionIdx = -1;
/* pickRandom 已抽到 js/core/text.js（纯函数，可单测），顶部有薄封装 */
function replaySwapAnimation(el) {
    if (!el) return;
    el.classList.remove('is-swapping');
    void el.offsetWidth; /* 强制重排以重触发动画 */
    el.classList.add('is-swapping');
}

function showRandomQuestion() {
    const pool = textPool(config.randomQuestions);
    const el = document.getElementById('randomQuestionText');
    lastQuestionIdx = pickRandom(pool, lastQuestionIdx);
    if (lastQuestionIdx < 0) { el.textContent = ''; return; }
    el.textContent = pool[lastQuestionIdx];
    replaySwapAnimation(el);

    // 编辑设计的 folio 编号：跟随池内序号（两位），给「一本刊物在翻页」的感觉
    const folio = document.getElementById('questionFolio');
    if (folio) folio.textContent = String(lastQuestionIdx + 1).padStart(2, '0');
}
function nextRandomQuestion() { showRandomQuestion(); }

// ============================================================
// 小游戏 4：随机小任务
// ============================================================
let lastThingIdx = -1;
function showSmallThing() {
    const pool = textPool(config.smallThings);
    const el = document.getElementById('smallThingText');
    lastThingIdx = pickRandom(pool, lastThingIdx);
    if (lastThingIdx < 0) { el.textContent = ''; return; }
    el.textContent = pool[lastThingIdx];
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
        .map(p => ({ href: p.src, type: 'image', description: p.description || p.caption || '' }));
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

/* focalPoint {x,y}（0~1 归一化）→ CSS object-position。
 * 越界值夹到 [0,100]，非法值返回空串（等价于默认居中）。 */
function photoFocus(p) {
    const f = p && p.focalPoint;
    if (!f || typeof f !== 'object') return '';
    const x = Number(f.x), y = Number(f.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return '';
    const cl = (v) => Math.min(100, Math.max(0, v * 100)).toFixed(1);
    return cl(x) + '% ' + cl(y) + '%';
}

/* 照片/视频标签。三条硬规则：
 *   1. 所有 config 值必须 esc() —— 这个函数曾经是唯一漏掉转义的渲染点，
 *      而照片配置可以经 ?conf= 从 URL 进入，等于一个注入面。
 *   2. width/height 原样交给浏览器 → 图片下载完成前就预留正确高度（防 CLS）。
 *      没有这两个字段时保持旧行为（不写属性，不强制比例）。
 *   3. focalPoint → object-position，决定裁切保留哪一部分。 */
function photoMediaHtml(p, isVideo) {
    const w = Number(p.width), h = Number(p.height);
    const hasDims = Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0;
    const dims = hasDims ? ` width="${w}" height="${h}"` : '';

    if (isVideo) {
        return `<video src="${esc(p.src)}" controls playsinline loop muted${dims}></video>`;
    }
    const focus = photoFocus(p);
    const src = p.thumb || p.src;
    /* alt 优先取显式的 alt；退化到 title；再退化到通用描述 */
    const alt = (p.alt != null && String(p.alt) !== '')
        ? p.alt
        : (p.title || '回忆');
    return `<img src="${esc(src)}" alt="${esc(alt)}"${dims}`
        + (focus ? ` style="--photo-focus:${focus}"` : '')
        + ` loading="lazy" decoding="async" />`;
}

function renderPhoto() {
    const stage = document.getElementById('photoStage');
    const caption = document.getElementById('photoCaption');
    const list = config.photos || [];
    const texts = config.photoTexts || {};
    if (!list.length) {
        stage.innerHTML = '<div class="photo-frame"><div class="photo-error">'
            + esc(texts.empty || '还没有放进照片。') + '</div></div>';
        caption.textContent = '';
        return;
    }
    const p = list[photoIndex];
    const isVideo = /\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(p.src || '');
    const plate = [p.date, p.place || p.location].filter(Boolean).join(' · ');
    const seq = photoIndex + 1 + ' / ' + list.length;
    const plateHtml = plate
        ? `<div class="photo-plate"><span>${esc(plate)}</span><span class="plate-seq">${esc(seq)}</span></div>`
        : `<div class="photo-plate"><span class="plate-seq">${esc(seq)}</span></div>`;
    // html-safe: photoMediaHtml() 与 plateHtml 内部全部走 esc()，这里只选择分支
    stage.innerHTML = isVideo
        ? `<div class="photo-frame is-loading">${photoMediaHtml(p, true)}${plateHtml}</div>`
        : `<div class="photo-frame is-loading is-revealing">${photoMediaHtml(p, false)}${plateHtml}</div>`;
    caption.textContent = p.description || p.caption || '';

    const frame = stage.querySelector('.photo-frame');
    if (frame) {
        frame.addEventListener('animationend', (e) => {
            if (e.animationName === 'curtainReveal') frame.classList.remove('is-revealing');
        });
    }
    const img = stage.querySelector('img');
    const video = stage.querySelector('video');
    if (img) {
        if (img.complete && img.naturalWidth) frame.classList.remove('is-loading');
        img.addEventListener('load', () => frame.classList.remove('is-loading'));
        img.addEventListener('error', () => {
            frame.classList.remove('is-loading');
            frame.innerHTML = '<div class="photo-error">'
                + esc(texts.error || '这张照片暂时加载不出来。') + '</div>';
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
            frame.innerHTML = '<div class="photo-error">'
                + esc(texts.videoError || '这段视频暂时加载不出来。') + '</div>';
        });
        const pp = video.play();
        if (pp && pp.catch) pp.catch(() => {});
    }
    syncContactSheet();
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

/* 联系印样（contact sheet）：美术馆档案式的横向缩略图索引。
   与「上一张 / 下一个」按钮并行存在 —— 按钮是主路径，胶片条是快速定位。 */
function buildContactSheet() {
    const nav = document.getElementById('contactSheet');
    if (!nav) return;
    const list = config.photos || [];
    if (list.length < 2) {
        nav.setAttribute('hidden', '');
        nav.innerHTML = '';
        return;
    }
    nav.removeAttribute('hidden');
    nav.innerHTML = list.map((p, i) => {
        const isVideo = /\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(p.src || '');
        const src = p.thumb || p.src;
        const label = p.title || p.caption
            || (isVideo ? `第 ${i + 1} 段影像` : `第 ${i + 1} 张照片`);
        return `<button type="button" class="contact-cell" data-index="${i}"`
            + ` aria-label="${esc(label)}" aria-current="false">`
            + `<img src="${esc(src)}" alt="" loading="lazy" decoding="async" />`
            + (isVideo ? '<span class="contact-video" aria-hidden="true"></span>' : '')
            + '</button>';
    }).join('');

    nav.querySelectorAll('.contact-cell').forEach((btn) => {
        btn.addEventListener('click', () => {
            const i = Number(btn.dataset.index);
            if (!Number.isInteger(i) || i < 0 || i >= list.length) return;
            if (config.sound && config.sound.uiTick) Sound.tick();
            photoIndex = i;
            renderPhoto();
        });
    });
}

function syncContactSheet() {
    const nav = document.getElementById('contactSheet');
    if (!nav || nav.hasAttribute('hidden')) return;
    const cells = nav.querySelectorAll('.contact-cell');
    cells.forEach((b, i) => {
        const on = i === photoIndex;
        b.classList.toggle('is-current', on);
        b.setAttribute('aria-current', on ? 'true' : 'false');
    });
    const cur = cells[photoIndex];
    if (!cur) return;
    // 只滚动胶片条自身 —— 用 scrollTo 而不是 scrollIntoView，避免连带把整页竖直滚动
    const target = cur.offsetLeft - (nav.clientWidth - cur.clientWidth) / 2;
    const max = nav.scrollWidth - nav.clientWidth;
    if (Math.abs(nav.scrollLeft - Math.max(0, Math.min(max, target))) > 4) {
        try {
            nav.scrollTo({ left: Math.max(0, Math.min(max, target)), behavior: 'smooth' });
        } catch (e) {
            nav.scrollLeft = Math.max(0, Math.min(max, target));
        }
    }
}

// ============================================================
// 信件 / 回忆（陆·来信）
// ============================================================
let letterIndex = 0;
let letterAudio = null;

/* 语音文案（config.sound.voiceTexts）：所有按钮文案唯一来源 */
const DEFAULT_VOICE_TEXTS = { play: '播放语音', pause: '暂停', error: '暂时无法播放' };
function voiceTexts() {
    return Object.assign({}, DEFAULT_VOICE_TEXTS, (config.sound && config.sound.voiceTexts) || {});
}

function renderLetter() {
    const stage = document.getElementById('letterStage');
    const hint = document.getElementById('letterHint');
    const list = ((config.story && config.story.letters) || config.letters || []);
    if (!list.length) {
        // 防御：正常情况下该章已被 showNextQuestion 跳过（§31 不留空白页）
        stage.innerHTML = '<article class="letter-card"><p class="letter-body">'
            + '还没有写下的信。</p></article>';
        hint.textContent = '';
        return;
    }
    const p = list[letterIndex];
    // 先取文案，再拼模板 —— 否则模板里引用 vt 会命中 TDZ（历史 bug）
    const vt = voiceTexts();

    const meta = p.date ? `<div class="letter-date">${esc(p.date)}</div>` : '';
    const img = p.image
        ? `<img src="${esc(p.image)}" alt="${esc(p.title || '信件配图')}" loading="lazy" />`
        : '';
    const audio = (p.audio && config.sound && config.sound.voiceEnabled !== false) ? `
        <button class="voice-btn" type="button" data-src="${esc(p.audio)}" aria-label="${esc(vt.play)}">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          <span>${esc(vt.play)}</span>
        </button>` : '';

    stage.innerHTML = `
      <article class="letter-card is-opening">
        ${meta}
        <h3 class="letter-title">${esc(p.title)}</h3>
        ${img}
        <p class="letter-body">${esc(p.content)}</p>
        ${audio}
      </article>`;
    hint.textContent = list.length > 1 ? `${letterIndex + 1} / ${list.length}` : '';

    if (list.length > 1) {
        document.getElementById('letterAgainBtn').classList.remove('hidden');
    } else {
        document.getElementById('letterAgainBtn').classList.add('hidden');
    }

    const vb = stage.querySelector('.voice-btn');
    if (vb) {
        vb.addEventListener('click', () => toggleVoice(vb, p.audio));
    }

    // 结束后移除开信动画类
    const card = stage.querySelector('.letter-card');
    if (card) {
        card.addEventListener('animationend', (e) => {
            if (e.animationName === 'letterOpen') card.classList.remove('is-opening');
        });
    }
}

function nextLetter() {
    const list = ((config.story && config.story.letters) || config.letters || []);
    if (list.length < 2) return;
    letterIndex = (letterIndex + 1) % list.length;
    renderLetter();
}

/* 语音播放：原生 <audio> + 音量渐入，无依赖 */
function toggleVoice(btn, src) {
    const fade = (config.sound && config.sound.fadeMs) || {};
    const vt = voiceTexts();
    const label = btn.querySelector('span');

    if (letterAudio && !letterAudio.paused) {
        fadeVolume(letterAudio, 0, fade.voiceOut || 400, () => {
            letterAudio.pause();
            resetVoiceBtn();
        });
        return;
    }
    resetVoiceBtn();
    letterAudio = new Audio(src);
    letterAudio.volume = 0;
    letterAudio.play().then(() => {
        fadeVolume(letterAudio, (config.sound && config.sound.volume) || config.music.volume || 0.6, fade.voiceIn || 800);
        btn.classList.add('is-playing');
        if (label) label.textContent = vt.pause;
        letterAudio.onended = resetVoiceBtn;
        letterAudio.onerror = () => {
            resetVoiceBtn();
            if (label) label.textContent = vt.error;
        };
    }).catch(() => {
        if (label) label.textContent = vt.error;
    });
}
function resetVoiceBtn() {
    const vt = voiceTexts();
    document.querySelectorAll('.voice-btn').forEach(b => {
        b.classList.remove('is-playing');
        const sp = b.querySelector('span');
        if (sp) sp.textContent = vt.play;
    });
}

/* 音量线性渐变（BGM 与语音共用） */
function fadeVolume(audioEl, target, ms, done) {
    const from = audioEl.volume;
    const t0 = performance.now();
    (function step(now) {
        const k = Math.min(1, (now - t0) / ms);
        audioEl.volume = Math.max(0, Math.min(1, from + (target - from) * k));
        if (k < 1) requestAnimationFrame(step);
        else if (done) done();
    })(t0);
}

// ============================================================
// 声音系统（Web Audio 合成微音效，零素材）
// ============================================================
const Sound = {
    ctx: null,
    ensure() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) this.ctx = new AC();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    },
    /* 极轻的纸张/风铃质感提示音：两个正弦短音 + 快速衰减 */
    tick() {
        if (!(config.sound && config.sound.uiTick)) return;
        const ctx = this.ensure();
        if (!ctx) return;
        const t = ctx.currentTime;
        const spec = (config.sound && config.sound.tick) || { freqs: [1244, 1866], gain: 0.045 };
        [[spec.freqs[0], 0], [spec.freqs[1], 0.06]].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, t + delay);
            gain.gain.exponentialRampToValueAtTime(spec.gain, t + delay + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.22);
            osc.connect(gain).connect(ctx.destination);
            osc.start(t + delay);
            osc.stop(t + delay + 0.25);
        });
    }
};

// ============================================================
// 随机惊喜
// ============================================================
function nextSurprise() {
    const pool = textPool(config.surprises);
    const txt = document.getElementById('surpriseText');
    if (!pool.length) { txt.textContent = ''; txt.classList.remove('is-on'); return; }

    txt.textContent = pool[Math.floor(Math.random() * pool.length)];

    // 重放「纸条从信封里抽出来」的动画（再抽一个时也重放，而不是只有第一次）
    txt.classList.remove('is-on');
    void txt.offsetWidth;
    txt.classList.add('is-on');

    const envelope = document.getElementById('envelope');
    if (envelope) envelope.classList.add('is-open');
    document.getElementById('surpriseBtn').classList.add('hidden');
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

    // 母版原有：花瓣迸发（只调用一次 —— 历史 bug 是调用两次，密度翻倍）
    createHeartExplosion();
}

function createHeartExplosion() {
    const container = document.querySelector('.floating-elements');
    if (!container) return;
    const burstCount = (themeTokens().motion && themeTokens().motion.burstCount) || 24;
    for (let i = 0; i < burstCount; i++) {
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

    // 信件章：停止语音、回到第一封（历史遗漏 —— 重玩会从上次那封继续）
    if (letterAudio) {
        letterAudio.pause();
        letterAudio = null;
    }
    resetVoiceBtn();
    letterIndex = 0;
    renderLetter();

    // 惊喜章：合上信封，回到「还没拆」的状态
    const envelope = document.getElementById('envelope');
    if (envelope) envelope.classList.remove('is-open');
    const surpriseText = document.getElementById('surpriseText');
    surpriseText.textContent = '';
    surpriseText.classList.remove('is-on');
    document.getElementById('surpriseBtn').classList.remove('hidden');
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

    musicSource.src = (config.sound && config.sound.bgm) || config.music.musicUrl;
    bgMusic.volume = 0;
    bgMusic.load();

    // 播放/暂停都走音量渐变，避免生硬
    const targetVol = (config.sound && config.sound.volume) || config.music.volume || 0.5;
    const bgmFade = (config.sound && config.sound.fadeMs) || {};
    bgMusic.addEventListener('play', () => fadeVolume(bgMusic, targetVol, bgmFade.bgmIn || 1400));
    bgMusic.addEventListener('pause', () => fadeVolume(bgMusic, 0, bgmFade.bgmOut || 500));

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
            shareBtn.textContent = (config.ending && config.ending.shareCopiedText) || '链接已复制';
            setTimeout(() => { shareBtn.textContent = originalText; }, 2000);
        };
        if (window.ValentineConfig && window.ValentineConfig.copyShareLink) {
            window.ValentineConfig.copyShareLink().then(success => { if (success) fallback(); });
        } else {
            navigator.clipboard && navigator.clipboard.writeText(window.location.href).then(fallback).catch(() => {});
        }
    });
}
