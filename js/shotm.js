async function initSHOTM(targetMonth, targetYear) {
  const container = document.getElementById("showcase");
  if (!container) return;

  const JSON_FILE = "./shiny_database.json";
  const JSON_VERSION = "v18";
  let cachedData = null;

  const TRAIT_POINTS = {
    Alpha: 50,
    "Secret Shiny": 10,
    Egg: 5,
    Safari: 5,
    Event: 5,
    "Honey Tree": 5,
  };

  const getData = async () => {
    if (cachedData) return cachedData;
    try {
      const res = await fetch(
        `${JSON_FILE}?v=${JSON_VERSION}&t=${Date.now()}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Failed to fetch JSON");
      cachedData = await res.json();
      return cachedData;
    } catch (err) {
      console.error("Error loading shiny_database.json:", err);
      return {};
    }
  };

  const [tierPokemon, tierPoints] = await Promise.all([
    fetch("./json/tier_pokemon.json").then((r) => r.json()),
    fetch("./json/tier_points.json").then((r) => r.json()),
  ]);

  const getCurrentMonthYear = () => {
    const now = new Date();
    return {
      month: now.toLocaleString("default", { month: "long" }).toLowerCase(),
      year: String(now.getFullYear()),
    };
  };

  const getPokemonTier = (pokemonName) => {
    const nameLower = pokemonName.toLowerCase();
    for (const [tier, names] of Object.entries(tierPokemon)) {
      if (names.includes(nameLower)) return tier;
    }
    return null;
  };

  const getPreviousRanks = (month, year) =>
    JSON.parse(localStorage.getItem(`shotm-ranks-${month}-${year}`) || "{}");
  const saveCurrentRanks = (month, year, ranks) =>
    localStorage.setItem(`shotm-ranks-${month}-${year}`, JSON.stringify(ranks));

  const calculateShinyPoints = (shiny) => {
    if (
      shiny.Sold?.toLowerCase() === "yes" ||
      shiny.Flee?.toLowerCase() === "yes"
    )
      return 0;

    let total = 0;
    const tier = getPokemonTier(shiny.Pokemon);
    if (tier) {
      const tierPoint = tierPoints[tier] || 0;
      total += tierPoint;
    }

    Object.entries(shiny).forEach(([key, value]) => {
      if (!value) return;
      if (TRAIT_POINTS[key] && value.toLowerCase() === "yes") {
        total += TRAIT_POINTS[key];
      }
    });

    return total;
  };

  const getShinyHuntersOfMonth = (data, monthOverride, yearOverride) => {
    const { month, year } =
      monthOverride && yearOverride
        ? { month: monthOverride.toLowerCase(), year: String(yearOverride) }
        : getCurrentMonthYear();

    const result = {};
    const notFound = new Set();

    Object.entries(data).forEach(([player, playerData]) => {

      const monthShinies = Object.values(playerData.shinies).filter((s) => {
        const m = s.Month?.toLowerCase()?.trim();
        const y = String(s.Year || "").trim();
        return m === month && y === year;
      });

      if (!monthShinies.length) return;

      let totalPoints = 0;
      monthShinies.forEach((s) => {
        const points = calculateShinyPoints(s);
        totalPoints += points;
      });

      result[player] = { shinies: monthShinies, points: totalPoints };
    });

    return { result, month, year, notFound };
  };

  const getAllTimeLeaderboard = (data) => {
    const allTime = {};
    Object.entries(data).forEach(([player, playerData]) => {
      allTime[player] = Object.values(playerData.shinies).reduce(
        (acc, s) => acc + calculateShinyPoints(s),
        0,
      );
    });

    return Object.entries(allTime)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([player, points], index) => ({ rank: index + 1, player, points }));
  };

  const data = await getData();
  const {
    result: shotmData,
    month,
    year,
    notFound,
  } = getShinyHuntersOfMonth(data, targetMonth, targetYear);

  container.innerHTML = `
    <div class="alltime-container">
      <button class="alltime-toggle">All-Time Leaderboard ▼</button>
      <div class="alltime-list"></div>
      <div class="points-container"></div>
    </div>
    <div class="shotm-page">
      <h1>Shiny Hunters of the Month</h1>
      <h2>${month.charAt(0).toUpperCase() + month.slice(1)} ${year}</h2>
      <div class="error-messages"></div>
      <div class="shotm-list"></div>
    </div>
  `;

  if (notFound.size) {
    container.querySelector(".error-messages").textContent =
      `Pokémon not found in tiers: ${[...notFound].join(", ")}`;
  }

  const allTimeList = container.querySelector(".alltime-list");
  const allTimeData = getAllTimeLeaderboard(data);
  const allTimeFragment = document.createDocumentFragment();

  allTimeData.forEach((entry) => {
    const div = document.createElement("div");
    const trophy =
      entry.rank === 1
        ? "🥇"
        : entry.rank === 2
          ? "🥈"
          : entry.rank === 3
            ? "🥉"
            : "";
    div.innerHTML = `${trophy} #${entry.rank} <a href="https://synergymmo.com/#player/${entry.player}" style="color:inherit; text-decoration:none;" target="_blank">${entry.player}</a> (${entry.points} pts)`;
    allTimeFragment.appendChild(div);
  });

  allTimeList.appendChild(allTimeFragment);

  container.querySelector(".alltime-toggle").addEventListener("click", (e) => {
    allTimeList.classList.toggle("show");
    e.target.textContent = allTimeList.classList.contains("show")
      ? "All-Time Leaderboard ▲"
      : "All-Time Leaderboard ▼";
  });

  const pointsWrapper = container.querySelector(".points-container");
  const pointsToggle = document.createElement("button");
  pointsToggle.className = "points-toggle";
  pointsToggle.textContent = "How Points are Calculated ▼";
  pointsWrapper.appendChild(pointsToggle);

  const pointsContent = document.createElement("div");
  pointsContent.className = "points-content";

  pointsWrapper.appendChild(pointsContent);

  Object.entries(tierPoints).forEach(([tier, pts]) => {
    const div = document.createElement("div");
    div.textContent = `${tier}: ${pts}`;
    pointsContent.appendChild(div);
  });

  Object.entries(TRAIT_POINTS).forEach(([trait, pts]) => {
    const div = document.createElement("div");
    div.textContent = `${trait}: ${pts}`;
    pointsContent.appendChild(div);
  });

  pointsToggle.addEventListener("click", () => {
    pointsContent.classList.toggle("show");
    pointsToggle.textContent = pointsContent.classList.contains("show")
      ? "How Points are Calculated ▲"
      : "How Points are Calculated ▼";
  });

  const list = container.querySelector(".shotm-list");
  const previousRanks = getPreviousRanks(month, year);
  const currentRanks = {};
  const shotmFragment = document.createDocumentFragment();

  Object.entries(shotmData)
    .sort((a, b) => b[1].points - a[1].points)
    .forEach(([player, info], index) => {
      currentRanks[player] = index + 1;

      const card = document.createElement("div");
      card.className = "player-card";

      const trophy =
        index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";

      let arrowImg = null;
      if (previousRanks[player] !== undefined) {
        arrowImg = document.createElement("img");
        if (index + 1 < previousRanks[player]) {
          arrowImg.src = "/images/up_arrow.png";
          arrowImg.alt = "Moved Up";
          arrowImg.className = "rank-arrow animate-up";
        } else if (index + 1 > previousRanks[player]) {
          arrowImg.src = "/images/down_arrow.png";
          arrowImg.alt = "Moved Down";
          arrowImg.className = "rank-arrow animate-down";
        } else {
          arrowImg = null;
        }
      }

      const header = document.createElement("h2");
      header.className = "player-name";

      const link = document.createElement("a");
      link.href = `https://synergymmo.com/#player/${player}`;
      link.textContent = player;
      link.style.color = "inherit";
      link.style.textDecoration = "none";
      link.target = "_blank";

      header.appendChild(document.createTextNode(`${trophy} `));
      header.appendChild(link);
      header.appendChild(document.createTextNode(` (${info.points} pts) `));
      if (arrowImg) header.appendChild(arrowImg);

      card.appendChild(header);

      const shinyList = document.createElement("div");
      shinyList.className = "shiny-list";

      info.shinies.forEach((s) => {
        const shinyPoints = calculateShinyPoints(s);
        if (shinyPoints > 0)
          shinyList.appendChild(createShinyItem(s, shinyPoints));
      });

      card.appendChild(shinyList);
      shotmFragment.appendChild(card);
    });

  list.appendChild(shotmFragment);

  saveCurrentRanks(month, year, currentRanks);
  setupInfoBoxFlip();
}

