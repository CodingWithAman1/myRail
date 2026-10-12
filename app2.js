// ========================================================
// MyRail - Dedicated Live Tracking & Map Engine (app2.js)
// Interactive Leaflet Map + SVG Train Marker + SVG Coaches
// ========================================================

let autoRefreshTimer = null;
let currentTrainNumber = "";
let currentStartDate = "";
let liveMapInstance = null;
let trainMarkerInstance = null;
let routePolylines = [];
let stationMarkers = [];

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const trainFromUrl = urlParams.get("trainNumber");
  const dateFromUrl = urlParams.get("date");

  // Pre-fill date input with today by default
  const dateInput = document.getElementById("startDate");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = dateFromUrl || today;
  }

  const form = document.getElementById("searchForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const tn = document.getElementById("trainNumber").value.trim();
      const dt = document.getElementById("startDate")?.value.trim() || "";
      if (tn) {
        loadLiveTrainStatus(tn, dt);
      }
    });
  }

  if (trainFromUrl) {
    const trainInput = document.getElementById("trainNumber");
    if (trainInput) trainInput.value = trainFromUrl;
    loadLiveTrainStatus(trainFromUrl, dateFromUrl || "");
  }
});

async function loadLiveTrainStatus(trainNumber, date) {
  currentTrainNumber = trainNumber;
  currentStartDate = date;

  const resultContainer = document.getElementById("trainLive");
  if (!resultContainer) return;

  // Clean previous map instance if any
  if (liveMapInstance) {
    liveMapInstance.remove();
    liveMapInstance = null;
  }

  resultContainer.innerHTML = `
    <div class="spinner-wrap">
      <div class="railway-spinner"></div>
      <p style="font-weight:600; color:var(--text-muted); margin-top:12px;">Connecting to GPS Radar for Train ${trainNumber}...</p>
    </div>
  `;

  try {
    let url = `/api/train-live?trainNumber=${encodeURIComponent(trainNumber)}`;
    if (date) url += `&date=${encodeURIComponent(date)}`;

    const { res, data } = await window.apiFetch(url);

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Live status unavailable for this train.");
    }

    renderLiveTrainDashboard(data.data);
    startAutoRefresh();
  } catch (err) {
    resultContainer.innerHTML = `
      <div style="background:#ffffff; border-radius:var(--radius-lg); border:1px solid #fecaca; padding:32px; text-align:center;">
        <div style="font-size:2.5rem; margin-bottom:12px;">⚠️</div>
        <h3 style="font-family:'Outfit'; font-size:1.35rem; color:#b91c1c; margin-bottom:8px;">Live Tracking Unavailable</h3>
        <p style="color:var(--text-muted); max-width:540px; margin:0 auto 18px;">
          ${err.message || 'Train may not be scheduled to run today, or real-time GPS feed is temporarily offline.'}
        </p>
        <a href="schedule.html?trainNumber=${encodeURIComponent(trainNumber)}" class="btn-primary" style="display:inline-flex; width:auto;">
          View Train Schedule & Timetable Instead
        </a>
      </div>
    `;
  }
}

