// ---------- SPA NAV ----------
const pageContainer = document.getElementById("main-container");
const nav = document.getElementById("top-nav");
const tabs = nav.querySelectorAll("li");

function setActiveTab(tabName) {
  tabs.forEach(t => {
    const name = t.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    t.classList.toggle("active", name === tabName);
  });
}

async function loadPage(tabName) {
  if (!tabName) tabName = "shiny-showcase";

  try {
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

// Nav tab clicks
tabs.forEach(tab => {
  tab.addEventListener("click", e => {
    e.preventDefault();
    const tabName = tab.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    window.location.hash = tabName;
  });
});

// ---------- HASH HANDLING ----------
async function handleHashChange() {
  const hash = window.location.hash.replace("#", "");

  if (hash.startsWith("player/")) {
    // Player page handled by initShowcase
    if (typeof initShowcase === "function") {
      await initShowcase();       // ensure JSON is loaded
      if (typeof handleHash === "function") await handleHash();
    }
  } else {
    // Normal tabs
    await loadPage(hash || "shiny-showcase");
  }
}

window.addEventListener("hashchange", handleHashChange);

// Initial load
document.addEventListener("DOMContentLoaded", handleHashChange);
