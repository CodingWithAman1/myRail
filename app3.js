// ==========================================
// MyRail - Trains Between Stations (app3.js)
// ==========================================

let allTrainsData = [];
let routeMeta = {};

document.addEventListener("DOMContentLoaded", () => {
  initStations();
  initSwap();
  initDatePresets();
  initSearchForm();
  initFiltersAndSorting();

  // Check URL parameters for direct search
  const urlParams = new URLSearchParams(window.location.search);
  const fromParam = urlParams.get("from");
  const toParam = urlParams.get("to");
  const dateParam = urlParams.get("date");

  if (fromParam && toParam) {
    const fromInput = document.getElementById("fromStation");
    const toInput = document.getElementById("toStation");
    const dateInput = document.getElementById("travelDate");
    if (fromInput) fromInput.value = fromParam;
    if (toInput) toInput.value = toParam;
    if (dateInput && dateParam) dateInput.value = dateParam;
    fetchTrainsBetween(fromParam, toParam, dateParam || "");
  }
});

function initStations() {
  const fromInput = document.getElementById("fromStation");
  const toInput = document.getElementById("toStation");

  if (fromInput) new StationAutocomplete(fromInput);
  if (toInput) new StationAutocomplete(toInput);
}

function initSwap() {
  const swapBtn = document.getElementById("swapStationsBtn");
  const fromInput = document.getElementById("fromStation");
  const toInput = document.getElementById("toStation");

  if (swapBtn && fromInput && toInput) {
    swapBtn.addEventListener("click", () => {
      const temp = fromInput.value;
      fromInput.value = toInput.value;
      toInput.value = temp;
    });
  }
}

function initDatePresets() {
  const dateInput = document.getElementById("travelDate");
  const chips = document.querySelectorAll(".quick-date-chips .date-chip");
  if (!dateInput) return;

  const today = new Date();
  if (!dateInput.value) dateInput.value = today.toISOString().split("T")[0];

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

function extractCode(val) {
  if (!val) return "";
  const match = val.trim().toUpperCase().match(/\(([A-Z]{2,5})\)$/);
  if (match) return match[1];
  if (/^[A-Z]{2,5}$/.test(val.trim().toUpperCase())) return val.trim().toUpperCase();
  return val.trim();
}

function initSearchForm() {
  const form = document.getElementById("trainSearchForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fromVal = document.getElementById("fromStation").value;
    const toVal = document.getElementById("toStation").value;
    const dateVal = document.getElementById("travelDate").value;

    const fromCode = extractCode(fromVal);
    const toCode = extractCode(toVal);

    if (!fromCode || !toCode) {
      showToast("Please enter valid From and To stations", "error");
      return;
    }

    RecentSearches.add("routes", { fromVal, toVal, fromCode, toCode });
    fetchTrainsBetween(fromCode, toCode, dateVal);
  });
}

async function fetchTrainsBetween(fromCode, toCode, date) {
  const resultsDiv = document.getElementById("trainsResult");
  const filterSection = document.getElementById("filterSection");
  if (!resultsDiv) return;

  if (filterSection) filterSection.style.display = "none";

  resultsDiv.innerHTML = `
    <div class="spinner-wrap">
      <div class="railway-spinner"></div>
      <p style="font-weight:600; color:var(--text-muted); margin-top:12px;">Searching trains from ${fromCode} to ${toCode}...</p>
    </div>
  `;

  try {
    let url = `/api/trains-between?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}`;
    if (date) url += `&date=${encodeURIComponent(date)}`;

    const { res, data } = await window.apiFetch(url);

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Unable to find trains for this route.");
    }

    allTrainsData = data.data.trains || [];
    routeMeta = {
      from: data.data.from,
      to: data.data.to,
      count: data.data.count,
      date: date
    };

    if (filterSection) filterSection.style.display = "flex";
    applyFiltersAndRender();
  } catch (err) {
    resultsDiv.innerHTML = `
      <div style="background:#ffffff; border-radius:var(--radius-lg); border:1px solid #fecaca; padding:32px; text-align:center;">
        <h3 style="font-family:'Outfit'; font-size:1.3rem; color:#b91c1c; margin-bottom:8px;">No Trains Found</h3>
        <p style="color:var(--text-muted);">${err.message}</p>
      </div>
    `;
  }
}

