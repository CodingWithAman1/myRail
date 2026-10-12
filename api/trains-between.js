const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  const from = event.queryStringParameters?.from?.toUpperCase();
  const to = event.queryStringParameters?.to?.toUpperCase();
  const date = event.queryStringParameters?.date;
  const RAILRADAR_API_KEY = process.env.RAILRADAR_API_KEY || "rg_d1719f6cd41c4dd78e036a653edd2ae2";

  if (!from || !to) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "both 'from' and 'to' query parameters are required" }),
    };
  }

  try {
    let url = `https://api.railradar.in/v1/trains/between/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
    if (date) {
      url += `?date=${encodeURIComponent(date)}`;
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
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    console.error("RailRadar proxy error (trains-between):", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unable to fetch trains between stations." }),
    };
  }
};