function renderLiveTrainDashboard(liveData) {
  const container = document.getElementById("trainLive");
  const train = liveData.train || {};
  const currentLoc = liveData.currentLocation || {};
  const delayMinutes = liveData.delayMinutes || 0;
  const isDelayed = delayMinutes > 0;
  const route = liveData.route || [];

  // Calculate Progress Percentage
  const currentSeq = currentLoc.sequence || 0;
  const maxSeq = route.length > 0 ? (route[route.length - 1].sequence || route.length) : 1;
  const progressPct = Math.min(100, Math.max(0, Math.round((currentSeq / maxSeq) * 100)));

  // Format Status String
  let statusBadgeClass = isDelayed ? "delayed" : "on-time";
  let statusText = isDelayed ? `⚠️ Late by ${delayMinutes} mins` : `✓ Running Right Time`;

  if (liveData.status === "arrived") {
    statusBadgeClass = "on-time";
    statusText = "🏁 Arrived at Destination";
  }

  // Format Last Updated Time
  let updatedStr = "Just now";
  if (liveData.lastUpdatedAt) {
    try {
      const dt = new Date(liveData.lastUpdatedAt);
      updatedStr = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      updatedStr = liveData.lastUpdatedAt;
    }
  }

  // SVG Coaches Rake
  const coachRakeString = liveData.coachPosition || train.coachPosition || "ENG-GEN-H1-A1-B1-PC-S1-SLRD";
  let coachesRakeHtml = "";
  if (window.CoachSVGs) {
    coachesRakeHtml = `
      <div style="background:#ffffff; border-radius:var(--radius-lg); border:1px solid var(--border-light); padding:24px; box-shadow:var(--shadow-sm); margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
          <div>
            <h3 style="font-family:'Outfit'; font-size:1.25rem; margin:0;">🚆 Train Coach Composition (Live Rake Position)</h3>
            <p style="font-size:0.82rem; color:var(--text-muted); margin:2px 0 0;">Interactive SVG Rake from Locomotive to Rear Guard Coach. Click any coach to inspect details.</p>
          </div>
          <span style="font-size:0.75rem; background:#eff6ff; color:var(--railway-blue); font-weight:700; padding:4px 10px; border-radius:var(--radius-full);">
            Scroll ➔ to view full rake
          </span>
        </div>
        ${window.CoachSVGs.renderRake(coachRakeString)}
      </div>
    `;
  }

  container.innerHTML = `
    <!-- Top Hero Card -->
    <div class="live-status-hero">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px; margin-bottom:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <span class="train-number" style="font-size:1.3rem;">${liveData.trainNumber}</span>
            <h2 style="font-family:'Outfit'; font-size:1.6rem; margin:0;">${liveData.trainName || train.name || 'Express'}</h2>
          </div>
          <p style="color:var(--text-muted); font-size:0.92rem;">
            ${train.source?.name || 'Source'} (${train.source?.code || ''}) ➔ ${train.destination?.name || 'Destination'} (${train.destination?.code || ''})
          </p>
        </div>

        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
          <span class="live-badge-status ${statusBadgeClass}">
            <span class="live-pulse-dot" style="${isDelayed ? 'background:var(--danger-rose); box-shadow:0 0 8px var(--danger-rose);' : ''}"></span>
            ${statusText}
          </span>
          <div style="display:flex; align-items:center; gap:8px; font-size:0.8rem; color:var(--text-light);">
            <span>Updated at ${updatedStr}</span>
            <button onclick="loadLiveTrainStatus('${currentTrainNumber}', '${currentStartDate}')" class="btn-card-action" style="padding:3px 10px; font-size:0.75rem;">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Current Location Spotlight -->
      <div class="live-current-card">
        <div>
          <div class="current-station-title">📍 Current Location</div>
          <div class="current-station-name">
            ${currentLoc.stationName || 'En Route'} 
            <span style="font-family:'JetBrains Mono'; font-size:1.1rem; color:#38bdf8;">(${currentLoc.stationCode || 'N/A'})</span>
          </div>
          <div style="font-size:0.85rem; color:#94a3b8; margin-top:2px;">
            Status: <strong>${(currentLoc.status || 'Moving').toUpperCase()}</strong> • Platform: <strong>${currentLoc.platform ? `PF ${currentLoc.platform}` : 'TBD'}</strong>
          </div>
        </div>

        <div class="current-station-details">
          ${liveData.previousHalt ? `
            <div>
              <div style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase;">Prev Halt</div>
              <strong>${liveData.previousHalt.stationName}</strong>
            </div>
          ` : ''}

          ${liveData.nextHalt ? `
            <div>
              <div style="font-size:0.75rem; color:#38bdf8; text-transform:uppercase;">Next Halt</div>
              <strong>${liveData.nextHalt.stationName}</strong>
            </div>
          ` : ''}

          <div>
            <div style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase;">Distance</div>
            <strong>${currentLoc.distance != null ? `${currentLoc.distance} km` : 'N/A'}</strong>
          </div>
        </div>
      </div>

      <!-- Journey Progress Bar -->
      <div style="margin-top:20px;">
        <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:600; color:var(--text-muted); margin-bottom:6px;">
          <span>Journey Progress</span>
          <span>${progressPct}% Completed</span>
        </div>
        <div style="height:8px; background:#f1f5f9; border-radius:var(--radius-full); overflow:hidden;">
          <div style="height:100%; width:${progressPct}%; background:linear-gradient(90deg, var(--railway-blue), var(--success-emerald)); border-radius:var(--radius-full); transition:width 0.5s ease;"></div>
        </div>
      </div>
    </div>

    <!-- Interactive Route Map Card (Present Stage with SVG Train) -->
    <div class="map-card-wrapper">
      <div class="map-header-bar">
        <div>
          <h3 style="font-family:'Outfit'; font-size:1.35rem; margin:0; display:flex; align-items:center; gap:8px;">
            <span>🗺️ Live Route Map & Present Train Location</span>
          </h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin:3px 0 0;">
            Real-time GPS track with animated SVG Train marker stationed at current stage.
          </p>
        </div>

        <div class="map-controls-group">
          <button type="button" class="btn-card-action" onclick="centerOnTrainMarker()">
            <span>🎯 Recenter on Train</span>
          </button>
          <button type="button" class="btn-card-action" onclick="fitFullRouteMap()">
            <span>🔍 Fit Full Route</span>
          </button>
        </div>
      </div>

      <!-- Leaflet Map Container -->
      <div id="liveTrainMap"></div>
    </div>

    <!-- SVG Coaches Rake Visualization -->
    ${coachesRakeHtml}

    <!-- Vertical Timeline Route Tracker -->
    <div class="timeline-track-wrap">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h3 style="font-family:'Outfit'; font-size:1.25rem;">Live Route Station Timetable (${route.length} Stations)</h3>
        <span style="font-size:0.82rem; color:var(--text-muted);">🟢 Passed • 📍 Present Stage • ⚪ Ahead</span>
      </div>

      <div class="timeline-station-list">
        ${route.map((st, i) => {
          const isPassed = st.status === "departed";
          const isCurrent = st.stationCode === currentLoc.stationCode || (i === 0 && !isPassed && !currentLoc.stationCode);
          const hasHalt = st.isHalt || st.haltMinutes > 0;
          const delayArr = st.delayArrival || 0;
          const delayDep = st.delayDeparture || 0;
          const delayDisplay = delayArr > 0 ? `Late ${delayArr}m` : (delayDep > 0 ? `Late ${delayDep}m` : 'On Time');
          const isStopDelayed = delayArr > 0 || delayDep > 0;

          return `
            <div class="timeline-item ${isCurrent ? 'current-station' : isPassed ? 'passed' : ''}">
              <div class="timeline-dot">
                ${isPassed ? '✓' : isCurrent ? '📍' : ''}
              </div>

              <div class="timeline-content-grid">
                <div>
                  <div class="timeline-station-name">
                    ${st.stationName || 'Station'}
                    <span style="font-family:'JetBrains Mono'; font-size:0.85rem; color:var(--railway-blue);">(${st.stationCode})</span>
                    ${isCurrent ? '<span style="background:var(--success-emerald); color:#fff; font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:var(--radius-full); margin-left:8px;">TRAIN IS HERE</span>' : ''}
                  </div>

                  <div class="timeline-meta">
                    <span>Seq: #${st.sequence || i + 1}</span>
                    <span>${st.distance != null ? `${st.distance} km` : ''}</span>
                    ${st.platform ? `<span class="platform-pill">Platform ${st.platform}</span>` : ''}
                    <span style="font-size:0.8rem; color:${hasHalt ? 'var(--text-main)' : 'var(--text-light)'};">
                      ${hasHalt ? '🛑 Halt Station' : '⚡ Passing Through'}
                    </span>
                  </div>
                </div>

                <div class="timeline-times">
                  <div class="scheduled-time">
                    ${st.actualDeparture || st.scheduledDeparture || st.actualArrival || st.scheduledArrival || '--:--'}
                  </div>
                  <div class="delay-time ${isStopDelayed ? '' : 'on-time'}">
                    ${isPassed ? 'Departed' : delayDisplay}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Initialize the Leaflet Map after DOM injection
  setTimeout(() => {
    initLeafletTrainMap(liveData);
  }, 100);
}

