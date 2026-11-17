const previewVideo = document.getElementById('previewVideo');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const videoEnter = document.getElementById('videoEnter');
const enterButton = document.getElementById('enterButton');
const infoButton = document.getElementById('infoButton');
const infoDialog = document.getElementById('infoDialog');
const closeInfo = document.getElementById('closeInfo');

const playerView = document.getElementById('playerView');
const sceneType = document.getElementById('sceneType');
const sceneTitle = document.getElementById('sceneTitle');
const exitButton = document.getElementById('exitButton');
const mainVideo = document.getElementById('mainVideo');
const secondaryVideo = document.getElementById('secondaryVideo');
const weaveCanvas = document.getElementById('weaveCanvas');
const videoShell = document.getElementById('videoShell');
const hotspotLayer = document.getElementById('hotspotLayer');
const hotspotButton = document.getElementById('hotspotButton');
const hotspotLabel = document.getElementById('hotspotLabel');
const instructionCard = document.getElementById('instructionCard');
const statusText = document.getElementById('statusText');
const weaveText = document.getElementById('weaveText');
const mainMusic = document.getElementById('mainMusic');
const weaveMusic = document.getElementById('weaveMusic');
mainMusic.volume = 0;
weaveMusic.volume = 0;

const PREVIEW_VIDEOS = [
  'assets/videos/Core_C4D.mp4',
  'assets/videos/Baroque_C4D.mp4',
  'assets/videos/Dopamine_C4D.mp4',
  'assets/videos/Wabisabi_C4D.mp4'
];

const SCENES = {
  core_c4d: {
    kind: 'c4d',
    title: 'Core Self',
    eyebrow: 'CURRENT SPACE',
    video: 'assets/videos/Core_C4D.mp4',
    exit: { action: 'landing' },
    cues: [
      { time: 8.0, label: 'Mirror · Enter Baroque Persona', next: 'baroque_c4d', box: { x: 44, y: 13, w: 17, h: 28 } },
      { time: 21.0, label: 'Lamp · Enter Dopamine Persona', next: 'dopamine_c4d', box: { x: 4, y: 44, w: 21, h: 29 } },
      { time: 28.0, label: 'Teapot · Enter Wabi-sabi Persona', next: 'wabisabi_c4d', box: { x: 46.5, y: 53.3, w: 9, h: 11 } },
      { time: 30.0, label: 'Yellow Shelf · Enter Core AIGC', next: 'core_aigc', box: { x: 67.5, y: 7, w: 17.5, h: 28 } }
    ]
  },
  baroque_c4d: {
    kind: 'c4d',
    title: 'Baroque Persona',
    eyebrow: 'BAROQUE PERSONA',
    video: 'assets/videos/Baroque_C4D.mp4',
    exit: { scene: 'core_c4d', time: 9.0 },
    cues: [
      { time: 12.0, label: 'Fireplace · Enter Baroque AIGC', next: 'baroque_aigc', box: { x: 34, y: 43, w: 31, h: 31 } }
    ]
  },
  baroque_aigc: {
    kind: 'aigc',
    title: 'Baroque Persona',
    eyebrow: 'BAROQUE PERSONA',
    video: 'assets/videos/Baroque_AIGC.mp4',
    tdVideo: 'assets/videos/Baroque_TD.mp4',
    exit: { scene: 'baroque_c4d', time: 13.0 },
    prompt: 'Click anywhere to weave the full frame. Each click increases the weave density.'
  },
  dopamine_c4d: {
    kind: 'c4d',
    title: 'Dopamine Persona',
    eyebrow: 'DOPAMINE PERSONA',
    video: 'assets/videos/Dopamine_C4D.mp4',
    exit: { scene: 'core_c4d', time: 22.0 },
    cues: [
      { time: 25.0, label: 'Shower · Enter Dopamine AIGC', next: 'dopamine_aigc', box: { x: 35, y: 10, w: 22, h: 58 } }
    ]
  },
  dopamine_aigc: {
    kind: 'aigc',
    title: 'Dopamine Persona',
    eyebrow: 'DOPAMINE PERSONA',
    video: 'assets/videos/Dopamine_AIGC.mp4',
    tdVideo: 'assets/videos/Dopamine_TD.mp4',
    exit: { scene: 'dopamine_c4d', time: 26.0 },
    prompt: 'Click anywhere to weave the full frame. Each click increases the weave density.'
  },
  wabisabi_c4d: {
    kind: 'c4d',
    title: 'Wabi-sabi Persona',
    eyebrow: 'WABI-SABI PERSONA',
    video: 'assets/videos/Wabisabi_C4D.mp4',
    exit: { scene: 'core_c4d', time: 29.0 },
    cues: [
      { time: 8.0, label: 'Yellow Jar · Enter Wabi-sabi AIGC', next: 'wabisabi_aigc', box: { x: 44, y: 54, w: 8.5, h: 12 } }
    ]
  },
  wabisabi_aigc: {
    kind: 'aigc',
    title: 'Wabi-sabi Persona',
    eyebrow: 'WABI-SABI PERSONA',
    video: 'assets/videos/Wabisabi_AIGC.mp4',
    tdVideo: 'assets/videos/Wabisabi_TD.mp4',
    exit: { scene: 'wabisabi_c4d', time: 9.0 },
    prompt: 'Click anywhere to weave the full frame. Each click increases the weave density.'
  },
  core_aigc: {
    kind: 'aigc',
    title: 'Core Self',
    eyebrow: 'CORE SELF',
    video: 'assets/videos/Core_AIGC.mp4',
    tdVideo: 'assets/videos/Core_TD.mp4',
    exit: { scene: 'core_c4d', time: 30.5 },
    prompt: 'Click anywhere to weave the full frame. Each click increases the weave density.'
  }
};

