(function () {
  var out = [];
  var vw = window.innerWidth;
  out.push('viewport=' + vw + 'x' + window.innerHeight + ' docScrollW=' + document.documentElement.scrollWidth + ' overflowX=' + (document.documentElement.scrollWidth > vw + 1));

  function g(sel) { return document.querySelector(sel); }
  function r(sel) {
    var el = g(sel);
    if (!el) return sel + '=MISSING';
    var b = el.getBoundingClientRect();
    return sel + '=[top ' + Math.round(b.top) + ', bottom ' + Math.round(b.bottom) + ', h ' + Math.round(b.height) + ']';
  }

  out.push(r('#envelope'));
  out.push(r('.envelope-inner'));
  out.push(r('.envelope-sheet'));
  out.push(r('.envelope-shell'));
  out.push(r('.envelope-flap'));

  var sheet = g('.envelope-sheet');
  var shell = g('.envelope-shell');
  if (sheet && shell) {
    var sb = sheet.getBoundingClientRect();
    var hb = shell.getBoundingClientRect();
    out.push('sheetBottomInsideShell=' + (sb.bottom <= hb.bottom + 0.5));
    out.push('sheetTopInsideShell=' + (sb.top >= hb.top - 0.5));
  }

  var chip = g('#musicToggle');
  var jline = g('.journey-line');
  if (chip && jline) {
    var cb = chip.getBoundingClientRect();
    var jb = jline.getBoundingClientRect();
    var overlap = !(cb.right < jb.left || cb.left > jb.right || cb.bottom < jb.top || cb.top > jb.bottom);
    out.push('musicChipOverlapsJourneyLine=' + overlap);
    out.push('chip=[' + Math.round(cb.left) + ',' + Math.round(cb.top) + ',' + Math.round(cb.right) + ',' + Math.round(cb.bottom) + '] journey=[' + Math.round(jb.left) + ',' + Math.round(jb.top) + ',' + Math.round(jb.right) + ',' + Math.round(jb.bottom) + ']');
  }

  var small = [];
  document.querySelectorAll('button, input, [role="button"]').forEach(function (el) {
    var b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) return;
    if (getComputedStyle(el).visibility === 'hidden') return;
    if (b.height < 44 || b.width < 44) small.push((el.id || el.className) + ':' + Math.round(b.width) + 'x' + Math.round(b.height));
  });
  out.push('underSized=' + JSON.stringify(small));

  var vis = [];
  document.querySelectorAll('.button-group .cute-btn').forEach(function (el) {
    var b = el.getBoundingClientRect();
    if (b.width === 0) return;
    vis.push((el.id || '?') + '(' + Math.round(b.left) + '-' + Math.round(b.right) + ')');
  });
  out.push('visibleButtons=' + vis.join(' '));

  return out.join('  ||  ');
})()
