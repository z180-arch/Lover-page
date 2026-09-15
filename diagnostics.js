/* ============================================================================
 * LPDiagnostics —— 运行时诊断注册表
 * ----------------------------------------------------------------------------
 * 解决的问题：配置写错时，过去的表现是「某个地方就是没显示」。Agent 与作者都
 * 只能靠猜。这个模块提供一个**统一的、可机读的**诊断通道。
 *
 * 设计约束：
 *   1. 纯静态、无依赖、可早于其它模块加载（config 校验就需要它）
 *   2. 不向用户页面输出任何开发者界面 —— 只进 console 与 window.LPDiagnostics
 *   3. 永远不抛异常。诊断本身坏掉不能连累运行时
 *   4. 有上限，防止异常输入把它变成内存泄漏
 *
 * 用法：
 *   LPDiagnostics.add('config', { path: 'photos[3].focalPoint.x',
 *                                 code: 'type-mismatch',
 *                                 expected: 'number[0..1]',
 *                                 received: '"center"',
 *                                 fallback: 0.5 });
 *   LPDiagnostics.report();     // 控制台摘要
 *
 * 区域（area）是固定集合，避免拼写漂移：
 *   config / theme / chapters / media / runtime / performance / a11y
 * ==========================================================================*/
(function () {
    'use strict';

    var AREAS = ['config', 'theme', 'chapters', 'media', 'runtime', 'performance', 'a11y'];
    /* 每个区域最多保留多少条 —— 防止被畸形输入刷爆内存 */
    var MAX_PER_AREA = 200;
    /* 每个区域最多向 console 打印多少条 —— 避免刷屏把真正的错误淹掉 */
    var MAX_LOGGED = 40;

    var store = {};
    var overflowed = {};
    AREAS.forEach(function (a) { store[a] = []; overflowed[a] = 0; });

    function areaOf(name) {
        if (AREAS.indexOf(name) !== -1) return name;
        /* 未知区域不丢弃，归到 runtime，但标记出来，便于发现拼写错误 */
        store.runtime.push({
            path: 'LPDiagnostics.area',
            code: 'unknown-area',
            expected: AREAS.join('|'),
            received: JSON.stringify(name)
        });
        return 'runtime';
    }

    function oneLine(entry) {
        if (typeof entry === 'string') return entry;
        if (!entry || typeof entry !== 'object') return String(entry);
        var parts = [];
        if (entry.path) parts.push(entry.path);
        if (entry.code) parts.push('[' + entry.code + ']');
        if (entry.expected !== undefined) parts.push('expected ' + entry.expected);
        if (entry.received !== undefined) parts.push('received ' + entry.received);
        if (entry.fallback !== undefined) parts.push('fallback ' + entry.fallback);
        if (entry.note) parts.push(entry.note);
        return parts.join('  ');
    }

    var api = {
        AREAS: AREAS,

        /** 记录一条诊断。绝不抛异常。 */
        add: function (area, entry) {
            try {
                var a = areaOf(area);
                if (store[a].length >= MAX_PER_AREA) { overflowed[a]++; return; }
                store[a].push(entry);
                var n = store[a].length + overflowed[a];
                if (n <= MAX_LOGGED) {
                    var fn = a === 'runtime' ? 'error' : 'warn';
                    console[fn]('[diag:' + a + '] ' + oneLine(entry));
                } else if (n === MAX_LOGGED + 1) {
                    console.warn('[diag:' + a + '] …后续同类信息已静默（详见 LPDiagnostics.list("' + a + '")）');
                }
            } catch (e) { /* 诊断失败不得影响运行时 */ }
        },

        /** 取某个区域的诊断数组（只读副本） */
        list: function (area) {
            if (area) return (store[area] || []).slice();
            var all = {};
            AREAS.forEach(function (a) { all[a] = store[a].slice(); });
            return all;
        },

        /** 某个区域的条目数（含被上限丢弃的） */
        count: function (area) {
            if (area) return (store[area] || []).length + (overflowed[area] || 0);
            var total = 0;
            AREAS.forEach(function (a) { total += store[a].length + overflowed[a]; });
            return total;
        },

        has: function (area) { return api.count(area) > 0; },

        clear: function (area) {
            if (area) { store[area] = []; overflowed[area] = 0; return; }
            AREAS.forEach(function (a) { store[a] = []; overflowed[a] = 0; });
        },

        /**
         * 统一的运行时摘要。只报告**能确定**的事；不确定的如实标 'n/a'。
         * 刻意不做浏览器测量（overflow / a11y 需要真实布局），需要时由调用方注入。
         */
        report: function () {
            var out = {};
            try {
                out.runtime = (window.__lpErrors && window.__lpErrors.length)
                    ? 'JS Errors: ' + window.__lpErrors.length
                    : 'JS Errors: 0';
                out.errors = (window.__lpErrors || []).slice();

                out.theme = (window.LPTheme && window.LPTheme.name) ? window.LPTheme.name() : 'n/a';

                out.config = api.count('config') === 0
                    ? 'valid'
                    : 'valid with ' + api.count('config') + ' warning(s)';
                out.configWarnings = api.list('config');

                if (typeof window.chapterEnabled === 'function' && window.VALENTINE_CONFIG) {
                    var chs = (window.VALENTINE_CONFIG.experience || {}).chapters || [];
                    var on = chs.filter(function (c) { return window.chapterEnabled(c.step); }).length;
                    out.chapters = on + '/' + chs.length;
                } else {
                    out.chapters = 'n/a';
                }

                var cfg = window.VALENTINE_CONFIG || {};
                var photos = cfg.photos || [];
                out.media = photos.length
                    ? photos.filter(function (p) { return p && p.width && p.height; }).length + '/' + photos.length + ' with dimensions'
                    : 'n/a';

                out.a11y = 'n/a (需浏览器测量)';
                out.overflow = 'n/a (需浏览器测量)';

                out.diagnostics = {};
                AREAS.forEach(function (a) {
                    if (store[a].length || overflowed[a]) {
                        out.diagnostics[a] = store[a].length + (overflowed[a] ? ' (+' + overflowed[a] + ' suppressed)' : '');
                    }
                });

                console.log(
                    'Runtime: ' + (window.__lpErrors && window.__lpErrors.length ? 'ERRORS' : 'OK') + '\n' +
                    'Theme: ' + out.theme + '\n' +
                    'Config: ' + out.config + '\n' +
                    'Chapters: ' + out.chapters + '\n' +
                    'Media: ' + out.media + '\n' +
                    'A11y: ' + out.a11y + '\n' +
                    'Overflow: ' + out.overflow + '\n' +
                    out.runtime
                );
            } catch (e) {
                console.error('[diag] report 失败：', e);
                out.failure = String(e && e.message || e);
            }
            return out;
        },

        /** 供调试脚本使用的单行摘要 */
        line: function () {
            var w = api.count('config');
            var e = (window.__lpErrors || []).length;
            return 'theme=' + ((window.LPTheme && window.LPTheme.name) ? window.LPTheme.name() : '?') +
                ' configWarnings=' + w +
                ' jsErrors=' + e;
        }
    };

    window.LPDiagnostics = api;
})();
