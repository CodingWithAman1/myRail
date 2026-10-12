const fetch = require("node-fetch");

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  let from = event.queryStringParameters?.from?.toUpperCase();
  let to = event.queryStringParameters?.to?.toUpperCase();
  let date = event.queryStringParameters?.date;
  const RAILRADAR_API_KEY = process.env.RAILRADAR_API_KEY || "rg_d1719f6cd41c4dd78e036a653edd2ae2";

  // Also support path format /api/trains/between/:from/:to
  if ((!from || !to) && event.path) {
    const match = event.path.match(/between\/([A-Za-z]{2,5})\/([A-Za-z]{2,5})/i);
    if (match) {
      from = match[1].toUpperCase();
      to = match[2].toUpperCase();
    }
  }

  if (!from || !to) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Both 'from' and 'to' station codes are required" }),
    };
  }

  try {
    let url = `https://api.railradar.in/v1/trains/between/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
    if (date && date.trim()) {
      let normDate = date.trim();
      if (/^\d{2}-\d{2}-\d{4}$/.test(normDate)) {
        const [d, m, y] = normDate.split("-");
        normDate = `${y}-${m}-${d}`;
      }
      url += `?date=${encodeURIComponent(normDate)}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${RAILRADAR_API_KEY}`,
      },
    });

    const data = await response.json();
    return {
      statusCode: response.status,
      body: JSON.stringify(data),
      headers: corsHeaders,
    };
  } catch (error) {
    console.error("RailRadar proxy error (trains-between):", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Unable to fetch trains between stations." }),
    };
  }
};
