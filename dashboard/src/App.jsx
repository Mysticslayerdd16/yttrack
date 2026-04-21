import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import './App.css';

const GENRE_COLORS = {
  'Pop': '#e84a3a', 'Hip-Hop': '#3b8ae8', 'Alternative': '#5cb85c',
  'R&B': '#e8a63a', 'Electronic': '#9b59b6', 'Rock': '#e84a8a',
  'Lo-fi': '#1abc9c', 'Classical': '#f39c12', 'Jazz': '#e67e22',
  'Other': '#666'
};

const GENRE_EMOJIS = {
  'Pop': '🎤', 'Hip-Hop': '🎧', 'Alternative': '🎸', 'R&B': '🎷',
  'Electronic': '⚡', 'Rock': '🎸', 'Lo-fi': '🌙', 'Classical': '🎻',
  'Jazz': '🎺', 'Other': '🎵'
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function timeAgo(ts) {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d / 60000) + 'm ago';
  if (d < 86400000) return Math.floor(d / 3600000) + 'h ago';
  if (d < 604800000) return Math.floor(d / 86400000) + 'd ago';
  return new Date(ts).toLocaleDateString();
}

function isToday(ts) { return new Date(ts).toDateString() === new Date().toDateString(); }
function isThisWeek(ts) { return Date.now() - new Date(ts).getTime() < 604800000; }

function getDayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getWeekKey(ts) {
  const d = new Date(ts);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

export default function App() {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [tab, setTab] = useState('history');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [extActive, setExtActive] = useState(false);
  const [toast, setToast] = useState(null);
  const [newPlName, setNewPlName] = useState('');
  const [showPlInput, setShowPlInput] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const fetchSongs = useCallback(async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('last_played_at', { ascending: false });
    if (!error && data) setSongs(data);
  }, []);

  const fetchPlaylists = useCallback(async () => {
    const { data, error } = await supabase
      .from('playlists')
      .select('*, playlist_songs(song_id)')
      .order('created_at', { ascending: false });
    if (!error && data) setPlaylists(data);
  }, []);

  useEffect(() => {
    Promise.all([fetchSongs(), fetchPlaylists()]).finally(() => setLoading(false));
    const channel = supabase
      .channel('songs-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, () => {
        fetchSongs();
        setExtActive(true);
      })
      .subscribe();
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'YTTRACK_PING') setExtActive(true);
    });
    return () => supabase.removeChannel(channel);
  }, [fetchSongs, fetchPlaylists]);

  const toggleFav = async (song) => {
    const { error } = await supabase
      .from('songs')
      .update({ is_favorite: !song.is_favorite })
      .eq('id', song.id);
    if (!error) {
      setSongs(prev => prev.map(s => s.id === song.id ? { ...s, is_favorite: !s.is_favorite } : s));
      showToast(song.is_favorite ? 'Removed from favorites' : 'Added to favorites ♥');
    }
  };

  const createPlaylist = async () => {
    if (!newPlName.trim()) return;
    const icons = ['🔥', '🌙', '🌊', '⚡', '🎯', '🌿', '💫', '🎸'];
    const icon = icons[playlists.length % icons.length];
    const { error } = await supabase.from('playlists').insert({ name: newPlName.trim(), icon });
    if (!error) {
      fetchPlaylists();
      setNewPlName('');
      setShowPlInput(false);
      showToast('Playlist created!');
    }
  };

  const filteredSongs = songs.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.title.toLowerCase().includes(q) || (s.channel || '').toLowerCase().includes(q) || (s.genre || '').toLowerCase().includes(q);
    const matchF = filter === 'all' || (filter === 'today' && isToday(s.last_played_at)) || (filter === 'week' && isThisWeek(s.last_played_at));
    return matchQ && matchF;
  });

  const favSongs = songs.filter(s => s.is_favorite);
  const todayCount = songs.filter(s => isToday(s.last_played_at)).length;
  const totalPlays = songs.reduce((a, s) => a + (s.play_count || 0), 0);
  const topSongs = [...songs].sort((a, b) => b.play_count - a.play_count).slice(0, 5);
  const maxPlays = topSongs[0]?.play_count || 1;

  const genreMap = {};
  songs.forEach(s => { if (s.genre) genreMap[s.genre] = (genreMap[s.genre] || 0) + 1; });
  const genreEntries = Object.entries(genreMap).sort((a, b) => b[1] - a[1]);
  const totalGenre = genreEntries.reduce((a, b) => a + b[1], 0) || 1;

  const hourMap = new Array(24).fill(0);
  songs.forEach(s => { hourMap[new Date(s.last_played_at).getHours()] += s.play_count || 1; });
  const maxHour = Math.max(...hourMap) || 1;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: getDayKey(d), label: DAY_NAMES[d.getDay()], count: 0 };
  });
  songs.forEach(s => {
    const key = getDayKey(s.last_played_at);
    const day = last7Days.find(d => d.key === key);
    if (day) day.count += s.play_count || 1;
  });
  const max7 = Math.max(...last7Days.map(d => d.count)) || 1;

  const last4Weeks = Array.from({ length: 4 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (3 - i) * 7);
    return { key: getWeekKey(d), label: `W${4 - (3 - i)}`, count: 0 };
  });
  songs.forEach(s => {
    const key = getWeekKey(s.last_played_at);
    const week = last4Weeks.find(w => w.key === key);
    if (week) week.count += s.play_count || 1;
  });
  const max4w = Math.max(...last4Weeks.map(w => w.count)) || 1;

  const dowMap = new Array(7).fill(0);
  songs.forEach(s => { dowMap[new Date(s.last_played_at).getDay()] += s.play_count || 1; });
  const maxDow = Math.max(...dowMap) || 1;
  const mostActiveDay = dowMap.indexOf(Math.max(...dowMap));

  const totalMins = totalPlays * 3.5;
  const listeningHours = Math.floor(totalMins / 60);
  const listeningMins = Math.round(totalMins % 60);

  const daySet = new Set(songs.map(s => getDayKey(s.last_played_at)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (daySet.has(getDayKey(d))) streak++;
    else break;
  }

  const channelMap = {};
  songs.forEach(s => {
    const ch = (s.channel || 'Unknown').replace(' - Topic', '');
    channelMap[ch] = (channelMap[ch] || 0) + (s.play_count || 1);
  });
  const topChannels = Object.entries(channelMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxChannel = topChannels[0]?.[1] || 1;

  if (loading) return (
    <div className="loader">
      <div className="loader-icon">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
      </div>
      <p>Loading your music...</p>
    </div>
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm-2 11V7l6 3-6 3z"/></svg>
          </div>
          <span className="logo-text">yt<strong>track</strong></span>
        </div>
        <nav className="sidebar-nav">
          {[
            { id: 'history', label: 'History', icon: '◷' },
            { id: 'favorites', label: 'Favorites', icon: '♥' },
            { id: 'playlists', label: 'Playlists', icon: '⊞' },
            { id: 'stats', label: 'Stats', icon: '∿' },
          ].map(t => (
            <button key={t.id} className={`nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="nav-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className={`ext-status ${extActive ? 'on' : 'off'}`}>
            <span className="ext-dot" />
            <span>{extActive ? 'Extension active' : 'Extension offline'}</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="stats-bar">
          {[
            { label: 'Unique songs', val: songs.length },
            { label: 'Total plays', val: totalPlays },
            { label: 'Played today', val: todayCount },
            { label: 'Favorites', val: favSongs.length },
            { label: 'Playlists', val: playlists.length },
          ].map(s => (
            <div className="stat-pill" key={s.label}>
              <span className="stat-val">{s.val}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {tab === 'history' && (
          <div className="section animate-in">
            <div className="section-header">
              <h1>History</h1>
              <div className="search-row">
                <div className="search-wrap">
                  <svg className="search-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M11.4 10l3.3 3.3-1.4 1.4L10 11.4A6 6 0 112 8a6 6 0 019.4 2zm-1.4.7A4.5 4.5 0 108 12.5a4.5 4.5 0 001.9-.4l.1-.4z"/></svg>
                  <input className="search-input" type="text" placeholder="Search songs, artists, genres..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-chips">
                  {['all', 'today', 'week'].map(f => (
                    <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                      {f === 'all' ? 'All time' : f === 'today' ? 'Today' : 'This week'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {filteredSongs.length === 0
              ? <Empty icon="🎵" title="No songs yet" sub={songs.length ? 'No songs match your search' : 'Install the extension to start tracking'} />
              : <SongList songs={filteredSongs} onFav={toggleFav} />}
          </div>
        )}

        {tab === 'favorites' && (
          <div className="section animate-in">
            <div className="section-header"><h1>Favorites</h1></div>
            {favSongs.length === 0
              ? <Empty icon="♥" title="No favorites yet" sub="Heart songs from your history to save them here" />
              : <SongList songs={favSongs} onFav={toggleFav} />}
          </div>
        )}

        {tab === 'playlists' && (
          <div className="section animate-in">
            <div className="section-header">
              <h1>Playlists</h1>
              <button className="btn-primary" onClick={() => setShowPlInput(v => !v)}>+ New playlist</button>
            </div>
            {showPlInput && (
              <div className="pl-input-row">
                <input className="pl-name-input" type="text" placeholder="Playlist name..." value={newPlName}
                  onChange={e => setNewPlName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createPlaylist()} autoFocus />
                <button className="btn-primary" onClick={createPlaylist}>Create</button>
                <button className="btn-ghost" onClick={() => { setShowPlInput(false); setNewPlName(''); }}>Cancel</button>
              </div>
            )}
            {playlists.length === 0
              ? <Empty icon="📂" title="No playlists yet" sub="Create a playlist to organize your favorite tracks" />
              : (
                <div className="pl-grid">
                  {playlists.map(pl => (
                    <div className="pl-card" key={pl.id}>
                      <div className="pl-icon">{pl.icon}</div>
                      <div className="pl-name">{pl.name}</div>
                      <div className="pl-count">{(pl.playlist_songs || []).length} songs</div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {tab === 'stats' && (
          <div className="section animate-in">
            <div className="section-header"><h1>Stats</h1></div>
            {songs.length === 0
              ? <Empty icon="📊" title="No data yet" sub="Stats will appear once you've tracked some songs" />
              : (
                <div className="stats-layout">
                  <div className="stats-card wide">
                    <h3 className="card-title">Overview</h3>
                    <div className="overview-grid">
                      <div className="overview-item">
                        <div className="overview-val">{listeningHours}h {listeningMins}m</div>
                        <div className="overview-label">Estimated listening time</div>
                      </div>
                      <div className="overview-item">
                        <div className="overview-val">{streak} {streak === 1 ? 'day' : 'days'}</div>
                        <div className="overview-label">Current streak 🔥</div>
                      </div>
                      <div className="overview-item">
                        <div className="overview-val">{DAY_FULL[mostActiveDay]}</div>
                        <div className="overview-label">Most active day</div>
                      </div>
                      <div className="overview-item">
                        <div className="overview-val">{Math.round(totalPlays / Math.max(daySet.size, 1) * 10) / 10}</div>
                        <div className="overview-label">Avg plays per day</div>
                      </div>
                    </div>
                  </div>

                  <div className="stats-card wide">
                    <h3 className="card-title">Last 7 days</h3>
                    <div className="bar-chart">
                      {last7Days.map((d, i) => (
                        <div className="bar-chart-col" key={i}>
                          <div className="bar-chart-track">
                            <div className="bar-chart-fill" style={{ height: `${Math.round(d.count / max7 * 100)}%` }} title={`${d.count} plays`} />
                          </div>
                          <div className="bar-chart-label">{d.label}</div>
                          <div className="bar-chart-val">{d.count || ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="stats-card">
                    <h3 className="card-title">Last 4 weeks</h3>
                    <div className="bar-chart">
                      {last4Weeks.map((w, i) => (
                        <div className="bar-chart-col" key={i}>
                          <div className="bar-chart-track">
                            <div className="bar-chart-fill" style={{ height: `${Math.round(w.count / max4w * 100)}%` }} title={`${w.count} plays`} />
                          </div>
                          <div className="bar-chart-label">{w.label}</div>
                          <div className="bar-chart-val">{w.count || ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="stats-card">
                    <h3 className="card-title">Most active day of week</h3>
                    <div className="bar-chart">
                      {dowMap.map((val, i) => (
                        <div className="bar-chart-col" key={i}>
                          <div className="bar-chart-track">
                            <div className="bar-chart-fill"
                              style={{ height: `${Math.round(val / maxDow * 100)}%`, background: i === mostActiveDay ? '#e84a3a' : 'rgba(232,74,58,0.4)' }}
                              title={`${val} plays`} />
                          </div>
                          <div className="bar-chart-label" style={{ color: i === mostActiveDay ? '#e84a3a' : undefined }}>{DAY_NAMES[i]}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="stats-card">
                    <h3 className="card-title">Top songs</h3>
                    {topSongs.map(s => (
                      <div className="bar-row" key={s.id}>
                        <span className="bar-label" title={s.title}>{s.title}</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(s.play_count / maxPlays * 100)}%` }} /></div>
                        <span className="bar-val">{s.play_count}x</span>
                      </div>
                    ))}
                  </div>

                  <div className="stats-card">
                    <h3 className="card-title">Top artists / channels</h3>
                    {topChannels.map(([ch, count]) => (
                      <div className="bar-row" key={ch}>
                        <span className="bar-label" title={ch}>{ch}</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(count / maxChannel * 100)}%`, background: '#3b8ae8' }} /></div>
                        <span className="bar-val">{count}x</span>
                      </div>
                    ))}
                  </div>

                  <div className="stats-card">
                    <h3 className="card-title">Genres</h3>
                    <div className="genre-list">
                      {genreEntries.map(([g, c]) => (
                        <div className="genre-row" key={g}>
                          <span className="genre-dot" style={{ background: GENRE_COLORS[g] || '#666' }} />
                          <span className="genre-name">{GENRE_EMOJIS[g] || '🎵'} {g}</span>
                          <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(c / totalGenre * 100)}%`, background: GENRE_COLORS[g] || '#666' }} /></div>
                          <span className="bar-val">{Math.round(c / totalGenre * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="stats-card wide">
                    <h3 className="card-title">Listening by hour</h3>
                    <div className="heatmap">
                      {hourMap.map((h, i) => {
                        const alpha = h === 0 ? 0.05 : 0.1 + (h / maxHour) * 0.85;
                        return <div key={i} className="heat-cell" title={`${i}:00 — ${h} plays`} style={{ background: `rgba(232,74,58,${alpha.toFixed(2)})` }} />;
                      })}
                    </div>
                    <div className="heat-labels">
                      <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}
      </main>
      {toast && <div className="toast animate-in">{toast}</div>}
    </div>
  );
}

function SongList({ songs, onFav }) {
  return (
    <div className="song-list">
      {songs.map((s, i) => (
        <div className="song-card" key={s.id} style={{ animationDelay: `${i * 0.03}s` }}>
          <div className="song-emoji">{GENRE_EMOJIS[s.genre] || '🎵'}</div>
          <div className="song-info">
            <div className="song-title">{s.title}</div>
            <div className="song-meta">{s.channel?.replace(' - Topic', '') || 'Unknown'} · {s.genre || 'Music'}</div>
          </div>
          <span className="play-badge">{s.play_count}×</span>
          <span className="song-time">{timeAgo(s.last_played_at)}</span>
          <div className="song-actions">
            <button className={`btn-icon ${s.is_favorite ? 'fav' : ''}`} onClick={() => onFav(s)} title="Favorite">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 13.7l-1.1-1C2.9 9.1 1 7.3 1 5.1 1 3.3 2.4 2 4.2 2c1 0 2 .5 2.7 1.2L8 4.4l1.1-1.2C9.8 2.5 10.8 2 11.8 2 13.6 2 15 3.3 15 5.1c0 2.2-1.9 4-5.9 7.6L8 13.7z"/></svg>
            </button>
            <a className="btn-icon" href={s.yt_url} target="_blank" rel="noreferrer" title="Open on YouTube">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 4.5l5 3.5-5 3.5V4.5z"/><path fillRule="evenodd" d="M2 8c0-2.2 0-3.3.4-4.2A4 4 0 014 2.1C4.9 1.7 6 1.7 8 1.7s3.1 0 4 .4a4 4 0 011.6 1.7C14 4.7 14 5.8 14 8s0 3.3-.4 4.2A4 4 0 0112 13.9c-.9.4-2 .4-4 .4s-3.1 0-4-.4a4 4 0 01-1.6-1.7C2 11.3 2 10.2 2 8z" clipRule="evenodd"/></svg>
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ icon, title, sub }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-sub">{sub}</div>
    </div>
  );
}
