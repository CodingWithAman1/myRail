require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const RAILRADAR_API_KEY = process.env.RAILRADAR_API_KEY;

if (!RAILRADAR_API_KEY) {
  console.error("Missing RAILRADAR_API_KEY. Set it in an environment variable or .env file.");
  process.exit(1);
}

app.use(express.static(__dirname));

app.get("/api/train/:trainNumber", async (req, res) => {
  const trainNumber = encodeURIComponent(req.params.trainNumber);
  const url = `https://api.railradar.in/v1/trains/${trainNumber}?haltsOnly=true`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${RAILRADAR_API_KEY}`,
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("RailRadar proxy error:", error);
    res.status(500).json({ error: "Unable to fetch train data." });
  }
});

app.get("/api/train/:trainNumber/live", async (req, res) => {
  const trainNumber = encodeURIComponent(req.params.trainNumber);
  const url = `https://api.railradar.in/v1/trains/${trainNumber}/live`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${RAILRADAR_API_KEY}`,
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("RailRadar proxy error (live):", error);
    res.status(500).json({ error: "Unable to fetch live train data." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
