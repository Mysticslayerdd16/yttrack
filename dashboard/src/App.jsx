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
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PERIODS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '3 months', days: 90 },
  { label: 'All time', days: null },
];

const quotes=[
  'Music gives colour to the air of the moment. — Karl Lagerfeld',
  'One good thing about music, when it hits you, you feel no pain. — Bob Marley',
  'Music is the shorthand of emotion. — Leo Tolstoy',
  'Without music, life would be a mistake. — Nietzsche',
  'Music is what feelings sound like. — Anonymous',
  'Where words fail, music speaks. — Hans Christian Andersen',
  'Music can change the world because it can change people. — Bono',
  'Music is the wine that fills the cup of silence. — Robert Fripp',
  'A painter paints on canvas. A musician paints on silence. — Leopold Stokowski',
  'Music is the universal language of mankind. — Longfellow',
  'Life without music is a journey without a map. — Anonymous',
  'Music is moonlight in the gloomy night of life. — Jean Paul',
  'He who hears music feels his solitude peopled at once. — Browning',
  'Music begins where words end. — Heinrich Heine',
  'The music is not in the notes, but in the silence between. — Mozart',
  'Music is the art of thinking with sounds. — Jules Combarieu',
  'After silence, that which comes nearest to expressing the inexpressible is music. — Aldous Huxley',
  'Music is the divine way to tell beautiful, poetic things to the heart. — Pablo Casals',
  'Music is an outburst of the soul. — Frederick Delius',
  'Music is the mediator between the spiritual and the sensual life. — Beethoven',
  'To stop the flow of music would be like the stopping of time itself. — Aaron Copland',
  'Music expresses that which cannot be put into words. — Victor Hugo',
  'Music is the arithmetic of sounds as optics is the geometry of light. — Debussy',
  'There is no feeling, except the extremes of fear and grief, that does not find relief in music. — George Eliot',
  'Music melts all the separate parts of our bodies together. — Anais Nin',
  'Music is the literature of the heart. — Alphonse de Lamartine',
  'Without music, life would be a blank to me. — Jane Austen',
  'Music in the soul can be heard by the universe. — Lao Tzu',
  'Music is the strongest form of magic. — Marilyn Manson',
  'One cannot understand music and at the same time remain unmoved by it. — Taruskin',
  'Music is a higher revelation than all wisdom and philosophy. — Beethoven',
  'Music was my refuge. — Maya Angelou',
  'Music is the soundtrack of your life. — Dick Clark',
  'Songs are as sad as the listener. — Jonathan Safran Foer',
  'Music is the only language in which you cannot say a mean or sarcastic thing. — John Erskine',
  'The only truth is music. — Jack Kerouac',
  'Music is perpetual, and only the hearing is intermittent. — Thoreau',
  'Music is love in search of a word. — Sidney Lanier',
  'Music is the silence between the notes. — Claude Debussy',
  'A song will outlive all sermons in the memory. — Henry Giles',
  'Music is essentially useless, as life is. — George Santayana',
  'Music fills the infinite between two souls. — Tagore',
  'Music is the breath of God. — Anonymous',
  'Music speaks what cannot be expressed, soothes the mind and gives it rest. — Anonymous',
  'One day your life will flash before your eyes. Make sure it is worth watching. — Gerard Way',
  'Music is the space between the notes. — Miles Davis',
  'Music, the greatest good that mortals know. — Joseph Addison',
  'My heart, which is so full to overflowing, has often been solaced and refreshed by music. — Luther',
  'Music produces a kind of pleasure which human nature cannot do without. — Confucius',
  'If music be the food of love, play on. — Shakespeare',
  'Music is well said to be the speech of angels. — Thomas Carlyle',
  'Music is a moral law. — Plato',
  'Music is the shortcut to the soul. — Anonymous',
  'The purpose of music is to sober and quiet the mind. — John Cage',
  'Music is the art which is most nigh to tears and memory. — Oscar Wilde',
  'A great song should lift your heart, warm the soul and make you feel good. — Seymour Stein',
  'Music is the pleasure the human soul experiences from counting without realizing it is counting. — Leibniz',
  'Music is feeling, then, not sound. — Wallace Stevens',
  'Music is the shorthand of emotion. — Tolstoy',
  'Nothing separates the generations more than music. — Bob Hope',
  'If you were music, I would listen to you ceaselessly. — Anna Akhmatova',
  'Music washes away from the soul the dust of everyday life. — Berthold Auerbach',
  'In music the passions enjoy themselves. — Nietzsche',
  'There is geometry in the humming of the strings. — Pythagoras',
  'Music is the soundtrack to every good and bad time we will ever have. — Alex Pettyfer',
  'Music is the electrical soil in which the spirit lives. — Beethoven',
  'Where words leave off, music begins. — Heinrich Heine',
  'Music is forever; music should grow and mature. — Paul Simon',
  'The soul of music slumbers in the shell. — Samuel Rogers',
  'Music gives soul to the universe. — Plato',
  'The world is full of poetry. The air is living with its spirit. — James Gates Percival',
  'Music is the closest thing we have to time travel. — Anonymous',
  'If I were not a physicist, I would probably be a musician. — Albert Einstein',
  'Music is the most direct of the arts. — Aaron Copland',
  'It is cruel to let silence have the last word. — Arthur Schnitzler',
  'In music one must think with the heart and feel with the brain. — George Szell',
  'Every deep thinker is more afraid of being understood than of being misunderstood. — Nietzsche',
  'Music is the shorthand of emotion. — Tolstoy',
  'I have my own particular sorrows, loves, delights; and you have yours. — Mark Van Doren',
  'One ought to hear a little music, read a little poetry every day. — Goethe',
  'Music, when soft voices die, vibrates in the memory. — Shelley',
  'There is no truer truth obtainable by man than comes of music. — Browning',
  'Music is life. That is why our hearts have beats. — Cecelia Ahern',
  'Music is the shortcut between two hearts. — Anonymous',
  'Without music, life would be a mistake. — Nietzsche',
  'Music is the only sensual pleasure without vice. — Samuel Johnson',
  'Music is like a dream. One that I cannot hear. — Beethoven',
  'I would rather write 10,000 notes than a single letter. — Mozart',
  'Music is the wine of the gods. — Plato',
  'To play a wrong note is insignificant. To play without passion is inexcusable. — Beethoven',
  'Music is the divine knocking at the door of the human heart. — Anonymous',
  'Music is the pen of the soul. — Anonymous',
  'The notes I handle no better than many pianists. But the pauses between the notes — Schnabel',
  'Great music is that which penetrates the ear with facility and quits the memory with difficulty. — Thomas Beecham',
  'Music is an echo of the invisible world. — Giuseppe Mazzini',
  'I think music in itself is healing. — Billy Joel',
  'My idea is that there is music in the air. — Edward Elgar',
  'Music is the great uniter. — Usher',
  'Music is the tool to express life. — Herbie Hancock',
  'Music does bring people together. — John Denver',
  'Music is the key to the female heart. — Johann G. Seume',
  'Music makes the people come together. — Madonna',
  'Music is the art of the prophets. — Martin Luther',
  'Music raises the quality of life. — Anonymous',
  'Music is the art of real presence. — Anonymous',
  'Music is the refuge of souls ulcerated by happiness. — E.M. Cioran',
  'The manner of giving is worth more than the gift. — Pierre Corneille',
  'Music is a safe kind of high. — Jimi Hendrix',
  'Music is an invisible dance. — Anonymous',
  'There is two kinds of music, the good, and the bad. — Louis Armstrong',
  'Music is the art of prophets and the gift of God. — Luther',
  'Music is the shorthand of emotion. — Tolstoy',
  'Music is love, love is music, music is life, and I love my life. — Anonymous',
  'Music should strike fire from the heart of man. — Beethoven',
  'Music touches us emotionally where words alone cannot. — Johnny Depp',
  'Without music to decorate it, time is just a bunch of boring production deadlines. — Zappa',
  'Music is the mother tongue of the universe. — Anonymous',
  'The earth has music for those who listen. — George Santayana',
  'I think I should have no other mortal wants, if I could always have plenty of music. — George Eliot',
  'Beethoven tells you what it is like to be Beethoven. — Victor Borge',
  'Music: the one incorporeal entrance into the higher world of knowledge. — Beethoven',
  'Music is my religion. — Jimi Hendrix',
  'Jazz is not just music, it is life. — Anonymous',
  'To listen is an effort, and just to hear is no merit. — Igor Stravinsky',
  'Music is essentially useless, as life is. — George Santayana',
  'Music is the true universal language. — Carl Maria von Weber',
  'Music is a higher power than any other philosophy. — Beethoven',
  'The job of the artist is always to deepen the mystery. — Francis Bacon',
  'I am music. — Anonymous',
  'Music is a piece of art that goes in the ears straight to the heart. — Anonymous',
  'Music is forever. — Paul Simon',
  'Music is the language spoken by angels. — Longfellow',
  'Songs can move mountains. — Anonymous',
  'Music gives wings to the mind. — Plato',
  'Every song is like a painting. — Dick Dale',
  'Music is the beat of my heart. — Anonymous',
  'A tune is more lasting than the song of birds. — Irish Proverb',
  'Music is the food of love. — Anonymous',
  'Where music dwells, lingering, and wandering on as loth to die. — Wordsworth',
  'Music is the voice of the universe. — Anonymous',
  'A song will always find its way to the soul. — Anonymous',
  'Let the music play. — Anonymous',
  'Music defines who we are. — Anonymous',
  'The rhythm of the body, the melody of the mind, the harmony of the soul. — B.K.S. Iyengar',
  'Music is the thread that connects all humanity. — Anonymous',
  'Music is that which makes sense of life. — Anonymous',
  'The music kept me going. — Anonymous',
  'In the beginning was the Word, and the Word was music. — Anonymous',
  'Music is the healing force of the universe. — Albert Ayler',
  'Music is the shorthand of emotion. — Tolstoy',
  'All music is beautiful. — Billy Strayhorn',
  'Music, once admitted to the soul, becomes a sort of spirit. — Bulwer Lytton',
  'Life seems to go on without effort when I am filled with music. — George Eliot',
  'Music exalts each joy, allays each grief. — John Armstrong',
  'Music is a higher revelation than philosophy. — Beethoven',
  'Music is the literature of the heart. — Lamartine',
  'Music is the shorthand of emotion. — Tolstoy',
  'Without music, life would be an error. — Nietzsche',
  'Music gives a soul to the universe, wings to the mind. — Plato',
  'If music be the food of love, play on, give me excess of it. — Shakespeare',
  'Music is the art of musing. — Anonymous',
  'Music is the arithmetic of sounds. — Debussy',
  'Music is life, and like life, it is relentless. — Anonymous',
  'Music is the story of the heart told without words. — Anonymous',
  'When words fail, music speaks. — Shakespeare',
  'Music is the prayer the heart sings. — Anonymous',
  'The heart of melody can never be put down on paper. — Pablo Casals',
  'Music is the silence between the notes. — Debussy',
  'Every artist dips his brush in his own soul. — Henry Ward Beecher',
  'Music is the mirror of the soul. — Anonymous',
  'A melody is not merely something you can hum. — Aaron Copland',
  'Music is the shortcut between two souls. — Anonymous',
  'Music is what happens when you stop talking. — Anonymous',
  'I need music like I need oxygen. — Anonymous',
  'A good song is like a good friend. — Anonymous',
  'Music is an invisible thread that binds us all. — Anonymous',
  'To live is to listen to music. — Anonymous',
  'Music is the only art that lives in time. — Anonymous',
  'Music is the medicine of the mind. — John Logan',
  'Music is the poetry of the air. — Richter',
  'The pause is as important as the note. — Truman Fisher',
  'Music is power. — Anonymous',
  'Every note matters. — Anonymous',
  'Music heals what medicine cannot. — Anonymous',
  'A melody remembered is a moment preserved. — Anonymous',
  'Music is the great consoler. — Anonymous',
  'Rhythm is the heartbeat of music. — Anonymous',
  'The sweetest music is not in the oratorio. — Emerson',
  'Music is a necessary function of man. — Zoltan Kodaly',
  'Music is the voice that tells us that the human race is greater than it knows. — Napoleon',
  'Music is feeling made audible. — Anonymous',
  'Every song carries the soul of its moment. — Anonymous',
  'A song is the echo of the self. — Anonymous',
  'Music is the memory of the future. — Anonymous',
  'Harmony is the language of the universe. — Anonymous',
  'Music is the shorthand of emotion. — Tolstoy',
  'Some days there is no song. Other days the song is everything. — Anonymous',
  'Music is the companion of the solitary. — Anonymous',
  'Every song is a small miracle. — Anonymous',
  'The right song at the right moment changes everything. — Anonymous',
  'Music is the only art that speaks directly to the soul. — Anonymous',
  'Songs are the autobiography of the heart. — Anonymous',
  'A beautiful song is a gift to the world. — Anonymous',
  'Music is the architecture of silence. — Anonymous',
  'To sing is to pray twice. — St. Augustine',
  'Music is the shadow of God. — Anonymous',
  'A song remembered never dies. — Anonymous',
  'Music is the diary of the soul. — Anonymous',
  'Every melody is a conversation with God. — Anonymous',
  'In every song there is a confession. — Anonymous',
  'The best music is written in the margins of living. — Anonymous',
  'Music is the autobiography of a feeling. — Anonymous',
  'To hear music is to remember what silence forgot. — Anonymous',
  'A good song stays with you like a good friend. — Anonymous',
  'Music is the language that needs no translation. — Anonymous',
  'Songs outlive the ones who sing them. — Anonymous',
  'Music is the cry of the soul made beautiful. — Anonymous',
  'Every song is a small act of courage. — Anonymous',
  'Music remembers what the mind forgets. — Anonymous',
  'The world makes sense when there is music in it. — Anonymous',
  'Music is proof that the soul exists. — Anonymous',
  'A melody is memory given form. — Anonymous',
  'Music is the bridge between what is and what could be. — Anonymous',
  'Every song is someone saying: you are not alone. — Anonymous',
  'Music turns noise into meaning. — Anonymous',
  'To listen well is to love well. — Anonymous',
  'The finest music is the music that moves you without warning. — Anonymous',
  'Music is the gift we give ourselves when words are not enough. — Anonymous',
  'A song is a door the heart walks through. — Anonymous',
  'Music is time made beautiful. — Anonymous',
  'The heart has its own rhythm. Trust it. — Anonymous',
  'Music is the most honest thing a person can make. — Anonymous',
  'A tune heard once is a tune remembered forever. — Anonymous',
  'Music is the country the homesick soul visits. — Anonymous',
  'Every great song was once just a feeling. — Anonymous',
  'Music does not need permission to move you. — Anonymous',
  'The soul that hears music is never truly alone. — Anonymous',
  'A song can say in three minutes what a novel takes three hundred pages to say. — Anonymous',
  'Music is the art of being fully present. — Anonymous',
  'The right song at the wrong time is still the right song. — Anonymous',
  'Music is the longest hug. — Anonymous',
  'Every note played is a small act of faith. — Anonymous',
  'A song heard in the dark shines like a light. — Anonymous',
  'Music is the ink the soul writes with. — Anonymous',
  'The melody remembers what the memory forgets. — Anonymous',
  'Music is the grammar of the ineffable. — Anonymous',
  'Every song is a letter to someone. — Anonymous',
  'Music is the thing that stays. — Anonymous',
  'A great song needs no explanation. — Anonymous',
  'Music is the warmth the cold world forgets to provide. — Anonymous',
  'The song ends. The feeling does not. — Anonymous',
  'Music is the kindest form of truth. — Anonymous',
  'A song is a window in a house with no doors. — Anonymous',
  'Music is the map of where the heart has been. — Anonymous',
  'Every song is a small revolution. — Anonymous',
  'Music is patience made audible. — Anonymous',
  'The right song finds you when you need it most. — Anonymous',
  'A melody is the soul made visible. — Anonymous',
  'Music is the antidote to forgetting. — Anonymous',
  'Songs carry the weight of the days they were born in. — Anonymous',
  'Music is the truest thing I know. — Anonymous',
  'To make music is to make meaning. — Anonymous',
  'A song is a small eternity. — Anonymous',
  'Music is the thread we hold onto. — Anonymous',
  'Every song heard is a life expanded. — Anonymous',
  'The music does not lie. — Anonymous',
  'A song is the architecture of a feeling. — Anonymous',
  'Music is the compass when everything else is fog. — Anonymous',
  'Every song is a gift from the moment it was made. — Anonymous',
  'Music is the conversation we never finished. — Anonymous',
  'A song is proof that time was well spent. — Anonymous',
  'Music is the only place where beauty is never a lie. — Anonymous',
  'Songs are the footprints of the soul. — Anonymous',
  'Every note is a small act of grace. — Anonymous',
  'Music is the echo of the heart. — Anonymous',
  'A song remembered is a moment that will not die. — Anonymous',
  'Music is the silence the world forgot to keep. — Anonymous',
  'Every song is a promise kept. — Anonymous',
  'Music is the one thing that belongs to everyone. — Anonymous',
  'A melody is a thought the mind could not contain. — Anonymous',
  'Music is the only thing that improves with sharing. — Anonymous',
  'Songs are the letters we send to the future. — Anonymous',
  'Every song is an act of love. — Anonymous',
  'Music is the kindest language. — Anonymous',
  'A song played loud enough becomes a prayer. — Anonymous',
  'Music is where the soul goes when the body is tired. — Anonymous',
  'Every melody is a world worth visiting. — Anonymous',
  'Music is the friend that never leaves. — Anonymous',
  'A song is the closest thing to telepathy. — Anonymous',
  'Music is the hand the sad take hold of. — Anonymous',
  'Every song carries a fragment of its maker. — Anonymous',
  'Music is the place where time stands still. — Anonymous',
  'A good melody is worth more than a thousand words. — Anonymous',
  'Music is the thing that makes silence bearable. — Anonymous',
  'Songs are the soul\'s autobiography. — Anonymous',
  'Every note is a small act of hope. — Anonymous',
  'Music is the reason the heart beats in rhythm. — Anonymous',
  'A song is a life compressed into minutes. — Anonymous',
  'Music is the compass the lost carry. — Anonymous',
  'Every melody is a story without words. — Anonymous',
  'Music is the art of feeling alive. — Anonymous',
  'A song well loved becomes part of the self. — Anonymous',
  'Music is the current that runs beneath ordinary days. — Anonymous',
  'Every song is a small monument to being human. — Anonymous',
  'Music is the simplest form of honesty. — Anonymous',
  'A melody holds what memory loses. — Anonymous',
  'Music is the sound of the world thinking. — Anonymous',
  'Every song is a quiet revolution. — Anonymous',
  'Music is the proof that beauty is not accidental. — Anonymous',
  'A song heard at the right moment is a miracle. — Anonymous',
  'Music is the space where the hurt goes to heal. — Anonymous',
  'Every melody is a conversation the soul is having with itself. — Anonymous',
  'Music is the longest memory. — Anonymous',
  'A good song needs no occasion. — Anonymous',
  'Music is the art of the present moment. — Anonymous',
  'Every note is a world entire. — Anonymous',
  'Music is the closest the human animal gets to grace. — Anonymous',
  'A song is the last refuge of the inexpressible. — Anonymous',
  'Music is the thing that makes you feel less alone in the universe. — Anonymous',
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
  return `${h % 12 || 12}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'pm' : 'am'}`;
}
function getDayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function getWeekKey(ts) {
  const d = new Date(ts);
  const soy = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - soy) / 86400000 + soy.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}
