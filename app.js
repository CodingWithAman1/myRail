// ==========================================
// MyRail - Master Hub Logic (app.js)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initStationAutocomplete();
  initSwapButton();
  initDatePresets();
  initPopularChips();
  initHubForms();
  restoreRecentSearches();
});

// 1. Tab Switching
function initTabs() {
  const tabs = document.querySelectorAll(".hub-tab");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.target;
      tabs.forEach(t => t.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");
    });
  });
}

// 2. Station Autocomplete
function initStationAutocomplete() {
  const fromInput = document.getElementById("hubFromStation");
  const toInput = document.getElementById("hubToStation");

  if (fromInput) new StationAutocomplete(fromInput);
  if (toInput) new StationAutocomplete(toInput);
}

// 3. Station Swap Button
function initSwapButton() {
  const swapBtn = document.getElementById("hubSwapBtn");
  const fromInput = document.getElementById("hubFromStation");
  const toInput = document.getElementById("hubToStation");

  if (swapBtn && fromInput && toInput) {
    swapBtn.addEventListener("click", () => {
      const temp = fromInput.value;
      fromInput.value = toInput.value;
      toInput.value = temp;

      // Swap data codes if present
      const tempCode = fromInput.dataset.stationCode;
      fromInput.dataset.stationCode = toInput.dataset.stationCode || "";
      toInput.dataset.stationCode = tempCode || "";
    });
  }
}

// 4. Quick Date Preset Chips
function initDatePresets() {
  const dateInput = document.getElementById("hubTravelDate");
  const chips = document.querySelectorAll(".quick-date-chips .date-chip");
  if (!dateInput) return;

  // Set default to today
  const today = new Date();
  dateInput.value = today.toISOString().split("T")[0];

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");

      const daysOffset = parseInt(chip.dataset.days || "0", 10);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysOffset);
      dateInput.value = targetDate.toISOString().split("T")[0];
    });
  });
}

// 5. Popular Train Chips
function initPopularChips() {
  const chips = document.querySelectorAll(".train-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const trainNo = chip.dataset.train;
      if (!trainNo) return;

      // Switch to live status tab and fill
      const liveTab = document.querySelector(".hub-tab[data-target='tabLive']");
      if (liveTab) liveTab.click();

      const liveInput = document.getElementById("liveTrainNumber");
      if (liveInput) {
        liveInput.value = trainNo;
        const liveForm = document.getElementById("liveSearchForm");
        if (liveForm) liveForm.dispatchEvent(new Event("submit"));
      }
    });
  });
}

// Helper to extract Station Code from input string
function extractStationCode(str) {
  if (!str) return null;
  const match = str.trim().toUpperCase().match(/\(([A-Z]{2,5})\)$/);
  if (match) return match[1];
  if (/^[A-Z]{2,5}$/.test(str.trim().toUpperCase())) return str.trim().toUpperCase();
  return str.trim();
}

