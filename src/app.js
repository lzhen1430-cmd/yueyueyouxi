// 主应用控制器
import { initFaceMesh, startDetection, stopDetection } from './faceDetection.js';
import { setCanvas, render, updateItem, clearAll, getState } from './overlays.js';
import { categories, items, englishWords, mathQuestions, praises, encouragements } from './items.js';
import { initSpeech, speakEnglish, speakBilingual } from './speech.js';

// DOM 引用
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const loadingScreen = $('#loading-screen');
const loadingWelcome = $('#loading-welcome');
const loadingProgress = $('#loading-progress');
const loadingError = $('#loading-error');
const errorMsg = $('#error-msg');
const loadingStep = $('#loading-step');
const btnStart = $('#btn-start');
const btnRetry = $('#btn-retry');
const gameScreen = $('#game-screen');
const inputVideo = $('#input-video');
const overlayCanvas = $('#overlay-canvas');
const noFaceHint = $('#no-face-hint');
const speechBubble = $('#speech-bubble');
const speechText = $('#speech-text');
const itemSelector = $('#item-selector');
const categoryTabs = $('#category-tabs');
const quizArea = $('#quiz-area');
const quizQuestion = $('#quiz-question');
const quizOptions = $('#quiz-options');
const particlesContainer = $('#particles-container');
const photoModal = $('#photo-modal');
const photoCanvas = $('#photo-canvas');

let currentMode = 'dressup';
let currentCategory = 'hair';
let faceDetected = false;
let noFaceTimer = null;
let quizIndex = 0;
let mathScore = 0;
let cameraStream = null;
let isInitializing = false;

// ====== 启动按钮 ======

export function setupStartButton() {
  // 暴露全局函数，配合 HTML 中的 onclick 兜底
  window.__startMagic = async () => {
    if (isInitializing) return;
    await doInit();
  };

  // 同时用 addEventListener 绑定（双保险）
  if (btnStart) {
    btnStart.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isInitializing) return;
      await doInit();
    });
  }

  if (btnRetry) {
    btnRetry.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isInitializing) return;
      await doInit();
    });
  }
}

async function doInit() {
  isInitializing = true;

  try {
    // 隐藏欢迎页和错误页，显示加载进度
    if (loadingWelcome) loadingWelcome.classList.add('hidden');
    if (loadingError) loadingError.classList.add('hidden');
    if (loadingProgress) loadingProgress.classList.remove('hidden');

    // 清理旧的摄像头流
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }

    await initGame();
  } catch (err) {
    console.error('初始化失败:', err);
    if (loadingProgress) loadingProgress.classList.add('hidden');
    if (loadingError) loadingError.classList.remove('hidden');
    const msg = err.name === 'NotAllowedError'
      ? '摄像头权限被拒绝了，请在 iPad 设置 > Safari > 摄像头 中允许访问'
      : err.name === 'NotFoundError'
        ? '找不到摄像头设备'
        : err.message || '未知错误，请刷新页面重试';
    if (errorMsg) errorMsg.textContent = msg;
  } finally {
    isInitializing = false;
  }
}

async function initGame() {
  // Step 1: 摄像头 (需要用户手势上下文)
  loadingStep.textContent = '正在请求摄像头...';
  await setupCamera();

  // Step 2: Canvas
  loadingStep.textContent = '正在准备画布...';
  setupCanvas();

  // Step 3: 加载面部识别 AI
  loadingStep.textContent = '正在加载魔法识别...';
  await initFaceMesh(inputVideo, onFaceResults);

  // Step 4: 开始检测
  loadingStep.textContent = '魔法就绪！';
  await startDetection(inputVideo);

  // Step 5: 初始化 UI
  initUI();

  // 隐藏加载画面
  loadingScreen.classList.add('fade-out');
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
  }, 600);

  // 预初始化语音
  initSpeech();

  // 欢迎语
  setTimeout(() => {
    showBubble('欢迎来到魔法装扮屋！选一个喜欢的发型吧~', 3000);
    speakBilingual('Welcome!', '欢迎来到魔法装扮屋！');
  }, 1200);
}

// ====== 摄像头 ======

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 }
    },
    audio: false
  });

  cameraStream = stream;
  inputVideo.srcObject = stream;
  await inputVideo.play();
}

// ====== Canvas ======

function setupCanvas() {
  function doResize() {
    const vw = inputVideo.videoWidth;
    const vh = inputVideo.videoHeight;
    if (!vw || !vh) return;

    const maxW = window.innerWidth;
    const scale = maxW / vw;

    overlayCanvas.width = vw;
    overlayCanvas.height = vh;
    overlayCanvas.style.width = maxW + 'px';
    overlayCanvas.style.height = (vh * scale) + 'px';

    setCanvas(overlayCanvas);
  }

  // loadedmetadata 可能已在 setupCamera 的 play() 期间触发过
  if (inputVideo.videoWidth > 0) {
    doResize();
  } else {
    inputVideo.addEventListener('loadedmetadata', doResize, { once: true });
  }
}

