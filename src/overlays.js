// Canvas 叠加渲染模块
// 在面部关键点上绘制装扮效果（不再做 Canvas 层镜像，统一由 CSS mirror-wrapper 处理）

// ---- 关键点索引 (Face Mesh 478 landmarks) ----
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

const FOREHEAD = 10;
const FOREHEAD_TOP = 9;    // 额头最高点
const CHIN = 152;
const LEFT_CHEEK = 50;
const RIGHT_CHEEK = 280;
const LEFT_EAR = 234;
const RIGHT_EAR = 454;
const LEFT_TEMPLE = 54;
const RIGHT_TEMPLE = 284;
const LEFT_EYE_CENTER = 33;
const RIGHT_EYE_CENTER = 263;
const LEFT_EYE_OUTER = 130;
const RIGHT_EYE_OUTER = 359;
const LEFT_EYEBROW = 105;
const RIGHT_EYEBROW = 334;
const NOSE_TIP = 1;
const NOSE_BRIDGE = 168;
const MOUTH_CENTER = 13;

let ctx = null;
let canvas = null;

const currentState = {
  hair: null,
  lipstick: null,
  blush: null,
  dress: null,
  accessory: null
};

export function setCanvas(c) {
  canvas = c;
  ctx = canvas.getContext('2d');
}

export function getState() {
  return currentState;
}

export function updateItem(category, item) {
  currentState[category] = item;
}

export function clearAll() {
  Object.keys(currentState).forEach(k => currentState[k] = null);
}

// ---- 辅助函数 ----

// 将归一化关键点转为 canvas 像素坐标（不做镜像）
function makePtFn(landmarks, w, h) {
  return (idx) => {
    const lm = landmarks[idx];
    return { x: lm.x * w, y: lm.y * h };
  };
}

