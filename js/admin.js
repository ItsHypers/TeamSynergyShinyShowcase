async function initAdminPanel() {
  const messageEl = document.getElementById('message');
  const previewEl = document.getElementById('preview');

  let SHINY_DB = {};

  // ---- Load DB for preview ----
  async function loadDatabase() {
    try {
      const res = await fetch('https://adminpage.hypersmmo.workers.dev/api/shiny-database');
      if (!res.ok) throw new Error("Failed to fetch database");
      SHINY_DB = await res.json();
      previewEl.textContent = JSON.stringify(SHINY_DB, null, 2);
    } catch (err) {
      messageEl.textContent = "Error loading database: " + err.message;
      messageEl.className = "error";
    }
  }

  await loadDatabase();

  // ---- Add Pokémon ----
  document.getElementById('addBtn').addEventListener('click', async () => {
    const player = document.getElementById('player').value.trim();
    const pokemonName = document.getElementById('pokemon').value.trim();
    if (!player || !pokemonName) {
      messageEl.textContent = "Player and Pokémon are required!";
      messageEl.className = "error";
      return;
    }

    const newShiny = {
      Pokemon: pokemonName,
      Month: document.getElementById('month').value,
      Year: document.getElementById('year').value,
      "Secret Shiny": document.getElementById('secretShiny').value,
      Egg: document.getElementById('egg').value,
      Alpha: document.getElementById('alpha').value,
      Sold: document.getElementById('sold').value,
      Event: document.getElementById('event').value,
      Reaction: document.getElementById('reaction').value,
      MysteriousBall: document.getElementById('mysteriousBall').value,
      Safari: document.getElementById('safari').value,
      Favourite: document.getElementById('favourite').value,
      "Honey Tree": document.getElementById('honeyTree').value,
      Legendary: document.getElementById('legendary').value,
      "Reaction Link": document.getElementById('reactionLink').value
    };

    // Append locally
    if (!SHINY_DB[player]) SHINY_DB[player] = { shiny_count: 0, shinies: {} };
    const nextId = Object.keys(SHINY_DB[player].shinies).length + 1;
    SHINY_DB[player].shinies[nextId] = newShiny;
    SHINY_DB[player].shiny_count += 1;
    previewEl.textContent = JSON.stringify(SHINY_DB, null, 2);

    // ---- Send to Worker KV ----
    try {
      const res = await fetch('https://adminpage.hypersmmo.workers.dev/admin/add-pokemon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: window.ADMIN_PASSWORD_TOKEN,
          player,
          pokemon: newShiny
        })
      });

      const data = await res.json();
      if (data.success) {
        messageEl.textContent = `✅ Shiny added for ${player}! Total shinies: ${data.shiny_count}`;
        messageEl.className = "success";
      } else {
        messageEl.textContent = `❌ Failed: ${data.message || "Unknown error"}`;
        messageEl.className = "error";
      }
    } catch (err) {
      messageEl.textContent = "Error: " + err.message;
      messageEl.className = "error";
    }
  });
}
