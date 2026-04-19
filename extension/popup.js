chrome.storage.local.get('lastSong', (data) => {
  if (data.lastSong) {
    document.getElementById('last-title').textContent = data.lastSong.title;
    document.getElementById('last-channel').textContent = data.lastSong.channel;
  }
});
