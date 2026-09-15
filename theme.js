/* ============================================================================
 * theme.js — Theme Token Applier
 * ----------------------------------------------------------------------------
 * 职责：把「解析后的主题」写成 CSS 自定义属性（令牌）。styles.css 只消费令牌，
 *       不出现明确色值（唯一例外见 styles.css 顶部说明）。
 *
 * 三层合并（低 → 高）：
 *   1. theme preset（themes/*.js）        —— 完整视觉语言
 *   2. config.theme（实例级覆盖）          —— 只覆盖它显式提供的字段
 *   3. config.colors / config.animations（母版遗留键）—— 仅当显式改动时才覆盖，
 *      并打印一条弃用提示。这条兼容层保证 v1 的 config 仍然可用。
 *
 * 为什么要有 3：v1 的 config 用 `colors.backgroundStart` 等键；V2 引入
 * `theme.*` 后两套并存，但 `config.theme.colors` **从来没有驱动过** styles.css
 * 真正的令牌（--paper/--ink/--accent）—— 所以「换主题」实际上只换了 mesh 背景，
 * 深色主题不可能成立。令牌层修的就是这个（ADR-003）。
 * ==========================================================================*/
(function () {
    'use strict';

    var LEGACY_NOTICE = '[theme] config.colors 是 v1 遗留键，已映射到主题令牌。' +
        '建议改用 config.theme / metadata.template（见 docs/design/THEME_REGISTRY.md）';

    var warned = false;
    function warnLegacy() {
        if (warned) return;
        warned = true;
        console.warn(LEGACY_NOTICE);
    }

    var isPlainObject = function (v) { return !!v && typeof v === 'object' && !Array.isArray(v); };

    /** 基准主题：config.js 出厂值就是 warm-paper 的一份实例。
     *  任何「仍等于基准值」的实例配置都**不是有意覆盖** —— 否则换主题时会被
     *  出厂 config 反向拽回暖色（这是一个真实踩过的坑，见 ADR-003 复盘）。 */
    function baseTheme() {
        return (window.LP_THEMES || {})['warm-paper'] || {};
    }

    /**
     * 只把「与基准不同」的值写进 target。数组整体比对。
     * @param {object} target 令牌目标
     * @param {object} src    实例配置（如 config.theme）
     * @param {object} base   基准（warm-paper preset）
     */
    function overrideIfChanged(target, src, base) {
        Object.keys(src || {}).forEach(function (k) {
            var sv = src[k];
            if (sv === undefined || sv === null || sv === '') return;
            if (isPlainObject(sv)) {
                if (!isPlainObject(target[k])) target[k] = {};
                overrideIfChanged(target[k], sv, isPlainObject(base) ? base[k] : {});
                return;
            }
            var bv = isPlainObject(base) ? base[k] : undefined;
            if (Array.isArray(sv)) {
                if (Array.isArray(bv) && JSON.stringify(bv) === JSON.stringify(sv)) return;
                target[k] = sv.slice();
                return;
            }
            if (bv === sv) return;   /* 与基准一致 → 不是有意覆盖 */
            target[k] = sv;
        });
        return target;
    }

    /* config.colors / config.animations 的 v1 出厂值 —— 只有改过才生效 */
    var LEGACY_DEFAULTS = {
        backgroundStart: '#f7ece2',
        backgroundEnd: '#f3d5cb',
        buttonBackground: '#a8544f',
        buttonHover: '#8f403c',
        textColor: '#4a3a33'
    };
    var LEGACY_TO_TOKEN = {
        backgroundStart: ['surface', 'paper2'],
        backgroundEnd: ['surface', 'paper3'],
        buttonBackground: ['accent', 'main'],
        buttonHover: ['accent', 'deep'],
        textColor: ['ink', 'ink']
    };

    var ANIM_DEFAULTS = { floatDuration: '15s', floatDistance: '50px', bounceSpeed: '0.5s', heartExplosionSize: 1.5 };

    /** 解析主题：preset → config.theme（实例覆盖） → 母版遗留键 */
    function build() {
        var cfg = window.VALENTINE_CONFIG || {};
        var resolved = window.LPThemeRegistry
            ? window.LPThemeRegistry.resolve()
            : { name: 'warm-paper', theme: (window.LP_THEMES || {})['warm-paper'] };

        var tokens = window.LPThemeRegistry
            ? window.LPThemeRegistry.clone(resolved.theme)
            : resolved.theme;

        var t = cfg.theme || {};
        var base = baseTheme();

        /* 2. 实例级覆盖 —— 仅当与 warm-paper 出厂值不同 */
        overrideIfChanged(tokens, t, base);
        if (t.components) tokens.components = t.components;

        /* 3. 母版遗留键 —— 同样只在用户显式改过时生效 */
        var legacyColors = cfg.colors || {};
        Object.keys(LEGACY_TO_TOKEN).forEach(function (key) {
            var v = legacyColors[key];
            if (!v || v === LEGACY_DEFAULTS[key]) return;
            var path = LEGACY_TO_TOKEN[key];
            tokens[path[0]][path[1]] = v;
            warnLegacy();
        });
        var anim = cfg.animations || {};
        Object.keys(ANIM_DEFAULTS).forEach(function (k) {
            if (anim[k] !== undefined && anim[k] !== ANIM_DEFAULTS[k]) {
                tokens.motion[k] = anim[k];
                warnLegacy();
            }
        });

        if (!tokens.accent.onAccent) tokens.accent.onAccent = tokens.surface.paper;

        return { name: resolved.name, tokens: tokens };
    }

    function setVar(root, name, value) {
        if (value === undefined || value === null) return;
        root.style.setProperty(name, String(value));
    }

    /** 把令牌写到 :root */
    function apply(tokens) {
        var root = document.documentElement;
        var s = tokens.surface, i = tokens.ink, a = tokens.accent;
        var l = tokens.lines, f = tokens.fx, c = tokens.container;
        var ty = tokens.type, m = tokens.motion;

        /* surfaces */
        setVar(root, '--paper', s.paper);
        setVar(root, '--paper-2', s.paper2);
        setVar(root, '--paper-3', s.paper3);
        setVar(root, '--panel', s.panel);
        setVar(root, '--panel-alt', s.panelAlt);

        /* ink */
        setVar(root, '--ink', i.ink);
        setVar(root, '--ink-soft', i.soft);
        setVar(root, '--ink-faint', i.faint);
        setVar(root, '--ink-muted', i.muted);
        setVar(root, '--ink-canvas', i.canvas);

        /* accent */
        setVar(root, '--accent', a.main);
        setVar(root, '--accent-deep', a.deep);
        setVar(root, '--accent-ink', a.onAccent);
        setVar(root, '--accent-soft', a.soft);

        /* lines */
        setVar(root, '--hairline', l.hairline);
        setVar(root, '--hairline-strong', l.strong);
        setVar(root, '--ink-line', l.inkLine);

        /* fx */
        setVar(root, '--shadow-card', f.shadowCard);
        setVar(root, '--shadow-thumb', f.shadowThumb);
        setVar(root, '--shadow-panel', f.shadowPanel);
        setVar(root, '--vignette', f.vignette);
        setVar(root, '--shimmer', f.shimmer);
        setVar(root, '--scrim', f.scrim);
        setVar(root, '--grain-opacity', f.grainOpacity);

        /* container（章节外框形态 —— 主题差异最直观处） */
        setVar(root, '--panel-bg', c.background);
        setVar(root, '--panel-border', c.border);
        setVar(root, '--panel-radius', c.radius);
        setVar(root, '--panel-shadow', c.shadow);
        setVar(root, '--panel-pad', c.padding);

        /* type */
        setVar(root, '--font-display', ty.display);
        setVar(root, '--font-body', ty.body);
        setVar(root, '--font-ui', ty.ui);
        setVar(root, '--font-mono', ty.mono);
        setVar(root, '--font-outlier', ty.outlier);
        Object.keys(ty.scale || {}).forEach(function (k) {
            setVar(root, '--fs-' + k.replace(/[A-Z]/g, function (ch) { return '-' + ch.toLowerCase(); }), ty.scale[k]);
        });
        Object.keys(ty.weight || {}).forEach(function (k) { setVar(root, '--fw-' + k, ty.weight[k]); });
        Object.keys(ty.tracking || {}).forEach(function (k) { setVar(root, '--track-' + k, ty.tracking[k]); });

        /* motion */
        setVar(root, '--ease-out', m.easeOut);
        setVar(root, '--dur-fast', m.durFast);
        setVar(root, '--dur-med', m.durMed);
        setVar(root, '--dur-slow', m.durSlow);

        /* mesh / petal 供 canvas 与 JS 读取（也是 CSS 侧兜底） */
        setVar(root, '--mesh-1', tokens.mesh[0]);
        setVar(root, '--mesh-2', tokens.mesh[1]);
        setVar(root, '--mesh-3', tokens.mesh[2]);
        setVar(root, '--mesh-4', tokens.mesh[3]);
        setVar(root, '--petal-hi', tokens.petal[0]);
        setVar(root, '--petal-lo', tokens.petal[1]);

        /* 纸张材质 */
        var pa = tokens.paper || {};
        setVar(root, '--sheet-bg', pa.sheet);
        setVar(root, '--flap-bg', pa.flap);
        setVar(root, '--tape', pa.tape);
        setVar(root, '--wash', pa.wash);
        setVar(root, '--wash-2', pa.wash2);
        setVar(root, '--wash-hi', pa.washHi);
        setVar(root, '--seal', pa.seal);
        setVar(root, '--accent-line', pa.accentLine);

        /* 母版兼容映射 —— 保留旧变量名，任何仍引用它们的样式继续工作 */
        setVar(root, '--background-color-1', s.paper2);
        setVar(root, '--background-color-2', s.paper3);
        setVar(root, '--button-color', a.main);
        setVar(root, '--button-hover', a.deep);
        setVar(root, '--text-color', i.ink);
        setVar(root, '--float-duration', m.floatDuration || '15s');
        setVar(root, '--float-distance', m.floatDistance || '50px');
        setVar(root, '--bounce-speed', m.bounceSpeed || '0.5s');
        setVar(root, '--heart-explosion-size', m.heartExplosionSize || 1.5);

        /* 标记主题，供 CSS 做主题级差异（如 body[data-theme="night-archive"]） */
        root.setAttribute('data-theme', tokens.__name || '');
    }

    var built = null;

    function init() {
        built = build();
        built.tokens.__name = built.name;
        apply(built.tokens);
        document.documentElement.setAttribute('data-theme', built.name);
        document.body && document.body.setAttribute('data-theme', built.name);
        console.log('[theme] 已应用主题：' + built.name);
        return built;
    }

    /** 当前生效的主题（renderer / intro 读这个，不要再各自解析 config.theme） */
    function current() {
        if (!built) init();
        return built.tokens;
    }

    /** 该章节是否应该「溶掉面板卡」（内容直接落在纸底上） */
    function shouldDissolve(step) {
        if (!built) init();
        var list = (built.tokens.container && built.tokens.container.dissolveSteps) || '';
        if (!list) return false;
        return String(list).split(',').map(function (s) { return s.trim(); })
            .indexOf(String(step)) !== -1;
    }

    window.LPTheme = {
        init: init,
        current: current,
        shouldDissolve: shouldDissolve,
        name: function () { if (!built) init(); return built.name; }
    };

    /* 兼容旧调用点：母版用 applyTheme() 命名 */
    window.applyTheme = function () { return init(); };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { init(); });
    } else {
        init();
    }
})();
