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

  let pnr = event.queryStringParameters?.pnr;
  if (!pnr && event.path) {
    const parts = event.path.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (/^\d{10}$/.test(last)) {
      pnr = last;
    }
  }

  if (!pnr || !/^\d{10}$/.test(pnr.trim())) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: "Invalid PNR. PNR must be exactly 10 digits.",
      }),
    };
  }

  const pnrTrimmed = pnr.trim();
  const classes = ["3A", "2A", "SL", "CC"];
  const randomClass = classes[Math.floor(Math.random() * classes.length)];
  const coaches = randomClass === "3A" ? ["B1", "B2", "B3"] : randomClass === "2A" ? ["A1", "A2"] : ["S3", "S4", "S5"];
  const selectedCoach = coaches[Math.floor(Math.random() * coaches.length)];

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      data: {
        pnr: pnrTrimmed,
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
    }),
  };
};
