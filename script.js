// ---------- CONFIG ----------
const JSON_VERSION = "v17"; // increment when shiny_database.json updates
const JSON_FILE = "shiny_database.json";

// ---------- CACHED DOM ----------
const showcaseContainer = document.getElementById("showcase");
const searchInput = document.getElementById("playerSearch");
const starContainer = document.querySelector('.stars-container');

// ---------- GET DATA ----------
let cachedData = null;

async function getData() {
  if (cachedData) return cachedData;

  try {
    const cacheBuster = Date.now();
    const res = await fetch(`${JSON_FILE}?v=${JSON_VERSION}&t=${cacheBuster}`, { cache: "no-store" });

    if (!res.ok) throw new Error("Failed to fetch JSON");

    cachedData = await res.json();
    return cachedData;
  } catch (err) {
    console.error("Error loading shiny_database.json:", err);
    return {};
  }
}

// ---------- CREATE SHINY ITEM ----------
function createShinyItem(s) {
  const span = document.createElement("span");
  const urlName = s.Pokemon.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const imgContainer = document.createElement("div");
  imgContainer.className = "gif-container";

  if (s["Reaction Link"]) {
    imgContainer.style.cursor = "pointer";
    imgContainer.onclick = () => window.open(s["Reaction Link"], "_blank");
  }

  const traitChecks = {
    Alpha: ["alpha-pokemon", "glow-alphapokemon"],
    "Secret Shiny": ["glow-pokemon"],
    Favourite: ["favourite-pokemon"]
  };

  for (const [key, classes] of Object.entries(traitChecks)) {
    if (s[key]?.toLowerCase() === "yes") {
      imgContainer.classList.add(...classes);
    }
  }

  const iconMap = {
    "Secret Shiny": ["secretshiny.png", "secret-icon"],
    Egg: ["egg.png", "egg-icon"],
    Safari: ["safari.png", "safari-icon"],
    Event: ["event.png", "event-icon"],
    MysteriousBall: ["mysteriousball.gif", "mysteriousball-gif"],
    Favourite: ["heart.png", "favourite-heart"]
  };

  for (const [key, [src, cls]] of Object.entries(iconMap)) {
    if (s[key]?.toLowerCase() === "yes") {
      const icon = document.createElement("img");
      icon.src = src;
      icon.className = cls;
      imgContainer.appendChild(icon);
    }
  }

  if (s["Reaction Link"]) {
    const reactionIcon = document.createElement("img");
    reactionIcon.src = "reaction.png";
    reactionIcon.className = "reaction-icon";
    reactionIcon.onclick = e => {
      e.stopPropagation();
      window.open(s["Reaction Link"], "_blank");
    };
    imgContainer.appendChild(reactionIcon);
  }

  const img = document.createElement("img");
  img.src = `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
  img.alt = s.Pokemon;
  img.className = "shiny-gif";
  if (s.Sold?.toLowerCase() === "yes") img.classList.add("sold-pokemon");

  const particle = document.createElement("img");
  particle.src = "sparkle.gif";
  particle.className = "particle-gif";

  imgContainer.append(img, particle);

  const info = document.createElement("div");
  info.className = "info-box";

  const traitLabels = {
    "Secret Shiny": "Secret Shiny",
    Egg: "Egg",
    Alpha: "Alpha",
    Sold: "Sold/Fled",
    Event: "Event",
    MysteriousBall: "Mysterious Ball",
    Safari: "Safari",
    Favourite: "Favourite"
  };

  const traits = Object.keys(traitLabels)
    .filter(t => s[t]?.toLowerCase() === "yes")
    .map(t => traitLabels[t]);

  info.innerHTML = `<strong>${s.Pokemon}</strong><br>${traits.length ? traits.join("<br>") : "None"}`;

  span.append(imgContainer, info);
  return span;
}

// ---------- RENDER SHOWCASE ----------
async function renderShowcase(filter = "") {
  const data = await getData();
  showcaseContainer.textContent = "";

  const fragment = document.createDocumentFragment();
  const sortedPlayers = Object.entries(data).sort((a, b) => b[1].shiny_count - a[1].shiny_count);
  const lowerFilter = filter.toLowerCase();

  sortedPlayers.forEach(([player, playerData], index) => {
    if (filter && !player.toLowerCase().includes(lowerFilter)) return;

    const card = document.createElement("div");
    card.className = "player-card";

    const playerClass =
      index < 5 ? "player-name top-player" :
      index < 20 ? "player-name high-player" :
      "player-name";

    const trophyImg =
      index === 0 ? '<img src="gold.png" class="player-trophy">' :
      index === 1 ? '<img src="silver.png" class="player-trophy">' :
      index === 2 ? '<img src="bronze.png" class="player-trophy">' : "";

    const sparkle = index >= 3 ? ' <span class="sparkle">✨</span>' : '';

    card.innerHTML = `
      <div class="${playerClass}">
        #${index + 1} ${player} (${playerData.shiny_count})${sparkle} ${trophyImg}
      </div>
    `;

    const shinyList = document.createElement("div");
    shinyList.className = "shiny-list";

    const shinyFragment = document.createDocumentFragment();
    Object.values(playerData.shinies).forEach(s => shinyFragment.appendChild(createShinyItem(s)));
    shinyList.appendChild(shinyFragment);

    card.appendChild(shinyList);
    fragment.appendChild(card);
  });

  showcaseContainer.appendChild(fragment);
  setupInfoBoxFlip(); // only once per render
}

// ---------- SEARCH EVENT ----------
searchInput.addEventListener("input", (e) => {
  renderShowcase(e.target.value);
});

// ---------- INIT ----------
(async function init() {
  await renderShowcase();
})();

// ---------- NAVIGATION MENU HANDLER ----------
(function setupMenu() {
  const nav = document.getElementById("top-nav");
  const tabs = nav.querySelectorAll("li");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const tabName = tab.textContent.trim().toLowerCase();
      handleTabClick(tabName);
    });
  });

  function handleTabClick(tabName) {
    switch(tabName) {
      case "shiny showcase":
        renderShowcase();
        break;
      case "shotm":
        showcaseContainer.innerHTML = `<div class="message">Shiny Hunter of the Month coming soon!</div>`;
        break;
      default:
        console.warn("No action defined for tab:", tabName);
    }
  }
})();

// ---------- SHOOTING STARS ----------
let starCount = window.innerWidth < 600 ? 3 : window.innerWidth < 1024 ? 6 : 10;

function randomBetween(min, max) { return Math.random() * (max - min) + min; }

function createStar() {
  const star = document.createElement('div');
  star.classList.add('star');

  const size = randomBetween(2, 6);
  star.style.width = size + 'px';
  star.style.height = size + 'px';
  star.style.boxShadow = `0 0 ${size*2}px #fff, 0 0 ${size*3}px #fff, 0 0 ${size*5}px #fff`;

  star.style.top = randomBetween(0, 50) + 'px';
  star.style.left = randomBetween(0, window.innerWidth) + 'px';
  star.speed = randomBetween(0.5, 3);
  star.opacity = randomBetween(0.4, 0.9);
  star.style.opacity = star.opacity;
  star.angle = randomBetween(240, 300);
  star.rad = star.angle * Math.PI / 180;
  star.tailLength = randomBetween(100, 300);
  star.style.setProperty('--tail-length', star.tailLength + 'px');
  star.style.setProperty('--tail-rotate', `${star.angle}deg`);

  starContainer.appendChild(star);
  animateStar(star);
}

