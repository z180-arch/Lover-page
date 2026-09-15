/* ============================================================================
 * LPText —— 文案与转义工具
 * ----------------------------------------------------------------------------
 * 为什么值得单独成文件（而不是留在 script.js 里）：
 *
 *   esc() 是**全站唯一的安全边界**。config 里的字符串会被拼进 innerHTML，
 *   而 config 可以经 ?conf= 从 URL 进入 —— 少转义一处就是一个注入面。
 *   把它放在单独文件里，审计时只需要看这一个函数，不会被 1000 行的渲染代码淹没。
 *
 *   历史教训：renderPhoto() 曾经是这个函数唯一的漏网之处（photos[].src / .date /
 *   .alt 未转义），实测可经 `?conf=` 注入 `<img src=x onerror=...>`。
 *
 * 兼容层：这些函数同时挂到 window，方便旧式内联写法与诊断脚本使用。
 * ==========================================================================*/
(function () {
    'use strict';

    /**
     * 把任意值安全地放进 HTML 文本/属性位置。
     * 覆盖五个字符：& < > " ' —— 属性用双引号或单引号都安全。
     */
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * 文案池守卫：只保留非空字符串。
     * 池为空时返回空数组，由章节跳过规则处理 —— 绝不渲染字面量 "undefined"。
     */
    function textPool(list) {
        return Array.isArray(list)
            ? list.filter((v) => typeof v === 'string' && v.trim() !== '')
            : [];
    }

    /**
     * 从数组里随机取一个下标，且**尽量不与上次相同**（避免「换一个」换出同一个）。
     * 这是纯函数：随机源是 Math.random，所以单测只能断言不变量（范围、不等性、
     * 边界），不能断言具体值。
     * 返回 -1 表示空数组（调用方负责处理，不要渲染）。
     */
    function pickRandom(arr, lastIdx) {
        if (!arr || !arr.length) return -1;
        if (arr.length === 1) return 0;
        let i;
        do { i = Math.floor(Math.random() * arr.length); } while (i === lastIdx);
        return i;
    }

    window.LPText = { esc: esc, textPool: textPool, pickRandom: pickRandom };
})();
