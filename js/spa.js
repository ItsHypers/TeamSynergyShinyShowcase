const pageContainer = document.getElementById("main-container");
const nav = document.getElementById("top-nav");
const tabs = nav.querySelectorAll("li");

function setActiveTab(tabName) {
  const cleanName = tabName.replace(/^#/, "");
  tabs.forEach((t) => {
    const name = t.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    t.classList.toggle("active", name === cleanName);
  });
}

async function loadPage(tabName = "shiny-showcase") {
  document.body.classList.remove("player-page-active");

  if (tabName === "admin") {
    pageContainer.innerHTML = `
    <div class="admin-login-container">
      <h2 id="admin-text">Admin Login</h2>
      <input type="text" id="admin-name" placeholder="Admin name" />
      <input type="password" id="admin-password" placeholder="Password" />
      <button id="admin-login-btn">Login</button>
      <div id="admin-login-message" class="admin-message"></div>
    </div>
  `;

    const nameInput = pageContainer.querySelector("#admin-name");
    const passInput = pageContainer.querySelector("#admin-password");
    const button = pageContainer.querySelector("#admin-login-btn");
    const message = pageContainer.querySelector("#admin-login-message");

    button.addEventListener("click", async () => {
      const admin = nameInput.value.trim();
      const password = passInput.value.trim();

      if (!admin || !password) {
        message.textContent = "Enter admin name and password.";
        return;
      }

      try {
        const res = await fetch(
          "https://adminpage.hypersmmo.workers.dev/admin/check",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: admin, password }),
          },
        );

        const data = await res.json();

        if (!data.authorized) {
          message.textContent = "Invalid admin credentials.";
          return;
        }

        window.ADMIN_AUTH = { name: admin, password };

        const adminRes = await fetch("/pages/admin.html");
        if (!adminRes.ok) {
          pageContainer.innerHTML =
            "<div class='message'>Failed to load admin page</div>";
          return;
        }

        pageContainer.innerHTML = await adminRes.text();

        const adminForm = document.getElementById("admin-form-container");
        if (adminForm) adminForm.style.display = "block";

        if (typeof window.initAdminPanel === "function") {
          await window.initAdminPanel();
        }
      } catch (err) {
        message.textContent = "Error contacting server.";
      }
    });

    return;
  }

  const pageMap = {
    "shiny-showcase": {
      path: "/pages/shiny-showcase.html",
      init: "initShowcase",
    },
    "counter-generator": {
      path: "/pages/counter-generator.html",
      init: "initEncounterCounter",
    },
    "random-pokemon-generator": {
      path: "/pages/random-pokemon-generator.html",
      init: "initRandomPokemon",
    },
    pokedex: { path: "/pages/pokedex.html", init: "initPokeDex" },
    streamers: { path: "/pages/streamers.html", init: "initStreamers" },
    shotm: { path: "/pages/SHOTM.html", init: "initSHOTM" },
    "trophy-board": { init: "initTrophyBoard" },
    trophies: { init: "initTrophyBoard" },
  };

  const page = pageMap[tabName];
  if (page) {
    if (page.path) {
      const res = await fetch(page.path);
      pageContainer.innerHTML = res.ok
        ? await res.text()
        : "<div class='message'>Page not found</div>";
    }
    if (page.init && typeof window[page.init] === "function") {
      await window[page.init]();
    }
  } else {
    pageContainer.innerHTML = "<div class='message'>Page not found.</div>";
  }

  setActiveTab(tabName);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const tabName = tab.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    window.location.hash = `#${tabName}`;
  });
});

async function handleHashChange() {
  const rawHash = window.location.hash || "#shiny-showcase";
  const hash = rawHash.slice(1);
  if (!pageContainer) return;

  if (hash.startsWith("player/")) {
    const playerName = decodeURIComponent(hash.split("/")[1]);
    if (!document.getElementById("showcase")) {
      const res = await fetch("/pages/shiny-showcase.html");
      pageContainer.innerHTML = await res.text();
      if (typeof initShowcase === "function") await initShowcase();
    }
    if (typeof window.renderPlayerPage === "function")
      window.renderPlayerPage(playerName);
    sessionStorage.setItem("lastPageHash", "#shiny-showcase");
  } else if (hash.startsWith("trophy/")) {
    const trophyName = decodeURIComponent(hash.split("/")[1]);
    const lastHash = sessionStorage.getItem("lastPageHash") || "#trophy-board";
    if (typeof window.renderTrophyPage === "function")
      window.renderTrophyPage(trophyName, lastHash);
  } else if (hash === "trophy-board" || hash === "trophies") {
    if (typeof initTrophyBoard === "function") await initTrophyBoard();
  } else {
    await loadPage(hash);
  }

  setActiveTab(rawHash);
  if (!hash.startsWith("player/") && !hash.startsWith("trophy/"))
    sessionStorage.setItem("lastPageHash", rawHash);
}

window.addEventListener("hashchange", handleHashChange);
document.addEventListener("DOMContentLoaded", handleHashChange);
