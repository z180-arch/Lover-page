/**
 * Lover-page Shareable Config System
 * ------------------------------------------------------------------
 * 分享链接只承载「与默认值不同的部分」（diff），加载时深合并回默认值，再做 schema 校验。
 *
 * 为什么不用「把整个 config 塞进 URL」：
 *   1. 当前 config 序列化后约 4–5KB，base64 后约 7KB —— 聊天软件常会截断长链接；
 *   2. 全量下发会把 photos / story / theme 一起塞进去，任何一处改字段就会与旧链接不兼容；
 *   3. diff 之后通常只剩「她是谁 + 几句私人文案」，链接短、可读性风险低。
 *
 * 校验是 schema 驱动的：以 config.js 的 DEFAULT_CONFIG 为形状基准递归比对，
 * 新增字段无需改本文件（旧实现硬编码 questions/celebration，早已与 config 脱节，
 * 会把 photos/story/theme/sound/experience 全部丢掉，并因强制 https:// 丢本地 BGM）。
 */

(function () {
    'use strict';

    const DEFAULTS = window.DEFAULT_CONFIG;
    if (!DEFAULTS) {
        console.warn('[config] DEFAULT_CONFIG 缺失，跳过分享配置系统');
        return;
    }

    /* 单条字符串上限（防止链接被当成注入载体或无限膨胀） */
    const MAX_STR = 4000;
    const MAX_ARRAY = 500;
    const MAX_DEPTH = 8;
    /* 超过此长度仍可用，但会在控制台提示（多数聊天软件约 2–8KB 后开始截断） */
    const URL_SOFT_LIMIT = 8000;

    const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
    const clone = (v) => JSON.parse(JSON.stringify(v));

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

    /* ---------- diff：只保留与默认值不同的部分 ---------- */
    function diffAgainstDefaults(value, base) {
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
                const d = diffAgainstDefaults(value[k], b[k]);
                if (d !== undefined) out[k] = d;
            });
            return Object.keys(out).length ? out : undefined;
        }
        return value === base ? undefined : value;
    }

    /* ---------- 深合并（数组整体替换，不做逐项合并） ---------- */
    function deepMerge(target, source) {
        if (!isPlainObject(source)) return target;
        Object.keys(source).forEach((key) => {
            const sv = source[key];
            if (isPlainObject(sv) && isPlainObject(target[key])) {
                deepMerge(target[key], sv);
            } else if (sv !== undefined) {
                target[key] = Array.isArray(sv) ? clone(sv) : sv;
            }
        });
        return target;
    }

    /* ---------- schema 驱动校验：形状取自 DEFAULTS ---------- */
    function sanitize(value, base, depth) {
        if (depth > MAX_DEPTH) return undefined;

        if (Array.isArray(value)) {
            const itemBase = Array.isArray(base) && base.length ? base[0] : undefined;
            return value
                .slice(0, MAX_ARRAY)
                .map((item) => sanitize(item, itemBase, depth + 1))
                .filter((item) => item !== undefined);
        }
        if (isPlainObject(value)) {
            const out = {};
            const b = isPlainObject(base) ? base : {};
            Object.keys(value).forEach((k) => {
                const r = sanitize(value[k], b[k], depth + 1);
                if (r !== undefined && r !== null && r !== '') out[k] = r;
            });
            return out;
        }
        if (typeof value === 'string') {
            const s = value.slice(0, MAX_STR);
            // 默认值本身是字符串时保留空串，以维持 config 形状（renderer 会处理空值）
            if (s === '' && typeof base !== 'string') return undefined;
            return s;
        }
        if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
        if (typeof value === 'boolean') return value;
        return undefined;
    }

    /* ---------- 对外 API ---------- */
    function buildShareConfig(current) {
        const d = diffAgainstDefaults(current, DEFAULTS);
        return d || {};
    }

    function encodeConfig(current) {
        try {
            return encodeUtf8(buildShareConfig(current));
        } catch (e) {
            console.error('[config] 编码失败：', e);
            return null;
        }
    }

    function decodeConfig(b64) {
        try {
            const parsed = decodeUtf8(b64);
            return isPlainObject(parsed) ? parsed : null;
        } catch (e) {
            console.error('[config] 解码失败（链接可能被截断）：', e);
            return null;
        }
    }

    function resolveConfig(diff) {
        const merged = deepMerge(clone(DEFAULTS), diff);
        return sanitize(merged, DEFAULTS, 0) || clone(DEFAULTS);
    }

    /* ---------- 启动：URL 带 conf 参数则以它为准 ---------- */
    let loadFailed = false;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const encoded = urlParams.get('conf');
        if (encoded) {
            const decoded = decodeConfig(encoded);
            if (decoded) {
                window.VALENTINE_CONFIG = resolveConfig(decoded);
                document.documentElement.dataset.configSource = 'url';
                console.log('[config] 已从分享链接载入配置');
            } else {
                loadFailed = true;
            }
        }
    } catch (e) {
        console.error('[config] 读取分享参数失败：', e);
        loadFailed = true;
    }
    window.__configLoadFailed = loadFailed;

    window.ValentineConfig = {
        /** 分享链接：只含与默认值的差异 */
        generateShareLink: function () {
            const encoded = encodeConfig(window.VALENTINE_CONFIG);
            const url = new URL(window.location.href);
            if (!encoded) return url.toString();
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
        }
    };
})();