// ========================================================
// Leaflet Map Initialization & Custom SVG Train Marker
// ========================================================
function initLeafletTrainMap(liveData) {
  const mapEl = document.getElementById("liveTrainMap");
  if (!mapEl || typeof L === "undefined") return;

  const route = liveData.route || [];
  const currentLoc = liveData.currentLocation || {};
  const trainNumber = liveData.trainNumber;
  const trainName = liveData.trainName || "Express";
  const delayMinutes = liveData.delayMinutes || 0;

  // Collect stations with valid lat/lng
  const stationsWithCoords = route.filter(s => s.lat != null && s.lng != null);

  // Fallback default coordinates (India center) if no stations have coords
  let defaultCenter = [22.9734, 78.6569];
  let defaultZoom = 6;

  if (stationsWithCoords.length > 0) {
    defaultCenter = [stationsWithCoords[0].lat, stationsWithCoords[0].lng];
  }

  // Create Map instance
  liveMapInstance = L.map("liveTrainMap", {
    center: defaultCenter,
    zoom: defaultZoom,
    zoomControl: true,
  });

  // User CARTO Basemaps API Key
  const CARTO_API_KEY = "cb1_4hmw_1_fe7247cc1da86e7d4ee8f2ad";

  // CARTO Tile Layers authenticated with API key
  const voyagerLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  });

  const positronLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  });

  const darkMatterLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  });

  // Default to Voyager
  voyagerLayer.addTo(liveMapInstance);

  // Basemap switcher control
  L.control.layers({
    "🗺️ CARTO Voyager": voyagerLayer,
    "☀️ CARTO Positron (Light)": positronLayer,
    "🌙 CARTO Dark Matter (Radar)": darkMatterLayer
  }, null, { position: "topright" }).addTo(liveMapInstance);

  if (stationsWithCoords.length === 0) {
    // Add banner on map if coordinates unavailable
    const infoControl = L.control({ position: "topright" });
    infoControl.onAdd = function() {
      const div = L.DomUtil.create("div", "leaflet-bar");
      div.style.background = "#fff";
      div.style.padding = "8px 12px";
      div.style.fontSize = "12px";
      div.innerHTML = "GPS track nodes loading...";
      return div;
    };
    infoControl.addTo(liveMapInstance);
    return;
  }

  // Identify Current Location Coordinates
  let trainLat = currentLoc.lat;
  let trainLng = currentLoc.lng;

  // If current location does not have exact lat/lng, find nearest station in route
  if (trainLat == null || trainLng == null) {
    const curIdx = route.findIndex(s => s.stationCode === currentLoc.stationCode);
    if (curIdx >= 0 && route[curIdx].lat != null) {
      trainLat = route[curIdx].lat;
      trainLng = route[curIdx].lng;
    } else {
      // Find the last passed station that has coordinates
      for (let i = route.length - 1; i >= 0; i--) {
        if (route[i].status === "departed" && route[i].lat != null) {
          trainLat = route[i].lat;
          trainLng = route[i].lng;
          break;
        }
      }
      // If still null, fallback to first coordinate
      if (trainLat == null && stationsWithCoords.length > 0) {
        trainLat = stationsWithCoords[0].lat;
        trainLng = stationsWithCoords[0].lng;
      }
    }
  }

  // Polyline coordinates for traveled track vs upcoming track
  const passedCoords = [];
  const upcomingCoords = [];
  let passedCurrent = false;

  stationsWithCoords.forEach((st) => {
    const latLng = [st.lat, st.lng];
    if (st.status === "departed") {
      passedCoords.push(latLng);
    } else {
      if (!passedCurrent && passedCoords.length > 0) {
        // connect gap
        upcomingCoords.push(passedCoords[passedCoords.length - 1]);
        passedCurrent = true;
      }
      upcomingCoords.push(latLng);
    }

    // Add station circle pin
    const isStationPassed = st.status === "departed";
    const stIcon = L.divIcon({
      className: "custom-station-pin",
      html: `<div class="station-marker-circle ${isStationPassed ? 'passed' : ''}" title="${st.stationName} (${st.stationCode})"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const marker = L.marker(latLng, { icon: stIcon }).addTo(liveMapInstance);
    marker.bindTooltip(`<strong>${st.stationName}</strong> (${st.stationCode})<br>Platform: ${st.platform || '1'}`, {
      direction: "top",
      offset: [0, -6]
    });
    stationMarkers.push(marker);
  });

  // Render Polylines
  if (passedCoords.length > 1) {
    const passedLine = L.polyline(passedCoords, {
      color: "#10b981", // vibrant emerald
      weight: 5,
      opacity: 0.85,
    }).addTo(liveMapInstance);
    routePolylines.push(passedLine);
  }

  if (upcomingCoords.length > 1) {
    const upcomingLine = L.polyline(upcomingCoords, {
      color: "#1d4ed8", // railway blue
      weight: 4,
      dashArray: "6, 8",
      opacity: 0.75,
    }).addTo(liveMapInstance);
    routePolylines.push(upcomingLine);
  }

  // ========================================================
  // Custom SVG Train Marker positioned at Present Stage!
  // ========================================================
  if (trainLat != null && trainLng != null) {
    const isLate = delayMinutes > 0;
    const delayChipText = isLate ? `Late ${delayMinutes}m` : "On Time";

    // Detailed SVG Locomotive Icon pointing directly at present stage
    const trainIconHtml = `
      <div class="train-map-marker-wrap">
        <div class="radar-pulse-ring" style="${isLate ? 'border-color:#ef4444; background:rgba(239,68,68,0.2);' : ''}"></div>
        <div class="radar-pulse-ring-outer" style="${isLate ? 'border-color:#ef4444;' : ''}"></div>
        
        <div class="train-marker-body">
          <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
            <!-- Front Light Glow Beam -->
            <polygon points="22,12 8,0 36,0" fill="rgba(254, 240, 138, 0.45)"/>
            
            <!-- Train Drop Shadow -->
            <ellipse cx="22" cy="24" rx="14" ry="14" fill="rgba(0,0,0,0.3)"/>

            <!-- Locomotive Body (WAP-7 Crimson Red) -->
            <rect x="12" y="8" width="20" height="28" rx="8" fill="#b91c1c" stroke="#facc15" stroke-width="2"/>
            
            <!-- Windshield Glass -->
            <path d="M 15 12 Q 22 9 29 12 L 29 17 Q 22 14 15 17 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="0.8"/>
            
            <!-- High Beam Dual Headlights -->
            <circle cx="17" cy="10.5" r="2.2" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8"/>
            <circle cx="27" cy="10.5" r="2.2" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8"/>
            <circle cx="17" cy="10.5" r="1" fill="#ffffff"/>
            <circle cx="27" cy="10.5" r="1" fill="#ffffff"/>

            <!-- Roof Electric Pantograph Unit -->
            <rect x="18" y="22" width="8" height="5" rx="1.5" fill="#475569" stroke="#cbd5e1" stroke-width="0.8"/>
            <line x1="16" y1="24.5" x2="28" y2="24.5" stroke="#f1f5f9" stroke-width="1.2"/>

            <!-- Rear Red Marker Light -->
            <circle cx="22" cy="33" r="1.8" fill="#ef4444"/>
          </svg>
        </div>

        <div class="train-marker-chip">
          🚆 ${trainNumber} • ${delayChipText}
        </div>
      </div>
    `;

    const trainSvgIcon = L.divIcon({
      className: "train-live-svg-icon-container",
      html: trainIconHtml,
      iconSize: [52, 52],
      iconAnchor: [26, 26],
      popupAnchor: [0, -28]
    });

    trainMarkerInstance = L.marker([trainLat, trainLng], {
      icon: trainSvgIcon,
      zIndexOffset: 1000
    }).addTo(liveMapInstance);

    const popupContent = `
      <div style="font-family:'Inter',sans-serif; padding:4px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span style="background:#09142e; color:#38bdf8; font-family:'JetBrains Mono'; font-weight:700; padding:2px 6px; border-radius:4px; font-size:11px;">${trainNumber}</span>
          <strong style="font-family:'Outfit'; font-size:14px;">${trainName}</strong>
        </div>
        <div style="font-size:12px; color:#475569; margin-bottom:4px;">
          Present Location: <strong>${currentLoc.stationName || 'En Route'} (${currentLoc.stationCode || ''})</strong>
        </div>
        <div style="font-size:11px; color:#64748b;">
          Platform: <strong>${currentLoc.platform || 'TBD'}</strong> • Status: <strong>${(currentLoc.status || 'Running').toUpperCase()}</strong>
        </div>
        <div style="margin-top:6px; font-size:11px; font-weight:700; color:${isLate ? '#b91c1c' : '#15803d'};">
          ${isLate ? `⚠️ Delayed by ${delayMinutes} minutes` : '✓ Running Right Time'}
        </div>
      </div>
    `;

    trainMarkerInstance.bindPopup(popupContent).openPopup();

    // Center map on the train
    liveMapInstance.setView([trainLat, trainLng], 9);
  } else {
    fitFullRouteMap();
  }
}

// Map Controls: Center on Train
window.centerOnTrainMarker = function() {
  if (liveMapInstance && trainMarkerInstance) {
    const latLng = trainMarkerInstance.getLatLng();
    liveMapInstance.flyTo(latLng, 10, { duration: 1.2 });
    trainMarkerInstance.openPopup();
  }
};

// Map Controls: Fit Full Route
window.fitFullRouteMap = function() {
  if (!liveMapInstance) return;
  const allCoords = [];
  stationMarkers.forEach(m => allCoords.push(m.getLatLng()));
  if (trainMarkerInstance) allCoords.push(trainMarkerInstance.getLatLng());

  if (allCoords.length > 0) {
    const bounds = L.latLngBounds(allCoords);
    liveMapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }
};

function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  // Auto-refresh every 45 seconds
  autoRefreshTimer = setInterval(() => {
    if (currentTrainNumber) {
      loadLiveTrainStatus(currentTrainNumber, currentStartDate);
    }
  }, 45000);
}