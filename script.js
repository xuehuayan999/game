// Enhanced game-machine script: continuous voice commands, filters, weighted selection, map links, TTS, keyboard shortcuts

const foodItems = [
  { name: "烧鹅饭", cuisine: "港式", priceTier: 2, isVegetarian: false, weight: 1.2, mealType: ["午餐","晚餐"], tags: ["烧味"], exampleLocation: "镜湖烧鹅（旺角）" },
  { name: "港式烧腊饭", cuisine: "港式", priceTier: 2, isVegetarian: false, weight: 1.0, mealType: ["午餐","晚餐"], tags: ["烧味"] , exampleLocation: "金记烧腊"},
  { name: "鸡蛋仔", cuisine: "甜品", priceTier: 1, isVegetarian: true, weight: 0.9, mealType: ["下午茶","夜宵"], tags: ["甜品"] , exampleLocation: "新记鸡蛋仔"},
  { name: "咖喱饭", cuisine: "中式", priceTier: 1, isVegetarian: false, weight: 1.0, mealType: ["午餐","晚餐"], tags: ["咖喱"] , exampleLocation: "九龙咖喱店"},
  { name: "海鲜粥", cuisine: "中式", priceTier: 2, isVegetarian: false, weight: 0.8, mealType: ["早午餐","晚餐"], tags: ["海鲜"] , exampleLocation: "栈湾海鲜粥"},
  { name: "牛腩面", cuisine: "中式", priceTier: 2, isVegetarian: false, weight: 1.1, mealType: ["午餐","晚餐"], tags: ["面食"] , exampleLocation: "面家牛腩"},
  { name: "烧味拼盘", cuisine: "港式", priceTier: 2, isVegetarian: false, weight: 1.0, mealType: ["午餐","晚餐"], tags: ["烧味"] , exampleLocation: "老牌烧味铺"},
  { name: "鱼蛋粉", cuisine: "港式", priceTier: 1, isVegetarian: false, weight: 0.9, mealType: ["午餐","晚餐"], tags: ["街坊小吃"] , exampleLocation: "街坊鱼蛋粉"},
  { name: "甜品（豆腐花/双皮奶）", cuisine: "甜品", priceTier: 1, isVegetarian: true, weight: 0.8, mealType: ["下午茶"], tags: ["甜品"] , exampleLocation: "添好运甜品"},
  { name: "日式拉面", cuisine: "日式", priceTier: 2, isVegetarian: false, weight: 0.9, mealType: ["午餐","晚餐"], tags: ["拉面"] , exampleLocation: "一风堂"},
  { name: "韩式炸鸡", cuisine: "韩式", priceTier: 2, isVegetarian: false, weight: 0.8, mealType: ["晚餐","夜宵"], tags: ["炸鸡"] , exampleLocation: "韩风炸鸡店"},
  { name: "火锅", cuisine: "中式", priceTier: 3, isVegetarian: false, weight: 0.7, mealType: ["晚餐"], tags: ["鍋物"] , exampleLocation: "海底捞(尖沙咀)"},
  { name: "港式火腿肠面", cuisine: "港式", priceTier: 1, isVegetarian: false, weight: 0.9, mealType: ["早餐","午餐"], tags: ["快餐"] , exampleLocation: "街市小店"},
  { name: "潮州粉面", cuisine: "中式", priceTier: 1, isVegetarian: false, weight: 0.8, mealType: ["午餐"], tags: ["粉面"] , exampleLocation: "潮州小馆"},
  { name: "叻沙", cuisine: "东南亚", priceTier: 2, isVegetarian: false, weight: 0.9, mealType: ["午餐","晚餐"], tags: ["汤面"] , exampleLocation: "叻沙之家"},
  { name: "寿司", cuisine: "日式", priceTier: 2, isVegetarian: false, weight: 0.9, mealType: ["午餐","晚餐"], tags: ["生食"] , exampleLocation: "寿司郎"},
  { name: "素食碗（香菇豆腐饭）", cuisine: "中式", priceTier: 1, isVegetarian: true, weight: 1.0, mealType: ["午餐","晚餐"], tags: ["素食"] , exampleLocation: "素食小馆"}
];

