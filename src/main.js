// 应用入口
import { setupStartButton } from './app.js';

// 绑定开始按钮点击事件
setupStartButton();

// 预加载语音列表 (iOS 需要在用户手势后加载，先占位)
document.addEventListener('click', () => {
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.getVoices();
  }
}, { once: true });
