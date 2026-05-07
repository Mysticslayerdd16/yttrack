import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from './supabase';
import './App.css';

const GENRE_COLORS = {
  'Pop': '#e84a3a', 'Hip-Hop': '#3b8ae8', 'Alternative': '#5cb85c',
  'R&B': '#e8a63a', 'Electronic': '#9b59b6', 'Rock': '#e84a8a',
  'Lo-fi': '#1abc9c', 'Classical': '#f39c12', 'Jazz': '#e67e22', 'Other': '#666'
};
const GENRE_EMOJIS = {
  'Pop': '🎤', 'Hip-Hop': '🎧', 'Alternative': '🎸', 'R&B': '🎷',
  'Electronic': '⚡', 'Rock': '🎸', 'Lo-fi': '🌙', 'Classical': '🎻',
  'Jazz': '🎺', 'Other': '🎵'
};
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PERIODS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '3 months', days: 90 },
  { label: 'All time', days: null },
];

function timeAgo(ts) {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d / 60000) + 'm ago';
  if (d < 86400000) return Math.floor(d / 3600000) + 'h ago';
  if (d < 604800000) return Math.floor(d / 86400000) + 'd ago';
  return new Date(ts).toLocaleDateString();
}
function formatTime(ts) {
  const d = new Date(ts);
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
}
function formatDateFull(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
function getDayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getWeekKey(ts) {
  const d = new Date(ts);
  const soy = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - soy) / 86400000 + soy.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}
function formatDate(d) { return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`; }
function sameDay(a, b) { return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear(); }

function filterByRange(songs, startDate, endDate) {
  if (!startDate && !endDate) return songs;
  const start = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
  const end = endDate ? new Date(endDate).setHours(23,59,59,999) : null;
  return songs.filter(s => {
    const t = new Date(s.last_played_at).getTime();
    if (start && t < start) return false;
    if (end && t > end) return false;
    return true;
  });
}

function DateRangePicker({ startDate, endDate, onChange, onClose }) {
  const [hoverDate, setHoverDate] = useState(null);
  const [viewDate, setViewDate] = useState(startDate ? new Date(startDate) : new Date());
  const picking = startDate && !endDate ? 'end' : 'start';
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  const isInRange = (d) => {
    if (!d) return false;
    const end = endDate || hoverDate;
    if (startDate && end) { const s = new Date(startDate), e = new Date(end); return d > (s < e ? s : e) && d < (s < e ? e : s); }
    return false;
  };
  const isStart = (d) => d && startDate && sameDay(d, new Date(startDate));
  const isEnd = (d) => d && endDate && sameDay(d, new Date(endDate));
  const isToday = (d) => d && sameDay(d, new Date());
  const handleDay = (d) => {
    if (!d) return;
    if (picking === 'start' || (startDate && endDate)) onChange(d, null);
    else { const s = new Date(startDate); if (d < s) onChange(d, s); else onChange(new Date(startDate), d); }
  };
  return (
    <div className="date-picker">
      <div className="dp-header">
        <button className="dp-nav" onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button>
        <span className="dp-month">{MONTH_NAMES[month]} {year}</span>
        <button className="dp-nav" onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button>
      </div>
      <div className="dp-grid">
        {DAY_NAMES.map(d => <div key={d} className="dp-day-name">{d[0]}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={['dp-cell', d ? 'dp-cell-active' : '', isStart(d) ? 'dp-start' : '', isEnd(d) ? 'dp-end' : '', isInRange(d) ? 'dp-in-range' : '', isToday(d) ? 'dp-today' : ''].join(' ')}
            onClick={() => handleDay(d)} onMouseEnter={() => d && setHoverDate(d)} onMouseLeave={() => setHoverDate(null)}>
            {d ? d.getDate() : ''}
          </div>
        ))}
      </div>
      <div className="dp-footer">
        {startDate && !endDate && <span className="dp-hint">Now pick an end date</span>}
        {startDate && endDate && <div className="dp-selected"><span>{formatDate(new Date(startDate))}</span><span className="dp-arrow">→</span><span>{formatDate(new Date(endDate))}</span></div>}
        <div className="dp-actions">
          <button className="btn-ghost dp-btn" onClick={() => { onChange(null, null); onClose(); }}>Clear</button>
          {startDate && endDate && <button className="btn-primary dp-btn" onClick={onClose}>Apply</button>}
        </div>
      </div>
    </div>
  );
}

function generateInsights(songs, periodSongs, customRange) {
  const insights = [];
  if (!periodSongs.length) return insights;
  const hourMap = new Array(24).fill(0);
  periodSongs.forEach(s => { hourMap[new Date(s.last_played_at).getHours()] += s.play_count || 1; });
  const peakHour = hourMap.indexOf(Math.max(...hourMap));
  const peakLabel = peakHour === 0 ? '12 AM' : peakHour < 12 ? `${peakHour} AM` : peakHour === 12 ? '12 PM' : `${peakHour - 12} PM`;
  const timeOfDay = peakHour >= 5 && peakHour < 12 ? 'morning' : peakHour >= 12 && peakHour < 17 ? 'afternoon' : peakHour >= 17 && peakHour < 21 ? 'evening' : 'late night';
  insights.push({ icon: peakHour >= 22 || peakHour < 5 ? '🌙' : peakHour < 12 ? '☀️' : peakHour < 17 ? '🌤️' : '🌆', title: `You're a ${timeOfDay} listener`, sub: `Peak listening around ${peakLabel}` });
  const top = [...periodSongs].sort((a, b) => b.play_count - a.play_count)[0];
  if (top && top.play_count > 1) insights.push({ icon: '🔁', title: 'Most replayed', sub: `"${top.title}" — played ${top.play_count}× in this period` });
  if (!customRange) {
    const daySet = new Set(songs.map(s => getDayKey(s.last_played_at)));
    let streak = 0;
    for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (daySet.has(getDayKey(d))) streak++; else break; }
    if (streak > 0) insights.push({ icon: '🔥', title: `${streak}-day listening streak`, sub: streak >= 7 ? 'Over a week straight!' : 'Keep it up!' });
  }
  const dowMap = new Array(7).fill(0);
  periodSongs.forEach(s => { dowMap[new Date(s.last_played_at).getDay()] += s.play_count || 1; });
  const topDay = dowMap.indexOf(Math.max(...dowMap));
  insights.push({ icon: '📅', title: `${DAY_FULL[topDay]}s are your favourite`, sub: `Most plays happen on ${DAY_FULL[topDay]}s` });
  if (!customRange && songs.length > 10) {
    const thisWeek = songs.filter(s => new Date(s.last_played_at).getTime() >= Date.now() - 7*86400000).reduce((a,s) => a+(s.play_count||1),0);
    const lastWeek = songs.filter(s => { const t=new Date(s.last_played_at).getTime(); return t>=Date.now()-14*86400000&&t<Date.now()-7*86400000; }).reduce((a,s)=>a+(s.play_count||1),0);
    if (lastWeek > 0 && thisWeek !== lastWeek) {
      const pct = Math.round(Math.abs(thisWeek-lastWeek)/lastWeek*100);
      insights.push({ icon: thisWeek>lastWeek?'📈':'📉', title: thisWeek>lastWeek?'Listening more this week':'Quieter week', sub: `${pct}% ${thisWeek>lastWeek?'more':'fewer'} plays vs last week` });
    }
  }
  return insights.slice(0, 4);
}

