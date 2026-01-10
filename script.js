// ---------- CONFIG ----------
const JSON_VERSION = "v1"; // increment this manually whenever shiny_database.json updates
const JSON_FILE = "shiny_database.json";

// ---------- GET DATA ----------
async function getData() {
  try {
    // Append version query to force reload when JSON updates
    const res = await fetch(`${JSON_FILE}?v=${JSON_VERSION}`);
    if (!res.ok) throw new Error("Failed to fetch JSON");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error loading shiny_database.json:", err);
    return {};
  }
}

// ---------- RENDER SHOWCASE ----------
async function renderShowcase() {
  const data = await getData();
  const container = document.getElementById("showcase");
  container.innerHTML = "";

  // Sort players by shiny_count descending
  const sortedPlayers = Object.entries(data).sort(
    (a, b) => b[1].shiny_count - a[1].shiny_count
  );

  sortedPlayers.forEach(([player, playerData], index) => {
    const card = document.createElement("div");
    card.className = "player-card";
    card.innerHTML = `<div class="player-name">#${index + 1} ${player} (${playerData.shiny_count} shinies)</div>`;

    const shinyList = document.createElement("div");
    shinyList.className = "shiny-list";

    Object.values(playerData.shinies).forEach(s => {
      const span = document.createElement("span");
      const urlName = s.Pokemon.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const img = document.createElement("img");
      img.src = `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
      img.alt = s.Pokemon;
      img.className = "shiny-gif";

      const info = document.createElement("div");
      info.className = "info-box";
      info.innerHTML = `
        <strong>${s.Pokemon}</strong><br>
        Secret Shiny: ${s["Secret Shiny"]}<br>
        Egg: ${s.Egg}<br>
        Alpha: ${s.Alpha}<br>
        Sold: ${s.Sold}<br>
        Event: ${s.Event}<br>
        Reaction: ${s.Reaction}<br>
        Mysterious Ball: ${s.MysteriousBall}<br>
        Fossil: ${s.Fossil}
      `;

      span.appendChild(img);
      span.appendChild(info);
      shinyList.appendChild(span);
    });

    card.appendChild(shinyList);
    container.appendChild(card);
  });
}