// 6. Hub Forms Submissions
function initHubForms() {
  // Form 1: Trains Between Stations
  const formBetween = document.getElementById("formBetweenStations");
  if (formBetween) {
    formBetween.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fromVal = document.getElementById("hubFromStation").value;
      const toVal = document.getElementById("hubToStation").value;
      const travelDate = document.getElementById("hubTravelDate").value;

      const fromCode = extractStationCode(fromVal);
      const toCode = extractStationCode(toVal);

      if (!fromCode || !toCode) {
        showToast("Please enter valid From and To stations", "error");
        return;
      }

      RecentSearches.add("routes", { fromVal, toVal, fromCode, toCode });
      restoreRecentSearches();

      const resultContainer = document.getElementById("hubResultsArea");
      resultContainer.innerHTML = `
        <div class="spinner-wrap">
          <div class="railway-spinner"></div>
          <p style="font-weight:600; color:var(--text-muted);">Finding trains between ${fromCode} and ${toCode}...</p>
        </div>
      `;
      resultContainer.scrollIntoView({ behavior: "smooth", block: "start" });

      try {
        let url = `/api/trains-between?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}`;
        if (travelDate) url += `&date=${encodeURIComponent(travelDate)}`;

        const { res, data } = await window.apiFetch(url);

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch trains");
        }

        renderTrainsBetweenResults(data.data, travelDate);
      } catch (err) {
        resultContainer.innerHTML = `
          <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:var(--radius-md); padding:20px; color:#b91c1c;">
            <strong>Error:</strong> ${err.message}
          </div>
        `;
      }
    });
  }

  // Form 2: Live Status
  const formLive = document.getElementById("liveSearchForm");
  if (formLive) {
    formLive.addEventListener("submit", (e) => {
      e.preventDefault();
      const trainNumber = document.getElementById("liveTrainNumber").value.trim();
      const date = document.getElementById("liveStartDate")?.value || "";
      if (!trainNumber) return;
      window.location.href = `live.html?trainNumber=${encodeURIComponent(trainNumber)}${date ? `&date=${encodeURIComponent(date)}` : ""}`;
    });
  }

  // Form 3: Train Schedule & Coach
  const formSchedule = document.getElementById("scheduleSearchForm");
  if (formSchedule) {
    formSchedule.addEventListener("submit", (e) => {
      e.preventDefault();
      const trainNumber = document.getElementById("scheduleTrainNumber").value.trim();
      if (!trainNumber) return;
      window.location.href = `schedule.html?trainNumber=${encodeURIComponent(trainNumber)}`;
    });
  }

  // Form 4: PNR Enquiry
  const formPnr = document.getElementById("pnrSearchForm");
  if (formPnr) {
    formPnr.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pnr = document.getElementById("pnrNumber").value.trim();
      if (!/^\d{10}$/.test(pnr)) {
        showToast("Please enter a valid 10-digit Indian Railway PNR", "error");
        return;
      }

      const pnrResult = document.getElementById("hubResultsArea");
      pnrResult.innerHTML = `
        <div class="spinner-wrap">
          <div class="railway-spinner"></div>
          <p style="font-weight:600; color:var(--text-muted);">Fetching PNR Status for ${pnr}...</p>
        </div>
      `;
      pnrResult.scrollIntoView({ behavior: "smooth" });

      try {
        const { res, data } = await window.apiFetch(`/api/pnr/${encodeURIComponent(pnr)}`);
        if (!res.ok || !data.success) throw new Error(data.error || "PNR not found");

        renderPnrCard(data.data);
      } catch (err) {
        pnrResult.innerHTML = `
          <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:var(--radius-md); padding:20px; color:#b91c1c;">
            <strong>PNR Error:</strong> ${err.message}
          </div>
        `;
      }
    });
  }
}

