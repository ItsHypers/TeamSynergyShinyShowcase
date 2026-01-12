function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

let starContainer = document.querySelector(".stars-container");
let starCount = window.innerWidth < 600 ? 3 : window.innerWidth < 1024 ? 6 : 10;

function createStar() {
  if (!starContainer) return;

  const star = document.createElement("div");
  star.classList.add("star");

  const size = randomBetween(2, 6);
  star.style.width = size + "px";
  star.style.height = size + "px";
  star.style.boxShadow = `0 0 ${size * 2}px #fff, 0 0 ${size * 3}px #fff, 0 0 ${size * 5}px #fff`;

  star.style.top = randomBetween(0, 50) + "px";
  star.style.left = randomBetween(0, window.innerWidth) + "px";
  star.speed = randomBetween(0.5, 3);
  star.opacity = randomBetween(0.4, 0.9);
  star.style.opacity = star.opacity;
  star.angle = randomBetween(240, 300);
  star.rad = (star.angle * Math.PI) / 180;
  star.tailLength = randomBetween(100, 300);
  star.style.setProperty("--tail-length", star.tailLength + "px");
  star.style.setProperty("--tail-rotate", `${star.angle}deg`);

  starContainer.appendChild(star);
  animateStar(star);
}

function animateStar(star) {
  function move() {
    const dx = Math.cos(star.rad) * star.speed;
    const dy = Math.sin(star.rad) * star.speed;

    star.style.left = parseFloat(star.style.left) - dx + "px";
    star.style.top = parseFloat(star.style.top) - dy + "px";

    star.opacity += (Math.random() - 0.5) * 0.05;
    star.opacity = Math.max(0.3, Math.min(1, star.opacity));
    star.style.opacity = star.opacity;

    if (
      parseFloat(star.style.left) < -200 ||
      parseFloat(star.style.top) > window.innerHeight + 200 ||
      parseFloat(star.style.left) > window.innerWidth + 200 ||
      parseFloat(star.style.top) < -200
    ) {
      resetStar(star);
    }

    requestAnimationFrame(move);
  }
  requestAnimationFrame(move);
}

function resetStar(star) {
  star.style.top = randomBetween(0, 50) + "px";
  star.style.left = randomBetween(0, window.innerWidth) + "px";
  star.speed = randomBetween(0.5, 3);
  star.opacity = randomBetween(0.4, 0.9);
  star.style.opacity = star.opacity;

  star.angle = randomBetween(240, 300);
  star.rad = (star.angle * Math.PI) / 180;
  star.tailLength = randomBetween(100, 300);
  star.style.setProperty("--tail-length", star.tailLength + "px");
  star.style.setProperty("--tail-rotate", `${star.angle}deg`);

  const size = randomBetween(2, 6);
  star.style.width = size + "px";
  star.style.height = size + "px";
  star.style.boxShadow = `0 0 ${size * 2}px #fff, 0 0 ${size * 3}px #fff, 0 0 ${size * 5}px #fff`;
}

function initStars() {
  if (!starContainer) return;

  starContainer.innerHTML = "";
  starCount = window.innerWidth < 600 ? 3 : window.innerWidth < 1024 ? 6 : 10;
  for (let i = 0; i < starCount; i++) {
    setTimeout(createStar, randomBetween(0, 3000));
  }
}

window.addEventListener("DOMContentLoaded", initStars);
window.addEventListener("resize", initStars);

async function fetchJSON(url) {
  try {
    const cacheBuster = Date.now();
    const res = await fetch(`${url}?t=${cacheBuster}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch JSON");
    return await res.json();
  } catch (err) {
    console.error(`Error fetching JSON: ${url}`, err);
    return null;
  }
}
