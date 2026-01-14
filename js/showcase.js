function createShinyItem(s, points) {
  
  const span = document.createElement("span");
  const urlName = s.Pokemon.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const imgContainer = document.createElement("div");
  imgContainer.className = "gif-container";

  const traitChecks = {
    Alpha: ["alpha-pokemon", "glow-alphapokemon"],
    "Secret Shiny": ["glow-pokemon"],
    Favourite: ["favourite-pokemon"],
  };

  Object.entries(traitChecks).forEach(([key, classes]) => {
    if (s[key]?.toLowerCase() === "yes") imgContainer.classList.add(...classes);
  });

  const iconMap = {
    "Secret Shiny": ["/images/Shiny Showcase/secretshiny.png", "secret-icon"],
    Egg: ["/images/Shiny Showcase/egg.png", "egg-icon"],
    Safari: ["/images/Shiny Showcase/safari.png", "safari-icon"],
    Event: ["/images/Shiny Showcase/event.png", "event-icon"],
    MysteriousBall: ["/images/Shiny Showcase/mysteriousball.gif", "mysteriousball-gif"],
    Favourite: ["/images/Shiny Showcase/heart.png", "favourite-heart"],
  };

  Object.entries(iconMap).forEach(([key, [src, cls]]) => {
    if (s[key]?.toLowerCase() === "yes") {
      const icon = document.createElement("img");
      icon.src = src;
      icon.className = cls;
      imgContainer.appendChild(icon);
    }
  });

  const reactionUrl = s["Reaction Link"]?.trim();
  if (reactionUrl) {
    const reactionIcon = document.createElement("img");
    reactionIcon.src = "/images/Shiny Showcase/reaction.png";
    reactionIcon.className = "reaction-icon";
    reactionIcon.onclick = (e) => {
      e.stopPropagation();
      window.open(reactionUrl, "_blank");
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

  let infoHTML = `<strong>${s.Pokemon}</strong>`;
  if (points !== undefined) infoHTML += `<div style="font-size:0.85rem;">(${points} pts)</div>`;

  const activeTraits = Object.keys(traitChecks).filter(t => s[t]?.toLowerCase() === "yes");
  if (activeTraits.length) infoHTML += `<div style="font-size:0.85rem;margin-top:2px;">${activeTraits.join(", ")}</div>`;

  if (reactionUrl) {
    infoHTML += `<div style="margin-top:2px;font-size:0.85rem;"><a href="${reactionUrl}" target="_blank" style="color:#4a90e2;text-decoration:underline;">Reaction</a></div>`;
  }

  info.innerHTML = infoHTML;

  span.append(imgContainer, info);
  return span;
}

function setupInfoBoxFlip() {
  const spans = Array.from(document.querySelectorAll(".shiny-list span, .favourite-list span"));
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const hideAllInfoBoxes = () => spans.forEach(span => {
    const infoBox = span.querySelector(".info-box");
    if (infoBox) infoBox.style.opacity = "0";
  });

  spans.forEach(span => {
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
        if (spanRect.left + leftPos + boxWidth > viewportWidth) boxWidth = viewportWidth - spanRect.left - leftPos - 8;
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
      span.addEventListener("click", e => {
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

async function renderTrophyBoard() {
  const container = document.getElementById("trophy-board-container");
  if (!container) return;

  try {
    const res = await fetch("./json/trophies.json");
    if (!res.ok) throw new Error("Failed to fetch trophies.json");

    const data = await res.json();
    const { trophies } = data;

    container.innerHTML = `
      <h1 class="trophy-board-title">Trophy Board</h1>
      <div class="trophy-grid"></div>
    `;

    const grid = container.querySelector(".trophy-grid");

    Object.entries(trophies).forEach(([name, imgSrc]) => {
      const trophyWrapper = document.createElement("div");
      trophyWrapper.className = "trophy-grid-item";

      const trophyImg = document.createElement("img");
      trophyImg.src = imgSrc;
      trophyImg.alt = name;
      trophyImg.className = "trophy-img";

      const trophyName = document.createElement("div");
      trophyName.className = "trophy-name";
      trophyName.textContent = name;

      trophyWrapper.appendChild(trophyImg);
      trophyWrapper.appendChild(trophyName);

      trophyWrapper.addEventListener("click", () => {
        window.location.hash = `trophy/${encodeURIComponent(name)}`;
      });

      grid.appendChild(trophyWrapper);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = `<h2 style="color:white;">Error loading Trophy Board</h2>`;
  }
}


async function initShowcase() {
    const trophies = {
  "Team Darkrai Shiny Wars Winner": "./images/trophy/darkrai_trophy.png",
  "SHOTM December 2025": "/images/trophies/mvp.png",
  "SHOTM December 2025": "/images/trophies/eventchamp.png",
  };

  const trophyAssignments = {
    "Team Darkrai Shiny Wars Winner": ["Blaziken","hyper","hyper","hyper","hyper","hyper","hyper"]
  };
  const pageContainer = document.getElementById("main-container");
  const showcaseContainer = () => document.getElementById("showcase");
  const searchInput = document.getElementById("playerSearch");
  if (!pageContainer) return;

  const JSON_FILE = "./shiny_database.json";
  const JSON_VERSION = "v20";
  let cachedData = null;

  const getData = async () => {
    if (cachedData) return cachedData;
    try {
      const res = await fetch(`${JSON_FILE}?v=${JSON_VERSION}&t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch JSON");
      cachedData = await res.json();
      return cachedData;
    } catch (err) {
      console.error("Error loading shiny_database.json:", err);
      return {};
    }
  };

  const data = await getData();

  const renderShowcase = async (filter = "") => {
    const container = showcaseContainer();
    if (!container) return;

    container.textContent = "";
    const fragment = document.createDocumentFragment();
    const lowerFilter = filter.toLowerCase();

    Object.entries(data)
      .sort((a, b) => b[1].shiny_count - a[1].shiny_count)
      .forEach(([player, playerData], index) => {
        if (filter && !player.toLowerCase().includes(lowerFilter)) return;

        const card = document.createElement("div");
        card.className = "player-card";

        const playerClass = index < 5 ? "player-name top-player" : index < 20 ? "player-name high-player" : "player-name";

        const trophyImg =
          index === 0 ? '<img src="/images/Shiny Showcase/gold.png" class="player-trophy">' :
          index === 1 ? '<img src="/images/Shiny Showcase/silver.png" class="player-trophy">' :
          index === 2 ? '<img src="/images/Shiny Showcase/bronze.png" class="player-trophy">' : "";

        const sparkle = index >= 3 ? ' <span class="sparkle">✨</span>' : "";

        card.innerHTML = `
          <a href="#player/${player.toLowerCase()}" class="${playerClass} player-link" data-player="${player.toLowerCase()}">
            #${index + 1} ${player} (${playerData.shiny_count})${sparkle} ${trophyImg}
          </a>
        `;

        const shinyList = document.createElement("div");
        shinyList.className = "shiny-list";
        Object.values(playerData.shinies).forEach(s => shinyList.appendChild(createShinyItem(s)));
        card.appendChild(shinyList);

        fragment.appendChild(card);
      });

    container.appendChild(fragment);
    setupInfoBoxFlip();
  };

  window.renderPlayerPage = async (playerName) => {
  const container = showcaseContainer();
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

  const shinyList = container.querySelector(".shiny-list");
  const favouriteList = container.querySelector(".favourite-list");

  container.querySelector(".back-button").addEventListener("click", () => window.location.hash = "");

  const shinies = Object.values(playerData.shinies);
  const favourites = shinies.filter(s => s.Favourite?.toLowerCase() === "yes");
  const normalShinies = shinies.filter(s => s.Favourite?.toLowerCase() !== "yes");

  if (favourites.length) {
    favouriteList.innerHTML = `<h2 class="favourites-header">My Follower</h2>`;
    favourites.forEach(s => {
      const shiny = createShinyItem(s);
      shiny.classList.add("big-shiny-wrapper", "favourite-shiny");

      const sparkle = document.createElement("div");
      sparkle.className = "favourite-sparkle";
      shiny.querySelector(".gif-container").appendChild(sparkle);

      favouriteList.appendChild(shiny);
    });
  }

  normalShinies.forEach(s => shinyList.appendChild(createShinyItem(s)));
  setupInfoBoxFlip();

  // --- Fetch trophies.json and create trophy shelf ---
  try {
    const response = await fetch('./json/trophies.json');
    if (!response.ok) throw new Error('Failed to load trophies.json');

    const trophiesData = await response.json();
    const { trophies, trophyAssignments } = trophiesData;

    const trophyShelf = createTrophyShelf(realKey, trophies, trophyAssignments);
    if (trophyShelf) container.querySelector(".player-page").appendChild(trophyShelf);
  } catch (error) {
    console.error('Error loading trophies:', error);
  }
};

// --- Existing search input handler ---
if (searchInput) searchInput.addEventListener("input", e => renderShowcase(e.target.value));

// --- Trophy helper functions ---
function createTrophyItem(playerName, trophies, trophyAssignments) {
  const container = document.createElement("div");
  container.className = "trophy-shelf";

  Object.entries(trophies).forEach(([awardName, imgSrc]) => {
    const assignedPlayers = trophyAssignments[awardName] || [];
    if (assignedPlayers.map(p => p.toLowerCase()).includes(playerName.toLowerCase())) {
      const trophy = document.createElement("img");
      trophy.src = imgSrc;
      trophy.alt = awardName;
      trophy.title = awardName;
      trophy.className = "player-trophy-item";
      container.appendChild(trophy);
    }
  });

  return container;
}

function createTrophyShelf(playerName, trophies, trophyAssignments) {
  const sectionContainer = document.createElement("div");
  sectionContainer.className = "player-trophy-section";

  const heading = document.createElement("h2");
  heading.textContent = "Trophy Board";
  heading.style.color = "#fff";
  heading.style.textAlign = "center";
  heading.style.marginBottom = "16px";
  heading.style.fontFamily = "Arial, sans-serif";
  heading.style.fontSize = "1.5rem";

  const shelfContainer = document.createElement("div");
  shelfContainer.className = "trophy-shelf-container";

  const shelf = document.createElement("div");
  shelf.className = "trophy-shelf";

  const normalizedPlayerName = playerName.trim().toLowerCase();

  Object.entries(trophies).forEach(([awardName, imgSrc]) => {
    const assignedPlayers = trophyAssignments[awardName] || [];
    const normalizedPlayers = assignedPlayers.map(p => p.trim().toLowerCase());

    if (normalizedPlayers.includes(normalizedPlayerName)) {
      const trophy = document.createElement("div");
      trophy.className = "trophy-wrapper";

      const trophyImg = document.createElement("img");
      trophyImg.src = imgSrc;
      trophyImg.alt = awardName;
      trophyImg.className = "player-trophy-item";

      const tooltip = document.createElement("div");
      tooltip.className = "trophy-tooltip";

      const MAX_VISIBLE = 5;
      let tooltipText = `<strong>${awardName}</strong><br>Winners: `;
      if (assignedPlayers.length <= MAX_VISIBLE) {
        tooltipText += assignedPlayers.join(", ");
      } else {
        const visiblePlayers = assignedPlayers.slice(0, MAX_VISIBLE).join(", ");
        const remainingCount = assignedPlayers.length - MAX_VISIBLE;
        tooltipText += `${visiblePlayers} +${remainingCount} more`;
      }

      tooltip.innerHTML = tooltipText;
      trophyImg.style.cursor = "pointer";
      trophyImg.addEventListener("click", () => {
      // Save current page so trophy page knows where to go back to
      sessionStorage.setItem("lastPageHash", window.location.hash || "#");

      window.location.hash = `trophy/${encodeURIComponent(awardName.toLowerCase())}`;
    });


      trophy.appendChild(trophyImg);
      trophy.appendChild(tooltip);
      shelf.appendChild(trophy);
    }
  });

  if (shelf.children.length > 0) {
    shelfContainer.appendChild(shelf);
    sectionContainer.appendChild(heading);
    sectionContainer.appendChild(shelfContainer);
    return sectionContainer;
  }
  

  return null;
}

// Then call
window.addEventListener("DOMContentLoaded", handleHashChange);



  renderShowcase();
}

