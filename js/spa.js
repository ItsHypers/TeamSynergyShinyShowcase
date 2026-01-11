// ---------- SPA NAV + PLAYER HANDLING ----------
const pageContainer = document.getElementById("main-container");
const nav = document.getElementById("top-nav");
const tabs = nav.querySelectorAll("li");

// ---------- Set active tab ----------
function setActiveTab(tabName) {
  tabs.forEach(t => {
    const name = t.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    t.classList.toggle("active", name === tabName);
  });
}

// ---------- Load page ----------
async function loadPage(tabName) {
  if (!tabName) tabName = "shiny-showcase";

  try {
    // Remove any player page styles
    document.body.classList.remove("player-page-active");

    if (tabName === "shiny-showcase") {
      const res = await fetch("/pages/shiny-showcase.html");
      if (!res.ok) throw new Error("Shiny Showcase page not found");
      pageContainer.innerHTML = await res.text();
      if (typeof initShowcase === "function") initShowcase();
    } else if (tabName === "counter-generator") {
      const res = await fetch("/pages/counter-generator.html");
      if (!res.ok) throw new Error("Counter Generator page not found");
      pageContainer.innerHTML = await res.text();
      if (typeof initEncounterCounter === "function") initEncounterCounter();
    } else if (tabName === "shotm") {
      pageContainer.innerHTML = `<div class="message">Shiny Hunter of the Month coming soon!</div>`;
    } else {
      pageContainer.innerHTML = `<div class="message">Page not found.</div>`;
    }
  } catch (err) {
    console.error(err);
    pageContainer.innerHTML = `<div class="message">Error loading page.</div>`;
  }

  setActiveTab(tabName);
}

// ---------- Nav tab clicks ----------
tabs.forEach(tab => {
  tab.addEventListener("click", (e) => {
    e.preventDefault();

    const tabName = tab.textContent.trim().toLowerCase().replace(/\s+/g, "-");

    // Force root path + hash to avoid combining with /player/...
    const newUrl = `/${tabName === "shiny-showcase" ? "" : ""}#${tabName}`;
    history.pushState({}, "", newUrl);

    loadPage(tabName);
  });
});

// ---------- SPA hash handling ----------
window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace("#", "") || "shiny-showcase";

  // If on /player/ path, remove player-page-active
  if (window.location.pathname.startsWith("/player/")) {
    document.body.classList.remove("player-page-active");
  }

  loadPage(hash);
});

// ---------- Initial load ----------
document.addEventListener("DOMContentLoaded", () => {
  // If the URL path is /player/<name>, load player page
  const pathParts = window.location.pathname.split("/").filter(Boolean);

  if (pathParts[0] === "player" && pathParts[1]) {
    if (typeof initShowcase === "function") {
      const playerName = pathParts[1];
      document.body.classList.add("player-page-active");
      initShowcase().then(() => {
        // SPA function will detect /player/<name> and load that page
        if (typeof loadPlayerPage === "function") loadPlayerPage(playerName);
      });
    }
  } else {
    const initialPage = window.location.hash.replace("#", "") || "shiny-showcase";
    loadPage(initialPage);
  }
});

// ---------- Handle browser back/forward ----------
window.addEventListener("popstate", () => {
  const pathParts = window.location.pathname.split("/").filter(Boolean);

  if (pathParts[0] === "player" && pathParts[1]) {
    if (typeof initShowcase === "function") {
      const playerName = pathParts[1];
      document.body.classList.add("player-page-active");
      initShowcase().then(() => {
        if (typeof loadPlayerPage === "function") loadPlayerPage(playerName);
      });
    }
  } else {
    const page = window.location.hash.replace("#", "") || "shiny-showcase";
    document.body.classList.remove("player-page-active");
    loadPage(page);
  }
});
