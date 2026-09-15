/* 初始化探针：逐项报告 script.js 的 DOMContentLoaded 初始化链走到了哪一步。
 * 用来定位「初始化中途抛错」——比猜快得多。
 * 注意：只能使用块注释（build-batch 会压行）。
 */
(function () {
  var t = function (id) { var e = document.getElementById(id); return e ? e.textContent : '(no el)'; };
  var n = function (sel) { return document.querySelectorAll(sel).length; };
  var out = [];
  out.push('pageTitle=' + document.title);
  out.push('homeTitle=' + t('homeTitle'));
  out.push('quizText=' + t('quizText'));
  out.push('quizOptions=' + n('#quizOptions .option-btn'));
  out.push('meterNextBtn=' + t('meterNextBtn'));
  out.push('questionFolio=' + t('questionFolio'));
  out.push('smallThingText=' + t('smallThingText'));
  out.push('photoStageLen=' + ((document.getElementById('photoStage') || {}).innerHTML || '').length);
  out.push('contactCells=' + n('.contact-cell'));
  out.push('letterStageLen=' + ((document.getElementById('letterStage') || {}).innerHTML || '').length);
  out.push('surpriseBtn=' + t('surpriseBtn'));
  out.push('replayBtn=' + t('replayBtn'));
  out.push('petals=' + n('.floating-elements .petal'));
  out.push('bgMusicSrc=' + ((document.getElementById('musicSource') || {}).getAttribute
    ? document.getElementById('musicSource').getAttribute('src') : 'n/a'));
  out.push('step=' + (document.body.dataset.step || '(unset)'));
  out.push('dissolve=' + (document.body.dataset.dissolve || '(unset)'));
  out.push('journeyFill=' + (((document.getElementById('journeyFill') || {}).style || {}).getPropertyValue
    ? document.getElementById('journeyFill').style.getPropertyValue('--journey-progress') : 'n/a'));
  out.push('introTitle=' + t('introTitle'));
  out.push('shareBtnBound=' + (typeof window.ValentineConfig));
  return out.join('\n');
})()
