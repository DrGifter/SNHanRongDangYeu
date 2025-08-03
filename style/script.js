const audio = document.getElementById("sound");
let isAudioPlaying = false;

function tryPlayAudio() {
  if (!isAudioPlaying) {
    audio.currentTime = 55;
    audio.play().then(() => {
      isAudioPlaying = true;
      console.log("Audio started automatically");
    }).catch((err) => {
      console.warn("Autoplay blocked. Waiting for user interaction...");
    });
  }
}

window.addEventListener("load", () => {
  tryPlayAudio();
});

["click", "touchstart", "keydown"].forEach(event => {
  document.body.addEventListener(event, tryPlayAudio, { once: true });
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const stars = [];
const explosions = [];
const shootingStars = [];

const fullText1 = ["Sinh nhật thật vui vẻ","Tuổi mới nhiều điều nhẹ nhàng"];
const fullText2 = ["Vừa đủ hạnh phúc","Vừa đủ may mắn"];
const fullText3 = ["Có những người","Tao không gặp nhiều"];
const fullText4 = ["Nhưng vẫn muốn nhớ","Và quan tâm hoài"];
const fullText5 = ["Và mày là một trong số đó"];
const fullText6 = ["Cảm ơn vì đã cho tao","Cảm giác muốn quan tâm tới","Một người nhiều như vậy"];
const fullText7 = ["Happy Birthday","Hân Rồng Đáng Yêu"];
// const allTexts = [fullText1, fullText2, fullText3, fullText4, fullText5, fullText6, fullText7];
// const fullText1 = ["M", "I"];
const allTexts = [fullText7]; 

const fallingIcons = [];
const iconList = ["💖", "🌟", "💎", "🌸", "✨", "🍀", "🫧"];

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const fontSize = isMobile ? 50 : 100;
const lineHeight = isMobile ? 80 : 120;
const fontFamily = "Arial";
const bearX = 70;
let bearY = canvas.height - 80;


let dots = [];
let targetDotsQueue = [];
let currentCharIndex = 0;
let animationDone = false;
let currentTextIndex = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  bearY = canvas.height - 80;

  stars.length = 0;
  for (let i = 0; i < 300; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      delta: (Math.random() * 0.02) + 0.005
    });
  }

  function checkOrientation() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isPortrait = window.innerHeight > window.innerWidth;
    const notice = document.getElementById("rotateNotice");

    if (isMobile && isPortrait) {
      notice.style.display = "block";
      canvas.style.display = "none";
      document.getElementById("bear").style.display = "none";
    } else {
      notice.style.display = "none";
      canvas.style.display = "block";
      document.getElementById("bear").style.display = "block";
    }
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    checkOrientation();
  });

  checkOrientation();
  targetDotsQueue = [];
  currentCharIndex = 0;
  animationDone = false;
  generateAllTargetDots();
}

resizeCanvas();