let previewTimer = null;
let currentSceneId = null;
let currentCue = null;
let firedCueIndexes = new Set();
let pauseHandled = false;
let weaveActive = false;
let weaveLevel = 0;
let weavePattern = null;
let renderRaf = null;
let enteringToken = 0;
let lastWeaveClickAt = 0;
let audioFadeToken = 0;
const MAX_WEAVE_LEVEL = 6;
const MIN_WEAVE_CLICK_INTERVAL = 300;
const MAIN_MUSIC_VOLUME = 0.48;
const WEAVE_MUSIC_VOLUME = 0.88;
const AUDIO_CROSSFADE_MS = 850;

function switchMusic(mode) {
  const target = mode === 'weave' ? weaveMusic : mainMusic;
  const other = mode === 'weave' ? mainMusic : weaveMusic;
  const targetVolume = mode === 'weave' ? WEAVE_MUSIC_VOLUME : MAIN_MUSIC_VOLUME;
  const token = ++audioFadeToken;

  // Audio playback is initiated only after the visitor's first click on Enter.
  target.play().catch(() => {
    statusText.textContent = 'Click once more to enable audio playback.';
  });

  const targetStart = target.volume;
  const otherStart = other.volume;
  const startTime = performance.now();
  const fadeFrame = (now) => {
    if (token !== audioFadeToken) return;
    const progress = Math.min(1, (now - startTime) / AUDIO_CROSSFADE_MS);
    const eased = progress * progress * (3 - 2 * progress);
    target.volume = targetStart + (targetVolume - targetStart) * eased;
    other.volume = otherStart * (1 - eased);
    if (progress < 1) {
      requestAnimationFrame(fadeFrame);
    } else {
      other.pause();
      other.volume = 0;
    }
  };
  requestAnimationFrame(fadeFrame);
}

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function schedulePreview() {
  clearTimeout(previewTimer);
  const src = randomChoice(PREVIEW_VIDEOS);
  previewVideo.src = src;
  previewVideo.muted = true;
  previewVideo.loop = false;
  previewVideo.load();
  previewVideo.onloadedmetadata = async () => {
    const duration = Number.isFinite(previewVideo.duration) ? previewVideo.duration : 4;
    const span = 3 + Math.random() * 3;
    const start = Math.max(0, Math.random() * Math.max(0.01, duration - span - 0.1));
    try {
      previewVideo.currentTime = start;
      await previewVideo.play();
      previewPlaceholder.style.display = 'none';
      previewTimer = setTimeout(schedulePreview, span * 1000);
    } catch (err) {
      previewTimer = setTimeout(schedulePreview, 1000);
    }
  };
}

