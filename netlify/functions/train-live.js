const fetch = require("node-fetch");

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function normalizeDate(d) {
  if (!d || !d.trim()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  }
  const trimmed = d.trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("-");
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  let trainNumber = event.queryStringParameters?.trainNumber;
  let rawDate = event.queryStringParameters?.date;

  if (!trainNumber && event.path) {
    const parts = event.path.split("/").filter(Boolean);
    for (const p of parts) {
      if (/^\d{4,5}$/.test(p)) {
        trainNumber = p;
        break;
      }
    }
  }

  if (!trainNumber) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "trainNumber query parameter is required" }),
    };
  }

  const date = normalizeDate(rawDate);
  const RAILRADAR_API_KEY = process.env.RAILRADAR_API_KEY || "rg_d1719f6cd41c4dd78e036a653edd2ae2";

  try {
    const encodedTrainNumber = encodeURIComponent(trainNumber.trim());
    const encodedDate = encodeURIComponent(date);
    const liveUrl = `https://api.railradar.in/v1/trains/${encodedTrainNumber}/live?date=${encodedDate}`;

    const liveRes = await fetch(liveUrl, {
      headers: {
        Authorization: `Bearer ${RAILRADAR_API_KEY}`,
      },
    });

    const liveData = await liveRes.json();

    if (liveRes.ok && liveData?.data) {
      // Enrich with station coordinates and coach layout from schedule
      try {
        const schedUrl = `https://api.railradar.in/v1/trains/${encodedTrainNumber}?haltsOnly=true`;
        const schedRes = await fetch(schedUrl, {
          headers: { Authorization: `Bearer ${RAILRADAR_API_KEY}` },
        });
        const schedData = await schedRes.json();

        if (schedData?.data) {
          if (!liveData.data.coachPosition && schedData.data.train?.coachPosition) {
            liveData.data.coachPosition = schedData.data.train.coachPosition;
          }
          if (!liveData.data.classes && schedData.data.train?.classes) {
            liveData.data.classes = schedData.data.train.classes;
          }

          const coordsMap = new Map();
          (schedData.data.route || []).forEach((st) => {
            if (st.station?.code && st.station?.lat != null && st.station?.lng != null) {
              coordsMap.set(st.station.code, {
                lat: st.station.lat,
                lng: st.station.lng,
                name: st.station.name,
                platform: st.platform,
              });
            }
          });

          if (liveData.data.route) {
            liveData.data.route.forEach((st) => {
              const c = coordsMap.get(st.stationCode);
              if (c) {
                st.lat = c.lat;
                st.lng = c.lng;
                if (!st.platform && c.platform) st.platform = c.platform;
              }
            });
          }

          if (liveData.data.currentLocation) {
            const cur = coordsMap.get(liveData.data.currentLocation.stationCode);
            if (cur) {
              liveData.data.currentLocation.lat = cur.lat;
              liveData.data.currentLocation.lng = cur.lng;
            }
          }
        }
      } catch (enrichErr) {
        console.warn("Could not enrich live data coordinates:", enrichErr.message);
      }
    }

    return {
      statusCode: liveRes.status,
      body: JSON.stringify(liveData),
      headers: corsHeaders,
    };
  } catch (error) {
    console.error("RailRadar proxy error (live):", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Unable to fetch live train data." }),
    };
  }
};
