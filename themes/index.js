/* ============================================================================
 * Theme registry
 * ----------------------------------------------------------------------------
 * 职责单一：主题的**注册表**与**解析**。不做 DOM 写入（那是 theme.js 的活）。
 *
 * 解析优先级（高 → 低）：
 *   1. URL ?theme=<name>            —— 便于对比测试与临时预览，不入库
 *   2. config.metadata.template     —— 实例自己声明的主题（正式来源）
 *   3. 'warm-paper'                 —— 兜底，保证永远有主题可用
 *
 * 任何一处失败（名字打错、文件没加载）都退回 warm-paper 并在控制台报错，
 * 绝不让页面因为主题问题变成无样式状态。
 * ==========================================================================*/
(function () {
    'use strict';

    var FALLBACK = 'warm-paper';

    function registry() {
        return window.LP_THEMES || {};
    }

    function list() {
        return Object.keys(registry());
    }

    function has(name) {
        return !!name && Object.prototype.hasOwnProperty.call(registry(), name);
    }

    function get(name) {
        return has(name) ? registry()[name] : null;
    }

    /* 只读当前请求的主题名（不做解析，供 renderer 查询） */
    function requestedName() {
        var fromUrl = null;
        try {
            fromUrl = new URLSearchParams(window.location.search).get('theme');
        } catch (e) { /* 老浏览器：忽略 */ }
        var cfg = window.VALENTINE_CONFIG || {};
        var fromConfig = cfg.metadata && cfg.metadata.template;
        return fromUrl || fromConfig || FALLBACK;
    }

    /** 解析并返回 { name, theme }。永远返回可用对象。 */
    function resolve() {
        var name = requestedName();
        if (has(name)) return { name: name, theme: registry()[name] };

        console.error('[theme] 未找到主题 "' + name + '"，已退回 ' + FALLBACK +
            '。可用主题：' + list().join(', '));
        return { name: FALLBACK, theme: registry()[FALLBACK] };
    }

    /* 备份：给上游「实例级覆盖」用 —— config.theme 里的值优先级高于 preset */
    function clone(v) { return JSON.parse(JSON.stringify(v)); }

    window.LPThemeRegistry = {
        FALLBACK: FALLBACK,
        list: list,
        has: has,
        get: get,
        resolve: resolve,
        requestedName: requestedName,
        clone: clone
    };
})();
