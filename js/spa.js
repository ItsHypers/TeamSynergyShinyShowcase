// ---------- SPA.JS ----------

// Container for page content
const pageContainer = document.getElementById("main-container");
const nav = document.getElementById("top-nav");
const tabs = nav.querySelectorAll("li");

// ---------- Set active nav tab ----------
function setActiveTab(tabName) {
  tabs.forEach(t => {
    const name = t.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    t.classList.toggle("active", name === tabName);
  });
}

// ---------- Load page by name ----------
async function loadPage(tabName) {
  try {
    if (!tabName || tabName === "shiny-showcase") {
      const res = await fetch("/pages/shiny-showcase.html");
      if (!res.ok) throw new Error("Shiny Showcase page not found");
      pageContainer.innerHTML = await res.text();
      if (typeof initShowcase === "function") initShowcase();
      setActiveTab("shiny-showcase");

    } else if (tabName === "counter-generator") {
      const res = await fetch("/pages/counter-generator.html");
      if (!res.ok) throw new Error("Counter Generator page not found");
      pageContainer.innerHTML = await res.text();
      if (typeof initEncounterCounter === "function") initEncounterCounter();
      setActiveTab("counter-generator");

    } else if (tabName === "shotm") {
      pageContainer.innerHTML = `<div class="message">Shiny Hunter of the Month coming soon!</div>`;
      setActiveTab("shotm");

    } else if (tabName.startsWith("player/")) {
      const playerName = tabName.split("/")[1];
      if (typeof initShowcase === "function") initShowcase(); // make sure initShowcase is ready

      await loadPlayerPage(playerName); // SPA function from showcase.js
      document.body.classList.add("player-page-active");
      setActiveTab(""); // no nav tab for player pages

    } else {
      pageContainer.innerHTML = `<div class="message">Page not found.</div>`;
      setActiveTab("");
    }
  } catch (err) {
    console.error(err);
    pageContainer.innerHTML = `<div class="message">Error loading page.</div>`;
    setActiveTab("");
  }
}

// ---------- Nav tab clicks ----------
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const tabName = tab.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    history.pushState({}, "", `#${tabName}`);
    loadPage(tabName);
    document.body.classList.remove("player-page-active"); // remove player page class
  });
});

// ---------- Player link clicks ----------
document.addEventListener("click", (e) => {
  const link = e.target.closest("a.player-link");
  if (!link) return;
  e.preventDefault();
  const player = link.dataset.player;
  history.pushState({}, "", `#/player/${player.toLowerCase()}`);
  loadPage(`player/${player.toLowerCase()}`);
});

// ---------- Back/forward buttons ----------
window.addEventListener("popstate", () => {
  const hash = window.location.hash.replace("#", "");
  loadPage(hash);
});

// ---------- Initial load ----------
document.addEventListener("DOMContentLoaded", () => {
  const initialHash = window.location.hash.replace("#", "") || "shiny-showcase";
  loadPage(initialHash);
});
