(function () {
  function box(sel) {
    var el = document.querySelector(sel);
    if (!el) return sel + ': MISSING';
    var r = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    return sel + ': top=' + Math.round(r.top) + ' bottom=' + Math.round(r.bottom) +
      ' h=' + Math.round(r.height) + ' z=' + cs.zIndex + ' tf=' + cs.transform.slice(0, 40);
  }
  return [
    'viewport=' + window.innerWidth + 'x' + window.innerHeight,
    box('#envelope'),
    box('.envelope-inner'),
    box('.envelope-sheet'),
    box('.envelope-shell'),
    box('.envelope-flap'),
    'isOpen=' + document.getElementById('envelope').classList.contains('is-open')
  ].join('\n');
})()
