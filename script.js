const foodItems = [
  { name: "港式烧腊饭", color: "#ff7a59" },
  { name: "鸡蛋仔", color: "#ffd166" },
  { name: "咖喱饭", color: "#72c6a1" },
  { name: "海鲜粥", color: "#4dabf7" },
  { name: "牛腩面", color: "#ff8fab" },
  { name: "烧味拼盘", color: "#ffb703" },
  { name: "鱼蛋粉", color: "#9ad0c2" },
  { name: "甜品", color: "#f4a261" },
  { name: "日式拉面", color: "#f9a8d4" },
  { name: "韩式炸鸡", color: "#c084fc" },
  { name: "火锅", color: "#ef476f" },
  { name: "港式火腿肠面", color: "#90be6d" },
  { name: "潮州粉面", color: "#7cc6fe" },
  { name: "马来西亚叻沙", color: "#ffb4a2" },
  { name: "寿司", color: "#a5d8ff" },
  { name: "烧鹅饭", color: "#f6bd60" }
];

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const resultText = document.getElementById("resultText");
const resultBox = document.getElementById("result");
const spinBtn = document.getElementById("spinBtn");
const listenBtn = document.getElementById("listenBtn");
const statusEl = document.getElementById("status");
const closeResultBtn = document.getElementById("closeResult");

let rotation = 0;
let isSpinning = false;
let recognition = null;

function drawWheel() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2 - 15;
  const sliceAngle = (Math.PI * 2) / foodItems.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);

  foodItems.forEach((item, index) => {
    const start = index * sliceAngle;
    const end = start + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();

    ctx.save();
    ctx.rotate(start + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#1f1b1a";
    ctx.font = "600 18px 'Segoe UI', 'Noto Sans TC', sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(item.name, radius * 0.75, 0, radius * 0.6);
    ctx.restore();
  });

  // center circle
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.fillStyle = "#fff3d6";
  ctx.fill();
  ctx.strokeStyle = "#cf7e32";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // draw outer ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
  ctx.strokeStyle = "#d27c35";
  ctx.lineWidth = 8;
  ctx.stroke();
}

function spinWheel() {
  if (isSpinning) return;

  isSpinning = true;
  statusEl.textContent = "转盘中...";
  resultBox.classList.add("hidden");

  const winningIndex = Math.floor(Math.random() * foodItems.length);
  const anglePerItem = 360 / foodItems.length;
  const targetAngle = 360 * 6 + (360 - (winningIndex * anglePerItem + anglePerItem / 2));

  const startRotation = rotation;
  const duration = 5000;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    rotation = startRotation + (targetAngle * eased);
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      if (winningIndex >= 0 && winningIndex < foodItems.length) {
        const chosen = foodItems[winningIndex];
        resultText.textContent = chosen.name;
        resultBox.classList.remove("hidden");
      }
      statusEl.textContent = "就决定是它了";
    }
  }

  requestAnimationFrame(animate);
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    statusEl.textContent = "浏览器不支持语音识别";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "zh-HK";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    statusEl.textContent = "监听中...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    statusEl.textContent = "听到：" + transcript;

    const normalized = transcript.toLowerCase();
    if (normalized.includes("今天吃什么") || normalized.includes("今天吃咩") || normalized.includes("吃什么")) {
      spinWheel();
    }
  };

  recognition.onerror = (event) => {
    statusEl.textContent = "语音识别出错";
    console.error(event.error);
  };

  recognition.onend = () => {
    statusEl.textContent = "等待唤醒中";
  };
}

listenBtn.addEventListener("click", () => {
  if (!recognition) {
    setupSpeechRecognition();
  }

  if (recognition) {
    try {
      recognition.start();
    } catch (error) {
      // Ignore if already started
    }
  }
});

spinBtn.addEventListener("click", spinWheel);
closeResultBtn.addEventListener("click", () => {
  resultBox.classList.add("hidden");
  statusEl.textContent = "等待唤醒中";
});

function init() {
  drawWheel();
  statusEl.textContent = "等待唤醒中";
  setupSpeechRecognition();
}

init();
