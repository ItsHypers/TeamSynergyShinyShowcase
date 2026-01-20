function normalizePokemonName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/\s+/g, '-');
}

async function loadData() {
  const shinyData = await fetch('/shiny_database.json').then(res => res.json());
  const generationData = await fetch('./json/generation.json').then(res => res.json());
  return { shinyData, generationData };
}

function getGlobalShinies(shinyData) {
  const globalShinies = new Set();

  for (const player in shinyData) {
    const shinies = shinyData[player].shinies;
    for (const key in shinies) {
      const pokemonEntry = shinies[key];
      const pokemon = pokemonEntry.Pokemon.toLowerCase();

      if (pokemonEntry.Sold === "No") {
        globalShinies.add(pokemon);
      }
    }
  }

  return globalShinies;
}

function renderPokeDex(generationData, shinyData, mode = 'shiny', hideComplete = false) {
  const container = document.getElementById('showcase');
  if (!container) return;

  container.innerHTML = ''; 

  const globalShinies = getGlobalShinies(shinyData);

  for (const gen in generationData) {

    const genHeader = document.createElement('h2');
    genHeader.textContent = gen;
    genHeader.style.textAlign = 'center';
    container.appendChild(genHeader);

    const genGrid = document.createElement('div');
    genGrid.classList.add('pokedex-grid');

    const allPokemon = generationData[gen].flat();

    const speciesCompleteSet = new Set();
    if (mode === 'shiny') {
      generationData[gen].forEach(speciesArray => {
        const isAnyComplete = speciesArray.some(p => globalShinies.has(p.toLowerCase()));
        if (isAnyComplete) speciesArray.forEach(p => speciesCompleteSet.add(p.toLowerCase()));
      });
    }

    allPokemon.forEach(pokemon => {
      const normalizedName = normalizePokemonName(pokemon);
      const lowerName = pokemon.toLowerCase();

      let isComplete = false;
      if (mode === 'shiny') {
        isComplete = speciesCompleteSet.has(lowerName);
      } else {

        isComplete = globalShinies.has(lowerName);
      }

      if (hideComplete && isComplete) return;

      const img = document.createElement('img');
      img.src = `https://img.pokemondb.net/sprites/black-white/anim/shiny/${normalizedName}.gif`;
      img.alt = pokemon;
      img.className = `pokedex-pokemon ${isComplete ? 'complete' : 'incomplete'}`;
      img.loading = 'lazy';

      genGrid.appendChild(img);
    });

    container.appendChild(genGrid);
  }

  attachHoverInfo(shinyData);
}

function attachHoverInfo(shinyData) {
  const container = document.getElementById('showcase');
  if (!container) return;

  let infoBox = document.querySelector('.poke-info-box');
  if (!infoBox) {
    infoBox = document.createElement('div');
    infoBox.className = 'poke-info-box';
    document.body.appendChild(infoBox);

    Object.assign(infoBox.style, {
      position: 'absolute',
      maxWidth: '250px',
      padding: '8px 12px',
      backgroundColor: 'rgba(40, 40, 60, 0.95)',
      color: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      fontSize: '0.85rem',
      lineHeight: '1.3',
      pointerEvents: 'none',
      zIndex: 1000,
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      opacity: 0,
      transition: 'opacity 0.2s ease',
    });
  }

  container.addEventListener('mouseover', e => {
    const target = e.target;
    if (target.tagName !== 'IMG') return;
    if (!target.classList.contains('complete')) return;

    const pokemonName = target.alt.toLowerCase();
    const players = [];

    for (const player in shinyData) {
      for (const key in shinyData[player].shinies) {
        const shinyPokemon = shinyData[player].shinies[key].Pokemon.toLowerCase();
        if (shinyPokemon === pokemonName) players.push(player);
      }
    }

    if (players.length === 0) return;

    infoBox.textContent = `Owned by: ${players.join(', ')}`;

    const rect = target.getBoundingClientRect();
    const padding = 8;
    let left = rect.right + padding + window.scrollX;
    let top = rect.top + window.scrollY;

    if (left + infoBox.offsetWidth > window.scrollX + window.innerWidth) {
      left = rect.left - infoBox.offsetWidth - padding + window.scrollX;
    }

    if (top + infoBox.offsetHeight > window.scrollY + window.innerHeight) {
      top = window.scrollY + window.innerHeight - infoBox.offsetHeight - padding;
    }

    infoBox.style.left = `${left}px`;
    infoBox.style.top = `${top}px`;
    infoBox.style.opacity = 1;
  });

  container.addEventListener('mouseout', e => {
    if (e.target.tagName === 'IMG') infoBox.style.opacity = 0;
  });
}

async function initPokeDex() {
  try {
    const { shinyData, generationData } = await loadData();

    let currentMode = 'shiny';
    let hideComplete = false;

    renderPokeDex(generationData, shinyData, currentMode, hideComplete);

    const toggleBtn = document.getElementById('toggle-complete-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        hideComplete = !hideComplete;
        toggleBtn.textContent = hideComplete ? 'Show Complete' : 'Hide Complete';
        renderPokeDex(generationData, shinyData, currentMode, hideComplete);
      });
    }

    const dexOptions = document.querySelectorAll('.dex-option');
    dexOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        dexOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        currentMode = opt.dataset.mode;
        renderPokeDex(generationData, shinyData, currentMode, hideComplete);
      });
    });
  } catch (err) {
    console.error('Failed to initialize Pokedex:', err);
  }
}

window.initPokeDex = initPokeDex;

