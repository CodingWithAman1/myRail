// ==========================================
// MyRail - Shared Utilities & Navigation
// ==========================================

// 1. Live IST Clock
function updateClock() {
  const clockEl = document.getElementById("clock");
  if (!clockEl) return;

  const now = new Date();
  
  // Format in Indian Standard Time (IST)
  const options = {
    timeZone: "Asia/Kolkata",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric"
  };

  try {
    const formatter = new Intl.DateTimeFormat("en-IN", options);
    clockEl.textContent = formatter.format(now);
  } catch (e) {
    let date = now.getDate().toString().padStart(2, "0");
    let month = (now.getMonth() + 1).toString().padStart(2, "0");
    let year = now.getFullYear();
    let hours = now.getHours();
    let minutes = now.getMinutes().toString().padStart(2, "0");
    let seconds = now.getSeconds().toString().padStart(2, "0");
    let session = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    clockEl.textContent = `${date}/${month}/${year} ${hours}:${minutes}:${seconds} ${session}`;
  }
}
updateClock();
setInterval(updateClock, 1000);

// 2. Mobile Navigation Toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("navToggle");
  const navMenu = document.getElementById("home_nav");
  
  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener("click", () => {
      navMenu.classList.toggle("open");
      toggleBtn.setAttribute("aria-expanded", navMenu.classList.contains("open"));
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
        navMenu.classList.remove("open");
      }
    });
  }
});

