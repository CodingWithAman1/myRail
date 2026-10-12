// ==========================================
// MyRail - Dedicated Live Tracking Logic (app2.js)
// ==========================================

let autoRefreshTimer = null;
let currentTrainNumber = "";
let currentStartDate = "";

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

  resultContainer.innerHTML = `
    <div class="spinner-wrap">
      <div class="railway-spinner"></div>
      <p style="font-weight:600; color:var(--text-muted); margin-top:12px;">Connecting to GPS Radar for Train ${trainNumber}...</p>
    </div>
  `;

  try {
    let url = `/api/train-live?trainNumber=${encodeURIComponent(trainNumber)}`;
    if (date) url += `&date=${encodeURIComponent(date)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Live status unavailable for this train.");
    }

    renderLiveTrainDashboard(data.data);
    startAutoRefresh();
  } catch (err) {
    resultContainer.innerHTML = `
      <div style="background:#ffffff; border-radius:var(--radius-lg); border:1px solid #fecaca; padding:28px; text-align:center;">
        <div style="font-size:2.5rem; margin-bottom:12px;">⚠️</div>
        <h3 style="font-family:'Outfit'; font-size:1.3rem; color:#b91c1c; margin-bottom:8px;">Live Tracking Unavailable</h3>
        <p style="color:var(--text-muted); max-width:540px; margin:0 auto 16px;">
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
  let statusText = isDelayed ? `⚠️ Delayed by ${delayMinutes} mins` : `✓ Running Right Time`;

  if (liveData.status === "arrived") {
    statusBadgeClass = "on-time";
    statusText = "🏁 Journey Completed (Arrived)";
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

  // Check for Exceptions (Diversions, etc.)
  let exceptionBanner = "";
  if (liveData.exceptions && liveData.exceptions.length > 0) {
    exceptionBanner = `
      <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:var(--radius-md); padding:14px 18px; margin-bottom:20px; display:flex; align-items:center; gap:12px; color:#92400e;">
        <span style="font-size:1.4rem;">⚠️</span>
        <div>
          <strong>Special Advisory:</strong>
          <p style="margin:2px 0 0; font-size:0.88rem;">${liveData.exceptions.map(e => e.message || e.type).join("; ")}</p>
        </div>
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

      ${exceptionBanner}

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

    <!-- Vertical Timeline Route Tracker -->
    <div class="timeline-track-wrap">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h3 style="font-family:'Outfit'; font-size:1.25rem;">Live Route Station Timetable (${route.length} Stations)</h3>
        <span style="font-size:0.82rem; color:var(--text-muted);">🟢 Green: Passed • 📍 Radar: Current • ⚪ Ahead</span>
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
}

function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  // Auto-refresh every 45 seconds
  autoRefreshTimer = setInterval(() => {
    if (currentTrainNumber) {
      loadLiveTrainStatus(currentTrainNumber, currentStartDate);
    }
  }, 45000);
}