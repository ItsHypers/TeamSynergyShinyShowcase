window.reloadAdminData = async () => {
  if (window.initAdminPanel && typeof window.loadDatabaseGlobal === "function") {
    await window.loadDatabaseGlobal();
  }
};

window.initAdminPanel = async function initAdminPanel() {
  const modeSelect = document.getElementById("mode");
  const pokemonForm = document.getElementById("pokemon-form");
  const streamerForm = document.getElementById("streamer-form");
  const addBtn = document.getElementById("addBtn");
  const updateBtn = document.getElementById("updateBtn");
  const messageEl = document.getElementById("message");
  const updateMessageEl = document.getElementById("update-message");
  const previewEl = document.getElementById("preview");
  const logPreviewEl = document.getElementById("logPreview");
  const deleteBtn = document.getElementById("deleteBtn");
  const deleteMessage = document.getElementById("deleteMessage");

  let database = {};
  let streamersDB = {};
  const WORKER_BASE = "https://adminpage.hypersmmo.workers.dev/admin";

  const isAuthorized = () => window.ADMIN_AUTH?.name && window.ADMIN_AUTH?.password;

  const getDbAndEndpoint = () => {
    const dbType = modeSelect.value === "pokemon" ? "pokemon" : "streamer";
    const db = dbType === "pokemon" ? database : streamersDB;
    const endpoint =
      dbType === "pokemon"
        ? `${WORKER_BASE}/update-database`
        : `${WORKER_BASE}/update-streamers`;
    return { dbType, db, endpoint };
  };

  const postData = async (endpoint, payload) => {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const renderPreview = (db) => {
    previewEl.textContent = JSON.stringify(db, null, 2);
  };

  const renderCurrentPreview = () => {
    const db = modeSelect.value === "pokemon" ? database : streamersDB;
    renderPreview(db);
  };

  const updateShinyCount = (player) => {
    const shinies = database[player]?.shinies;
    if (!shinies) return;
    database[player].shiny_count = Object.values(shinies).filter(s => s.Sold !== "Yes").length;
  };

  const renderLog = (logData) => {
    if (!logPreviewEl) return;
    const sortedLog = [...(logData.log || [])].sort(
      (a, b) => new Date(b.time) - new Date(a.time)
    );
    logPreviewEl.textContent = sortedLog
      .map(entry => {
        const date = new Date(entry.time);
        const formattedTime = date.toLocaleString(undefined, {
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
        return `Admin: ${entry.admin}\nAction:\n${entry.action}\nTime: ${formattedTime}\n-------------------------`;
      })
      .join("\n");
  };

  const setupAutocomplete = (inputEl, suggestionsEl, getOptions) => {
    let currentFocus = -1;

    const closeAllSuggestions = (exceptEl = null) => {
      document.querySelectorAll(".autocomplete-suggestions").forEach(box => {
        if (box !== exceptEl) box.classList.remove("show");
      });
    };

    const addActive = (items) => {
      removeActive(items);
      if (currentFocus >= items.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = items.length - 1;
      items[currentFocus].classList.add("active");
    };

    const removeActive = (items) => items.forEach(item => item.classList.remove("active"));

    inputEl.addEventListener("input", () => {
      const val = inputEl.value.toLowerCase();
      closeAllSuggestions(suggestionsEl);
      suggestionsEl.innerHTML = "";
      if (!val) return;

      const options = getOptions().filter(opt => opt.toLowerCase().includes(val));
      if (!options.length) return;

      const fragment = document.createDocumentFragment();
      options.forEach(option => {
        const div = document.createElement("div");
        div.textContent = option;
        div.className = "autocomplete-suggestion";
        div.addEventListener("click", () => {
          inputEl.value = option;
          suggestionsEl.classList.remove("show");
        });
        fragment.appendChild(div);
      });
      suggestionsEl.appendChild(fragment);
      suggestionsEl.classList.add("show");
    });

    inputEl.addEventListener("keydown", (e) => {
      const items = suggestionsEl.querySelectorAll(".autocomplete-suggestion");
      if (!items) return;

      if (e.key === "ArrowDown") currentFocus++, addActive(items);
      else if (e.key === "ArrowUp") currentFocus--, addActive(items);
      else if (e.key === "Tab") {
        e.preventDefault();
        if (currentFocus > -1) inputEl.value = items[currentFocus].textContent, suggestionsEl.classList.remove("show"), currentFocus = -1;
      }
    });

    inputEl.addEventListener("focus", () => closeAllSuggestions(suggestionsEl));
    inputEl.addEventListener("blur", () => setTimeout(() => suggestionsEl.classList.remove("show"), 100));
    document.addEventListener("click", (e) => { if (e.target !== inputEl) suggestionsEl.classList.remove("show"); });
  };

  const initAutocomplete = () => {
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
    setupAutocomplete(
      document.getElementById("pokemon"),
      document.getElementById("pokemon-suggestions"),
      () => {
        const allPokemon = Object.values(database).flatMap(p => Object.values(p.shinies || {}).map(s => s.Pokemon));
        return [...new Map(allPokemon.map(p => [p.toLowerCase(), p])).values()]
          .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
      }
    );
  };

  const findChanges = (oldObj, newObj, path = "") => {
    const formatPath = (p) => {
      const parts = p.split(".");
      return `Player "${parts[0] || ''}" → Shiny ID ${parts[2] || ''} → ${parts.slice(3).join(".")}`;
    };

    let changes = [];
    for (let key in oldObj) {
      const p = path ? path + "." + key : key;
      if (!(key in newObj)) changes.push(`Removed ${formatPath(p)}`);
      else if (typeof oldObj[key] === "object" && oldObj[key] && newObj[key]) changes = changes.concat(findChanges(oldObj[key], newObj[key], p));
      else if (oldObj[key] !== newObj[key]) changes.push(`${formatPath(p)}\n  "${oldObj[key]}" → "${newObj[key]}"`);
    }
    for (let key in newObj) {
      const p = path ? path + "." + key : key;
      if (!(key in oldObj)) changes.push(`Added ${formatPath(p)}: "${newObj[key]}"`);
    }
    return changes;
  };

  const openJsonEditor = (jsonText, dbType, onSave) => {
    const win = window.open("", "_blank", "width=1000,height=700,resizable=yes,scrollbars=yes");
    const doc = win.document;
    doc.open();
    doc.write("<!DOCTYPE html><html><head><title>Editable JSON</title></head><body></body></html>");
    doc.close();

    const style = doc.createElement("style");
    style.textContent = `
      body { background:#1e1e2f; color:#fff; font-family:monospace; margin:0; height:100vh; display:flex; flex-direction:column; }
      h2 { margin:10px; } textarea { flex:1; margin:10px; background:#2b2b3b; color:#fff; border:1px solid #555; padding:10px; resize:both; border-radius:6px; }
      .footer { display:flex; align-items:center; gap:15px; padding:10px; background:#1a1a2a; border-top:1px solid #444; }
      button { padding:8px 14px; border:none; border-radius:6px; cursor:pointer; background:#4caf50; color:white; font-size:1rem; }
      #status { font-weight:bold; color:#fff; }
    `;
    doc.head.appendChild(style);

    const h2 = doc.createElement("h2");
    h2.textContent = `Editable JSON (${dbType.toUpperCase()})`;
    doc.body.appendChild(h2);

    const textarea = doc.createElement("textarea");
    textarea.id = "jsonEditor";
    textarea.value = jsonText;
    doc.body.appendChild(textarea);

    const footer = doc.createElement("div");
    footer.className = "footer";
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Changes";
    const status = doc.createElement("div");
    status.id = "status"; status.style.marginLeft = "10px";
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close"; closeBtn.style.marginLeft = "auto";

    footer.append(saveBtn, status, closeBtn);
    doc.body.appendChild(footer);

    closeBtn.onclick = () => win.close();
    const originalObj = (() => { try { return JSON.parse(jsonText); } catch { return {}; } })();

    saveBtn.onclick = async () => {
      let updatedData;
      try { updatedData = JSON.parse(textarea.value); } 
      catch (e) { status.textContent = "Invalid JSON: " + e.message; status.style.color = "#e53935"; return; }

      const changes = findChanges(originalObj, updatedData);
      const changesSummary = changes.length
        ? changes.slice(0, 20).join("\n") + (changes.length > 20 ? `\n...and ${changes.length - 20} more changes` : "")
        : "No changes detected";

      status.textContent = "Saving..."; status.style.color = "#fff";

      const { db, endpoint } = getDbAndEndpoint();
      const adminName = window.ADMIN_AUTH?.name || "";
      const adminPassword = window.ADMIN_AUTH?.password || "";

      const result = await postData(endpoint, {
        username: adminName,
        password: adminPassword,
        data: updatedData,
        action: `Manual JSON edit (via popup)\nChanges:\n${changesSummary}`
      });

      if (result.success) {
        status.textContent = "Saved successfully!"; status.style.color = "#4caf50";
        if (window.opener && typeof window.opener.loadDatabaseGlobal === "function") await window.opener.loadDatabaseGlobal();
        if (onSave) onSave(updatedData);
      } else {
        status.textContent = "Failed to save changes."; status.style.color = "#e53935";
      }
    };
  };

  async function loadDatabase() {
    try {
      const [dbRes, streamersRes, logRes] = await Promise.all([
        fetch(`${WORKER_BASE}/database`),
        fetch(`${WORKER_BASE}/streamers`),
        fetch(`${WORKER_BASE}/log`)
      ]);
      database = await dbRes.json();
      streamersDB = await streamersRes.json();
      const logData = await logRes.json();

      Object.keys(database).forEach(player => updateShinyCount(player));
      renderCurrentPreview();
      renderLog(logData);
      initAutocomplete();
    } catch (err) {
      messageEl.textContent = "Error loading database: " + err.message;
      messageEl.className = "error";
    }
  }

  window.loadDatabaseGlobal = loadDatabase;

  modeSelect.addEventListener("change", () => {
    pokemonForm.style.display = modeSelect.value === "pokemon" ? "block" : "none";
    streamerForm.style.display = modeSelect.value === "streamer" ? "block" : "none";
    renderCurrentPreview();
    messageEl.textContent = ""; updateMessageEl.textContent = "";
  });

  previewEl.addEventListener("click", () => {
    const { dbType } = getDbAndEndpoint();
    openJsonEditor(previewEl.textContent, dbType, (updatedData) => {
      if (dbType === "pokemon") database = updatedData;
      else streamersDB = updatedData;
      renderCurrentPreview();
    });
  });

  addBtn.addEventListener("click", async () => {
    if (!isAuthorized()) return messageEl.textContent = "Unauthorized: Please log in first.", messageEl.className = "error";
    const admin = window.ADMIN_AUTH.name, password = window.ADMIN_AUTH.password;
    const { dbType, db, endpoint } = getDbAndEndpoint();

    if (dbType === "pokemon") {
      const player = document.getElementById("player").value.trim();
      const pokemonName = document.getElementById("pokemon").value.trim();
      if (!player || !pokemonName) return messageEl.textContent = "Player and Pokémon are required.", messageEl.className = "error";

      if (!database[player]) database[player] = { shiny_count: 0, shinies: {} };
      const playerShinies = database[player].shinies;

      const last5Ids = Object.keys(playerShinies).map(Number).sort((a,b)=>b-a).slice(0,5);
      const overrideDuplicate = document.getElementById("overrideDuplicate")?.checked || false;
      const duplicate = last5Ids.some(id => playerShinies[id].Pokemon.toLowerCase() === pokemonName.toLowerCase());

      document.getElementById("override-container").style.display = duplicate && !overrideDuplicate ? "block" : "none";
      if (duplicate && !overrideDuplicate) return messageEl.textContent = `Duplicate Pokémon Detected! Check "Override Duplicate" to force add.`, messageEl.className = "error";

      const nextId = Object.keys(playerShinies).length + 1;
      database[player].shinies[nextId] = {
        Pokemon: pokemonName,
        Month: document.getElementById("month").value.trim(),
        Year: document.getElementById("year").value.trim(),
        "Secret Shiny": document.getElementById("secretShiny").value,
        Egg: document.getElementById("egg").value,
        Alpha: document.getElementById("alpha").value,
        Sold: document.getElementById("sold").value,
        Event: document.getElementById("event").value,
        Reaction: document.getElementById("reaction").value,
        MysteriousBall: document.getElementById("mysteriousBall").value,
        Safari: document.getElementById("safari").value,
        Favourite: document.getElementById("favourite").value,
        "Honey Tree": document.getElementById("honeyTree").value,
        Legendary: document.getElementById("legendary").value,
        "Reaction Link": document.getElementById("reactionLink").value.trim()
      };
      updateShinyCount(player);
      renderCurrentPreview();

      const result = await postData(endpoint, {
        username: admin, password, data: database,
        action: `Added ${pokemonName} for ${player}${duplicate && overrideDuplicate ? " (Override)" : ""}`
      });
      if (result.success) {
        messageEl.textContent = `Pokémon added successfully${duplicate && overrideDuplicate ? " (Override)" : ""}!`;
        messageEl.className = "success";
        document.getElementById("overrideDuplicate").checked = false;
        await loadDatabase();
      } else messageEl.textContent = "Failed to add Pokémon.", messageEl.className = "error";
    } else {
      const pokeName = document.getElementById("pokeName").value.trim();
      const twitchName = document.getElementById("twitchName").value.trim();
      if (!pokeName || !twitchName) return messageEl.textContent = "Both PokeMMO Name and Twitch Name are required.", messageEl.className = "error";

      streamersDB[pokeName] = { twitch_username: twitchName };
      const result = await postData(endpoint, { username: admin, password, data: streamersDB, action: `Added streamer ${pokeName}` });
      if (result.success) messageEl.textContent = "Streamer added successfully!", messageEl.className = "success", await loadDatabase();
      else messageEl.textContent = "Failed to add streamer.", messageEl.className = "error";
    }
  });

  updateBtn.addEventListener("click", async () => {
    if (!isAuthorized()) return updateMessageEl.textContent = "Unauthorized: Log in first.", updateMessageEl.className = "error";

    let updatedData;
    try { updatedData = JSON.parse(previewEl.textContent); } 
    catch (err) { return updateMessageEl.textContent = "Invalid JSON: " + err.message, updateMessageEl.className = "error"; }

    const admin = window.ADMIN_AUTH.name, password = window.ADMIN_AUTH.password;
    const { dbType, endpoint } = getDbAndEndpoint();

    const result = await postData(endpoint, { username: admin, password, data: updatedData, action: `Manual JSON edit (${dbType})` });
    if (result.success) {
      if (dbType === "pokemon") database = updatedData; else streamersDB = updatedData;
      updateMessageEl.textContent = "Database successfully updated!"; updateMessageEl.className = "success";
      await loadDatabase();
    } else updateMessageEl.textContent = "Failed to update.", updateMessageEl.className = "error";
  });

  deleteBtn.addEventListener("click", async () => {
    const player = document.getElementById("deletePlayer").value.trim();
    const idToDelete = document.getElementById("deleteId").value.trim();

    if (!isAuthorized()) return deleteMessage.textContent = "Unauthorized: Log in first.", deleteMessage.className = "error";
    if (!player) return deleteMessage.textContent = "Player is required.", deleteMessage.className = "error";
    if (!database[player]) return deleteMessage.textContent = `No data found for player ${player}.`, deleteMessage.className = "error";

    const admin = window.ADMIN_AUTH.name;
    const password = window.ADMIN_AUTH.password;

    if (!idToDelete) {

      delete database[player];
      const result = await postData(`${WORKER_BASE}/update-database`, {
        username: admin, password, data: database,
        action: `Deleted all data for player ${player}`
      });

      if (result.success) {
        deleteMessage.textContent = `All data for ${player} deleted successfully!`;
        deleteMessage.className = "success";
        renderCurrentPreview();
        await loadDatabase();
      } else deleteMessage.textContent = "Failed to delete player.", deleteMessage.className = "error";
    } else {

      if (!database[player].shinies[idToDelete]) {
        return deleteMessage.textContent = `No Pokémon found with ID ${idToDelete} for ${player}.`, deleteMessage.className = "error";
      }

      delete database[player].shinies[idToDelete];

      const newShinies = {};
      Object.keys(database[player].shinies)
        .sort((a,b) => parseInt(a) - parseInt(b))
        .forEach((key, index) => { newShinies[index + 1] = database[player].shinies[key]; });
      database[player].shinies = newShinies;
      updateShinyCount(player);

      const result = await postData(`${WORKER_BASE}/update-database`, {
        username: admin, password, data: database,
        action: `Deleted Pokémon ID ${idToDelete} for ${player}`
      });

      if (result.success) {
        deleteMessage.textContent = `Pokémon ID ${idToDelete} deleted successfully!`;
        deleteMessage.className = "success";
        renderCurrentPreview();
        await loadDatabase();
      } else deleteMessage.textContent = "Failed to delete Pokémon.", deleteMessage.className = "error";
    }
  });

  await loadDatabase();
};

