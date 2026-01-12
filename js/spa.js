const pageContainer = document.getElementById("main-container");
const nav = document.getElementById("top-nav");
const tabs = nav.querySelectorAll("li");

function setActiveTab(tabName) {
  tabs.forEach((t) => {
    const name = t.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    t.classList.toggle("active", name === tabName);
  });
}

async function loadPage(tabName) {
  if (!tabName) tabName = "shiny-showcase";

  document.body.classList.remove("player-page-active");

  if (tabName === "shiny-showcase") {
    const res = await fetch("/pages/shiny-showcase.html");
    if (!res.ok)
      return (pageContainer.innerHTML =
        "<div class='message'>Page not found</div>");
    pageContainer.innerHTML = await res.text();
    if (typeof initShowcase === "function") await initShowcase();
  } else if (tabName === "counter-generator") {
    const res = await fetch("/pages/counter-generator.html");
    if (!res.ok)
      return (pageContainer.innerHTML =
        "<div class='message'>Page not found</div>");
    pageContainer.innerHTML = await res.text();
    if (typeof initEncounterCounter === "function") initEncounterCounter();
  } else if (tabName === "shotm") {
    pageContainer.innerHTML = `<div class="message">Shiny Hunter of the Month coming soon!</div>`;
  } else {
    pageContainer.innerHTML = `<div class="message">Page not found.</div>`;
  }

  setActiveTab(tabName);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", (e) => {
    const tabName = tab.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    window.location.hash = tabName;
  });
});

async function handleHashChange() {
  const hash = window.location.hash.slice(1);

  if (hash.startsWith("player/")) {
    const playerName = hash.split("/")[1];

    if (!document.getElementById("showcase")) {
      const res = await fetch("/pages/shiny-showcase.html");
      pageContainer.innerHTML = await res.text();
      if (typeof initShowcase === "function") await initShowcase();
    }

    if (typeof window.renderPlayerPage === "function") {
      window.renderPlayerPage(playerName);
    }
  } else {
    await loadPage(hash || "shiny-showcase");
  }
}

window.addEventListener("hashchange", handleHashChange);
document.addEventListener("DOMContentLoaded", handleHashChange);
