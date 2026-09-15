#!/usr/bin/env node
/* ============================================================================
 * config 安全 / 契约回归套件
 * ----------------------------------------------------------------------------
 * 为什么需要它：config-system.js 是**唯一**从外部不可信输入（URL 的 ?conf=）
 * 进入运行时的入口。它过去只被「改代码时顺手看一眼」，没有任何自动化断言，
 * 于是「未知字段被拒绝」「原型不被污染」这类结论全靠读代码推断 —— 不可信。
 *
 * 本套件在 Node 里用 vm 造一个假的浏览器 realm，真实加载 config.js +
 * config-system.js，然后逐例断言。不需要浏览器、不需要依赖、不需要构建。
 *
 * 运行：node tools/qa/config-suite.js
 * 退出码：0 = 全部通过；1 = 有断言失败
 *
 * 注意：每个用例都跑在**独立 realm**（独立 Object.prototype）里，
 * 这样原型污染既不会串到下一个用例，也能被独立地检测出来。
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = {
    config: fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8'),
    diagnostics: fs.readFileSync(path.join(ROOT, 'diagnostics.js'), 'utf8'),
    system: fs.readFileSync(path.join(ROOT, 'config-system.js'), 'utf8')
};

/* ---------- 一个最小可用的浏览器 realm ---------- */
function makeRealm(search) {
    const logs = { log: [], warn: [], error: [] };
    const sandbox = {
        btoa, atob, TextEncoder, TextDecoder, URLSearchParams, URL,
        navigator: {},
        document: { documentElement: { dataset: {} }, querySelector: () => null },
        location: { search: search || '', href: 'http://localhost/index.html' },
        console: {
            log: (...a) => logs.log.push(a.join(' ')),
            warn: (...a) => logs.warn.push(a.join(' ')),
            error: (...a) => logs.error.push(a.join(' '))
        }
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.self = sandbox;
    vm.createContext(sandbox);
    /* 加载顺序必须与 index.html 一致：config → diagnostics → config-system */
    vm.runInContext(SRC.config, sandbox, { filename: 'config.js' });
    vm.runInContext(SRC.diagnostics, sandbox, { filename: 'diagnostics.js' });
    vm.runInContext(SRC.system, sandbox, { filename: 'config-system.js' });
    sandbox.__logs = logs;
    return sandbox;
}

/* 走「真实首屏加载路径」：把 payload 塞进 location.search 再加载一次 */
function loadWith(rawJson) {
    const encoded = Buffer.from(JSON.stringify(rawJson), 'utf8').toString('base64');
    return { realm: makeRealm('?conf=' + encodeURIComponent(encoded)), encoded };
}
/* rawJson 是字符串，直接当 JSON 文本用（构造 __proto__ 这类键必须走原始文本） */
function loadRaw(rawText) {
    const encoded = Buffer.from(rawText, 'utf8').toString('base64');
    return { realm: makeRealm('?conf=' + encodeURIComponent(encoded)), encoded };
}

function cfg(realm) { return vm.runInContext('window.VALENTINE_CONFIG', realm); }
function has(obj, p) {
    return p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj) !== undefined;
}
function get(obj, p) {
    return p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

/* ---------- 断言框架 ---------- */
let passed = 0, failed = 0;
const failures = [];

function check(name, cond, detail) {
    if (cond) { passed++; console.log('  ok   ' + name); }
    else {
        failed++;
        failures.push(name + (detail ? ' — ' + detail : ''));
        console.log('  FAIL ' + name + (detail ? ' — ' + detail : ''));
    }
}
function group(title) { console.log('\n' + title); }

/* ==========================================================================
 * 1. 正常路径：合法覆盖必须生效
 * ========================================================================*/
group('1. 合法配置');

{
    const { realm } = loadWith({ person: { nickname: 'Mia' }, pageTitle: '给我最爱的你' });
    const c = cfg(realm);
    check('person.nickname 覆盖生效', get(c, 'person.nickname') === 'Mia', JSON.stringify(get(c, 'person.nickname')));
    check('pageTitle 覆盖生效', c.pageTitle === '给我最爱的你', JSON.stringify(c.pageTitle));
    check('未覆盖字段保持默认', c.home.title === '今天想和我玩什么？', JSON.stringify(c.home.title));
    check('启动未失败', vm.runInContext('window.__configLoadFailed', realm) === false);
}

{
    // diff 语义：只带与默认不同的部分
    const realm = makeRealm('');
    const payload = vm.runInContext('window.ValentineConfig.debugSharePayload()', realm);
    check('默认配置的 diff 为空对象', payload.jsonBytes === 2 && payload.keys.length === 0, JSON.stringify(payload));
}

{
    // 数组整体替换，不做逐项 merge
    const { realm } = loadWith({ quiz: { options: ['A', 'B'] } });
    const c = cfg(realm);
    check('数组整体替换（长度 2）', Array.isArray(c.quiz.options) && c.quiz.options.length === 2, JSON.stringify(c.quiz.options));
    check('数组替换后内容正确', c.quiz.options[0] === 'A' && c.quiz.options[1] === 'B');
    check('数组元素不含默认值残留', c.quiz.options.indexOf('一起吃东西') === -1);
}

/* ==========================================================================
 * 2. 未知字段（P0 目标）
 * ========================================================================*/
group('2. 未知字段必须被拒绝');

{
    const { realm } = loadWith({ theme: { unknownField: 'xxx' } });
    const c = cfg(realm);
    check('顶层 unknown key 不进入配置', c.unknownTopLevel === undefined);
    check('theme.unknownField 不进入配置', get(c, 'theme.unknownField') === undefined,
        '实际值 = ' + JSON.stringify(get(c, 'theme.unknownField')));
}

{
    const { realm } = loadWith({ person: { nickname: 'Mia', evilField: 'x' } });
    const c = cfg(realm);
    check('person 下嵌套未知字段不进入配置', get(c, 'person.evilField') === undefined,
        '实际值 = ' + JSON.stringify(get(c, 'person.evilField')));
    check('同一层合法字段仍然生效', get(c, 'person.nickname') === 'Mia');
}

{
    const { realm } = loadWith({ photos: [{ src: './a.jpg', caption: 'hi', evil: 'x' }] });
    const c = cfg(realm);
    check('已知数组项的未知子字段被拒绝', get(c, 'photos.0.evil') === undefined,
        '实际值 = ' + JSON.stringify(get(c, 'photos.0.evil')));
    check('数组项合法字段保留', get(c, 'photos.0.src') === './a.jpg');
}

{
    // 默认为空数组的字段：形状未知，但键安全性仍然必须成立
    const { realm } = loadWith({ story: { timeline: [{ date: '2026-01', title: 't', __proto__: { x: 1 } }] } });
    const c = cfg(realm);
    check('空数组默认值的字段允许用户填充内容', Array.isArray(get(c, 'story.timeline')) && get(c, 'story.timeline').length === 1);
    check('但其中的危险键被剥离', get(c, 'story.timeline.0.x') === undefined);
}

/* ==========================================================================
 * 3. 原型污染
 * ========================================================================*/
group('3. 原型污染必须被阻断');

const POLLUTION_PROBES = [
    ['__proto__', '{"__proto__":{"polluted":"yes"}}'],
    ['__proto__ 嵌套', '{"theme":{"__proto__":{"polluted":"yes"}}}'],
    ['constructor.prototype', '{"constructor":{"prototype":{"polluted":"yes"}}}'],
    ['prototype', '{"prototype":{"polluted":"yes"}}'],
    ['数组项里的 __proto__', '{"photos":[{"__proto__":{"polluted":"yes"}}]}'],
    ['深层 __proto__', '{"story":{"timeline":[{"a":{"__proto__":{"polluted":"yes"}}}]}}']
];

POLLUTION_PROBES.forEach(([label, text]) => {
    const { realm } = loadRaw(text);
    const polluted = vm.runInContext('({}).polluted', realm);
    const ownPolluted = vm.runInContext("Object.prototype.hasOwnProperty('polluted')", realm);
    check('[污染] ' + label + ' 未能污染 Object.prototype',
        polluted === undefined && ownPolluted === false,
        '({}).polluted === ' + JSON.stringify(polluted));
});

{
    // 污染之外：危险键不应出现在配置里
    const { realm } = loadRaw('{"person":{"nickname":"Mia"},"__proto__":{"z":"1"}}');
    const c = cfg(realm);
    check('危险键 __proto__ 不成为配置的自有属性', !Object.prototype.hasOwnProperty.call(c, '__proto__'),
        'own keys = ' + Object.keys(c).join(','));
    check('正常字段照常生效（污染尝试不影响其它字段）', get(c, 'person.nickname') === 'Mia');
}

{
    const { realm } = loadRaw('{"constructor":{"prototype":{"x":"1"}}}');
    const c = cfg(realm);
    /* 注意：不能用 c.constructor === Object 判断 —— 断言代码跑在 Node 的 realm，
     * 被测代码跑在 vm 的 realm，两边 Object 不是同一个对象。真正的判据是
     * 「constructor 没有变成配置的自有属性」。 */
    check('constructor 未成为配置的自有属性',
        !Object.prototype.hasOwnProperty.call(c, 'constructor'),
        'own keys 含 constructor = ' + Object.prototype.hasOwnProperty.call(c, 'constructor'));
    check('prototype 未成为配置的自有属性',
        !Object.prototype.hasOwnProperty.call(c, 'prototype'));
}

/* ==========================================================================
 * 4. 尺寸 / 深度 / 类型边界
 * ========================================================================*/
group('4. 尺寸与类型边界');

{
    const big = 'x'.repeat(9000);
    const { realm } = loadWith({ pageTitle: big });
    const c = cfg(realm);
    check('超长字符串被截断', String(c.pageTitle).length <= 4000, '长度 = ' + String(c.pageTitle).length);
    check('超长字符串未导致加载失败', vm.runInContext('window.__configLoadFailed', realm) === false);
}

{
    const arr = new Array(900).fill('item');
    const { realm } = loadWith({ smallThings: arr });
    const c = cfg(realm);
    check('超长数组被截断到上限', c.smallThings.length <= 500, '长度 = ' + c.smallThings.length);
}

{
    /* 深度守卫：在**开放槽位**（theme.components 默认是 {}）里塞 20 层嵌套。
     * 用这个位置而不是 person.nickname，是因为后者的 base 是字符串，
     * 会被类型检查先一步拦下，测不到深度守卫本身。 */
    let deep = '1';
    for (let i = 0; i < 20; i++) deep = '{"a":' + deep + '}';
    let threw = null;
    let realm = null;
    try { realm = loadRaw('{"theme":{"components":' + deep + '}}').realm; }
    catch (e) { threw = e; }
    check('深嵌套不抛异常', threw === null, threw && threw.message);
    if (realm) {
        check('深嵌套未导致加载失败', vm.runInContext('window.__configLoadFailed', realm) === false);
        const d = vm.runInContext(
            '(function n(o){ return o && typeof o === "object" ? 1 + n(o.a) : 0; })' +
            '(window.VALENTINE_CONFIG.theme.components)', realm);
        check('嵌套被深度上限截断（≤ MAX_DEPTH+1）', d <= 9, '实际深度 = ' + d);
    }
}

{
    /* 深度超限的载荷同时也会撞上长度上限 —— 两者都必须以「拒绝并回退默认」收场 */
    let deep = '1';
    for (let i = 0; i < 4000; i++) deep = '{"a":' + deep + '}';
    let threw = null;
    let realm = null;
    try { realm = loadRaw('{"theme":{"components":' + deep + '}}').realm; }
    catch (e) { threw = e; }
    check('4000 层载荷不抛异常', threw === null, threw && threw.message);
    if (realm) {
        check('4000 层载荷被拒绝并回退到默认配置',
            get(cfg(realm), 'home.title') === '今天想和我玩什么？');
    }
}

{
    // 类型不匹配：数字给了字符串
    const { realm } = loadWith({ quiz: { answer: 'two' } });
    const c = cfg(realm);
    check('类型不匹配的叶子值被拒绝（answer 保持默认数字）', c.quiz.answer === 2,
        '实际 = ' + JSON.stringify(c.quiz.answer) + ' (' + typeof c.quiz.answer + ')');
}

{
    // 数字型字段收到 bool / null
    const { realm } = loadWith({ theme: { motion: { petalCount: true } } });
    const c = cfg(realm);
    check('数字字段拒绝布尔值', get(c, 'theme.motion.petalCount') === 9,
        '实际 = ' + JSON.stringify(get(c, 'theme.motion.petalCount')));
}

{
    // 字符串字段收到数字
    const { realm } = loadWith({ home: { title: 12345 } });
    const c = cfg(realm);
    check('字符串字段拒绝数字', c.home.title === '今天想和我玩什么？', '实际 = ' + JSON.stringify(c.home.title));
}

{
    // 空对象：合法，不应破坏形状
    const { realm } = loadWith({ person: {} });
    const c = cfg(realm);
    check('空对象不破坏配置形状', get(c, 'person.nickname') === '' && typeof get(c, 'person.nickname') === 'string');
}

{
    // 清空字段：diff 里带空串必须真的清掉（不能被静默丢弃后回退默认值）
    const { realm } = loadWith({ photos: [{ src: './a.jpg', caption: '' }] });
    const c = cfg(realm);
    check('空串能清掉字段（不回退默认）', get(c, 'photos.0.caption') === '',
        '实际 = ' + JSON.stringify(get(c, 'photos.0.caption')));
}

/* ==========================================================================
 * 5. 损坏 / 恶意输入不得导致崩溃
 * ========================================================================*/
group('5. 损坏输入的可恢复性');

{
    const realm = makeRealm('?conf=' + encodeURIComponent('!!!not-base64!!!'));
    check('非法 base64 不抛异常且回退默认', get(cfg(realm), 'home.title') === '今天想和我玩什么？');
    check('非法 base64 被标记为加载失败', vm.runInContext('window.__configLoadFailed', realm) === true);
}

{
    const good = Buffer.from(JSON.stringify({ pageTitle: 'ok' }), 'utf8').toString('base64');
    const truncated = good.slice(0, Math.floor(good.length / 2));
    const realm = makeRealm('?conf=' + encodeURIComponent(truncated));
    check('截断的 base64 回退默认而不崩溃', get(cfg(realm), 'home.title') === '今天想和我玩什么？');
}

{
    const b64 = Buffer.from('{"pageTitle":', 'utf8').toString('base64'); // 合法 base64、非法 JSON
    const realm = makeRealm('?conf=' + encodeURIComponent(b64));
    check('合法 base64 + 非法 JSON 回退默认', get(cfg(realm), 'home.title') === '今天想和我玩什么？');
}

{
    const b64 = Buffer.from('[1,2,3]', 'utf8').toString('base64'); // 顶层是数组
    const realm = makeRealm('?conf=' + encodeURIComponent(b64));
    check('顶层非对象的 JSON 被拒绝', get(cfg(realm), 'home.title') === '今天想和我玩什么？');
}

{
    // 超大 encoded 载荷：必须在解码前就被拦住
    const huge = 'A'.repeat(500000);
    const t0 = Date.now();
    const realm = makeRealm('?conf=' + huge);
    const ms = Date.now() - t0;
    check('超大 conf 参数被拒绝且不拖慢加载（<1500ms）', ms < 1500, '耗时 = ' + ms + 'ms');
    check('超大 conf 后配置仍为默认', get(cfg(realm), 'home.title') === '今天想和我玩什么？');
}

/* ==========================================================================
 * 6. 本地资源不被改写
 * ========================================================================*/
group('6. 本地资源与兼容性');

{
    const { realm } = loadWith({});
    check('本地 BGM 路径不被强制换成 https', get(cfg(realm), 'music.musicUrl') === './assets/audio/bgm.mp3',
        '实际 = ' + JSON.stringify(get(cfg(realm), 'music.musicUrl')));
}

{
    const { realm } = loadWith({ music: { musicUrl: './assets/audio/custom.mp3' } });
    check('自定义本地 BGM 覆盖生效且保持相对路径', get(cfg(realm), 'music.musicUrl') === './assets/audio/custom.mp3');
}

{
    const realm = makeRealm('');
    const link = vm.runInContext('window.ValentineConfig.generateShareLink()', realm);
    check('生成分享链接不抛异常', typeof link === 'string' && link.indexOf('conf=') === -1,
        '默认配置 diff 为空 -> 不带 conf 参数');
}

{
    const { realm } = loadWith({ person: { nickname: 'Mia' } });
    const link = vm.runInContext('window.ValentineConfig.generateShareLink()', realm);
    check('有覆盖时分享链接带 conf 参数', link.indexOf('conf=') !== -1);
    const again = vm.runInContext(
        'window.ValentineConfig.resolveFromEncoded(new URL("' + link + '").searchParams.get("conf"))', realm);
    check('分享链接可往返（round-trip）', get(again, 'person.nickname') === 'Mia');
}

/* ==========================================================================
 * 7. 旧配置兼容
 * ========================================================================*/
group('7. 旧配置兼容（legacy 形状）');

{
    // 旧格式照片 {src, caption} 必须继续可用
    const { realm } = loadWith({ photos: [{ src: './old.jpg', caption: '旧格式' }] });
    check('旧格式 photos {src,caption} 兼容', get(cfg(realm), 'photos.0.caption') === '旧格式');
}

{
    // 新格式照片（本轮要加的字段）
    const { realm } = loadWith({
        photos: [{ src: './new.jpg', caption: '新', width: 1200, height: 1600, focalPoint: { x: 0.3, y: 0.4 } }]
    });
    const c = cfg(realm);
    check('新字段 width 可进入配置', get(c, 'photos.0.width') === 1200,
        '实际 = ' + JSON.stringify(get(c, 'photos.0.width')));
    check('新字段 focalPoint.x 可进入配置', get(c, 'photos.0.focalPoint.x') === 0.3,
        '实际 = ' + JSON.stringify(get(c, 'photos.0.focalPoint.x')));
}

/* ==========================================================================
 * 8. 诊断输出
 * ========================================================================*/
group('8. 配置错误可观察性（诊断）');

{
    const { realm } = loadRaw('{"person":{"nickname":123}}');
    const diag = vm.runInContext('window.LPDiagnostics.list("config")', realm);
    check('非法字段被记录到诊断通道', Array.isArray(diag) && diag.length > 0,
        '实际 = ' + JSON.stringify(diag));
    const hit = diag.find((w) => w && String(w.path).indexOf('person.nickname') !== -1);
    check('诊断包含字段路径', !!hit, JSON.stringify(diag));
    if (hit) {
        check('诊断带 code', hit.code === 'type-mismatch', JSON.stringify(hit.code));
        check('诊断带期望类型', /string/.test(String(hit.expected)), JSON.stringify(hit.expected));
        check('诊断带实际值', String(hit.received).indexOf('123') !== -1, JSON.stringify(hit.received));
    }
}

{
    const { realm } = loadRaw('{"theme":{"unknownField":"xxx"}}');
    const diag = vm.runInContext('window.LPDiagnostics.list("config")', realm);
    const hit = diag.find((w) => w && w.code === 'unknown-field');
    check('未知字段产生 unknown-field 诊断', !!hit, JSON.stringify(diag.map((d) => d.code)));
    check('漏掉的正确值确实保留了默认（而不是被删掉）',
        get(cfg(realm), 'theme.colors.gradient.0') === '#f7ece2');
}

{
    // 合法配置不应产生任何诊断 —— 否则诊断会变成噪音，失去信号价值
    const { realm } = loadWith({ person: { nickname: 'Mia' }, pageTitle: 'x' });
    check('合法配置不产生诊断噪音', vm.runInContext('window.LPDiagnostics.count("config")', realm) === 0,
        '实际 = ' + vm.runInContext('JSON.stringify(window.LPDiagnostics.list("config"))', realm));
}

{
    const { realm } = loadWith({});
    const rep = vm.runInContext('window.LPDiagnostics.report()', realm);
    check('LPDiagnostics.report() 可用且 config 为 valid', rep.config === 'valid', JSON.stringify(rep.config));
    check('report 报告 JS 错误数（此处应为 0）', /JS Errors: 0/.test(rep.runtime || ''), JSON.stringify(rep.runtime));
}

/* ==========================================================================
 * 9. 照片 schema（本轮新增字段）
 * ========================================================================*/
group('9. 照片 schema 与注入面');

{
    const { realm } = loadWith({});
    const p0 = get(cfg(realm), 'photos.0');
    check('默认照片带 width/height（防 CLS 的前提）', p0.width === 1000 && p0.height === 665,
        'width=' + p0.width + ' height=' + p0.height);
    check('默认照片带 alt', typeof p0.alt === 'string' && p0.alt.length > 0, JSON.stringify(p0.alt));
}

{
    const { realm } = loadWith({
        photos: [{ src: './a.jpg', width: 900, height: 1200, alt: '竖图', focalPoint: { x: 0.3, y: 0.2 } }]
    });
    const c = cfg(realm);
    check('width/height 可覆盖', get(c, 'photos.0.width') === 900 && get(c, 'photos.0.height') === 1200);
    check('focalPoint 可覆盖', get(c, 'photos.0.focalPoint.x') === 0.3 && get(c, 'photos.0.focalPoint.y') === 0.2);
    check('alt 可覆盖', get(c, 'photos.0.alt') === '竖图');
}

{
    /* width 是数字字段，收到字符串必须拒绝。
     * 注意语义：photos 是**整个数组替换**，数组项不与环境合并 —— 所以被拒绝的
     * 字段是「从该项里消失」，而不是「回退成默认照片的 1000」。这是刻意的：
     * 逐项合并会让「用户删掉一张照片」变得无法表达。校验层会给出诊断，作者能看到。 */
    const { realm } = loadWith({ photos: [{ src: './a.jpg', width: '900' }] });
    const w = get(cfg(realm), 'photos.0.width');
    check('width 拒绝字符串（不会变成字符串 "900"）', w !== '900' && typeof w !== 'string',
        '实际 = ' + JSON.stringify(w) + ' (' + typeof w + ')');
    check('被拒绝的字段产生了诊断',
        vm.runInContext('LPDiagnostics.count("config")', realm) > 0);
}

{
    // focalPoint.x 越界：校验层不夹取（夹取是渲染层的事），但必须仍是数字
    const { realm } = loadWith({ photos: [{ src: './a.jpg', focalPoint: { x: 5, y: -3 } }] });
    check('focalPoint 越界值仍为数字（渲染层负责夹取）',
        typeof get(cfg(realm), 'photos.0.focalPoint.x') === 'number');
}

{
    // focalPoint 收到字符串：必须拒绝（该字段从该项消失，而不是变成字符串）
    const { realm } = loadWith({ photos: [{ src: './a.jpg', focalPoint: 'center' }] });
    const f = get(cfg(realm), 'photos.0.focalPoint');
    check('focalPoint 拒绝字符串', f !== 'center' && typeof f !== 'string',
        '实际 = ' + JSON.stringify(f));
}

{
    // 展签字段：date / place 是渲染层在用的字段，必须能通过分享链接设置
    const { realm } = loadWith({ photos: [{ src: './a.jpg', date: '2026-09', place: '杭州' }] });
    const c = cfg(realm);
    check('photos[].date 可设置（展签字段）', get(c, 'photos.0.date') === '2026-09',
        '实际 = ' + JSON.stringify(get(c, 'photos.0.date')));
    check('photos[].place 可设置', get(c, 'photos.0.place') === '杭州');
}

{
    // 注入面：恶意字符串必须原样保留（渲染层负责转义），但不能被剥掉引号等
    const evil = '"><img src=x onerror=alert(1)>';
    const { realm } = loadWith({ photos: [{ src: './a.jpg', date: evil }] });
    const got = get(cfg(realm), 'photos.0.date');
    check('恶意字符串原样进入配置（由渲染层 esc 负责，不在这里篡改）', got === evil, JSON.stringify(got));
    check('长度未超上限时不被截断', String(got).length === evil.length);
}

{
    // 旧配置：只有 src + caption，必须继续可用
    const { realm } = loadWith({ photos: [{ src: './legacy.jpg', caption: '旧' }] });
    const c = cfg(realm);
    check('旧格式 photos 仍可用', get(c, 'photos.0.src') === './legacy.jpg' && get(c, 'photos.0.caption') === '旧');
    check('旧格式不产生诊断（不因为缺 width/height 而报警）',
        vm.runInContext('LPDiagnostics.count("config")', realm) === 0,
        vm.runInContext('JSON.stringify(LPDiagnostics.list("config"))', realm));
    check('旧格式确实没带 width（渲染层必须能处理缺失）',
        get(c, 'photos.0.width') === undefined);
}

/* ==========================================================================
 * 10. 默认值未展示、但渲染层确实支持的字段（EXTRA_SHAPES）
 *
 * 背景：schema 的形状来自 DEFAULT_CONFIG 的默认值，而默认值是**范例**。
 * 加固成「拒绝未知字段」之后，凡是渲染层在读、默认值却没写的字段都会被误伤 ——
 * 实测撞到 4 个：home.enTitle(script.js:104) / meter.thresholds(script.js:329) /
 * ending.shareCopiedText(script.js:934) / 顶层 legacy letters(script.js:224)。
 * 这一组同时锁住「它们能设置」和「它们没有被放宽成开放槽位」两个方向。
 * ========================================================================*/
group('10. 默认值未声明的合法字段（EXTRA_SHAPES）');

{
    const { realm } = loadWith({ home: { enTitle: 'goodnight, my love...' } });
    const c = cfg(realm);
    check('home.enTitle 可设置（首页英文手写标题）', get(c, 'home.enTitle') === 'goodnight, my love...',
        '实际 = ' + JSON.stringify(get(c, 'home.enTitle')));
    check('同一层其它字段照常生效', c.home.title === '今天想和我玩什么？');
}

{
    const { realm } = loadWith({ meter: { thresholds: { normal: 200, high: 2000, extreme: 9000 } } });
    const c = cfg(realm);
    check('meter.thresholds 三个档位都可设置',
        get(c, 'meter.thresholds.normal') === 200 &&
        get(c, 'meter.thresholds.high') === 2000 &&
        get(c, 'meter.thresholds.extreme') === 9000,
        JSON.stringify(get(c, 'meter.thresholds')));
}

{
    const { realm } = loadWith({ ending: { shareCopiedText: '已经复制好啦' } });
    check('ending.shareCopiedText 可设置', get(cfg(realm), 'ending.shareCopiedText') === '已经复制好啦');
}

{
    /* 顶层 legacy 别名（script.js 的 `config.letters` 回退路径）。
     * 注意它的项形状必须和 story.letters 一致 —— 所以这里连带测 content。 */
    const { realm } = loadWith({ letters: [{ title: '旧别名', content: '正文' }] });
    const c = cfg(realm);
    check('顶层 legacy letters 可设置', Array.isArray(c.letters) && c.letters.length === 1,
        JSON.stringify(c.letters));
    check('legacy letters 的项字段可设置（content）', get(c, 'letters.0.content') === '正文');
    check('原本的 story.letters 不受影响', get(c, 'story.letters.0.title') === '第一封信');
}

{
    /* 负向控制：EXTRA_SHAPES 只补充声明的字段，绝不能把整个对象变成开放槽位。
     * 否则「拒绝未知字段」这条 P0 结论会在这些位置悄悄失效。 */
    const { realm } = loadWith({ home: { enTitle: 'ok', evilField: 'x' } });
    const c = cfg(realm);
    check('[负向] home 下未声明的字段仍被拒绝', get(c, 'home.evilField') === undefined,
        '实际 = ' + JSON.stringify(get(c, 'home.evilField')));
    check('[负向] 同层合法字段不受影响', get(c, 'home.enTitle') === 'ok');
}

{
    const { realm } = loadWith({ meter: { thresholds: { normal: 100, evil: 1 } } });
    check('[负向] meter.thresholds 下的未声明字段被拒绝',
        get(cfg(realm), 'meter.thresholds.evil') === undefined);
}

{
    const { realm } = loadWith({ meter: { thresholds: { normal: '100' } } });
    check('[负向] meter.thresholds.normal 拒绝字符串（不会变成 "100"）',
        get(cfg(realm), 'meter.thresholds.normal') !== '100');
}

{
    const { realm } = loadWith({ letters: [{ title: 't', evil: 'x' }] });
    const c = cfg(realm);
    check('[负向] legacy letters 项里的未声明字段被拒绝', get(c, 'letters.0.evil') === undefined);
    check('[负向] legacy letters 项里的合法字段保留', get(c, 'letters.0.title') === 't');
}

{
    /* 正确使用 EXTRA_SHAPES 里的字段时不应产生任何诊断 ——
     * 否则「合法配置 0 诊断」这条基线会被这些字段破坏。 */
    const { realm } = loadWith({
        home: { enTitle: 'x' },
        meter: { thresholds: { normal: 100, high: 1000, extreme: 5000 } },
        ending: { shareCopiedText: '链接已复制' },
        letters: [{ title: 't', content: 'c' }]
    });
    check('使用 EXTRA_SHAPES 字段不产生诊断噪音',
        vm.runInContext('window.LPDiagnostics.count("config")', realm) === 0,
        vm.runInContext('JSON.stringify(window.LPDiagnostics.list("config"))', realm));
}

{
    // EXTRA_SHAPES 字段也要经过危险键检查
    const { realm } = loadRaw('{"home":{"enTitle":"ok","__proto__":{"polluted":"yes"}}}');
    check('[安全] EXTRA_SHAPES 位置同样阻断原型污染',
        vm.runInContext('({}).polluted', realm) === undefined &&
        vm.runInContext("Object.prototype.hasOwnProperty('polluted')", realm) === false);
}

/* ==========================================================================
 * 11. examples/ 与契约的一致性
 *
 * 为什么需要它：`examples/*.js` 是使用者抄写的样板。如果示例里出现契约外的字段
 * （或者拼错的字段名），使用者照抄之后就会被校验层静默拒绝 —— 而示例本身看起来
 * 完全正常。所以「示例必须 100% 通过契约」这件事要由机器保证。
 *
 * 做法：把示例文件里的 DEFAULT_CONFIG 当作一个 ?conf= 载荷，喂给与首屏完全相同的
 * 解析路径，断言它不产生任何诊断。
 * ========================================================================*/
group('11. examples/ 与契约一致');

/* 示例文件自带 DEFAULT_CONFIG（它替代 config.js），所以要在独立的裸 realm 里跑 */
function loadExample(file) {
    const src = fs.readFileSync(path.join(ROOT, 'examples', file), 'utf8');
    const sandbox = { console: { log: () => {}, warn: () => {}, error: () => {} } };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(src, sandbox, { filename: file });
    return JSON.parse(JSON.stringify(vm.runInContext('window.DEFAULT_CONFIG', sandbox)));
}

fs.readdirSync(path.join(ROOT, 'examples'))
    .filter((f) => f.endsWith('.js'))
    .forEach((file) => {
        let example;
        try { example = loadExample(file); }
        catch (e) {
            check('[' + file + '] 可被加载', false, e.message);
            return;
        }
        const realm = makeRealm('');
        const encoded = Buffer.from(JSON.stringify(example), 'utf8').toString('base64');
        const result = vm.runInContext(
            'window.ValentineConfig.auditPayload(' + JSON.stringify(encoded) + ')', realm);
        const warnings = (result && result.warnings) || [];
        check('[' + file + '] 不含契约外字段 / 类型错误',
            warnings.length === 0,
            warnings.length
                ? warnings.map((w) => (w.path || '?') + ' [' + w.code + ']').join('; ')
                : '');
        check('[' + file + '] 能被解析（ok）', !!(result && result.ok));
    });

/* ==========================================================================*/
console.log('\n' + '─'.repeat(64));
console.log('config-suite: ' + passed + ' passed, ' + failed + ' failed');
if (failures.length) {
    console.log('\n失败清单：');
    failures.forEach((f) => console.log('  - ' + f));
}
process.exit(failed ? 1 : 0);
