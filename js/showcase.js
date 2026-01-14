function createShinyItem(s, points) {
  const span = document.createElement("span");
  const urlName = s.Pokemon.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const imgContainer = document.createElement("div");
  imgContainer.className = "gif-container";

  if (s["Reaction Link"]) {
    imgContainer.style.cursor = "pointer";
    imgContainer.onclick = () => window.open(s["Reaction Link"], "_blank");
  }

  // Add traits
  const traitChecks = {
    Alpha: ["alpha-pokemon", "glow-alphapokemon"],
    "Secret Shiny": ["glow-pokemon"],
    Favourite: ["favourite-pokemon"],
    "Honey Tree": ["honey-tree", "glow-honeytree"],
  };
  for (const [key, classes] of Object.entries(traitChecks)) {
    if (s[key]?.toLowerCase() === "yes") imgContainer.classList.add(...classes);
  }

  // Add icons
  const iconMap = {
    "Secret Shiny": ["/images/Shiny Showcase/secretshiny.png", "secret-icon"],
    "Honey Tree": ["/images/Shiny Showcase/honey.png", "honey-icon"],
    Egg: ["/images/Shiny Showcase/egg.png", "egg-icon"],
    Safari: ["/images/Shiny Showcase/safari.png", "safari-icon"],
    Event: ["/images/Shiny Showcase/event.png", "event-icon"],
    MysteriousBall: ["/images/Shiny Showcase/mysteriousball.gif", "mysteriousball-gif"],
    Favourite: ["/images/Shiny Showcase/heart.png", "favourite-heart"],
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
    reactionIcon.onclick = (e) => {
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

  // Info box
  const info = document.createElement("div");
  info.className = "info-box";

  const traitLabels = {
    "Secret Shiny": "Secret Shiny",
    "Honey Tree": "Honey Tree",
    "Legendary": "Legendary",
    Egg: "Egg",
    Alpha: "Alpha",
    Sold: "Sold/Fled",
    Event: "Event",
    MysteriousBall: "Mysterious Ball",
    Safari: "Safari",
    Favourite: "Favourite",
  };

  const traits = Object.keys(traitLabels)
    .filter((t) => s[t]?.toLowerCase() === "yes")
    .map((t) => traitLabels[t]);

  // Build HTML
  let infoHTML = `<strong>${s.Pokemon}</strong>`;

  if (points != null) {
    infoHTML += `<br>Points: ${points}`;
  }

  if (traits.length) infoHTML += `<br>${traits.join("<br>")}`;

  info.innerHTML = infoHTML;

  span.append(imgContainer, info);
  return span;
}
/**
 * Sets up hover/click for all info boxes in shiny lists.
 * Now global so it can be reused in SHOTM.
 */
function setupInfoBoxFlip() {
  const spans = document.querySelectorAll(".shiny-list span, .favourite-list span");
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const hideAllInfoBoxes = () => {
    spans.forEach((span) => {
      const infoBox = span.querySelector(".info-box");
      if (infoBox) infoBox.style.opacity = "0";
    });
  };

  spans.forEach((span) => {
    const infoBox = span.querySelector(".info-box");
    if (!infoBox) return;

    infoBox.style.pointerEvents = "none";
    infoBox.style.display = "block";
    infoBox.style.opacity = "0";
    infoBox.style.transition = "opacity 0.2s ease";

    const showInfoBox = () => {
      const spanRect = span.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      infoBox.style.width = "220px";
      let boxWidth = infoBox.offsetWidth;
      let leftPos = span.offsetWidth + 8;

      if (spanRect.right + boxWidth + 8 > viewportWidth) leftPos = -boxWidth - 8;

      if (isTouchDevice) {
        if (spanRect.left + leftPos + boxWidth > viewportWidth) {
          boxWidth = viewportWidth - spanRect.left - leftPos - 8;
          infoBox.style.width = boxWidth + "px";
        }
        if (spanRect.left + leftPos < 0) {
          boxWidth = boxWidth + (spanRect.left + leftPos);
          infoBox.style.width = Math.max(150, boxWidth) + "px";
          leftPos = -spanRect.left + 8;
        }
      }

      infoBox.style.left = leftPos + "px";
      infoBox.style.top = "50%";
      infoBox.style.transform = "translateY(-50%)";
      infoBox.style.opacity = "1";
    };

    if (isTouchDevice) {
      span.addEventListener("click", (e) => {
        e.stopPropagation();
        hideAllInfoBoxes();
        showInfoBox();
      });
    } else {
      span.addEventListener("mouseenter", showInfoBox);
      span.addEventListener("mouseleave", () => (infoBox.style.opacity = "0"));
    }
  });

  if (isTouchDevice) document.addEventListener("click", hideAllInfoBoxes);
}

// ------------------ INIT SHOWCASE ------------------

async function initShowcase() {
  const pageContainer = document.getElementById("main-container");
  const showcaseContainer = () => document.getElementById("showcase");
  const searchInput = document.getElementById("playerSearch");

  if (!pageContainer) return;

  const JSON_FILE = "./shiny_database.json";
  const JSON_VERSION = "v17";
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

  const data = await getData();

  // ------------------ RENDER MAIN SHOWCASE ------------------
  async function renderShowcase(filter = "") {
    const container = showcaseContainer();
    if (!container) return;

    container.textContent = "";
    const fragment = document.createDocumentFragment();
    const sortedPlayers = Object.entries(data).sort((a, b) => b[1].shiny_count - a[1].shiny_count);
    const lowerFilter = filter.toLowerCase();

    sortedPlayers.forEach(([player, playerData], index) => {
      if (filter && !player.toLowerCase().includes(lowerFilter)) return;

      const card = document.createElement("div");
      card.className = "player-card";

      const playerClass = index < 5 ? "player-name top-player" : index < 20 ? "player-name high-player" : "player-name";

      const trophyImg =
        index === 0 ? '<img src="/images/Shiny Showcase/gold.png" class="player-trophy">' :
        index === 1 ? '<img src="/images/Shiny Showcase/silver.png" class="player-trophy">' :
        index === 2 ? '<img src="/images/Shiny Showcase/bronze.png" class="player-trophy">' : "";

      const sparkle = index >= 3 ? ' <span class="sparkle">✨</span>' : "";

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
      Object.values(playerData.shinies).forEach((s) => shinyList.appendChild(createShinyItem(s)));
      card.appendChild(shinyList);

      fragment.appendChild(card);
    });

    container.appendChild(fragment);
    setupInfoBoxFlip();
  }

  // ------------------ PLAYER PAGE ------------------
  window.renderPlayerPage = async function (playerName) {
    const container = document.getElementById("showcase");
    if (!container) return;

    const data = await getData();
    const realKey = Object.keys(data).find(k => k.toLowerCase() === playerName.toLowerCase());
    if (!realKey) {
      container.innerHTML = `<h2 style="color:white;">Player "${playerName}" not found</h2>`;
      return;
    }

    const playerData = data[realKey];
    document.body.classList.add("player-page-active");

    container.innerHTML = `
      <div class="player-page">
        <button class="back-button">← Back to Showcase</button>
        <h1>${realKey}'s Shiny Collection ✨</h1>
        <p>Total Shinies: ${playerData.shiny_count}</p>
        <div class="favourite-list"></div>
        <div class="shiny-list large-shinies"></div>
      </div>
    `;

    container.querySelector(".back-button").addEventListener("click", () => {
      window.location.hash = "";
    });

    const shinyList = container.querySelector(".shiny-list");
    const favouriteList = container.querySelector(".favourite-list");

    const shinies = Object.values(playerData.shinies);
    const favourites = shinies.filter(s => s.Favourite?.toLowerCase() === "yes");
    const normalShinies = shinies.filter(s => s.Favourite?.toLowerCase() !== "yes");

    if (favourites.length) {
      favouriteList.innerHTML = `<h2 class="favourites-header">My Follower</h2>`;
      favourites.forEach((s) => {
        const shiny = createShinyItem(s);
        shiny.classList.add("big-shiny-wrapper", "favourite-shiny");

        const sparkle = document.createElement("div");
        sparkle.className = "favourite-sparkle";
        shiny.querySelector(".gif-container").appendChild(sparkle);

        favouriteList.appendChild(shiny);
      });
    }

    normalShinies.forEach((s) => shinyList.appendChild(createShinyItem(s)));
    setupInfoBoxFlip();
  };

  // ------------------ SEARCH ------------------
  if (searchInput) {
    searchInput.addEventListener("input", (e) => renderShowcase(e.target.value));
  }

  // ------------------ INITIAL RENDER ------------------
  renderShowcase();
}
