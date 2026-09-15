/**
 * Lover-page Shareable Config System
 * ------------------------------------------------------------------
 * 分享链接只承载「与默认值不同的部分」（diff）。但 ?conf= 是**唯一**从外部不可信
 * 输入进入运行时的入口，所以它的校验必须是严格的，而不是「看起来差不多」。
 *
 * 权威契约见 docs/architecture/CONFIG_CONTRACT.md。本文件是它的**唯一执行者**。
 *
 * ## 管线（注意顺序 —— 这里曾经是错的）
 *
 *   默认值  +  diff  →  校验 diff（对照 schema）  →  安全深合并  →  最终配置
 *
 * 早期实现是「先深合并、再 sanitize 合并结果」。那个顺序有两个后果：
 *   1. 未知字段 / 类型错误的值会先被合并进来，sanitize 只是"事后不删"
 *      （因为旧 sanitize 只看值的类型，从不检查 key 是否在 schema 里）；
 *   2. 非法值被丢弃后，**默认值也一起丢了** —— 例如 quiz.answer 收到字符串，
 *      结果是 answer 消失，而不是回退到默认的正确答案。
 * 改成「先校验 diff」之后，非法部分根本不会进入合并，默认值天然保留。
 *
 * ## 拒绝什么
 *   - 危险键：__proto__ / constructor / prototype（任何层级），并阻断原型污染
 *   - schema 里不存在的字段（除非该位置在默认值里是**空容器**，见下）
 *   - 与 schema 类型不符的值（字符串字段收到数字、数字字段收到布尔、数组收到对象…）
 *   - 超出上限的字符串 / 数组 / 嵌套深度 / key 数量 / 编码载荷长度
 *
 * ## 唯一例外：开放槽位
 * 默认值是**空容器**（`{}` 或 `[]`）的位置，代表「形状由用户决定」，例如
 * `theme.components`（预留）与空的故事数组。这些位置允许未知形状，但只记录
 * 诊断（code: `outside-contract`），仍然执行全部安全规则。
 *
 * 形状优先取自默认值本身（对象取同名字段、数组取第一项）；默认值未展示但渲染层
 * 确实支持的字段，由 EXTRA_SHAPES 显式声明 —— 否则用户无法通过分享链接设置它们。
 */

