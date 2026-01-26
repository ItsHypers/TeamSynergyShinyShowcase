async function initSHOTM(targetMonth, targetYear) {
  const container = document.getElementById("showcase");
  if (!container) return;

  const JSON_FILE = "https://adminpage.hypersmmo.workers.dev/admin/database";

  const TRAIT_POINTS = {
    Alpha: 50,
    "Secret Shiny": 10,
    Egg: 5,
    Safari: 5,
    Event: 5,
    "Honey Tree": 5,
  };

  const [data, tierPokemon, tierPoints] = await Promise.all([
    fetch(`${JSON_FILE}?t=${Date.now()}`, { cache: "no-store" }).then(r => r.json()),
    fetch("./json/tier_pokemon.json").then(r => r.json()),
    fetch("./json/tier_points.json").then(r => r.json()),
  ]);

  const tierLookup = {};
  Object.entries(tierPokemon).forEach(([tier, names]) => {
    names.forEach(name => tierLookup[name.toLowerCase()] = tier);
  });
  const getPokemonTier = name => tierLookup[name.toLowerCase()] || null;

  const getCurrentMonthYear = () => {
    const now = new Date();
    return {
      month: now.toLocaleString("default", { month: "long" }).toLowerCase(),
      year: String(now.getFullYear()),
    };
  };

  const getPreviousRanks = (month, year) =>
    JSON.parse(localStorage.getItem(`shotm-ranks-${month}-${year}`) || "{}");
  const saveCurrentRanks = (month, year, ranks) =>
    localStorage.setItem(`shotm-ranks-${month}-${year}`, JSON.stringify(ranks));

  const calculateShinyPoints = shiny => {
    if (shiny.Sold?.toLowerCase() === "yes" || shiny.Flee?.toLowerCase() === "yes")
      return 0;

    let total = tierPoints[getPokemonTier(shiny.Pokemon)] || 0;

    total += Object.entries(TRAIT_POINTS).reduce((acc, [trait, pts]) => {
      return acc + (shiny[trait]?.toLowerCase() === "yes" ? pts : 0);
    }, 0);

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
      const monthShinies = Object.values(playerData.shinies).filter(s => {
        const m = s.Month?.toLowerCase()?.trim();
        const y = String(s.Year || "").trim();
        return m === month && y === year;
      });

      if (!monthShinies.length) return;

      const totalPoints = monthShinies.reduce((acc, s) => acc + calculateShinyPoints(s), 0);
      result[player] = { shinies: monthShinies, points: totalPoints };
    });

    return { result, month, year, notFound };
  };

  const getAllTimeLeaderboard = data => {
    const allTime = {};
    Object.entries(data).forEach(([player, playerData]) => {
      allTime[player] = Object.values(playerData.shinies).reduce(
        (acc, s) => acc + calculateShinyPoints(s),
        0
      );
    });

    return Object.entries(allTime)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([player, points], index) => ({ rank: index + 1, player, points }));
  };

  const { result: shotmData, month, year, notFound } = getShinyHuntersOfMonth(data, targetMonth, targetYear);

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
  allTimeData.forEach(entry => {
    const div = document.createElement("div");
    const trophy = ["🥇", "🥈", "🥉"][entry.rank - 1] || "";
    div.innerHTML = `${trophy} #${entry.rank} <a href="https://synergymmo.com/#player/${entry.player}" style="color:inherit; text-decoration:none;" target="_blank">${entry.player}</a> (${entry.points} pts)`;
    allTimeFragment.appendChild(div);
  });
  allTimeList.appendChild(allTimeFragment);
  container.querySelector(".alltime-toggle").addEventListener("click", e => {
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

  const pointsHTML = [
    ...Object.entries(tierPoints).map(([tier, pts]) => `${tier}: ${pts}`),
    ...Object.entries(TRAIT_POINTS).map(([trait, pts]) => `${trait}: ${pts}`)
  ].map(text => `<div>${text}</div>`).join("");

  pointsContent.innerHTML = pointsHTML;
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

      const trophy = ["🥇", "🥈", "🥉"][index] || "";

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

      const prevRank = previousRanks[player];
      if (prevRank !== undefined && prevRank !== index + 1) {
        const arrowImg = document.createElement("img");
        arrowImg.src = index + 1 < prevRank ? "/images/up_arrow.png" : "/images/down_arrow.png";
        arrowImg.alt = index + 1 < prevRank ? "Moved Up" : "Moved Down";
        arrowImg.className = `rank-arrow ${index + 1 < prevRank ? "animate-up" : "animate-down"}`;
        header.appendChild(arrowImg);
      }

      card.appendChild(header);

      const shinyList = document.createElement("div");
      shinyList.className = "shiny-list";

      info.shinies.forEach(s => {
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

