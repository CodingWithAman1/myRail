const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      cartoApiKey: process.env.CARTO_API_KEY || "cb1_4hmw_1_fe7247cc1da86e7d4ee8f2ad",
    }),
  };
};
