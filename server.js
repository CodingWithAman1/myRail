require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const RAILRADAR_API_KEY = process.env.RAILRADAR_API_KEY || "rg_d1719f6cd41c4dd78e036a653edd2ae2";

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Simple in-memory cache with TTL
const cache = new Map();
function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}
function setCached(key, data, ttlSeconds = 300) {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// Load and index station database in memory for instant search
let stationsList = [];
try {
  const stationDataPath = path.join(__dirname, "stationDatabase.json");
  if (fs.existsSync(stationDataPath)) {
    const rawData = JSON.parse(fs.readFileSync(stationDataPath, "utf-8"));
    stationsList = Object.entries(rawData).map(([code, name]) => ({
      code,
      name,
      searchStr: `${code} ${name}`.toLowerCase(),
    }));
    console.log(`[MyRail] Indexed ${stationsList.length} stations in memory.`);
  }
} catch (err) {
  console.error("[MyRail] Error loading station database:", err);
}

// Helper to query RailRadar API
async function fetchRailRadar(endpoint) {
  const url = `https://api.railradar.in/v1/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${RAILRADAR_API_KEY}`,
      "Accept": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `RailRadar returned ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.details = data;
    throw err;
  }
  return data;
}

// 1. Station Search Autocomplete Endpoint
app.get("/api/stations/search", (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  if (!q || q.length < 1) {
    return res.json([]);
  }

  // Exact code match first, then prefix, then includes
  const exact = [];
  const startsWithName = [];
  const startsWithCode = [];
  const others = [];

  for (let i = 0; i < stationsList.length; i++) {
    const st = stationsList[i];
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

  const results = [...exact, ...startsWithCode, ...startsWithName, ...others]
    .slice(0, 15)
    .map(({ code, name }) => ({ code, name }));

  res.json(results);
});

// 2. Train Information & Schedule Route (Supports both /api/train/:trainNumber and /api/train?trainNumber=)
async function handleTrainInfo(req, res) {
  const trainNumber = (req.params.trainNumber || req.query.trainNumber || "").trim();
  if (!trainNumber) {
    return res.status(400).json({ success: false, error: "Train number is required" });
  }

  const cacheKey = `train_info_${trainNumber}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const data = await fetchRailRadar(`trains/${encodeURIComponent(trainNumber)}?haltsOnly=true`);
    setCached(cacheKey, data, 900); // 15 mins cache
    res.json(data);
  } catch (error) {
    console.error(`[MyRail API] Error fetching train ${trainNumber}:`, error.message);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || "Unable to fetch train information.",
      details: error.details,
    });
  }
}
app.get("/api/train/:trainNumber", handleTrainInfo);
app.get("/api/train", handleTrainInfo);

// 3. Live Train Status (Supports both /api/train/:trainNumber/live and /api/train-live?trainNumber=)
async function handleTrainLive(req, res) {
  const trainNumber = (req.params.trainNumber || req.query.trainNumber || "").trim();
  let date = (req.query.date || "").trim();

  if (!trainNumber) {
    return res.status(400).json({ success: false, error: "Train number is required" });
  }

  let endpoint = `trains/${encodeURIComponent(trainNumber)}/live`;
  if (date) {
    endpoint += `?date=${encodeURIComponent(date)}`;
  }

  const cacheKey = `train_live_${trainNumber}_${date || "today"}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const data = await fetchRailRadar(endpoint);
    setCached(cacheKey, data, 45); // 45 seconds cache for live status
    res.json(data);
  } catch (error) {
    console.error(`[MyRail API] Error fetching live status for ${trainNumber}:`, error.message);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || "Unable to fetch live train status.",
      details: error.details,
    });
  }
}
app.get("/api/train/:trainNumber/live", handleTrainLive);
app.get("/api/train-live", handleTrainLive);

// 4. Trains Between Stations (Supports /api/trains/between/:from/:to and /api/trains-between?from=&to=&date=)
async function handleTrainsBetween(req, res) {
  const from = (req.params.from || req.query.from || "").trim().toUpperCase();
  const to = (req.params.to || req.query.to || "").trim().toUpperCase();
  const date = (req.query.date || "").trim();

  if (!from || !to) {
    return res.status(400).json({ success: false, error: "Departure and arrival stations are required" });
  }

  let endpoint = `trains/between/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
  if (date) {
    endpoint += `?date=${encodeURIComponent(date)}`;
  }

  const cacheKey = `trains_between_${from}_${to}_${date || "all"}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const data = await fetchRailRadar(endpoint);
    setCached(cacheKey, data, 600); // 10 mins cache
    res.json(data);
  } catch (error) {
    console.error(`[MyRail API] Error fetching trains between ${from} and ${to}:`, error.message);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || "Unable to fetch trains between stations.",
      details: error.details,
    });
  }
}
app.get("/api/trains/between/:from/:to", handleTrainsBetween);
app.get("/api/trains-between", handleTrainsBetween);

// 5. PNR Status Enquiry Simulator / Helper
app.get("/api/pnr/:pnr", (req, res) => {
  const pnr = (req.params.pnr || req.query.pnr || "").trim();
  if (!/^\d{10}$/.test(pnr)) {
    return res.status(400).json({
      success: false,
      error: "Invalid PNR. PNR must be exactly 10 digits.",
    });
  }

  // Realistic verified response format
  const classes = ["3A", "2A", "SL", "CC"];
  const randomClass = classes[Math.floor(Math.random() * classes.length)];
  const coaches = randomClass === "3A" ? ["B1", "B2", "B3"] : randomClass === "2A" ? ["A1", "A2"] : ["S3", "S4", "S5"];
  const selectedCoach = coaches[Math.floor(Math.random() * coaches.length)];

  res.json({
    success: true,
    data: {
      pnr,
      trainNumber: "12919",
      trainName: "Malwa SF Express",
      bookingDate: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
      journeyDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
      fromStation: { code: "UJN", name: "Ujjain Jn" },
      toStation: { code: "NDLS", name: "New Delhi" },
      class: randomClass,
      chartStatus: "Chart Not Prepared",
      passengers: [
        {
          number: 1,
          bookingStatus: "CNF",
          currentStatus: "CNF",
          coach: selectedCoach,
          berth: Math.floor(Math.random() * 64) + 1,
          berthType: "Lower",
        },
        {
          number: 2,
          bookingStatus: "CNF",
          currentStatus: "CNF",
          coach: selectedCoach,
          berth: Math.floor(Math.random() * 64) + 2,
          berthType: "Middle",
        },
      ],
    },
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "MyRail",
    timestamp: new Date().toISOString(),
    stationsCount: stationsList.length,
    cachedKeys: cache.size,
  });
});

app.listen(PORT, () => {
  console.log(`🚆 MyRail Server running smoothly at http://localhost:${PORT}`);
});
