// 装扮物品数据 + 英语/数学教学内容

// ====== 装扮物品 ======

export const categories = [
  { id: 'hair', name: '发型', icon: '💇' },
  { id: 'lipstick', name: '口红', icon: '💄' },
  { id: 'blush', name: '腮红', icon: '🌸' },
  { id: 'dress', name: '裙子', icon: '👗' },
  { id: 'accessory', name: '配饰', icon: '🎀' }
];

export const items = {
  hair: [
    { id: 'hair-long', name: '长直发', color: '#3d1c02', style: 'long', emoji: '👩' },
    { id: 'hair-twintail', name: '双马尾', color: '#5c2e00', style: 'twintail', emoji: '👧' },
    { id: 'hair-curly', name: '卷卷发', color: '#c8882a', style: 'curly', emoji: '👩‍🦱' },
    { id: 'hair-short', name: '波波头', color: '#8b4513', style: 'short', emoji: '🧒' },
    { id: 'hair-pink', name: '粉色公主', color: '#ff85a2', style: 'long', emoji: '👸' },
    { id: 'hair-none', name: '不戴假发', color: null, style: 'none', emoji: '❌' }
  ],
  lipstick: [
    { id: 'lip-pink', name: '草莓粉', color: '#ff6b8a', emoji: '🍓' },
    { id: 'lip-red', name: '苹果红', color: '#e63946', emoji: '🍎' },
    { id: 'lip-coral', name: '橘子橙', color: '#ff7f50', emoji: '🍊' },
    { id: 'lip-berry', name: '浆果紫', color: '#c77dff', emoji: '🍇' },
    { id: 'lip-nude', name: '奶茶色', color: '#d4a574', emoji: '🧋' },
    { id: 'lip-none', name: '擦掉口红', color: null, emoji: '🧹' }
  ],
  blush: [
    { id: 'blush-pink', name: '蜜桃粉', color: 'rgba(255, 182, 193, 0.5)', emoji: '🍑' },
    { id: 'blush-rose', name: '玫瑰红', color: 'rgba(255, 140, 160, 0.45)', emoji: '🌹' },
    { id: 'blush-coral', name: '珊瑚橘', color: 'rgba(255, 160, 122, 0.45)', emoji: '🐚' },
    { id: 'blush-none', name: '擦掉腮红', color: null, emoji: '🧹' }
  ],
  dress: [
    { id: 'dress-pink', name: '粉公主裙', color: '#ffb3c6', topColor: '#ff85a2', emoji: '👗' },
    { id: 'dress-blue', name: '蓝仙女裙', color: '#a8d8ea', topColor: '#7ec8e3', emoji: '🧚' },
    { id: 'dress-yellow', name: '黄阳光裙', color: '#ffe5a0', topColor: '#ffd166', emoji: '☀️' },
    { id: 'dress-purple', name: '紫魔法裙', color: '#d4b8ff', topColor: '#b388eb', emoji: '🔮' },
    { id: 'dress-white', name: '白婚纱裙', color: '#ffffff', topColor: '#f0f0f0', emoji: '🤍' },
    { id: 'dress-none', name: '不穿裙子', color: null, emoji: '❌' }
  ],
  accessory: [
    { id: 'acc-bow', name: '蝴蝶结', type: 'bow', color: '#ff69b4', emoji: '🎀', pos: 'top' },
    { id: 'acc-crown', name: '小皇冠', type: 'crown', color: '#ffd700', emoji: '👑', pos: 'top' },
    { id: 'acc-glasses', name: '圆眼镜', type: 'glasses', color: '#ff69b4', emoji: '👓', pos: 'eyes' },
    { id: 'acc-necklace', name: '珍珠链', type: 'necklace', color: '#ffffff', emoji: '📿', pos: 'neck' },
    { id: 'acc-none', name: '摘掉配饰', type: 'none', color: null, emoji: '❌', pos: null }
  ]
};

// ====== 英语教学内容 ======

export const englishWords = [
  { word: 'pink', chinese: '粉色', emoji: '🩷', color: '#ffb3c6' },
  { word: 'red', chinese: '红色', emoji: '❤️', color: '#e63946' },
  { word: 'blue', chinese: '蓝色', emoji: '💙', color: '#7ec8e3' },
  { word: 'yellow', chinese: '黄色', emoji: '💛', color: '#ffd166' },
  { word: 'purple', chinese: '紫色', emoji: '💜', color: '#b388eb' },
  { word: 'green', chinese: '绿色', emoji: '💚', color: '#90ee90' },
  { word: 'white', chinese: '白色', emoji: '🤍', color: '#f0f0f0' },
  { word: 'dress', chinese: '裙子', emoji: '👗', color: '#ffb3c6' },
  { word: 'hair', chinese: '头发', emoji: '💇', color: '#8b4513' },
  { word: 'crown', chinese: '皇冠', emoji: '👑', color: '#ffd700' },
  { word: 'bow', chinese: '蝴蝶结', emoji: '🎀', color: '#ff69b4' },
  { word: 'shoes', chinese: '鞋子', emoji: '👠', color: '#ff85a2' },
  { word: 'pretty', chinese: '漂亮', emoji: '✨', color: '#ffb3c6' },
  { word: 'happy', chinese: '开心', emoji: '😊', color: '#ffd166' },
  { word: 'one', chinese: '一', emoji: '1️⃣', color: '#ff6b8a' },
  { word: 'two', chinese: '二', emoji: '2️⃣', color: '#7ec8e3' },
  { word: 'three', chinese: '三', emoji: '3️⃣', color: '#ffd166' },
  { word: 'four', chinese: '四', emoji: '4️⃣', color: '#b388eb' },
  { word: 'five', chinese: '五', emoji: '5️⃣', color: '#90ee90' }
];

// ====== 数学教学内容 ======

export const mathQuestions = [
  {
    question: '宝贝有 1 朵花 🌸，妈妈再给 1 朵，一共有几朵？',
    answer: 2,
    options: [1, 2, 3],
    emoji: '🌸'
  },
  {
    question: '柜子里有 2 条裙子 👗，又买了 1 条，现在有几条？',
    answer: 3,
    options: [2, 3, 4],
    emoji: '👗'
  },
  {
    question: '你有 3 颗糖 🍬，吃掉 1 颗，还剩几颗？',
    answer: 2,
    options: [1, 2, 3],
    emoji: '🍬'
  },
  {
    question: '桌上有 2 个苹果 🍎，再加 2 个，一共几个？',
    answer: 4,
    options: [3, 4, 5],
    emoji: '🍎'
  },
  {
    question: '你有 4 个气球 🎈，飞走 1 个，还剩几个？',
    answer: 3,
    options: [2, 3, 4],
    emoji: '🎈'
  },
  {
    question: '姐姐有 1 个发卡，妹妹有 1 个发卡，共有几个？',
    answer: 2,
    options: [1, 2, 3],
    emoji: '🎀'
  }
];

// ====== 语音反馈词 ======

export const praises = [
  { cn: '太漂亮啦！', en: 'So pretty!' },
  { cn: '真棒！', en: 'Great job!' },
  { cn: '好可爱呀！', en: 'So cute!' },
  { cn: '答对啦！', en: 'Correct!' },
  { cn: '你太聪明了！', en: 'You are so smart!' },
  { cn: '好厉害！', en: 'Amazing!' }
];

export const encouragements = [
  { cn: '再试一次吧~', en: 'Try again!' },
  { cn: '差一点点哦~', en: 'Almost there!' },
  { cn: '没关系，再来！', en: "Don't worry, try again!" }
];
