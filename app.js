// ─── Config ──────────────────────────────────────────────
const CHICAGO   = { lat: 41.85, lon: -87.65 };
const TIMEZONE  = 'America/Chicago';
const REFRESH   = 10 * 60 * 1000; // 10 minutes

let weatherData = null;
let isCelsius   = false;
let animFrame   = null;
let particles   = [];

// ─── Time-of-Day Gradients ────────────────────────────────
const GRADIENTS = [
  { h: [0,  5],  from: '#0a0a2e', to: '#1c1240' },  // deep night
  { h: [5,  7],  from: '#c0392b', to: '#f7971e' },  // sunrise
  { h: [7,  11], from: '#1a6ee1', to: '#87ceeb' },  // morning
  { h: [11, 16], from: '#0369a1', to: '#1a6ee1' },  // afternoon
  { h: [16, 19], from: '#b91c1c', to: '#f97316' },  // sunset
  { h: [19, 22], from: '#1e1b4b', to: '#0a0a2e' },  // evening
  { h: [22, 24], from: '#0a0a2e', to: '#1c1240' },  // night
];

function applyBackground() {
  const h = parseFloat(new Date().toLocaleString('en-US', { timeZone: TIMEZONE, hour: 'numeric', hour12: false }));
  const g = GRADIENTS.find(g => h >= g.h[0] && h < g.h[1]) || GRADIENTS[0];
  document.documentElement.style.setProperty('--bg-from', g.from);
  document.documentElement.style.setProperty('--bg-to',   g.to);
}

// ─── WMO Weather Code Map ─────────────────────────────────
function weatherInfo(code) {
  const map = {
    0:  { label: 'Clear Sky',           icon: '☀️',  cls: 'clear' },
    1:  { label: 'Mainly Clear',        icon: '🌤️', cls: 'clear' },
    2:  { label: 'Partly Cloudy',       icon: '⛅',  cls: 'cloudy' },
    3:  { label: 'Overcast',            icon: '☁️',  cls: 'cloudy' },
    45: { label: 'Foggy',               icon: '🌫️', cls: 'fog'   },
    48: { label: 'Rime Fog',            icon: '🌫️', cls: 'fog'   },
    51: { label: 'Light Drizzle',       icon: '🌦️', cls: 'rain'  },
    53: { label: 'Drizzle',             icon: '🌦️', cls: 'rain'  },
    55: { label: 'Heavy Drizzle',       icon: '🌧️', cls: 'rain'  },
    61: { label: 'Light Rain',          icon: '🌧️', cls: 'rain'  },
    63: { label: 'Rain',                icon: '🌧️', cls: 'rain'  },
    65: { label: 'Heavy Rain',          icon: '🌧️', cls: 'rain'  },
    71: { label: 'Light Snow',          icon: '🌨️', cls: 'snow'  },
    73: { label: 'Snow',                icon: '❄️',  cls: 'snow'  },
    75: { label: 'Heavy Snow',          icon: '❄️',  cls: 'snow'  },
    77: { label: 'Snow Grains',         icon: '🌨️', cls: 'snow'  },
    80: { label: 'Light Showers',       icon: '🌦️', cls: 'rain'  },
    81: { label: 'Showers',             icon: '🌧️', cls: 'rain'  },
    82: { label: 'Heavy Showers',       icon: '⛈️',  cls: 'storm' },
    85: { label: 'Snow Showers',        icon: '🌨️', cls: 'snow'  },
    86: { label: 'Heavy Snow Showers',  icon: '❄️',  cls: 'snow'  },
    95: { label: 'Thunderstorm',        icon: '⛈️',  cls: 'storm' },
    96: { label: 'Thunderstorm + Hail', icon: '⛈️',  cls: 'storm' },
    99: { label: 'Severe Thunderstorm', icon: '⛈️',  cls: 'storm' },
  };
  return map[code] ?? { label: 'Unknown', icon: '🌡️', cls: 'clear' };
}

// ─── Canvas Particle Effects ──────────────────────────────
const canvas = document.getElementById('weatherCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function spawnRain(count) {
  particles = Array.from({ length: count }, () => ({
    x:    Math.random() * canvas.width,
    y:    Math.random() * canvas.height,
    len:  Math.random() * 14 + 8,
    spd:  Math.random() * 10 + 14,
    op:   Math.random() * 0.35 + 0.15,
  }));
}

function spawnSnow(count) {
  particles = Array.from({ length: count }, () => ({
    x:     Math.random() * canvas.width,
    y:     Math.random() * canvas.height,
    r:     Math.random() * 3 + 1,
    spd:   Math.random() * 1.2 + 0.4,
    phase: Math.random() * Math.PI * 2,
    op:    Math.random() * 0.55 + 0.25,
  }));
}

function drawRain() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(180,220,255,1)';
  ctx.lineWidth   = 1;
  particles.forEach(p => {
    ctx.globalAlpha = p.op;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.len * 0.28, p.y + p.len);
    ctx.stroke();
    p.y += p.spd; p.x -= p.spd * 0.28;
    if (p.y > canvas.height || p.x < -30) {
      p.x = Math.random() * (canvas.width + 60); p.y = -p.len;
    }
  });
  ctx.globalAlpha = 1;
  animFrame = requestAnimationFrame(drawRain);
}