// DOM refs
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const listenBtn = document.getElementById('listenBtn');
const spinBtn = document.getElementById('spinBtn');
const againBtn = document.getElementById('againBtn');
const resultBox = document.getElementById('result');
const resultText = document.getElementById('resultText');
const mapLink = document.getElementById('mapLink');
const closeResultBtn = document.getElementById('closeResult');
const cuisineFilter = document.getElementById('cuisineFilter');
const vegOnly = document.getElementById('vegOnly');
const priceFilter = document.getElementById('priceFilter');
const sfxSpin = document.getElementById('sfx-spin');

let recognition = null;
let shouldKeepListening = true;
let isSpinning = false;
let rotation = 0; // radians

// draw wheel using current filtered items (if too few, fall back to all items)
function drawWheel(items = foodItems) {
  const dpr = window.devicePixelRatio || 1;
  const size = Math.min(620, window.innerWidth - 40);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';

  ctx.resetTransform();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(dpr, dpr);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 18;
  const sliceAngle = (Math.PI * 2) / items.length;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);

  items.forEach((item, index) => {
    const start = index * sliceAngle;
    const end = start + sliceAngle;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colorForIndex(index);
    ctx.fill();

    ctx.save();
    ctx.rotate(start + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1f1b1a';
    ctx.font = '600 16px "Segoe UI", "Noto Sans TC", sans-serif';
    ctx.textBaseline = 'middle';
    const maxW = radius * 0.7;
    wrapText(ctx, item.name, maxW, radius * 0.78, 0);
    ctx.restore();
  });

  // center
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.fillStyle = '#fff3d6';
  ctx.fill();
  ctx.strokeStyle = '#cf7e32';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.restore();

  // outer ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
  ctx.strokeStyle = '#d27c35';
  ctx.lineWidth = 8;
  ctx.stroke();
}

function colorForIndex(i) {
  const palette = ['#ff7a59','#ffd166','#72c6a1','#4dabf7','#ff8fab','#ffb703','#9ad0c2','#f4a261','#f9a8d4','#c084fc','#ef476f','#90be6d','#7cc6fe','#ffb4a2','#a5d8ff','#f6bd60'];
  return palette[i % palette.length];
}

function wrapText(ctx, text, maxWidth, x, y) {
  const words = text.split(' ');
  let line = '';
  // simple wrap by characters for CJK-friendly
  let chars = Array.from(text);
  let cur = '';
  let lines = [];
  for (let ch of chars) {
    cur += ch;
    if (ctx.measureText(cur).width > maxWidth) {
      lines.push(cur.slice(0, -1));
      cur = ch;
    }
  }
  if (cur) lines.push(cur);
  const lineHeight = 18;
  const startY = y - (lines.length - 1) / 2 * lineHeight;
  lines.forEach((ln, i) => ctx.fillText(ln, x, startY + i * lineHeight));
}

function getFilteredItems() {
  let list = foodItems.slice();
  const cuisine = cuisineFilter.value;
  const veg = vegOnly.checked;
  const price = priceFilter.value;

  if (cuisine && cuisine !== 'all') list = list.filter(i => i.cuisine === cuisine);
  if (veg) list = list.filter(i => i.isVegetarian);
  if (price && price !== 'any') list = list.filter(i => i.priceTier === Number(price));

  return list.length ? list : foodItems.slice();
}

