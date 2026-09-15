/* ============================================================================
 * QA 诊断：@contrast —— axe-core 算不出来的那部分对比度
 * ----------------------------------------------------------------------------
 * 背景：本项目底色由 <canvas id="bg-canvas"> 的 mesh gradient 实时绘制，
 *       axe 的 color-contrast 规则拿不到底色，于是把相关节点全部丢进
 *       "incomplete"，永远无法自动判定。这条规则**必须手工核对**，否则
 *       「0 violations」是假的绿。
 *
 * 做法：把 WebGL canvas 用 drawImage 抓回 2D 上下文，逐像素求 min/max RGB
 *       （= 整屏实际出现过的最深 / 最浅底色），再对「自身与祖先都没有不透明
 *       背景色」的文字节点，算出相对这两个极值的对比度，取最差的那个。
 *
 * 判定：AA 正文要求 ≥4.5:1。低于阈值会以 FAIL 前缀列出，便于 grep。
 *
 * 注意：build-batch 会把脚本压成一行 —— 只能用块注释，禁止 // 注释。
 * ==========================================================================*/
(function () {
    var MIN_RATIO = 4.5;

    function luminance(c) {
        var a = c.map(function (v) {
            v = v / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }

    function ratio(a, b) {
        var l1 = luminance(a), l2 = luminance(b);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    function parseColor(s) {
        if (!s) return null;
        var m = String(s).match(/rgba?\(([^)]+)\)/) || String(s).match(/^#[0-9a-f]{3,8}$/i);
        if (!m) return null;
        if (m[1] !== undefined) {
            var parts = m[1].split(',').map(function (x) { return parseFloat(x); });
            if (parts.length > 3 && parts[3] === 0) return null;
            return parts.slice(0, 3).map(Math.round);
        }
        var hex = String(s).trim().slice(1);
        if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
        return [0, 2, 4].map(function (i) { return parseInt(hex.substr(i, 2), 16); });
    }

    /* 元素自身到 body 之间是否存在不透明底色（有 = 它不落在 canvas 上，不需核对） */
    function sitsOnCanvas(el) {
        var node = el;
        var depth = 0;
        while (node && node !== document.documentElement && depth < 8) {
            var bg = parseColor(getComputedStyle(node).backgroundColor);
            if (bg) return false;
            node = node.parentElement;
            depth++;
        }
        return true;
    }

    function hasOwnText(el) {
        for (var i = 0; i < el.childNodes.length; i++) {
            var n = el.childNodes[i];
            if (n.nodeType === 3 && n.textContent.trim().length > 1) return true;
        }
        return false;
    }

    /* —— 1. 抓 canvas 实际渲染出的颜色极值 —— */
    var measured = null;
    var canvas = document.getElementById('bg-canvas');
    if (canvas && canvas.width > 0) {
        try {
            var probe = document.createElement('canvas');
            probe.width = 48; probe.height = 48;
            var ctx = probe.getContext('2d');
            ctx.drawImage(canvas, 0, 0, 48, 48);
            var d = ctx.getImageData(0, 0, 48, 48).data;
            var min = [255, 255, 255], max = [0, 0, 0];
            for (var i = 0; i < d.length; i += 4) {
                for (var k = 0; k < 3; k++) {
                    if (d[i + k] < min[k]) min[k] = d[i + k];
                    if (d[i + k] > max[k]) max[k] = d[i + k];
                }
            }
            measured = { min: min, max: max };
        } catch (e) {
            measured = { error: e.message };
        }
    }

    if (!measured || measured.error) {
        return 'contrast: canvas 不可读（' + ((measured && measured.error) || 'no-canvas') +
            '）—— 无法核算，请勿据此判定通过';
    }

    /* —— 2. 全站文字节点，只看落在 canvas 上的 —— */
    var els = document.querySelectorAll('p, span, h1, h2, h3, h4, a, button, li, div, label, small, em, strong');
    var worst = null;
    var fails = [];
    var checked = 0;
    var seen = [];

    for (var j = 0; j < els.length; j++) {
        var el = els[j];
        if (!hasOwnText(el)) continue;
        if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue;
        var cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.5) continue;
        if (!sitsOnCanvas(el)) continue;

        var fg = parseColor(cs.color);
        if (!fg) continue;

        var rMin = ratio(fg, measured.min);
        var rMax = ratio(fg, measured.max);
        var r = Math.min(rMin, rMax);
        checked++;

        var label = el.tagName.toLowerCase() +
            (el.id ? '#' + el.id : '') +
            (el.className && typeof el.className === 'string'
                ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
                : '');
        var text = (el.textContent || '').trim().slice(0, 18);
        var size = parseFloat(cs.fontSize);
        var weight = parseInt(cs.fontWeight, 10) || 400;
        /* 大号文字（≥24px，或 ≥18.66px 且 bold）AA 门槛是 3:1 */
        var threshold = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3 : MIN_RATIO;

        if (!worst || r < worst.ratio) {
            worst = { label: label, ratio: r, color: cs.color, size: cs.fontSize, text: text, threshold: threshold };
        }
        if (r < threshold) {
            fails.push(label + ' ' + r.toFixed(2) + ':1 (需 ' + threshold + ') "' + text + '"');
        }
    }

    var head = 'canvas rgb(' + measured.min.join(',') + ')→rgb(' + measured.max.join(',') +
        ')  checked=' + checked + '  worst=' +
        (worst ? worst.ratio.toFixed(2) + ':1 [' + worst.label + ' ' + worst.color + ' ' + worst.size + ' "' + worst.text + '"]' : 'n/a');

    return fails.length
        ? 'FAIL ' + fails.length + ' 个节点未过 AA ｜ ' + head + ' ｜ ' + fails.join(' ｜ ')
        : 'PASS ' + head;
})()