// ====== Face Mesh 回调 ======

function onFaceResults(landmarks, videoWidth, videoHeight) {
  if (landmarks) {
    if (!faceDetected) {
      faceDetected = true;
      noFaceHint.classList.add('hidden');
      clearTimeout(noFaceTimer);
    }
    // 确保 canvas 已初始化
    if (!overlayCanvas.width || overlayCanvas.width === 300) {
      const vw = videoWidth || inputVideo.videoWidth;
      const vh = videoHeight || inputVideo.videoHeight;
      if (vw && vh) {
        overlayCanvas.width = vw;
        overlayCanvas.height = vh;
        overlayCanvas.style.width = window.innerWidth + 'px';
        overlayCanvas.style.height = (vh * window.innerWidth / vw) + 'px';
        setCanvas(overlayCanvas);
      }
    }
    render(landmarks, videoWidth || overlayCanvas.width, videoHeight || overlayCanvas.height);
  } else {
    if (faceDetected) {
      faceDetected = false;
      noFaceTimer = setTimeout(() => {
        noFaceHint.classList.remove('hidden');
      }, 1000);
    }
    render(null, videoWidth || overlayCanvas.width, videoHeight || overlayCanvas.height);
  }
}

// ====== UI 初始化 ======

function initUI() {
  // 模式切换
  $$('#mode-tabs .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
  });

  // 分类切换
  $$('#category-tabs .cat-btn').forEach(btn => {
    btn.addEventListener('click', () => switchCategory(btn.dataset.cat));
  });

  // 拍照按钮
  $('#btn-close-photo').addEventListener('click', closePhoto);
  $('#btn-save-photo').addEventListener('click', savePhoto);

  // 初始加载装扮模式
  renderItemSelector();
}

// ====== 模式切换 ======

function switchMode(mode) {
  currentMode = mode;

  // 更新模式按钮
  $$('#mode-tabs .mode-btn').forEach(b => b.classList.remove('active'));
  $(`#mode-tabs .mode-btn[data-mode="${mode}"]`)?.classList.add('active');

  // 显示/隐藏对应面板
  const isDressUp = mode === 'dressup';
  categoryTabs.style.display = isDressUp ? 'flex' : 'none';
  itemSelector.style.display = isDressUp ? 'flex' : 'none';
  quizArea.classList.toggle('hidden', mode === 'dressup' || mode === 'photo');

  if (mode === 'english') {
    showEnglishQuiz();
  } else if (mode === 'math') {
    showMathQuiz();
  } else if (mode === 'photo') {
    takePhoto();
  } else if (mode === 'dressup') {
    renderItemSelector();
    showBubble('换一套漂亮的装扮吧~', 2000);
  }
}

function switchCategory(cat) {
  currentCategory = cat;
  $$('#category-tabs .cat-btn').forEach(b => b.classList.remove('active'));
  $(`#category-tabs .cat-btn[data-cat="${cat}"]`)?.classList.add('active');
  renderItemSelector();
}

// ====== 装扮物品选择器 ======

function renderItemSelector() {
  if (currentMode !== 'dressup') return;

  itemSelector.innerHTML = '';
  const catItems = items[currentCategory] || [];

  catItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'item-btn';
    btn.innerHTML = `<span class="item-emoji">${item.emoji}</span><span class="item-name">${item.name}</span>`;

    // 检查是否已选中
    const state = getState();
    if (state[currentCategory] && state[currentCategory].id === item.id) {
      btn.classList.add('selected');
    }

    btn.addEventListener('click', () => {
      updateItem(currentCategory, item);
      renderItemSelector();

      // 播放音效反馈
      const soundName = item.name || '';
      if (item.color) {
        showSparkles();
        showBubble(`选了 ${soundName}~ 好看！`, 2000);
        // 英语模式下说颜色
        speakEnglish(findEnglishForItem(item));
      } else {
        showBubble(`已经 ${soundName} 啦~`, 1500);
      }
    });

    itemSelector.appendChild(btn);
  });
}

function findEnglishForItem(item) {
  // 根据物品颜色找到对应英语单词
  const colorMap = {
    '#ff6b8a': 'pink',
    '#e63946': 'red',
    '#ff7f50': 'orange',
    '#c77dff': 'purple',
    '#3d1c02': 'brown',
    '#5c2e00': 'brown',
    '#c8882a': 'blonde',
    '#ffb3c6': 'pink',
    '#a8d8ea': 'blue',
    '#ffe5a0': 'yellow',
    '#d4b8ff': 'purple',
    '#ff85a2': 'pink',
    '#ffd700': 'gold'
  };

  if (item.color && colorMap[item.color]) {
    return colorMap[item.color];
  }
  return item.name || 'pretty';
}

// ====== 英语学习 ======

