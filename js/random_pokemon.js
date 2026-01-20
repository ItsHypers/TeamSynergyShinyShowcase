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
  const SHINY_DB_FILE = "shiny_database.json";
  const JSON_FILE = "./json/randomizer_tiers.json";

  const container = document.getElementById("showcase");
  if (!container) return;

  // --- Globals ---
  let shinyData = null;

  let userShinies = [];
  let tierData = null;
  let history = [];
  let bingoMilestone = 0;
  let currentTab = "bingo";
  const NATURES = [
    "Lonely","Brave","Adamant","Naughty","Bold","Relaxed","Impish","Lax",
    "Timid","Hasty","Jolly","Naive","Modest","Mild","Quiet","Rash","Calm",
    "Gentle","Sassy","Careful","Hardy","Docile","Serious","Bashful","Quirky"
  ];

  // --- HTML Setup ---
  container.innerHTML = `
  <div class="random-pokemon-page" style="position:relative;">
    <h1>Random Pokémon Generator</h1>

    <div id="usernameContainer" style="margin-bottom:10px;">
      <label>
        Filter your shinies
        <input type="text" id="usernameInput" placeholder="Synergy Members Only">
      </label>
      <button id="loadShiniesBtn">Pre-load Shinies</button>
    </div>
    <div id="loadedShinyMessage" style="color:green; font-weight:600; margin-top:6px;"></div>

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
      <div class="tier-filters" id="shinyTierFilter" style="margin-top:10px;">
        <h3>Shiny Tier Filter</h3>
        <div id="tierCheckboxes"></div>
      </div>

      <div id="bingoModeSettings">
        <h4>Mode Weights</h4>
        <p>Low number = low chance, high number = high chance</p>
        <label id="labelShiny">Shiny: <input type="number" id="pctShiny" min="1" max="100" value="50"></label>
        <label id="labelNormal">Non-Shiny: <input type="number" id="pctNormal" min="1" max="100" value="50"></label>
        <label id="labelNature">Nature: <input type="number" id="pctNature" min="1" max="100" value="50"></label>
        <label id="labelIV">Random IV: <input type="number" id="pctIV" min="1" max="100" value="50"></label>
      </div>
    </div>

    <div id="bingoSettings" style="display:none;">
      <label>Bingo Size:
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

    <div id="warningPopup" class="warning-popup" style="display:none;">
      <div class="popup-content">⚠️ Please select at least one mode (Shiny, Non-Shiny, Nature, or IV)!</div>
    </div>
  </div>
  `;

  // --- Element References ---
  const usernameInput = container.querySelector("#usernameInput");
  const loadShiniesBtn = container.querySelector("#loadShiniesBtn");
  const loadedShinyMessageDiv = container.querySelector("#loadedShinyMessage");
  const enableShinyCheckbox = container.querySelector("#enableShiny");
  const allowNormalCheckbox = container.querySelector("#allowNormal");
  const allowNatureCheckbox = container.querySelector("#allowNature");
  const allowIVCheckbox = container.querySelector("#allowIV");
  const shinyTierFilterDiv = container.querySelector("#shinyTierFilter");
  const bingoModeSettingsDiv = container.querySelector("#bingoModeSettings");
  const bingoCard = container.querySelector("#bingoCard");
  const bingoSizeSelect = container.querySelector("#bingoSize");
  const generateBtn = container.querySelector("#generateBtn");
  const tierSpan = container.querySelector("#randomTier");
  const pokemonSpan = container.querySelector("#randomPokemon");
  const previousList = container.querySelector("#previousPokemonList");
  const tabButtons = container.querySelectorAll(".tab-btn");
  const randomResultDiv = container.querySelector(".random-result");
  const logDiv = container.querySelector(".previous-log");
  const warningPopup = container.querySelector("#warningPopup");
  const bingoOverlay = container.querySelector("#bingoOverlay");

  // --- Utility Functions ---
  const showWarning = (message) => {
    warningPopup.querySelector(".popup-content").textContent = message;
    warningPopup.style.display = "block";
    setTimeout(() => (warningPopup.style.display = "none"), 3000);
  };

  const formatPokemonName = (name) =>
    name ? name.charAt(0).toUpperCase() + name.slice(1) : name;

  const getPokemonImageUrl = (name, isShiny = true) => {
    let urlName = name.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[.']/g, "")
      .replace(/[♀]/g, "f")
      .replace(/[♂]/g, "m")
      .replace(/\[.*\]/, "");
    return `https://img.pokemondb.net/sprites/black-white/anim/${isShiny ? "shiny" : "normal"}/${urlName}.gif`;
  };

  const saveBingo = (data) => localStorage.setItem("bingoCard", JSON.stringify(data));
  const loadBingo = () => {
    const saved = localStorage.getItem("bingoCard");
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  };

  let shinyDataReady = false;

  async function loadShinyDatabase() {
    try {
      const res = await fetch(SHINY_DB_FILE, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load shiny database");
      shinyData = await res.json();
      shinyDataReady = true; // mark as loaded
    } catch (err) {
      console.error(err);
      shinyData = {};
      shinyDataReady = true;
    }
  }

  const GENERATION_FILE = "./json/generation.json";
  let generationData = null;

  async function loadGenerationData() {
    try {
      const res = await fetch(GENERATION_FILE, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load generation data");
      generationData = await res.json();
    } catch (err) {
      console.error(err);
      generationData = {};
    }
  }


  await loadShinyDatabase();
  await loadGenerationData();

  // --- Filter User Shinies ---
  function filterUserShinies(username) {
    userShinies = [];
    if (!shinyData || !username) return;

    const found = Object.entries(shinyData).find(
      ([key]) => key.toLowerCase() === username.toLowerCase()
    );
    if (!found) return;

    const userData = found[1];
    if (!userData || !userData.shinies) return;

    if (Array.isArray(userData.shinies)) {
      userShinies = userData.shinies
        .map((s) => s.Pokemon?.toLowerCase())
        .filter(Boolean);
    } else {
      for (let key in userData.shinies) {
        const p = userData.shinies[key].Pokemon?.toLowerCase();
        if (p) userShinies.push(p);
      }
    }

    console.log("User shinies loaded:", userShinies.length);
  }

  loadShiniesBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    if (!username) return alert("Please enter your name");

    // Wait for shiny database to load if it hasn't yet
    if (!shinyData) await loadShinyDatabase();
    

    filterUserShinies(username);

    loadedShinyMessageDiv.innerHTML = `Loaded <strong>${userShinies.length}</strong> shiny Pokémon for <strong>${username}</strong>`;
  });

function getExcludedPokemonWithSpecies(userShinies) {
  if (!generationData) return [...userShinies];

  // lowercase all user shinies
  const excludeSet = new Set(userShinies.map(p => p.toLowerCase()));

  // Loop through each generation
  Object.values(generationData).forEach(gen => {
    gen.forEach(speciesLine => {
      // lowercase all Pokémon in species line for comparison
      const speciesLower = speciesLine.map(p => p.toLowerCase());

      // If any Pokémon in the line is owned, exclude all of them
      if (speciesLower.some(p => excludeSet.has(p))) {
        speciesLower.forEach(p => excludeSet.add(p));
      }
    });
  });

  const excludedArray = Array.from(excludeSet);

  console.log("Excluded Pokémon (including species lines):", excludedArray);

  return excludedArray;
}




  // --- Load Tier Data ---
  async function getTierData() {
    if (tierData) return tierData;
    try {
      const res = await fetch(JSON_FILE, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch tier data");
      tierData = await res.json();
      return tierData;
    } catch (err) { console.error(err); return null; }
  }

  const rawData = await getTierData();
  if (!rawData) return;

  const normalizedTiers = {
    "Tier 0": rawData["Tier 0"] || [],
    "Tier 1": rawData["Tier 1"] || [],
    "Tier 2": rawData["Tier 2"] || [],
    "Tier 3": [...(rawData["Tier 3"] || []), ...(rawData["Tier 4"] || [])],
    "Tier 4": rawData["Tier 5"] || [],
    "Tier 5": rawData["Tier 6"] || [],
    "Tier 6": rawData["Tier 7"] || [],
  };

  // --- Tier Filters ---
  function createTierFilters(tiers) {
    const wrapper = container.querySelector("#tierCheckboxes");
    wrapper.innerHTML = "";
    Object.keys(tiers).forEach((tier) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.marginBottom = "4px";

      const label = document.createElement("label");
      label.style.flex = "1";
      label.style.cursor = "pointer";

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
      weightInput.style.background = "rgba(90,60,130,0.8)";
      weightInput.style.color = "#fff";
      weightInput.style.fontWeight = "500";
      weightInput.style.textAlign = "center";

      row.appendChild(label);
      row.appendChild(weightInput);
      wrapper.appendChild(row);
    });
  }

  createTierFilters(normalizedTiers);

  function getTierWeights() {
    const checkboxes = container.querySelectorAll("#tierCheckboxes input[type='checkbox']");
    const weights = {};
    checkboxes.forEach((cb) => {
      if (!cb.checked) return;
      const row = cb.closest("div");
      const weightInput = row.querySelector("input[type='number']");
      const weight = parseInt(weightInput?.value) || 0;
      if (weight > 0) weights[cb.value] = weight;
    });
    return weights;
  }

  function getEnabledTiers() {
    const checkboxes = container.querySelectorAll("#tierCheckboxes input[type='checkbox']");
    return Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
  }

  function pickTierByWeight(enabledTiers) {
    const weights = getTierWeights();
    const tiersWithWeights = enabledTiers
      .filter(t => weights[t] > 0)
      .map(t => ({ tier: t, weight: weights[t] }));
    const totalWeight = tiersWithWeights.reduce((sum, t) => sum + t.weight, 0);
    let rnd = Math.random() * totalWeight;
    for (let t of tiersWithWeights) {
      if (rnd < t.weight) return t.tier;
      rnd -= t.weight;
    }
    return tiersWithWeights[0]?.tier || null;
  }

  function generateBingoEntry(pokemonName, mode) {
    if (mode === "nature") {
      return { name: pokemonName, type: "nature", nature: NATURES[Math.floor(Math.random() * NATURES.length)] };
    }
    if (mode === "iv") {
      const isLower = Math.random() < 0.5;
      const roll = isLower ? Math.floor(Math.random() * 21) + 40 : Math.floor(Math.random() * 21) + 130;
      return { name: pokemonName, type: "iv", iv: { roll, target: isLower ? "LOWER" : "HIGHER" } };
    }
    return { name: pokemonName, type: mode };
  }

  function renderBingoCard(card, size, completed) {
    bingoCard.innerHTML = "";
    bingoCard.style.display = "grid";
    bingoCard.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    const containerWidth = Math.min(bingoCard.clientWidth, window.innerWidth - 40);
    const gap = 6;
    const cellSize = (containerWidth - gap * (size - 1)) / size;

    card.forEach((entry, idx) => {
      const div = document.createElement("div");
      div.className = "bingo-cell";
      div.style.width = `${cellSize}px`;
      div.style.height = `${cellSize}px`;
      if (completed.includes(idx)) div.classList.add("completed");

      const img = document.createElement("img");
      img.src = getPokemonImageUrl(entry.name, entry.type === "shiny");
      img.alt = formatPokemonName(entry.name);
      img.className = "bingo-img";

      const text = document.createElement("div");
      text.className = "bingo-text";
      if (entry.type === "nature") text.textContent = `Nature: ${entry.nature}`;
      else if (entry.type === "iv") text.textContent = `IV ${entry.iv.target} than ${entry.iv.roll}`;
      else if (entry.type === "normal") text.textContent = "Non-Shiny";

      const availableHeight = cellSize * 0.3;
      text.style.fontSize = `${Math.max(availableHeight * 0.5, 6)}px`;
      text.style.lineHeight = 1.1;
      text.style.textAlign = "center";
      text.style.wordBreak = "break-word";

      div.appendChild(img);
      if (text.textContent) div.appendChild(text);
      bingoCard.appendChild(div);

      div.addEventListener("click", () => {
        const saved = loadBingo() || { card, size, completed: [] };
        if (div.classList.contains("completed")) saved.completed = saved.completed.filter(i => i !== idx);
        else saved.completed.push(idx);
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
    for (let r = 0; r < size; r++) if ([...Array(size).keys()].every(c => completed.includes(r*size+c))) lines++;
    for (let c = 0; c < size; c++) if ([...Array(size).keys()].every(r => completed.includes(r*size+c))) lines++;
    if ([...Array(size).keys()].every(i => completed.includes(i*size+i))) lines++;
    if ([...Array(size).keys()].every(i => completed.includes(i*size+(size-1-i)))) lines++;
    return lines;
  }

  function showBingoOverlay(milestone) {
    const messages = ["", "1st Line!", "2nd Line!", "Bingo!!"];
    const message = bingoOverlay.querySelector(".bingo-message");
    message.textContent = messages[milestone];
    bingoOverlay.style.display = "flex";

    const canvas = bingoOverlay.querySelector("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height*0.5,
      vx: (Math.random()-0.5)*2,
      vy: Math.random()*-2-1,
      radius: Math.random()*3+2,
      alpha: 1,
      color: `hsl(${Math.random()*360},100%,60%)`,
      gravity: 0.03
    }));

    (function animate() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      let active = false;
      particles.forEach(p=>{
        if(p.alpha<=0)return;
        active=true;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
        ctx.fillStyle=p.color;
        ctx.globalAlpha=p.alpha;
        ctx.fill();
        p.x+=p.vx; p.y+=p.vy; p.vy+=p.gravity; p.alpha-=0.003;
      });
      if(active) requestAnimationFrame(animate);
      else ctx.clearRect(0,0,canvas.width,canvas.height);
    })();

    setTimeout(()=>bingoOverlay.style.display="none",4000);
  }

    function getRandomPokemon(data, enabledTiers) {
      const tier = pickTierByWeight(enabledTiers);
      let allPokemon = data[tier] || [];
      if (!allPokemon.length) return null;

      // Apply species-line filter for shiny mode
      const allowShiny = container.querySelector("#enableShiny")?.checked;
      if (allowShiny && userShinies.length) {
        const excluded = getExcludedPokemonWithSpecies(userShinies);
        allPokemon = allPokemon.filter(p => !excluded.includes(p.toLowerCase()));
      }

      if (!allPokemon.length) return null;
      const poke = allPokemon[Math.floor(Math.random() * allPokemon.length)];
      return { tier, pokemon: poke };
    }


function updateSettingsVisibility() {
  const bingoCheckboxes = document.getElementById("bingocheckBoxes");
  
  // Show/hide main content depending on tab
  if (currentTab === "bingo") {
    if (bingoCheckboxes) bingoCheckboxes.style.display = "block";
    if (bingoCard) bingoCard.style.display = "grid";
    if (bingoModeSettingsDiv) bingoModeSettingsDiv.style.display = "block";
    if (randomResultDiv) randomResultDiv.style.display = "none";
    if (logDiv) logDiv.style.display = "none";
  } else {
    if (bingoCheckboxes) bingoCheckboxes.style.display = "none";
    if (bingoCard) bingoCard.style.display = "none";
    if (bingoModeSettingsDiv) bingoModeSettingsDiv.style.display = "block";
    if (randomResultDiv) randomResultDiv.style.display = "block";
    if (logDiv) logDiv.style.display = "block";
  }

  // Show/hide Shiny Tier Filter only if Shiny is enabled
  if (shinyTierFilterDiv)
    shinyTierFilterDiv.style.display =
      enableShinyCheckbox.checked && currentTab === "bingo" ? "block" : "block";

  // Show/hide the percentage inputs based on their respective checkboxes
  const modes = [
    { cb: enableShinyCheckbox, div: document.querySelector("#pctShiny").parentElement },
    { cb: allowNormalCheckbox, div: document.querySelector("#pctNormal").parentElement },
    { cb: allowNatureCheckbox, div: document.querySelector("#pctNature").parentElement },
    { cb: allowIVCheckbox, div: document.querySelector("#pctIV").parentElement },
  ];

  modes.forEach((m) => {
    if (m.div) m.div.style.display = m.cb.checked && currentTab === "bingo" ? "block" : "none";
  });

  // Show Bingo Mode Settings only if 2 or more modes are enabled
  const countChecked = modes.filter((m) => m.cb.checked).length;
  if (bingoModeSettingsDiv)
    bingoModeSettingsDiv.style.display =
      currentTab === "bingo" && countChecked >= 2 ? "block" : "none";
}


  [enableShinyCheckbox,allowNormalCheckbox,allowNatureCheckbox,allowIVCheckbox].forEach(cb=>cb.addEventListener("change",updateSettingsVisibility));
  updateSettingsVisibility();

  // --- Tab Switching ---
  tabButtons.forEach(btn=>{
    btn.addEventListener("click",()=>{
      if(currentTab===btn.dataset.tab) return;
      tabButtons.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.dataset.tab;

      const title = container.querySelector("h1");
      if(currentTab==="single") {
        randomResultDiv.style.display="block";
        logDiv.style.display="block";
        bingoCard.style.display="none";
        title.textContent="Random Pokémon Generator";
      } else {
        randomResultDiv.style.display="none";
        logDiv.style.display="none";
        bingoCard.style.display="grid";
        title.textContent="Random Bingo Card Generator";
        const saved = loadBingo();
        if(saved) renderBingoCard(saved.card, saved.size, saved.completed||[]);
      }
      updateSettingsVisibility();
    });
  });

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
    }, 3000);
  }

  // Require at least one mode
  if (!allowShiny && !allowNormal && !allowNature && !allowIV) {
    showWarning("⚠️ Please select at least one mode (Shiny, Non-Shiny, Nature, or IV)!");
    return;
  }

  const modes = [];
  if (allowShiny) modes.push("shiny");
  if (allowNormal) modes.push("normal");
  if (allowNature) modes.push("nature");
  if (allowIV) modes.push("iv");

  // ----- Single Pokémon Mode -----
  if (currentTab === "single") {
    // Pick a tier
    const tier = pickTierByWeight(enabledTiers);
    let allPokemon = normalizedTiers[tier] || [];
    if (!allPokemon.length) return;

    // Apply species-line filtering for shiny mode
    if (allowShiny && userShinies.length) {
      const excluded = getExcludedPokemonWithSpecies(userShinies);
      allPokemon = allPokemon.filter(p => !excluded.includes(p.toLowerCase()));
      console.log("Single Pokémon pool after filtering:", allPokemon);
    }

    if (!allPokemon.length) {
      showWarning("No eligible Pokémon left for shiny mode in this tier!");
      return;
    }

    const pokeName = allPokemon[Math.floor(Math.random() * allPokemon.length)];

    const tierNumber = tier.replace("Tier ", "");
    tierSpan.textContent = tierNumber;
    pokemonSpan.innerHTML = "";

    const nameEl = document.createElement("p");
    nameEl.textContent = formatPokemonName(pokeName);
    nameEl.style.fontWeight = "600";
    nameEl.style.fontSize = "1.3rem";
    nameEl.style.marginBottom = "6px";
    nameEl.style.textAlign = "center";
    pokemonSpan.appendChild(nameEl);

    // Pick mode randomly from enabled modes
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const img = document.createElement("img");
    img.src = getPokemonImageUrl(pokeName, mode === "shiny");
    img.alt = formatPokemonName(pokeName);
    img.className = "pokemon-img";
    pokemonSpan.appendChild(img);

    // Add to history
    history.unshift(`${formatPokemonName(pokeName)} (Tier ${tierNumber})`);
    if (history.length > 10) history.pop();
    previousList.innerHTML = "";
    history.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;
      previousList.appendChild(li);
    });
  }

  // ----- Bingo Card Mode -----
  if (currentTab === "bingo") {
    const size = parseInt(bingoSizeSelect.value);
    const card = [];

    while (card.length < size * size) {
      const mode = modes[Math.floor(Math.random() * modes.length)];
      const tier = pickTierByWeight(enabledTiers);
      let pool = normalizedTiers[tier] || [];

      // Apply species-line filtering if shiny mode
      if (mode === "shiny" && userShinies.length) {
        const excluded = getExcludedPokemonWithSpecies(userShinies);
        pool = pool.filter(p => !excluded.includes(p.toLowerCase()));
      }

      if (!pool.length) {
        showWarning("No eligible Pokémon left for shiny mode in this tier!");
        continue;
      }

      const pokeName = pool[Math.floor(Math.random() * pool.length)];
      if (!card.some((e) => e.name === pokeName)) {
        card.push(generateBingoEntry(pokeName, mode));
      }
    }

    saveBingo({ card, size, completed: [] });
    renderBingoCard(card, size, []);
    bingoMilestone = 0;
  }

  // Keep bingoExtraSettings always visible
  const bingoExtraSettings = container.querySelector("#bingoExtraSettings");
  if (bingoExtraSettings) bingoExtraSettings.style.display = "block";
});


  // --- Load saved bingo if exists ---
  const savedBingo = loadBingo();
  if(savedBingo) renderBingoCard(savedBingo.card,savedBingo.size,savedBingo.completed||[]);
}

initRandomPokemon();