// ========================================================
// Universal Safe API Fetcher (Supports Express & Netlify)
// ========================================================
window.apiFetch = async function(endpoint, options = {}) {
  // Convert /api/ endpoints to Netlify functions fallback if necessary
  function getFallbackUrl(url) {
    if (url.startsWith("/api/trains-between")) {
      return url.replace("/api/trains-between", "/.netlify/functions/trains-between");
    }
    if (url.startsWith("/api/train-live")) {
      return url.replace("/api/train-live", "/.netlify/functions/train-live");
    }
    if (url.startsWith("/api/train/")) {
      const parts = url.split("?")[0].split("/").filter(Boolean);
      const tn = parts[parts.length - 1];
      return `/.netlify/functions/train?trainNumber=${encodeURIComponent(tn)}`;
    }
    if (url.startsWith("/api/train?")) {
      return url.replace("/api/train?", "/.netlify/functions/train?");
    }
    if (url.startsWith("/api/stations/search")) {
      return url.replace("/api/stations/search", "/.netlify/functions/stations-search");
    }
    if (url.startsWith("/api/pnr/")) {
      const parts = url.split("?")[0].split("/").filter(Boolean);
      const pnrNum = parts[parts.length - 1];
      return `/.netlify/functions/pnr?pnr=${encodeURIComponent(pnrNum)}`;
    }
    if (url.startsWith("/api/config")) {
      return "/.netlify/functions/config";
    }
    return url.replace("/api/", "/.netlify/functions/");
  }

  let res = null;
  let usedFallback = false;

  try {
    res = await fetch(endpoint, options);
  } catch (netErr) {
    // Network error on primary endpoint, try fallback
    const fb = getFallbackUrl(endpoint);
    if (fb !== endpoint) {
      res = await fetch(fb, options);
      usedFallback = true;
    } else {
      throw netErr;
    }
  }

  // If 404 on /api/, automatically retry with Netlify Function path
  if (res.status === 404 && endpoint.startsWith("/api/") && !usedFallback) {
    const fb = getFallbackUrl(endpoint);
    if (fb !== endpoint) {
      const fbRes = await fetch(fb, options);
      const fbType = fbRes.headers.get("content-type") || "";
      if (fbRes.ok || fbType.includes("application/json")) {
        res = fbRes;
      }
    }
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: Not Found`);
    }
    throw new Error("Invalid non-JSON response received from server.");
  }

  const data = await res.json();
  return { res, data };
};

// ========================================================
// Client-Side Station Database Cache (Instant Autocomplete)
// ========================================================
let _cachedStations = null;
let _stationLoadingPromise = null;

async function loadStationDatabase() {
  if (_cachedStations) return _cachedStations;
  if (_stationLoadingPromise) return _stationLoadingPromise;

  _stationLoadingPromise = (async () => {
    try {
      const res = await fetch("stationDatabase.json");
      if (res.ok) {
        const raw = await res.json();
        _cachedStations = Object.entries(raw).map(([code, name]) => ({
          code,
          name,
          searchStr: `${code} ${name}`.toLowerCase(),
        }));
        return _cachedStations;
      }
    } catch (e) {
      console.warn("Could not preload stationDatabase.json, falling back to API search.");
    }
    return null;
  })();

  return _stationLoadingPromise;
}

// Start preloading stations database in idle time
if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => loadStationDatabase());
  } else {
    setTimeout(loadStationDatabase, 500);
  }
}

// 3. Station Autocomplete Helper
class StationAutocomplete {
  constructor(inputEl, onSelect) {
    this.input = inputEl;
    this.onSelect = onSelect;
    this.container = null;
    this.debounceTimer = null;
    this.selectedIndex = -1;
    this.items = [];
    this.init();
  }

  init() {
    if (!this.input) return;
    
    // Create dropdown wrapper
    this.input.setAttribute("autocomplete", "off");
    const parent = this.input.parentElement;
    parent.style.position = "relative";

    this.container = document.createElement("div");
    this.container.className = "station-autocomplete-dropdown";
    parent.appendChild(this.container);

    this.input.addEventListener("input", () => {
      clearTimeout(this.debounceTimer);
      const query = this.input.value.trim();
      if (query.length < 1) {
        this.hide();
        return;
      }
      this.debounceTimer = setTimeout(() => this.search(query), 120);
    });

    this.input.addEventListener("keydown", (e) => this.handleKeydown(e));
    this.input.addEventListener("focus", () => {
      loadStationDatabase(); // Ensure cached database is ready
      if (this.input.value.trim().length >= 1 && this.items.length > 0) {
        this.show();
      }
    });

    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target) && e.target !== this.input) {
        this.hide();
      }
    });
  }

  async search(query) {
    const q = query.toLowerCase();

    // 1. Fast client-side search if database is available
    if (_cachedStations && _cachedStations.length > 0) {
      const exact = [];
      const startsWithCode = [];
      const startsWithName = [];
      const others = [];

      for (let i = 0; i < _cachedStations.length; i++) {
        const st = _cachedStations[i];
        const codeLower = st.code.toLowerCase();
        const nameLower = st.name.toLowerCase();

        if (codeLower === q) {
          exact.push(st);
        } else if (codeLower.startsWith(q)) {
          startsWithCode.push(st);
        } else if (nameLower.startsWith(q)) {
          startsWithName.push(st);
        } else if (st.searchStr.includes(q)) {
          others.push(st);
        }

        if (exact.length + startsWithCode.length + startsWithName.length + others.length >= 25) {
          break;
        }
      }

      this.items = [...exact, ...startsWithCode, ...startsWithName, ...others]
        .slice(0, 15)
        .map(({ code, name }) => ({ code, name }));
      this.render();
      return;
    }

    // 2. Fallback to API search
    try {
      const { res, data } = await window.apiFetch(`/api/stations/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      this.items = Array.isArray(data) ? data : [];
      this.render();
    } catch (err) {
      console.warn("Station autocomplete error:", err);
    }
  }

  render() {
    this.container.innerHTML = "";
    this.selectedIndex = -1;

    if (!this.items || this.items.length === 0) {
      this.hide();
      return;
    }

    this.items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "autocomplete-item";
      div.innerHTML = `
        <span class="station-code-badge">${item.code}</span>
        <span class="station-name-text">${item.name}</span>
      `;
      div.addEventListener("click", () => this.selectItem(item));
      this.container.appendChild(div);
    });

    this.show();
  }

  handleKeydown(e) {
    const list = this.container.querySelectorAll(".autocomplete-item");
    if (!list.length || this.container.style.display === "none") return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % list.length;
      this.highlight(list);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + list.length) % list.length;
      this.highlight(list);
    } else if (e.key === "Enter") {
      if (this.selectedIndex >= 0 && this.selectedIndex < this.items.length) {
        e.preventDefault();
        this.selectItem(this.items[this.selectedIndex]);
      }
    } else if (e.key === "Escape") {
      this.hide();
    }
  }

  highlight(list) {
    list.forEach((el, i) => {
      el.classList.toggle("selected", i === this.selectedIndex);
      if (i === this.selectedIndex) {
        el.scrollIntoView({ block: "nearest" });
      }
    });
  }

  selectItem(item) {
    this.input.value = `${item.name} (${item.code})`;
    this.input.dataset.stationCode = item.code;
    this.hide();
    if (this.onSelect) this.onSelect(item);
  }

  show() {
    if (this.items.length) this.container.style.display = "block";
  }

  hide() {
    this.container.style.display = "none";
    this.selectedIndex = -1;
  }
}

// 4. Toast Notifications
function showToast(message, type = "info") {
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === "success" ? "✓" : type === "error" ? "⚠" : "ℹ"}</span>
    <span class="toast-message">${message}</span>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 5. Recent Searches Helper
const RecentSearches = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(`myrail_recent_${key}`)) || [];
    } catch {
      return [];
    }
  },
  add(key, item) {
    try {
      let list = this.get(key);
      list = list.filter(i => JSON.stringify(i) !== JSON.stringify(item));
      list.unshift(item);
      list = list.slice(0, 6);
      localStorage.setItem(`myrail_recent_${key}`, JSON.stringify(list));
    } catch (e) {
      console.warn("Could not save recent search:", e);
    }
  }
};
