async function initAdminPanel() {
  const modeSelect = document.getElementById("mode");
  const pokemonForm = document.getElementById("pokemon-form");
  const streamerForm = document.getElementById("streamer-form");
  const addBtn = document.getElementById("addBtn");
  const updateBtn = document.getElementById("updateBtn");
  const messageEl = document.getElementById("message");
  const updateMessageEl = document.getElementById("update-message");
  const previewEl = document.getElementById("preview");

  let database = {};
  let streamersDB = {};

  // Toggle forms
  modeSelect.addEventListener("change", () => {
    if (modeSelect.value === "pokemon") {
      pokemonForm.style.display = "block";
      streamerForm.style.display = "none";
      renderPreview(database);
    } else {
      pokemonForm.style.display = "none";
      streamerForm.style.display = "block";
      renderPreview(streamersDB);
    }
    messageEl.textContent = "";
    updateMessageEl.textContent = "";
  });

  // Load databases
  async function loadDatabase() {
    try {
      const res = await fetch("https://adminpage.hypersmmo.workers.dev/admin/database");
      database = await res.json();
      const res2 = await fetch("https://adminpage.hypersmmo.workers.dev/admin/streamers");
      streamersDB = await res2.json();
      renderPreview(database);
    } catch (err) {
      messageEl.textContent = "Error loading database: " + err.message;
      messageEl.className = "error";
    }
  }

  function renderPreview(db) {
    previewEl.textContent = JSON.stringify(db, null, 2);
  }

  // ---- Add button ----
  addBtn.addEventListener("click", async () => {
    if (!window.ADMIN_PASSWORD_TOKEN) {
      messageEl.textContent = "Unauthorized: Please enter admin password first.";
      messageEl.className = "error";
      return;
    }

    if (modeSelect.value === "pokemon") {
      const player = document.getElementById("player").value.trim();
      const pokemonName = document.getElementById("pokemon").value.trim();
      const month = document.getElementById("month").value.trim();
      const year = document.getElementById("year").value.trim();
      const egg = document.getElementById("egg").value;
      const favourite = document.getElementById("favourite").value;

      if (!player || !pokemonName) {
        messageEl.textContent = "Player and Pokémon are required.";
        messageEl.className = "error";
        return;
      }

      if (!database[player]) database[player] = { shiny_count: 0, shinies: {} };
      const nextId = Object.keys(database[player].shinies).length + 1;

      database[player].shinies[nextId] = {
        Pokemon: pokemonName,
        Month: month,
        Year: year,
        "Secret Shiny": "No",
        Egg: egg,
        Alpha: "No",
        Sold: "No",
        Event: "No",
        Reaction: "No",
        MysteriousBall: "No",
        Safari: "No",
        Favourite: favourite,
        "Honey Tree": "No",
        Legendary: "No",
        "Reaction Link": "",
      };
      database[player].shiny_count += 1;

      renderPreview(database);

      try {
        const res = await fetch(
          "https://adminpage.hypersmmo.workers.dev/admin/update-database",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: window.ADMIN_PASSWORD_TOKEN, data: database }),
          }
        );
        const result = await res.json();
        if (result.success) {
          messageEl.textContent = "Pokémon added successfully!";
          messageEl.className = "success";
        }
      } catch (err) {
        messageEl.textContent = "Error updating database: " + err.message;
        messageEl.className = "error";
      }

    } else if (modeSelect.value === "streamer") {
      const pokeName = document.getElementById("pokeName").value.trim();
      const twitchName = document.getElementById("twitchName").value.trim();

      if (!pokeName || !twitchName) {
        messageEl.textContent = "Both PokeMMO Name and Twitch Name are required.";
        messageEl.className = "error";
        return;
      }

      streamersDB[pokeName] = { twitch_username: twitchName };
      renderPreview(streamersDB);

      try {
        const res = await fetch(
          "https://adminpage.hypersmmo.workers.dev/admin/update-streamers",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: window.ADMIN_PASSWORD_TOKEN, data: streamersDB }),
          }
        );
        const result = await res.json();
        if (result.success) {
          messageEl.textContent = "Streamer added successfully!";
          messageEl.className = "success";
        }
      } catch (err) {
        messageEl.textContent = "Error updating streamers: " + err.message;
        messageEl.className = "error";
      }
    }
  });

  // ---- Update JSON button ----
  updateBtn.addEventListener("click", async () => {
    if (!window.ADMIN_PASSWORD_TOKEN) {
      updateMessageEl.textContent = "Unauthorized: Enter password first.";
      updateMessageEl.className = "error";
      return;
    }

    let updatedData;
    try {
      updatedData = JSON.parse(previewEl.textContent);
    } catch (err) {
      updateMessageEl.textContent = "Invalid JSON: " + err.message;
      updateMessageEl.className = "error";
      return;
    }

    try {
      const endpoint =
        modeSelect.value === "pokemon"
          ? "https://adminpage.hypersmmo.workers.dev/admin/update-database"
          : "https://adminpage.hypersmmo.workers.dev/admin/update-streamers";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: window.ADMIN_PASSWORD_TOKEN, data: updatedData }),
      });

      const result = await res.json();
      if (result.success) {
        if (modeSelect.value === "pokemon") database = updatedData;
        else streamersDB = updatedData;
        updateMessageEl.textContent = "Database successfully updated!";
        updateMessageEl.className = "success";
      } else {
        updateMessageEl.textContent = "Failed to update: " + (result.error || "");
        updateMessageEl.className = "error";
      }
    } catch (err) {
      updateMessageEl.textContent = "Error updating database: " + err.message;
      updateMessageEl.className = "error";
    }
  });

  await loadDatabase();
}

window.initAdminPanel = initAdminPanel;
