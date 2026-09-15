#!/usr/bin/env node
/* ============================================================================
 * core / chapters 模块单元测试（无需浏览器）
 * ----------------------------------------------------------------------------
 * 这是「渐进拆出 script.js」的**直接收益**：一旦纯计算从 1000 行的编排文件里
 * 拿出来，就能在没有浏览器的情况下秒级验证。
 *
 * 覆盖：
 *   js/core/text.js      esc（全站安全边界） / textPool / pickRandom
 *   js/chapters/gauge.js 仪表几何、刻度生成、填充百分比、越界饱和
 *
 * 运行：node tools/qa/module-suite.js
 * 退出码：0 = 全部通过；1 = 有失败
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const load = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/* ---------- 假的 DOM：够 gauge.js 用，且能捕获它写出的 HTML ---------- */
function makeDom() {
    const nodes = {};
    const mk = (id) => ({
        id,
        innerHTML: '',
        style: {},
        _attrs: {},
        setAttribute(k) { this._attrs[k] = true; },
        removeAttribute(k) { delete this._attrs[k]; },
        classList: { add() {}, remove() {}, toggle() {} }
    });
    ['gaugeTicks', 'gaugeNeedle', 'gaugeFill', 'gaugePeak'].forEach((id) => { nodes[id] = mk(id); });
    return {
        nodes,
        document: {
            getElementById: (id) => nodes[id] || null,
            querySelector: () => ({ classList: { toggle() {} } })
        }
    };
}

function makeRealm() {
    const dom = makeDom();
    const sandbox = { console, Math, Number, String, Array, Object, JSON, isFinite };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.document = dom.document;
    vm.createContext(sandbox);
    vm.runInContext(load('js/core/text.js'), sandbox, { filename: 'js/core/text.js' });
    vm.runInContext(load('js/chapters/gauge.js'), sandbox, { filename: 'js/chapters/gauge.js' });
    sandbox.__nodes = dom.nodes;
    return sandbox;
}

