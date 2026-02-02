function normalizePokemonName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[.’']/g, "")  
    .replace(/\s+/g, "-"); 
}


async function loadData() {
  const shinyData = await (await fetch("https://adminpage.hypersmmo.workers.dev/admin/database")).json();
  const generationData = await (await fetch("./json/generation.json")).json();
  return { shinyData, generationData };
}

function getGlobalShinies(shinyData) {
  const globalShinies = new Set();

  Object.values(shinyData).forEach(player => {
    Object.values(player.shinies).forEach(entry => {
      if (!entry.Sold || entry.Sold.toLowerCase() !== "no") return;
      globalShinies.add(entry.Pokemon.toLowerCase());
    });
  });

  return globalShinies;
}

function buildPokemonOwnerMap(shinyData) {
  const map = new Map();

  for (const [player, data] of Object.entries(shinyData)) {
    for (const shinyEntry of Object.values(data.shinies)) {
      const name = shinyEntry.Pokemon.toLowerCase();
      if (!map.has(name)) map.set(name, []);
      if (!shinyEntry.Sold || shinyEntry.Sold.toLowerCase() !== "yes") {
        map.get(name).push(player);
      }
    }
  }

  return map;
}

async function renderPokeDex(generationData, globalShinies, ownerMap, mode = "shiny", hideComplete = false) {
  const container = document.getElementById("showcase");
  if (!container) return;
  container.innerHTML = "";

  const fragment = document.createDocumentFragment();

  for (const [gen, speciesGroups] of Object.entries(generationData)) {
    const genHeader = document.createElement("h2");
    genHeader.textContent = gen;
    genHeader.style.textAlign = "center";
    fragment.appendChild(genHeader);

    const genGrid = document.createElement("div");
    genGrid.classList.add("pokedex-grid");

    const speciesCompleteSet = new Set();
    if (mode === "shiny") {
      speciesGroups.forEach(group => {
        if (group.some(p => globalShinies.has(p.toLowerCase()))) {
          group.forEach(p => speciesCompleteSet.add(p.toLowerCase()));
        }
      });
    }

    const allSpecies = speciesGroups.flat();

    allSpecies.forEach((pokemon) => {
      const lowerName = pokemon.toLowerCase();
      const isComplete = mode === "shiny" ? speciesCompleteSet.has(lowerName) : globalShinies.has(lowerName);

      const img = document.createElement("img");
      img.alt = pokemon;
      img.className = `pokedex-pokemon ${isComplete ? "complete" : "incomplete"}`;
      window.lazyLoadGif(img, pokemon);

      genGrid.appendChild(img);
    });

    fragment.appendChild(genGrid);
  }

  container.appendChild(fragment);
  attachHoverInfo(ownerMap);

  // Animate completed / incomplete Pokémon if hideComplete
  if (hideComplete) {
    animateHideComplete(container);
  } else {
    // reset
    container.querySelectorAll(".pokedex-pokemon").forEach(p => {
      p.classList.remove("hide");
      p.style.transform = "";
      p.style.transition = "";
    });
  }
}


function animateHideComplete(container) {
  const pokes = Array.from(container.querySelectorAll(".pokedex-pokemon"));

  // 1️⃣ Separate completed and remaining Pokémon
  const completed = pokes.filter(p => p.classList.contains("complete"));
  const remaining = pokes.filter(p => !p.classList.contains("complete"));

  // 2️⃣ Record initial positions of remaining Pokémon
  const firstRects = remaining.map(p => p.getBoundingClientRect());

  // 3️⃣ Fade out completed Pokémon
  completed.forEach(p => p.classList.add("hide"));

  // 4️⃣ After fade, remove completed Pokémon and animate remaining
  setTimeout(() => {
    completed.forEach(p => p.remove());

    // 5️⃣ Record new positions
    const lastRects = remaining.map(p => p.getBoundingClientRect());

    // 6️⃣ Apply FLIP transform for smooth transition
    remaining.forEach((p, i) => {
      const dx = firstRects[i].left - lastRects[i].left;
      const dy = firstRects[i].top - lastRects[i].top;

      p.style.transform = `translate(${dx}px, ${dy}px)`;
      p.style.transition = "transform 0s"; // set instantly

      requestAnimationFrame(() => {
        p.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
        p.style.transform = "translate(0,0)";
        p.style.opacity = "1";
      });
    });
  }, 500); // match fade duration
}



function attachHoverInfo(ownerMap) {
  const container = document.getElementById("showcase");
  if (!container) return;

  let infoBox = document.querySelector(".poke-info-box");
  if (!infoBox) {
    infoBox = document.createElement("div");
    infoBox.className = "poke-info-box";
    Object.assign(infoBox.style, {
      position: "absolute",
      maxWidth: "250px",
      padding: "8px 12px",
      backgroundColor: "rgba(40,40,60,0.95)",
      color: "#fff",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
      fontSize: "0.85rem",
      lineHeight: "1.3",
      pointerEvents: "none",
      zIndex: 1000,
      whiteSpace: "normal",
      wordBreak: "break-word",
      opacity: 0,
      transition: "opacity 0.2s ease",
    });
    document.body.appendChild(infoBox);
  }

  container.onmouseover = e => {
    const target = e.target;
    if (target.tagName !== "IMG" || !target.classList.contains("complete")) return;

    const pokemonName = target.alt.toLowerCase();
const owners = ownerMap.get(pokemonName) || [];

  if (!owners.length) {
    infoBox.style.opacity = 0;
    return;
  }

  infoBox.textContent = `Owned by: ${owners.join(", ")}`;


    const rect = target.getBoundingClientRect();
    const padding = 8;
    let left = rect.right + padding + window.scrollX;
    let top = rect.top + window.scrollY;

    if (left + infoBox.offsetWidth > window.scrollX + window.innerWidth)
      left = rect.left - infoBox.offsetWidth - padding + window.scrollX;

    if (top + infoBox.offsetHeight > window.scrollY + window.innerHeight)
      top = window.scrollY + window.innerHeight - infoBox.offsetHeight - padding;

    infoBox.style.left = `${left}px`;
    infoBox.style.top = `${top}px`;
    infoBox.style.opacity = 1;
  };

  container.onmouseout = e => {
    if (e.target.tagName === "IMG") infoBox.style.opacity = 0;
  };
}

async function initPokeDex() {
  try {
    const { shinyData, generationData } = await loadData();

    const globalShinies = getGlobalShinies(shinyData);
    const ownerMap = buildPokemonOwnerMap(shinyData);

    let currentMode = "shiny";
    let hideComplete = false;

    renderPokeDex(generationData, globalShinies, ownerMap, currentMode, hideComplete);

    const toggleBtn = document.getElementById("toggle-complete-btn");
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        hideComplete = !hideComplete;
        toggleBtn.textContent = hideComplete ? "Show Complete" : "Hide Complete";
        renderPokeDex(generationData, globalShinies, ownerMap, currentMode, hideComplete);
      };
    }

    document.querySelectorAll(".dex-option").forEach((opt, index) => {
      opt.onclick = () => {
        document.querySelectorAll(".dex-option").forEach(o => o.classList.remove("active"));
        opt.classList.add("active");

        const slider = document.getElementById("dex-slider");
        if (slider) slider.style.transform = `translateX(${index * 100}%)`;

        currentMode = opt.dataset.mode;
        renderPokeDex(generationData, globalShinies, ownerMap, currentMode, hideComplete);
      };
    });
  } catch (err) {
    console.error("Failed to initialize Pokedex:", err);
  }
}

window.initPokeDex = initPokeDex;