function animateStar(star) {
  function move() {
    const dx = Math.cos(star.rad) * star.speed;
    const dy = Math.sin(star.rad) * star.speed;

    star.style.left = parseFloat(star.style.left) - dx + 'px';
    star.style.top = parseFloat(star.style.top) - dy + 'px';

    star.opacity += (Math.random() - 0.5) * 0.05;
    star.opacity = Math.max(0.3, Math.min(1, star.opacity));
    star.style.opacity = star.opacity;

    if (parseFloat(star.style.left) < -200 ||
        parseFloat(star.style.top) > window.innerHeight + 200 ||
        parseFloat(star.style.left) > window.innerWidth + 200 ||
        parseFloat(star.style.top) < -200) {
      resetStar(star);
    }

    requestAnimationFrame(move);
  }
  requestAnimationFrame(move);
}

function resetStar(star) {
  star.style.top = randomBetween(0, 50) + 'px';
  star.style.left = randomBetween(0, window.innerWidth) + 'px';
  star.speed = randomBetween(0.5, 3);
  star.opacity = randomBetween(0.4, 0.9);
  star.style.opacity = star.opacity;

  star.angle = randomBetween(240, 300);
  star.rad = star.angle * Math.PI / 180;
  star.tailLength = randomBetween(100, 300);
  star.style.setProperty('--tail-length', star.tailLength + 'px');
  star.style.setProperty('--tail-rotate', `${star.angle}deg`);

  const size = randomBetween(2, 6);
  star.style.width = size + 'px';
  star.style.height = size + 'px';
  star.style.boxShadow = `0 0 ${size*2}px #fff, 0 0 ${size*3}px #fff, 0 0 ${size*5}px #fff`;
}