function isToday(ts) { return new Date(ts).toDateString() === new Date().toDateString(); }
function isThisWeek(ts) { return Date.now() - new Date(ts).getTime() < 604800000; }
function formatDate(d) { return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`; }
function sameDay(a, b) { return a.getDate()===b.getDate()&&a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear(); }

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
  const isToday2 = (d) => d && sameDay(d, new Date());
  const handleDay = (d) => {
    if (!d) return;
    if (picking === 'start' || (startDate && endDate)) onChange(d, null);
    else { const s = new Date(startDate); if (d < s) onChange(d, s); else onChange(new Date(startDate), d); }
  };
  return (
    <div className="date-picker">
      <div className="dp-header">
        <button className="dp-nav" onClick={() => setViewDate(new Date(year, month-1, 1))}>‹</button>
        <span className="dp-month">{MONTH_NAMES[month]} {year}</span>
        <button className="dp-nav" onClick={() => setViewDate(new Date(year, month+1, 1))}>›</button>
      </div>
      <div className="dp-grid">
        {DAY_NAMES.map(d => <div key={d} className="dp-day-name">{d[0]}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={['dp-cell', d?'dp-cell-active':'', isStart(d)?'dp-start':'', isEnd(d)?'dp-end':'', isInRange(d)?'dp-in-range':'', isToday2(d)?'dp-today':''].join(' ')}
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
  insights.push({ icon: peakHour >= 22 || peakHour < 5 ? '🌙' : peakHour < 12 ? '☀️' : peakHour < 17 ? '🌤️' : '🌆', title: `You\'re a ${timeOfDay} listener`, sub: `Peak listening around ${peakLabel}` });
  const top = [...periodSongs].sort((a, b) => b.play_count - a.play_count)[0];
  if (top && top.play_count > 1) insights.push({ icon: '🔁', title: 'Most replayed', sub: `"${top.title}" — played ${top.play_count}× in this period` });
  if (!customRange) {
    const daySet = new Set(songs.map(s => getDayKey(s.last_played_at)));
    let streak = 0;
    for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(d.getDate()-i); if (daySet.has(getDayKey(d))) streak++; else break; }
    if (streak > 0) insights.push({ icon: '🔥', title: `${streak}-day listening streak`, sub: streak >= 7 ? 'Over a week straight!' : 'Keep it up!' });
  }
  const dowMap = new Array(7).fill(0);
  periodSongs.forEach(s => { dowMap[new Date(s.last_played_at).getDay()] += s.play_count || 1; });
  const topDay = dowMap.indexOf(Math.max(...dowMap));
  insights.push({ icon: '📅', title: `${DAY_FULL[topDay]}s are your favourite`, sub: `Most plays happen on ${DAY_FULL[topDay]}s` });
  if (!customRange && songs.length > 10) {
    const thisWeek = songs.filter(s => new Date(s.last_played_at).getTime() >= Date.now()-7*86400000).reduce((a,s)=>a+(s.play_count||1),0);
    const lastWeek = songs.filter(s=>{const t=new Date(s.last_played_at).getTime();return t>=Date.now()-14*86400000&&t<Date.now()-7*86400000;}).reduce((a,s)=>a+(s.play_count||1),0);
    if (lastWeek > 0 && thisWeek !== lastWeek) {
      const pct = Math.round(Math.abs(thisWeek-lastWeek)/lastWeek*100);
      insights.push({ icon: thisWeek>lastWeek?'📈':'📉', title: thisWeek>lastWeek?'Listening more this week':'Quieter week', sub: `${pct}% ${thisWeek>lastWeek?'more':'fewer'} plays vs last week` });
    }
  }
  return insights.slice(0, 4);
}

