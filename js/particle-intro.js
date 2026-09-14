/* ============================================================================
 * particle-intro.js — 第一屏「粒子玫瑰」电影式开场 Overlay
 *
 * 视觉核心改编自 hvccj/particle-rose（README 声明 MIT License，无独立 LICENSE 文件）：
 *   - 7 层花瓣黄金角叶序参数化曲面（arch/recurve/cup/tilt/bow/twist/widthProfile）
 *   - 花萼 / 花茎 / 叶片
 *   - 散射位置 → 玫瑰目标位置的收敛（convergence）
 *   - 呼吸缩放、极慢旋转、加法混合软圆点、背景星点、缓慢飘落花瓣
 * 原项目的 MediaPipe 手势 / 摄像头 / 鼠标拖拽 / 键盘快捷键 / 原 UI 全部剔除。
 * 本项目修改：去荧光粉改克制暗红→玫红→暖白高光；粒子数按设备分级；
 *   收敛缓动改平滑；加入「进入」转场（增亮→外扩→淡出）与重放 API。
 * 纯 script 标签引入，依赖全局 THREE（three@0.160.0 UMD CDN）。
 * 暴露 window.ParticleIntro = { show(), hide() }。
 * ==========================================================================*/
(function () {
  'use strict';

  // ---------- 设备分级 ----------
  const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isNarrow = window.innerWidth < 1024;
  const cores = navigator.hardwareConcurrency || 4;
  const isLowEnd = cores <= 2 || window.innerWidth < 360;

  let PARTICLE_COUNT;
  let STAR_COUNT;
  let PETAL_COUNT;
  let MAX_DPR;
  if (isLowEnd) {
    PARTICLE_COUNT = 2000; STAR_COUNT = 25; PETAL_COUNT = 6; MAX_DPR = 1.3;
  } else if (isNarrow || isMobileUA) {
    PARTICLE_COUNT = 3000; STAR_COUNT = 30; PETAL_COUNT = 8; MAX_DPR = 1.5;
  } else {
    PARTICLE_COUNT = 5000; STAR_COUNT = 80; PETAL_COUNT = 18; MAX_DPR = 2;
  }

  const SCALE = PARTICLE_COUNT / 5000;          // 按目标粒子数缩放各层
  const ROSE_CENTER_Y = -0.5;
  const SCATTER_RADIUS = 13;
  const SCATTER_INNER = 4;
  const CONVERGE_MS = 2800;                     // 成形时长（约 2.8s）

  // ---------- 工具 ----------
  function hexToRGB(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function lerpColor(c1, c2, t) {
    return [
      c1[0] + (c2[0] - c1[0]) * t,
      c1[1] + (c2[1] - c1[1]) * t,
      c1[2] + (c2[2] - c1[2]) * t
    ];
  }
  function smoothstep01(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  // 克制配色：深酒红 → 暗红 → 玫红 → 暖白高光
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const LAYER_DEFS = [
    { petals: 7, count: Math.round(500 * SCALE),  baseR: 0.06, tipR: 0.30, baseH: 1.05, tipH: 1.7,
      arch: 0.06, spread: 0.05, cup: 0.42, tilt: 0.08, recurve: 0.00, bowHeight: 0.06, angleOffset: 0,
      colorStart: hexToRGB('#3a0a12'), colorEnd: hexToRGB('#2a0608') },
    { petals: 7, count: Math.round(550 * SCALE),  baseR: 0.12, tipR: 0.55, baseH: 0.80, tipH: 2.0,
      arch: 0.12, spread: 0.08, cup: 0.38, tilt: 0.15, recurve: 0.01, bowHeight: 0.12, angleOffset: GOLDEN_ANGLE * 0.38,
      colorStart: hexToRGB('#5a1018'), colorEnd: hexToRGB('#400a10') },
    { petals: 8, count: Math.round(600 * SCALE),  baseR: 0.22, tipR: 0.90, baseH: 0.50, tipH: 2.2,
      arch: 0.22, spread: 0.11, cup: 0.34, tilt: 0.25, recurve: 0.03, bowHeight: 0.18, angleOffset: GOLDEN_ANGLE * 1.20,
      colorStart: hexToRGB('#7a1826'), colorEnd: hexToRGB('#5a1018') },
    { petals: 8, count: Math.round(630 * SCALE),  baseR: 0.35, tipR: 1.40, baseH: 0.15, tipH: 2.4,
      arch: 0.38, spread: 0.17, cup: 0.28, tilt: 0.38, recurve: 0.06, bowHeight: 0.28, angleOffset: GOLDEN_ANGLE * 2.00,
      colorStart: hexToRGB('#992030'), colorEnd: hexToRGB('#6b1a25') },
    { petals: 8, count: Math.round(630 * SCALE),  baseR: 0.55, tipR: 1.95, baseH: -0.30, tipH: 2.2,
      arch: 0.58, spread: 0.24, cup: 0.22, tilt: 0.50, recurve: 0.12, bowHeight: 0.36, angleOffset: GOLDEN_ANGLE * 2.70,
      colorStart: hexToRGB('#b03040'), colorEnd: hexToRGB('#8a2535') },
    { petals: 8, count: Math.round(600 * SCALE),  baseR: 0.80, tipR: 2.55, baseH: -0.85, tipH: 1.8,
      arch: 0.80, spread: 0.30, cup: 0.15, tilt: 0.60, recurve: 0.22, bowHeight: 0.42, angleOffset: GOLDEN_ANGLE * 3.40,
      colorStart: hexToRGB('#c44a6a'), colorEnd: hexToRGB('#a83a4a') },
    { petals: 7, count: Math.round(490 * SCALE),  baseR: 1.05, tipR: 3.10, baseH: -1.40, tipH: 1.3,
      arch: 1.00, spread: 0.38, cup: 0.08, tilt: 0.68, recurve: 0.40, bowHeight: 0.44, angleOffset: GOLDEN_ANGLE * 4.20,
      colorStart: hexToRGB('#d45a78'), colorEnd: hexToRGB('#c44a6a') }
  ];

  const SEPAL_COUNT = Math.round(350 * SCALE);
  const STEM_COUNT = Math.round(350 * SCALE);
  const LEAF_COUNT = Math.round(300 * SCALE);
  const stemColA = hexToRGB('#14301a');
  const stemColB = hexToRGB('#1a3a2a');

  function generateRoseGeometry() {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    let idx = 0;

    for (const layer of LAYER_DEFS) {
      const perPetal = Math.floor(layer.count / layer.petals);
      for (let p = 0; p < layer.petals; p++) {
        const jitter = (Math.random() - 0.5) * 0.06;
        const petalAngle = (p / layer.petals) * Math.PI * 2 + layer.angleOffset + jitter;
        const remaining = (p === layer.petals - 1) ? layer.count - p * perPetal : perPetal;
        const archVar = layer.arch * (0.9 + Math.random() * 0.2);
        const recurveVar = layer.recurve * (0.85 + Math.random() * 0.3);
        for (let i = 0; i < remaining && idx < PARTICLE_COUNT; i++) {
          const t = Math.random();
          const s = (Math.random() - 0.5) * 2;
          const rSpine = layer.baseR + t * (layer.tipR - layer.baseR);
          const arch = Math.sin(t * Math.PI) * archVar;
          const recurveT = Math.max(0, (t - 0.55) / 0.45);
          const recurve = recurveT * recurveT * recurveVar;
          const rEff = rSpine + arch + recurve;
          const bow = Math.sin(t * Math.PI * 0.8) * layer.bowHeight;
          const h = layer.baseH + t * (layer.tipH - layer.baseH) + bow - recurve * 0.4;
          const asym = 1.0 + s * 0.06;
          const widthProfile = Math.pow(Math.sin(t * Math.PI), 0.55) * (1 - t * 0.3) * asym;
          const twist = t * 0.15 * (p % 2 === 0 ? 1 : -1);
          const theta = petalAngle + s * widthProfile * layer.spread + twist;
          const cup = s * s * layer.cup * (1 - t * 0.5);
          const rFinal = rEff - cup;
          const tiltAngle = t * layer.tilt;
          const rTilted = rFinal * Math.cos(tiltAngle) + h * Math.sin(tiltAngle);
          const yTilted = h * Math.cos(tiltAngle) - rFinal * Math.sin(tiltAngle);
          positions[idx * 3] = rTilted * Math.cos(theta);
          positions[idx * 3 + 1] = yTilted + ROSE_CENTER_Y;
          positions[idx * 3 + 2] = rTilted * Math.sin(theta);
          // 少量外缘粒子带暖白高光，其余按层渐变
          let col = lerpColor(layer.colorStart, layer.colorEnd, t);
          if (t > 0.92 && Math.random() < 0.08) col = lerpColor(col, [255, 232, 232], 0.6);
          colors[idx * 3] = col[0] / 255; colors[idx * 3 + 1] = col[1] / 255; colors[idx * 3 + 2] = col[2] / 255;
          idx++;
        }
      }
    }

    // 花萼
    const sepalN = 5, sepalPer = Math.floor(SEPAL_COUNT / sepalN);
    for (let s = 0; s < sepalN && idx < PARTICLE_COUNT; s++) {
      const angle = (s / sepalN) * Math.PI * 2 + Math.PI / 10;
      const cnt = (s === sepalN - 1) ? SEPAL_COUNT - s * sepalPer : sepalPer;
      for (let i = 0; i < cnt && idx < PARTICLE_COUNT; i++) {
        const t = Math.random();
        const rSpine = 0.90 + t * 2.0;
        const rEff = rSpine + Math.sin(t * Math.PI * 0.7) * 0.5;
        positions[idx * 3] = rEff * Math.cos(angle);
        positions[idx * 3 + 1] = ROSE_CENTER_Y - 1.2 - t * 1.0 - Math.pow(t, 3) * 0.6;
        positions[idx * 3 + 2] = rEff * Math.sin(angle);
        colors[idx * 3] = 0.05; colors[idx * 3 + 1] = 0.18; colors[idx * 3 + 2] = 0.10;
        idx++;
      }
    }

    // 花茎
    const stemTop = ROSE_CENTER_Y - 1.6, stemLen = 11;
    for (let i = 0; i < STEM_COUNT && idx < PARTICLE_COUNT; i++) {
      const t = Math.random();
      const y = stemTop - t * stemLen;
      const xOff = Math.sin(t * Math.PI * 0.9) * 0.4;
      const zOff = Math.cos(t * Math.PI * 0.55) * 0.25;
      const phi = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.22;
      positions[idx * 3] = xOff + r * Math.cos(phi);
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = zOff + r * Math.sin(phi);
      const col = lerpColor(stemColA, stemColB, t);
      colors[idx * 3] = col[0] / 255; colors[idx * 3 + 1] = col[1] / 255; colors[idx * 3 + 2] = col[2] / 255;
      idx++;
    }

    // 叶片
    const leafDefs = [
      { stemT: 0.28, angle: Math.PI * 0.65, len: 2.8, width: 1.2, count: Math.round(150 * SCALE) },
      { stemT: 0.58, angle: -Math.PI * 0.55, len: 3.0, width: 1.3, count: Math.round(150 * SCALE) }
    ];
    for (const leafDef of leafDefs) {
      const stY = stemTop - leafDef.stemT * stemLen;
      const stX = Math.sin(leafDef.stemT * Math.PI * 0.9) * 0.4;
      const stZ = Math.cos(leafDef.stemT * Math.PI * 0.55) * 0.25;
      for (let i = 0; i < leafDef.count && idx < PARTICLE_COUNT; i++) {
        const u = Math.random();
        const maxV = Math.sin(u * Math.PI) * (1 - u * 0.55);
        const v = (Math.random() - 0.5) * 2 * maxV;
        const along = u * leafDef.len;
        const across = v * leafDef.width * 0.5;
        positions[idx * 3] = stX + along * Math.cos(leafDef.angle) - across * Math.sin(leafDef.angle) * 0.7;
        positions[idx * 3 + 1] = stY + across * 0.5 + Math.sin(u * Math.PI) * 0.4 * (1 - Math.abs(v));
        positions[idx * 3 + 2] = stZ + along * Math.sin(leafDef.angle) + across * Math.cos(leafDef.angle) * 0.7;
        const col = lerpColor(stemColA, stemColB, 0.3 + u * 0.5);
        colors[idx * 3] = col[0] / 255; colors[idx * 3 + 1] = col[1] / 255; colors[idx * 3 + 2] = col[2] / 255;
        idx++;
      }
    }

    return { positions, colors };
  }

  function generateScattered() {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = SCATTER_INNER + Math.random() * (SCATTER_RADIUS - SCATTER_INNER);
      arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
      arr[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) + ROSE_CENTER_Y;
      arr[i * 3 + 2] = r * Math.cos(ph);
    }
    return arr;
  }

  function createGlowTexture() {
    const size = 64;
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const ctx = c.getContext('2d'); const half = size / 2;
    const g = ctx.createRadialGradient(half, half, 0, half, half, half);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  // ---------- 内部状态 ----------
  let overlay, canvas, scene, camera, renderer;
  let roseGroup, rosePts, roseMat, roseGeo, rosePosAttr;
  let roseTargets, scatteredTargets, curPos;
  let bgStars, bgMat, fallPts, fallGeo, fallMat, fallVel, glowTex;
  let rafId = null, running = false;
  let convergeT0 = 0, converging = true, converged = false;
  let entering = false, enterStart = 0;
  let clock = { t: 0, last: 0 };

  function buildOverlayDOM() {
    overlay = document.createElement('div');
    overlay.id = 'particle-overlay';
    overlay.innerHTML =
      '<div class="po-title">我们的小小世界</div>' +
      '<div class="po-subtitle">A little world, just for us.</div>' +
      '<button id="poEnter" class="po-enter" type="button">进 入</button>' +
      '<button id="poMusic" class="po-music" type="button" aria-label="切换音乐">♪</button>';
    document.body.appendChild(overlay);
    canvas = document.createElement('canvas');
    canvas.id = 'po-canvas';
    overlay.appendChild(canvas);
    // 把 canvas 放到内容层之下（文字按钮在上）
    overlay.insertBefore(canvas, overlay.firstChild);
  }

  function initThree() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 100);
    const camZ = (isNarrow || isMobileUA) ? 21 : 17;
    camera.position.set(0, 0.2, camZ);
    camera.lookAt(0, 0.2, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: !isLowEnd, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0a12, 1);

    glowTex = createGlowTexture();

    // 玫瑰粒子
    const roseData = generateRoseGeometry();
    roseTargets = roseData.positions;
    scatteredTargets = generateScattered();
    curPos = new Float32Array(PARTICLE_COUNT * 3);
    curPos.set(scatteredTargets);

    roseGeo = new THREE.BufferGeometry();
    rosePosAttr = new THREE.BufferAttribute(curPos, 3);
    roseGeo.setAttribute('position', rosePosAttr);
    roseGeo.setAttribute('color', new THREE.BufferAttribute(roseData.colors, 3));

    roseMat = new THREE.PointsMaterial({
      size: 0.13, map: glowTex, vertexColors: true,
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.92
    });
    rosePts = new THREE.Points(roseGeo, roseMat);
    roseGroup = new THREE.Group();
    roseGroup.add(rosePts);
    scene.add(roseGroup);

    // 背景星点
    const bgPos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 16 + Math.random() * 26;
      bgPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      bgPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      bgPos[i * 3 + 2] = r * Math.cos(ph);
    }
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    bgMat = new THREE.PointsMaterial({
      size: 0.09, map: glowTex, color: 0x556688,
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.35
    });
    bgStars = new THREE.Points(bgGeo, bgMat);
    scene.add(bgStars);

    // 缓慢飘落花瓣
    const fpPos = new Float32Array(PETAL_COUNT * 3);
    fallVel = new Float32Array(PETAL_COUNT * 3);
    const fpCol = new Float32Array(PETAL_COUNT * 3);
    fallGeo = new THREE.BufferGeometry();
    fallGeo.setAttribute('position', new THREE.BufferAttribute(fpPos, 3));
    fallGeo.setAttribute('color', new THREE.BufferAttribute(fpCol, 3));
    for (let i = 0; i < PETAL_COUNT; i++) resetPetal(i, true);
    fallMat = new THREE.PointsMaterial({
      size: 0.11, map: glowTex, vertexColors: true,
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6
    });
    fallPts = new THREE.Points(fallGeo, fallMat);
    scene.add(fallPts);

    window.addEventListener('resize', onResize);
  }

  function resetPetal(i, scatterY) {
    const ang = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 8;
    const p = fallGeo ? fallGeo.attributes.position.array : null;
    if (p) {
      p[i * 3] = Math.cos(ang) * r;
      p[i * 3 + 1] = scatterY ? (Math.random() - 0.5) * 12 : 6 + Math.random() * 4;
      p[i * 3 + 2] = Math.sin(ang) * r;
    }
    fallVel[i * 3] = (Math.random() - 0.5) * 0.15;
    fallVel[i * 3 + 1] = -(0.2 + Math.random() * 0.35);
    fallVel[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    const c = fallGeo.attributes.color.array;
    const shades = [hexToRGB('#c44a6a'), hexToRGB('#8a2535'), hexToRGB('#a83a4a')];
    const col = shades[Math.floor(Math.random() * shades.length)];
    c[i * 3] = col[0] / 255; c[i * 3 + 1] = col[1] / 255; c[i * 3 + 2] = col[2] / 255;
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function frame() {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min((now - clock.last) / 1000, 0.1);
    clock.last = now;
    clock.t += dt;
    const t = clock.t;

    // 收敛
    let factor = 1;
    if (converging) {
      const p = (now - convergeT0) / CONVERGE_MS;
      if (p >= 1) { converging = false; converged = true; factor = 1; }
      else factor = smoothstep01(p);
    }

    const arr = rosePosAttr.array;
    if (entering) {
      // 转场：外扩
      const ep = Math.min(1, (now - enterStart) / 700);
      const grow = 1 + 0.18 * smoothstep01(ep);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = scatteredTargets[i] + (roseTargets[i] - scatteredTargets[i]) * factor;
      }
      roseGroup.scale.setScalar(grow);
    } else {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = scatteredTargets[i] + (roseTargets[i] - scatteredTargets[i]) * factor;
      }
      // 呼吸
      const breathe = 1 + Math.sin(t * (Math.PI * 2) / 3.2) * 0.025;
      roseGroup.scale.setScalar(breathe);
    }
    rosePosAttr.needsUpdate = true;

    // 极慢旋转
    roseGroup.rotation.y += 0.0015;

    // 星点极缓转
    bgStars.rotation.y += dt * 0.02;

    // 飘落花瓣
    const fa = fallGeo.attributes.position.array;
    for (let i = 0; i < PETAL_COUNT; i++) {
      fa[i * 3] += fallVel[i * 3] * dt + Math.sin(t * 1.1 + i) * dt * 0.1;
      fa[i * 3 + 1] += fallVel[i * 3 + 1] * dt;
      fa[i * 3 + 2] += fallVel[i * 3 + 2] * dt + Math.cos(t * 0.9 + i) * dt * 0.08;
      if (fa[i * 3 + 1] < -8) {
        fa[i * 3] = (Math.random() - 0.5) * 12;
        fa[i * 3 + 1] = 6 + Math.random() * 4;
        fa[i * 3 + 2] = (Math.random() - 0.5) * 12;
      }
    }
    fallGeo.attributes.position.needsUpdate = true;
    fallMat.opacity = 0.5 + Math.sin(t * 2.2) * 0.12;

    renderer.render(scene, camera);
  }

  function startLoop() {
    if (running) return;
    running = true;
    clock.last = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  function stopLoop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  // ---------- 对外 ----------
  function show() {
    if (!overlay) return;
    overlay.classList.remove('po-hidden');
    overlay.style.opacity = '1';
    // 重置收敛
    converging = true; converged = false; entering = false;
    convergeT0 = performance.now();
    roseGroup.rotation.y = 0;
    roseMat.opacity = 0.92;
    roseGroup.scale.setScalar(1);
    startLoop();
  }

  function hide(onDone) {
    if (entering) return;
    entering = true; enterStart = performance.now();
    // 微增亮
    roseMat.opacity = 1.0;
    // 音乐（用户手势）
    const bg = document.getElementById('bgMusic');
    if (bg && bg.paused) {
      bg.play().then(() => window.appState && window.appState.setState({ isMusicPlaying: true })).catch(() => {});
    }
    // 外扩+淡出（800~1200ms 电影式）
    setTimeout(() => {
      overlay.style.transition = 'opacity 0.6s ease';
      overlay.style.opacity = '0';
    }, 300);
    setTimeout(() => {
      overlay.classList.add('po-hidden');
      stopLoop();
      if (window.appState) window.appState.setState({ currentStep: 1 });
      if (onDone) onDone();
    }, 1100);
  }

  function onEnterClick() { hide(); }
  function onMusicClick(e) {
    e.stopPropagation();
    const bg = document.getElementById('bgMusic');
    if (!bg) return;
    if (bg.paused) { bg.play().then(() => window.appState && window.appState.setState({ isMusicPlaying: true })).catch(() => {}); }
    else { bg.pause(); window.appState && window.appState.setState({ isMusicPlaying: false }); }
  }

  function init() {
    if (typeof THREE === 'undefined') {
      // Three 未加载：直接显示首页，不阻断
      console.warn('[particle-intro] THREE 未加载，跳过开场。');
      return;
    }
    buildOverlayDOM();
    initThree();
    overlay.querySelector('#poEnter').addEventListener('click', onEnterClick);
    overlay.querySelector('#poMusic').addEventListener('click', onMusicClick);
    show();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ParticleIntro = { show, hide };
})();