function drawSnow() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  particles.forEach(p => {
    p.phase += 0.018;
    p.x += Math.sin(p.phase) * 0.6;
    p.y += p.spd;
    if (p.y > canvas.height) { p.y = -p.r; p.x = Math.random() * canvas.width; }
    ctx.globalAlpha = p.op;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  animFrame = requestAnimationFrame(drawSnow);
}

function startEffect(cls) {
  if (animFrame) cancelAnimationFrame(animFrame);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = [];
  if (cls === 'rain')  { spawnRain(110); drawRain(); }
  if (cls === 'storm') { spawnRain(200); drawRain(); }
  if (cls === 'snow')  { spawnSnow(90);  drawSnow(); }
}

// ─── API ──────────────────────────────────────────────────
async function fetchWeather() {
  const params = new URLSearchParams({
    latitude:         CHICAGO.lat,
    longitude:        CHICAGO.lon,
    current:          'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,precipitation_probability,uv_index,surface_pressure',
    hourly:           'temperature_2m,weather_code,precipitation_probability',
    daily:            'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset',
    temperature_unit: 'fahrenheit',
    wind_speed_unit:  'mph',
    timezone:         TIMEZONE,
    forecast_days:    7,
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────
function toDisplay(fahrenheit) {
  return isCelsius
    ? `${Math.round((fahrenheit - 32) * 5 / 9)}°`
    : `${Math.round(fahrenheit)}°`;
}

function windDir(deg) {
  return ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg / 45) % 8];
}

function uvLabel(uv) {
  if (uv <= 2)  return 'Low';
  if (uv <= 5)  return 'Moderate';
  if (uv <= 7)  return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Get the starting hourly index matching current Chicago hour
function currentHourIdx(hourlyTimes) {
  const chicagoStr  = new Date().toLocaleString('en-US', { timeZone: TIMEZONE });
  const chicagoDate = new Date(chicagoStr);
  const todayStr    = chicagoDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const hour        = chicagoDate.getHours();
  const idx = hourlyTimes.findIndex(t => t.startsWith(todayStr) && parseInt(t.slice(11, 13)) >= hour);
  return idx >= 0 ? idx : 0;
}

// ─── Render ───────────────────────────────────────────────
function render(data) {
  const c    = data.current;
  const info = weatherInfo(c.weather_code);

  // Hero
  document.getElementById('mainIcon').textContent = info.icon;
  document.getElementById('condition').textContent = info.label;
  document.getElementById('temp').textContent      = toDisplay(c.temperature_2m);
  document.getElementById('feelsLike').textContent = `Feels like ${toDisplay(c.apparent_temperature)}`;
  document.getElementById('unitBtn').textContent   = isCelsius ? '°C' : '°F';

  // Stats
  const today = data.daily;
  const stats = [
    { label: '💧 Humidity',    value: `${c.relative_humidity_2m}%`,               sub: 'Relative humidity' },
    { label: '💨 Wind',        value: `${Math.round(c.wind_speed_10m)} mph`,       sub: windDir(c.wind_direction_10m) },
    { label: '☔ Precip',      value: `${c.precipitation_probability}%`,           sub: 'Chance this hour' },
    { label: '🔆 UV Index',    value: uvLabel(c.uv_index),                         sub: `Index ${c.uv_index}` },
    { label: '📈 High / Low',  value: `${toDisplay(today.temperature_2m_max[0])} / ${toDisplay(today.temperature_2m_min[0])}`, sub: 'Today' },
    { label: '🌅 Sunrise',     value: fmtTime(today.sunrise[0]),                   sub: 'Chicago time' },
    { label: '🌇 Sunset',      value: fmtTime(today.sunset[0]),                    sub: 'Chicago time' },
    { label: '🌐 Pressure',    value: `${Math.round(c.surface_pressure)} hPa`,     sub: 'Surface' },
  ];
  document.getElementById('statsGrid').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>
  `).join('');

  // Hourly
  const h    = data.hourly;
  const si   = currentHourIdx(h.time);
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  document.getElementById('hourlyStrip').innerHTML = h.time
    .slice(si, si + 24)
    .map((t, i) => {
      const abs  = si + i;
      const wi   = weatherInfo(h.weather_code[abs]);
      const date = new Date(t);
      const lbl  = i === 0 ? 'Now' : date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      return `
        <div class="hourly-item ${i === 0 ? 'now' : ''}">
          <span class="h-time">${lbl}</span>
          <span class="h-icon">${wi.icon}</span>
          <span class="h-temp">${toDisplay(h.temperature_2m[abs])}</span>
          <span class="h-rain">☔ ${h.precipitation_probability[abs]}%</span>
        </div>`;
    }).join('');

  // 7-Day
  document.getElementById('dailyList').innerHTML = today.time.map((dateStr, i) => {
    const d   = new Date(dateStr + 'T12:00:00');
    const day = i === 0 ? 'Today' : DAYS[d.getDay()];
    const wi  = weatherInfo(today.weather_code[i]);
    const pct = today.precipitation_probability_max[i] ?? 0;
    return `
      <div class="daily-item">
        <span class="d-day">${day}</span>
        <span class="d-icon">${wi.icon}</span>
        <div class="rain-wrap"><div class="rain-bar" style="width:${pct}%"></div></div>
        <span class="d-high">${toDisplay(today.temperature_2m_max[i])}</span>
        <span class="d-low">${toDisplay(today.temperature_2m_min[i])}</span>
      </div>`;
  }).join('');

  // Canvas effect
  startEffect(info.cls);
}

// ─── Clock ────────────────────────────────────────────────
function updateClock() {
  document.getElementById('dateTime').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

// ─── Load ─────────────────────────────────────────────────
async function loadWeather() {
  try {
    const data = await fetchWeather();
    weatherData = data;

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');

    render(data);
    applyBackground();
    if (!radarMap) initRadar();

    document.getElementById('lastUpdated').textContent =
      `Updated ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIMEZONE })} CT`;
  } catch (err) {
    console.error(err);
    document.getElementById('loading').innerHTML = `
      <div style="text-align:center;padding:20px">
        <div style="font-size:2.5rem;margin-bottom:12px">⚠️</div>
        <div style="margin-bottom:16px;color:rgba(255,255,255,0.8)">Couldn't load weather data</div>
        <button onclick="loadWeather()" style="padding:10px 20px;border-radius:12px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;font-family:inherit;font-size:0.9rem;font-weight:600;cursor:pointer;">
          Try Again
        </button>
      </div>`;
  }
}

// ─── Radar Map ───────────────────────────────────────────
let radarMap       = null;
let radarLayers    = [];
let radarFrames    = [];
let radarIdx       = 0;
let radarPlaying   = true;
let radarTimer     = null;
const RADAR_SPEED  = 600; // ms per frame

function initRadar() {
  // Init Leaflet map centred on Chicago
  radarMap = L.map('radarMap', {
    center: [41.85, -87.65],
    zoom: 7,
    zoomControl: true,
    attributionControl: false,
  });

  // Dark base tile layer (CartoDB dark matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(radarMap);

  // Chicago marker
  L.circleMarker([41.85, -87.65], {
    radius: 6,
    color: '#fff',
    fillColor: '#60a5fa',
    fillOpacity: 1,
    weight: 2,
  }).bindTooltip('Chicago', { permanent: false, direction: 'top' }).addTo(radarMap);

  loadRadarFrames();
}

async function loadRadarFrames() {
  try {
    const res  = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    const data = await res.json();

    // Get past radar frames (up to 12) + nowcast if available
    const past     = data.radar.past     ?? [];
    const nowcast  = data.radar.nowcast  ?? [];
    radarFrames    = [...past, ...nowcast].slice(-12);

    // Pre-create all tile layers (hidden)
    // frame.path is already "/v2/radar/TIMESTAMP" — don't prepend extra path segments
    radarLayers = radarFrames.map(frame =>
      L.tileLayer(
        `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/4/1_1.png`,
        { opacity: 0.7, maxZoom: 15, zIndex: 10 }
      )
    );

    // Show latest frame immediately
    radarIdx = radarLayers.length - 1;
    showRadarFrame(radarIdx);
    startRadarLoop();
  } catch (e) {
    console.warn('Radar load failed', e);
    document.getElementById('radarTimestamp').textContent = 'unavailable';
  }
}

function showRadarFrame(idx) {
  // Remove all layers
  radarLayers.forEach(l => { if (radarMap.hasLayer(l)) radarMap.removeLayer(l); });

  // Add current frame
  radarLayers[idx].addTo(radarMap);

  // Update UI
  const ts   = new Date(radarFrames[idx].time * 1000);
  const lbl  = ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIMEZONE });
  document.getElementById('radarFrameLabel').textContent   = lbl;
  document.getElementById('radarTimestamp').textContent    = `as of ${lbl}`;
  document.getElementById('radarProgress').style.width     = `${((idx + 1) / radarLayers.length) * 100}%`;
}

function startRadarLoop() {
  clearInterval(radarTimer);
  radarTimer = setInterval(() => {
    if (!radarPlaying) return;
    radarIdx = (radarIdx + 1) % radarLayers.length;
    showRadarFrame(radarIdx);
  }, RADAR_SPEED);
}

// Play / Pause button
document.getElementById('radarPlayBtn').addEventListener('click', () => {
  radarPlaying = !radarPlaying;
  const icon = document.getElementById('radarPlayIcon');
  if (radarPlaying) {
    // Play icon
    icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  } else {
    // Pause icon
    icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  }
});

// ─── Unit Toggle ──────────────────────────────────────────
document.getElementById('unitBtn').addEventListener('click', () => {
  isCelsius = !isCelsius;
  if (weatherData) render(weatherData);
});

// ─── Init ─────────────────────────────────────────────────
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
updateClock();
setInterval(updateClock, 60_000);
loadWeather();
setInterval(loadWeather, REFRESH);
