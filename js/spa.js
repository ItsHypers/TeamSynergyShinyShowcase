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
  if (!tabName) tabName = "shiny-showcase";

  try {
    // SHINY SHOWCASE is special: you can optionally move it to a separate HTML page
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
  tab.addEventListener("click", () => {
    const tabName = tab.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    window.location.hash = tabName; // triggers hashchange
  });
});

// ---------- Hash change ----------
window.addEventListener("hashchange", () => {
  const page = window.location.hash.replace("#", "") || "shiny-showcase";
  loadPage(page);
});

// ---------- Initial load ----------
document.addEventListener("DOMContentLoaded", () => {
  const initialPage = window.location.hash.replace("#", "") || "shiny-showcase";
  loadPage(initialPage);
});
