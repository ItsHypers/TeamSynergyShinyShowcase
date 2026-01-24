async function initStreamers() {
  const STREAMERS_JSON = '/json/streamers.json';
  const WORKER_API = 'https://twitch-api.hypersmmo.workers.dev/api/streamers';

  async function fetchStreamersList() {
    const res = await fetch(STREAMERS_JSON);
    if (!res.ok) throw new Error('Failed to load streamer list');
    return res.json();
  }

  async function fetchTwitchData(streamers) {
    const query = streamers.map(s => `user_login=${s}`).join('&');
    const res = await fetch(`${WORKER_API}?${query}`);
    if (!res.ok) throw new Error('Failed to fetch Twitch data');
    return res.json();
  }

function displayStreamers(data) {
  const liveEl = document.getElementById('live-streamers');
  const offlineEl = document.getElementById('offline-streamers');
  const liveSection = document.getElementById('live-section');

  // Remove the "Loading..." message
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) loadingMessage.remove();

  // Clear offline streamers
  offlineEl.innerHTML = '';

  // Live streamers
  if (!data.live.length) {
    // Remove the whole live section if no live streamers
    if (liveSection) liveSection.remove();
  } else {
    liveEl.innerHTML = '';
    data.live.forEach(stream => {
      const link = document.createElement('a');
      link.href = `https://www.twitch.tv/${stream.user_name.toLowerCase()}`;
      link.target = '_blank';
      link.style.textDecoration = 'none';

      const li = document.createElement('li');
      li.className = 'streamer-card live';
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

  // Offline streamers
  offlineEl.innerHTML = '';
  data.offline.forEach(user => {
    const link = document.createElement('a');
    link.href = `https://www.twitch.tv/${user.user_name.toLowerCase()}`;
    link.target = '_blank';
    link.style.textDecoration = 'none';

    const li = document.createElement('li');
    li.className = 'streamer-card';
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

  // Auto-refresh every 60s
  document.addEventListener('DOMContentLoaded', () => {
    init();
    setInterval(init, 60000);
  });
  init();
}