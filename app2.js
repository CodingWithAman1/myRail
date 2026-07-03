async function getTrainLive(trainNumber) {
    if (!trainNumber) {
        const el = document.getElementById("trainNumber");
        trainNumber = el ? el.value.trim() : "12919";
    }

    try {
        const response = await fetch(`/.netlify/functions/train-live?trainNumber=${trainNumber}`);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        console.log(data);

        if (document.getElementById("trainInfo")) {
            document.getElementById("trainInfo").remove();
        }

        const trainInfoDiv = document.createElement("div");
        trainInfoDiv.id = "trainInfo";
        document.getElementById("trainLive").appendChild(trainInfoDiv);

        trainInfoDiv.innerHTML = `
            <h2>🚆 Live Status</h2>

            <p><strong>Train:</strong> ${data.data.train.name}</p>
            <p><strong>Train No:</strong> ${data.data.train.number}</p>
            <p><strong>Status:</strong> ${data.data.status}</p>
            <p><strong>Delay:</strong> ${data.data.delayMinutes} min</p>
            <p><strong>Current Location:</strong> ${data.data.currentLocation.stationCode}</p>
            <p><strong>Current Status:</strong> ${data.data.currentLocation.status}</p>`
        if(data.data.previousHalt && data.data.previousHalt.stationName) {
            trainInfoDiv.innerHTML += `
            <p><strong>Previous Station:</strong> ${data.data.previousHalt.stationName}</p>`
        }
        if(data.data.nextHalt && data.data.nextHalt.stationName) {
            trainInfoDiv.innerHTML += `
            <p><strong>Next Station:</strong> ${data.data.nextHalt.stationName}</p>`
        }
            trainInfoDiv.innerHTML += `
            <p><strong>Last Updated:</strong> ${data.data.lastUpdatedAt}</p>

            <h3>Route</h3>
            <div class="route-table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th class="track-heading">Track</th>
                            <th>Station</th>
                            <th>Scheduled Arrival</th>
                            <th>Scheduled Departure</th>
                            <th>Delay Arrival (min)</th>
                            <th>Delay Departure (min)</th>
                        </tr>
                    </thead>
                    <tbody id="routeBody"></tbody>
                </table>
            </div>
        `;

        const routeBody = document.getElementById("routeBody");
        console.log("Current Location:", data.data.currentLocation.stationName);
        for (let i = 0; i < data.data.route.length; i++) {
            const routeStop = data.data.route[i];
            const isCurrentLocation = routeStop.stationCode === data.data.currentLocation.stationCode;
            const isHalt = routeStop.isHalt || routeStop.halt || routeStop.halt === 1;
            const trackDot = isCurrentLocation
                ? '<span class="track-dot-current"></span>'
                : isHalt
                    ? '<span class="track-dot"></span>'
                    : '';

            if (isCurrentLocation) {
                routeBody.innerHTML += `
        <tr class="current-location">
            <td class="track-cell">${trackDot}</td>
            <td>${routeStop.stationName || "N/A"}</td>
            <td>${routeStop.scheduledArrival || "N/A"}</td>
            <td>${routeStop.scheduledDeparture || "N/A"}</td>
            <td>${routeStop.delayArrival || "N/A"}</td>
            <td>${routeStop.delayDeparture || "N/A"}</td>
        </tr>
    `;
            } else if (routeStop.delayArrival > 0 || routeStop.delayDeparture > 0) {
                routeBody.innerHTML += `
        <tr class="delayed">
            <td class="track-cell">${trackDot}</td>
            <td>${routeStop.stationName || "N/A"}</td>
            <td>${routeStop.scheduledArrival || "N/A"}</td>
            <td>${routeStop.scheduledDeparture || "N/A"}</td>
            <td>${routeStop.delayArrival || "N/A"}</td>
            <td>${routeStop.delayDeparture || "N/A"}</td>
        </tr>
    `;
            } else if (routeStop.delayArrival <= 0 && routeStop.delayDeparture <= 0) {
                routeBody.innerHTML += `
        <tr class="on-time">
            <td class="track-cell">${trackDot}</td>
            <td>${routeStop.stationName || "N/A"}</td>
            <td>${routeStop.scheduledArrival || "N/A"}</td>
            <td>${routeStop.scheduledDeparture || "N/A"}</td>
            <td>${routeStop.delayArrival || "N/A"}</td>
            <td>${routeStop.delayDeparture || "N/A"}</td>
        </tr>
    `;
            } else {
                routeBody.innerHTML += `
        <tr>
            <td class="track-cell">${trackDot}</td>
            <td>${routeStop.stationName || "N/A"}</td>
            <td>${routeStop.scheduledArrival || "N/A"}</td>
            <td>${routeStop.scheduledDeparture || "N/A"}</td>
            <td>${routeStop.delayArrival || "N/A"}</td>
            <td>${routeStop.delayDeparture || "N/A"}</td>
        </tr>
    `;
            }
        }
    } catch (error) {
        console.error(error);

        document.getElementById("trainLive").innerHTML = `
            <h3 style="color:red;">Unable to fetch live train status.</h3>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("searchForm");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const trainNumber = document.getElementById("trainNumber").value.trim();

        getTrainLive(trainNumber);
    });
});