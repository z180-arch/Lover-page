/**
 * Lightweight App State Management
 * （母版状态机 + 章节旅程：View Transitions、body[data-step]、进度线）
 */

window.appState = {
    currentStep: 1, // 1~8（1 = 序，8 = 惊喜）, or 'celebration'
    isMusicPlaying: false,
    loveValue: 100,

    // Listeners for state changes
    listeners: [],

    subscribe(callback) {
        this.listeners.push(callback);
    },

    setState(newState) {
        const oldState = { ...this };
        Object.assign(this, newState);

        // Notify listeners of the change
        this.listeners.forEach(callback => callback(this, oldState));
    }
};

/* 章节旅程：默认序 + 六章 + 终；config.experience.chapters 可整体覆盖 */
const DEFAULT_JOURNEY = {
    1: { label: '序', progress: 0 },
    2: { label: '壹', progress: 16 },
    3: { label: '贰', progress: 32 },
    4: { label: '叁', progress: 48 },
    5: { label: '肆', progress: 64 },
    6: { label: '伍', progress: 80 },
    7: { label: '陆', progress: 90 },
    8: { label: '柒', progress: 96 },
    celebration: { label: '终', progress: 100 }
};

/* 章节声明表（config.experience.chapters）。空 = 用内置默认。—— 本章唯一来源 */
function chapterList() {
    const cfg = window.VALENTINE_CONFIG;
    const chapters = cfg && cfg.experience && cfg.experience.chapters;
    return Array.isArray(chapters) && chapters.length ? chapters : [];
}

function chapterFor(step) {
    return chapterList().find(function (c) { return String(c.step) === String(step); }) || null;
}

/* 章节是否启用。config 没声明 = 启用（保持 v1 行为）。 */
function chapterEnabled(step) {
    const c = chapterFor(step);
    return c ? c.enabled !== false : true;
}

function journeyFor(step) {
    const c = chapterFor(step);
    if (c && c.label) return { label: c.label, progress: c.progress };
    return DEFAULT_JOURNEY[step] || DEFAULT_JOURNEY[1];
}

/* 面板溶解：主题决定哪些章节的内容直接落在背景上（见 themes/*.js container.dissolveSteps） */
function syncDissolve(step) {
    if (!document.body) return;
    const on = window.LPTheme && typeof window.LPTheme.shouldDissolve === 'function'
        ? window.LPTheme.shouldDissolve(step)
        : String(step) === 'celebration';
    document.body.dataset.dissolve = on ? '1' : '0';
}

window.chapterEnabled = chapterEnabled;
window.chapterFor = chapterFor;
window.syncDissolve = syncDissolve;

/* DOM 变更包一层同文档 View Transitions（Baseline 2025.10），
   不支持的浏览器直接切换（现有 sectionIn 动画仍是兜底） */
function withViewTransition(update) {
    if (document.startViewTransition) {
        document.startViewTransition(update);
    } else {
        update();
    }
}

// UI Reaction logic
window.appState.subscribe((state, oldState) => {
    // Handle step changes
    if (state.currentStep !== oldState.currentStep) {
        withViewTransition(() => {
            document.querySelectorAll('.question-section, .celebration').forEach(el => el.classList.add('hidden'));

            if (state.currentStep === 'celebration') {
                document.getElementById('celebration').classList.remove('hidden');
            } else {
                document.getElementById(`question${state.currentStep}`).classList.remove('hidden');
            }

            // 首页（step 1）显示大标题 h1，其余步骤隐藏，避免与各步骤小标题重复
            const bigTitle = document.getElementById('valentineTitle');
            if (bigTitle) {
                bigTitle.classList.toggle('hidden', state.currentStep !== 1);
            }
        });

        // 章节旅程（config.experience.chapters 可覆盖）
        const chapter = journeyFor(state.currentStep);
        document.body.dataset.step = String(state.currentStep);
        const label = document.getElementById('journeyLabel');
        const fill = document.getElementById('journeyFill');
        if (label) label.textContent = chapter.label;
        if (fill) fill.style.setProperty('--journey-progress', chapter.progress + '%');

        // 面板溶解（主题驱动：该章内容直接落在背景上，不再有卡片包裹）
        syncDissolve(state.currentStep);
    }

    // Handle music state
    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) {
        const config = window.VALENTINE_CONFIG;
        musicToggle.textContent = state.isMusicPlaying ? config.music.stopText : config.music.startText;
    }
});
