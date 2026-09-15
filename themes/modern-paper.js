/* ============================================================================
 * Theme preset — modern-paper（现代纸本 / Minimal Editorial）
 * ----------------------------------------------------------------------------
 * 与 warm-paper 的差异不在颜色，而在**构图语法**：
 *   1. 面板卡消失（container.background = transparent）—— 内容直接落在纸面上，
 *      靠细分隔线与留白组织，而不是靠「一张白卡」。
 *      这一条就把八章的观感从「卡片套卡片」变成真正的编辑设计版式。
 *   2. 正文改用无衬线栈，字号层级更紧，字距更小 → 现代杂志而非古籍。
 *   3. 圆角归零、阴影归零，线条成为唯一的分层手段。
 *   4. 强调色换成墨蓝（而非玫瑰红），情绪从"柔软"转为"克制、清醒"。
 *
 * 因此这是验证「同一 Runtime + 换 theme = 换体验」最有力的一个主题：
 * 它与 warm-paper 的差别肉眼可辨，且没有改一行 renderer 代码。
 * ==========================================================================*/
(function () {
    'use strict';

    window.LP_THEMES = window.LP_THEMES || {};

    window.LP_THEMES['modern-paper'] = {
        label: '现代纸本 · 极简编辑设计',
        description: '近白纸面、无面板卡（靠细线与留白分层）、无衬线正文、墨蓝强调色、零圆角零阴影。',

        surface: {
            paper: '#ffffff',
            paper2: '#fbfaf8',
            paper3: '#efedea',
            panel: 'transparent',      // ← 面板卡在此主题下不存在
            panelAlt: '#f6f5f2'
        },

        /* 冷墨，全部实色。对本主题纸底 #ffffff 实测：
         *   ink 17.0:1 / soft 7.0:1 / faint 5.3:1  —— 三档均 ≥ WCAG AA 4.5:1
         * 踩坑记录：初版 faint 取 #7b7772，实测仅 4.45:1，差 0.05 就不过 AA。
         * 深色主题的 faint 反而是安全的（浅字压深底对比度天然大），
         * 最容易失守的是「近白底 + 中灰字」这一组 —— 改主题时务必复算。 */
        ink: {
            ink: '#1d1c1a',
            soft: '#5c5955',
            faint: '#67635e',
            muted: '#9a968f',
            /* 本主题没有面板卡（内容直接落在纸面/画布上），所以 faint 必须按
             * 「最深 mesh 色 #e9e6e0」标定 —— 这就是它比另两个主题更深的原因。 */
            canvas: '#5c5955'
        },

        accent: {
            main: '#35506b',
            deep: '#263c52',
            onAccent: '#f7f9fb',
            soft: 'rgba(53, 80, 107, 0.10)'
        },

        lines: {
            hairline: 'rgba(29, 28, 26, 0.12)',
            strong: 'rgba(29, 28, 26, 0.34)',
            inkLine: 'rgba(29, 28, 26, 0.20)'
        },

        fx: {
            shadowCard: 'none',
            shadowThumb: '0 2px 8px rgba(29, 28, 26, 0.16)',
            shadowPanel: 'none',
            vignette: 'rgba(29, 28, 26, 0.03)',
            shimmer: 'rgba(255, 255, 255, 0.7)',
            scrim: 'rgba(20, 20, 19, 0.7)',
            grainOpacity: '0.035'
        },

        container: {
            background: 'transparent',
            border: 'none',
            radius: '0',
            shadow: 'none',
            padding: '0',
            /* 无面板可溶 —— 该主题所有章节都已经是「内容直接落在纸面」 */
            dissolveSteps: ''
        },

        type: {
            display: "'Noto Serif SC', 'Songti SC', 'STSong', 'Source Han Serif SC', 'SimSun', Georgia, serif",
            /* 正文换无衬线：这是与 warm-paper 最直观的差异之一 */
            body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif",
            ui: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
            mono: "'SF Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace",
            outlier: "'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
            scale: {
                displayXl: 'clamp(32px, 9.2vw, 52px)',
                displayLg: 'clamp(25px, 6.8vw, 38px)',
                heading: 'clamp(20px, 4.8vw, 26px)',
                bodyLg: '16.5px',
                body: '15px',
                bodySm: '13px',
                caption: '12px',
                label: '10.5px',
                folio: '10px'
            },
            weight: { display: '600', heading: '600', body: '400' },
            tracking: { display: '-0.01em', label: '0.18em', folio: '0.12em' }
        },

        /* 更紧的节奏：编辑设计不拖沓；花瓣几乎退场，只留极少量 */
        motion: {
            easeOut: 'cubic-bezier(0.32, 0.72, 0, 1)',
            durFast: '160ms',
            durMed: '420ms',
            durSlow: '700ms',
            gradientSpeed: 380,
            gradientAmp: 70,
            petalCount: 4,
            petalFallDuration: [14, 24],
            burstCount: 14,
            introFadeMs: 1100
        },

        hero: {
            rose: './assets/art/redoute-gallica-bloom.webp',
            title: '给你的一些页面',
            subtitle: 'Selected pages, kept for you.',
            enterBtn: '开　始'
        },

        mesh: ['#fbfaf8', '#f1efeb', '#e9e6e0', '#f7f4f1'],
        petal: ['#b9b4ac', '#8e8880'],

        /* 冷白纸 + 中性胶带：编辑设计里纸张不该被"做旧" */
        paper: {
            sheet: 'linear-gradient(180deg, #ffffff, #f7f6f3)',
            flap: 'linear-gradient(180deg, #f4f3f0, #eceae6)',
            tape: 'rgba(200, 198, 192, 0.55)',
            wash: 'rgba(255, 255, 255, 0.9)',
            wash2: 'rgba(241, 239, 235, 0.5)',
            washHi: 'rgba(255, 255, 255, 0.85)',
            seal: '#4a6785',
            accentLine: 'rgba(53, 80, 107, 0.24)'
        }
    };
})();
