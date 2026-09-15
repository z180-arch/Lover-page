#!/usr/bin/env node
/* ============================================================================
 * 图片尺寸探测器（零依赖）
 * ----------------------------------------------------------------------------
 * 为什么需要它：photos[] 只有 src 时，浏览器在图片下载完之前不知道容器该多高，
 * 于是发生布局偏移（CLS）。解法是把 width/height 写进 config —— 但没人愿意
 * 手工量 8 张图的像素。
 *
 * 这个脚本直接读文件头拿尺寸（不解码图像，几十微秒），并打印**可直接粘贴进
 * config.js** 的片段。支持 JPEG / PNG / WebP（含 VP8X/VP8L/VP8）。
 *
 * 用法：
 *   node tools/media/image-dims.js assets/photos/*.jpg
 *   node tools/media/image-dims.js --snippet assets/photos/*.jpg   # 只输出粘贴片段
 *   node tools/media/image-dims.js --json assets/photos/*.jpg      # 只输出 JSON
 *
 * 退出码：0 = 全部成功；1 = 有文件无法识别
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');

/* ---------- JPEG：扫 SOFn 段 ---------- */
function jpegSize(buf) {
    let i = 2; // 跳过 SOI
    while (i < buf.length - 9) {
        if (buf[i] !== 0xFF) { i++; continue; }
        const marker = buf[i + 1];
        // SOF0..SOF15，排除 DHT(C4)/JPG(C8)/DAC(CC)
        if (marker >= 0xC0 && marker <= 0xCF &&
            marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
            return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        }
        if (marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
            i += 2; continue;
        }
        const len = buf.readUInt16BE(i + 2);
        if (len < 2) return null;
        i += 2 + len;
    }
    return null;
}

/* ---------- PNG：IHDR ---------- */
function pngSize(buf) {
    if (buf.length < 24) return null;
    if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/* ---------- WebP：VP8X / VP8L / VP8 ---------- */
function webpSize(buf) {
    if (buf.toString('ascii', 0, 4) !== 'RIFF') return null;
    if (buf.toString('ascii', 8, 12) !== 'WEBP') return null;
    const fourcc = buf.toString('ascii', 12, 16);
    if (fourcc === 'VP8X') {
        return {
            width: 1 + buf.readUIntLE(24, 3),
            height: 1 + buf.readUIntLE(27, 3)
        };
    }
    if (fourcc === 'VP8 ') {
        return {
            width: buf.readUInt16LE(26) & 0x3FFF,
            height: buf.readUInt16LE(28) & 0x3FFF
        };
    }
    if (fourcc === 'VP8L') {
        const b = buf.readUInt32LE(21);
        return { width: (b & 0x3FFF) + 1, height: ((b >> 14) & 0x3FFF) + 1 };
    }
    return null;
}

function probe(file) {
    let buf;
    try { buf = fs.readFileSync(file); }
    catch (e) { return { file, error: '无法读取：' + e.message }; }

    const head = buf.slice(0, 4);
    let size = null;
    if (head[0] === 0xFF && head[1] === 0xD8) size = jpegSize(buf);
    else if (head[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') size = pngSize(buf);
    else if (buf.toString('ascii', 0, 4) === 'RIFF') size = webpSize(buf);

    if (!size) return { file, error: '无法识别的图片格式（支持 JPEG / PNG / WebP）' };
    return {
        file,
        bytes: buf.length,
        width: size.width,
        height: size.height,
        ratio: +((size.width / size.height).toFixed(4)),
        orientation: size.width >= size.height ? 'landscape' : 'portrait'
    };
}

/* ---------- CLI ---------- */
const argv = process.argv.slice(2);
const mode = argv.includes('--json') ? 'json'
    : argv.includes('--snippet') ? 'snippet' : 'table';
const files = argv.filter((a) => !a.startsWith('--'));

if (!files.length) {
    console.error('用法: node tools/media/image-dims.js [--json|--snippet] <图片路径...>');
    process.exit(1);
}

const results = files.map((f) => {
    const r = probe(f);
    /* 输出统一用相对路径，便于直接粘进 config.js 的 src 字段 */
    if (!r.error) {
        const rel = './' + path.relative(process.cwd(), path.resolve(f)).split(path.sep).join('/');
        r.src = rel.startsWith('./assets') ? rel : r.src;
    }
    return r;
});

const bad = results.filter((r) => r.error);

if (mode === 'json') {
    console.log(JSON.stringify(results, null, 2));
} else if (mode === 'snippet') {
    console.log('    photos: [');
    results.filter((r) => !r.error).forEach((r) => {
        console.log('        {');
        console.log('            src: "' + r.src + '",');
        console.log('            width: ' + r.width + ',');
        console.log('            height: ' + r.height + ',');
        console.log('            caption: "",');
        console.log('            alt: "",');
        console.log('            date: "",');
        console.log('            place: "",');
        console.log('            focalPoint: { x: 0.5, y: 0.5 }');
        console.log('        },');
    });
    console.log('    ],');
} else {
    const w0 = Math.max(4, ...results.map((r) => (r.src || r.file).length));
    console.log('src'.padEnd(w0) + '  width  height  ratio   方向       体积');
    console.log('-'.repeat(w0 + 42));
    results.forEach((r) => {
        const label = (r.src || r.file).padEnd(w0);
        if (r.error) { console.log(label + '  ' + r.error); return; }
        console.log(
            label + '  ' +
            String(r.width).padStart(5) + '  ' +
            String(r.height).padStart(6) + '  ' +
            String(r.ratio).padStart(6) + '  ' +
            r.orientation.padEnd(10) + '  ' +
            (r.bytes / 1024).toFixed(0) + ' KB'
        );
    });
    if (bad.length) console.log('\n' + bad.length + ' 个文件无法识别');
}

process.exit(bad.length ? 1 : 0);