// ── Book Journal ──────────────────────────────────────────────────────
function BookJournal({ songs }) {
  const [curPage, setCurPage] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [busy, setBusy] = useState(false);
  const topRef = useRef(null);

  // Group songs by day
  const pages = useMemo(() => {
    const map = {};
    [...songs].sort((a,b) => new Date(b.last_played_at)-new Date(a.last_played_at)).forEach(s => {
      const key = getDayKey(s.last_played_at);
      if (!map[key]) map[key] = { ts: s.last_played_at, songs: [] };
      map[key].songs.push(s);
    });
    return Object.values(map);
  }, [songs]);

  const [underPage, setUnderPage] = useState(1);

  const getQuote = (idx) => quotes[idx % quotes.length];

  const renderPageContent = (idx) => {
    if (idx < 0 || idx >= pages.length) return null;
    const pg = pages[idx];
    const d = new Date(pg.ts);
    return { d, songs: pg.songs, quote: getQuote(idx) };
  };

  const turn = (dir) => {
    if (busy) return;
    const next = curPage + dir;
    if (next < 0 || next >= pages.length) return;
    setBusy(true);

    if (dir === 1) {
      setUnderPage(next);
      setFlipping(true);
      setTimeout(() => {
        setCurPage(next);
        setFlipping(false);
        setTimeout(() => setBusy(false), 50);
      }, 850);
    } else {
      setUnderPage(curPage);
      setFlipping(true);
      setTimeout(() => {
        setCurPage(next);
        setFlipping(false);
        setTimeout(() => setBusy(false), 50);
      }, 0);
      setTimeout(() => {}, 850);
      // backward: pre-flip then unflip
      setFlipping(false);
      setBusy(true);
      const top = topRef.current;
      if (top) {
        top.style.transition = 'none';
        top.style.transform = 'rotateY(-180deg)';
        setUnderPage(next);
        setTimeout(() => {
          top.style.transition = '';
          top.style.transform = '';
          setTimeout(() => { setCurPage(next); setBusy(false); }, 850);
        }, 30);
      }
    }
  };

  if (!pages.length) return <Empty icon="📖" title="No history yet" sub="Your listening journal will appear here" />;

  const cur = renderPageContent(curPage);
  const under = renderPageContent(underPage);

  return (
    <div className="book-scene">
      <div className="book-outer">
        <div className="book-cover"></div>
        <div className="book-spine">
          <div className="book-stitch">
            {[...Array(9)].map((_, i) => i % 2 === 0
              ? <div key={i} className="book-stitch-dot"></div>
              : <div key={i} className="book-stitch-line"></div>
            )}
          </div>
        </div>
        <div className="book-page-edges"></div>
        <div className="book-bookmark"></div>

        <div className="book-pages">
          {/* Under page */}
          {under && (
            <div className="book-page book-page-under">
              <div className="book-margin-line"></div>
              <div className="book-pg-date">{DAY_FULL[under.d.getDay()]}, {under.d.getDate()} {MONTH_FULL[under.d.getMonth()]} {under.d.getFullYear()}</div>
              <hr className="book-pg-rule" />
              <div className="book-pg-quote">"{under.quote}"</div>
              <div className="book-entries">
                {under.songs.map((s, i) => (
                  <div key={i} className="book-entry">
                    <span className="book-entry-time">{formatTime(s.last_played_at)}</span>
                    <span className="book-entry-dot"></span>
                    <span className="book-entry-song">{s.title}</span>
                    <span className="book-entry-plays">{s.play_count}x</span>
                  </div>
                ))}
              </div>
              <div className="book-pg-footer">
                <span className="book-pg-count">{under.songs.length} songs</span>
                <span className="book-pg-num">· {underPage + 1} ·</span>
              </div>
              <div className="book-fold"></div>
            </div>
          )}

          {/* Top page (flips) */}
          {cur && (
            <div className={`book-page book-page-top ${flipping ? 'book-page-flipping' : ''}`} ref={topRef}>
              <div className="book-margin-line"></div>
              <div className="book-pg-date">{DAY_FULL[cur.d.getDay()]}, {cur.d.getDate()} {MONTH_FULL[cur.d.getMonth()]} {cur.d.getFullYear()}</div>
              <hr className="book-pg-rule" />
              <div className="book-pg-quote">"{cur.quote}"</div>
              <div className="book-entries">
                {cur.songs.map((s, i) => (
                  <div key={i} className="book-entry">
                    <span className="book-entry-time">{formatTime(s.last_played_at)}</span>
                    <span className="book-entry-dot"></span>
                    <span className="book-entry-song">{s.title}</span>
                    <span className="book-entry-plays">{s.play_count}x</span>
                  </div>
                ))}
              </div>
              <div className="book-pg-footer">
                <span className="book-pg-count">{cur.songs.length} songs</span>
                <span className="book-pg-num">· {curPage + 1} ·</span>
              </div>
              <div className="book-fold"></div>
            </div>
          )}
        </div>
      </div>

      <div className="book-nav">
        <button className="book-nav-btn" onClick={() => turn(-1)} disabled={curPage === 0}>‹</button>
        <span className="book-nav-info">{curPage + 1} of {pages.length}</span>
        <button className="book-nav-btn" onClick={() => turn(1)} disabled={curPage === pages.length - 1}>›</button>
      </div>
    </div>
  );
}

