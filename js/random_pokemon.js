async function initRandomPokemon() {
  let bingoMilestone = 0;
  const container = document.getElementById("showcase");
  if (!container) return;

  container.innerHTML = `
    <div class="random-pokemon-page" style="position:relative;">
      <h1>Random Pokémon Generator</h1>

      <div class="tab-container">
        <button class="tab-btn active" data-tab="single">Random Pokémon</button>
        <button class="tab-btn" data-tab="bingo">Bingo Card</button>
      </div>

      <div class="tier-filters">
        <h3>Tier Filters</h3>
        <div id="tierCheckboxes"></div>
      </div>

      <div id="bingoSettings" style="display:none;">
        <label>
          Bingo Size:
          <select id="bingoSize">
            <option value="3">3x3</option>
            <option value="4" >4x4</option>
            <option value="5" selected>5x5</option>
            <option value="6">6x6</option>
            <option value="7">7x7</option>
            <option value="8">8x8</option>
            <option value="9">9x9</option>
          </select>
        </label>
      </div>

      <button id="generateBtn">Generate</button>

      <div class="random-result">
        <p>Tier: <span id="randomTier">---</span></p>
        <p>Pokémon: <span id="randomPokemon">---</span></p>
      </div>

      <div class="previous-log">
        <h3>Previously Selected Pokémon:</h3>
        <ul id="previousPokemonList"></ul>
      </div>

      <div class="bingo-card" id="bingoCard"></div>

      <div id="bingoOverlay" class="bingo-overlay" style="display:none;">
      <div class="bingo-message"></div> <!-- empty -->
      <canvas id="fireworksCanvas"></canvas>
    </div>
    </div>
  `;

  const JSON_FILE = "./json/tier_pokemon.json";
  let tierData = null;
  let history = [];
  let currentTab = "single";

  const formatPokemonName = (name) =>
    name ? name.charAt(0).toUpperCase() + name.slice(1) : name;
  const getPokemonImageUrl = (name) => {
    let urlName = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[.']/g, "")
      .replace(/[♀]/g, "f")
      .replace(/[♂]/g, "m")
      .replace(/\[.*\]/, "");
    return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
  };

  const saveBingo = (data) =>
    localStorage.setItem("bingoCard", JSON.stringify(data));
  const loadBingo = () => {
    const saved = localStorage.getItem("bingoCard");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  };

  const getTierData = async () => {
    if (tierData) return tierData;
    try {
      const res = await fetch(JSON_FILE, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch tier_pokemon.json");
      tierData = await res.json();
      return tierData;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const normalizeTiers = (data) => ({
    "Tier 0": data["Tier 0"] || [],
    "Tier 1": data["Tier 1"] || [],
    "Tier 2": data["Tier 2"] || [],
    "Tier 3": [...(data["Tier 3"] || []), ...(data["Tier 4"] || [])],
    "Tier 4": data["Tier 5"] || [],
    "Tier 5": data["Tier 6"] || [],
    "Tier 6": data["Tier 7"] || [],
  });

  const createTierFilters = (tiers) => {
    const wrapper = container.querySelector("#tierCheckboxes");
    wrapper.innerHTML = "";
    Object.keys(tiers).forEach((tier) => {
      const label = document.createElement("label");
      label.style.display = "block";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = tier;
      checkbox.checked = true;
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${tier}`));
      wrapper.appendChild(label);
    });
  };
  const getEnabledTiers = () => {
    const checkboxes = container.querySelectorAll(
      "#tierCheckboxes input[type='checkbox']",
    );
    return Array.from(checkboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
  };
  const getRandomTierPokemon = (data, enabledTiers) => {
    if (!enabledTiers.length) return null;
    const tier = enabledTiers[Math.floor(Math.random() * enabledTiers.length)];
    const list = data[tier];
    if (!list || !list.length) return null;
    const poke = list[Math.floor(Math.random() * list.length)];
    return { tier, pokemon: poke };
  };

  const rawData = await getTierData();
  if (!rawData) return;
  const normalizedTiers = normalizeTiers(rawData);
  createTierFilters(normalizedTiers);

  const generateBtn = container.querySelector("#generateBtn");
  const tierSpan = container.querySelector("#randomTier");
  const pokemonSpan = container.querySelector("#randomPokemon");
  const previousList = container.querySelector("#previousPokemonList");
  const bingoCard = container.querySelector("#bingoCard");
  const bingoSettings = container.querySelector("#bingoSettings");
  const bingoSizeSelect = container.querySelector("#bingoSize");
  const tabButtons = container.querySelectorAll(".tab-btn");
  const randomResultDiv = container.querySelector(".random-result");
  const logDiv = container.querySelector(".previous-log");
  const bingoOverlay = container.querySelector("#bingoOverlay");

  const bingoMessages = ["", "1st Line!", "2nd Line!", "Full House!"];

  function renderBingoCard(card, size, completed) {
    bingoCard.innerHTML = "";
    bingoCard.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    const containerWidth = Math.min(
      bingoCard.clientWidth,
      window.innerWidth - 40,
    );
    const gap = 6;
    const cellSize = (containerWidth - gap * (size - 1)) / size;

    card.forEach((poke, idx) => {
      const div = document.createElement("div");
      div.className = "bingo-cell";
      div.style.width = `${cellSize}px`;
      div.style.height = `${cellSize}px`;
      if (completed.includes(idx)) div.classList.add("completed");

      const img = document.createElement("img");
      img.src = getPokemonImageUrl(poke);
      img.alt = formatPokemonName(poke);
      img.className = "bingo-img";
      img.style.width = `${cellSize * 0.875}px`;
      img.style.height = `${cellSize * 0.875}px`;
      div.appendChild(img);

      bingoCard.appendChild(div);

      div.addEventListener("click", () => {
        const saved = loadBingo() || { card, size, completed: [] };
        if (!saved.completed) saved.completed = [];

        if (div.classList.contains("completed")) {
          div.classList.remove("completed");
          saved.completed = saved.completed.filter((i) => i !== idx);
        } else {
          div.classList.add("completed");
          saved.completed.push(idx);
        }

        saveBingo(saved);

        const totalLines = checkBingo(saved.completed, saved.size);
        const allComplete = saved.completed.length === saved.card.length;

        let milestone = 0;
        if (allComplete && bingoMilestone < 3) milestone = 3;
        else if (totalLines === 2 && bingoMilestone < 2) milestone = 2;
        else if (totalLines === 1 && bingoMilestone < 1) milestone = 1;

        if (milestone > 0) {
          bingoMilestone = milestone;
          showBingoOverlay(milestone);
        }
      });
    });
  }

  function showBingoOverlay(milestone) {
    const overlay = document.getElementById("bingoOverlay");
    const message = overlay.querySelector(".bingo-message");
    message.textContent = ["", "1st Line!", "2nd Line!", "Full House!"][
      milestone
    ];

    overlay.style.display = "flex";

    const canvas = document.getElementById("fireworksCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    launchFireworks(canvas);

    setTimeout(() => {
      overlay.style.display = "none";
    }, 4000);
  }

  const checkBingo = (completed, size) => {
    let lines = 0;
    for (let r = 0; r < size; r++)
      if (
        [...Array(size).keys()].every((c) => completed.includes(r * size + c))
      )
        lines++;
    for (let c = 0; c < size; c++)
      if (
        [...Array(size).keys()].every((r) => completed.includes(r * size + c))
      )
        lines++;
    if ([...Array(size).keys()].every((i) => completed.includes(i * size + i)))
      lines++;
    if (
      [...Array(size).keys()].every((i) =>
        completed.includes(i * size + (size - 1 - i)),
      )
    )
      lines++;
    return lines;
  };

  function triggerBingo() {
    const canvas = document.getElementById("fireworksCanvas");

    bingoOverlay.style.display = "flex";

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    launchFireworks();
  }

  function launchFireworks(canvas) {
    const ctx = canvas.getContext("2d");
    const particles = [];
    const numParticles = 150;

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * -2 - 1,
        radius: Math.random() * 3 + 2,
        alpha: 1,
        color: `hsl(${Math.random() * 360}, 100%, 60%)`,
        gravity: 0.03,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p) => {
        if (p.alpha <= 0) return;
        active = true;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= 0.003;
      });

      if (active) requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    animate();
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (currentTab === btn.dataset.tab) return;
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.dataset.tab;

      const title = container.querySelector("h1");

      if (currentTab === "single") {
        bingoSettings.style.display = "none";
        randomResultDiv.style.display = "block";
        logDiv.style.display = "block";
        bingoCard.style.display = "none";
        title.textContent = "Random Pokémon Generator";
      } else {
        bingoSettings.style.display = "block";
        randomResultDiv.style.display = "none";
        logDiv.style.display = "none";
        bingoCard.style.display = "grid";
        title.textContent = "Random Bingo Card Generator";

        const saved = loadBingo();
        if (saved && saved.card && saved.size) {
          renderBingoCard(saved.card, saved.size, saved.completed || []);
        } else {
          generateBtn.click();
        }
      }
    });
  });

  generateBtn.addEventListener("click", () => {
    const enabledTiers = getEnabledTiers();
    if (!enabledTiers.length) return;

    if (currentTab === "single") {
      const result = getRandomTierPokemon(normalizedTiers, enabledTiers);
      if (!result) return;

      const tierNumber = result.tier.replace("Tier ", "");

      tierSpan.textContent = tierNumber;
      pokemonSpan.innerHTML = "";

      const nameEl = document.createElement("p");
      nameEl.textContent = formatPokemonName(result.pokemon);
      nameEl.style.fontWeight = "600";
      nameEl.style.fontSize = "1.3rem";
      nameEl.style.marginBottom = "6px";
      nameEl.style.textAlign = "center";
      pokemonSpan.appendChild(nameEl);

      const img = document.createElement("img");
      img.src = getPokemonImageUrl(result.pokemon);
      img.alt = formatPokemonName(result.pokemon);
      img.className = "pokemon-img";
      pokemonSpan.appendChild(img);

      history.unshift(
        `${formatPokemonName(result.pokemon)} (Tier ${tierNumber})`,
      );
      if (history.length > 10) history.pop();
      previousList.innerHTML = "";
      history.forEach((entry) => {
        const li = document.createElement("li");
        li.textContent = entry;
        previousList.appendChild(li);
      });
    }

    if (currentTab === "bingo") {
      const size = parseInt(bingoSizeSelect.value);
      const allPokemon = enabledTiers.flatMap((t) => normalizedTiers[t]);
      if (!allPokemon.length) return;

      const card = [];
      while (card.length < size * size) {
        const poke = allPokemon[Math.floor(Math.random() * allPokemon.length)];
        if (!card.includes(poke)) card.push(poke);
      }

      saveBingo({ card, size, completed: [] });
      renderBingoCard(card, size, []);
      bingoMilestone = 0;
    }
  });

  const savedBingo = loadBingo();
  if (savedBingo && savedBingo.card && savedBingo.size) {
    bingoSettings.style.display = "block";
    randomResultDiv.style.display = "none";
    logDiv.style.display = "none";
    bingoCard.style.display = "grid";
    renderBingoCard(
      savedBingo.card,
      savedBingo.size,
      savedBingo.completed || [],
    );
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabButtons[1].classList.add("active");
    currentTab = "bingo";
    container.querySelector("h1").textContent = "Random Bingo Card Generator";
  }
}

