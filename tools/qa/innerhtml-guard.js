#!/usr/bin/env node
/* ============================================================================
 * innerhtml-guard —— 转义覆盖面的静态守卫
 * ----------------------------------------------------------------------------
 * 为什么需要它：`esc()` 是本项目**唯一**的 XSS 安全边界，而它是否被用在每一处
 * HTML 拼接上，一直靠「改代码的人记得」。本轮做过一次完整人工审计（12 处注入点、
 * 0 处未转义），但审计是一次性的 —— 没有任何机制阻止下一个人再漏一次。
 *
 * 规则（刻意简单，避免变成又一个会误报的 lint）：
 *   每一处 `innerHTML = <表达式>` 必须满足三者之一 ——
 *     1. 表达式里出现 `esc(`                     → 已转义
 *     2. 表达式是**纯字面量**（含空串、无 ${} / 无 + 拼接）→ 没有插值，天然安全
 *     3. 同一行或上一行有 `html-safe` 注释        → 作者显式声明过为什么安全
 *   否则报错并以退出码 1 结束。
 *
 * 第 3 条是这套规则的关键：它不是「白名单」，而是**强制作者陈述理由**。
 * 写 `// html-safe: xxx` 的人必须把「为什么这里的值不可能含 HTML」写清楚，
 * 下一个人读到的是一句话，而不是一片沉默。
 *
 * 运行：node tools/qa/innerhtml-guard.js
 * 退出码：0 = 通过；1 = 有未声明的注入点
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
/* 只扫「运行时可能渲染配置/用户数据的文件」。
 * vendor/ 是第三方（含自带的 innerHTML 用法），visual-prototype/ 是设计稿快照，都不扫。 */
const TARGETS = [
    'script.js', 'state.js', 'theme.js', 'config.js', 'config-system.js', 'diagnostics.js',
    'js/core/text.js', 'js/chapters/gauge.js', 'js/intro.js'
];

const OPEN = { '(': 1, '[': 1, '{': 1 };
const CLOSE = { ')': 1, ']': 1, '}': 1 };

/* 从 innerHTML 的位置往后取「整条语句」。
 * 需要正确处理字符串、模板字符串、注释与括号深度 —— 否则会在模板里提前截断。 */
function extractStatement(src, start) {
    let i = start, depth = 0, quote = null, tpl = 0;
    for (; i < src.length && i - start < 8000; i++) {
        const c = src[i], prev = src[i - 1];
        if (quote) { if (c === quote && prev !== '\\') quote = null; continue; }
        if (c === '"' || c === "'") { quote = c; continue; }
        if (c === '`') {
            if (tpl && prev !== '\\') { tpl--; continue; }
            if (!tpl) { tpl = 1; continue; }
            tpl++;
            continue;
        }
        if (tpl && c === '$' && src[i + 1] === '{') { depth++; i++; continue; }
        if (!tpl) {
            if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
            if (c === '/' && src[i + 1] === '*') {
                i += 2;
                while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
                i++;
                continue;
            }
        }
        if (OPEN[c]) { depth++; continue; }
        if (CLOSE[c]) { depth--; continue; }
        if (depth === 0 && !tpl && c === ';') return { text: src.slice(start, i + 1), end: i + 1 };
        if (depth === 0 && !tpl && c === '\n') {
            const soFar = src.slice(start, i).replace(/\s+$/, '');
            /* 行尾是运算符 = 语句没写完，继续往后读 */
            if (!/[+\-,?:=([&|]$/.test(soFar)) return { text: src.slice(start, i + 1), end: i + 1 };
        }
    }
    return { text: src.slice(start, i), end: i };
}

/* 纯字面量：单个字符串 / 模板串，且没有任何插值与拼接 */
function isPureLiteral(rhs) {
    const t = rhs.trim().replace(/;$/, '').trim();
    if (t === "''" || t === '""' || t === '``') return true;
    if (t.indexOf('+') !== -1 || t.indexOf('${') !== -1) return false;
    if (/^'[^']*'$/.test(t) || /^"[^"]*"$/.test(t) || /^`[^`$]*`$/.test(t)) return true;
    return false;
}

function lineOf(src, idx) {
    let n = 1;
    for (let i = 0; i < idx; i++) if (src[i] === '\n') n++;
    return n;
}
function lineText(src, n) {
    return (src.split('\n')[n - 1] || '');
}

let violations = [];
let audited = 0;

TARGETS.forEach((rel) => {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return;
    const src = fs.readFileSync(abs, 'utf8');
    const re = /\.(inner|outer)HTML\s*=|insertAdjacentHTML\s*\(/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        const start = m.index;
        const { text } = extractStatement(src, start);
        audited++;
        const line = lineOf(src, start);
        const prevLine = lineText(src, line - 1);

        const okEsc = /esc\s*\(/.test(text);
        const okLiteral = /\.(inner|outer)HTML\s*=/.test(text)
            && isPureLiteral(text.replace(/^[\s\S]*?\.(inner|outer)HTML\s*=/, ''));
        const okAnnotated = /html-safe/.test(text) || /html-safe/.test(prevLine);

        if (okEsc || okLiteral || okAnnotated) continue;

        violations.push({
            file: rel,
            line,
            snippet: (lineText(src, line) || '').trim().slice(0, 110)
        });
    }
});

console.log('innerhtml-guard: 审计 ' + audited + ' 处 HTML 注入点（' + TARGETS.length + ' 个文件）');
if (!violations.length) {
    console.log('  ok  全部已转义 / 纯字面量 / 已声明 html-safe');
    console.log('\n提示：新增一处 innerHTML 拼接时，要么用 esc()，要么写 `// html-safe: <理由>`。');
    process.exit(0);
}
console.log('\n未声明安全性的注入点：');
violations.forEach((v) => {
    console.log('  FAIL ' + v.file + ':' + v.line + '  ' + v.snippet);
});
console.log('\n' + violations.length + ' 处违规。修法：包 esc()，或注明 `// html-safe: 理由`。');
process.exit(1);
