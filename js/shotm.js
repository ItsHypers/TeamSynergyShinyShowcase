async function initSHOTM(targetMonth, targetYear) {
  const container = document.getElementById("showcase");
  if (!container) return;

  const JSON_FILE = "./shiny_database.json";
  const JSON_VERSION = "v17";
  let cachedData = null;

  async function getData() {
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
  }

  // Load tier Pokémon and points
  const tierPokemon = await fetch("./json/tier_pokemon.json").then(r => r.json());
  const tierPoints = await fetch("./json/tier_points.json").then(r => r.json());

  function getCurrentMonthYear() {
    const now = new Date();
    return {
      month: now.toLocaleString("default", { month: "long" }).toLowerCase(),
      year: String(now.getFullYear())
    };
  }

  // Returns the tier for a given Pokémon
  function getPokemonTier(pokemonName) {
    for (const [tier, names] of Object.entries(tierPokemon)) {
      if (names.includes(pokemonName.toLowerCase())) return tier;
    }
    return null; // Pokémon not found
  }

  function getShinyHuntersOfMonth(data, targetMonth, targetYear) {
    const { month, year } = targetMonth && targetYear
      ? { month: targetMonth.toLowerCase(), year: String(targetYear) }
      : getCurrentMonthYear();

    const result = {};
    const notFound = new Set();

    Object.entries(data).forEach(([player, playerData]) => {
      const monthShinies = Object.values(playerData.shinies).filter(s => {
        const m = s.Month?.toLowerCase()?.trim();
        const y = String(s.Year || "").trim();
        if (!m || !y) return false;
        return m === month && y === year;
      });

      if (monthShinies.length) {
        let totalPoints = 0;
        monthShinies.forEach(s => {
          const tier = getPokemonTier(s.Pokemon);
          if (!tier) notFound.add(s.Pokemon);
          totalPoints += tierPoints[tier] || 0;
        });
        result[player] = { shinies: monthShinies, points: totalPoints };
      }
    });

    return { result, month, year, notFound };
  }

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
      Favourite: ["favourite-pokemon"],
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

    const info = document.createElement("div");
    info.className = "info-box";
    info.innerHTML = `<strong>${s.Pokemon}</strong>`;
    span.append(imgContainer, info);

    return span;
  }

  const data = await getData();
  const { result: shotmData, month, year, notFound } = getShinyHuntersOfMonth(data, targetMonth, targetYear);

  container.innerHTML = `
    <div class="shotm-page">
      <button class="back-button">← Back to Showcase</button>
      <h1>Shiny Hunters of the Month</h1>
      <h2>${month.charAt(0).toUpperCase() + month.slice(1)} ${year}</h2>
      <div class="error-messages"></div>
      <div class="shotm-list"></div>
    </div>
  `;

  // Show Pokémon not found
  if (notFound.size) {
    const errorDiv = container.querySelector(".error-messages");
    errorDiv.innerHTML = `<p style="color:red;">Pokémon not found in tiers: ${[...notFound].join(", ")}</p>`;
  }

  container.querySelector(".back-button").addEventListener("click", () => {
    window.location.hash = "";
  });

  const list = container.querySelector(".shotm-list");

  Object.entries(shotmData)
    .sort((a, b) => b[1].points - a[1].points)
    .forEach(([player, info], index) => {
      const card = document.createElement("div");
      card.className = "player-card";

      const trophy = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
      const header = document.createElement("h2");
      header.className = "player-name";
      header.textContent = `${trophy} ${player} (${info.points} pts)`;
      card.appendChild(header);

      const shinyList = document.createElement("div");
      shinyList.className = "shiny-list";
      info.shinies.forEach(s => shinyList.appendChild(createShinyItem(s)));
      card.appendChild(shinyList);

      list.appendChild(card);
    });

  setupInfoBoxFlip(); // Reuse from showcase.js
}