function openPlayer() {
  document.getElementById('home').style.display = 'none';
  playerView.classList.add('is-open');
  playerView.setAttribute('aria-hidden', 'false');
  clearTimeout(previewTimer);
  previewVideo.pause();
  switchMusic('main');
  loadScene('core_c4d', 0);
}

function returnToLanding() {
  stopWeave();
  switchMusic('main');
  hideHotspot();
  mainVideo.pause();
  secondaryVideo.pause();
  playerView.classList.remove('is-open');
  playerView.setAttribute('aria-hidden', 'true');
  document.getElementById('home').style.display = 'flex';
  schedulePreview();
}

function waitForMetadata(video) {
  if (video.readyState >= 1) return Promise.resolve();
  return new Promise((resolve) => video.addEventListener('loadedmetadata', resolve, { once: true }));
}

async function loadScene(sceneId, startTime = 0) {
  const token = ++enteringToken;
  stopWeave();
  hideHotspot();
  currentCue = null;
  const scene = SCENES[sceneId];
  currentSceneId = sceneId;
  switchMusic('main');
  sceneType.textContent = scene.eyebrow;
  sceneTitle.textContent = scene.title;
  statusText.textContent = `Entering ${scene.title}.`;
  weaveText.textContent = 'Weave density: 0 / 6';
  instructionCard.classList.remove('is-visible');
  mainVideo.pause();
  secondaryVideo.pause();
  mainVideo.playbackRate = 1;
  mainVideo.loop = scene.kind === 'aigc';
  mainVideo.src = scene.video;
  mainVideo.load();

  if (scene.kind === 'aigc') {
    secondaryVideo.src = scene.tdVideo;
    secondaryVideo.loop = true;
    secondaryVideo.playbackRate = 1;
    secondaryVideo.load();
    lastWeaveClickAt = 0;
  }

  firedCueIndexes = new Set();
  if (scene.kind === 'c4d' && scene.cues?.length) {
    scene.cues.forEach((cue, index) => {
      if (cue.time < startTime - 0.02) firedCueIndexes.add(index);
    });
  }

  try {
    await waitForMetadata(mainVideo);
    if (scene.kind === 'aigc') await waitForMetadata(secondaryVideo);
    if (token !== enteringToken) return;

    mainVideo.currentTime = Math.max(0, startTime);
    if (scene.kind === 'aigc') {
      secondaryVideo.currentTime = 0;
      // Match the two clips by normalised progress so their loops remain aligned
      // even though the AIGC and TD source videos have different durations.
      const durationRatio = secondaryVideo.duration / mainVideo.duration;
      secondaryVideo.playbackRate = Number.isFinite(durationRatio)
        ? Math.min(1.5, Math.max(0.5, durationRatio))
        : 1;
      await Promise.all([mainVideo.play(), secondaryVideo.play()]);
      showInstruction(scene.prompt || 'Click to start weaving.');
    } else {
      await mainVideo.play();
    }
  } catch (e) {
    if (token === enteringToken) statusText.textContent = 'Autoplay blocked. Click the video to continue.';
  }
}

function showInstruction(text) {
  instructionCard.textContent = text;
  instructionCard.classList.add('is-visible');
}

function hideInstruction() {
  instructionCard.classList.remove('is-visible');
}

function showHotspot(cue) {
  currentCue = cue;
  hideInstruction();
  hotspotLayer.classList.add('is-visible');
  hotspotButton.style.left = `${cue.box.x}%`;
  hotspotButton.style.top = `${cue.box.y}%`;
  hotspotButton.style.width = `${cue.box.w}%`;
  hotspotButton.style.height = `${cue.box.h}%`;
  hotspotLabel.textContent = cue.label;
  statusText.textContent = `Object recognised. Click the framed object to continue.`;
}

function hideHotspot() {
  hotspotLayer.classList.remove('is-visible');
  currentCue = null;
}

mainVideo.addEventListener('timeupdate', () => {
  const scene = SCENES[currentSceneId];
  if (!scene || scene.kind !== 'c4d' || currentCue) return;
  scene.cues?.forEach((cue, index) => {
    if (!firedCueIndexes.has(index) && mainVideo.currentTime >= cue.time) {
      firedCueIndexes.add(index);
      mainVideo.pause();
      showHotspot(cue);
    }
  });
});

mainVideo.addEventListener('ended', () => {
  const scene = SCENES[currentSceneId];
  if (scene?.kind === 'c4d') {
    statusText.textContent = 'End of sequence. Use Exit to go back.';
  }
});

