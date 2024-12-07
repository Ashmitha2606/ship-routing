// Initialize the map using Leaflet with OpenStreetMap tiles
const map = L.map("map").setView([-20.0, 60.0], 5); // Centered on the Indian Ocean

// Add OpenStreetMap tiles to the map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(map);

const routes = {
  "mumbai-mombasa": {
    route: [
      [18.76, 72.70], // Offshore Mumbai (Arabian Sea)
      [15.0, 70.0],   // Mid Arabian Sea
      [5.0, 60.0],    // Open Indian Ocean waypoint
      [-1.0, 45.0],   // Another ocean waypoint, avoiding land
      [-4.0435, 39.6682] // Mombasa (Kenya)
    ],
    destination: [-4.0435, 39.6682] // Mombasa
  },
  "chennai-durban": {
    route: [
      [13.0827, 80.2707], // Chennai
      [10.0, 80.0],       // Waypoint southeast of Chennai
      [-10.0, 75.0],      // Waypoint in the southern Indian Ocean, avoiding Madagascar
      [-20.0, 70.0],      // Further west, keeping clear of Madagascar
      [-25.0, 55.0],      // Even further west, moving towards the southern tip of Africa
      [-30.0, 45.0],      // Approaching the coast of South Africa
      [-29.8587, 31.0218] // Durban
    ],
    destination: [-29.8587, 31.0218] // Durban
  },
  "kochi-colombo": {
    route: [
      [9.65, 76.2],   // Slightly further offshore Kochi (Arabian Sea)
      [8.5, 76.5],    // First waypoint in the open sea, southwest of India
      [7.5, 78.0],    // Waypoint closer to Sri Lanka, avoiding land
      [6.5, 79.0],    // Nearshore waypoint, closer to Colombo but still at sea
      [6.9271, 79.8612] // Colombo
    ],
    destination: [6.9271, 79.8612] // Colombo
  }
};

// Fuel efficiency in liters per nautical mile
const fuelEfficiency = 8.5; 

// Function to calculate distance using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c; // Distance in km
  const distanceNm = distanceKm * 0.539957; // Convert to nautical miles
  return distanceNm;
}

// Convert degrees to radians
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Function to update the fuel dashboard
function updateFuelDashboard(lat1, lon1, lat2, lon2) {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  const fuelConsumption = distance * fuelEfficiency;
  const estimatedTime = (distance / 12).toFixed(2); // Assuming average speed is 12 knots

  document.querySelector("#dashboard .card").innerHTML = `
    <p><strong>Distance:</strong> ${distance.toFixed(2)} Nautical Miles</p>
    <p><strong>Fuel Consumption:</strong> ${fuelConsumption.toFixed(2)} L</p>
    <p><strong>Estimated Travel Time:</strong> ${estimatedTime} hours</p>
  `;
}

// Function to fetch weather data based on coordinates
function fetchWeatherData(lat, lon, callback) {
  const apiKey = "494d383d0c2c5b260c22cbf34a679fdb"; // Replace with your actual API key
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      callback(data);
    })
    .catch((error) => {
      console.error(`Error fetching weather data: ${error.message}`);
    });
}

// Function to draw the selected route on the map
function drawRoute(route) {
  map.eachLayer(function (layer) {
    if (layer instanceof L.Polyline) {
      map.removeLayer(layer); // Remove previous route
    }
  });

  L.polyline(route, { color: "#FF3300", weight: 5 }).addTo(map);
}

// Function to clear weather icons from the map
function clearWeatherIcons() {
  map.eachLayer(function (layer) {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer); // Remove previous weather icons
    }
  });
}

// Function to add weather icons to route points
function addWeatherIcons(route) {
  clearWeatherIcons(); // Clear previous weather icons

  route.forEach(([lat, lon]) => {
    fetchWeatherData(lat, lon, (data) => {
      const iconUrl = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
      L.marker([lat, lon], {
        icon: L.icon({
          iconUrl: iconUrl,
          iconSize: [32, 32], // Size of the icon
          iconAnchor: [16, 32], // Anchor position of the icon
        })
      }).addTo(map);
    });
  });
}

// Event listener for route selection change
document.getElementById("route-selector").addEventListener("change", function () {
  const selectedRoute = this.value;
  const routeData = routes[selectedRoute];

  // Draw the selected route on the map
  drawRoute(routeData.route);

  // Add weather icons to the route
  addWeatherIcons(routeData.route);

  // Fetch weather data for the destination
  const [lat, lon] = routeData.destination; // Get destination coordinates
  fetchWeatherData(lat, lon, (data) => {
    const weatherInfo = `
      <p><strong>Weather:</strong> ${data.weather[0].description}</p>
      <p><strong>Temperature:</strong> ${data.main.temp}°C</p>
      <p><strong>Wind Speed:</strong> ${data.wind.speed} m/s</p>
    `;
    document.getElementById("weather-info").innerHTML = weatherInfo;
  });

  // Update the fuel dashboard based on distance
  const [lat1, lon1] = routeData.route[0]; // Get origin coordinates
  updateFuelDashboard(lat1, lon1, ...routeData.destination); // Update fuel info
});

// Initial setup for route and weather data (Mumbai to Mombasa)
const initialRoute = routes["mumbai-mombasa"];
drawRoute(initialRoute.route);
addWeatherIcons(initialRoute.route);
fetchWeatherData(...initialRoute.destination, (data) => {
  const weatherInfo = `
    <p><strong>Weather:</strong> ${data.weather[0].description}</p>
    <p><strong>Temperature:</strong> ${data.main.temp}°C</p>
    <p><strong>Wind Speed:</strong> ${data.wind.speed} m/s</p>
  `;
  document.getElementById("weather-info").innerHTML = weatherInfo;
});
updateFuelDashboard(...initialRoute.route[0], ...initialRoute.destination); // Update fuel info