(function () {
    'use strict';

    const DEFAULTS = window.DEFAULT_CONFIG;
    if (!DEFAULTS) {
        console.warn('[config] DEFAULT_CONFIG 缺失，跳过分享配置系统');
        return;
    }

    /* ---------- 硬上限（与 CONFIG_CONTRACT.md 必须一致） ---------- */
    const LIMITS = {
        str: 4000,        // 单个字符串
        array: 500,       // 单个数组元素数
        depth: 8,         // 嵌套深度
        keys: 300,        // 单个对象的 key 数
        encoded: 24000    // ?conf= 参数的最大长度（超长直接拒绝，不解码）
    };
    /* 超过此长度仍可用，但会在控制台提示（多数聊天软件约 2–8KB 后开始截断） */
    const URL_SOFT_LIMIT = 8000;

    /* 任何时候都不允许出现的键。JSON.parse 会把 __proto__ 建成**自有属性**，
     * 所以它真的能走到合并逻辑里 —— 这不是理论风险，是实测可复现的。 */
    const DANGEROUS = { '__proto__': 1, 'constructor': 1, 'prototype': 1 };

    /* 「默认值没展示、但渲染层确实支持」的字段声明。键 = 该位置在 config 里的路径
     * （根路径写作空串 ''）。同一个键按 base 的类型担任两种角色：
     *
     *   base 是数组 → 本条目描述**数组项**的形状
     *   base 是对象 → 本条目描述该对象的**补充字段**
     *
     * 为什么需要它：schema 的形状来自 DEFAULT_CONFIG 的默认值，但默认值是**范例** ——
     * 它只展示常用字段。而渲染层其实支持更多字段（例如展签读 photos[].date / place、
     * script.js:104 读 home.enTitle）。如果这些字段不出现在任何默认值里，严格校验会
     * 把它们当未知字段拒绝，用户就永远无法通过分享链接设置它们。
     *
     * 这不是理论推演 —— 加固之后实测发现 4 个字段被误伤（home.enTitle /
     * meter.thresholds / ending.shareCopiedText / 顶层 legacy letters），本表就是修复。
     *
     * 优先级：DEFAULT_CONFIG 里声明的字段 > 本表。改默认值不需要动这里；
     * 这里只负责「默认值没展示但确实支持」的部分。
     *
     * 新增字段时的判断顺序：
     *   1. 它出现在默认值里吗？是 → 本表无需改动
     *   2. 渲染层读它吗？（grep 一次 `config.` 访问点）读 → 必须加到这里
     *   3. 只是「预留」没有任何读取方 → **不要加**。schema 里的每个字段都要能回答
     *      「用户为什么要改、renderer 为什么要知道」。
     * 两种情况都要同步 docs/architecture/CONFIG_CONTRACT.md。 */
    const EXTRA_SHAPES = {
        /* —— 数组项形状 —— */
        photos: {
            title: '', description: '', date: '', place: '', location: '', thumb: ''
        },
        'story.timeline': { date: '', title: '', text: '', photo: '' },
        'story.promises': { date: '', text: '' },
        'story.memories': { date: '', text: '', photo: '' },
        /* 顶层 legacy 别名（script.js:224/622/675 的 `config.letters` 回退路径） */
        letters: { date: '', title: '', content: '', image: '', audio: '' },

        /* —— 对象补充字段 —— */
        home: { enTitle: '' },                       // script.js:104 —— 首页英文手写标题
        meter: { thresholds: { normal: 0, high: 0, extreme: 0 } },  // script.js:329
        ending: { shareCopiedText: '' },              // script.js:934 —— 复制成功后的按钮文案
        '': { letters: [] }                          // 顶层 legacy 别名的入口
    };

    /** 取某个数组的「项形状」：默认值里的第一项为准，EXTRA_SHAPES 补充缺的字段 */
    function shapeFor(path, base) {
        const declared = EXTRA_SHAPES[path];
        const own = Array.isArray(base) && base.length ? base[0] : undefined;
        if (own !== undefined && declared) return Object.assign({}, declared, own);
        return own !== undefined ? own : declared;
    }

    const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
    const clone = (v) => JSON.parse(JSON.stringify(v));
    const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

    /* 用 defineProperty 赋值：既不会触发 setter，也不会因为 key 是 __proto__ 而改原型 */
    function define(obj, k, v) {
        Object.defineProperty(obj, k, {
            value: v, writable: true, enumerable: true, configurable: true
        });
    }

    function typeOf(v) {
        if (v === null) return 'null';
        if (Array.isArray(v)) return 'array';
        return typeof v; // string | number | boolean | object | undefined | function
    }

    function brief(v) {
        let s;
        try { s = typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v); }
        catch (e) { s = String(v); }
        if (s === undefined) s = String(v);
        return s.length > 48 ? s.slice(0, 45) + '…' : s;
    }

    function warn(entry) {
        if (window.LPDiagnostics) window.LPDiagnostics.add('config', entry);
        else console.warn('[config] ' + entry.code + ' @' + entry.path + ' received ' + entry.received);
    }

    function pathJoin(base, key) { return base ? base + '.' + key : key; }

    /* ---------- UTF-8 安全的 base64 ---------- */
    function encodeUtf8(str) {
        const json = JSON.stringify(str);
        return btoa(String.fromCharCode.apply(null,
            new TextEncoder().encode(json)));
    }
    function decodeUtf8(b64) {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    }

    /* ==========================================================================
     * diff：只保留与默认值不同的部分
     * ========================================================================*/
    function diffAgainstDefaults(value, base, depth) {
        if (depth > LIMITS.depth) return undefined;
        if (Array.isArray(value)) {
            const same = Array.isArray(base) &&
                value.length === base.length &&
                JSON.stringify(value) === JSON.stringify(base);
            return same ? undefined : value;
        }
        if (isPlainObject(value)) {
            const out = {};
            const b = isPlainObject(base) ? base : {};
            Object.keys(value).forEach((k) => {
                if (DANGEROUS[k]) return;
                const d = diffAgainstDefaults(value[k], b[k], depth + 1);
                if (d !== undefined) define(out, k, d);
            });
            return Object.keys(out).length ? out : undefined;
        }
        return value === base ? undefined : value;
    }

    /* ==========================================================================
     * 校验：对照 schema 走一遍 diff，只返回合法部分
     *
     * 返回值语义：undefined = 该位置整体丢弃（父级会保留默认值）
     * ========================================================================*/
    function validate(value, base, path, depth) {
        if (depth > LIMITS.depth) {
            warn({ path, code: 'depth-exceeded', expected: '≤' + LIMITS.depth, received: '更深' });
            return undefined;
        }

        /* —— 没有 schema：开放槽位 —— */
        if (base === undefined) return validateOpen(value, path, depth);

        /* —— 数组 —— */
        if (Array.isArray(base)) {
            if (!Array.isArray(value)) {
                warn({ path, code: 'type-mismatch', expected: 'array', received: brief(value) });
                return undefined;
            }
            let itemBase = shapeFor(path, base);

            const out = [];
            const n = Math.min(value.length, LIMITS.array);
            for (let i = 0; i < n; i++) {
                const r = validate(value[i], itemBase, path + '[' + i + ']', depth + 1);
                if (r !== undefined) out.push(r);
            }
            if (value.length > LIMITS.array) {
                warn({ path, code: 'array-too-long', expected: '≤' + LIMITS.array, received: value.length, fallback: '截断' });
            }
            return out;
        }

        /* —— 对象 —— */
        if (isPlainObject(base)) {
            if (!isPlainObject(value)) {
                warn({ path, code: 'type-mismatch', expected: 'object', received: brief(value) });
                return undefined;
            }
            const out = {};
            const baseIsOpen = Object.keys(base).length === 0;
            /* 默认值没展示、但确实支持的补充字段（见 EXTRA_SHAPES 顶部注释） */
            const extra = EXTRA_SHAPES[path];
            let keys = Object.keys(value);
            if (keys.length > LIMITS.keys) {
                warn({ path, code: 'too-many-keys', expected: '≤' + LIMITS.keys, received: keys.length, fallback: '截断' });
                keys = keys.slice(0, LIMITS.keys);
            }
            keys.forEach((k) => {
                if (DANGEROUS[k]) {
                    warn({ path: pathJoin(path, k), code: 'dangerous-key', expected: '普通字段名', received: k, fallback: '丢弃' });
                    return;
                }
                const childPath = pathJoin(path, k);
                const v = value[k];

                const inBase = hasOwn(base, k);
                const inExtra = !!extra && hasOwn(extra, k);
                if (!baseIsOpen && !inBase && !inExtra) {
                    warn({ path: childPath, code: 'unknown-field', expected: 'schema 中不存在的字段', received: brief(v), fallback: '丢弃' });
                    return;
                }
                const r = baseIsOpen
                    ? validateOpen(v, childPath, depth + 1)
                    : validate(v, inBase ? base[k] : extra[k], childPath, depth + 1);
                if (r !== undefined) define(out, k, r);
            });
            return out;
        }

        /* —— 字符串 —— */
        if (typeof base === 'string') {
            if (typeof value !== 'string') {
                warn({ path, code: 'type-mismatch', expected: 'string', received: brief(value), fallback: brief(base) });
                return undefined;
            }
            if (value.length > LIMITS.str) {
                warn({ path, code: 'string-too-long', expected: '≤' + LIMITS.str, received: value.length, fallback: '截断' });
                return value.slice(0, LIMITS.str);
            }
            return value;   // 空串是合法值，必须保留（否则无法清空一个字段）
        }

        /* —— 数字 —— */
        if (typeof base === 'number') {
            if (typeof value !== 'number' || !Number.isFinite(value)) {
                warn({ path, code: 'type-mismatch', expected: 'finite number', received: brief(value), fallback: base });
                return undefined;
            }
            return value;
        }

        /* —— 布尔 —— */
        if (typeof base === 'boolean') {
            if (typeof value !== 'boolean') {
                warn({ path, code: 'type-mismatch', expected: 'boolean', received: brief(value), fallback: base });
                return undefined;
            }
            return value;
        }

        /* 默认值是 null / undefined：接受任意安全值 */
        return validateOpen(value, path, depth);
    }

    /* 没有 schema 的位置：仍然执行全部安全规则，但不做 key 白名单 */
    function validateOpen(value, path, depth) {
        if (depth > LIMITS.depth) {
            warn({ path, code: 'depth-exceeded', expected: '≤' + LIMITS.depth, received: '更深' });
            return undefined;
        }
        const t = typeOf(value);

        if (t === 'string') {
            if (value.length > LIMITS.str) {
                warn({ path, code: 'string-too-long', expected: '≤' + LIMITS.str, received: value.length, fallback: '截断' });
                return value.slice(0, LIMITS.str);
            }
            return value;
        }
        if (t === 'number') {
            if (!Number.isFinite(value)) {
                warn({ path, code: 'non-finite-number', expected: 'finite number', received: brief(value), fallback: '丢弃' });
                return undefined;
            }
            return value;
        }
        if (t === 'boolean') return value;
        if (t === 'null') {
            /* 显式的 null 不进入配置：它会让 renderer 拿到 undefined 之外的第三种空值，
             * 而「空」在本项目里的表达方式是空串 / 空数组。 */
            warn({ path, code: 'null-value', expected: 'string|number|boolean|array|object', received: 'null', fallback: '丢弃' });
            return undefined;
        }
        if (t === 'array') {
            const out = [];
            const n = Math.min(value.length, LIMITS.array);
            for (let i = 0; i < n; i++) {
                const r = validateOpen(value[i], path + '[' + i + ']', depth + 1);
                if (r !== undefined) out.push(r);
            }
            if (value.length > LIMITS.array) {
                warn({ path, code: 'array-too-long', expected: '≤' + LIMITS.array, received: value.length, fallback: '截断' });
            }
            return out;
        }
        if (t === 'object') {
            const out = {};
            let keys = Object.keys(value);
            let truncated = false;
            if (keys.length > LIMITS.keys) {
                keys = keys.slice(0, LIMITS.keys);
                truncated = true;
            }
            keys.forEach((k) => {
                if (DANGEROUS[k]) {
                    warn({ path: pathJoin(path, k), code: 'dangerous-key', expected: '普通字段名', received: k, fallback: '丢弃' });
                    return;
                }
                const r = validateOpen(value[k], pathJoin(path, k), depth + 1);
                if (r !== undefined) define(out, k, r);
            });
            if (truncated) {
                warn({ path, code: 'too-many-keys', expected: '≤' + LIMITS.keys, received: Object.keys(value).length, fallback: '截断' });
            }
            /* 开放槽位：这里记一条「用了契约外的形状」。
             * 只在值是**对象**时触发 —— 标量进开放槽位是完全正常的用法
             * （theme.components 将来就是一堆 "photoStyle": "holo" 这样的标量），
             * 给每个标量都记一条会把诊断刷成噪音。详见 tools/qa/probe-contract.js 的实测。 */
            warn({ path, code: 'outside-contract', expected: 'schema 中声明的字段', received: Object.keys(out).join(',') || '(空)', fallback: '保留（该位置默认为空容器）' });
            return out;
        }
        warn({ path, code: 'unsupported-type', expected: 'JSON 可表达的类型', received: t, fallback: '丢弃' });
        return undefined;
    }

    /* ==========================================================================
     * 安全深合并（数组整体替换，不做逐项合并）
     *   与旧实现的差别：跳过危险键、只在自有属性上递归、有深度守卫（防止栈溢出）
     * ========================================================================*/
    function mergeSafe(target, source, path, depth) {
        if (depth > LIMITS.depth) return target;
        if (!isPlainObject(source)) return target;
        Object.keys(source).forEach((k) => {
            if (DANGEROUS[k]) return;
            const sv = source[k];
            if (sv === undefined) return;
            if (isPlainObject(sv) && hasOwn(target, k) && isPlainObject(target[k])) {
                mergeSafe(target[k], sv, pathJoin(path, k), depth + 1);
            } else {
                define(target, k, (isPlainObject(sv) || Array.isArray(sv)) ? clone(sv) : sv);
            }
        });
        return target;
    }

    /* ---------- 对外 API ---------- */
    function buildShareConfig(current) {
        const d = diffAgainstDefaults(current, DEFAULTS, 0);
        return d || {};
    }

    function decodeConfig(b64) {
        if (typeof b64 !== 'string' || !b64) return null;
        /* 先看长度再解码：atob 一个几 MB 的字符串是纯浪费，而且没有任何合法用途 */
        if (b64.length > LIMITS.encoded) {
            warn({ path: '?conf', code: 'payload-too-long', expected: '≤' + LIMITS.encoded + ' 字符', received: b64.length, fallback: '忽略整个链接，使用 config.js' });
            return null;
        }
        try {
            const parsed = decodeUtf8(b64);
            return isPlainObject(parsed) ? parsed : null;
        } catch (e) {
            console.error('[config] 解码失败（链接可能被截断）：', e);
            return null;
        }
    }

    /** 校验 diff → 安全深合并到默认值。任何异常都退回默认值，绝不返回残缺配置。 */
    function resolveConfig(diff) {
        try {
            const clean = validate(diff, DEFAULTS, '', 0) || {};
            return mergeSafe(clone(DEFAULTS), clean, '', 0);
        } catch (e) {
            console.error('[config] 校验失败，回退默认配置：', e);
            return clone(DEFAULTS);
        }
    }

    /* ---------- 启动：URL 带 conf 参数则以它为准 ---------- */
    let loadFailed = false;
    let loadNote = 'default';
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const encoded = urlParams.get('conf');
        if (encoded) {
            const decoded = decodeConfig(encoded);
            if (decoded) {
                window.VALENTINE_CONFIG = resolveConfig(decoded);
                document.documentElement.dataset.configSource = 'url';
                loadNote = 'url';
                console.log('[config] 已从分享链接载入配置');
            } else {
                loadFailed = true;
                loadNote = 'url-invalid';
                warn({ path: '?conf', code: 'payload-rejected', expected: '合法 base64 + 合法 JSON 对象', received: '无法解析', fallback: '使用 config.js 的默认配置' });
            }
        }
    } catch (e) {
        console.error('[config] 读取分享参数失败：', e);
        loadFailed = true;
        loadNote = 'url-error';
    }
    window.__configLoadFailed = loadFailed;
    window.__configSource = loadNote;

    window.ValentineConfig = {
        LIMITS: LIMITS,
        /** 分享链接：只含与默认值的差异 */
        generateShareLink: function () {
            const diff = buildShareConfig(window.VALENTINE_CONFIG);
            const url = new URL(window.location.href);
            /* diff 为空 = 收件人打开同一个站点看到的就是同样内容，URL 里不需要塞任何东西。
             * 早先会塞一个 conf=e30=（base64 的 `{}`）：无害，但让链接看起来像带参数，
             * 而且收件人会白跑一遍解码 + 校验。 */
            if (!Object.keys(diff).length) {
                url.searchParams.delete('conf');
                return url.toString();
            }
            let encoded;
            try {
                encoded = encodeUtf8(diff);
            } catch (e) {
                console.error('[config] 编码失败：', e);
                url.searchParams.delete('conf');
                return url.toString();
            }
            url.searchParams.set('conf', encoded);
            const link = url.toString();
            if (link.length > URL_SOFT_LIMIT) {
                console.warn('[config] 分享链接较长（' + link.length +
                    ' 字符），部分聊天软件可能截断。建议把长文案放在 config.js 里随站点一起部署，而不是走 URL。');
            }
            return link;
        },
        copyShareLink: function () {
            const link = this.generateShareLink();
            if (!navigator.clipboard || !navigator.clipboard.writeText) {
                return Promise.resolve(false);
            }
            return navigator.clipboard.writeText(link)
                .then(() => true)
                .catch((err) => {
                    console.error('[config] 复制失败：', err);
                    return false;
                });
        },
        /* 调试用：查看当前 diff 与体积 */
        debugSharePayload: function () {
            const d = buildShareConfig(window.VALENTINE_CONFIG);
            const json = JSON.stringify(d);
            return { diff: d, jsonBytes: json.length, keys: Object.keys(d) };
        },
        /* 调试/测试用：给定 conf 参数还原完整配置（与首屏加载走完全同一条路径） */
        resolveFromEncoded: function (encoded) {
            const d = decodeConfig(encoded);
            return d ? resolveConfig(d) : null;
        },
        /**
         * 编辑器/测试用：只校验一个 payload，返回被拒绝或修正的字段清单。
         * 不产生副作用，不改动当前运行时配置。
         */
        auditPayload: function (encoded) {
            const before = window.LPDiagnostics ? window.LPDiagnostics.list('config').length : 0;
            const d = decodeConfig(encoded);
            const result = d ? resolveConfig(d) : null;
            const entries = window.LPDiagnostics ? window.LPDiagnostics.list('config').slice(before) : [];
            return { ok: !!result, config: result, warnings: entries };
        }
    };
})();