hotspotButton.addEventListener('click', () => {
  if (!currentCue) return;
  loadScene(currentCue.next, 0);
});

function resizeCanvas() {
  const rect = videoShell.getBoundingClientRect();
  // Cap DPR to keep full-screen compositing responsive and avoid excessive redraw cost.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  weaveCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
  weaveCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  weaveCanvas.style.width = `${rect.width}px`;
  weaveCanvas.style.height = `${rect.height}px`;
  const ctx = weaveCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}
window.addEventListener('resize', resizeCanvas);

function makeUnevenBands(count) {
  // Uneven widths create a tactile, hand-woven rhythm while covering the full frame.
  const weights = Array.from({ length: count }, () => 0.82 + Math.random() * 0.58);
  const total = weights.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  return weights.map((weight) => {
    const size = weight / total;
    const band = { start: cursor, size };
    cursor += size;
    return band;
  });
}

function generatePattern(level) {
  // Each click adds more warp and weft bands across the entire screen.
  const count = 2 + level * 2;
  return {
    columns: makeUnevenBands(count),
    rows: makeUnevenBands(count)
  };
}

function stopWeave() {
  weaveActive = false;
  weaveLevel = 0;
  weavePattern = null;
  weaveCanvas.classList.remove('is-active');
  cancelAnimationFrame(renderRaf);
  renderRaf = null;
  const ctx = weaveCanvas.getContext('2d');
  ctx.clearRect(0, 0, weaveCanvas.width, weaveCanvas.height);
  weaveText.textContent = 'Weave density: 0 / 6';
}

function getCoverCrop(video, targetWidth, targetHeight) {
  const sourceWidth = video.videoWidth || targetWidth;
  const sourceHeight = video.videoHeight || targetHeight;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;
  if (sourceRatio > targetRatio) {
    const cropWidth = sourceHeight * targetRatio;
    return { x: (sourceWidth - cropWidth) / 2, y: 0, width: cropWidth, height: sourceHeight };
  }
  const cropHeight = sourceWidth / targetRatio;
  return { x: 0, y: (sourceHeight - cropHeight) / 2, width: sourceWidth, height: cropHeight };
}

function renderWeave() {
  if (!weaveActive || !weavePattern) return;
  const ctx = weaveCanvas.getContext('2d');
  const w = weaveCanvas.width;
  const h = weaveCanvas.height;
  const aReady = mainVideo.readyState >= 2;
  const bReady = secondaryVideo.readyState >= 2;
  if (!aReady || !bReady) {
    renderRaf = requestAnimationFrame(renderWeave);
    return;
  }

  ctx.clearRect(0, 0, w, h);
  const cropA = getCoverCrop(mainVideo, w, h);
  const cropB = getCoverCrop(secondaryVideo, w, h);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const edge = Math.max(2.5 * dpr, 1.25);
  const { rows, columns } = weavePattern;

  // First lay down the TD image as vertical warp strips across the whole frame.
  columns.forEach((column) => {
    const sourceX = cropB.x + column.start * cropB.width;
    const sourceW = column.size * cropB.width;
    ctx.drawImage(
      secondaryVideo,
      sourceX, cropB.y, Math.max(1, sourceW), Math.max(1, cropB.height),
      column.start * w, 0, column.size * w, h
    );
  });

  // Then pass AIGC horizontal weft strips over alternating intersections.
  // The opposite intersections remain TD, producing a continuous over-under weave.
  rows.forEach((row, rowIndex) => {
    columns.forEach((column, columnIndex) => {
      const horizontalIsOnTop = (rowIndex + columnIndex) % 2 === 0;
      if (!horizontalIsOnTop) return;
      const sourceX = cropA.x + column.start * cropA.width;
      const sourceY = cropA.y + row.start * cropA.height;
      const sourceW = column.size * cropA.width;
      const sourceH = row.size * cropA.height;
      const x = column.start * w;
      const y = row.start * h;
      const cellW = column.size * w;
      const cellH = row.size * h;
      ctx.drawImage(
        mainVideo,
        sourceX, sourceY, Math.max(1, sourceW), Math.max(1, sourceH),
        x, y, cellW, cellH
      );

      // Small highlights and shadows make the over-under crossings readable.
      const shade = ctx.createLinearGradient(0, y, 0, y + edge * 2.4);
      shade.addColorStop(0, 'rgba(10, 7, 15, 0.28)');
      shade.addColorStop(1, 'rgba(10, 7, 15, 0)');
      ctx.fillStyle = shade;
      ctx.fillRect(x, y, cellW, edge * 2.4);
      const highlight = ctx.createLinearGradient(0, y + cellH - edge * 1.8, 0, y + cellH);
      highlight.addColorStop(0, 'rgba(255,255,255,0)');
      highlight.addColorStop(1, 'rgba(255,255,255,0.22)');
      ctx.fillStyle = highlight;
      ctx.fillRect(x, y + cellH - edge * 1.8, cellW, edge * 1.8);
    });
  });

  // Add a restrained bevel to TD strips at crossings where TD passes over AIGC.
  columns.forEach((column, columnIndex) => {
    rows.forEach((row, rowIndex) => {
      if ((rowIndex + columnIndex) % 2 === 0) return;
      const x = column.start * w;
      const y = row.start * h;
      const cellW = column.size * w;
      const cellH = row.size * h;
      const shade = ctx.createLinearGradient(x, 0, x + edge * 2.2, 0);
      shade.addColorStop(0, 'rgba(10, 7, 15, 0.26)');
      shade.addColorStop(1, 'rgba(10, 7, 15, 0)');
      ctx.fillStyle = shade;
      ctx.fillRect(x, y, edge * 2.2, cellH);
      const highlight = ctx.createLinearGradient(x + cellW - edge * 1.8, 0, x + cellW, 0);
      highlight.addColorStop(0, 'rgba(255,255,255,0)');
      highlight.addColorStop(1, 'rgba(255,255,255,0.20)');
      ctx.fillStyle = highlight;
      ctx.fillRect(x + cellW - edge * 1.8, y, edge * 1.8, cellH);
    });
  });

  renderRaf = requestAnimationFrame(renderWeave);
}

