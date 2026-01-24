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

  liveEl.innerHTML = '';
  offlineEl.innerHTML = '';

  // Live streamers
  data.live.forEach(stream => {
    const link = document.createElement('a');
    link.href = `https://www.twitch.tv/${stream.user_login}`;
    link.target = '_blank';
    link.style.textDecoration = 'none';

    const div = document.createElement('div');
    div.className = 'streamer-card live';
    div.innerHTML = `
      <img src="${stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180')}" alt="${stream.user_name} thumbnail" />
      <p class="player-name">${stream.user_name}</p>
      <p class="stream-title">${stream.title}</p>
      <p class="viewer-count">${stream.viewer_count} viewers</p>
    `;

    link.appendChild(div);
    liveEl.appendChild(link);
  });

  // Offline streamers
  data.offline.forEach(user => {
    const link = document.createElement('a');
    link.href = `https://www.twitch.tv/${user.login}`;
    link.target = '_blank';
    link.style.textDecoration = 'none';

    const div = document.createElement('div');
    div.className = 'streamer-card';
    div.innerHTML = `
      <img src="${user.profile_image_url}" alt="${user.display_name} profile" class="offline-profile" />
      <p class="player-name">${user.display_name}</p>
    `;

    link.appendChild(div);
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