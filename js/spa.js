const pageContainer = document.getElementById("main-container");
const nav = document.getElementById("top-nav");
const tabs = nav.querySelectorAll("li");

function setActiveTab(tabName) {
  const cleanName = tabName.replace(/^#/, "");
  tabs.forEach(t => {
    const name = t.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    t.classList.toggle("active", name === cleanName);
  });
}

async function loadPage(tabName = "shiny-showcase") {
  document.body.classList.remove("player-page-active");

  const pageMap = {
    "shiny-showcase": { path: "/pages/shiny-showcase.html", init: "initShowcase" },
    "counter-generator": { path: "/pages/counter-generator.html", init: "initEncounterCounter" },
    "random-pokemon-generator": { path: "/pages/random-pokemon-generator.html", init: "initRandomPokemon" },
    "shotm": { path: "/pages/SHOTM.html", init: "initSHOTM" },
    "trophy-board": { init: "initTrophyBoard" },
    "trophies": { init: "initTrophyBoard" }
  };

  const page = pageMap[tabName];
  if (page) {
    if (page.path) {
      const res = await fetch(page.path);
      pageContainer.innerHTML = res.ok ? await res.text() : "<div class='message'>Page not found</div>";
    }
    if (page.init && typeof window[page.init] === "function") {
      await window[page.init]();
    }
  } else {
    pageContainer.innerHTML = "<div class='message'>Page not found.</div>";
  }

  setActiveTab(tabName);
}

tabs.forEach(tab => {
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
    if (typeof window.renderPlayerPage === "function") window.renderPlayerPage(playerName);
    sessionStorage.setItem("lastPageHash", "#shiny-showcase");
  } else if (hash.startsWith("trophy/")) {
    const trophyName = decodeURIComponent(hash.split("/")[1]);
    const lastHash = sessionStorage.getItem("lastPageHash") || "#trophy-board";
    if (typeof window.renderTrophyPage === "function") window.renderTrophyPage(trophyName, lastHash);
  } else if (hash === "trophy-board" || hash === "trophies") {
    if (typeof initTrophyBoard === "function") await initTrophyBoard();
  } else {
    await loadPage(hash);
  }

  setActiveTab(rawHash);
  if (!hash.startsWith("player/") && !hash.startsWith("trophy/")) sessionStorage.setItem("lastPageHash", rawHash);
}

window.addEventListener("hashchange", handleHashChange);
document.addEventListener("DOMContentLoaded", handleHashChange);
