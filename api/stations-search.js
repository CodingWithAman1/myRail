const path = require("path");
const fs = require("fs");

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

let stationsList = null;

function loadStations() {
  if (stationsList) return stationsList;
  try {
    const candidates = [
      path.resolve(__dirname, "../../stationDatabase.json"),
      path.resolve(__dirname, "./stationDatabase.json"),
      path.resolve(process.cwd(), "stationDatabase.json"),
    ];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        stationsList = Object.entries(raw).map(([code, name]) => ({
          code,
          name,
          searchStr: `${code} ${name}`.toLowerCase(),
        }));
        return stationsList;
      }
    }
  } catch (err) {
    console.error("Error loading station database:", err);
  }
  return [];
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  const q = (event.queryStringParameters?.q || "").trim().toLowerCase();
  if (!q || q.length < 1) {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify([]),
    };
  }

  const list = loadStations();
  const exact = [];
  const startsWithCode = [];
  const startsWithName = [];
  const others = [];

  for (let i = 0; i < list.length; i++) {
    const st = list[i];
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

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(results),
  };
};