// ── Timeline: Activity Heatmap ────────────────────────────────────────
function ActivityView({ songs }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const { cells, maxCount, months } = useMemo(() => {
    const dayMap = {};
    songs.forEach(s => { const key = getDayKey(s.last_played_at); dayMap[key] = (dayMap[key]||0)+(s.play_count||1); });
    const end = new Date();
    const start = new Date(); start.setDate(start.getDate()-364);
    while (start.getDay() !== 0) start.setDate(start.getDate()-1);
    const cells = [], months = [];
    let lastMonth = -1;
    const cur = new Date(start);
    while (cur <= end) {
      const key = getDayKey(cur);
      const m = cur.getMonth();
      if (m !== lastMonth) { months.push({ label: MONTH_NAMES[m], col: Math.floor(cells.length/7) }); lastMonth = m; }
      cells.push({ key, date: new Date(cur), count: dayMap[key]||0 });
      cur.setDate(cur.getDate()+1);
    }
    return { cells, maxCount: Math.max(...cells.map(c=>c.count),1), months };
  }, [songs]);
  const weeks = [];
  for (let i = 0; i < cells.length; i+=7) weeks.push(cells.slice(i,i+7));
  const selectedSongs = selectedDay ? songs.filter(s=>getDayKey(s.last_played_at)===selectedDay.key).sort((a,b)=>b.play_count-a.play_count) : [];
  const getColor = (count) => {
    if (count===0) return 'rgba(255,255,255,0.04)';
    return `rgba(108,142,247,${(0.15+Math.min(count/maxCount,1)*0.85).toFixed(2)})`;
  };
  return (
    <div className="activity-view">
      <div className="activity-heatmap-wrap">
        <div className="activity-months">{months.map((m,i)=><span key={i} className="activity-month-label">{m.label}</span>)}</div>
        <div className="activity-grid">
          <div className="activity-day-labels">{['S','M','T','W','T','F','S'].map((d,i)=><span key={i} className="activity-day-label">{i%2===1?d:''}</span>)}</div>
          <div className="activity-weeks">{weeks.map((week,wi)=>(
            <div key={wi} className="activity-week">{week.map((cell,di)=>(
              <div key={di} className={`activity-cell ${selectedDay?.key===cell.key?'selected':''}`}
                style={{background:getColor(cell.count)}} title={`${formatDate(cell.date)}: ${cell.count} plays`}
                onClick={()=>setSelectedDay(selectedDay?.key===cell.key?null:cell)}/>
            ))}</div>
          ))}</div>
        </div>
        <div className="activity-legend">
          <span className="activity-legend-label">Less</span>
          {[0,.25,.5,.75,1].map((v,i)=><div key={i} className="activity-legend-cell" style={{background:getColor(v*maxCount)}}/>)}
          <span className="activity-legend-label">More</span>
        </div>
      </div>
      {selectedDay && (
        <div className="activity-detail animate-in">
          <div className="activity-detail-header">
            <span className="activity-detail-date">{formatDate(selectedDay.date)}</span>
            <span className="activity-detail-count">{selectedDay.count} plays</span>
          </div>
          {selectedSongs.length===0
            ? <p className="activity-detail-empty">No songs tracked this day</p>
            : selectedSongs.map((s,i)=>(
              <div key={i} className="activity-detail-row">
                <span className="activity-detail-emoji">{GENRE_EMOJIS[s.genre]||'🎵'}</span>
                <div className="activity-detail-info">
                  <span className="activity-detail-title">{s.title}</span>
                  <span className="activity-detail-meta">{s.channel?.replace(' - Topic','')||'Unknown'}</span>
                </div>
                <span className="activity-detail-plays">{s.play_count}×</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Song Journey ──────────────────────────────────────────────────────
function JourneyView({ songs, initialSong, onClear }) {
  const [query, setQuery] = useState(initialSong?.title||'');
  const [selected, setSelected] = useState(initialSong||null);
  const [showSug, setShowSug] = useState(false);
  const suggestions = useMemo(() => {
    if (!query.trim()||selected) return [];
    const q = query.toLowerCase(), seen = new Set();
    return songs.filter(s => { if (seen.has(s.video_id)) return false; seen.add(s.video_id); return s.title.toLowerCase().includes(q)||(s.channel||'').toLowerCase().includes(q); }).slice(0,6);
  }, [query, songs, selected]);
  const journeyData = useMemo(() => {
    if (!selected) return [];
    return songs.filter(s=>s.video_id===selected.video_id).sort((a,b)=>new Date(a.last_played_at)-new Date(b.last_played_at));
  }, [selected, songs]);
  const handleSelect = (song) => { setSelected(song); setQuery(song.title); setShowSug(false); };
  const handleClear = () => { setSelected(null); setQuery(''); onClear?.(); };
  return (
    <div className="journey-view">
      <div className="journey-search-wrap">
        <div className="journey-search">
          <svg className="search-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M11.4 10l3.3 3.3-1.4 1.4L10 11.4A6 6 0 112 8a6 6 0 019.4 2zm-1.4.7A4.5 4.5 0 108 12.5a4.5 4.5 0 001.9-.4l.1-.4z"/></svg>
          <input className="search-input journey-input" type="text" placeholder="Search for a song..." value={query}
            onChange={e=>{setQuery(e.target.value);setSelected(null);setShowSug(true);}} onFocus={()=>setShowSug(true)}/>
          {query && <button className="journey-clear-btn" onClick={handleClear}>✕</button>}
        </div>
        {showSug && suggestions.length>0 && (
          <div className="journey-suggestions">
            {suggestions.map((s,i)=>(
              <div key={i} className="journey-suggestion" onClick={()=>handleSelect(s)}>
                <span>{GENRE_EMOJIS[s.genre]||'🎵'}</span>
                <div><div className="journey-suggestion-title">{s.title}</div><div className="journey-suggestion-meta">{s.channel?.replace(' - Topic','')}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>
      {!selected && <Empty icon="🎵" title="Pick a song" sub="Search above or click a song in the Journal to see its journey"/>}
      {selected && journeyData.length>0 && (
        <div className="journey-content animate-in">
          <div className="journey-header">
            <div className="journey-song-info">
              <span className="journey-song-emoji">{GENRE_EMOJIS[selected.genre]||'🎵'}</span>
              <div><div className="journey-song-title">{selected.title}</div><div className="journey-song-meta">{selected.channel?.replace(' - Topic','')} · {selected.genre}</div></div>
            </div>
            <div className="journey-stats">
              <div className="journey-stat"><span className="journey-stat-val">{journeyData.reduce((a,s)=>a+(s.play_count||1),0)}</span><span className="journey-stat-label">total plays</span></div>
              <div className="journey-stat"><span className="journey-stat-val">{Math.round((new Date(journeyData[journeyData.length-1].last_played_at)-new Date(journeyData[0].last_played_at))/86400000)||1}</span><span className="journey-stat-label">days tracked</span></div>
            </div>
          </div>
          <div className="journey-timeline">
            {journeyData.map((entry,i)=>(
              <div key={i} className="journey-entry">
                <div className="journey-entry-line">
                  <div className="journey-entry-dot" style={{background:i===0?'#6c8ef7':i===journeyData.length-1?'#4ade80':'var(--bg4)',border:'2px solid var(--border2)'}}/>
                  {i<journeyData.length-1&&<div className="journey-entry-connector"/>}
                </div>
                <div className="journey-entry-content">
                  <div className="journey-entry-date">{timeAgo(entry.last_played_at)}</div>
                  <div className="journey-entry-time">{formatTime(entry.last_played_at)}</div>
                  <div className="journey-entry-plays">{entry.play_count} {entry.play_count===1?'play':'plays'}</div>
                  {i===0&&<span className="journey-badge first">First listen 🎉</span>}
                  {i===journeyData.length-1&&journeyData.length>1&&<span className="journey-badge last">Most recent</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────
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

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(()=>setToast(null), 2500); }, []);
  const fetchSongs = useCallback(async () => {
    const { data, error } = await supabase.from('songs').select('*').order('last_played_at', { ascending: false });
    if (!error && data) setSongs(data);
  }, []);
  const fetchPlaylists = useCallback(async () => {
    const { data, error } = await supabase.from('playlists').select('*, playlist_songs(song_id)').order('created_at', { ascending: false });
    if (!error && data) setPlaylists(data);
  }, []);

  useEffect(() => {
    Promise.all([fetchSongs(), fetchPlaylists()]).finally(()=>setLoading(false));
    const channel = supabase.channel('songs-live')
      .on('postgres_changes', {event:'*',schema:'public',table:'songs'}, ()=>{fetchSongs();setExtActive(true);})
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

  const favSongs = useMemo(() => periodSongs.filter(s=>s.is_favorite), [periodSongs]);
  const todayCount = useMemo(() => songs.filter(s=>isToday(s.last_played_at)).length, [songs]);
  const totalPlays = useMemo(() => periodSongs.reduce((a,s)=>a+(s.play_count||0),0), [periodSongs]);
  const insights = useMemo(() => generateInsights(songs, periodSongs, isCustom), [songs, periodSongs, isCustom]);
  const topSongs = useMemo(() => [...periodSongs].sort((a,b)=>b.play_count-a.play_count).slice(0,5), [periodSongs]);
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
    const { error } = await supabase.from('songs').update({is_favorite:!song.is_favorite}).eq('id',song.id);
    if (!error) { setSongs(prev=>prev.map(s=>s.id===song.id?{...s,is_favorite:!s.is_favorite}:s)); showToast(song.is_favorite?'Removed from favorites':'Added to favorites ♥'); }
  };
  const createPlaylist = async () => {
    if (!newPlName.trim()) return;
    const icons=['🔥','🌙','🌊','⚡','🎯','🌿','💫','🎸'];
    const {error} = await supabase.from('playlists').insert({name:newPlName.trim(),icon:icons[playlists.length%icons.length]});
    if (!error) { fetchPlaylists(); setNewPlName(''); setShowPlInput(false); showToast('Playlist created!'); }
  };
  const handlePeriodChip = (i) => { setPeriodIdx(i); setCustomStart(null); setCustomEnd(null); setShowPicker(false); };
  const handleDateChange = (start, end) => { setCustomStart(start); setCustomEnd(end); if(start&&end)setPeriodIdx(-1); if(!start&&!end)setPeriodIdx(0); };
  const customLabel = isCustom ? `${formatDate(new Date(customStart))} → ${formatDate(new Date(customEnd))}` : 'Custom range';

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
            {showPicker&&<div className="picker-popup"><DateRangePicker startDate={customStart} endDate={customEnd} onChange={handleDateChange} onClose={()=>setShowPicker(false)}/></div>}
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
                <div className="stats-card"><h3 className="card-title">Most active day of week</h3><div className="bar-chart">{dowMap.map((val,i)=>(<div className="bar-chart-col" key={i}><div className="bar-chart-track"><div className="bar-chart-fill" style={{height:`${Math.round(val/maxDow*100)}%`,background:i===mostActiveDay?'#6c8ef7':'rgba(108,142,247,0.4)'}}/></div><div className="bar-chart-label" style={{color:i===mostActiveDay?'#6c8ef7':undefined}}>{DAY_NAMES[i]}</div></div>))}</div></div>
                <div className="stats-card"><h3 className="card-title">Top songs</h3>{topSongs.map(s=>(<div className="bar-row" key={s.id}><span className="bar-label" title={s.title}>{s.title}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.round(s.play_count/maxPlays*100)}%`}}/></div><span className="bar-val">{s.play_count}x</span></div>))}</div>
                <div className="stats-card"><h3 className="card-title">Top artists / channels</h3>{topChannels.map(([ch,count])=>(<div className="bar-row" key={ch}><span className="bar-label" title={ch}>{ch}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.round(count/maxChannel*100)}%`,background:'#3b8ae8'}}/></div><span className="bar-val">{count}x</span></div>))}</div>
                <div className="stats-card"><h3 className="card-title">Genres</h3><div className="genre-list">{genreEntries.map(([g,c])=>(<div className="genre-row" key={g}><span className="genre-dot" style={{background:GENRE_COLORS[g]||'#666'}}/><span className="genre-name">{GENRE_EMOJIS[g]||'🎵'} {g}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.round(c/totalGenre*100)}%`,background:GENRE_COLORS[g]||'#666'}}/></div><span className="bar-val">{Math.round(c/totalGenre*100)}%</span></div>))}</div></div>
                <div className="stats-card wide chord-insights-card"><h3 className="card-title">🎹 Chord Insights <span className="chord-coming-soon">Coming soon</span></h3><div className="chord-insights-placeholder"><div className="chord-insights-row">{[['Most common key','—'],['Most common progression','—'],['Avg BPM','—'],[`Songs with chords`,`0 / ${periodSongs.length}`]].map(([label,val])=>(<div className="chord-insight-item" key={label}><div className="chord-insight-label">{label}</div><div className="chord-insight-val">{val}</div></div>))}</div><p className="chord-insights-sub">Piano chord data will appear here once the feature is enabled.</p></div></div>
                <div className="stats-card wide"><h3 className="card-title">Listening by hour</h3><div className="heatmap">{hourMap.map((h,i)=>{const alpha=h===0?0.05:0.1+(h/maxHour)*0.85;return<div key={i} className="heat-cell" title={`${i}:00 — ${h} plays`} style={{background:`rgba(108,142,247,${alpha.toFixed(2)})`}}/>;})}</div><div className="heat-labels"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div></div>
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
            {timelineTab==='journal'&&<BookJournal songs={periodSongs}/>}
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
