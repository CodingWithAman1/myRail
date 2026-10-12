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
      this.debounceTimer = setTimeout(() => this.search(query), 150);
    });

    this.input.addEventListener("keydown", (e) => this.handleKeydown(e));
    this.input.addEventListener("focus", () => {
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
    try {
      const res = await fetch(`/api/stations/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      this.items = await res.json();
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

    this.items.forEach((item, index) => {
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
