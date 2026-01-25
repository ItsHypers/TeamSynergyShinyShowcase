async function initAdminPanel() {
  const modeSelect = document.getElementById("mode");
  const pokemonForm = document.getElementById("pokemon-form");
  const streamerForm = document.getElementById("streamer-form");
  const addBtn = document.getElementById("addBtn");
  const updateBtn = document.getElementById("updateBtn");
  const messageEl = document.getElementById("message");
  const updateMessageEl = document.getElementById("update-message");
  const previewEl = document.getElementById("preview");
  const logPreviewEl = document.getElementById("logPreview");

  let database = {};
  let streamersDB = {};

  const WORKER_BASE = "https://adminpage.hypersmmo.workers.dev/admin";

  function isAuthorized() {
    return window.ADMIN_AUTH && window.ADMIN_AUTH.name && window.ADMIN_AUTH.password;
  }

  function renderPreview(db) {
    previewEl.textContent = JSON.stringify(db, null, 2);
  }
  function renderLog(logData) {
    if (!logPreviewEl) return;

    // Ensure most recent first
    const sortedLog = [...(logData.log || [])].sort((a, b) => new Date(b.time) - new Date(a.time));

    // Build formatted string
    const logStrings = sortedLog.map(entry => {
      const date = new Date(entry.time);
      const formattedTime = date.toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      return `Admin: ${entry.admin}
  Action:
  ${entry.action}
  Time: ${formattedTime}
  -------------------------`;
    });

    logPreviewEl.textContent = logStrings.join("\n");
  }


  // Mode switching
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

  // --------------------- Load Database ---------------------
  async function loadDatabase() {
    try {
      const res = await fetch(`${WORKER_BASE}/database`);
      database = await res.json();

      const res2 = await fetch(`${WORKER_BASE}/streamers`);
      streamersDB = await res2.json();

      const res3 = await fetch(`${WORKER_BASE}/log`);
      const logData = await res3.json();

       for (const player in database) {
      updateShinyCount(player);
    }

      if (modeSelect.value === "pokemon") renderPreview(database);
      else renderPreview(streamersDB);

      renderLog(logData);

      // After DB is loaded, initialize autocomplete
      initAutocomplete();

    } catch (err) {
      messageEl.textContent = "Error loading database: " + err.message;
      messageEl.className = "error";
    }
  }

function setupAutocomplete(inputEl, suggestionsEl, getOptions) {
  let currentFocus = -1;

  function closeAllSuggestions(exceptEl = null) {
    document.querySelectorAll(".autocomplete-suggestions").forEach(box => {
      if (box !== exceptEl) box.classList.remove("show");
    });
  }

  inputEl.addEventListener("input", () => {
    const val = inputEl.value.toLowerCase();
    closeAllSuggestions(suggestionsEl);
    suggestionsEl.innerHTML = "";
    if (!val) return;

    const options = getOptions().filter(opt => opt.toLowerCase().includes(val));
    if (!options.length) return;

    options.forEach(option => {
      const div = document.createElement("div");
      div.textContent = option;
      div.className = "autocomplete-suggestion";
      div.addEventListener("click", () => {
        inputEl.value = option;
        suggestionsEl.classList.remove("show");
      });
      suggestionsEl.appendChild(div);
    });

    suggestionsEl.classList.add("show"); // show suggestions
  });

  inputEl.addEventListener("keydown", (e) => {
    const items = suggestionsEl.querySelectorAll(".autocomplete-suggestion");
    if (!items) return;

    if (e.key === "ArrowDown") {
      currentFocus++;
      addActive(items);
    } else if (e.key === "ArrowUp") {
      currentFocus--;
      addActive(items);
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (currentFocus > -1) {
        inputEl.value = items[currentFocus].textContent;
        suggestionsEl.classList.remove("show");
        currentFocus = -1;
      }
    }
  });

  function addActive(items) {
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add("active");
  }

  function removeActive(items) {
    items.forEach(item => item.classList.remove("active"));
  }

  inputEl.addEventListener("focus", () => closeAllSuggestions(suggestionsEl));
  inputEl.addEventListener("blur", () => {
    setTimeout(() => suggestionsEl.classList.remove("show"), 100);
  });

  document.addEventListener("click", (e) => {
    if (e.target !== inputEl) suggestionsEl.classList.remove("show");
  });
}



  function initAutocomplete() {
    // Player autocomplete
    setupAutocomplete(
      document.getElementById("player"),
      document.getElementById("player-suggestions"),
      () => Object.keys(database)
    );

    setupAutocomplete(
      document.getElementById("deletePlayer"),
      document.getElementById("deletePlayer-suggestions"),
      () => Object.keys(database)
    );


    // Pokémon autocomplete
    setupAutocomplete(
      document.getElementById("pokemon"),
      document.getElementById("pokemon-suggestions"),
      () => {
        const allPokemon = [];
        for (const player in database) {
          const shinies = database[player].shinies || {};
          for (const id in shinies) allPokemon.push(shinies[id].Pokemon);
        }
        // Make unique, ignoring case
        const uniquePokemon = [...new Map(
          allPokemon.map(p => [p.toLowerCase(), p])
        ).values()];

        // Capitalize first letter of each Pokemon
        return uniquePokemon.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
      }
    );

  }

  function updateShinyCount(player) {
  if (!database[player] || !database[player].shinies) return;

  const shinies = database[player].shinies;
  let count = 0;
  for (const id in shinies) {
    if (shinies[id].Sold !== "Yes") {
      count++;
    }
  }
  database[player].shiny_count = count;
}

// --------------------- Add Button ---------------------
addBtn.addEventListener("click", async () => {
  if (!isAuthorized()) {
    messageEl.textContent = "Unauthorized: Please log in first.";
    messageEl.className = "error";
    return;
  }

  const admin = window.ADMIN_AUTH.name;
  const password = window.ADMIN_AUTH.password;

  if (modeSelect.value === "pokemon") {
    // ---- Get form values ----
    const player = document.getElementById("player").value.trim();
    const pokemonName = document.getElementById("pokemon").value.trim();
    const month = document.getElementById("month").value.trim();
    const year = document.getElementById("year").value.trim();
    const egg = document.getElementById("egg").value;
    const favourite = document.getElementById("favourite").value;

    // Additional fields
    const secretShiny = document.getElementById("secretShiny").value;
    const alpha = document.getElementById("alpha").value;
    const sold = document.getElementById("sold").value;
    const eventVal = document.getElementById("event").value;
    const reaction = document.getElementById("reaction").value;
    const mysteriousBall = document.getElementById("mysteriousBall").value;
    const safari = document.getElementById("safari").value;
    const honeyTree = document.getElementById("honeyTree").value;
    const legendary = document.getElementById("legendary").value;
    const reactionLink = document.getElementById("reactionLink").value.trim();
    const overrideDuplicate = document.getElementById("overrideDuplicate")?.checked || false;

    if (!player || !pokemonName) {
      messageEl.textContent = "Player and Pokémon are required.";
      messageEl.className = "error";
      return;
    }

    // ---- Duplicate prevention ----
    if (!database[player]) database[player] = { shiny_count: 0, shinies: {} };
    const playerShinies = database[player].shinies || {};
    const last5Ids = Object.keys(playerShinies)
      .map(id => parseInt(id))
      .sort((a, b) => b - a) // newest first
      .slice(0, 5);

    const overrideContainer = document.getElementById("override-container");
    overrideContainer.style.display = "none"; // hide initially

    const duplicate = last5Ids.some(id => {
      return playerShinies[id].Pokemon.toLowerCase() === pokemonName.toLowerCase();
    });

    if (duplicate && !overrideDuplicate) {
      messageEl.textContent = `Duplicate Pokémon Detected! Did they hit 2 ${pokemonName} or has it already been added? Check "Override Duplicate" to force add.`;
      messageEl.className = "error";
      overrideContainer.style.display = "block";
      return; // stop submission unless override
    }
    else
    {
      overrideContainer.style.display = "none";
    }

    // ---- Add Pokémon ----
    const nextId = Object.keys(playerShinies).length + 1;
    database[player].shinies[nextId] = {
      Pokemon: pokemonName,
      Month: month,
      Year: year,
      "Secret Shiny": secretShiny,
      Egg: egg,
      Alpha: alpha,
      Sold: sold,
      Event: eventVal,
      Reaction: reaction,
      MysteriousBall: mysteriousBall,
      Safari: safari,
      Favourite: favourite,
      "Honey Tree": honeyTree,
      Legendary: legendary,
      "Reaction Link": reactionLink,
    };
    database[player].shiny_count += 1;
    updateShinyCount(player);
    renderPreview(database);

    try {
      const res = await fetch(`${WORKER_BASE}/update-database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: admin,
          password,
          data: database,
          action: `Added ${pokemonName} for ${player}${duplicate ? " (Override)" : ""}`,
        }),
      });

      const result = await res.json();
      if (result.success) {
        messageEl.textContent = `Pokémon added successfully${duplicate && overrideDuplicate ? " (Override)" : ""}!`;
        messageEl.className = "success";
        document.getElementById("overrideDuplicate").checked = false; // reset checkbox
        await loadDatabase(); // reload DB + log
      } else {
        messageEl.textContent = "Failed to add Pokémon.";
        messageEl.className = "error";
      }
    } catch (err) {
      messageEl.textContent = "Error updating database: " + err.message;
      messageEl.className = "error";
    }

  } else {
    // ---- Streamer Form ----
    const pokeName = document.getElementById("pokeName").value.trim();
    const twitchName = document.getElementById("twitchName").value.trim();

    if (!pokeName || !twitchName) {
      messageEl.textContent = "Both PokeMMO Name and Twitch Name are required.";
      messageEl.className = "error";
      return;
    }

    streamersDB[pokeName] = { twitch_username: twitchName };

    try {
      const res = await fetch(`${WORKER_BASE}/update-streamers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: admin,
          password,
          data: streamersDB,
          action: `Added streamer ${pokeName}`,
        }),
      });

      const result = await res.json();
      if (result.success) {
        messageEl.textContent = "Streamer added successfully!";
        messageEl.className = "success";
        await loadDatabase();
      } else {
        messageEl.textContent = "Failed to add streamer.";
        messageEl.className = "error";
      }
    } catch (err) {
      messageEl.textContent = "Error updating streamers: " + err.message;
      messageEl.className = "error";
    }
  }
});


  // --------------------- Update Button ---------------------
  updateBtn.addEventListener("click", async () => {
    if (!isAuthorized()) {
      updateMessageEl.textContent = "Unauthorized: Log in first.";
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

    const admin = window.ADMIN_AUTH.name;
    const password = window.ADMIN_AUTH.password;
    const dbType = modeSelect.value === "pokemon" ? "pokemon" : "streamer";
    const endpoint =
      dbType === "pokemon"
        ? `${WORKER_BASE}/update-database`
        : `${WORKER_BASE}/update-streamers`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: admin,
          password,
          data: updatedData,
          action: `Manual JSON edit (${dbType})`,
        }),
      });

      const result = await res.json();

      if (result.success) {
        if (dbType === "pokemon") database = updatedData;
        else streamersDB = updatedData;

        updateMessageEl.textContent = "Database successfully updated!";
        updateMessageEl.className = "success";
        await loadDatabase();
      } else {
        updateMessageEl.textContent = "Failed to update.";
        updateMessageEl.className = "error";
      }
    } catch (err) {
      updateMessageEl.textContent = "Error updating database: " + err.message;
      updateMessageEl.className = "error";
    }
  });

   // --------------------- Delete Button ---------------------
  const deleteBtn = document.getElementById("deleteBtn");
  const deleteMessage = document.getElementById("deleteMessage");

  deleteBtn.addEventListener("click", async () => {
  const player = document.getElementById("deletePlayer").value.trim();
  const idToDelete = document.getElementById("deleteId").value.trim(); // optional

  if (!isAuthorized()) {
    deleteMessage.textContent = "Unauthorized: Log in first.";
    deleteMessage.className = "error";
    return;
  }

  if (!player) {
    deleteMessage.textContent = "Player is required.";
    deleteMessage.className = "error";
    return;
  }

  if (!database[player]) {
    deleteMessage.textContent = `No data found for player ${player}.`;
    deleteMessage.className = "error";
    return;
  }

  const admin = window.ADMIN_AUTH.name;
  const password = window.ADMIN_AUTH.password;

  // Determine deletion type
  if (!idToDelete) {
    // Delete entire player
    delete database[player];
    try {
      const res = await fetch(`${WORKER_BASE}/update-database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: admin,
          password,
          data: database,
          action: `Deleted all data for player ${player}`,
        }),
      });

      const result = await res.json();
      if (result.success) {
        deleteMessage.textContent = `All data for ${player} deleted successfully!`;
        deleteMessage.className = "success";
        renderPreview(database);
        await loadDatabase();
      } else {
        deleteMessage.textContent = "Failed to delete player.";
        deleteMessage.className = "error";
      }
    } catch (err) {
      deleteMessage.textContent = "Error updating database: " + err.message;
      deleteMessage.className = "error";
    }

  } else {
    // Delete specific Pokémon ID
    if (!database[player].shinies[idToDelete]) {
      deleteMessage.textContent = `No Pokémon found with ID ${idToDelete} for ${player}.`;
      deleteMessage.className = "error";
      return;
    }

    delete database[player].shinies[idToDelete];

    // Reindex IDs
    const newShinies = {};
    Object.keys(database[player].shinies)
      .sort((a, b) => parseInt(a) - parseInt(b)) // ascending
      .forEach((key, index) => {
        newShinies[index + 1] = database[player].shinies[key];
      });
    database[player].shinies = newShinies;

    // Update shiny count
    updateShinyCount(player);

    try {
      const res = await fetch(`${WORKER_BASE}/update-database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: admin,
          password,
          data: database,
          action: `Deleted Pokémon ID ${idToDelete} for ${player}`,
        }),
      });

      const result = await res.json();

      if (result.success) {
        deleteMessage.textContent = `Pokémon ID ${idToDelete} deleted successfully!`;
        deleteMessage.className = "success";
        renderPreview(database);
        await loadDatabase();
      } else {
        deleteMessage.textContent = "Failed to delete Pokémon.";
        deleteMessage.className = "error";
      }
    } catch (err) {
      deleteMessage.textContent = "Error updating database: " + err.message;
      deleteMessage.className = "error";
    }
  }
});



  // Initial load
  await loadDatabase();
}

window.initAdminPanel = initAdminPanel;