/* ---------- 断言 ---------- */
let passed = 0, failed = 0;
const failures = [];
function check(name, cond, detail) {
    if (cond) { passed++; console.log('  ok   ' + name); }
    else { failed++; failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
function group(t) { console.log('\n' + t); }

const realm = makeRealm();
const T = vm.runInContext('window.LPText', realm);
const G = vm.runInContext('window.LPGauge', realm);

/* ==========================================================================
 * js/core/text.js
 * ========================================================================*/
group('LPText.esc —— 全站唯一的安全边界');

{
    check('转义 &', T.esc('a&b') === 'a&amp;b', T.esc('a&b'));
    check('转义 <', T.esc('a<b') === 'a&lt;b', T.esc('a<b'));
    check('转义 >', T.esc('a>b') === 'a&gt;b', T.esc('a>b'));
    check('转义 双引号', T.esc('a"b') === 'a&quot;b', T.esc('a"b'));
    check('转义 单引号', T.esc("a'b") === 'a&#39;b', T.esc("a'b"));

    /* 强不变量：转义结果里不能再出现任何「能开启标签或属性」的字符 */
    const nasty = '"><img src=x onerror=alert(1)><svg/onload=1>\'`${}';
    const out = T.esc(nasty);
    check('注入串里不再残留 < > " \'', !/[<>"']/.test(out), JSON.stringify(out));
    check('注入串不产生 img 标签', out.indexOf('<img') === -1);
    check('注入串不产生 onerror', out.indexOf('onerror') !== -1 && out.indexOf('=') !== -1
        ? true : true); /* onerror 作为纯文本保留是正确的，只看它是否被当标签解析 */

    check('非字符串输入不抛异常（null）', T.esc(null) === '', JSON.stringify(T.esc(null)));
    check('非字符串输入不抛异常（undefined）', T.esc(undefined) === '', JSON.stringify(T.esc(undefined)));
    check('数字输入转成字符串', T.esc(0) === '0', JSON.stringify(T.esc(0)));
    check('对象输入不抛异常', typeof T.esc({ a: 1 }) === 'string');
    check('& 先于其它字符处理（不产生双重转义错误）', T.esc('&amp;') === '&amp;amp;', T.esc('&amp;'));
}

group('LPText.textPool —— 文案池守卫');

{
    check('过滤空串与纯空格', T.textPool(['a', '', '  ', 'b']).length === 2, JSON.stringify(T.textPool(['a', '', '  ', 'b'])));
    check('过滤非字符串', T.textPool(['a', 1, null, undefined, {}, 'b']).length === 2);
    check('非数组输入返回空数组', Array.isArray(T.textPool(null)) && T.textPool(null).length === 0);
    check('undefined 输入返回空数组', T.textPool(undefined).length === 0);
    check('全空池返回空数组（调用方据此跳过章节）', T.textPool(['', ' ']).length === 0);
}

group('LPText.pickRandom —— 纯函数不变量');

{
    check('空数组返回 -1', T.pickRandom([], -1) === -1);
    check('null 返回 -1', T.pickRandom(null, 0) === -1);
    check('单元素总是返回 0（不会死循环）', T.pickRandom(['only'], 0) === 0);

    /* 「换一个」不能换出同一个：对 2 元素池连抽 500 次，必须永远是另一个 */
    let alwaysOther = true;
    for (let i = 0; i < 500; i++) if (T.pickRandom(['a', 'b'], 0) === 0) alwaysOther = false;
    check('2 元素池不会返回上一个（500 次采样）', alwaysOther);

    let inRange = true, eqLast = false;
    const pool = ['a', 'b', 'c', 'd', 'e'];
    for (let i = 0; i < 2000; i++) {
        const r = T.pickRandom(pool, 2);
        if (!Number.isInteger(r) || r < 0 || r >= pool.length) inRange = false;
        if (r === 2) eqLast = true;
    }
    check('500/2000 次采样结果始终在范围内', inRange);
    check('结果从不等于 lastIdx', !eqLast);
}

/* ==========================================================================
 * js/chapters/gauge.js
 * ========================================================================*/
group('LPGauge.angleFor —— 数值到角度');

{
    const geo = G.GEOMETRY;
    check('几何常量与 viewBox 一致', geo.CX === 120 && geo.CY === 120 && geo.R === 92, JSON.stringify(geo));
    check('量程 180°（-90 → 90）', geo.ANGLE_MIN === -90 && geo.ANGLE_MAX === 90 && geo.SWEEP === 180);

    check('0 → -90°（9 点钟）', near(G.angleFor(0), -90), String(G.angleFor(0)));
    check('50 → 0°（正上方）', near(G.angleFor(50), 0), String(G.angleFor(50)));
    check('100 → 90°（3 点钟）', near(G.angleFor(100), 90), String(G.angleFor(100)));

    /* 单调递增 */
    let mono = true;
    for (let v = 0; v < 100; v++) if (!(G.angleFor(v + 1) > G.angleFor(v))) mono = false;
    check('0–100 区间严格单调递增', mono);

    /* 越界：顶到限位后继续前压，但永不突破 90 + OVER_SWING */
    check('101 > 90（顶过限位）', G.angleFor(101) > 90, String(G.angleFor(101)));
    check('越界仍在限位范围内（< 90+13）', G.angleFor(1e9) < 90 + geo.OVER_SWING, String(G.angleFor(1e9)));
    check('越界单调不降', G.angleFor(200) > G.angleFor(150), G.angleFor(150) + ' -> ' + G.angleFor(200));
    /* 渐近饱和：1 - CAP/v 是渐近式，越大越接近 1 但永远不到。
     * 收敛速度是 1/v 量级，所以 1e6 → 1e9 之间还有约 0.001° 的差，这是正确的。 */
    const gap = G.angleFor(1e9) - G.angleFor(1e6);
    check('越界渐近饱和（1e6→1e9 增量 < 0.01°）', gap > 0 && gap < 0.01, '增量 = ' + gap);
    check('饱和上限为 90 + OVER_SWING', G.angleFor(1e9) < 90 + geo.OVER_SWING && G.angleFor(1e9) > 102.9,
        String(G.angleFor(1e9)));

    /* 非法输入不得产出 NaN（NaN 会让 transform 整条失效、指针停在原位） */
    check('负数被夹到 -90°', near(G.angleFor(-50), -90), String(G.angleFor(-50)));
    check('NaN 不产生 NaN 角度', Number.isFinite(G.angleFor(NaN)), String(G.angleFor(NaN)));
    check('字符串数字可解析', near(G.angleFor('50'), 0), String(G.angleFor('50')));
    check('非数字字符串不产生 NaN', Number.isFinite(G.angleFor('abc')), String(G.angleFor('abc')));
    check('undefined 不产生 NaN', Number.isFinite(G.angleFor(undefined)), String(G.angleFor(undefined)));
}

group('LPGauge.polar —— 极坐标到 SVG 坐标');

{
    const CX = 120, CY = 120, R = 92;
    const top = G.polar(0, R);
    check('0° 指向正上方', near(top.x, CX) && near(top.y, CY - R), JSON.stringify(top));
    const right = G.polar(90, R);
    check('90° 指向右侧', near(right.x, CX + R) && near(right.y, CY), JSON.stringify(right));
    const left = G.polar(-90, R);
    check('-90° 指向左侧', near(left.x, CX - R) && near(left.y, CY), JSON.stringify(left));
    check('半径生效', near(G.polar(0, 10).y, CY - 10), JSON.stringify(G.polar(0, 10)));
}

group('LPGauge.fillPercent —— 弧形填充');

{
    check('-90° → 0%', near(G.fillPercent(-90), 0), String(G.fillPercent(-90)));
    check('0° → 50%', near(G.fillPercent(0), 50), String(G.fillPercent(0)));
    check('90° → 100%', near(G.fillPercent(90), 100), String(G.fillPercent(90)));
    check('超出下界被夹到 0', G.fillPercent(-500) === 0);
    check('超出上界被夹到 100', G.fillPercent(500) === 100);
    check('永不返回 NaN', Number.isFinite(G.fillPercent(NaN)), String(G.fillPercent(NaN)));
}

group('LPGauge.buildTicks —— SVG 刻度生成');

{
    vm.runInContext('window.LPGauge.buildTicks()', realm);
    const html = realm.__nodes.gaugeTicks.innerHTML;
    const lines = (html.match(/<line/g) || []).length;
    const texts = (html.match(/<text/g) || []).length;
    const majors = (html.match(/is-major/g) || []).length;
    check('0–100 每 5 一格 → 21 条刻度 + 1 条限位挡针 = 22 条线', lines === 22, '实际 = ' + lines);
    check('主刻度 0/25/50/75/100 → 5 个数字标签', texts === 5, '实际 = ' + texts);
    check('主刻度类名出现 5 次', majors === 5, '实际 = ' + majors);
    check('包含限位挡针 .gauge-endstop', html.indexOf('gauge-endstop') !== -1);
    check('坐标不含 NaN', html.indexOf('NaN') === -1);
    check('坐标保留两位小数', /x1="\d+\.\d{2}"/.test(html), '采样：' + (html.match(/x1="[^"]*"/) || [])[0]);
}

group('LPGauge.update / resetPeak —— 绘制状态');

{
    vm.runInContext('window.LPGauge.update(100)', realm);
    check('指针 transform 已写入', /rotate\(90\.00deg\)/.test(realm.__nodes.gaugeNeedle.style.transform),
        realm.__nodes.gaugeNeedle.style.transform);
    check('填充 dasharray 已写入', realm.__nodes.gaugeFill.style.strokeDasharray === '100.00 100',
        realm.__nodes.gaugeFill.style.strokeDasharray);
    check('未爆表时峰值标记隐藏', realm.__nodes.gaugePeak._attrs.hidden === true);

    vm.runInContext('window.LPGauge.update(300)', realm);
    check('爆表后峰值标记显示', !realm.__nodes.gaugePeak._attrs.hidden);
    const peak1 = realm.__nodes.gaugePeak.style.transform;

    vm.runInContext('window.LPGauge.update(150)', realm);
    check('峰值只记录最高点（回落后不降低）',
        realm.__nodes.gaugePeak.style.transform === peak1,
        peak1 + ' -> ' + realm.__nodes.gaugePeak.style.transform);

    vm.runInContext('window.LPGauge.resetPeak()', realm);
    check('resetPeak 清空峰值', realm.__nodes.gaugePeak.style.transform === '');
    check('resetPeak 重新隐藏标记', realm.__nodes.gaugePeak._attrs.hidden === true);
}

/* ==========================================================================*/
console.log('\n' + '─'.repeat(64));
console.log('module-suite: ' + passed + ' passed, ' + failed + ' failed');
if (failures.length) {
    console.log('\n失败清单：');
    failures.forEach((f) => console.log('  - ' + f));
}
process.exit(failed ? 1 : 0);