function updateWeaveReadout() {
  weaveText.textContent = `Weave density: ${weaveLevel} / ${MAX_WEAVE_LEVEL}`;
}

function increaseWeave() {
  const scene = SCENES[currentSceneId];
  if (!scene || scene.kind !== 'aigc') return;

  const now = performance.now();
  if (lastWeaveClickAt && now - lastWeaveClickAt < MIN_WEAVE_CLICK_INTERVAL) return;
  lastWeaveClickAt = now;

  if (weaveLevel >= MAX_WEAVE_LEVEL) {
    statusText.textContent = 'Maximum weave density reached.';
    showInstruction('The weave is fully developed. Exit to return to the space.');
    return;
  }

  weaveLevel += 1;
  weavePattern = generatePattern(weaveLevel);
  weaveActive = true;
  weaveCanvas.classList.add('is-active');
  resizeCanvas();
  if (!renderRaf) renderWeave();
  if (weaveLevel === 1) switchMusic('weave');

  updateWeaveReadout();
  statusText.textContent = `Full-frame weave · Density ${weaveLevel}/${MAX_WEAVE_LEVEL}`;
  showInstruction(weaveLevel === MAX_WEAVE_LEVEL
    ? 'Maximum density reached.'
    : 'Click anywhere again to increase the weave density.');
}

videoShell.addEventListener('click', (event) => {
  const scene = SCENES[currentSceneId];
  if (!scene) return;
  if (event.target.closest('.hotspot')) return;
  if (scene.kind === 'aigc') {
    increaseWeave();
  }
});

exitButton.addEventListener('click', () => {
  const scene = SCENES[currentSceneId];
  if (!scene) return;
  if (scene.exit?.action === 'landing') {
    returnToLanding();
  } else if (scene.exit?.scene) {
    loadScene(scene.exit.scene, scene.exit.time || 0);
  }
});

videoEnter.addEventListener('click', openPlayer);
enterButton.addEventListener('click', openPlayer);
infoButton.addEventListener('click', () => infoDialog.showModal());
closeInfo.addEventListener('click', () => infoDialog.close());
infoDialog.addEventListener('click', (event) => {
  if (event.target === infoDialog) infoDialog.close();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && playerView.classList.contains('is-open')) {
    exitButton.click();
  }
});

schedulePreview();
