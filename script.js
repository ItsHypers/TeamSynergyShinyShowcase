// -------- ENCRYPTION SETUP --------
const SECRET_KEY = "ShinyBoardSecretKey2026";

function encrypt(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
}

function decrypt(ciphertext) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch {
    return {};
  }
}

function getData() {
  const encrypted = localStorage.getItem("shinyData");
  if (!encrypted) return {};
  return decrypt(encrypted);
}

function saveData(data) {
  const encrypted = encrypt(data);
  localStorage.setItem("shinyData", encrypted);
}

// -------- ADD SHINY --------
function addShiny() {
  const player = document.getElementById("playerName").value.trim();
  const shiny = document.getElementById("shinyName").value.trim();

  if (!player || !shiny) {
    alert("Fill in both fields");
    return;
  }

  const data = getData();
  if (!data[player]) data[player] = [];

  // No duplicate
  if (data[player].some(s => s.name === shiny)) {
    alert("This shiny already exists for this player.");
    return;
  }

  data[player].push({
    name: shiny,
    level: "",
    ability: "",
    notes: ""
  });

  saveData(data);
  document.getElementById("shinyName").value = "";
  renderManager();
}

// -------- RENDER MANAGER --------
function renderManager() {
  const data = getData();
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

      // Generate image URL
      const urlName = s.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const img = document.createElement("img");
      img.src = `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
      img.alt = s.name;
      img.className = "shiny-gif";

      // Info box
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

// -------- UPDATE SHINY INFO --------
function updateShiny(player, index, field, value) {
  const data = getData();
  data[player][index][field] = value;
  saveData(data);
  renderManager();
}

// -------- REMOVE SHINY --------
function removeShiny(player, index) {
  if (!confirm("Remove this shiny?")) return;
  const data = getData();
  data[player].splice(index, 1);
  saveData(data);
  renderManager();
}

// -------- SHOWCASE PAGE RENDER --------
function renderShowcase() {
  const data = getData();
  const container = document.getElementById("showcase");
  if (!container) return;

  container.innerHTML = "";

  // Sort players: most shinies → least
  const sortedPlayers = Object.entries(data).sort(
    (a, b) => b[1].length - a[1].length
  );

  sortedPlayers.forEach(([player, shinies], index) => {
    const card = document.createElement("div");
    card.className = "player-card";

    card.innerHTML = `<div class="player-name">#${index + 1} ${player} <span style="color:#aaa;">(${shinies.length} shinies)</span></div>`;

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
