/* ============================================================================
 * Theme preset — warm-paper（默认 · Redouté / Museum / Editorial）
 * ----------------------------------------------------------------------------
 * 这是 v1 以来的原始视觉：暖奶油纸底 + 深墨 + 柔和玫瑰。
 *
 * 一个 theme preset 必须描述「整套视觉语言」，而不只是一组颜色：
 *   surfaces / ink / accent / lines / fx / type / motion / container / mesh / petal
 * 其中 container 决定章节外框（面板卡）的形态 —— 换主题时章节构图会跟着变，
 * 而不是只换配色（见 docs/design/THEME_REGISTRY.md）。
 *
 * 新增主题：复制本文件 → 改 token → 在 themes/index.js 注册 → 写 THEME_REGISTRY。
 * 不要直接改 styles.css 里的 :root 默认值（那是 warm-paper 的兜底，不是主题开关）。
 * ==========================================================================*/
(function () {
    'use strict';

    window.LP_THEMES = window.LP_THEMES || {};

    window.LP_THEMES['warm-paper'] = {
        label: '暖纸 · 博物馆编辑设计',
        description: '暖奶油纸底、深棕墨色、柔和玫瑰强调色；面板卡承载内容。v1 原始视觉。',

        /* 表面：页面/卡片的所有底色。必须是实色 —— rgba 叠在 mesh gradient 上对比度不可预测。 */
        surface: {
            paper: '#fdf9f4',      // 最亮的纸（展签、便签、信件）
            paper2: '#f7ece2',     // 页面基色
            paper3: '#f3d5cb',     // 页面基色（暖端）
            panel: '#fffbf6',      // 内容面板卡（实色；不再用 rgba）
            panelAlt: '#fdfaf3'    // 面板内的次级面（仪器壳、信封壳）
        },

        /* 墨色：三档，全部实色。对比度实测见 docs/ARCHITECTURE.md 无障碍基线 */
        ink: {
            ink: '#4a3a33',        // 10.3:1 on paper
            soft: '#6b5a52',       // 6.3:1
            faint: '#7a6a62',      // 4.9:1（对 --paper 实测）
            muted: '#8d7c72',      // 仅用于纯装饰、无文本语义处
            /* 落在**背景画布**上的小字（章节进度线编号）。
             * 面板溶解 / 透明主题下，文字直接压在 mesh gradient 上，
             * 而 mesh 的最深色比 --paper 暗得多 —— 对 --ink-faint 只有 3.74:1，不过 AA。
             * 因此这一档必须单独指定，按「最深 mesh 色」而不是「paper」来标定。 */
            canvas: '#6b5a52'      // 4.7:1 对最深 mesh 色 #f3d5cb
        },

        accent: {
            main: '#a8544f',
            deep: '#8f403c',
            onAccent: '#fdf7f1',
            soft: 'rgba(168, 84, 79, 0.12)'
        },

        lines: {
            hairline: 'rgba(74, 58, 51, 0.14)',
            strong: 'rgba(74, 58, 51, 0.3)',
            inkLine: 'rgba(74, 58, 51, 0.42)'   // 便签横格、信纸格线
        },

        fx: {
            shadowCard: '0 12px 40px rgba(80, 50, 35, 0.10)',
            shadowThumb: '0 3px 10px rgba(90, 45, 40, 0.3)',
            shadowPanel: '0 18px 60px rgba(80, 50, 35, 0.13)',
            vignette: 'rgba(60, 40, 30, 0.05)',
            shimmer: 'rgba(255, 255, 255, 0.55)',
            scrim: 'rgba(30, 20, 16, 0.62)',
            grainOpacity: '0.05'
        },

        /* 章节外框（面板卡）—— 主题差异最明显的地方 */
        container: {
            background: '#fffbf6',
            border: '1px solid rgba(74, 58, 51, 0.07)',
            radius: '14px',
            shadow: '0 18px 60px rgba(80, 50, 35, 0.13)',
            padding: '28px 22px',
            /* 该主题下「溶掉面板」的章节：内容直接落在纸底上（step 值，逗号分隔）。
               空 = 所有章节都保留面板卡。 */
            dissolveSteps: '8,celebration'
        },

        type: {
            /* 中文衬线优先；留空 = 系统栈（webfont 子集化是独立课题，见 ROADMAP） */
            display: "'Noto Serif SC', 'Songti SC', 'STSong', 'Source Han Serif SC', 'SimSun', Georgia, serif",
            body: "'Noto Serif SC', 'Songti SC', 'STSong', 'Source Han Serif SC', 'SimSun', Georgia, serif",
            ui: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
            mono: "'SF Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace",
            outlier: "Georgia, 'Times New Roman', serif",
            /* 字号尺度：display → folio */
            scale: {
                displayXl: 'clamp(30px, 8.6vw, 46px)',
                displayLg: 'clamp(24px, 6.4vw, 34px)',
                heading: 'clamp(19px, 4.6vw, 24px)',
                bodyLg: '17px',
                body: '15.5px',
                bodySm: '13.5px',
                caption: '12.5px',
                label: '11px',
                folio: '10.5px'
            },
            weight: { display: '500', heading: '600', body: '400' },
            tracking: { display: '0.04em', label: '0.22em', folio: '0.14em' }
        },

        motion: {
            easeOut: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
            durFast: '200ms',
            durMed: '550ms',
            durSlow: '900ms',
            /* mesh gradient 呼吸 */
            gradientSpeed: 700,
            gradientAmp: 130,
            /* 飘落花瓣 */
            petalCount: 9,
            petalFallDuration: [12, 22],
            burstCount: 24,
            introFadeMs: 1500
        },

        /* 第一屏主视觉：留空 = 隐藏玫瑰舞台（深色主题用得上，intro.js 已处理） */
        hero: {
            rose: './assets/art/redoute-gallica-bloom.webp',
            title: '我们的小小世界',
            subtitle: 'A little world, just for us.',
            enterBtn: '进　入'
        },

        /* site 级 mesh gradient 四色 */
        mesh: ['#f7ece2', '#f3d5cb', '#f7ddc0', '#f2e6d9'],
        /* 花瓣双色 */
        petal: ['#dda3ab', '#c4777f'],

        /* 纸张材质：便签 / 信纸 / 信封内页 / 编辑设计版面 / 火漆 */
        paper: {
            sheet: 'linear-gradient(180deg, #fdfaf3, #f7eadd)',
            flap: 'linear-gradient(180deg, #f7eadd, #efdccb)',
            tape: 'rgba(238, 222, 198, 0.66)',
            wash: 'rgba(255, 253, 250, 0.78)',
            wash2: 'rgba(247, 236, 226, 0.42)',
            washHi: 'rgba(255, 255, 255, 0.72)',
            seal: '#bb6860',
            accentLine: 'rgba(168, 84, 79, 0.26)'
        }
    };
})();
