// ---------- INIT SHOWCASE ----------
async function initShowcase() {
  const pageContainer = document.getElementById("main-container");
  const showcaseContainer = document.getElementById("showcase");
  const searchInput = document.getElementById("playerSearch");

  if (!pageContainer || !showcaseContainer) return;

  // ---------- DATA ----------
  const JSON_FILE = "./shiny_database.json";
  const JSON_VERSION = "v17"; // increment if JSON updates
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
      if (s[key]?.toLowerCase() === "yes") imgContainer.classList.add(...classes);
    }

    const iconMap = {
      "Secret Shiny": ["/images/Shiny Showcase/secretshiny.png", "secret-icon"],
      Egg: ["/images/Shiny Showcase/egg.png", "egg-icon"],
      Safari: ["/images/Shiny Showcase/safari.png", "safari-icon"],
      Event: ["/images/Shiny Showcase/event.png", "event-icon"],
      MysteriousBall: ["/images/Shiny Showcase/mysteriousball.gif", "mysteriousball-gif"],
      Favourite: ["/images/Shiny Showcase/heart.png", "favourite-heart"]
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
      reactionIcon.src = "/images/Shiny Showcase/reaction.png";
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
    particle.src = "/images/Shiny Showcase/sparkle.gif";
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
        index === 0 ? '<img src="/images/Shiny Showcase/gold.png" class="player-trophy">' :
        index === 1 ? '<img src="/images/Shiny Showcase/silver.png" class="player-trophy">' :
        index === 2 ? '<img src="/images/Shiny Showcase/bronze.png" class="player-trophy">' : "";

      const sparkle = index >= 3 ? ' <span class="sparkle">✨</span>' : '';

      const playerLink = `
        <a href="#player/${player.toLowerCase()}" 
           class="${playerClass} player-link"
           data-player="${player.toLowerCase()}">
          #${index + 1} ${player} (${playerData.shiny_count})${sparkle} ${trophyImg}
        </a>
      `;
      card.innerHTML = playerLink;

      const shinyList = document.createElement("div");
      shinyList.className = "shiny-list";
      Object.values(playerData.shinies).forEach(s => shinyList.appendChild(createShinyItem(s)));
      card.appendChild(shinyList);

      fragment.appendChild(card);
    });

    showcaseContainer.appendChild(fragment);
    setupInfoBoxFlip();
  }

  // ---------- SEARCH ----------
  if (searchInput) {
    searchInput.addEventListener("input", e => renderShowcase(e.target.value));
  }

  // ---------- PLAYER PAGE ----------
async function loadPlayerPage(playerName) {
  // Ensure #showcase exists
  let showcase = document.getElementById("showcase");
  if (!showcase) {
    const res = await fetch("/pages/shiny-showcase.html");
    if (!res.ok) {
      pageContainer.innerHTML = `<div class="message">Error loading showcase page.</div>`;
      return;
    }
    pageContainer.innerHTML = await res.text();

    // Re-select showcase after injecting HTML
    showcase = document.getElementById("showcase");

    // Re-init the showcase (only for rendering all shinies)
    if (typeof initShowcase === "function") await initShowcase();
  }

  const data = await getData();
  document.body.classList.add("player-page-active");

  const realKey = Object.keys(data).find(k => k.toLowerCase() === playerName.toLowerCase());
  if (!realKey) {
    if (showcase) {
      showcase.innerHTML = `
        <h2 style="color:white;">Player "${playerName}" not found</h2>
        <p style="color:white;">Check spelling or try again.</p>
      `;
    }
    return;
  }

  const playerData = data[realKey];

  showcase.innerHTML = `
    <div class="player-page">
      <button class="back-button">← Back to Showcase</button>
      <h1>${realKey}'s Shiny Collection ✨</h1>
      <p>Total Shinies: ${playerData.shiny_count}</p>
      <div class="shiny-list large-shinies"></div>
    </div>
  `;

  const backBtn = showcase.querySelector(".back-button");
  backBtn.addEventListener("click", () => {
    window.location.hash = ""; // back to showcase
    document.body.classList.remove("player-page-active");
    renderShowcase();
  });

  const shinyList = showcase.querySelector(".shiny-list");
  Object.values(playerData.shinies).forEach(s => {
    const shiny = createShinyItem(s);
    shiny.classList.add("big-shiny-wrapper");
    shinyList.appendChild(shiny);
  });

  setupInfoBoxFlip();
}

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

        if (spanRect.right + boxWidth + 8 > viewportWidth) leftPos = -boxWidth - 8;

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

  // ---------- HASH ROUTING ----------
  function handleHash() {
    const hash = window.location.hash.slice(1); // remove #
    if (hash.startsWith("player/")) {
      const playerName = hash.split("/")[1];
      loadPlayerPage(playerName);
    } else {
      document.body.classList.remove("player-page-active");
      renderShowcase();
    }
  }

  window.addEventListener("hashchange", handleHash);
  handleHash(); // run on initial load

  // ---------- PLAYER LINK CLICK NAV ----------
  document.addEventListener("click", e => {
    const link = e.target.closest("a.player-link");
    if (!link) return;

    e.preventDefault();
    const player = link.dataset.player;
    window.location.hash = `player/${player}`;
  });
}
