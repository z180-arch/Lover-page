/* 主题令牌自检：报告当前主题是否真的改变了渲染结果（而不是只改了变量）。
 * 用法（steps 文件里）：@theme
 * 注意：build-batch.js 会把本文件压成一行，所以只能用块注释，不能用行注释。
 */
(function () {
  var root = getComputedStyle(document.documentElement);
  var get = function (n) { return root.getPropertyValue(n).trim(); };
  var panel = document.querySelector('.container');
  var panelCS = panel ? getComputedStyle(panel) : null;
  var kicker = document.querySelector('#question2 .chapter-kicker');
  var journey = document.getElementById('journeyLabel');
  var minH = Infinity, small = 0, animating = 0, measured = 0;
  /* 正在跑动画/过渡的元素必须跳过：入场动画里的按钮会被 transform: scale 压到
   * 43.x px，「< 44」就成立了，于是报出假阳性（实测：同一页面 wait 2200 报 1、
   * wait 2600 报 0）。报告里带上 animating=N，说明漏测了几个，而不是假装量过了。 */
  var isAnimating = function (el) {
    if (typeof el.getAnimations !== 'function') return false;
    try { return el.getAnimations().some(function (a) { return a.playState === 'running'; }); }
    catch (e) { return false; }
  };
  document.querySelectorAll('button, [role="button"]').forEach(function (b) {
    var r = b.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (isAnimating(b)) { animating++; return; }
    measured++;
    if (r.height < minH) minH = r.height;
    if (r.height < 44) small++;
  });
  return [
    'theme=' + (document.documentElement.getAttribute('data-theme') || '(none)'),
    'lpThemeName=' + (window.LPTheme ? window.LPTheme.name() : '(no LPTheme)'),
    '--paper=' + get('--paper'),
    '--ink=' + get('--ink'),
    '--accent=' + get('--accent'),
    '--panel-bg=' + get('--panel-bg'),
    '--sheet-bg=' + get('--sheet-bg').slice(0, 44),
    '--font-body=' + get('--font-body').slice(0, 44),
    '--fs-heading=' + get('--fs-heading'),
    'panelBg=' + (panelCS ? panelCS.backgroundColor : 'n/a'),
    'panelBoxShadow=' + (panelCS ? panelCS.boxShadow.slice(0, 34) : 'n/a'),
    'panelRadius=' + (panelCS ? panelCS.borderRadius : 'n/a'),
    'dissolve=' + (document.body.dataset.dissolve || '(unset)'),
    'step=' + (document.body.dataset.step || '(unset)'),
    'journeyLabel=' + (journey ? journey.textContent : 'n/a'),
    'kicker=' + (kicker ? kicker.textContent : 'n/a'),
    'hScroll=' + (document.documentElement.scrollWidth > window.innerWidth
      ? 'YES(' + document.documentElement.scrollWidth + '>' + window.innerWidth + ')' : 'no'),
    'touchUnder44=' + (isFinite(minH) ? small + ' min=' + Math.round(minH) + 'px' : 'n/a') +
      ' measured=' + measured + ' animating=' + animating,
    'roseVisible=' + (function () {
      var el = document.querySelector('.intro-rose');
      if (!el) return 'n/a';
      var cs = getComputedStyle(el);
      return (cs.display === 'none' || cs.visibility === 'hidden' || el.offsetHeight === 0) ? 'hidden' : 'shown';
    })()
  ].join('\n');
})()