// ─── Timeline: Journal View ───────────────────────────────────────────
function JournalView({ songs, onSongClick }) {
  const grouped = useMemo(() => {
    const map = {};
    [...songs].sort((a,b) => new Date(b.last_played_at)-new Date(a.last_played_at)).forEach(s => {
      const key = getDayKey(s.last_played_at);
      if (!map[key]) map[key] = { label: formatDateFull(s.last_played_at), songs: [] };
      map[key].songs.push(s);
    });
    return Object.values(map);
  }, [songs]);

  if (!grouped.length) return <Empty icon="📖" title="No history yet" sub="Your listening journal will appear here" />;

  return (
    <div className="journal">
      {grouped.map((group, gi) => (
        <div key={gi} className="journal-group">
          <div className="journal-date">{group.label}</div>
          <div className="journal-songs">
            {group.songs.map((s, si) => (
              <div key={si} className="journal-row" onClick={() => onSongClick(s)}>
                <span className="journal-time">{formatTime(s.last_played_at)}</span>
                <span className="journal-emoji">{GENRE_EMOJIS[s.genre] || '🎵'}</span>
                <div className="journal-info">
                  <span className="journal-title">{s.title}</span>
                  <span className="journal-meta">{s.channel?.replace(' - Topic','') || 'Unknown'}</span>
                </div>
                <span className="journal-plays">{s.play_count}×</span>
                <span className="journal-journey-hint">View journey →</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Timeline: Activity Heatmap ───────────────────────────────────────
function ActivityView({ songs }) {
  const [selectedDay, setSelectedDay] = useState(null);

  const { cells, maxCount, months } = useMemo(() => {
    const dayMap = {};
    songs.forEach(s => {
      const key = getDayKey(s.last_played_at);
      dayMap[key] = (dayMap[key] || 0) + (s.play_count || 1);
    });
    const end = new Date();
    const start = new Date(); start.setDate(start.getDate() - 364);
    // align to Sunday
    while (start.getDay() !== 0) start.setDate(start.getDate() - 1);
    const cells = [];
    const months = [];
    let lastMonth = -1;
    const cur = new Date(start);
    while (cur <= end) {
      const key = getDayKey(cur);
      const m = cur.getMonth();
      if (m !== lastMonth) { months.push({ label: MONTH_NAMES[m], col: Math.floor(cells.length / 7) }); lastMonth = m; }
      cells.push({ key, date: new Date(cur), count: dayMap[key] || 0 });
      cur.setDate(cur.getDate() + 1);
    }
    const maxCount = Math.max(...cells.map(c => c.count), 1);
    return { cells, maxCount, months };
  }, [songs]);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const selectedSongs = selectedDay
    ? songs.filter(s => getDayKey(s.last_played_at) === selectedDay.key).sort((a,b) => b.play_count - a.play_count)
    : [];

  const getColor = (count) => {
    if (count === 0) return 'rgba(255,255,255,0.04)';
    const intensity = Math.min(count / maxCount, 1);
    const alpha = 0.15 + intensity * 0.85;
    return `rgba(232,74,58,${alpha.toFixed(2)})`;
  };

  return (
    <div className="activity-view">
      <div className="activity-heatmap-wrap">
        <div className="activity-months">
          {months.map((m, i) => <span key={i} className="activity-month-label" style={{ gridColumn: m.col + 1 }}>{m.label}</span>)}
        </div>
        <div className="activity-grid">
          <div className="activity-day-labels">
            {['S','M','T','W','T','F','S'].map((d,i) => <span key={i} className="activity-day-label">{i%2===1?d:''}</span>)}
          </div>
          <div className="activity-weeks">
            {weeks.map((week, wi) => (
              <div key={wi} className="activity-week">
                {week.map((cell, di) => (
                  <div key={di} className={`activity-cell ${selectedDay?.key === cell.key ? 'selected' : ''}`}
                    style={{ background: getColor(cell.count) }}
                    title={`${formatDate(cell.date)}: ${cell.count} plays`}
                    onClick={() => setSelectedDay(selectedDay?.key === cell.key ? null : cell)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="activity-legend">
          <span className="activity-legend-label">Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => <div key={i} className="activity-legend-cell" style={{ background: getColor(v * maxCount) }} />)}
          <span className="activity-legend-label">More</span>
        </div>
      </div>

      {selectedDay && (
        <div className="activity-detail animate-in">
          <div className="activity-detail-header">
            <span className="activity-detail-date">{formatDate(selectedDay.date)}</span>
            <span className="activity-detail-count">{selectedDay.count} plays</span>
          </div>
          {selectedSongs.length === 0
            ? <p className="activity-detail-empty">No songs tracked this day</p>
            : selectedSongs.map((s, i) => (
              <div key={i} className="activity-detail-row">
                <span className="activity-detail-emoji">{GENRE_EMOJIS[s.genre] || '🎵'}</span>
                <div className="activity-detail-info">
                  <span className="activity-detail-title">{s.title}</span>
                  <span className="activity-detail-meta">{s.channel?.replace(' - Topic','') || 'Unknown'}</span>
                </div>
                <span className="activity-detail-plays">{s.play_count}×</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Timeline: Song Journey ───────────────────────────────────────────
function JourneyView({ songs, initialSong, onClear }) {
  const [query, setQuery] = useState(initialSong?.title || '');
  const [selected, setSelected] = useState(initialSong || null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (!query.trim() || selected) return [];
    const q = query.toLowerCase();
    const seen = new Set();
    return songs.filter(s => {
      if (seen.has(s.video_id)) return false;
      seen.add(s.video_id);
      return s.title.toLowerCase().includes(q) || (s.channel||'').toLowerCase().includes(q);
    }).slice(0, 6);
  }, [query, songs, selected]);

  const journeyData = useMemo(() => {
    if (!selected) return [];
    return songs
      .filter(s => s.video_id === selected.video_id)
      .sort((a,b) => new Date(a.last_played_at) - new Date(b.last_played_at));
  }, [selected, songs]);

  const handleSelect = (song) => { setSelected(song); setQuery(song.title); setShowSuggestions(false); };
  const handleClear = () => { setSelected(null); setQuery(''); onClear?.(); };

  return (
    <div className="journey-view">
      <div className="journey-search-wrap">
        <div className="journey-search">
          <svg className="search-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M11.4 10l3.3 3.3-1.4 1.4L10 11.4A6 6 0 112 8a6 6 0 019.4 2zm-1.4.7A4.5 4.5 0 108 12.5a4.5 4.5 0 001.9-.4l.1-.4z"/></svg>
          <input className="search-input journey-input" type="text" placeholder="Search for a song..." value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)} />
          {query && <button className="journey-clear-btn" onClick={handleClear}>✕</button>}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="journey-suggestions">
            {suggestions.map((s,i) => (
              <div key={i} className="journey-suggestion" onClick={() => handleSelect(s)}>
                <span>{GENRE_EMOJIS[s.genre]||'🎵'}</span>
                <div>
                  <div className="journey-suggestion-title">{s.title}</div>
                  <div className="journey-suggestion-meta">{s.channel?.replace(' - Topic','')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!selected && (
        <Empty icon="🎵" title="Pick a song" sub="Search above or click 'View journey' on any song in the Journal" />
      )}

      {selected && journeyData.length > 0 && (
        <div className="journey-content animate-in">
          <div className="journey-header">
            <div className="journey-song-info">
              <span className="journey-song-emoji">{GENRE_EMOJIS[selected.genre]||'🎵'}</span>
              <div>
                <div className="journey-song-title">{selected.title}</div>
                <div className="journey-song-meta">{selected.channel?.replace(' - Topic','')} · {selected.genre}</div>
              </div>
            </div>
            <div className="journey-stats">
              <div className="journey-stat"><span className="journey-stat-val">{journeyData.reduce((a,s)=>a+(s.play_count||1),0)}</span><span className="journey-stat-label">total plays</span></div>
              <div className="journey-stat"><span className="journey-stat-val">{Math.round((new Date(journeyData[journeyData.length-1].last_played_at) - new Date(journeyData[0].last_played_at)) / 86400000) || 1}</span><span className="journey-stat-label">days tracked</span></div>
            </div>
          </div>

          <div className="journey-timeline">
            {journeyData.map((entry, i) => (
              <div key={i} className="journey-entry">
                <div className="journey-entry-line">
                  <div className="journey-entry-dot" style={{ background: i === 0 ? '#e84a3a' : i === journeyData.length-1 ? '#5cb85c' : 'var(--bg4)', border: '2px solid var(--border2)' }} />
                  {i < journeyData.length - 1 && <div className="journey-entry-connector" />}
                </div>
                <div className="journey-entry-content">
                  <div className="journey-entry-date">{formatDateFull(entry.last_played_at)}</div>
                  <div className="journey-entry-time">{formatTime(entry.last_played_at)}</div>
                  <div className="journey-entry-plays">{entry.play_count} {entry.play_count === 1 ? 'play' : 'plays'}</div>
                  {i === 0 && <span className="journey-badge first">First listen 🎉</span>}
                  {i === journeyData.length-1 && journeyData.length > 1 && <span className="journey-badge last">Most recent</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────
export default function App() {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [tab, setTab] = useState('history');
  const [timelineTab, setTimelineTab] = useState('journal');
  const [periodIdx, setPeriodIdx] = useState(0);
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [extActive, setExtActive] = useState(false);
  const [toast, setToast] = useState(null);
  const [newPlName, setNewPlName] = useState('');
  const [showPlInput, setShowPlInput] = useState(false);
  const [expandedSong, setExpandedSong] = useState(null);
  const [journeySong, setJourneySong] = useState(null);
  const pickerRef = useRef(null);

  const isCustom = customStart && customEnd;
  const period = PERIODS[periodIdx];

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);
  const fetchSongs = useCallback(async () => {
    const { data, error } = await supabase.from('songs').select('*').order('last_played_at', { ascending: false });
    if (!error && data) setSongs(data);
  }, []);
  const fetchPlaylists = useCallback(async () => {
    const { data, error } = await supabase.from('playlists').select('*, playlist_songs(song_id)').order('created_at', { ascending: false });
    if (!error && data) setPlaylists(data);
  }, []);

  useEffect(() => {
    Promise.all([fetchSongs(), fetchPlaylists()]).finally(() => setLoading(false));
    const channel = supabase.channel('songs-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, () => { fetchSongs(); setExtActive(true); })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchSongs, fetchPlaylists]);

  useEffect(() => {
    const handleClick = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const periodSongs = useMemo(() => {
    if (isCustom) return filterByRange(songs, customStart, customEnd);
    if (!period.days) return songs;
    const cutoff = Date.now() - period.days * 86400000;
    return songs.filter(s => new Date(s.last_played_at).getTime() >= cutoff);
  }, [songs, period, customStart, customEnd, isCustom]);

  const filteredSongs = useMemo(() => periodSongs.filter(s => {
    const q = search.toLowerCase();
    return !q || s.title.toLowerCase().includes(q) || (s.channel||'').toLowerCase().includes(q) || (s.genre||'').toLowerCase().includes(q);
  }), [periodSongs, search]);

  const favSongs = useMemo(() => periodSongs.filter(s => s.is_favorite), [periodSongs]);
  const todayCount = useMemo(() => songs.filter(s => new Date(s.last_played_at).toDateString() === new Date().toDateString()).length, [songs]);
  const totalPlays = useMemo(() => periodSongs.reduce((a, s) => a + (s.play_count || 0), 0), [periodSongs]);
  const insights = useMemo(() => generateInsights(songs, periodSongs, isCustom), [songs, periodSongs, isCustom]);
  const topSongs = useMemo(() => [...periodSongs].sort((a,b) => b.play_count - a.play_count).slice(0,5), [periodSongs]);
  const maxPlays = topSongs[0]?.play_count || 1;
  const genreMap = useMemo(() => { const m={}; periodSongs.forEach(s=>{if(s.genre)m[s.genre]=(m[s.genre]||0)+1;}); return m; }, [periodSongs]);
  const genreEntries = Object.entries(genreMap).sort((a,b)=>b[1]-a[1]);
  const totalGenre = genreEntries.reduce((a,b)=>a+b[1],0)||1;
  const hourMap = useMemo(() => { const h=new Array(24).fill(0); periodSongs.forEach(s=>{h[new Date(s.last_played_at).getHours()]+=s.play_count||1;}); return h; }, [periodSongs]);
  const maxHour = Math.max(...hourMap)||1;
  const last7Days = useMemo(() => { const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return{key:getDayKey(d),label:DAY_NAMES[d.getDay()],count:0};}); songs.forEach(s=>{const day=days.find(d=>d.key===getDayKey(s.last_played_at));if(day)day.count+=s.play_count||1;}); return days; }, [songs]);
  const max7 = Math.max(...last7Days.map(d=>d.count))||1;
  const last4Weeks = useMemo(() => { const weeks=Array.from({length:4},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(3-i)*7);return{key:getWeekKey(d),label:`W${4-(3-i)}`,count:0};}); songs.forEach(s=>{const week=weeks.find(w=>w.key===getWeekKey(s.last_played_at));if(week)week.count+=s.play_count||1;}); return weeks; }, [songs]);
  const max4w = Math.max(...last4Weeks.map(w=>w.count))||1;
  const dowMap = useMemo(() => { const d=new Array(7).fill(0); periodSongs.forEach(s=>{d[new Date(s.last_played_at).getDay()]+=s.play_count||1;}); return d; }, [periodSongs]);
  const maxDow = Math.max(...dowMap)||1;
  const mostActiveDay = dowMap.indexOf(Math.max(...dowMap));
  const totalMins = totalPlays*3.5, listeningHours=Math.floor(totalMins/60), listeningMins=Math.round(totalMins%60);
  const daySet = new Set(songs.map(s=>getDayKey(s.last_played_at)));
  let streak=0; for(let i=0;i<365;i++){const d=new Date();d.setDate(d.getDate()-i);if(daySet.has(getDayKey(d)))streak++;else break;}
  const channelMap = useMemo(() => { const m={}; periodSongs.forEach(s=>{const ch=(s.channel||'Unknown').replace(' - Topic','');m[ch]=(m[ch]||0)+(s.play_count||1);}); return m; }, [periodSongs]);
  const topChannels = Object.entries(channelMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxChannel = topChannels[0]?.[1]||1;

  const toggleFav = async (song) => {
    const { error } = await supabase.from('songs').update({ is_favorite: !song.is_favorite }).eq('id', song.id);
    if (!error) { setSongs(prev=>prev.map(s=>s.id===song.id?{...s,is_favorite:!s.is_favorite}:s)); showToast(song.is_favorite?'Removed from favorites':'Added to favorites ♥'); }
  };
  const createPlaylist = async () => {
    if (!newPlName.trim()) return;
    const icons=['🔥','🌙','🌊','⚡','🎯','🌿','💫','🎸'];
    const { error } = await supabase.from('playlists').insert({ name: newPlName.trim(), icon: icons[playlists.length%icons.length] });
    if (!error) { fetchPlaylists(); setNewPlName(''); setShowPlInput(false); showToast('Playlist created!'); }
  };
  const handlePeriodChip = (i) => { setPeriodIdx(i); setCustomStart(null); setCustomEnd(null); setShowPicker(false); };
  const handleDateChange = (start, end) => { setCustomStart(start); setCustomEnd(end); if(start&&end) setPeriodIdx(-1); };
  const customLabel = isCustom ? `${formatDate(new Date(customStart))} → ${formatDate(new Date(customEnd))}` : 'Custom range';

  const handleJournalSongClick = (song) => { setJourneySong(song); setTimelineTab('journey'); };

  if (loading) return (
    <div className="loader">
      <div className="loader-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg></div>
      <p>Loading your music...</p>
    </div>
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm-2 11V7l6 3-6 3z"/></svg></div>
          <span className="logo-text">yt<strong>track</strong></span>
        </div>
        <nav className="sidebar-nav">
          {[{id:'history',label:'History',icon:'◷'},{id:'favorites',label:'Favorites',icon:'♥'},{id:'playlists',label:'Playlists',icon:'⊞'},{id:'stats',label:'Stats',icon:'∿'},{id:'timeline',label:'Timeline',icon:'⏱'}].map(t=>(
            <button key={t.id} className={`nav-item ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
              <span className="nav-icon">{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className={`ext-status ${extActive?'on':'off'}`}><span className="ext-dot"/><span>{extActive?'Extension active':'Extension offline'}</span></div>
        </div>
      </aside>

      <main className="main">
        <div className="global-filter">
          <span className="global-filter-label">Showing:</span>
          <div className="period-chips">
            {PERIODS.map((p,i)=>(<button key={p.label} className={`period-chip ${periodIdx===i&&!isCustom?'active':''}`} onClick={()=>handlePeriodChip(i)}>{p.label}</button>))}
          </div>
          <div className="custom-range-wrap" ref={pickerRef}>
            <button className={`period-chip custom-chip ${isCustom?'active':''}`} onClick={()=>setShowPicker(v=>!v)}>📅 {customLabel}</button>
            {showPicker && <div className="picker-popup"><DateRangePicker startDate={customStart} endDate={customEnd} onChange={handleDateChange} onClose={()=>setShowPicker(false)}/></div>}
          </div>
        </div>

        <div className="stats-bar">
          {[{label:'Unique songs',val:periodSongs.length},{label:'Total plays',val:totalPlays},{label:'Played today',val:todayCount},{label:'Favorites',val:favSongs.length},{label:'Playlists',val:playlists.length}].map(s=>(
            <div className="stat-pill" key={s.label}><span className="stat-val">{s.val}</span><span className="stat-label">{s.label}</span></div>
          ))}
        </div>

        {insights.length>0&&(
          <div className="insights-row">
            {insights.map((ins,i)=>(<div className="insight-card" key={i}><span className="insight-icon">{ins.icon}</span><div className="insight-text"><div className="insight-title">{ins.title}</div><div className="insight-sub">{ins.sub}</div></div></div>))}
          </div>
        )}

        {tab==='history'&&(
          <div className="section animate-in">
            <div className="section-header">
              <h1>History</h1>
              <div className="search-wrap">
                <svg className="search-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M11.4 10l3.3 3.3-1.4 1.4L10 11.4A6 6 0 112 8a6 6 0 019.4 2zm-1.4.7A4.5 4.5 0 108 12.5a4.5 4.5 0 001.9-.4l.1-.4z"/></svg>
                <input className="search-input" type="text" placeholder="Search songs, artists, genres..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
            </div>
            {filteredSongs.length===0?<Empty icon="🎵" title="No songs" sub={songs.length?'No songs found for this period':'Install the extension to start tracking'}/>
            :<SongList songs={filteredSongs} onFav={toggleFav} expandedSong={expandedSong} setExpandedSong={setExpandedSong}/>}
          </div>
        )}

        {tab==='favorites'&&(
          <div className="section animate-in">
            <div className="section-header"><h1>Favorites</h1></div>
            {favSongs.length===0?<Empty icon="♥" title="No favorites" sub="No favorited songs in this period"/>
            :<SongList songs={favSongs} onFav={toggleFav} expandedSong={expandedSong} setExpandedSong={setExpandedSong}/>}
          </div>
        )}

        {tab==='playlists'&&(
          <div className="section animate-in">
            <div className="section-header"><h1>Playlists</h1><button className="btn-primary" onClick={()=>setShowPlInput(v=>!v)}>+ New playlist</button></div>
            {showPlInput&&(<div className="pl-input-row"><input className="pl-name-input" type="text" placeholder="Playlist name..." value={newPlName} onChange={e=>setNewPlName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createPlaylist()} autoFocus/><button className="btn-primary" onClick={createPlaylist}>Create</button><button className="btn-ghost" onClick={()=>{setShowPlInput(false);setNewPlName('');}}>Cancel</button></div>)}
            {playlists.length===0?<Empty icon="📂" title="No playlists yet" sub="Create a playlist to organize your tracks"/>
            :<div className="pl-grid">{playlists.map(pl=>(<div className="pl-card" key={pl.id}><div className="pl-icon">{pl.icon}</div><div className="pl-name">{pl.name}</div><div className="pl-count">{(pl.playlist_songs||[]).length} songs</div></div>))}</div>}
          </div>
        )}

        {tab==='stats'&&(
          <div className="section animate-in">
            <div className="section-header"><h1>Stats</h1></div>
            {periodSongs.length===0?<Empty icon="📊" title="No data" sub="No songs tracked in this period"/>:(
              <div className="stats-layout">
                <div className="stats-card wide"><h3 className="card-title">Overview</h3><div className="overview-grid">{[{val:`${listeningHours}h ${listeningMins}m`,label:'Estimated listening time'},{val:`${streak} ${streak===1?'day':'days'}`,label:'Current streak 🔥'},{val:DAY_FULL[mostActiveDay],label:'Most active day'},{val:Math.round(totalPlays/Math.max(daySet.size,1)*10)/10,label:'Avg plays per day'}].map(item=>(<div className="overview-item" key={item.label}><div className="overview-val">{item.val}</div><div className="overview-label">{item.label}</div></div>))}</div></div>
                <div className="stats-card wide"><h3 className="card-title">Last 7 days</h3><div className="bar-chart">{last7Days.map((d,i)=>(<div className="bar-chart-col" key={i}><div className="bar-chart-track"><div className="bar-chart-fill" style={{height:`${Math.round(d.count/max7*100)}%`}}/></div><div className="bar-chart-label">{d.label}</div><div className="bar-chart-val">{d.count||''}</div></div>))}</div></div>
                <div className="stats-card"><h3 className="card-title">Last 4 weeks</h3><div className="bar-chart">{last4Weeks.map((w,i)=>(<div className="bar-chart-col" key={i}><div className="bar-chart-track"><div className="bar-chart-fill" style={{height:`${Math.round(w.count/max4w*100)}%`}}/></div><div className="bar-chart-label">{w.label}</div><div className="bar-chart-val">{w.count||''}</div></div>))}</div></div>
                <div className="stats-card"><h3 className="card-title">Most active day of week</h3><div className="bar-chart">{dowMap.map((val,i)=>(<div className="bar-chart-col" key={i}><div className="bar-chart-track"><div className="bar-chart-fill" style={{height:`${Math.round(val/maxDow*100)}%`,background:i===mostActiveDay?'#e84a3a':'rgba(232,74,58,0.4)'}}/></div><div className="bar-chart-label" style={{color:i===mostActiveDay?'#e84a3a':undefined}}>{DAY_NAMES[i]}</div></div>))}</div></div>
                <div className="stats-card"><h3 className="card-title">Top songs</h3>{topSongs.map(s=>(<div className="bar-row" key={s.id}><span className="bar-label" title={s.title}>{s.title}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.round(s.play_count/maxPlays*100)}%`}}/></div><span className="bar-val">{s.play_count}x</span></div>))}</div>
                <div className="stats-card"><h3 className="card-title">Top artists / channels</h3>{topChannels.map(([ch,count])=>(<div className="bar-row" key={ch}><span className="bar-label" title={ch}>{ch}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.round(count/maxChannel*100)}%`,background:'#3b8ae8'}}/></div><span className="bar-val">{count}x</span></div>))}</div>
                <div className="stats-card"><h3 className="card-title">Genres</h3><div className="genre-list">{genreEntries.map(([g,c])=>(<div className="genre-row" key={g}><span className="genre-dot" style={{background:GENRE_COLORS[g]||'#666'}}/><span className="genre-name">{GENRE_EMOJIS[g]||'🎵'} {g}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.round(c/totalGenre*100)}%`,background:GENRE_COLORS[g]||'#666'}}/></div><span className="bar-val">{Math.round(c/totalGenre*100)}%</span></div>))}</div></div>
                <div className="stats-card wide chord-insights-card"><h3 className="card-title">🎹 Chord Insights <span className="chord-coming-soon">Coming soon</span></h3><div className="chord-insights-placeholder"><div className="chord-insights-row">{[['Most common key','—'],['Most common progression','—'],['Avg BPM','—'],[`Songs with chords`,`0 / ${periodSongs.length}`]].map(([label,val])=>(<div className="chord-insight-item" key={label}><div className="chord-insight-label">{label}</div><div className="chord-insight-val">{val}</div></div>))}</div><p className="chord-insights-sub">Piano chord data will appear here once the feature is enabled.</p></div></div>
                <div className="stats-card wide"><h3 className="card-title">Listening by hour</h3><div className="heatmap">{hourMap.map((h,i)=>{const alpha=h===0?0.05:0.1+(h/maxHour)*0.85;return<div key={i} className="heat-cell" title={`${i}:00 — ${h} plays`} style={{background:`rgba(232,74,58,${alpha.toFixed(2)})`}}/>;})}</div><div className="heat-labels"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div></div>
              </div>
            )}
          </div>
        )}

        {tab==='timeline'&&(
          <div className="section animate-in">
            <div className="section-header"><h1>Timeline</h1></div>
            <div className="timeline-tabs">
              {[{id:'journal',label:'📖 Journal'},{id:'activity',label:'📅 Activity'},{id:'journey',label:'🎵 Song Journey'}].map(t=>(
                <button key={t.id} className={`timeline-tab ${timelineTab===t.id?'active':''}`} onClick={()=>setTimelineTab(t.id)}>{t.label}</button>
              ))}
            </div>
            {timelineTab==='journal'&&<JournalView songs={periodSongs} onSongClick={handleJournalSongClick}/>}
            {timelineTab==='activity'&&<ActivityView songs={songs}/>}
            {timelineTab==='journey'&&<JourneyView songs={songs} initialSong={journeySong} onClear={()=>setJourneySong(null)}/>}
          </div>
        )}
      </main>
      {toast&&<div className="toast animate-in">{toast}</div>}
    </div>
  );
}

function SongList({ songs, onFav, expandedSong, setExpandedSong }) {
  return (
    <div className="song-list">
      {songs.map((s,i)=>(
        <div key={s.id} className="song-card-wrapper" style={{animationDelay:`${i*0.03}s`}}>
          <div className="song-card" onClick={()=>setExpandedSong(expandedSong===s.id?null:s.id)}>
            <div className="song-emoji">{GENRE_EMOJIS[s.genre]||'🎵'}</div>
            <div className="song-info"><div className="song-title">{s.title}</div><div className="song-meta">{s.channel?.replace(' - Topic','')||'Unknown'} · {s.genre||'Music'}</div></div>
            <span className="play-badge">{s.play_count}×</span>
            <span className="song-time">{timeAgo(s.last_played_at)}</span>
            <div className="song-actions" onClick={e=>e.stopPropagation()}>
              <button className={`btn-icon ${s.is_favorite?'fav':''}`} onClick={()=>onFav(s)}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 13.7l-1.1-1C2.9 9.1 1 7.3 1 5.1 1 3.3 2.4 2 4.2 2c1 0 2 .5 2.7 1.2L8 4.4l1.1-1.2C9.8 2.5 10.8 2 11.8 2 13.6 2 15 3.3 15 5.1c0 2.2-1.9 4-5.9 7.6L8 13.7z"/></svg></button>
              <a className="btn-icon" href={s.yt_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 4.5l5 3.5-5 3.5V4.5z"/><path fillRule="evenodd" d="M2 8c0-2.2 0-3.3.4-4.2A4 4 0 014 2.1C4.9 1.7 6 1.7 8 1.7s3.1 0 4 .4a4 4 0 011.6 1.7C14 4.7 14 5.8 14 8s0 3.3-.4 4.2A4 4 0 0112 13.9c-.9.4-2 .4-4 .4s-3.1 0-4-.4a4 4 0 01-1.6-1.7C2 11.3 2 10.2 2 8z" clipRule="evenodd"/></svg></a>
              <span className="expand-icon">{expandedSong===s.id?'▲':'▼'}</span>
            </div>
          </div>
          {expandedSong===s.id&&<ChordPanel chords={s.chords||null}/>}
        </div>
      ))}
    </div>
  );
}

function ChordPanel({ chords }) {
  const hasData = chords && chords.key;
  return (
    <div className="chord-panel">
      <div className="chord-panel-header"><span className="chord-panel-title">🎹 Piano Chords</span>{!hasData&&<span className="chord-coming-soon">Coming soon</span>}</div>
      {hasData?(
        <div className="chord-details">
          <div className="chord-meta-row">{[['Key',chords.key],['Scale',chords.scale],['BPM',chords.bpm]].map(([label,val])=>(<div className="chord-meta-item" key={label}><span className="chord-meta-label">{label}</span><span className="chord-meta-val">{val||'—'}</span></div>))}</div>
          {chords.progression&&(<div className="chord-progression"><span className="chord-meta-label">Progression</span><div className="chord-chips">{chords.progression.map((c,i)=><span key={i} className="chord-chip">{c}</span>)}</div></div>)}
          {chords.notes&&(<div className="chord-notes-grid"><span className="chord-meta-label">Notes per chord</span><div className="chord-notes-list">{Object.entries(chords.notes).map(([chord,notes])=>(<div key={chord} className="chord-note-row"><span className="chord-note-name">{chord}</span><span className="chord-note-vals">{Array.isArray(notes)?notes.join(' · '):notes}</span></div>))}</div></div>)}
        </div>
      ):(
        <div className="chord-placeholder">
          {[['Key','—'],['Scale','—'],['BPM','—'],['Progression','— — — —'],['Notes per chord','— — —']].map(([label,val])=>(<div key={label} className="chord-placeholder-row"><span className="chord-meta-label">{label}</span><span className="chord-placeholder-val">{val}</span></div>))}
        </div>
      )}
    </div>
  );
}

function Empty({ icon, title, sub }) {
  return <div className="empty"><div className="empty-icon">{icon}</div><div className="empty-title">{title}</div><div className="empty-sub">{sub}</div></div>;
}