function initFiltersAndSorting() {
  const filterType = document.getElementById("filterTrainType");
  const sortBy = document.getElementById("sortTrainsBy");

  if (filterType) filterType.addEventListener("change", applyFiltersAndRender);
  if (sortBy) sortBy.addEventListener("change", applyFiltersAndRender);
}

function applyFiltersAndRender() {
  let list = [...allTrainsData];
  const typeFilter = document.getElementById("filterTrainType")?.value || "all";
  const sortMode = document.getElementById("sortTrainsBy")?.value || "duration";

  // Filter
  if (typeFilter !== "all") {
    list = list.filter(item => {
      const type = (item.train?.type || "").toLowerCase();
      const name = (item.train?.name || "").toLowerCase();
      if (typeFilter === "superfast") return type.includes("superfast");
      if (typeFilter === "express") return type.includes("express") && !type.includes("superfast");
      if (typeFilter === "premium") return name.includes("vande bharat") || name.includes("rajdhani") || name.includes("shatabdi") || name.includes("tejas");
      return true;
    });
  }

  // Sort
  if (sortMode === "duration") {
    list.sort((a, b) => (a.duration || 9999) - (b.duration || 9999));
  } else if (sortMode === "departure_asc") {
    list.sort((a, b) => (a.from?.departure || "").localeCompare(b.from?.departure || ""));
  } else if (sortMode === "departure_desc") {
    list.sort((a, b) => (b.from?.departure || "").localeCompare(a.from?.departure || ""));
  } else if (sortMode === "halts") {
    list.sort((a, b) => (a.totalHaltsBetween || 0) - (b.totalHaltsBetween || 0));
  }

  renderTrainCards(list);
}

function renderTrainCards(trains) {
  const container = document.getElementById("trainsResult");
  if (!container) return;

  if (!trains.length) {
    container.innerHTML = `
      <div style="background:#ffffff; padding:32px; border-radius:var(--radius-lg); text-align:center; border:1px solid var(--border-light);">
        <h4 style="font-family:'Outfit'; font-size:1.2rem; margin-bottom:6px;">No trains match selected filters</h4>
        <p style="color:var(--text-muted);">Try choosing "All Train Types".</p>
      </div>
    `;
    return;
  }

  const { from, to, date } = routeMeta;

  let html = `
    <div class="result-header-bar">
      <div class="result-title">
        <span>🚆 ${from.name} (${from.code}) ➔ ${to.name} (${to.code})</span>
        <span class="result-count-badge">${trains.length} Trains Shown</span>
      </div>
      <button onclick="bookTrainConfirmTkt('${from.code}', '${to.code}', '${date}')" class="btn-card-action book">
        <span>🎟️ Book via ConfirmTkt</span>
      </button>
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
    const isPremium = (train.name || "").toLowerCase().includes("vande bharat") || (train.name || "").toLowerCase().includes("rajdhani");

    html += `
      <div class="train-card">
        <div class="train-card-top">
          <div class="train-id-wrap">
            <span class="train-number">${train.number}</span>
            <span class="train-name">${train.name}</span>
          </div>
          <span class="train-type-badge ${isPremium ? 'vandebharat' : isSuperfast ? 'superfast' : ''}">
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
            <span style="font-size:0.75rem; font-weight:600; color:var(--text-muted); margin-right:4px;">Days:</span>
            ${dayKeys.map((k, i) => `
              <span class="day-badge ${runDays.includes(k) ? 'active' : ''}">${days[i]}</span>
            `).join('')}
          </div>

          <div class="card-actions">
            <button class="btn-card-action" onclick="toggleRouteHalts('${train.number}', '${index}')">
              <span>📋 Halts & Timetable</span>
            </button>
            <a class="btn-card-action primary" href="live.html?trainNumber=${train.number}">
              <span>🔴 Live Status</span>
            </a>
            <a class="btn-card-action book" target="_blank" rel="noopener noreferrer"
               href="https://www.confirmtkt.com/rbooking/trains/from/${from.code}/to/${to.code}/${formatDateConfirm(date)}">
              <span>🎟️ Book</span>
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

window.bookTrainConfirmTkt = function(fromCode, toCode, date) {
  const formatted = formatDateConfirm(date);
  window.open(`https://www.confirmtkt.com/rbooking/trains/from/${fromCode}/to/${toCode}/${formatted}`, "_blank", "noopener,noreferrer");
};

function formatDateConfirm(dateStr) {
  if (!dateStr) {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
  }
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
}