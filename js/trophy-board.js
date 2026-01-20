// ===============================
// TROPHY PAGE
// ===============================
window.renderTrophyPage = async (trophyName, returnHash = "#") => {
  const container = document.getElementById("main-container");
  if (!container) return;

  try {
    const [trophiesRes, shinyRes] = await Promise.all([
      fetch("./json/trophies.json"),
      fetch("./shiny_database.json")
    ]);

    if (!trophiesRes.ok) throw new Error("Failed to fetch trophies.json");
    if (!shinyRes.ok) throw new Error("Failed to fetch shiny_database.json");

    const { trophies, trophyAssignments } = await trophiesRes.json();
    const shinyDatabase = await shinyRes.json();

    const trophyKey = Object.keys(trophies).find(
      k => k.toLowerCase() === trophyName.toLowerCase()
    );

    if (!trophyKey) {
      container.innerHTML = `<h2 style="color:white;">Trophy "${trophyName}" not found</h2>`;
      return;
    }

    const trophyImg = trophies[trophyKey];

    // Only show players that exist in shiny_database.json
    const players = (trophyAssignments[trophyKey] || []).filter(player =>
      Object.keys(shinyDatabase).some(dbKey => dbKey.toLowerCase() === player.toLowerCase())
    );


    let buttonText = "← Back";
    if (returnHash.startsWith("#player/")) {
      buttonText = "← Return to Player Page";
    } else if (returnHash === "#trophy-board" || returnHash === "#trophies") {
      buttonText = "← Return to Trophy Board";
    }

    container.innerHTML = `
      <div class="trophy-page">
        <button class="back-button">${buttonText}</button>
        <div class="trophy-header">
          <img src="${trophyImg}" alt="${trophyKey}" class="large-trophy">
          <h1>${trophyKey}</h1>
        </div>
        <h2 style="color:white;margin-top:16px;">Players who have this trophy:</h2>
        <ul class="trophy-players-list"></ul>
      </div>
    `;

    const ul = container.querySelector(".trophy-players-list");
    players.forEach(player => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#player/${player.toLowerCase()}" style="color:#9b59b6;text-decoration:none;">${player}</a>`;
      ul.appendChild(li);
    });

    container.querySelector(".back-button").addEventListener("click", () => {
      const target = returnHash.startsWith("#") ? returnHash : "#" + returnHash;

      if (window.location.hash === target) {
        window.location.hash = "";
        setTimeout(() => {
          window.location.hash = target;
        }, 1);
      } else {
        window.location.hash = target;
      }
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<h2 style="color:white;">Error loading trophy page</h2>`;
  }
};


// ===============================
// TROPHY BOARD
// ===============================
async function initTrophyBoard() {
  const container = document.getElementById("main-container");
  if (!container) return;

  try {
    const res = await fetch("./json/trophies.json");
    if (!res.ok) throw new Error("Failed to fetch trophies.json");

    const { trophies } = await res.json();

    container.innerHTML = `
      <h1 class="trophy-board-title">Trophy Board</h1>
      <div class="trophy-board-grid"></div>
    `;

    const grid = container.querySelector(".trophy-board-grid");

    Object.entries(trophies).forEach(([name, imgSrc]) => {
      const trophyWrapper = document.createElement("div");
      trophyWrapper.className = "trophy-board-item";

      const trophyImg = document.createElement("img");
      trophyImg.src = imgSrc;
      trophyImg.alt = name;
      trophyImg.className = "trophy-board-img";
      trophyImg.loading = 'lazy';

      const trophyLabel = document.createElement("div");
      trophyLabel.className = "trophy-board-label";
      trophyLabel.textContent = name;

      trophyWrapper.appendChild(trophyImg);
      trophyWrapper.appendChild(trophyLabel);

      trophyWrapper.addEventListener("click", () => {
        window.renderTrophyPage(name, "#trophy-board");
      });

      grid.appendChild(trophyWrapper);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<h2 style="color:white;">Failed to load Trophy Board</h2>`;
  }
}
