// ---------- CONFIG ----------
const JSON_VERSION = "v13"; // increment when shiny_database.json updates
const JSON_FILE = "shiny_database.json";

// ---------- GET DATA ----------
async function getData() {
  try {
    const cacheBuster = Date.now(); // unique every load
    const res = await fetch(`${JSON_FILE}?v=${JSON_VERSION}&t=${cacheBuster}`, {
      cache: "no-store"
    });

    if (!res.ok) throw new Error("Failed to fetch JSON");
    return await res.json();
  } catch (err) {
    console.error("Error loading shiny_database.json:", err);
    return {};
  }
}

// ---------- RENDER SHOWCASE WITH FILTER ----------
async function renderShowcase(filter = "") {
  const data = await getData();
  const container = document.getElementById("showcase");
  container.innerHTML = "";

  // Sort players by shiny_count descending
  const sortedPlayers = Object.entries(data).sort(
    (a, b) => b[1].shiny_count - a[1].shiny_count
  );

  sortedPlayers.forEach(([player, playerData], index) => {
    // If filter is active and player does not match, skip
    if (filter && !player.toLowerCase().includes(filter.toLowerCase())) return;

    const card = document.createElement("div");
    card.className = "player-card";
    // Top 5 players get "top-player" class
    const playerClass = index < 5 ? "player-name top-player" : "player-name";

    card.innerHTML = `<div class="${playerClass}">#${index + 1} ${player} (${playerData.shiny_count})</div>`;

    const shinyList = document.createElement("div");
    shinyList.className = "shiny-list";

    Object.values(playerData.shinies).forEach(s => {
      const span = document.createElement("span");
      const urlName = s.Pokemon.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      const imgContainer = document.createElement("div");
      imgContainer.className = "gif-container";

      // Make the whole box clickable if Reaction Link exists
      if (s["Reaction Link"] && s["Reaction Link"].trim() !== "") {
        imgContainer.style.cursor = "pointer";
        imgContainer.addEventListener("click", () => {
          window.open(s["Reaction Link"], "_blank"); // open in new tab
        });
      }

      if (s.Alpha && s.Alpha.toLowerCase() === "yes") {
        imgContainer.classList.add("alpha-pokemon");
        imgContainer.classList.add("glow-alphapokemon");
      }

      if (s["Secret Shiny"] && s["Secret Shiny"].toLowerCase() === "yes") {
        imgContainer.classList.add("glow-pokemon");
        const secretIcon = document.createElement("img");
        secretIcon.src = "secretshiny.png";
        secretIcon.className = "secret-icon";
        imgContainer.appendChild(secretIcon);
      }

      if (s["Egg"] && s["Egg"].toLowerCase() === "yes") {
        const eggIcon = document.createElement("img");
        eggIcon.src = "egg.png";
        eggIcon.className = "egg-icon";
        imgContainer.appendChild(eggIcon);
      }

      if (s["Safari"] && s["Safari"].toLowerCase() === "yes") {
        const safariIcon = document.createElement("img");
        safariIcon.src = "safari.png";
        safariIcon.className = "safari-icon";
        imgContainer.appendChild(safariIcon);
      }
      if (s["Event"] && s["Event"].toLowerCase() === "yes") {
        const safariIcon = document.createElement("img");
        safariIcon.src = "event.png";
        safariIcon.className = "event-icon";
        imgContainer.appendChild(safariIcon);
      }

      if (s["MysteriousBall"] && s["MysteriousBall"].toLowerCase() === "yes") {
      const mysteriousBall = document.createElement("img");
      mysteriousBall.src = "mysteriousball.gif"; // your GIF file
      mysteriousBall.className = "mysteriousball-gif";
      imgContainer.appendChild(mysteriousBall);
    }

    // Add favourite class if Pokémon is a Favourite
    if (s.Favourite && s.Favourite.toLowerCase() === "yes") {
      imgContainer.classList.add("favourite-pokemon");

      // Add heart icon top-left
      const heartIcon = document.createElement("img");
      heartIcon.src = "heart.png"; // your heart PNG file
      heartIcon.className = "favourite-heart";
      imgContainer.appendChild(heartIcon);
    }


    if (s.Favourite && s.Favourite.toLowerCase() === "yes") {
      imgContainer.classList.add("favourite-pokemon");
    }


      // Reaction PNG
      if (s["Reaction Link"] && s["Reaction Link"].trim() !== "") {
        const reactionIcon = document.createElement("img");
        reactionIcon.src = "reaction.png";
        reactionIcon.className = "reaction-icon";
        reactionIcon.title = "React";
        reactionIcon.addEventListener("click", e => {
          e.stopPropagation();
          window.open(s["Reaction Link"], "_blank");
        });
        imgContainer.appendChild(reactionIcon);
      }

      // Pokémon GIF
      const img = document.createElement("img");
      img.src = `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
      img.alt = s.Pokemon;
      img.className = "shiny-gif";

      if (s.Sold && s.Sold.toLowerCase() === "yes") {
        img.classList.add("sold-pokemon"); // apply grayscale to GIF itself
      }

      // Particle overlay
      const particle = document.createElement("img");
      particle.src = "sparkle.gif";
      particle.className = "particle-gif";

      imgContainer.appendChild(img);
      imgContainer.appendChild(particle);

      // Info box
     const info = document.createElement("div");
      info.className = "info-box";

      // Start with Pokémon name
      let infoContent = `<strong>${s.Pokemon}</strong><br>`;

      // Map trait names to display labels
      const traitLabels = {
      "Secret Shiny": "Secret Shiny",
      "Egg": "Egg",
      "Alpha": "Alpha",
      "Sold": "Sold/Fled",
      "Event": "Event",
      "Reaction": "Reaction",
      "MysteriousBall": "Mysterious Ball",
      "Safari": "Safari",
      "Favourite": "Favourite"
    };

      // List all traits that are true
      const traits = Object.keys(traitLabels);
      const trueTraits = traits.filter(trait => s[trait] && s[trait].toLowerCase() === "yes");

      // Add each true trait to the info box
      infoContent += trueTraits.length > 0 ? trueTraits.map(t => traitLabels[t]).join("<br>") : "None";

      info.innerHTML = infoContent;


      span.appendChild(imgContainer);
      span.appendChild(info);
      shinyList.appendChild(span);
    });

    card.appendChild(shinyList);
    container.appendChild(card);
  });
}

// ---------- SEARCH EVENT ----------
document.getElementById("playerSearch").addEventListener("input", (e) => {
  const filter = e.target.value;
  renderShowcase(filter);
});

// ---------- INITIAL RENDER ----------
renderShowcase();


// ---------- NAVIGATION MENU HANDLER ----------
(function setupMenu() {
  const nav = document.getElementById("top-nav");
  const tabs = nav.querySelectorAll("li");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // Remove active from all tabs
      tabs.forEach(t => t.classList.remove("active"));
      // Add active to clicked tab
      tab.classList.add("active");

      // Handle tab action
      const tabName = tab.textContent.trim().toLowerCase();
      handleTabClick(tabName);
    });
  });

  // Function to handle tab clicks
  function handleTabClick(tabName) {
    switch(tabName) {
      case "shiny showcase":
        renderShowcase();
        break;
      case "shotm":
        // Example: replace content with leaderboard placeholder
        const container = document.getElementById("showcase");
        container.innerHTML = `<div class="message">Shiny Hunter of the Month coming soon!</div>`;
        break;
      default:
        console.warn("No action defined for tab:", tabName);
    }
  }
})();


// ----------------------
// SHOOTING STARS JS
// ----------------------

// Select the container
// ----------------------
// SHOOTING STARS JS
// ----------------------

// Select the container
const starContainer = document.querySelector('.stars-container');

// Determine number of stars based on screen width
let starCount;
if (window.innerWidth < 600) {
  starCount = 10; // mobile
} else if (window.innerWidth < 1024) {
  starCount = 20; // tablet
} else {
  starCount = 35; // desktop
}

// Utility function to generate random number between min and max
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Create a single star
function createStar() {
  const star = document.createElement('div');
  star.classList.add('star');

  // Random star size
  const size = randomBetween(2, 6); // 2–6px
  star.style.width = size + 'px';
  star.style.height = size + 'px';
  star.style.boxShadow = `0 0 ${size*2}px #fff, 0 0 ${size*3}px #fff, 0 0 ${size*5}px #fff`;

  // Random starting position along top of screen
  star.style.top = randomBetween(0, 50) + 'px';
  star.style.left = randomBetween(0, window.innerWidth) + 'px';

  // Random speed (px per frame)
  star.speed = randomBetween(0.5, 3);

  // Random opacity
  star.opacity = randomBetween(0.4, 0.9);
  star.style.opacity = star.opacity;

  // Random angle for downward diagonal movement
  star.angle = randomBetween(240, 300); // 240°–300° downward
  star.rad = star.angle * Math.PI / 180;

  // Random tail length
  star.tailLength = randomBetween(100, 300);
  star.style.setProperty('--tail-length', star.tailLength + 'px');

  // Tail rotation
  star.style.setProperty('--tail-rotate', `${star.angle}deg`);

  // Append star to container
  starContainer.appendChild(star);

  // Animate the star
  animateStar(star);
}

// Animate a star
function animateStar(star) {
  function move() {
    const dx = Math.cos(star.rad) * star.speed;
    const dy = Math.sin(star.rad) * star.speed;

    star.style.left = parseFloat(star.style.left) - dx + 'px';
    star.style.top = parseFloat(star.style.top) - dy + 'px';

    // Flicker effect
    star.opacity += (Math.random() - 0.5) * 0.05;
    star.opacity = Math.max(0.3, Math.min(1, star.opacity));
    star.style.opacity = star.opacity;

    // Reset if off-screen
    if (
      parseFloat(star.style.left) < -200 ||
      parseFloat(star.style.top) > window.innerHeight + 200 ||
      parseFloat(star.style.left) > window.innerWidth + 200 ||
      parseFloat(star.style.top) < -200
    ) {
      resetStar(star);
    }

    requestAnimationFrame(move);
  }
  requestAnimationFrame(move);
}

// Reset a star (reuse element)
function resetStar(star) {
  star.style.top = randomBetween(0, 50) + 'px';
  star.style.left = randomBetween(0, window.innerWidth) + 'px';
  star.speed = randomBetween(0.5, 3);
  star.opacity = randomBetween(0.4, 0.9);
  star.style.opacity = star.opacity;

  star.angle = randomBetween(240, 300);
  star.rad = star.angle * Math.PI / 180;

  star.tailLength = randomBetween(100, 300);
  star.style.setProperty('--tail-length', star.tailLength + 'px');
  star.style.setProperty('--tail-rotate', `${star.angle}deg`);

  // Optional: random size on reset
  const size = randomBetween(2, 6);
  star.style.width = size + 'px';
  star.style.height = size + 'px';
  star.style.boxShadow = `0 0 ${size*2}px #fff, 0 0 ${size*3}px #fff, 0 0 ${size*5}px #fff`;
}

// ----------------------
// CREATE STARS WITH TRICKLE-IN EFFECT
// ----------------------
for (let i = 0; i < starCount; i++) {
  const delay = randomBetween(0, 3000); // each star appears within 3 seconds
  setTimeout(() => {
    createStar();
  }, delay);
}

// ----------------------
// OPTIONAL: Handle window resize
// ----------------------
window.addEventListener('resize', () => {
  // Remove all existing stars
  starContainer.innerHTML = '';

  // Recalculate star count
  if (window.innerWidth < 600) {
    starCount = 5;
  } else if (window.innerWidth < 1024) {
    starCount = 10;
  } else {
    starCount = 20;
  }

  // Recreate stars with trickle-in effect
  for (let i = 0; i < starCount; i++) {
    const delay = randomBetween(0, 3000);
    setTimeout(() => {
      createStar();
    }, delay);
  }
});
