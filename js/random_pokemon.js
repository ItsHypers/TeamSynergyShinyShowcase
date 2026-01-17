const ODDS = {
  "Tier 0": 5,
  "Tier 1": 8,
  "Tier 2": 15,
  "Tier 3": 30,
  "Tier 4": 45,
  "Tier 5": 70,
  "Tier 6": 100,
};


async function initRandomPokemon() {
  let bingoMilestone = 0;
  const container = document.getElementById("showcase");
  const NATURES = [
    "Lonely",
    "Brave",
    "Adamant",
    "Naughty",
    "Bold",
    "Relaxed",
    "Impish",
    "Lax",
    "Timid",
    "Hasty",
    "Jolly",
    "Naive",
    "Modest",
    "Mild",
    "Quiet",
    "Rash",
    "Calm",
    "Gentle",
    "Sassy",
    "Careful",
    "Hardy",
    "Docile",
    "Serious",
    "Bashful",
    "Quirky",
  ];

  if (!container) return;

  container.innerHTML = `
    <div class="random-pokemon-page" style="position:relative;">
      <h1>Random Pokémon Generator</h1>

      <div class="tab-container">
        <button class="tab-btn" data-tab="single">Random Pokémon</button>
        <button class="tab-btn active" data-tab="bingo">Bingo Card</button>
      </div>

      <div id="bingocheckBoxes">
          <label><input type="checkbox" id="enableShiny" checked> Enable Shiny Pokémon</label><br>
        <label><input type="checkbox" id="allowNormal"> Allow Non-Shiny Pokémon</label><br>
        <label><input type="checkbox" id="allowNature"> Allow Random Nature Tasks</label><br>
        <label><input type="checkbox" id="allowIV"> Allow Random IV Tasks</label>
      </div>
      <div id="bingoExtraSettings">

        <!-- Shiny Tier Filter -->
        <div class="tier-filters" id="shinyTierFilter" style="margin-top: 10px;">
          <h3>Shiny Tier Filter</h3>
          <div id="tierCheckboxes"></div>
        </div>

        <!-- Bingo Mode Percentages -->
        <div id="bingoModeSettings">
          <h4>Mode Weights</h4>
          <p>low number = low chance, high number = high chance</p>

          <label id="labelShiny">
            Shiny:
            <input type="number" id="pctShiny" min="1" max="100" value="50">
          </label>

          <label id="labelNormal">
            Non-Shiny:
            <input type="number" id="pctNormal" min="1" max="100" value="50">
          </label>

          <label id="labelNature">
            Nature:
            <input type="number" id="pctNature" min="1" max="100" value="50">
          </label>

          <label id="labelIV">
            Random IV:
            <input type="number" id="pctIV" min="1" max="100" value="50">
          </label>
        </div>
      </div>

      <div id="bingoSettings" style="display:none;">
        <label>
          Bingo Size:
          <select id="bingoSize">
            <option value="3">3x3</option>
            <option value="4">4x4</option>
            <option value="5" selected>5x5</option>
            <option value="6">6x6</option>
            <option value="7">7x7</option>
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
        <div class="bingo-message"></div>
        <canvas id="fireworksCanvas"></canvas>
      </div>
    </div>

    <div id="warningPopup" class="warning-popup" style="display:none;">
    <div class="popup-content">
      ⚠️ Please select at least one mode (Shiny, Non-Shiny, Nature, or IV)!
    </div>
  </div>
  `;

  const enableShinyCheckbox = container.querySelector("#enableShiny");
  const allowNormalCheckbox = container.querySelector("#allowNormal");
  const allowNatureCheckbox = container.querySelector("#allowNature");
  const allowIVCheckbox = container.querySelector("#allowIV");
  const shinyTierFilterDiv = container.querySelector("#shinyTierFilter");
  const bingoModeSettingsDiv = container.querySelector("#bingoModeSettings");

function updateSettingsVisibility() {
  const bingoCheckboxes = document.getElementById("bingocheckBoxes");
  const bingoCard = document.getElementById(".bingo-card");

  if (currentTab !== "bingo") {
    // Single tab: hide bingo panels
    if (bingoCheckboxes) bingoCheckboxes.style.display = "none";
    if(bingoCard) bingoCard.style.display = "none";
    if (bingoModeSettingsDiv) bingoModeSettingsDiv.style.display = "none";
    return;
  }

  // Bingo tab: show bingo checkboxes
  if (bingoCheckboxes) bingoCheckboxes.style.display = "block";
  if(bingoCard) bingoCard.style.display = "block";

  // Show Shiny Tier Filter only if Shiny is enabled
  if (shinyTierFilterDiv)
    shinyTierFilterDiv.style.display = enableShinyCheckbox.checked
      ? "block"
      : "none";

  // Show/hide the percentage inputs based on their respective checkboxes
  const modes = [
    { cb: enableShinyCheckbox, div: document.querySelector("#pctShiny").parentElement },
    { cb: allowNormalCheckbox, div: document.querySelector("#pctNormal").parentElement },
    { cb: allowNatureCheckbox, div: document.querySelector("#pctNature").parentElement },
    { cb: allowIVCheckbox, div: document.querySelector("#pctIV").parentElement },
  ];

  modes.forEach((m) => {
    if (m.div) m.div.style.display = m.cb.checked ? "block" : "none";
  });

  // Show Bingo Mode Settings only if 2 or more modes are enabled
  const countChecked = modes.filter((m) => m.cb.checked).length;
  if (bingoModeSettingsDiv)
    bingoModeSettingsDiv.style.display = countChecked >= 2 ? "block" : "none";
}


  [
    enableShinyCheckbox,
    allowNormalCheckbox,
    allowNatureCheckbox,
    allowIVCheckbox,
  ].forEach((cb) => cb.addEventListener("change", updateSettingsVisibility));

  let currentTab = "bingo";
  updateSettingsVisibility();

  const JSON_FILE = "./json/tier_pokemon.json";
  let tierData = null;
  let history = [];

  const formatPokemonName = (name) =>
    name ? name.charAt(0).toUpperCase() + name.slice(1) : name;

  const getPokemonImageUrl = (name, isShiny = true) => {
    let urlName = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[.']/g, "")
      .replace(/[♀]/g, "f")
      .replace(/[♂]/g, "m")
      .replace(/\[.*\]/, "");

    const type = isShiny ? "shiny" : "normal";
    return `https://img.pokemondb.net/sprites/black-white/anim/${type}/${urlName}.gif`;
  };

  const saveBingo = (data) =>
    localStorage.setItem("bingoCard", JSON.stringify(data));
  const loadBingo = () => {
    const saved = localStorage.getItem("bingoCard");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
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

    const weightHeader = document.createElement("div");
    weightHeader.style.fontWeight = "600";
    weightHeader.style.marginBottom = "6px";
    weightHeader.textContent =
      "Tier Checkbox / Weights (higher number = more chance of generating)";
    wrapper.appendChild(weightHeader);

    Object.keys(tiers).forEach((tier) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.marginBottom = "4px";

      const label = document.createElement("label");
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.style.cursor = "pointer"; 

      label.style.flex = "1";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = tier;
      checkbox.checked = true;

      const span = document.createElement("span");
      span.style.marginLeft = "8px";
      span.textContent = tier;

      label.appendChild(checkbox);
      label.appendChild(span);

      const weightInput = document.createElement("input");
      weightInput.type = "number";
      weightInput.min = 1;
      weightInput.value = ODDS[tier] || 10;
      weightInput.style.width = "60px";
      weightInput.style.marginLeft = "8px";
      weightInput.style.padding = "4px 6px";
      weightInput.style.borderRadius = "8px";
      weightInput.style.border = "none";
      weightInput.style.background = "rgba(90, 60, 130, 0.8)";
      weightInput.style.color = "#fff";
      weightInput.style.fontWeight = "500";
      weightInput.style.textAlign = "center";

      row.appendChild(label);
      row.appendChild(weightInput);

      wrapper.appendChild(row);
    });
  };

  function getTierWeights() {
    const checkboxes = container.querySelectorAll(
      "#tierCheckboxes input[type='checkbox']",
    );
    const weights = {};

    checkboxes.forEach((cb) => {
      if (cb.checked) {

        const row = cb.closest("div"); 

        const weightInput = row.querySelector("input[type='number']");
        const weight = parseInt(weightInput?.value) || 0; 

        if (weight > 0) weights[cb.value] = weight;
      }
    });

    return weights;
  }

  const getEnabledTiers = () => {
    const checkboxes = container.querySelectorAll(
      "#tierCheckboxes input[type='checkbox']",
    );
    return Array.from(checkboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
  };

  const getRandomPokemon = (data, enabledTiers) => {
    const tier = pickTierByWeight(enabledTiers);
    const allPokemon = data[tier] || [];
    if (!allPokemon.length) return null;
    const poke = allPokemon[Math.floor(Math.random() * allPokemon.length)];
    return { tier, pokemon: poke };
  };

  const bingoCard = container.querySelector("#bingoCard");
  const bingoSettings = container.querySelector("#bingoSettings");
  const bingoSizeSelect = container.querySelector("#bingoSize");
  const bingoOverlay = container.querySelector("#bingoOverlay");
  const bingoMessages = ["", "1st Line!", "2nd Line!", "Bingo!!"];

  function renderBingoCard(card, size, completed) {
    bingoCard.innerHTML = "";
    bingoCard.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    const containerWidth = Math.min(
      bingoCard.clientWidth,
      window.innerWidth - 40,
    );
    const gap = 6;
    const cellSize = (containerWidth - gap * (size - 1)) / size;

    card.forEach((entry, idx) => {
      const div = document.createElement("div");
      div.className = "bingo-cell";
      div.style.width = `${cellSize}px`;
      div.style.height = `${cellSize}px`;
      if (completed.includes(idx)) div.classList.add("completed");

      const isShiny = entry.type === "shiny";
      const img = document.createElement("img");
      img.src = getPokemonImageUrl(entry.name, isShiny);
      img.alt = formatPokemonName(entry.name);
      img.className = "bingo-img";

      const text = document.createElement("div");
      text.className = "bingo-text";

      if (entry.type === "nature") {
        text.textContent = `Nature: ${entry.nature}`;
      } else if (entry.type === "iv") {
        text.textContent = `IV ${entry.iv.target} than ${entry.iv.roll}`;
      } else if (entry.type === "normal") {
        text.textContent = "Non-Shiny";
      }
      const availableHeight = cellSize * 0.3; 

      const fontSize = Math.max(availableHeight * 0.5, 6); 

      text.style.fontSize = `${fontSize}px`;
      text.style.lineHeight = 1.1;
      text.style.textAlign = "center";
      text.style.wordBreak = "break-word";

      div.appendChild(img);
      if (text.textContent) div.appendChild(text);
      bingoCard.appendChild(div);

      div.addEventListener("click", () => {
        const saved = loadBingo() || { card, size, completed: [] };

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

  function checkBingo(completed, size) {
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
  }

  function showBingoOverlay(milestone) {
    const message = bingoOverlay.querySelector(".bingo-message");
    message.textContent = bingoMessages[milestone];
    bingoOverlay.style.display = "flex";

    const canvas = document.getElementById("fireworksCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    launchFireworks(canvas);

    setTimeout(() => {
      bingoOverlay.style.display = "none";
    }, 4000);
  }

  function launchFireworks(canvas) {
    const ctx = canvas.getContext("2d");
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * -2 - 1,
      radius: Math.random() * 3 + 2,
      alpha: 1,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`,
      gravity: 0.03,
    }));

    (function animate() {
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
    })();
  }

  const generateBtn = container.querySelector("#generateBtn");
  const tierSpan = container.querySelector("#randomTier");
  const pokemonSpan = container.querySelector("#randomPokemon");
  const previousList = container.querySelector("#previousPokemonList");
  const tabButtons = container.querySelectorAll(".tab-btn");
  const randomResultDiv = container.querySelector(".random-result");
  const logDiv = container.querySelector(".previous-log");

  const rawData = await getTierData();
  if (!rawData) return;
  const normalizedTiers = normalizeTiers(rawData);
  createTierFilters(normalizedTiers);

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (currentTab === btn.dataset.tab) return;
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.dataset.tab;

      const title = container.querySelector("h1");

      if (currentTab === "single") {
        changeBingoSettings(false); 

        randomResultDiv.style.display = "block";
        logDiv.style.display = "block";
        title.textContent = "Random Pokémon Generator";
      } else {
        changeBingoSettings(true); 

        randomResultDiv.style.display = "none";
        logDiv.style.display = "none";
        title.textContent = "Random Bingo Card Generator";

        const saved = loadBingo();
        if (saved && saved.card && saved.size) {
          renderBingoCard(saved.card, saved.size, saved.completed || []);
        } else {
          generateBtn.click();
        }
      }

      updateSettingsVisibility();
    });
  });

  function changeBingoSettings(show) {
    const display = show ? "block" : "none";

    bingoSettings.style.display = display; 

    bingoCard.style.display = show ? "grid" : "none";
    container.querySelector("#bingoModeSettings").style.display = display;

    const mainCheckboxes = container.querySelectorAll(
      "#bingocheckBoxes > label",
    );
    mainCheckboxes.forEach((cb) => {
      cb.style.display = show ? "block" : "none";
    });

    container.querySelector("#shinyTierFilter").style.display = "block";
    container.querySelector(".tier-filters").style.display = "block";

    if (!show) bingoMilestone = 0;
  }
  generateBtn.addEventListener("click", () => {
    const enabledTiers = getEnabledTiers();
    if (!enabledTiers.length) return;

    const allowShiny = container.querySelector("#enableShiny").checked;
    const allowNormal = container.querySelector("#allowNormal").checked;
    const allowNature = container.querySelector("#allowNature").checked;
    const allowIV = container.querySelector("#allowIV").checked;

    const warningPopup = container.querySelector("#warningPopup");

    function showWarning(message) {
      warningPopup.querySelector(".popup-content").textContent = message;
      warningPopup.style.display = "block";

      setTimeout(() => {
        warningPopup.style.display = "none";
      }, 3000); // hide after 3 seconds
    }

    // In your generateBtn click handler:
    if (!allowShiny && !allowNormal && !allowNature && !allowIV) {
      showWarning("⚠️ Please select at least one mode (Shiny, Non-Shiny, Nature, or IV)!");
      return;
    }


    if (currentTab === "single") {
      const modes = [];
      if (allowShiny) modes.push("shiny");
      if (allowNormal) modes.push("normal");
      if (allowNature) modes.push("nature");
      if (allowIV) modes.push("iv");

      const result = getRandomPokemon(normalizedTiers, enabledTiers);
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

      const mode = modes[Math.floor(Math.random() * modes.length)];
      const img = document.createElement("img");
      img.src = getPokemonImageUrl(result.pokemon, mode === "shiny");
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
      const modes = [];
      if (allowShiny) modes.push("shiny");
      if (allowNormal) modes.push("normal");
      if (allowNature) modes.push("nature");
      if (allowIV) modes.push("iv");

      const size = parseInt(bingoSizeSelect.value);
      const card = [];

      while (card.length < size * size) {
        const mode = modes[Math.floor(Math.random() * modes.length)];
        const tier = pickTierByWeight(enabledTiers);
        const pool = normalizedTiers[tier] || [];
        if (!pool.length) continue;

        const pokeName = pool[Math.floor(Math.random() * pool.length)];
        if (!card.some((e) => e.name === pokeName)) {
          card.push(generateBingoEntry(pokeName, mode));
        }
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
    renderBingoCard(savedBingo.card, savedBingo.size, savedBingo.completed || []);

    tabButtons.forEach((b) => b.classList.remove("active"));
    tabButtons[1].classList.add("active");
    currentTab = "bingo";
    container.querySelector("h1").textContent = "Random Bingo Card Generator";

    // <-- ADD THIS
    updateSettingsVisibility(); // ensures #bingocheckBoxes, filters, etc. are visible
  }


  function generateBingoEntry(pokemonName, mode) {
    const allowNormal = container.querySelector("#allowNormal").checked;
    const allowNature = container.querySelector("#allowNature").checked;
    const allowIV = container.querySelector("#allowIV").checked;

    if (mode === "nature") {
      return {
        name: pokemonName,
        type: "nature",
        nature: NATURES[Math.floor(Math.random() * NATURES.length)],
      };
    }

    if (mode === "iv") {
      const isLower = Math.random() < 0.5;
      let roll;
      if (isLower)
        roll = Math.floor(Math.random() * 21) + 40; 

      else roll = Math.floor(Math.random() * 21) + 130; 

      return {
        name: pokemonName,
        type: "iv",
        iv: { roll, target: isLower ? "LOWER" : "HIGHER" },
      };
    }

    return { name: pokemonName, type: mode };
  }

  function pickTierByWeight(enabledTiers) {
    const weights = getTierWeights();

    const tiersWithWeights = enabledTiers
      .filter((t) => weights[t] > 0)
      .map((t) => ({ tier: t, weight: weights[t] }));

    const totalWeight = tiersWithWeights.reduce((sum, t) => sum + t.weight, 0);
    let rnd = Math.random() * totalWeight;

    for (let t of tiersWithWeights) {
      if (rnd < t.weight) return t.tier;
      rnd -= t.weight;
    }

    return tiersWithWeights[0]?.tier || null;
  }
}