function showEnglishQuiz() {
  const word = englishWords[Math.floor(Math.random() * englishWords.length)];

  quizArea.classList.remove('hidden');
  quizQuestion.innerHTML = `
    <div class="quiz-word-big" style="color: ${word.color}">${word.word}</div>
    <div class="quiz-word-cn">${word.chinese}</div>
    <div class="quiz-word-emoji">${word.emoji}</div>
  `;

  // 朗读
  speakEnglish(word.word);
  showBubble(`跟我读: ${word.word} (${word.chinese})`, 3000);

  // 点击气泡重新朗读
  speechBubble.onclick = () => {
    speakEnglish(word.word);
  };
}

// ====== 数学学习 ======

function showMathQuiz() {
  const q = mathQuestions[quizIndex % mathQuestions.length];

  quizArea.classList.remove('hidden');
  quizQuestion.innerHTML = `
    <div class="quiz-math-q">${q.question}</div>
  `;

  quizOptions.innerHTML = '';
  // 随机打乱选项
  const shuffled = [...q.options].sort(() => Math.random() - 0.5);

  shuffled.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      if (opt === q.answer) {
        mathScore++;
        const praise = praises[Math.floor(Math.random() * praises.length)];
        showBubble(`${praise.cn} ⭐`, 2500);
        speakBilingual(praise.en, praise.cn);
        spawnEmoji('⭐', 5);
        showSparkles();
      } else {
        const encourage = encouragements[Math.floor(Math.random() * encouragements.length)];
        showBubble(encourage.cn, 2000);
        speakBilingual(encourage.en, encourage.cn);
      }
      quizIndex++;
      setTimeout(() => showMathQuiz(), 2000);
    });
    quizOptions.appendChild(btn);
  });
}

// ====== 拍照 ======

function takePhoto() {
  // 将视频+叠加层合成一张照片（镜像翻转为自拍视角）
  const w = inputVideo.videoWidth;
  const h = inputVideo.videoHeight;

  photoCanvas.width = w;
  photoCanvas.height = h;
  const pctx = photoCanvas.getContext('2d');

  // overlay 层现在不内部镜像，拍照时统一镜像视频+overlay
  pctx.save();
  pctx.translate(w, 0);
  pctx.scale(-1, 1);
  pctx.drawImage(inputVideo, 0, 0, w, h);
  pctx.drawImage(overlayCanvas, 0, 0, w, h);
  pctx.restore();

  // 显示弹窗
  photoModal.classList.remove('hidden');
  showBubble('拍好啦！可以保存照片哦~', 2000);
}

function closePhoto() {
  photoModal.classList.add('hidden');
  switchMode('dressup');
}

function savePhoto() {
  const link = document.createElement('a');
  link.download = `yueyue-photo-${Date.now()}.png`;
  link.href = photoCanvas.toDataURL('image/png');
  link.click();
  showBubble('照片保存成功！📸', 2000);
}

// ====== 特效 ======

function showBubble(text, duration = 2000) {
  speechBubble.classList.remove('hidden');
  speechText.textContent = text;

  clearTimeout(showBubble._timer);
  showBubble._timer = setTimeout(() => {
    speechBubble.classList.add('hidden');
  }, duration);

  // 重置点击事件 (英语模式下点击重读)
  if (currentMode !== 'english') {
    speechBubble.onclick = null;
  }
}

function showSparkles() {
  const colors = ['#ff6b8a', '#ffd700', '#ff85a2', '#b388eb', '#7ec8e3', '#ffb3c6'];
  const container = particlesContainer;

  for (let i = 0; i < 15; i++) {
    const sparkle = document.createElement('span');
    sparkle.className = 'sparkle';
    sparkle.textContent = ['✨', '⭐', '💖', '🌟', '💫'][Math.floor(Math.random() * 5)];
    sparkle.style.left = Math.random() * 90 + '%';
    sparkle.style.top = Math.random() * 40 + 30 + '%';
    sparkle.style.fontSize = (Math.random() * 20 + 15) + 'px';
    sparkle.style.animationDuration = (Math.random() * 1.5 + 1) + 's';
    sparkle.style.animationDelay = Math.random() * 0.3 + 's';

    container.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 2500);
  }
}

function spawnEmoji(emoji, count) {
  const container = particlesContainer;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'sparkle emoji-rain';
    el.textContent = emoji;
    el.style.left = Math.random() * 80 + 10 + '%';
    el.style.top = '20%';
    el.style.fontSize = (Math.random() * 24 + 20) + 'px';
    el.style.animationDuration = (Math.random() * 1 + 1.5) + 's';

    container.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}

// ====== 窗口大小调整 ======

window.addEventListener('resize', () => {
  if (inputVideo.videoWidth) {
    const vw = inputVideo.videoWidth;
    const vh = inputVideo.videoHeight;
    const maxW = window.innerWidth;
    const scale = maxW / vw;

    overlayCanvas.style.width = maxW + 'px';
    overlayCanvas.style.height = (vh * scale) + 'px';
  }
});
