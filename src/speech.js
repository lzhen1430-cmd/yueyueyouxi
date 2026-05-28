// 语音合成模块 - Web Speech API

let synth = null;
let currentUtterance = null;

function getSynth() {
  if (!synth && typeof speechSynthesis !== 'undefined') {
    synth = speechSynthesis;
  }
  return synth;
}

// 获取中文语音
function getChineseVoice() {
  const s = getSynth();
  if (!s) return null;
  const voices = s.getVoices();
  return voices.find(v => v.lang.startsWith('zh')) || null;
}

// 获取英文语音
function getEnglishVoice() {
  const s = getSynth();
  if (!s) return null;
  const voices = s.getVoices();
  return voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en')) || null;
}

// 朗读英文单词
export function speakEnglish(text) {
  const s = getSynth();
  if (!s) return;
  // 取消当前朗读
  s.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85;   // 慢一点，适合幼儿
  utterance.pitch = 1.1;   // 稍高音调，亲切
  utterance.volume = 0.9;

  const voice = getEnglishVoice();
  if (voice) utterance.voice = voice;

  currentUtterance = utterance;
  s.speak(utterance);
  return utterance;
}

// 朗读中文
export function speakChinese(text) {
  const s = getSynth();
  if (!s) return;
  s.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;
  utterance.pitch = 1.05;
  utterance.volume = 0.9;

  const voice = getChineseVoice();
  if (voice) utterance.voice = voice;

  currentUtterance = utterance;
  s.speak(utterance);
  return utterance;
}

// 双语朗读 (先英文再中文)
export function speakBilingual(enText, cnText) {
  const s = getSynth();
  if (!s) return;
  s.cancel();

  speakEnglish(enText);

  // 等英文读完再读中文
  const checkInterval = setInterval(() => {
    if (!s.speaking) {
      clearInterval(checkInterval);
      setTimeout(() => speakChinese(cnText), 300);
    }
  }, 200);
}

// 停止朗读
export function stopSpeaking() {
  const s = getSynth();
  if (s) s.cancel();
  currentUtterance = null;
}

// 预加载语音 (iOS Safari 需要用户交互后才能使用)
export function initSpeech() {
  const s = getSynth();
  if (!s) return false;

  // iOS 需要加载 voices
  if (s.getVoices().length === 0) {
    s.addEventListener('voiceschanged', () => {}, { once: true });
  }

  // 发一个空声音来激活 (某些浏览器需要)
  const dummy = new SpeechSynthesisUtterance('');
  dummy.volume = 0;
  s.speak(dummy);

  return true;
}
