
// Station database with codes
let stationDatabase = {};

// Load station database from JSON file
async function loadStationDatabase() {
  try {
    const response = await fetch('/stationDatabase.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    stationDatabase = await response.json();
    console.log('Station database loaded:', stationDatabase);
    populateStationDatalist();
  } catch (error) {
    console.error('Failed to load station database:', error);
  }
}

// Populate datalist with station options
function populateStationDatalist() {
  const stationList = document.getElementById('stationList');
  if (!stationList) {
    console.error('stationList datalist not found');
    return;
  }

  // Clear existing options
  stationList.innerHTML = '';

  // Add options for each station in the database
  // Database format is now: "CODE": "Station Name"
  for (const [code, stationName] of Object.entries(stationDatabase)) {
    // Add option with station name and code format
    const option1 = document.createElement('option');
    option1.value = `${stationName} (${code})`;
    option1.textContent = `${stationName} (${code})`;
    stationList.appendChild(option1);

    // Add option with just the station code
    const option2 = document.createElement('option');
    option2.value = code;
    option2.textContent = code;
    stationList.appendChild(option2);
  }
  
  console.log('Datalist populated with', stationList.children.length, 'options');
}

// Initialize database when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadStationDatabase);
} else {
  loadStationDatabase();
}

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
    // Check if this code exists in the database
    if (stationDatabase[trimmed]) {
      return trimmed;
    }
  }
  
  // Otherwise, search for station name in the database (reverse lookup)
  // Database format is now: "CODE": "Station Name"
  const inputLower = input.toLowerCase().trim();
  for (const [code, stationName] of Object.entries(stationDatabase)) {
    if (stationName.toLowerCase().includes(inputLower)) {
      return code;
    }
  }
  
  return null;
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


document.addEventListener("DOMContentLoaded", function () {
    loadStationDatabase();

    const form = document.getElementById("trainSearchForm");
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        getTrainData(
            document.getElementById("fromStation").value,
            document.getElementById("toStation").value,
            document.getElementById("travelDate").value
        );
    });

    document.getElementById("bookTrainsBtn").addEventListener("click", function () {
        bookTrain(
            document.getElementById("fromStation").value,
            document.getElementById("toStation").value,
            document.getElementById("travelDate").value
        );
    });
});
async function bookTrain(fromStation, toStation, date) {
  const resultDiv = document.getElementById("trainsResult");
  
  if (!fromStation || !toStation || !date) {
    resultDiv.innerHTML = '<p style="color: red;">Please fill in all fields.</p>';
    return;
  }

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
   const [year, month, day] = date.split("-");
  const bookingDate = `${day}-${month}-${year}`;
  resultDiv.innerHTML = '<p>Loading trains...</p>';
 window.open(
  `https://www.confirmtkt.com/rbooking/trains/from/${fromCode}/to/${toCode}/${bookingDate}`,
  "_blank",
  "noopener,noreferrer"
);
  getTrainData(fromStation, toStation, date);
}