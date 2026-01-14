async function initSHOTM(targetMonth, targetYear) {
  const container = document.getElementById("showcase");
  if (!container) return;

  const JSON_FILE = "./shiny_database.json";
  const JSON_VERSION = "v17";
  let cachedData = null;

  // -----------------------------
  // Configurable points
  // -----------------------------
  const TRAIT_POINTS = {
    Alpha: 50,
    "Secret Shiny": 20,
    Favourite: 10,
    Egg: 5,
    Safari: 5,
    Event: 5,
    "Honey Tree": 5
  };

  // -----------------------------
  // Data fetching
  // -----------------------------
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

  const tierPokemon = await fetch("./json/tier_pokemon.json").then(r => r.json());
  const tierPoints = await fetch("./json/tier_points.json").then(r => r.json());

  function getCurrentMonthYear() {
    const now = new Date();
    return {
      month: now.toLocaleString("default", { month: "long" }).toLowerCase(),
      year: String(now.getFullYear())
    };
  }

  function getPokemonTier(pokemonName) {
    for (const [tier, names] of Object.entries(tierPokemon)) {
      if (names.includes(pokemonName.toLowerCase())) return tier;
    }
    return null;
  }

  // -----------------------------
  // Get previous/current ranks
  // -----------------------------
  function getPreviousRanks(month, year) {
    const key = `shotm-ranks-${month}-${year}`;
    return JSON.parse(localStorage.getItem(key) || "{}");
  }

  function saveCurrentRanks(month, year, ranks) {
    const key = `shotm-ranks-${month}-${year}`;
    localStorage.setItem(key, JSON.stringify(ranks));
  }

  // -----------------------------
  // Calculate total points for a shiny
  // -----------------------------
  function calculateShinyPoints(shiny) {
    let total = 0;

    // Add tier points
    const tier = getPokemonTier(shiny.Pokemon);
    if (tier) total += tierPoints[tier] || 0;

    // Add trait points
    for (const [trait, points] of Object.entries(TRAIT_POINTS)) {
      if (shiny[trait]?.toLowerCase?.() === "yes") {
        total += points;
      }
    }

    return total;
  }

  // -----------------------------
  // Get Shiny Hunters of the Month
  // -----------------------------
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

          totalPoints += calculateShinyPoints(s); // <-- updated points calculation
        });

        result[player] = { shinies: monthShinies, points: totalPoints };
      }
    });

    return { result, month, year, notFound };
  }

  // -----------------------------
  // Render leaderboard
  // -----------------------------
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

  if (notFound.size) {
    container.querySelector(".error-messages").innerHTML =
      `<p style="color:red;">Pokémon not found in tiers: ${[...notFound].join(", ")}</p>`;
  }

  container.querySelector(".back-button").addEventListener("click", () => {
    window.location.hash = "";
  });

  const list = container.querySelector(".shotm-list");
  const previousRanks = getPreviousRanks(month, year);
  const currentRanks = {};

  Object.entries(shotmData)
    .sort((a, b) => b[1].points - a[1].points)
    .forEach(([player, info], index) => {
      currentRanks[player] = index + 1;

      const card = document.createElement("div");
      card.className = "player-card";

      const trophy = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";

      // Rank arrows
      let arrowImg = null;
      if (previousRanks[player] !== undefined) {
        if (index + 1 < previousRanks[player]) {
          arrowImg = document.createElement("img");
          arrowImg.src = "/images/up_arrow.png";
          arrowImg.alt = "Moved Up";
          arrowImg.className = "rank-arrow animate-up";
        } else if (index + 1 > previousRanks[player]) {
          arrowImg = document.createElement("img");
          arrowImg.src = "/images/down_arrow.png";
          arrowImg.alt = "Moved Down";
          arrowImg.className = "rank-arrow animate-down";
        }
      }

      const header = document.createElement("h2");
      header.className = "player-name";
      const textNode = document.createTextNode(`${trophy} ${player} (${info.points} pts) `);
      header.appendChild(textNode);
      if (arrowImg) header.appendChild(arrowImg);
      card.appendChild(header);

      // Shiny list
      const shinyList = document.createElement("div");
      shinyList.className = "shiny-list";

      // Pass points directly to each shiny
      info.shinies.forEach(s => {
        const shinyPoints = calculateShinyPoints(s); // calculate points for this shiny
        shinyList.appendChild(createShinyItem(s, shinyPoints)); // pass points
      });


      card.appendChild(shinyList);
      list.appendChild(card);
    });

  saveCurrentRanks(month, year, currentRanks);
  setupInfoBoxFlip();
}