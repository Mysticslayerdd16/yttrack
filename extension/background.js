// YTTrack background service worker

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'SONG_TRACKED') {
    // Update badge to show recent activity
    chrome.action.setBadgeText({ text: '♪' });
    chrome.action.setBadgeBackgroundColor({ color: '#e84a3a' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);

    // Store last tracked song
    chrome.storage.local.set({
      lastSong: { title: msg.title, channel: msg.channel, ts: Date.now() }
    });
  }
});
