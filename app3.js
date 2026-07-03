
// Station database with codes
const stationDatabase = {
  "ujjain junction": "UJN",
  "ujn": "UJN",
  "ujjain": "UJN",
  "indore junction": "INDB",
  "indb": "INDB",
  "indore": "INDB",
  "delhi": "NDLS",
  "new delhi": "NDLS",
  "ndls": "NDLS",
  "mumbai": "CSTM",
  "mumbai central": "CSTM",
  "cstm": "CSTM",
  "bangalore": "SBC",
  "bengaluru": "SBC",
  "sbc": "SBC",
  "hyderabad": "HYD",
  "hyd": "HYD",
  "kolkata": "KOAA",
  "koaa": "KOAA",
  "chennai": "MAS",
  "mas": "MAS",
  "jaipur": "JP",
  "jp": "JP",
  "lucknow": "LKO",
  "lko": "LKO",
  "kanpur": "CNB",
  "cnb": "CNB",
  "agra": "AG",
  "ag": "AG",
  "pune": "PUNE",
  "ahmedabad": "ADI",
  "adi": "ADI",
  "surat": "ST",
  "st": "ST",
  "vadodara": "BRC",
  "brc": "BRC"
};

// Function to get station code from name or code
function getStationCode(input) {
  if (!input) return null;
  
  let trimmed = input.trim().toUpperCase();
  
  // Extract code from format "Station Name (CODE)"
  const codeMatch = trimmed.match(/\(([A-Z]{2,4})\)$/);
  if (codeMatch) {
    return codeMatch[1];
  }
  
  // If input is 3-4 characters, assume it's a station code
  if (trimmed.length <= 4 && /^[A-Z]{2,4}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Otherwise, look it up in the database
  const lowerInput = input.toLowerCase().trim();
  return stationDatabase[lowerInput] || null;
}

async function getTrainData(fromStation, toStation, date) {
  const resultDiv = document.getElementById("trainsResult");
  
  if (!fromStation || !toStation || !date) {
    resultDiv.innerHTML = '<p style="color: red;">Please fill in all fields.</p>';
    return;
  }

  // Convert station names/codes to codes
  const fromCode = getStationCode(fromStation);
  const toCode = getStationCode(toStation);
  
  if (!fromCode) {
    resultDiv.innerHTML = `<p style="color: red;">Invalid departure station: "${fromStation}"</p>`;
    return;
  }
  
  if (!toCode) {
    resultDiv.innerHTML = `<p style="color: red;">Invalid arrival station: "${toStation}"</p>`;
    return;
  }

  resultDiv.innerHTML = '<p>Loading trains...</p>';
  
  try {
    const response = await fetch(
      `https://api.railradar.in/v1/trains/between/${fromCode}/${toCode}?date=${date}`,
      { headers: { "Authorization": "Bearer rg_d1719f6cd41c4dd78e036a653edd2ae2" } }
    );
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    displayTrains(data);
  } catch (error) {
    console.error("Failed to load train data:", error);
    resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

function displayTrains(data) {
  const resultDiv = document.getElementById("trainsResult");
  
  if (!data.success || !data.data || !data.data.trains || data.data.trains.length === 0) {
    resultDiv.innerHTML = '<p>No trains found for this route.</p>';
    return;
  }

  const { from, to, trains, count } = data.data;
  
  let html = '<div id="trainsList">';
  html += `<div class="route-info">`;
  html += `<h2>${from.name} → ${to.name}</h2>`;
  html += `<p>Found <strong>${count}</strong> train(s)</p>`;
  html += `</div>`;
  
  for (let i = 0; i < trains.length; i++) {
    const item = trains[i];
    const train = item.train;
    const departure = item.from?.departure || "N/A";
    const arrival = item.to?.arrival || "N/A";
    const distance = item.distance || "N/A";
    const duration = item.duration ? `${item.duration} mins` : "N/A";
    const halts = item.totalHaltsBetween || 0;
    const runDays = train.runDays?.join(", ") || "N/A";
    
    html += `
      <div class="train-card">
        <h3>${train.number} - ${train.name}</h3>
        <p><strong>Type:</strong> ${train.type}</p>
        <p><strong>Departure:</strong> ${departure} | <strong>Arrival:</strong> ${arrival}</p>
        <p><strong>Distance:</strong> ${distance} km | <strong>Duration:</strong> ${duration}</p>
        <p><strong>Halts:</strong> ${halts}</p>
        <p><strong>Running Days:</strong> ${runDays}</p>
      </div>
    `;
  }
  
  html += '</div>';
  resultDiv.innerHTML = html;
}


document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("trainSearchForm");
  if (form) {
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      const fromStation = document.getElementById("fromStation").value;
      const toStation = document.getElementById("toStation").value;
      const travelDate = document.getElementById("travelDate").value;
      
      getTrainData(fromStation, toStation, travelDate);
    });
  }
});