function drawStars() {
  for (let star of stars) {
    star.alpha += star.delta;
    if (star.alpha >= 1 || star.alpha <= 0) star.delta = -star.delta;

    ctx.save();
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#ff1493";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawShootingStars() {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];
    const endX = s.x - Math.cos(s.angle) * s.length;
    const endY = s.y - Math.sin(s.angle) * s.length;

    const gradient = ctx.createLinearGradient(s.x, s.y, endX, endY);
    gradient.addColorStop(0, `rgba(255, 20, 147, ${s.opacity})`);
    gradient.addColorStop(1, `rgba(255,255,255,0)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    s.x += Math.cos(s.angle) * s.speed;
    s.y += Math.sin(s.angle) * s.speed;
    s.opacity -= 0.01;
    if (s.opacity <= 0) shootingStars.splice(i, 1);
  }
}

function generateCharDots(char, x, y) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = `bold ${fontSize}px ${fontFamily}`;
  tempCtx.fillStyle = "red";
  tempCtx.fillText(char, x, y);
  const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height).data;
  const dots = [];
  for (let y = 0; y < canvas.height; y += 4) {
    for (let x = 0; x < canvas.width; x += 4) {
      const i = (y * canvas.width + x) * 4;
      if (imageData[i + 3] > 128) dots.push({ x, y });
    }
  }
  return dots;
}

function generateAllTargetDots() {
  const tempCtx = document.createElement('canvas').getContext('2d');
  tempCtx.font = `bold ${fontSize}px ${fontFamily}`;
  const lines = allTexts[currentTextIndex];
  const startY = (canvas.height - lines.length * lineHeight) / 2;

  lines.forEach((line, i) => {
    const lineWidth = tempCtx.measureText(line).width;
    let xCursor = (canvas.width - lineWidth) / 2;
    const y = startY + i * lineHeight;
    for (let char of line) {
      if (char === " ") {
        xCursor += tempCtx.measureText(" ").width;
        targetDotsQueue.push([]);
        continue;
      }
      const dots = generateCharDots(char, xCursor, y);
      targetDotsQueue.push(dots);
      xCursor += tempCtx.measureText(char).width;
    }
  });
}

function shootDot() {
  if (animationDone) return;
  while (currentCharIndex < targetDotsQueue.length && targetDotsQueue[currentCharIndex].length === 0) currentCharIndex++;

  const targetDots = targetDotsQueue[currentCharIndex];
  if (!targetDots) return;

  for (let i = 0; i < 5; i++) {
    const target = targetDots.shift();
    if (!target) return;
    const angle = Math.random() * Math.PI / 6 - Math.PI / 12;
    const speed = 3 + Math.random() * 2;
    dots.push({
      x: bearX + 40 + Math.random() * 20,
      y: bearY - 20 + Math.random() * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      targetX: target.x,
      targetY: target.y
    });
  }

  if (targetDots.length === 0 && currentCharIndex < targetDotsQueue.length - 1) currentCharIndex++;
}

function createFallingIcon() {
  const icon = iconList[Math.floor(Math.random() * iconList.length)];
  fallingIcons.push({
    icon: icon,
    x: Math.random() * canvas.width,
    y: -30,
    size: 24 + Math.random() * 16,
    speed: 1 + Math.random() * 2,
    sway: Math.random() * 1.5,
    angle: Math.random() * Math.PI * 2
  });
}

function animate() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#0a001f");
  gradient.addColorStop(1, "#1a0033");
  ctx.fillStyle = "#ffe6f0"; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();
  drawShootingStars();

  dots.forEach(dot => {
    const dx = dot.targetX - dot.x;
    const dy = dot.targetY - dot.y;
    dot.vx += dx * 0.002;
    dot.vy += dy * 0.002;
    dot.vx *= 0.95;
    dot.vy *= 0.91;
    dot.x += dot.vx;
    dot.y += dot.vy;
    ctx.font =isMobile ? "7px Arial" : "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("❤️", dot.x, dot.y);
  });

  for (let i = explosions.length - 1; i >= 0; i--) {
    const p = explosions[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life--;
    p.opacity -= 0.015;

    ctx.globalAlpha = Math.max(p.opacity, 0);
    ctx.fillStyle = "rgba(255, 20, 147, " + Math.max(p.opacity, 0) + ")";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (p.life <= 0 || p.opacity <= 0) explosions.splice(i, 1);
  }

  if (
    !animationDone &&
    currentCharIndex >= targetDotsQueue.length &&
    dots.every(dot => Math.abs(dot.targetX - dot.x) < 2 && Math.abs(dot.targetY - dot.y) < 2)
  ) {
    animationDone = true;

    setTimeout(() => {
      currentTextIndex++;
      if (currentTextIndex < allTexts.length) {
        targetDotsQueue = [];
        currentCharIndex = 0;
        dots = [];
        animationDone = false;
        generateAllTargetDots();
      } else {
        const bear = document.getElementById("bear");
        bear.src = "https://i.pinimg.com/originals/7e/f6/9c/7ef69cd0a6b0b78526c8ce983b3296fc.gif";

        const allAnh = document.querySelectorAll(".Anh");
        let index = 0;

        function showNextImage() {
          if (index >= allAnh.length) return;
          const img = allAnh[index];
          img.classList.add("show");
          index++;
          setTimeout(showNextImage, 1000); // mỗi ảnh hiện sau 1 giây
        }

        showNextImage();
      }

    }, 1000);
  }

  fallingIcons.forEach((f, index) => {
  f.y += f.speed;
  f.x += Math.sin(f.angle) * f.sway;
  f.angle += 0.01;
  
  ctx.font = `${f.size}px Arial`;
  ctx.fillText(f.icon, f.x, f.y);

  if (f.y > canvas.height + 50) fallingIcons.splice(index, 1);
});

  requestAnimationFrame(animate);
}

canvas.addEventListener("click", e => createExplosion(e.clientX, e.clientY));
canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  if (t) createExplosion(t.clientX, t.clientY);
});

setInterval(shootDot, 30);
// setInterval(createFallingIcon, 1000);
animate();