// 变深一个颜色
function darken(hex, factor = 0.25) {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - factor;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

// 变亮一个颜色
function lighten(hex, factor = 0.3) {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * factor))},${Math.min(255, Math.round(g + (255 - g) * factor))},${Math.min(255, Math.round(b + (255 - b) * factor))})`;
}

// ---- 主渲染入口 ----
export function render(landmarks, videoWidth, videoHeight) {
  if (!ctx || !canvas) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  if (!landmarks) return;

  const pt = makePtFn(landmarks, w, h);

  // 绘制顺序: 裙子 -> 口红 -> 腮红 -> 发型 -> 配饰
  renderDress(landmarks, pt);
  renderLipstick(landmarks, pt);
  renderBlush(landmarks, pt);
  renderHair(landmarks, pt);
  renderAccessory(landmarks, pt);
}

// ==================== 口红渲染 ====================
function renderLipstick(landmarks, pt) {
  const item = currentState.lipstick;
  if (!item || !item.color) return;

  ctx.save();

  // 构建完整唇形路径
  ctx.beginPath();
  const first = pt(LIPS_OUTER[0]);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < LIPS_OUTER.length; i++) {
    const p = pt(LIPS_OUTER[i]);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();

  // 多层渲染让口红更自然
  // 第一层: multiply 混合，模拟真实唇色融合
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = item.color;
  ctx.fill();

  // 第二层: 叠加一点原色增加饱和度
  ctx.globalCompositeOperation = 'saturation';
  ctx.globalAlpha = 0.25;
  ctx.fill();

  // 第三层: 柔光提亮
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = lighten(item.color, 0.5);
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  // 唇线描边
  ctx.strokeStyle = darken(item.color, 0.3);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 下唇光泽高光
  const lipCenter = pt(MOUTH_CENTER);
  const lipLeft = pt(LIPS_OUTER[0]);
  const lipRight = pt(LIPS_OUTER[10]);
  const lipWidth = Math.abs(lipRight.x - lipLeft.x);

  const glossGrad = ctx.createRadialGradient(
    lipCenter.x, lipCenter.y - 2, lipWidth * 0.02,
    lipCenter.x, lipCenter.y - 1, lipWidth * 0.2
  );
  glossGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
  glossGrad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  glossGrad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = glossGrad;
  ctx.beginPath();
  ctx.ellipse(lipCenter.x, lipCenter.y + 1, lipWidth * 0.18, lipWidth * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ==================== 腮红渲染 ====================
function renderBlush(landmarks, pt) {
  const item = currentState.blush;
  if (!item || !item.color) return;

  const leftCheek = pt(LEFT_CHEEK);
  const rightCheek = pt(RIGHT_CHEEK);
  const nose = pt(NOSE_TIP);
  const faceWidth = Math.abs(pt(RIGHT_CHEEK).x - pt(LEFT_CHEEK).x);

  const cheekR = faceWidth * 0.18;
  const offsetX = faceWidth * 0.12;
  const offsetY = cheekR * 0.4;

  function drawCheekBlush(cx, cy, r) {
    // 径向渐变: 中心浓、边缘淡，模拟真实腮红
    const grad = ctx.createRadialGradient(cx, cy, r * 0.05, cx, cy, r);
    grad.addColorStop(0, item.color);
    grad.addColorStop(0.6, item.color.replace(/[\d.]+\)$/, '0.15)'));
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    // 椭圆形更自然
    ctx.ellipse(cx, cy, r * 1.5, r * 0.9, -0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  // 左脸颊
  drawCheekBlush(leftCheek.x + offsetX, leftCheek.y - offsetY, cheekR);
  // 右脸颊
  drawCheekBlush(rightCheek.x - offsetX, rightCheek.y - offsetY, cheekR);

  // 鼻梁处轻微扫过（增加可爱感）
  const noseGrad = ctx.createRadialGradient(nose.x, nose.y, 1, nose.x, nose.y, cheekR * 0.5);
  noseGrad.addColorStop(0, item.color.replace(/[\d.]+\)$/, '0.08)'));
  noseGrad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = noseGrad;
  ctx.beginPath();
  ctx.ellipse(nose.x, nose.y + 5, cheekR * 0.6, cheekR * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ==================== 发型渲染 ====================
function renderHair(landmarks, pt) {
  const item = currentState.hair;
  if (!item || item.style === 'none') return;

  const forehead = pt(FOREHEAD);
  const foreheadTop = pt(FOREHEAD_TOP);
  const leftEar = pt(LEFT_EAR);
  const rightEar = pt(RIGHT_EAR);
  const chin = pt(CHIN);
  const leftTemple = pt(LEFT_TEMPLE);
  const rightTemple = pt(RIGHT_TEMPLE);

  const faceWidth = Math.abs(rightEar.x - leftEar.x);
  const faceHeight = Math.abs(chin.y - foreheadTop.y);
  const color = item.color || '#3d1c02';

  ctx.save();

  switch (item.style) {
    case 'long':
      drawLongHair(forehead, foreheadTop, leftEar, rightEar, leftTemple, rightTemple, chin, faceWidth, faceHeight, color);
      break;
    case 'twintail':
      drawTwinTail(forehead, foreheadTop, leftEar, rightEar, faceWidth, faceHeight, color);
      break;
    case 'curly':
      drawCurlyHair(forehead, foreheadTop, leftEar, rightEar, chin, faceWidth, faceHeight, color);
      break;
    case 'short':
      drawShortHair(forehead, foreheadTop, leftEar, rightEar, faceWidth, faceHeight, color);
      break;
  }

  ctx.restore();
}

// 长发
function drawLongHair(fh, fhTop, le, re, lt, rt, ch, fw, fH, color) {
  const hairTop = fhTop.y - fH * 0.08;
  const topWidth = fw * 0.85;

  // 阴影层（头发底部投影）
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(fh.x, fhTop.y - 2, topWidth * 0.65, fH * 0.12, 0, Math.PI, 0);
  ctx.fill();

  // 主头发：头顶
  const hairGrad = ctx.createLinearGradient(fh.x, hairTop, fh.x, ch.y + fH * 0.6);
  hairGrad.addColorStop(0, lighten(color, 0.2));
  hairGrad.addColorStop(0.4, color);
  hairGrad.addColorStop(0.8, darken(color, 0.15));
  hairGrad.addColorStop(1, darken(color, 0.25));

  ctx.fillStyle = hairGrad;
  ctx.beginPath();
  ctx.moveTo(lt.x - fw * 0.15, fhTop.y - fH * 0.03);
  ctx.quadraticCurveTo(fh.x - topWidth, hairTop - fH * 0.05, fh.x - topWidth * 0.6, hairTop);
  ctx.quadraticCurveTo(fh.x, hairTop - fH * 0.12, fh.x + topWidth * 0.6, hairTop);
  ctx.quadraticCurveTo(fh.x + topWidth, hairTop - fH * 0.05, rt.x + fw * 0.15, fhTop.y - fH * 0.03);
  // 刘海
  ctx.quadraticCurveTo(fh.x + fw * 0.45, fhTop.y + fH * 0.07, fh.x, fhTop.y + fH * 0.01);
  ctx.quadraticCurveTo(fh.x - fw * 0.45, fhTop.y + fH * 0.07, lt.x - fw * 0.15, fhTop.y - fH * 0.03);
  ctx.fill();

  // 左侧垂发
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(lt.x - fw * 0.15, fhTop.y);
  ctx.quadraticCurveTo(le.x - fw * 0.25, le.y - fH * 0.05, le.x - fw * 0.3, ch.y + fH * 0.5);
  ctx.quadraticCurveTo(le.x - fw * 0.15, ch.y + fH * 0.6, le.x + fw * 0.05, ch.y + fH * 0.45);
  ctx.quadraticCurveTo(le.x + fw * 0.1, le.y + fH * 0.05, lt.x + fw * 0.05, fhTop.y);
  ctx.closePath();
  ctx.fill();

  // 右侧垂发
  ctx.beginPath();
  ctx.moveTo(rt.x + fw * 0.15, fhTop.y);
  ctx.quadraticCurveTo(re.x + fw * 0.25, re.y - fH * 0.05, re.x + fw * 0.3, ch.y + fH * 0.5);
  ctx.quadraticCurveTo(re.x + fw * 0.15, ch.y + fH * 0.6, re.x - fw * 0.05, ch.y + fH * 0.45);
  ctx.quadraticCurveTo(re.x - fw * 0.1, re.y + fH * 0.05, rt.x - fw * 0.05, fhTop.y);
  ctx.closePath();
  ctx.fill();

  // 高光发丝
  ctx.strokeStyle = lighten(color, 0.4);
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    const sx = fh.x + i * fw * 0.1;
    ctx.moveTo(sx, fhTop.y - fH * 0.05);
    ctx.quadraticCurveTo(sx, fhTop.y + fH * 0.2, sx - i * 5, ch.y + fH * 0.3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// 双马尾
function drawTwinTail(fh, fhTop, le, re, fw, fH, color) {
  // 头顶
  const topGrad = ctx.createLinearGradient(fh.x, fhTop.y - fH * 0.1, fh.x, fhTop.y + fH * 0.3);
  topGrad.addColorStop(0, lighten(color, 0.15));
  topGrad.addColorStop(1, darken(color, 0.1));

  ctx.fillStyle = topGrad;
  ctx.beginPath();
  ctx.moveTo(fh.x - fw * 0.5, fhTop.y + fH * 0.02);
  ctx.quadraticCurveTo(fh.x - fw * 0.55, fhTop.y - fH * 0.12, fh.x, fhTop.y - fH * 0.13);
  ctx.quadraticCurveTo(fh.x + fw * 0.55, fhTop.y - fH * 0.12, fh.x + fw * 0.5, fhTop.y + fH * 0.02);
  ctx.quadraticCurveTo(fh.x + fw * 0.3, fhTop.y + fH * 0.08, fh.x - fw * 0.3, fhTop.y + fH * 0.08);
  ctx.fill();

  // 两边蓬松马尾
  const ballR = fw * 0.22;
  const sides = [
    { cx: le.x - fw * 0.22, cy: le.y - fw * 0.1 },
    { cx: re.x + fw * 0.22, cy: re.y - fw * 0.1 }
  ];

  sides.forEach(({ cx, cy }) => {
    // 发球阴影
    ctx.fillStyle = darken(color, 0.2);
    ctx.beginPath();
    ctx.arc(cx + 2, cy + 3, ballR, 0, Math.PI * 2);
    ctx.fill();

    // 发球主体
    const ballGrad = ctx.createRadialGradient(cx - ballR * 0.3, cy - ballR * 0.3, ballR * 0.1, cx, cy, ballR);
    ballGrad.addColorStop(0, lighten(color, 0.3));
    ballGrad.addColorStop(0.6, color);
    ballGrad.addColorStop(1, darken(color, 0.2));
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, ballR, 0, Math.PI * 2);
    ctx.fill();

    // 发球高光
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(cx - ballR * 0.25, cy - ballR * 0.25, ballR * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });

  // 发带装饰
  sides.forEach(({ cx, cy }) => {
    ctx.fillStyle = '#ff85a2';
    ctx.beginPath();
    ctx.ellipse(cx + ballR * 0.7, cy - ballR * 0.1, 5, 8, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + ballR * 0.9, cy - ballR * 0.2, 4, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 卷发
function drawCurlyHair(fh, fhTop, le, re, ch, fw, fH, color) {
  // 头顶
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(fh.x - fw * 0.5, fhTop.y + fH * 0.03);
  ctx.quadraticCurveTo(fh.x - fw * 0.55, fhTop.y - fH * 0.1, fh.x, fhTop.y - fH * 0.12);
  ctx.quadraticCurveTo(fh.x + fw * 0.55, fhTop.y - fH * 0.1, fh.x + fw * 0.5, fhTop.y + fH * 0.03);
  ctx.quadraticCurveTo(fh.x + fw * 0.35, fhTop.y + fH * 0.1, fh.x - fw * 0.35, fhTop.y + fH * 0.1);
  ctx.fill();

  // 螺旋卷发
  const curlR = fw * 0.18;
  for (let row = 0; row < 5; row++) {
    const y = fhTop.y + fH * 0.15 + row * fH * 0.18;
    const progress = row / 4;
    const rowCount = 3 + row;

    for (let c = 0; c < rowCount; c++) {
      const spread = fw * (0.6 + progress * 0.35);
      const xOffset = (c / (rowCount - 1) - 0.5) * spread;

      const cx = fh.x + xOffset;
      const cy = y + (Math.abs(xOffset) / fw) * fH * 0.3;

      const curlGrad = ctx.createRadialGradient(cx - curlR * 0.3, cy - curlR * 0.2, curlR * 0.05, cx, cy, curlR);
      curlGrad.addColorStop(0, lighten(color, 0.25));
      curlGrad.addColorStop(0.7, color);
      curlGrad.addColorStop(1, darken(color, 0.15));

      ctx.fillStyle = curlGrad;
      ctx.beginPath();
      // 螺旋状的椭圆模拟卷发
      for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
        const r = curlR * (0.7 + 0.3 * Math.cos(angle * 3));
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r * 0.7;
        if (angle === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}

// 短发
function drawShortHair(fh, fhTop, le, re, fw, fH, color) {
  const hairGrad = ctx.createLinearGradient(fh.x, fhTop.y - fH * 0.1, fh.x, le.y + fw * 0.1);
  hairGrad.addColorStop(0, lighten(color, 0.15));
  hairGrad.addColorStop(0.5, color);
  hairGrad.addColorStop(1, darken(color, 0.1));

  ctx.fillStyle = hairGrad;
  ctx.beginPath();
  ctx.moveTo(fh.x - fw * 0.55, fhTop.y + fH * 0.05);
  ctx.quadraticCurveTo(fh.x - fw * 0.6, fhTop.y - fH * 0.06, fh.x, fhTop.y - fH * 0.1);
  ctx.quadraticCurveTo(fh.x + fw * 0.6, fhTop.y - fH * 0.06, fh.x + fw * 0.55, fhTop.y + fH * 0.05);
  // 右侧到耳
  ctx.quadraticCurveTo(re.x + fw * 0.4, re.y + fw * 0.05, re.x + fw * 0.2, re.y + fw * 0.08);
  ctx.lineTo(re.x - fw * 0.05, re.y + fw * 0.05);
  ctx.quadraticCurveTo(re.x - fw * 0.3, re.y - fw * 0.02, fh.x + fw * 0.15, fhTop.y + fH * 0.04);
  // 左侧到耳
  ctx.quadraticCurveTo(le.x - fw * 0.4, le.y + fw * 0.05, le.x - fw * 0.2, le.y + fw * 0.08);
  ctx.lineTo(le.x + fw * 0.05, le.y + fw * 0.05);
  ctx.quadraticCurveTo(le.x + fw * 0.3, le.y - fw * 0.02, fh.x - fw * 0.15, fhTop.y + fH * 0.04);
  ctx.fill();

  // 刘海纹理
  ctx.strokeStyle = darken(color, 0.15);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    const sx = fh.x + i * fw * 0.08;
    ctx.moveTo(sx, fhTop.y - fH * 0.05);
    ctx.quadraticCurveTo(sx - i * 2, fhTop.y + fH * 0.03, sx, fhTop.y + fH * 0.06);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ==================== 裙子渲染 ====================
function renderDress(landmarks, pt) {
  const item = currentState.dress;
  if (!item || !item.color) return;

  const chin = pt(CHIN);
  const le = pt(LEFT_EAR);
  const re = pt(RIGHT_EAR);
  const faceWidth = Math.abs(re.x - le.x);

  const dressTop = chin.y + 8;
  const bodiceH = faceWidth * 0.55;
  const skirtH = faceWidth * 1.5;
  const halfW = faceWidth * 0.65;
  const cx = chin.x;

  ctx.save();

  // --- 上衣（抹胸）---
  const bodiceGrad = ctx.createLinearGradient(cx, dressTop, cx, dressTop + bodiceH);
  bodiceGrad.addColorStop(0, item.topColor || item.color);
  bodiceGrad.addColorStop(0.5, item.color);
  bodiceGrad.addColorStop(1, darken(item.color, 0.1));

  ctx.fillStyle = bodiceGrad;
  ctx.beginPath();
  ctx.moveTo(cx - halfW * 0.5, dressTop);
  ctx.bezierCurveTo(cx - halfW * 0.45, dressTop - 3, cx - halfW * 0.55, dressTop + bodiceH, cx - halfW * 0.45, dressTop + bodiceH);
  ctx.lineTo(cx + halfW * 0.45, dressTop + bodiceH);
  ctx.bezierCurveTo(cx + halfW * 0.55, dressTop + bodiceH, cx + halfW * 0.45, dressTop - 3, cx + halfW * 0.5, dressTop);
  ctx.closePath();
  ctx.fill();

  // 抹胸上边缘装饰
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - halfW * 0.47, dressTop + 2);
  ctx.quadraticCurveTo(cx, dressTop + 8, cx + halfW * 0.47, dressTop + 2);
  ctx.stroke();

  // --- 裙子（蓬蓬裙摆）---
  const skirtTop = dressTop + bodiceH;
  const skirtBottom = skirtTop + skirtH;

  const skirtGrad = ctx.createLinearGradient(cx, skirtTop, cx, skirtBottom);
  skirtGrad.addColorStop(0, item.color);
  skirtGrad.addColorStop(0.5, item.color);
  skirtGrad.addColorStop(1, darken(item.color, 0.12));

  ctx.fillStyle = skirtGrad;
  ctx.beginPath();
  ctx.moveTo(cx - halfW * 0.5, skirtTop);
  // 左侧蓬松曲线
  ctx.bezierCurveTo(
    cx - halfW * 0.75, skirtTop + skirtH * 0.3,
    cx - halfW * 0.85, skirtTop + skirtH * 0.7,
    cx - halfW * 0.8, skirtBottom
  );
  // 底部波浪
  ctx.quadraticCurveTo(cx - halfW * 0.5, skirtBottom + 6, cx - halfW * 0.25, skirtBottom);
  ctx.quadraticCurveTo(cx, skirtBottom - 4, cx + halfW * 0.25, skirtBottom);
  ctx.quadraticCurveTo(cx + halfW * 0.5, skirtBottom + 6, cx + halfW * 0.8, skirtBottom);
  // 右侧蓬松曲线
  ctx.bezierCurveTo(
    cx + halfW * 0.85, skirtTop + skirtH * 0.7,
    cx + halfW * 0.75, skirtTop + skirtH * 0.3,
    cx + halfW * 0.5, skirtTop
  );
  ctx.closePath();
  ctx.fill();

  // 裙摆褶皱竖线
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  for (let i = -3; i <= 3; i++) {
    const sx = cx + i * halfW * 0.13;
    ctx.beginPath();
    ctx.moveTo(sx, skirtTop + 5);
    ctx.quadraticCurveTo(sx - i * 3, skirtTop + skirtH * 0.5, sx - i * 2, skirtBottom - 5);
    ctx.stroke();
  }

  // 裙摆底部亮边
  ctx.strokeStyle = lighten(item.color, 0.3);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - halfW * 0.78, skirtBottom - 1);
  ctx.quadraticCurveTo(cx - halfW * 0.5, skirtBottom + 4, cx - halfW * 0.25, skirtBottom - 1);
  ctx.quadraticCurveTo(cx, skirtBottom - 5, cx + halfW * 0.25, skirtBottom - 1);
  ctx.quadraticCurveTo(cx + halfW * 0.5, skirtBottom + 4, cx + halfW * 0.78, skirtBottom - 1);
  ctx.stroke();

  // --- 腰部蝴蝶结 ---
  const bowY = skirtTop - 2;
  const bowColors = ['#ff85a2', '#fff', '#ffb3c6'];

  // 左翅
  ctx.fillStyle = bowColors[0];
  ctx.beginPath();
  ctx.ellipse(cx - halfW * 0.18, bowY, 9, 12, -0.35, 0, Math.PI * 2);
  ctx.fill();
  // 右翅
  ctx.beginPath();
  ctx.ellipse(cx + halfW * 0.18, bowY, 9, 12, 0.35, 0, Math.PI * 2);
  ctx.fill();
  // 中心结
  ctx.fillStyle = bowColors[1];
  ctx.beginPath();
  ctx.arc(cx, bowY, 5, 0, Math.PI * 2);
  ctx.fill();
  // 飘带
  ctx.strokeStyle = bowColors[2];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 2, bowY + 4);
  ctx.quadraticCurveTo(cx - 8, bowY + 18, cx - 12, bowY + 28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 2, bowY + 4);
  ctx.quadraticCurveTo(cx + 8, bowY + 18, cx + 12, bowY + 28);
  ctx.stroke();

  // --- 散落小星星装饰 ---
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const starPositions = [
    { x: cx - halfW * 0.5, y: skirtTop + skirtH * 0.3 },
    { x: cx + halfW * 0.6, y: skirtTop + skirtH * 0.5 },
    { x: cx - halfW * 0.3, y: skirtTop + skirtH * 0.7 },
    { x: cx + halfW * 0.4, y: skirtTop + skirtH * 0.2 },
    { x: cx, y: skirtTop + skirtH * 0.6 }
  ];
  starPositions.forEach(({ x, y }) => {
    drawTinyStar(x, y, 3);
  });

  ctx.restore();
}

function drawTinyStar(cx, cy, size) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * 0.4;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// ==================== 配饰渲染 ====================
function renderAccessory(landmarks, pt) {
  const item = currentState.accessory;
  if (!item || item.type === 'none') return;

  const forehead = pt(FOREHEAD);
  const le = pt(LEFT_EAR);
  const re = pt(RIGHT_EAR);
  const fw = Math.abs(re.x - le.x);

  ctx.save();

  switch (item.type) {
    case 'bow':
      drawBow(forehead, fw, item.color);
      break;
    case 'crown':
      drawCrown(forehead, fw);
      break;
    case 'glasses':
      drawGlasses(landmarks, pt, item.color);
      break;
    case 'necklace':
      drawNecklace(landmarks, pt, item.color);
      break;
  }

  ctx.restore();
}

function drawBow(fh, fw, color) {
  const cx = fh.x;
  const cy = fh.y - 6;
  const bowColor = color || '#ff69b4';

  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 左翅
  const bowGradL = ctx.createLinearGradient(cx - 22, cy, cx, cy);
  bowGradL.addColorStop(0, darken(bowColor, 0.15));
  bowGradL.addColorStop(0.5, bowColor);
  bowGradL.addColorStop(1, lighten(bowColor, 0.2));
  ctx.fillStyle = bowGradL;
  ctx.beginPath();
  ctx.ellipse(cx - 18, cy, 18, 11, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // 右翅
  const bowGradR = ctx.createLinearGradient(cx, cy, cx + 22, cy);
  bowGradR.addColorStop(0, lighten(bowColor, 0.2));
  bowGradR.addColorStop(0.5, bowColor);
  bowGradR.addColorStop(1, darken(bowColor, 0.15));
  ctx.fillStyle = bowGradR;
  ctx.beginPath();
  ctx.ellipse(cx + 18, cy, 18, 11, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // 中心结 + 高光
  const knotGrad = ctx.createRadialGradient(cx - 1, cy - 1, 1, cx, cy, 7);
  knotGrad.addColorStop(0, '#ffffff');
  knotGrad.addColorStop(0.4, lighten(bowColor, 0.3));
  knotGrad.addColorStop(1, bowColor);
  ctx.fillStyle = knotGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  // 飘带尾巴
  ctx.strokeStyle = bowColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy + 5);
  ctx.quadraticCurveTo(cx - 6, cy + 16, cx - 10, cy + 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy + 5);
  ctx.quadraticCurveTo(cx + 6, cy + 16, cx + 10, cy + 22);
  ctx.stroke();
}

function drawCrown(fh, fw) {
  const cx = fh.x;
  const baseY = fh.y - 10;
  const crownW = fw * 0.48;
  const crownH = fw * 0.35;

  // 底座阴影
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.roundRect(cx - crownW + 2, baseY + 2, crownW * 2, crownH * 0.28, 4);
  ctx.fill();

  // 底座
  const baseGrad = ctx.createLinearGradient(cx, baseY, cx, baseY + crownH * 0.3);
  baseGrad.addColorStop(0, '#ffe566');
  baseGrad.addColorStop(0.5, '#ffd700');
  baseGrad.addColorStop(1, '#cc9900');
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.roundRect(cx - crownW, baseY, crownW * 2, crownH * 0.28, 5);
  ctx.fill();

  // 宝石底座
  const gemCount = 3;
  for (let g = 0; g < gemCount; g++) {
    const gx = cx - crownW * 0.6 + g * crownW * 0.6;
    const gemColors = ['#ff4444', '#44ff44', '#4444ff'];
    ctx.fillStyle = gemColors[g];
    ctx.beginPath();
    ctx.arc(gx, baseY + crownH * 0.15, crownW * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(gx - 1, baseY + crownH * 0.13, crownW * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }

  // 尖顶
  const peakCount = 5;
  const peakW = (crownW * 2) / peakCount;
  for (let i = 0; i < peakCount; i++) {
    const px = cx - crownW + i * peakW;

    const peakGrad = ctx.createLinearGradient(px, baseY, px, baseY - crownH * 0.75);
    peakGrad.addColorStop(0, '#ffd700');
    peakGrad.addColorStop(1, '#fff8c4');

    ctx.fillStyle = peakGrad;
    ctx.beginPath();
    ctx.moveTo(px + 2, baseY);
    ctx.lineTo(px + peakW / 2, baseY - crownH * 0.75);
    ctx.lineTo(px + peakW - 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b89400';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 尖顶珍珠
    const pearlGrad = ctx.createRadialGradient(
      px + peakW / 2 - 1, baseY - crownH * 0.75 - 1, 0.5,
      px + peakW / 2, baseY - crownH * 0.75, 4
    );
    pearlGrad.addColorStop(0, '#ffffff');
    pearlGrad.addColorStop(0.5, '#ffeef8');
    pearlGrad.addColorStop(1, '#ffb3c6');
    ctx.fillStyle = pearlGrad;
    ctx.beginPath();
    ctx.arc(px + peakW / 2, baseY - crownH * 0.75, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGlasses(landmarks, pt, color) {
  const leftEye = pt(LEFT_EYE_CENTER);
  const rightEye = pt(RIGHT_EYE_CENTER);
  const leftEyeOuter = pt(LEFT_EYE_OUTER);
  const rightEyeOuter = pt(RIGHT_EYE_OUTER);
  const eyeDist = Math.abs(rightEye.x - leftEye.x);
  const glassColor = color || '#ff69b4';

  ctx.strokeStyle = glassColor;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.8;

  const glassW = eyeDist * 0.42;
  const glassH = glassW * 0.9;

  // 左镜框
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.roundRect(leftEye.x - glassW / 2, leftEye.y - glassH / 2, glassW, glassH, glassW * 0.35);
  ctx.fill();
  ctx.stroke();

  // 左镜框高光
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(leftEye.x - glassW * 0.1, leftEye.y - glassH * 0.2, glassW * 0.12, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.stroke();

  ctx.strokeStyle = glassColor;
  ctx.lineWidth = 3;

  // 右镜框
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.roundRect(rightEye.x - glassW / 2, rightEye.y - glassH / 2, glassW, glassH, glassW * 0.35);
  ctx.fill();
  ctx.stroke();

  // 右镜框高光
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(rightEye.x - glassW * 0.1, rightEye.y - glassH * 0.2, glassW * 0.12, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.stroke();

  ctx.strokeStyle = glassColor;
  ctx.lineWidth = 3;

  // 鼻梁
  const bridgeGrad = ctx.createLinearGradient(leftEye.x, 0, rightEye.x, 0);
  bridgeGrad.addColorStop(0, glassColor);
  bridgeGrad.addColorStop(0.5, lighten(glassColor, 0.5));
  bridgeGrad.addColorStop(1, glassColor);
  ctx.strokeStyle = bridgeGrad;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(leftEye.x + glassW / 2, leftEye.y);
  ctx.quadraticCurveTo((leftEye.x + rightEye.x) / 2, leftEye.y + 6, rightEye.x - glassW / 2, rightEye.y);
  ctx.stroke();

  // 镜腿
  ctx.strokeStyle = glassColor;
  ctx.lineWidth = 2;
  const templeLen = glassW * 0.4;
  // 左镜腿
  ctx.beginPath();
  ctx.moveTo(leftEye.x - glassW / 2, leftEye.y);
  ctx.lineTo(leftEye.x - glassW / 2 - templeLen, leftEye.y - 3);
  ctx.stroke();
  // 右镜腿
  ctx.beginPath();
  ctx.moveTo(rightEye.x + glassW / 2, rightEye.y);
  ctx.lineTo(rightEye.x + glassW / 2 + templeLen, rightEye.y - 3);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function drawNecklace(landmarks, pt, color) {
  const chin = pt(CHIN);
  const le = pt(LEFT_EAR);
  const re = pt(RIGHT_EAR);
  const fw = Math.abs(re.x - le.x);

  const cx = chin.x;
  const neckY = chin.y + 12;
  const arcR = fw * 0.4;

  // 链子
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, neckY + arcR * 0.35, arcR, Math.PI * 1.2, Math.PI * 1.8, false);
  ctx.stroke();

  // 小珍珠串
  const pearlCount = 7;
  for (let i = 0; i < pearlCount; i++) {
    const angle = Math.PI * 1.2 + (Math.PI * 0.6 * i) / (pearlCount - 1);
    const px = cx + Math.cos(angle) * arcR;
    const py = neckY + arcR * 0.35 + Math.sin(angle) * arcR;

    const pearlGrad = ctx.createRadialGradient(px - 1, py - 1, 0.5, px, py, 3.5);
    pearlGrad.addColorStop(0, '#ffffff');
    pearlGrad.addColorStop(0.6, color || '#f0e6f6');
    pearlGrad.addColorStop(1, darken(color || '#e8d5f0', 0.2));

    ctx.fillStyle = pearlGrad;
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 吊坠
  const pendantY = neckY + arcR * 0.35 + arcR;
  const pendantGrad = ctx.createRadialGradient(cx - 1, pendantY - 2, 1, cx, pendantY, 8);
  pendantGrad.addColorStop(0, '#fffde0');
  pendantGrad.addColorStop(0.4, '#ffd700');
  pendantGrad.addColorStop(1, '#b89400');

  ctx.fillStyle = pendantGrad;
  ctx.beginPath();
  // 心形吊坠
  drawHeart(cx, pendantY, 8);
  ctx.fill();

  // 吊坠高光
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(cx - 1, pendantY - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeart(cx, cy, size) {
  ctx.moveTo(cx, cy + size * 0.6);
  ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size * 0.6, cy - size, cx, cy - size * 0.2);
  ctx.bezierCurveTo(cx + size * 0.6, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.6);
}
