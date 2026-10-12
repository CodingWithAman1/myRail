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

  let trainNumber = event.queryStringParameters?.trainNumber;
  if (!trainNumber && event.path) {
    const parts = event.path.split("/").filter(Boolean);
    for (const p of parts) {
      if (/^\d{4,5}$/.test(p)) {
        trainNumber = p;
        break;
      }
    }
  }

  const RAILRADAR_API_KEY = process.env.RAILRADAR_API_KEY || "rg_d1719f6cd41c4dd78e036a653edd2ae2";

  if (!trainNumber) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "trainNumber query parameter is required" }),
    };
  }

  try {
    const encodedTrainNumber = encodeURIComponent(trainNumber.trim());
    const url = `https://api.railradar.in/v1/trains/${encodedTrainNumber}?haltsOnly=true`;

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
    console.error("RailRadar proxy error (train):", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Unable to fetch train data." }),
    };
  }
};
