async function initStreamers() {
  const WORKER_API = "https://adminpage.hypersmmo.workers.dev/admin/streamers";
  const TWITCH_WORKER_API =
    "https://twitch-api.hypersmmo.workers.dev/api/streamers";

  async function fetchStreamersList() {
    const res = await fetch(WORKER_API);
    if (!res.ok) throw new Error("Failed to load streamer list");
    const data = await res.json();

    return Object.values(data).map((s) => s.twitch_username);
  }

  async function fetchTwitchData(streamers) {
    if (!streamers.length) return { live: [], offline: [] };

    const fetchPromises = streamers.map((username) =>
      fetch(`${TWITCH_WORKER_API}?user_login=${username}`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
    );

    const results = await Promise.all(fetchPromises);

    const live = [];
    const offline = [];
    results.forEach((res) => {
      if (!res) return;
      if (res.live && res.live.length) live.push(...res.live);
      if (res.offline && res.offline.length) offline.push(...res.offline);
    });

    return { live, offline };
  }

  function displayStreamers(data) {
    const liveEl = document.getElementById("live-streamers");
    const offlineEl = document.getElementById("offline-streamers");
    const liveSection = document.getElementById("live-section");

    const loadingMessage = document.getElementById("loading-message");
    if (loadingMessage) loadingMessage.remove();

    if (!data.live.length) {
      if (liveSection) liveSection.remove();
    } else {
      liveEl.innerHTML = "";
      data.live.forEach((stream) => {
        const link = document.createElement("a");
        link.href = `https://www.twitch.tv/${stream.user_name.toLowerCase()}`;
        link.target = "_blank";
        link.style.textDecoration = "none";

        const li = document.createElement("li");
        li.className = "streamer-card live";
        li.innerHTML = `
          <img src="${stream.thumbnail_url}" alt="${stream.user_name} thumbnail" />
          <p class="player-name">${stream.user_name}</p>
          <p class="stream-title">${stream.title}</p>
          <p class="viewer-count">${stream.viewer_count} viewers</p>
        `;

        link.appendChild(li);
        liveEl.appendChild(link);
      });
    }

    offlineEl.innerHTML = "";
    data.offline.forEach((user) => {
      const link = document.createElement("a");
      link.href = `https://www.twitch.tv/${user.user_name.toLowerCase()}`;
      link.target = "_blank";
      link.style.textDecoration = "none";

      const li = document.createElement("li");
      li.className = "streamer-card";
      li.innerHTML = `
        <img src="${user.profile_image_url}" alt="${user.user_name} profile" class="offline-profile" />
        <p class="player-name">${user.user_name}</p>
      `;

      link.appendChild(li);
      offlineEl.appendChild(link);
    });
  }

  async function init() {
    try {
      const streamers = await fetchStreamersList(); 

      const data = await fetchTwitchData(streamers);
      displayStreamers(data);
    } catch (err) {
      console.error(err);
    }
  }

  init();
}

