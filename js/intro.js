/* intro.js — 第一屏开场
 * 视觉：A 暖奶油 Mesh Gradient（mesh-gradient.js v0.0.5, MIT）+ Redouté《Les Roses》铜版画（公有领域）
 * 说明：npm 构建未含动画循环，这里从外部以极慢速率推进 u_time uniform（约 25s 一个光斑周期），
 *       shader / 渲染 / 噪声全部是库的实现。
 * 行为：进入按钮 → 淡出开场 → 播放音乐 → currentStep = 1（复用母版状态机）；
 *       window.Intro.show()/hide() 供 Replay 复用。
 */

import MeshGradientModule from '../vendor/mesh-gradient.esm.js';
const MeshGradient = MeshGradientModule && MeshGradientModule.default
  ? MeshGradientModule.default
  : MeshGradientModule;

/* 主题来自 config.theme（产品化：换主题只改 JSON） */
const CFG = window.VALENTINE_CONFIG || {};
const T = CFG.theme || {};
const PALETTE = {
  colors: (T.colors && T.colors.gradient) || T.gradient || ['#f7ece2', '#f3d5cb', '#f7ddc0', '#f2e6d9'],
  amp: 130,
  speed: (T.motion && T.motion.gradientSpeed) || T.motionSpeed || 700,
};

let gradient = null;
let overlay = null;
let musicBtn = null;

function initGradient() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return false;
  try {
    gradient = new MeshGradient();
    gradient.initGradient('#bg-canvas', PALETTE.colors);
    gradient.amp = PALETTE.amp;
  } catch (err) {
    console.warn('[intro] WebGL 不可用，跳过动态背景：', err);
    gradient = null;
    return false;
  }

  const SPEED = PALETTE.speed; // u_time 单位/秒
  function whenReady(cb) {
    if (gradient.mesh && gradient.minigl) return cb();
    setTimeout(() => whenReady(cb), 60);
  }
  whenReady(() => {
    const base = gradient.mesh.material.uniforms.u_time.value || 1253106;
    const t0 = performance.now();
    function loop(now) {
      gradient.mesh.material.uniforms.u_time.value =
        base + ((now - t0) / 1000) * SPEED;
      gradient.minigl.render();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });
  return true;
}

/* ---------- 音乐 ---------- */
function setMusicIcon(on) {
  if (musicBtn) musicBtn.classList.toggle('is-off', !on);
}

function toggleMusic(e) {
  e.stopPropagation();
  const bg = document.getElementById('bgMusic');
  if (!bg) return;
  if (bg.paused) {
    bg.play()
      .then(() => window.appState && window.appState.setState({ isMusicPlaying: true }))
      .catch(() => {});
  } else {
    bg.pause();
    window.appState && window.appState.setState({ isMusicPlaying: false });
  }
}

/* ---------- 显示 / 隐藏 ---------- */
function show() {
  if (!overlay) return;
  document.body.classList.add('intro-active');
  window.scrollTo(0, 0);
  overlay.classList.remove('is-hidden');
  requestAnimationFrame(() => overlay.classList.remove('is-leaving'));
}

function hide() {
  if (!overlay || overlay.classList.contains('is-leaving')) return;
  // 用户手势：解锁音乐
  const bg = document.getElementById('bgMusic');
  if (bg && bg.paused) {
    bg.play()
      .then(() => window.appState && window.appState.setState({ isMusicPlaying: true }))
      .catch(() => {});
  }
  overlay.classList.add('is-leaving');
  setTimeout(() => {
    overlay.classList.add('is-hidden');
    document.body.classList.remove('intro-active');
    if (window.appState) window.appState.setState({ currentStep: 1 });
  }, 1500);
}

function init() {
  overlay = document.getElementById('intro-overlay');
  if (!overlay) {
    document.body.classList.remove('intro-active');
    return;
  }

  const roseImg = overlay.querySelector('.intro-rose img');
  if (roseImg && T.hero && T.hero.rose) {
    roseImg.src = T.hero.rose;
  }

  musicBtn = overlay.querySelector('.intro-music');
  const enterBtn = overlay.querySelector('.intro-enter');

  if (enterBtn) enterBtn.addEventListener('click', hide);
  if (musicBtn) musicBtn.addEventListener('click', toggleMusic);

  const bgMusic = document.getElementById('bgMusic');
  if (bgMusic) {
    bgMusic.addEventListener('play', () => setMusicIcon(true));
    bgMusic.addEventListener('pause', () => setMusicIcon(false));
    setMusicIcon(!bgMusic.paused);
  }

  initGradient();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.Intro = { show, hide };
