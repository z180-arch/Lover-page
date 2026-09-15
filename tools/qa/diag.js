(function () {
  var out = {};
  var vw = window.innerWidth, vh = window.innerHeight;
  out.viewport = vw + 'x' + vh;
  out.docScrollW = document.documentElement.scrollWidth;
  out.horizontalOverflow = document.documentElement.scrollWidth > vw + 1;
  out.bodyClass = document.body.className;

  var overlay = document.getElementById('intro-overlay');
  if (overlay) {
    var cs = getComputedStyle(overlay);
    var r = overlay.getBoundingClientRect();
    out.overlay = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), cs.display, cs.visibility, cs.opacity, overlay.className].join(' ~ ');
  }
  var title = document.querySelector('.intro-title');
  if (title) {
    var rt = title.getBoundingClientRect();
    var ct = getComputedStyle(title);
    out.introTitle = [title.textContent, Math.round(rt.x), Math.round(rt.y), Math.round(rt.width), Math.round(rt.height), ct.color, ct.fontSize, ct.opacity].join(' ~ ');
  }
  var rose = document.querySelector('.intro-rose img');
  if (rose) {
    var rr = rose.getBoundingClientRect();
    out.introRose = [rose.getAttribute('src'), rose.complete, rose.naturalWidth, Math.round(rr.x), Math.round(rr.y), Math.round(rr.width), Math.round(rr.height), getComputedStyle(rose).opacity].join(' ~ ');
  }
  var canvas = document.getElementById('bg-canvas');
  if (canvas) { out.canvas = canvas.width + 'x' + canvas.height; }
  out.webgl = (function () {
    try {
      var c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return 'err'; }
  })();

  var small = [];
  document.querySelectorAll('button, input, [role="button"]').forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (getComputedStyle(el).visibility === 'hidden') return;
    if (r.height < 44 || r.width < 44) {
      small.push((el.id || el.className) + ':' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
  });
  out.underSizedTargets = small;

  var over = [];
  document.querySelectorAll('body *').forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.right > vw + 1 || r.left < -1) {
      var cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'absolute') return;
      over.push(el.tagName + (el.id ? '#' + el.id : '') + ' [' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
    }
  });
  out.overflowingElements = over.slice(0, 12);

  return JSON.stringify(out);
})()
