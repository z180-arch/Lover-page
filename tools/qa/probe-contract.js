#!/usr/bin/env node
/* 临时探针：确认 outside-contract 诊断的触发条件（写契约文档时核对事实用）
   运行：node tools/qa/probe-contract.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');
const S = {
    config: fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8'),
    diag: fs.readFileSync(path.join(ROOT, 'diagnostics.js'), 'utf8'),
    sys: fs.readFileSync(path.join(ROOT, 'config-system.js'), 'utf8')
};
function realm(search) {
    const l = [];
    const s = {
        btoa, atob, TextEncoder, TextDecoder, URLSearchParams, URL, navigator: {},
        document: { documentElement: { dataset: {} }, querySelector: () => null },
        location: { search: search || '', href: 'http://localhost/' },
        console: { log: () => {}, warn: (...a) => l.push(a.join(' ')), error: () => {} }
    };
    s.window = s; s.globalThis = s; s.self = s;
    vm.createContext(s);
    ['config', 'diag', 'sys'].forEach((k) => vm.runInContext(S[k], s, { filename: k }));
    s.__l = l;
    return s;
}
const enc = (o) => Buffer.from(JSON.stringify(o), 'utf8').toString('base64');
const cases = [
    ['components={a:{b:1}}', { theme: { components: { a: { b: 1 } } } }],
    ['components={style:"holo"}', { theme: { components: { style: 'holo' } } }],
    ['components={}', { theme: { components: {} } }],
    ['空数组默认值 + 声明形状', { story: { timeline: [{ date: 'x', evil: 1 }] } }],
    ['无声明形状的空数组', { story: { memories: [{ date: 'x', evil: 1 }] } }]
];
cases.forEach(([label, payload]) => {
    const r = realm('?conf=' + encodeURIComponent(enc(payload)));
    const codes = r.__l.map((x) => x.replace(/^\[diag:config\] /, ''));
    console.log(label + '\n  ' + (codes.length ? codes.join('\n  ') : '(无诊断)'));
});
