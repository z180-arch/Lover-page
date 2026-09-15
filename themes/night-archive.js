/* ============================================================================
 * Theme preset — night-archive（暗夜档案 / Dark Gallery）
 * ----------------------------------------------------------------------------
 * 存在的意义：证明「同一份 Runtime + 换 theme = 换一个体验」是真的，
 * 而不只是把暖色改成别的暖色。
 *
 * 与 warm-paper 的实际差异（可在浏览器里逐条核对）：
 *   1. 底色从暖奶油 → 近黑暖墨；墨色三档整体反相（浅字压深底）
 *   2. 面板卡从「白卡浮在渐变上」→「深色亚光卡 + 1px 暖边」，阴影改为内发光式的极弱外发光
 *   3. 第一屏主视觉玫瑰退场（Redouté 是白底 alpha 铜版画，压在暗底上像贴纸）
 *      → hero.rose 留空，intro.js 会隐藏玫瑰舞台，第一屏变成纯字排版的展签
 *   4. 动效整体变慢、花瓣减半 —— 暗场景里快速动效会显得吵
 *
 * 无障碍：三档墨色对 --paper(#171412) 的对比度见 THEME_REGISTRY.md（dark 主题需 ≥4.5:1）。
 * ==========================================================================*/
(function () {
    'use strict';

    window.LP_THEMES = window.LP_THEMES || {};

    window.LP_THEMES['night-archive'] = {
        label: '暗夜档案 · 暗画廊',
        description: '近黑暖墨底、浅墨字、烛光铜色强调；玫瑰退场，第一屏变为纯字排版展签。',

        surface: {
            paper: '#171412',
            paper2: '#100e0d',
            paper3: '#1c1815',
            panel: '#1e1a17',
            panelAlt: '#26211d'
        },

        /* 浅字压深底。对 --panel(#1e1a17) 实测（面板才是文本实际所处的面）：
         *   ink 13.8:1 / soft 7.8:1 / faint 5.1:1 / accent 5.1:1  —— 全部 ≥ AA 4.5:1
         * accent 同时用作 kicker 文字色，因此它必须自己也过 AA，不能只做装饰色。 */
        ink: {
            ink: '#ece5db',
            soft: '#b8ada1',
            faint: '#948a7d',
            muted: '#6f665d',
            /* 落在背景画布上的小字。暗底本来就有余量，直接复用 faint 即可（4.9:1）。 */
            canvas: '#948a7d'
        },

        accent: {
            main: '#c27a5e',
            deep: '#9c6a4e',
            onAccent: '#171412',
            soft: 'rgba(194, 122, 94, 0.16)'
        },

        lines: {
            hairline: 'rgba(236, 229, 219, 0.10)',
            strong: 'rgba(236, 229, 219, 0.26)',
            inkLine: 'rgba(236, 229, 219, 0.14)'
        },

        fx: {
            shadowCard: '0 12px 34px rgba(0, 0, 0, 0.45)',
            shadowThumb: '0 3px 12px rgba(0, 0, 0, 0.6)',
            shadowPanel: '0 0 0 1px rgba(236, 229, 219, 0.06), 0 24px 70px rgba(0, 0, 0, 0.55)',
            vignette: 'rgba(0, 0, 0, 0.30)',
            shimmer: 'rgba(236, 229, 219, 0.22)',
            scrim: 'rgba(0, 0, 0, 0.82)',
            grainOpacity: '0.09'
        },

        container: {
            background: '#1e1a17',
            border: '1px solid rgba(236, 229, 219, 0.09)',
            radius: '6px',
            shadow: '0 0 0 1px rgba(236, 229, 219, 0.06), 0 24px 70px rgba(0, 0, 0, 0.55)',
            padding: '28px 22px',
            /* 暗色主题下面板更重，让「档案 / 来信 / 惊喜 / 落幕」直接落在深底上更透气 */
            dissolveSteps: '6,7,8,celebration'
        },

        type: {
            display: "'Noto Serif SC', 'Songti SC', 'STSong', 'Source Han Serif SC', 'SimSun', Georgia, serif",
            body: "'Noto Serif SC', 'Songti SC', 'STSong', 'Source Han Serif SC', 'SimSun', Georgia, serif",
            ui: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
            mono: "'SF Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace",
            outlier: "Georgia, 'Times New Roman', serif",
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
            weight: { display: '400', heading: '500', body: '400' },
            tracking: { display: '0.08em', label: '0.26em', folio: '0.16em' }
        },

        /* 暗场景放慢：花瓣更少、下落更久、转场更缓 */
        motion: {
            easeOut: 'cubic-bezier(0.25, 0.5, 0.3, 1)',
            durFast: '260ms',
            durMed: '700ms',
            durSlow: '1100ms',
            gradientSpeed: 420,
            gradientAmp: 96,
            petalCount: 5,
            petalFallDuration: [18, 30],
            burstCount: 16,
            introFadeMs: 1900
        },

        /* 玫瑰退场 —— intro.js 已有「主题未提供主视觉则隐藏玫瑰舞台」的分支 */
        hero: {
            rose: '',
            title: '夜里也有光',
            subtitle: 'An archive kept in the dark.',
            enterBtn: '翻　开'
        },

        mesh: ['#100e0d', '#171412', '#241d18', '#0c0a09'],
        petal: ['#8f6a58', '#5e453c'],

        /* 深色纸：信纸/便签不再是发光的白色，而是深灰暖纸 */
        paper: {
            sheet: 'linear-gradient(180deg, #241f1b, #1a1614)',
            flap: 'linear-gradient(180deg, #2b2521, #221d19)',
            tape: 'rgba(120, 96, 74, 0.42)',
            wash: 'rgba(236, 229, 219, 0.05)',
            wash2: 'rgba(236, 229, 219, 0.03)',
            washHi: 'rgba(236, 229, 219, 0.10)',
            seal: '#a1604a',
            accentLine: 'rgba(194, 122, 94, 0.34)'
        }
    };
})();