for (let i = 0; i < starCount; i++) {
  setTimeout(createStar, randomBetween(0, 3000));
}

window.addEventListener('resize', () => {
  starContainer.innerHTML = '';
  starCount = window.innerWidth < 600 ? 3 : window.innerWidth < 1024 ? 6 : 10;
  for (let i = 0; i < starCount; i++) {
    setTimeout(createStar, randomBetween(0, 3000));
  }
});

// ---------- INFO BOX FLIP ----------
function setupInfoBoxFlip() {
  const spans = document.querySelectorAll('.shiny-list span');
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const hideAllInfoBoxes = () => {
    spans.forEach(span => {
      const infoBox = span.querySelector('.info-box');
      if (infoBox) infoBox.style.opacity = '0';
    });
  };

  spans.forEach(span => {
    const infoBox = span.querySelector('.info-box');
    if (!infoBox) return;

    infoBox.style.pointerEvents = 'none';
    infoBox.style.display = 'block';
    infoBox.style.opacity = '0';
    infoBox.style.transition = 'opacity 0.2s ease';

    const showInfoBox = () => {
      const spanRect = span.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      infoBox.style.width = '220px';
      let boxWidth = infoBox.offsetWidth;
      let leftPos = span.offsetWidth + 8;

      if (spanRect.right + boxWidth + 8 > viewportWidth) {
        leftPos = -boxWidth - 8;
      }

      if (isTouchDevice) {
        if (spanRect.left + leftPos + boxWidth > viewportWidth) {
          boxWidth = viewportWidth - spanRect.left - leftPos - 8;
          infoBox.style.width = boxWidth + 'px';
        }
        if (spanRect.left + leftPos < 0) {
          boxWidth = boxWidth + (spanRect.left + leftPos);
          infoBox.style.width = Math.max(150, boxWidth) + 'px';
          leftPos = -spanRect.left + 8;
        }
      }

      infoBox.style.left = leftPos + 'px';
      infoBox.style.top = '50%';
      infoBox.style.transform = 'translateY(-50%)';
      infoBox.style.opacity = '1';
    };

    if (isTouchDevice) {
      span.addEventListener('click', e => {
        e.stopPropagation();
        hideAllInfoBoxes();
        showInfoBox();
      });
    } else {
      span.addEventListener('mouseenter', showInfoBox);
      span.addEventListener('mouseleave', () => infoBox.style.opacity = '0');
    }
  });

  if (isTouchDevice) document.addEventListener('click', hideAllInfoBoxes);
}
