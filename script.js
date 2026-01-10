// ---------- CONFIG ----------
const JSON_VERSION = "v10"; // increment when shiny_database.json updates
const JSON_FILE = "shiny_database.json";

// ---------- GET DATA ----------
async function getData() {
  try {
    const res = await fetch(`${JSON_FILE}?v=${JSON_VERSION}`);
    if (!res.ok) throw new Error("Failed to fetch JSON");
    return await res.json();
  } catch (err) {
    console.error("Error loading shiny_database.json:", err);
    return {};
  }
}

// ---------- RENDER SHOWCASE WITH FILTER ----------
async function renderShowcase(filter = "") {
  const data = await getData();
  const container = document.getElementById("showcase");
  container.innerHTML = "";

  // Sort players by shiny_count descending
  const sortedPlayers = Object.entries(data).sort(
    (a, b) => b[1].shiny_count - a[1].shiny_count
  );

  sortedPlayers.forEach(([player, playerData], index) => {
    // If filter is active and player does not match, skip
    if (filter && !player.toLowerCase().includes(filter.toLowerCase())) return;

    const card = document.createElement("div");
    card.className = "player-card";

    // Top 5 players get "top-player" class
    const playerClass = index < 5 ? "player-name top-player" : "player-name";

    card.innerHTML = `<div class="${playerClass}">#${index + 1} ${player} (${playerData.shiny_count} shinies)</div>`;

    const shinyList = document.createElement("div");
    shinyList.className = "shiny-list";

    Object.values(playerData.shinies).forEach(s => {
      const span = document.createElement("span");
      const urlName = s.Pokemon.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      const imgContainer = document.createElement("div");
      imgContainer.className = "gif-container";

      // Make the whole box clickable if Reaction Link exists
      if (s["Reaction Link"] && s["Reaction Link"].trim() !== "") {
        imgContainer.style.cursor = "pointer";
        imgContainer.addEventListener("click", () => {
          window.open(s["Reaction Link"], "_blank"); // open in new tab
        });
      }

      if (s.Alpha && s.Alpha.toLowerCase() === "yes") imgContainer.classList.add("alpha-pokemon");

      if (s["Secret Shiny"] && s["Secret Shiny"].toLowerCase() === "yes") {
        const secretIcon = document.createElement("img");
        secretIcon.src = "secretshiny.png";
        secretIcon.className = "secret-icon";
        imgContainer.appendChild(secretIcon);
      }

      if (s["Egg"] && s["Egg"].toLowerCase() === "yes") {
        const eggIcon = document.createElement("img");
        eggIcon.src = "egg.png";
        eggIcon.className = "egg-icon";
        imgContainer.appendChild(eggIcon);
      }

      if (s["Safari"] && s["Safari"].toLowerCase() === "yes") {
        const safariIcon = document.createElement("img");
        safariIcon.src = "safari.png";
        safariIcon.className = "safari-icon";
        imgContainer.appendChild(safariIcon);
      }
      if (s["Event"] && s["Event"].toLowerCase() === "yes") {
        const safariIcon = document.createElement("img");
        safariIcon.src = "event.png";
        safariIcon.className = "event-icon";
        imgContainer.appendChild(safariIcon);
      }

      if (s["MysteriousBall"] && s["MysteriousBall"].toLowerCase() === "yes") {
      const mysteriousBall = document.createElement("img");
      mysteriousBall.src = "mysteriousball.gif"; // your GIF file
      mysteriousBall.className = "mysteriousball-gif";
      imgContainer.appendChild(mysteriousBall);
    }

    // Add favourite class if Pokémon is a Favourite
    if (s.Favourite && s.Favourite.toLowerCase() === "yes") {
      imgContainer.classList.add("favourite-pokemon");

      // Add heart icon top-left
      const heartIcon = document.createElement("img");
      heartIcon.src = "heart.png"; // your heart PNG file
      heartIcon.className = "favourite-heart";
      imgContainer.appendChild(heartIcon);
    }


    if (s.Favourite && s.Favourite.toLowerCase() === "yes") {
      imgContainer.classList.add("favourite-pokemon");
    }


      // Reaction PNG
      if (s["Reaction Link"] && s["Reaction Link"].trim() !== "") {
        const reactionIcon = document.createElement("img");
        reactionIcon.src = "reaction.png";
        reactionIcon.className = "reaction-icon";
        reactionIcon.title = "React";
        reactionIcon.addEventListener("click", e => {
          e.stopPropagation();
          window.open(s["Reaction Link"], "_blank");
        });
        imgContainer.appendChild(reactionIcon);
      }

      // Pokémon GIF
      const img = document.createElement("img");
      img.src = `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
      img.alt = s.Pokemon;
      img.className = "shiny-gif";

      if (s.Sold && s.Sold.toLowerCase() === "yes") {
        img.classList.add("sold-pokemon"); // apply grayscale to GIF itself
      }

      // Particle overlay
      const particle = document.createElement("img");
      particle.src = "sparkle.gif";
      particle.className = "particle-gif";

      imgContainer.appendChild(img);
      imgContainer.appendChild(particle);

      // Info box
     const info = document.createElement("div");
      info.className = "info-box";

      // Start with Pokémon name
      let infoContent = `<strong>${s.Pokemon}</strong><br>`;

      // Map trait names to display labels
      const traitLabels = {
      "Secret Shiny": "Secret Shiny",
      "Egg": "Egg",
      "Alpha": "Alpha",
      "Sold": "Sold/Fled",
      "Event": "Event",
      "Reaction": "Reaction",
      "MysteriousBall": "Mysterious Ball",
      "Safari": "Safari",
      "Favourite": "Favourite"
    };

      // List all traits that are true
      const traits = Object.keys(traitLabels);
      const trueTraits = traits.filter(trait => s[trait] && s[trait].toLowerCase() === "yes");

      // Add each true trait to the info box
      infoContent += trueTraits.length > 0 ? trueTraits.map(t => traitLabels[t]).join("<br>") : "None";

      info.innerHTML = infoContent;


      span.appendChild(imgContainer);
      span.appendChild(info);
      shinyList.appendChild(span);
    });

    card.appendChild(shinyList);
    container.appendChild(card);
  });
}

// ---------- SEARCH EVENT ----------
document.getElementById("playerSearch").addEventListener("input", (e) => {
  const filter = e.target.value;
  renderShowcase(filter);
});

// ---------- INITIAL RENDER ----------
renderShowcase();

