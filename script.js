const API_URL = "https://your-backend.up.railway.app"; // Replace with your Railway URL

// ---------- GET DATA ----------
async function getData() {
  const res = await fetch(`${API_URL}/players`);
  const data = await res.json();
  const formatted = {};
  data.forEach(p => formatted[p.name] = p.shinies);
  return formatted;
}

// ---------- ADD SHINY ----------
async function addShiny() {
  const player = document.getElementById("playerName").value.trim();
  const shinyName = document.getElementById("shinyName").value.trim();

  if (!player || !shinyName) return alert("Fill in both fields");

  const shiny = { name: shinyName, level: "", ability: "", notes: "" };

  const res = await fetch(`${API_URL}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, shiny })
  });

  const result = await res.json();
  if (!res.ok) return alert(result.error);

  document.getElementById("shinyName").value = "";
  renderManager();
}

// ---------- UPDATE SHINY ----------
async function updateShiny(player, index, field, value) {
  await fetch(`${API_URL}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, index, field, value })
  });
  renderManager();
}

// ---------- REMOVE SHINY ----------
async function removeShiny(player, index) {
  if (!confirm("Remove this shiny?")) return;
  await fetch(`${API_URL}/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, index })
  });
  renderManager();
}

// ---------- RENDER MANAGER ----------
async function renderManager() {
  const data = await getData();
  const container = document.getElementById("managerList");
  if (!container) return;
  container.innerHTML = "";

  for (const player in data) {
    const card = document.createElement("div");
    card.className = "player-card";
    card.innerHTML = `<div class="player-name">${player}</div>`;
    const shinyList = document.createElement("div");
    shinyList.className = "shiny-list";

    data[player].forEach((s, i) => {
      const span = document.createElement("span");
      const urlName = s.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const img = document.createElement("img");
      img.src = `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
      img.alt = s.name;
      img.className = "shiny-gif";

      const info = document.createElement("div");
      info.className = "info-box";
      info.innerHTML = `
        <label>Name</label>
        <input value="${s.name}" onchange="updateShiny('${player}', ${i}, 'name', this.value)">
        <label>Level</label>
        <input type="number" value="${s.level}" onchange="updateShiny('${player}', ${i}, 'level', this.value)">
        <label>Ability</label>
        <input value="${s.ability}" onchange="updateShiny('${player}', ${i}, 'ability', this.value)">
        <label>Notes</label>
        <textarea onchange="updateShiny('${player}', ${i}, 'notes', this.value)">${s.notes}</textarea>
        <button onclick="removeShiny('${player}', ${i})">Remove</button>
      `;
      span.appendChild(img);
      span.appendChild(info);
      shinyList.appendChild(span);
    });

    card.appendChild(shinyList);
    container.appendChild(card);
  }
}

// ---------- RENDER SHOWCASE ----------
async function renderShowcase() {
  const data = await getData();
  const container = document.getElementById("showcase");
  if (!container) return;
  container.innerHTML = "";

  // Sort players by number of shinies descending
  const sortedPlayers = Object.entries(data).sort((a, b) => b[1].length - a[1].length);

  sortedPlayers.forEach(([player, shinies], index) => {
    const card = document.createElement("div");
    card.className = "player-card";
    card.innerHTML = `<div class="player-name">#${index + 1} ${player} (${shinies.length} shinies)</div>`;

    const shinyList = document.createElement("div");
    shinyList.className = "shiny-list";
    shinies.forEach((s) => {
      const span = document.createElement("span");
      const urlName = s.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const img = document.createElement("img");
      img.src = `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
      img.alt = s.name;
      img.className = "shiny-gif";
      span.appendChild(img);
      shinyList.appendChild(span);
    });

    card.appendChild(shinyList);
    container.appendChild(card);
  });
}