function weightedChoice(items) {
  const total = items.reduce((s, it) => s + (it.weight || 1), 0);
  let r = Math.random() * total;
  for (let it of items) {
    r -= (it.weight || 1);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

function spinWheel() {
  if (isSpinning) return;
  const items = getFilteredItems();
  if (!items || items.length === 0) {
    statusEl.textContent = '没有匹配的选项，请调整筛选器';
    return;
  }

  isSpinning = true;
  resultBox.classList.add('hidden');
  statusEl.textContent = '转盘中...';

  // pick winning index based on weighted choice
  const chosen = weightedChoice(items);
  const winningIndex = items.indexOf(chosen);
  const sliceAngle = (Math.PI * 2) / items.length;
  const extraTurns = 5; // rounds
  const target = extraTurns * 2 * Math.PI + (2 * Math.PI - (winningIndex * sliceAngle + sliceAngle / 2));
  const startRotation = rotation % (2 * Math.PI);
  const duration = 4200;
  const startTime = performance.now();

  // play SFX
  if (sfxSpin) {
    try { sfxSpin.currentTime = 0; sfxSpin.play(); } catch (e) {}
  }

  function animate(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    rotation = startRotation + (target - startRotation) * eased;
    drawWheel(items);
    if (t < 1) requestAnimationFrame(animate);
    else finalize();
  }

  function finalize() {
    isSpinning = false;
    statusEl.textContent = '就决定是它了！';
    showResult(chosen);
    // stop sfx
    if (sfxSpin) try { sfxSpin.pause(); sfxSpin.currentTime = 0; } catch (e) {}
  }

  requestAnimationFrame(animate);
}

function makeMapLink(name) {
  const q = encodeURIComponent(name + ' 香港');
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function speakText(text) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-HK';
  u.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function showResult(item) {
  resultText.textContent = `${item.name} · ${item.cuisine} · ${'￥'.repeat(item.priceTier)}${item.isVegetarian? ' · 素食':''}`;
  mapLink.href = makeMapLink(item.exampleLocation || item.name);
  resultBox.classList.remove('hidden');
  // TTS readout
  speakText(`今晚就吃 ${item.name}`);
  // vibrate if available
  if (navigator.vibrate) navigator.vibrate([60,30,60]);
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    statusEl.textContent = '浏览器不支持语音识别';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'zh-HK';
  recognition.continuous = true; // keep listening
  recognition.interimResults = false;

  recognition.onstart = () => { statusEl.textContent = '监听中... (说“今天吃什么”)'; };

  recognition.onresult = (event) => {
    // combine results from the event
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .map(r => r[0].transcript)
      .join('')
      .trim();

    const normalized = transcript.toLowerCase();
    statusEl.textContent = '听到：' + transcript;

    if (/今天吃什么|今日食咩|吃什么|食咩|帮我选/.test(normalized)) {
      spinWheel();
    } else if (/换一个|再来一次|不想吃这个|换一個/.test(normalized)) {
      spinWheel();
    } else if (/停止监听|關閉語音|停止/.test(normalized)) {
      shouldKeepListening = false;
      recognition.stop();
      statusEl.textContent = '已停止监听';
    }
  };

  recognition.onerror = (e) => {
    console.warn('recognition error', e.error);
    statusEl.textContent = '语音识别错误：' + (e.error || '未知');
  };

  recognition.onend = () => {
    if (shouldKeepListening) {
      // small delay before restart to avoid spin loops
      setTimeout(() => {
        try { recognition.start(); } catch (e) { console.warn('restart failed', e); }
      }, 400);
    } else {
      statusEl.textContent = '已停止监听';
    }
  };

  try { recognition.start(); } catch (e) { console.warn('start failed', e); }
}

function toggleListening() {
  if (!recognition) setupSpeechRecognition();
  if (!recognition) return;
  shouldKeepListening = !shouldKeepListening;
  if (shouldKeepListening) {
    try { recognition.start(); } catch (e) {}
    statusEl.textContent = '监听已开启';
    listenBtn.classList.add('active');
  } else {
    recognition.stop();
    statusEl.textContent = '监听已关闭';
    listenBtn.classList.remove('active');
  }
}

// UI bindings
listenBtn.addEventListener('click', toggleListening);
spinBtn.addEventListener('click', spinWheel);
againBtn.addEventListener('click', spinWheel);
closeResultBtn.addEventListener('click', () => { resultBox.classList.add('hidden'); statusEl.textContent = '等待唤醒中'; });

// keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); spinWheel(); }
  if (e.key && e.key.toLowerCase() === 'v') { toggleListening(); }
});

// redraw wheel when filters change
[cuisineFilter, vegOnly, priceFilter].forEach(el => el.addEventListener('change', () => drawWheel(getFilteredItems())));

// init
function init() {
  drawWheel(getFilteredItems());
  statusEl.textContent = '等待唤醒中';
  // auto-start recognition where allowed
  // do not auto-start immediately on page load in many browsers — start on user gesture
}

init();
