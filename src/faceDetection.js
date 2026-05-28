// MediaPipe Face Mesh 封装模块
// 提供实时面部关键点检测

let faceMesh = null;
let onFaceResults = null;
let isRunning = false;
let lastLandmarks = null;

// 初始化 Face Mesh
export async function initFaceMesh(videoElement, onResults) {
  onFaceResults = onResults;

  const FaceMesh = window.FaceMesh;

  if (!FaceMesh) {
    throw new Error('FaceMesh 未加载，请检查网络连接');
  }

  faceMesh = new FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,            // 只检测一张脸
    refineLandmarks: true,     // 细化嘴唇、眼睛的关键点
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMesh.onResults((results) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      lastLandmarks = results.multiFaceLandmarks[0];
    } else {
      lastLandmarks = null;
    }

    if (onFaceResults) {
      onFaceResults(lastLandmarks, videoElement.videoWidth, videoElement.videoHeight);
    }
  });

  return faceMesh;
}

// 开始检测循环
export async function startDetection(videoElement) {
  if (!faceMesh) return;
  isRunning = true;

  async function detectFrame() {
    if (!isRunning) return;
    if (videoElement.readyState >= 2) {
      await faceMesh.send({ image: videoElement });
    }
    if (isRunning) {
      requestAnimationFrame(detectFrame);
    }
  }

  detectFrame();
}

// 停止检测
export function stopDetection() {
  isRunning = false;
  lastLandmarks = null;
}

// 获取最近一次的关键点
export function getLastLandmarks() {
  return lastLandmarks;
}
