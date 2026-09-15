/* ============================================================================
 * LPGauge —— 贰·心动 的模拟仪表
 * ----------------------------------------------------------------------------
 * 为什么值得单独成文件：
 *
 *   1. 它是 script.js 里**最大的一块纯计算**：数值→角度→极坐标→SVG 坐标，
 *      全程没有业务状态。抽出来之后 `angleFor` / `polar` / `fillPercent`
 *      可以完全脱离浏览器做单元测试（见 tools/qa/gauge-suite.js）。
 *   2. 它是「章节视觉语言分化」的核心实现，将来最可能继续长（更多量程标记、
 *      峰值记录、刻度样式）—— 放在 1000 行的 script.js 里改它会越来越危险。
 *
 * 边界（刻意划清）：
 *   - 本模块**只管几何与绘制**，不管状态机、不管章节切换、不管滑块输入。
 *   - 滑块元素与 .addEventListener('input') 留在 script.js（那是章节编排）。
 *   - 峰值角度是**绘制状态**，不是应用状态，所以留在本模块内。
 *
 * 仪表几何与 HTML 里的 viewBox "0 0 240 138" 对应（半圆 180°）。
 * ==========================================================================*/
(function () {
    'use strict';

    const CX = 120;              // 圆心 x（viewBox 坐标）
    const CY = 120;              // 圆心 y
    const R = 92;                // 刻度半径
    const ANGLE_MIN = -90;       // 9 点钟方向
    const ANGLE_MAX = 90;        // 3 点钟方向
    const OVER_SWING = 13;       // 超出量程后指针继续前压的最大角度（限位手感）
    const OVER_CAP = 100;        // 量程上限（>100 即「爆表」区）
    const SWEEP = ANGLE_MAX - ANGLE_MIN;   // 180°

    /** 数值 → 指针角度（度）。0–100 均匀铺满左半到右半；>100 顶到限位后缓慢前压并趋于饱和。 */
    function angleFor(value) {
        const v = Math.max(0, Number(value) || 0);
        if (v <= OVER_CAP) {
            return ANGLE_MIN + (v / OVER_CAP) * SWEEP;
        }
        /* 1 - CAP/v 是渐近式：v 越大越接近 1，但永远达不到 —— 和真实仪表的
         * 「顶到限位后仍在推」手感一致，且不会出现指针跳变。 */
        return ANGLE_MAX + OVER_SWING * (1 - OVER_CAP / v);
    }

    /** 极坐标 → SVG 用户坐标。0° 指向正上方，顺时针为正。 */
    function polar(deg, radius) {
        const rad = (deg * Math.PI) / 180;
        return { x: CX + radius * Math.sin(rad), y: CY - radius * Math.cos(rad) };
    }

    /** 角度 → 弧形填充百分比（0–100）。pathLength=100 时可直接当 dasharray 用。
     *  必须先挡 NaN：Math.min(100, NaN) 与 Math.max(0, NaN) 都返回 NaN，
     *  于是 `strokeDasharray = "NaN 100"` 会让整条弧静默失效（不报错、只是不显示）。
     *  旧实现在 script.js 里靠上游 clamp 侥幸没暴露，抽成公开 API 后必须自己扛住。 */
    function fillPercent(angle) {
        const a = Number(angle);
        if (!Number.isFinite(a)) return 0;
        return Math.max(0, Math.min(100, ((a - ANGLE_MIN) / SWEEP) * 100));
    }

    const fmt = (n) => Number(n).toFixed(2);

    /* ---------- 绘制 ---------- */

    /** 刻度：0–100 每 5 一格，每 25 一主刻度带数字；末端一条限位挡针。 */
    function buildTicks() {
        const g = document.getElementById('gaugeTicks');
        if (!g) return;
        let html = '';
        for (let v = 0; v <= OVER_CAP; v += 5) {
            const major = v % 25 === 0;
            const deg = angleFor(v);
            const outer = polar(deg, R - 6);
            const inner = polar(deg, R - (major ? 20 : 13));
            html += `<line class="gauge-tick${major ? ' is-major' : ''}" `
                + `x1="${fmt(inner.x)}" y1="${fmt(inner.y)}" `
                + `x2="${fmt(outer.x)}" y2="${fmt(outer.y)}" />`;
            if (major) {
                const lp = polar(deg, R - 31);
                html += `<text class="gauge-tick-label" x="${fmt(lp.x)}" y="${fmt(lp.y)}" `
                    + `text-anchor="middle" dominant-baseline="central">${v}</text>`;
            }
        }
        const stopOuter = polar(ANGLE_MAX + 2.2, R - 6);
        const stopInner = polar(ANGLE_MAX + 2.2, R - 22);
        html += `<line class="gauge-endstop" x1="${fmt(stopInner.x)}" y1="${fmt(stopInner.y)}" `
            + `x2="${fmt(stopOuter.x)}" y2="${fmt(stopOuter.y)}" />`;
        // html-safe: html 只由 fmt() 与刻度数字 v 拼成（全是数字），不含任何配置值
        g.innerHTML = html;
    }

    /* 峰值标记：只记录超过 100 之后的最高点（真仪表的 drag pointer）。
     * 这是绘制状态 —— 切走再切回该章时由 resetPeak() 清理。 */
    let peakAngle = null;

    function update(value) {
        const v = Math.max(0, Number(value) || 0);
        const angle = angleFor(v);
        const needle = document.getElementById('gaugeNeedle');
        const fill = document.getElementById('gaugeFill');
        const gauge = document.querySelector('.gauge');

        if (needle) needle.style.transform = `rotate(${fmt(angle)}deg)`;
        if (fill) {
            /* pathLength=100，所以 dasharray 直接用「百分比 100」的数值字符串
             * （跨浏览器最稳，不必去算真实弧长） */
            fill.style.strokeDasharray = `${fmt(fillPercent(angle))} 100`;
        }
        if (gauge) gauge.classList.toggle('is-over', v > OVER_CAP);

        const peak = document.getElementById('gaugePeak');
        if (peak) {
            if (v > OVER_CAP) {
                if (peakAngle === null || angle > peakAngle) peakAngle = angle;
                peak.style.transform = `rotate(${fmt(peakAngle)}deg)`;
                peak.removeAttribute('hidden');
            } else {
                peak.setAttribute('hidden', '');
            }
        }
    }

    function resetPeak() {
        peakAngle = null;
        const peak = document.getElementById('gaugePeak');
        if (peak) {
            peak.setAttribute('hidden', '');
            peak.style.transform = '';
        }
    }

    window.LPGauge = {
        GEOMETRY: {
            CX: CX, CY: CY, R: R,
            ANGLE_MIN: ANGLE_MIN, ANGLE_MAX: ANGLE_MAX,
            OVER_SWING: OVER_SWING, OVER_CAP: OVER_CAP, SWEEP: SWEEP
        },
        angleFor: angleFor,
        polar: polar,
        fillPercent: fillPercent,
        fmt: fmt,
        buildTicks: buildTicks,
        update: update,
        resetPeak: resetPeak
    };
})();
