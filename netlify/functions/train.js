const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  const trainNumber = event.queryStringParameters?.trainNumber;
  const RAILRADAR_API_KEY = rg_d1719f6cd41c4dd78e036a653edd2ae2;

  if (!trainNumber) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "trainNumber query parameter is required" }),
    };
  }

  if (!RAILRADAR_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "RAILRADAR_API_KEY is not configured" }),
    };
  }

  try {
    const encodedTrainNumber = encodeURIComponent(trainNumber);
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
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    console.error("RailRadar proxy error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unable to fetch train data." }),
    };
  }
};
