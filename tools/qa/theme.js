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
  var minH = Infinity, small = 0;
  document.querySelectorAll('button, [role="button"]').forEach(function (b) {
    var r = b.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
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
    'touchUnder44=' + (isFinite(minH) ? small + ' min=' + Math.round(minH) + 'px' : 'n/a'),
    'roseVisible=' + (function () {
      var el = document.querySelector('.intro-rose');
      if (!el) return 'n/a';
      var cs = getComputedStyle(el);
      return (cs.display === 'none' || cs.visibility === 'hidden' || el.offsetHeight === 0) ? 'hidden' : 'shown';
    })()
  ].join('\n');
})()
