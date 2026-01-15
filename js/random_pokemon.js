// random_pokemon.js
// SPA page: { path: "/pages/random-pokemon-generator.html", init: "initRandomPokemon" }

async function initRandomPokemon() {
  const container = document.getElementById("showcase");
  if (!container) return;

  // HTML structure
  container.innerHTML = `
    <div class="random-pokemon-page">
      <h1>Random Pokémon Generator</h1>

      <div class="tier-filters">
        <h3>Tier Filters</h3>
        <div id="tierCheckboxes"></div>
      </div>

      <button id="randomPokemonBtn">Generate Random Pokémon</button>

      <div class="random-result">
        <p>Tier: <span id="randomTier">---</span></p>
        <p>Pokémon: <span id="randomPokemon">---</span></p>
      </div>

      <div class="previous-log">
        <h3>Previously Selected Pokémon:</h3>
        <ul id="previousPokemonList"></ul>
      </div>
    </div>
  `;

  const JSON_FILE = "./json/tier_pokemon.json";
  let tierData = null;

  // Formatter: first letter uppercase
  const formatPokemonName = (name) => {
    if (!name) return name;
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Fetch + cache JSON
  const getTierData = async () => {
    if (tierData) return tierData;
    try {
      const res = await fetch(JSON_FILE, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch tier_pokemon.json");
      tierData = await res.json();
      return tierData;
    } catch (err) {
      console.error("Error fetching tier_pokemon.json:", err);
      return null;
    }
  };

  // Combine tiers and normalize to Tier 0 → Tier 6
  const normalizeTiers = (data) => {
    return {
      "Tier 0": data["Tier 0"] || [],
      "Tier 1": data["Tier 1"] || [],
      "Tier 2": data["Tier 2"] || [],
      "Tier 3": [...(data["Tier 3"] || []), ...(data["Tier 4"] || [])],
      "Tier 4": data["Tier 5"] || [],
      "Tier 5": data["Tier 6"] || [],
      "Tier 6": data["Tier 7"] || []
    };
  };

  // Create checkboxes for each tier
  const createTierFilters = (tiers) => {
    const wrapper = container.querySelector("#tierCheckboxes");
    wrapper.innerHTML = "";
    Object.keys(tiers).forEach(tier => {
      const label = document.createElement("label");
      label.style.display = "block";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = tier;
      checkbox.checked = true; // enabled by default

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${tier}`));

      wrapper.appendChild(label);
    });
  };

  // Get currently enabled tiers
  const getEnabledTiers = () => {
    const checkboxes = container.querySelectorAll("#tierCheckboxes input[type='checkbox']");
    return Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
  };

  // Pick a random Pokémon from enabled tiers
  const getRandomTierPokemon = (data, enabledTiers) => {
    if (!enabledTiers.length) return null;

    const tier = enabledTiers[Math.floor(Math.random() * enabledTiers.length)];
    const pokemonList = data[tier];
    if (!pokemonList || !pokemonList.length) return null;

    const pokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
    return { tier, pokemon };
  };

  // Load JSON and initialize filters
  const rawData = await getTierData();
  if (!rawData) {
    container.querySelector("#randomTier").textContent = "Error";
    container.querySelector("#randomPokemon").textContent = "Could not load Pokémon data";
    return;
  }

  const normalizedTiers = normalizeTiers(rawData);
  createTierFilters(normalizedTiers);

  // Button logic
  const button = container.querySelector("#randomPokemonBtn");
  const tierSpan = container.querySelector("#randomTier");
  const pokemonSpan = container.querySelector("#randomPokemon");
  const previousList = container.querySelector("#previousPokemonList");

  // Keep a history array
  const history = [];

  button.addEventListener("click", () => {
    const enabledTiers = getEnabledTiers();

    if (!enabledTiers.length) {
      tierSpan.textContent = "None";
      pokemonSpan.textContent = "Enable at least one tier";
      return;
    }

    const result = getRandomTierPokemon(normalizedTiers, enabledTiers);
    if (!result) {
      tierSpan.textContent = "Error";
      pokemonSpan.textContent = "No Pokémon found";
      return;
    }

    const formattedName = formatPokemonName(result.pokemon);

    // Display current selection
    tierSpan.textContent = result.tier;
    pokemonSpan.textContent = formattedName;

    // Add to history
    history.unshift(`${formattedName} (${result.tier})`); // newest first

    // Optional: keep only last 10
    if (history.length > 10) history.pop();

    // Render history list
    previousList.innerHTML = "";
    history.forEach(entry => {
      const li = document.createElement("li");
      li.textContent = entry;
      previousList.appendChild(li);
    });
  });
}
