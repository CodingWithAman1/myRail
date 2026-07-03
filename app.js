
async function getTrainData(trainNumber) {
  if (!trainNumber) {
    const el = document.getElementById("trainNumber");
    trainNumber = el ? el.value.trim() : "12919";
  }

  try {
    const response = await fetch(`/.netlify/functions/train?trainNumber=${trainNumber}`);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    if(document.getElementById("trainInfo")) {
        document.getElementById("trainInfo").remove();
    }
    let trainInfoDiv = document.createElement("div");
    trainInfoDiv.id = "trainInfo";
    document.getElementById("trainResult").appendChild(trainInfoDiv);
    trainInfoDiv.innerHTML = `<h2>Train Information for ${trainNumber}</h2>
      <p><strong>Name:</strong> ${data.data.train.name || "N/A"}</p>
      <p><strong>Number:</strong> ${data.data.train.number || "N/A"}</p>
      <p><strong>Source:</strong> ${data.data.train.source.name || "N/A"}</p>
      <p><strong>Destination:</strong> ${data.data.train.destination.name || "N/A"}</p>
      <p><strong>Running Days:</strong> ${data.data.train.runDays || "N/A"}</p>
        <p><strong>Train Type:</strong> ${data.data.train.type || "N/A"}</p>
        <p><strong>Halts:</strong></p>
<table>
    

    <thead>
        <tr>
            <th>Station</th>
            <th>Arrival</th>
            <th>Departure</th>
        </tr>
    </thead>

    <tbody id="routeBody"></tbody>
</table></strong></p>`;
  

const routeBody = document.getElementById("routeBody");
    for (let i = 0; i < data.data.route.length; i++) {
    routeBody.innerHTML += `
        <tr>
            <td>${data.data.route[i].station.name || "N/A"}</td>
            <td>${data.data.route[i].arrival || "N/A"}</td>
            <td>${data.data.route[i].departure || "N/A"}</td>
        </tr>
    `;
}
    return data;
  } catch (error) {
    console.error("Failed to load train data:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm") || document.querySelector("form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const tn = document.getElementById("trainNumber").value.trim();
      getTrainData(tn);

    });
  }
});

