// YTTrack content script - runs on YouTube pages

const SUPABASE_URL = 'https://uxajpjxypltpqnleapis.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YWpwanh5cGx0cHFubGVhcGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDAyNzgsImV4cCI6MjA5MjE3NjI3OH0.6xNLPxcuzW42BZ3fskQHNSB7HYFqHS7tg1EJFMvrEXs';

const MUSIC_KEYWORDS = ['lyrics', 'official audio', 'official music video', 'ft.', 'feat.', 'prod.', 'remix', 'music video', 'audio only', '(official)', 'vevo'];
const MUSIC_CHANNELS = ['vevo', '- topic', 'records', 'music', 'entertainment'];
const NON_MUSIC_KEYWORDS = ['podcast', 'interview', 'tutorial', 'how to', 'review', 'vlog', 'stream', 'gaming', 'reaction', 'unboxing', 'shorts'];

const GENRE_MAP = {
  'drake': 'Hip-Hop', 'kendrick': 'Hip-Hop', 'travis scott': 'Hip-Hop', 'j. cole': 'Hip-Hop', 'kanye': 'Hip-Hop',
  'taylor swift': 'Pop', 'ariana grande': 'Pop', 'dua lipa': 'Pop', 'billie eilish': 'Pop', 'weeknd': 'Pop',
  'ed sheeran': 'Pop', 'harry styles': 'Pop', 'olivia rodrigo': 'Pop',
  'bad bunny': 'Latin', 'j balvin': 'Latin',
  'eminem': 'Hip-Hop', 'post malone': 'Hip-Hop',
  'sza': 'R&B', 'frank ocean': 'R&B', 'the-dream': 'R&B',
  'metallica': 'Rock', 'imagine dragons': 'Rock', 'arctic monkeys': 'Alternative',
  'lo-fi': 'Lo-fi', 'lofi': 'Lo-fi', 'chill': 'Lo-fi',
  'classical': 'Classical', 'beethoven': 'Classical', 'mozart': 'Classical',
};

let lastTrackedUrl = '';
let lastTrackedTitle = '';
let checkInterval = null;

function isOnYouTubeMusic() {
  return window.location.hostname === 'music.youtube.com';
}

function getVideoId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('v');
}

function getDuration() {
  const video = document.querySelector('video');
  return video ? video.duration : 0;
}

function isLikelySong(title, channel, duration) {
  if (!title) return false;

  const titleLow = title.toLowerCase();
  const channelLow = (channel || '').toLowerCase();

  // Strong signals it IS a song
  if (isOnYouTubeMusic()) return true;
  if (channelLow.includes('- topic')) return true;
  if (channelLow.includes('vevo')) return true;
  if (MUSIC_KEYWORDS.some(k => titleLow.includes(k))) return true;

  // Strong signals it is NOT a song
  if (NON_MUSIC_KEYWORDS.some(k => titleLow.includes(k))) return false;

  // Duration heuristic: songs are usually 1.5 - 10 minutes
  if (duration > 0 && (duration < 90 || duration > 600)) return false;

  // Channel name check
  if (MUSIC_CHANNELS.some(k => channelLow.includes(k))) return true;

  return false;
}

function guessGenre(title, channel) {
  const combined = (title + ' ' + channel).toLowerCase();
  for (const [keyword, genre] of Object.entries(GENRE_MAP)) {
    if (combined.includes(keyword)) return genre;
  }
  if (combined.includes('- topic')) return 'Pop';
  return 'Other';
}

function getVideoInfo() {
  // Title
  let title = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string')?.textContent?.trim()
    || document.querySelector('ytd-video-primary-info-renderer h1')?.textContent?.trim()
    || document.querySelector('.title.style-scope.ytd-video-primary-info-renderer')?.textContent?.trim()
    || document.title.replace(' - YouTube', '').trim();

  // Channel
  let channel = document.querySelector('#channel-name a')?.textContent?.trim()
    || document.querySelector('ytd-channel-name a')?.textContent?.trim()
    || document.querySelector('.ytd-channel-name')?.textContent?.trim()
    || '';

  // YouTube Music selectors
  if (isOnYouTubeMusic()) {
    title = document.querySelector('.title.ytmusic-player-bar')?.textContent?.trim() || title;
    channel = document.querySelector('.byline.ytmusic-player-bar a')?.textContent?.trim() || channel;
  }

  const duration = getDuration();
  const videoId = getVideoId();
  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return { title, channel, duration, videoId, ytUrl };
}

async function trackSong(info) {
  const { title, channel, ytUrl, videoId } = info;
  const genre = guessGenre(title, channel);

  const songData = {
    title,
    channel,
    yt_url: ytUrl,
    video_id: videoId,
    genre,
    last_played_at: new Date().toISOString(),
  };

  try {
    // Check if song already exists
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/songs?video_id=eq.${videoId}&select=id,play_count`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const existing = await checkRes.json();

    if (existing && existing.length > 0) {
      // Update play count and timestamp
      await fetch(`${SUPABASE_URL}/rest/v1/songs?id=eq.${existing[0].id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          play_count: existing[0].play_count + 1,
          last_played_at: new Date().toISOString(),
        })
      });
    } else {
      // Insert new song
      await fetch(`${SUPABASE_URL}/rest/v1/songs`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ ...songData, play_count: 1, is_favorite: false })
      });
    }

    // Notify background script
    chrome.runtime.sendMessage({ type: 'SONG_TRACKED', title, channel });

  } catch (err) {
    console.warn('[YTTrack] Failed to track song:', err);
  }
}

function checkAndTrack() {
  const videoId = getVideoId();
  if (!videoId) return;

  const video = document.querySelector('video');
  if (!video || video.paused || video.ended) return;

  const info = getVideoInfo();
  if (!info.title) return;

  // Deduplicate: only track if URL or title changed
  const currentKey = `${videoId}_${info.title}`;
  if (currentKey === lastTrackedTitle) return;

  // Wait until we have duration info
  if (info.duration === 0) return;

  if (!isLikelySong(info.title, info.channel, info.duration)) return;

  lastTrackedTitle = currentKey;
  lastTrackedUrl = window.location.href;

  trackSong(info);
}

function startTracking() {
  if (checkInterval) clearInterval(checkInterval);
  checkInterval = setInterval(checkAndTrack, 5000);
  // Also check immediately after a short delay (page load)
  setTimeout(checkAndTrack, 3000);
}

// Watch for YouTube's SPA navigation
let lastHref = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastHref) {
    lastHref = window.location.href;
    lastTrackedTitle = '';
    setTimeout(checkAndTrack, 4000);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial start
startTracking();
