
// Put this at the very top of your JS, outside initAdminPanel()
window.reloadAdminData = async () => {
  if (window.initAdminPanel) {
    // If database not loaded yet, just call init
    if (typeof window.loadDatabaseGlobal === "function") {
      await window.loadDatabaseGlobal(); // reloads DB + log
    }
  }
};


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

  // Allow popup to tell the main page to reload DB + preview
    window.refreshDatabase = async () => {
      await loadDatabase();
    };

previewEl.addEventListener("click", () => {
  const jsonText = previewEl.textContent;
  const dbType = modeSelect.value === "pokemon" ? "pokemon" : "streamer";
  const endpoint =
    dbType === "pokemon"
      ? `${WORKER_BASE}/update-database`
      : `${WORKER_BASE}/update-streamers`;

  const adminName = window.ADMIN_AUTH?.name || "";
  const adminPassword = window.ADMIN_AUTH?.password || "";

  const win = window.open("", "_blank", "width=1000,height=700,resizable=yes,scrollbars=yes");
  const doc = win.document;
  doc.open();
  doc.write("<!DOCTYPE html><html><head><title>Editable JSON</title></head><body></body></html>");
  doc.close();

  // Escape JSON safely
  const safeJSON = JSON.stringify(jsonText).replace(/\\/g, "\\\\").replace(/`/g, "\\`");

  const style = doc.createElement("style");
  style.textContent = `
  body {
    background:#1e1e2f;
    color:#fff;
    font-family:monospace;
    margin:0;
    height:100vh;
    display:flex;
    flex-direction:column;
  }
  h2 { margin:10px; }
  textarea {
    flex:1;
    margin:10px;
    background:#2b2b3b;
    color:#fff;
    border:1px solid #555;
    padding:10px;
    resize:both;
    border-radius:6px;
  }
  .footer {
    display:flex;
    align-items:center;
    gap:15px;
    padding:10px;
    background:#1a1a2a;
    border-top:1px solid #444;
  }
  button {
    padding:8px 14px;
    border:none;
    border-radius:6px;
    cursor:pointer;
    background:#4caf50;
    color:white;
    font-size:1rem;
  }
  #status { font-weight:bold; color:#fff; }
  `;
  doc.head.appendChild(style);

  const h2 = doc.createElement("h2");
  h2.textContent = "Editable JSON (" + dbType.toUpperCase() + ")";
  doc.body.appendChild(h2);

  const textarea = doc.createElement("textarea");
  textarea.id = "jsonEditor";
  textarea.value = jsonText;
  doc.body.appendChild(textarea);

  const footer = doc.createElement("div");
  footer.className = "footer";

  // Save button
  const saveBtn = doc.createElement("button");
  saveBtn.textContent = "Save Changes";
  footer.appendChild(saveBtn);

  const status = doc.createElement("div");
  status.id = "status";
  status.style.marginLeft = "10px"; // add some spacing from the button
  footer.appendChild(status);

  // Close button
  const closeBtn = doc.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.marginLeft = "auto"; 
  footer.appendChild(closeBtn);

  doc.body.appendChild(footer);

  // Close button functionality
  closeBtn.onclick = () => {
    win.close();
  };

  // Store original data safely
  let originalObj;
  try {
    originalObj = JSON.parse(jsonText);
  } catch (err) {
    originalObj = {};
  }

  function formatPath(path) {
    const parts = path.split(".");
    let player = parts[0] || "";
    let shinyId = parts[2] || "";
    let field = parts.slice(3).join(".");
    return `Player "${player}" → Shiny ID ${shinyId} → ${field}`;
  }

  function findChanges(oldObj, newObj, path = "") {
    let changes = [];

    for (let key in oldObj) {
      const p = path ? path + "." + key : key;
      if (!(key in newObj)) {
        changes.push(`Removed ${formatPath(p)}`);
      } else if (
        typeof oldObj[key] === "object" &&
        typeof newObj[key] === "object" &&
        oldObj[key] !== null &&
        newObj[key] !== null
      ) {
        changes = changes.concat(findChanges(oldObj[key], newObj[key], p));
      } else if (oldObj[key] !== newObj[key]) {
        changes.push(`${formatPath(p)}\n  "${oldObj[key]}" → "${newObj[key]}"`);
      }
    }

    for (let key in newObj) {
      const p = path ? path + "." + key : key;
      if (!(key in oldObj)) {
        changes.push(`Added ${formatPath(p)}: "${newObj[key]}"`);
      }
    }
    return changes;
  }

  saveBtn.onclick = async () => {

    let updatedData;
    try {
      updatedData = JSON.parse(textarea.value);
    } catch (e) {
      status.textContent = "Invalid JSON: " + e.message;
      status.style.color = "#e53935";
      return;
    }

    const changes = findChanges(originalObj, updatedData);
    const changesSummary = changes.length
      ? changes.slice(0, 20).join("\n") +
        (changes.length > 20 ? `\n...and ${changes.length - 20} more changes` : "")
      : "No changes detected";

    status.textContent = "Saving...";
    status.style.color = "#fff";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminName,
          password: adminPassword,
          data: updatedData,
          action: `Manual JSON edit (via popup)\nChanges:\n${changesSummary}`
        })
      });

      const result = await res.json();

      if (result.success) {
        status.textContent = "Saved successfully!";
        status.style.color = "#4caf50";

        // Force main panel to fully reload DB and log
        if (window.opener && typeof window.opener.loadDatabase === "function") {
          await window.opener.loadDatabase(); // fully reloads DB + logs
        } else if (window.opener && typeof window.opener.refreshDatabase === "function") {
          await window.opener.refreshDatabase(); // fallback
        }
      } else {
        status.textContent = "Failed to save changes.";
        status.style.color = "#e53935";
      }
    } catch (err) {
      status.textContent = "Error: " + err.message;
      status.style.color = "#e53935";
    }
    if (window.opener && typeof window.opener.loadDatabaseGlobal === "function") {
    await window.opener.loadDatabaseGlobal(); // reload DB + logs
  }
  };
});





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

      // Update counts
      for (const player in database) updateShinyCount(player);

      // Render preview
      if (modeSelect.value === "pokemon") renderPreview(database);
      else renderPreview(streamersDB);

      // Render log
      renderLog(logData);

      // After DB is loaded, initialize autocomplete
      initAutocomplete();
    } catch (err) {
      messageEl.textContent = "Error loading database: " + err.message;
      messageEl.className = "error";
    }
  }

  // Make loadDatabase global so popup can access
  window.loadDatabaseGlobal = loadDatabase;


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