// 7. Render Trains Between Results
function renderTrainsBetweenResults(data, date) {
  const container = document.getElementById("hubResultsArea");
  const { from, to, trains = [], count = 0 } = data;

  if (!trains.length) {
    container.innerHTML = `
      <div style="background:#ffffff; padding:36px; border-radius:var(--radius-lg); text-align:center; border:1px solid var(--border-light);">
        <h3 style="font-family:'Outfit'; font-size:1.3rem; margin-bottom:8px;">No Direct Trains Found</h3>
        <p style="color:var(--text-muted);">No scheduled trains found between ${from.name} (${from.code}) and ${to.name} (${to.code}) on this date.</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="result-header-bar">
      <div class="result-title">
        <span>🚆 ${from.name} (${from.code}) ➔ ${to.name} (${to.code})</span>
        <span class="result-count-badge">${count} Trains Available</span>
      </div>
    </div>
    <div class="trains-list">
  `;

  trains.forEach((item, index) => {
    const train = item.train || {};
    const departure = item.from?.departure || "--:--";
    const arrival = item.to?.arrival || "--:--";
    const durationMins = item.duration || 0;
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    const durationStr = `${hours}h ${mins}m`;
    const distanceStr = item.distance ? `${item.distance} km` : "";
    const halts = item.totalHaltsBetween || 0;

    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const runDays = (train.runDays || []).map(d => d.toLowerCase());
    const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    const isSuperfast = (train.type || "").toLowerCase().includes("superfast");
    const isVandeBharat = (train.name || "").toLowerCase().includes("vande bharat");

    html += `
      <div class="train-card" id="trainCard_${train.number}">
        <div class="train-card-top">
          <div class="train-id-wrap">
            <span class="train-number">${train.number}</span>
            <span class="train-name">${train.name}</span>
          </div>
          <span class="train-type-badge ${isVandeBharat ? 'vandebharat' : isSuperfast ? 'superfast' : ''}">
            ${train.type || 'Express'}
          </span>
        </div>

        <div class="journey-track-grid">
          <div class="station-point">
            <span class="point-time">${departure}</span>
            <span class="point-station">${item.from?.name || from.name}</span>
            <span class="point-code">${item.from?.code || from.code}</span>
          </div>

          <div class="track-connector">
            <span class="track-duration-pill">${durationStr} ${distanceStr ? `• ${distanceStr}` : ''}</span>
            <div class="track-line"></div>
            <span style="font-size:0.75rem; color:var(--text-light); font-weight:600;">${halts} Halts</span>
          </div>

          <div class="station-point dest">
            <span class="point-time">${arrival}</span>
            <span class="point-station">${item.to?.name || to.name}</span>
            <span class="point-code">${item.to?.code || to.code}</span>
          </div>
        </div>

        <div class="train-card-bottom">
          <div class="rundays-wrap">
            <span style="font-size:0.75rem; font-weight:600; color:var(--text-muted); margin-right:4px;">Runs on:</span>
            ${dayKeys.map((k, i) => `
              <span class="day-badge ${runDays.includes(k) ? 'active' : ''}">${days[i]}</span>
            `).join('')}
          </div>

          <div class="card-actions">
            <button class="btn-card-action" onclick="toggleRouteHalts('${train.number}', '${index}')">
              <span>📋 Halts & Route</span>
            </button>
            <a class="btn-card-action primary" href="live.html?trainNumber=${train.number}">
              <span>🔴 Live Status</span>
            </a>
            <a class="btn-card-action book" target="_blank" rel="noopener noreferrer"
               href="https://www.confirmtkt.com/rbooking/trains/from/${from.code}/to/${to.code}/${formatConfirmTktDate(date)}">
              <span>🎟️ Book Ticket</span>
            </a>
          </div>
        </div>

        <div id="haltsPanel_${index}" style="display:none; margin-top:16px; padding-top:16px; border-top:1px dashed var(--border-light);"></div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// 8. Toggle Inline Route & Halts
window.toggleRouteHalts = async function(trainNumber, index) {
  const panel = document.getElementById(`haltsPanel_${index}`);
  if (!panel) return;

  if (panel.style.display === "block") {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";
  panel.innerHTML = `<div class="spinner-wrap" style="padding:16px;"><div class="railway-spinner" style="width:28px; height:28px;"></div></div>`;

  try {
    const { res, data } = await window.apiFetch(`/api/train/${encodeURIComponent(trainNumber)}`);

    if (!res.ok || !data.success) throw new Error(data.error || "Could not load halts");

    const route = data.data.route || [];
    panel.innerHTML = `
      <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
        <strong style="font-family:'Outfit';">Timetable & Halts (${route.length} stops)</strong>
        <a href="schedule.html?trainNumber=${trainNumber}" style="font-size:0.8rem; color:var(--railway-blue); text-decoration:none; font-weight:600;">View Full Schedule & Coach Layout ➔</a>
      </div>
      <div class="modern-table-wrap">
        <table class="modern-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Station</th>
              <th>Arrival</th>
              <th>Departure</th>
              <th>Halt (min)</th>
              <th>Platform</th>
              <th>Distance</th>
            </tr>
          </thead>
          <tbody>
            ${route.map((st, i) => `
              <tr>
                <td>${st.sequence || i + 1}</td>
                <td><strong>${st.station?.name || 'N/A'}</strong> <span style="font-size:0.75rem; color:var(--railway-blue);">(${st.station?.code})</span></td>
                <td>${st.arrival || 'Source'}</td>
                <td>${st.departure || 'Dest'}</td>
                <td>${st.haltMinutes != null ? `${st.haltMinutes}m` : (st.arrival && st.departure ? calculateHalt(st.arrival, st.departure) : '-')}</td>
                <td><span class="platform-pill">PF ${st.platform || '1'}</span></td>
                <td>${st.distance != null ? `${st.distance} km` : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    panel.innerHTML = `<p style="color:var(--danger-rose); font-size:0.85rem;">Failed to load timetable: ${err.message}</p>`;
  }
};

function calculateHalt(arr, dep) {
  if (!arr || !dep || arr === "Source" || dep === "Dest") return "-";
  const [ah, am] = arr.split(":").map(Number);
  const [dh, dm] = dep.split(":").map(Number);
  const diff = (dh * 60 + dm) - (ah * 60 + am);
  return diff > 0 ? `${diff}m` : "-";
}

function formatConfirmTktDate(dateStr) {
  if (!dateStr) {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
  }
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
}

// 9. Render Verified PNR Card
function renderPnrCard(pnrData) {
  const container = document.getElementById("hubResultsArea");
  container.innerHTML = `
    <div style="max-width:760px; margin:0 auto; background:#ffffff; border-radius:var(--radius-lg); border:1px solid var(--border-light); box-shadow:var(--shadow-lg); overflow:hidden;">
      <div style="background:linear-gradient(135deg, #09142e 0%, #1e293b 100%); color:#ffffff; padding:24px 28px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:0.75rem; color:#38bdf8; text-transform:uppercase; font-weight:700; letter-spacing:0.5px;">INDIAN RAILWAY PASSENGER RECORD</span>
          <h2 style="font-family:'Outfit'; font-size:1.6rem; margin:2px 0;">PNR: ${pnrData.pnr}</h2>
          <p style="font-size:0.9rem; color:#cbd5e1;">${pnrData.trainNumber} - ${pnrData.trainName}</p>
        </div>
        <div style="text-align:right;">
          <span style="background:${pnrData.chartStatus === 'Chart Prepared' ? '#15803d' : '#d97706'}; color:#ffffff; font-size:0.75rem; font-weight:700; padding:4px 10px; border-radius:var(--radius-full);">
            ${pnrData.chartStatus}
          </span>
          <div style="font-family:'JetBrains Mono'; font-size:1.2rem; font-weight:700; color:#38bdf8; margin-top:8px;">Class: ${pnrData.class}</div>
        </div>
      </div>

      <div style="padding:24px 28px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle);">
          <div>
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Boarding Station</span>
            <div style="font-weight:700; font-size:1.05rem;">${pnrData.fromStation.name} (${pnrData.fromStation.code})</div>
            <span style="font-size:0.85rem; color:var(--text-muted);">Date: ${pnrData.journeyDate}</span>
          </div>
          <div style="text-align:right;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Destination Station</span>
            <div style="font-weight:700; font-size:1.05rem;">${pnrData.toStation.name} (${pnrData.toStation.code})</div>
          </div>
        </div>

        <h3 style="font-family:'Outfit'; font-size:1.1rem; margin-bottom:12px;">Passenger Status</h3>
        <div class="modern-table-wrap">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Passenger</th>
                <th>Booking Status</th>
                <th>Current Status</th>
                <th>Coach / Berth</th>
                <th>Berth Type</th>
              </tr>
            </thead>
            <tbody>
              ${pnrData.passengers.map(p => `
                <tr>
                  <td><strong>Passenger ${p.number}</strong></td>
                  <td><span style="background:#e0f2fe; color:var(--railway-blue); font-weight:700; padding:2px 8px; border-radius:4px;">${p.bookingStatus}</span></td>
                  <td><span style="background:#dcfce7; color:#15803d; font-weight:700; padding:2px 8px; border-radius:4px;">${p.currentStatus}</span></td>
                  <td><strong>${p.coach} / ${p.berth}</strong></td>
                  <td>${p.berthType}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// 10. Restore Recent Searches
function restoreRecentSearches() {
  const container = document.getElementById("recentSearchesBar");
  if (!container) return;

  const recents = RecentSearches.get("routes");
  if (!recents || !recents.length) {
    container.style.display = "none";
    return;
  }

  container.style.display = "flex";
  const chipsWrap = container.querySelector(".recent-chips-wrap");
  if (!chipsWrap) return;

  chipsWrap.innerHTML = recents.map(r => `
    <span class="train-chip" onclick="applyRecentRoute('${r.fromVal}', '${r.toVal}')">
      🔄 ${r.fromCode} ➔ ${r.toCode}
    </span>
  `).join('');
}

window.applyRecentRoute = function(fromVal, toVal) {
  const fromInput = document.getElementById("hubFromStation");
  const toInput = document.getElementById("hubToStation");
  if (fromInput) fromInput.value = fromVal;
  if (toInput) toInput.value = toVal;
  const form = document.getElementById("formBetweenStations");
  if (form) form.dispatchEvent(new Event("submit"));
};
