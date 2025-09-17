const timeEl = document.getElementById("time");
const dateEl = document.getElementById("date");
const currentWeatherItemsEl = document.getElementById("current-weather-items");
const timezone = document.getElementById("time-zone");
const countryEl = document.getElementById("country");
const weatherForecastEl = document.getElementById("weather-forecast");
const currentTempEl = document.getElementById("current-temp");
const locationDropdown = document.getElementById("location-dropdown");
const useCurrentLocationBtn = document.getElementById("use-current-location");
const locationSearch = document.getElementById("location-search");
const searchResults = document.getElementById("search-results");

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const API_KEY = "a84cb3c2d1005edd54ad1eca273f6e6c";

// Store locations in localStorage
let savedLocations = JSON.parse(localStorage.getItem("weatherLocations")) || [];

setInterval(() => {
  const time = new Date();
  const month = time.getMonth();
  const date = time.getDate();
  const day = time.getDay();
  const hour = time.getHours();
  const hoursIn12HrFormat = hour === 0 ? 12 : hour > 12 ? hour % 12 : hour;
  const minutes = time.getMinutes();
  const ampm = hour >= 12 ? "PM" : "AM";

  timeEl.innerHTML =
    (hoursIn12HrFormat < 10 ? "0" + hoursIn12HrFormat : hoursIn12HrFormat) +
    ":" +
    (minutes < 10 ? "0" + minutes : minutes) +
    `<span id="am-pm">${ampm}</span>`;

  dateEl.innerHTML = days[day] + ", " + months[month] + " " + date;
}, 1000);

// Initialize the app
init();

function init() {
  console.log("Initializing weather app...");
  console.log("Location dropdown element:", locationDropdown);
  console.log("Use current location button:", useCurrentLocationBtn);

  loadSavedLocations();
  setupEventListeners();

  // Try to get current location on first load
  if (navigator.geolocation) {
    console.log("Getting current location on init...");
    getCurrentLocation();
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}

function setupEventListeners() {
  console.log("Setting up event listeners...");
  if (useCurrentLocationBtn) {
    useCurrentLocationBtn.addEventListener("click", () => {
      console.log("Use current location button clicked");
      getCurrentLocation();
    });
  } else {
    console.error("Use current location button not found!");
  }

  if (locationDropdown) {
    locationDropdown.addEventListener("change", () => {
      console.log("Location dropdown changed");
      handleLocationChange();
    });
  } else {
    console.error("Location dropdown not found!");
  }

  if (locationSearch) {
    locationSearch.addEventListener("input", handleLocationSearch);
    locationSearch.addEventListener("focus", () => {
      if (searchResults.children.length > 0) {
        searchResults.style.display = "block";
      }
    });
  } else {
    console.error("Location search input not found!");
  }

  // Hide search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
      searchResults.style.display = "none";
    }
  });
}

function loadSavedLocations() {
  locationDropdown.innerHTML = '<option value="">Recent locations...</option>';

  savedLocations.forEach((location, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${location.name}, ${location.country}`;
    locationDropdown.appendChild(option);
  });
}

function handleLocationSearch(e) {
  const query = e.target.value.trim();

  if (query.length < 2) {
    searchResults.style.display = "none";
    return;
  }

  // Debounce the search
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    searchLocations(query);
  }, 300);
}

function searchLocations(query) {
  console.log("Searching for:", query);

  fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
      query
    )}&limit=5&appid=${API_KEY}`
  )
    .then((res) => {
      console.log("Geocoding API response status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log("Search results:", data);
      displaySearchResults(data);
    })
    .catch((error) => {
      console.error("Error searching locations:", error);
      searchResults.innerHTML =
        '<div class="search-result-item">Error searching locations</div>';
      searchResults.style.display = "block";
    });
}

function displaySearchResults(locations) {
  searchResults.innerHTML = "";

  if (locations.length === 0) {
    searchResults.innerHTML =
      '<div class="search-result-item">No locations found</div>';
  } else {
    locations.forEach((location) => {
      const resultItem = document.createElement("div");
      resultItem.className = "search-result-item";

      let displayText = location.name;
      if (location.state) {
        displayText += `, ${location.state}`;
      }
      if (location.country) {
        displayText += `, ${location.country}`;
      }

      resultItem.textContent = displayText;
      resultItem.addEventListener("click", () => {
        selectLocationFromSearch(location);
      });

      searchResults.appendChild(resultItem);
    });
  }

  searchResults.style.display = "block";
}

function selectLocationFromSearch(location) {
  console.log("Selected location from search:", location);

  // Hide search results
  searchResults.style.display = "none";
  locationSearch.value = "";

  // Get weather for the selected location
  getWeatherData(location.lat, location.lon);

  // Save this location
  const locationData = {
    name: location.name,
    country: location.country,
    state: location.state,
    lat: location.lat,
    lon: location.lon,
  };
  saveLocation(locationData);
}

function saveLocation(locationData) {
  const locationExists = savedLocations.some(
    (loc) => loc.lat === locationData.lat && loc.lon === locationData.lon
  );

  if (!locationExists) {
    savedLocations.unshift(locationData);
    // Keep only last 10 locations
    if (savedLocations.length > 10) {
      savedLocations = savedLocations.slice(0, 10);
    }
    localStorage.setItem("weatherLocations", JSON.stringify(savedLocations));
    loadSavedLocations();
  }
}

function getCurrentLocation() {
  console.log("getCurrentLocation called");
  if (navigator.geolocation) {
    console.log("Requesting current position...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Position received:", position.coords);
        const { latitude, longitude } = position.coords;
        getWeatherData(latitude, longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(
          "Unable to get your location. Please select a location from the dropdown."
        );
      }
    );
  } else {
    console.error("Geolocation not supported");
  }
}

function handleLocationChange() {
  const selectedIndex = locationDropdown.value;
  if (selectedIndex !== "") {
    const selectedLocation = savedLocations[parseInt(selectedIndex)];
    if (selectedLocation) {
      console.log("Selected location:", selectedLocation);
      getWeatherData(selectedLocation.lat, selectedLocation.lon);
    } else {
      console.error("Location not found at index:", selectedIndex);
    }
  }
}

function getWeatherData(lat, lon) {
  console.log("getWeatherData called with lat:", lat, "lon:", lon);
  // First get weather data using current weather API
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
  )
    .then((res) => {
      console.log("Weather API response status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log("Weather data received:", data);
      console.log("=== FULL WEATHER OBJECT ===");
      console.log(JSON.stringify(data, null, 2));
      console.log("=== WEATHER CONDITIONS ===");
      console.log("Main condition:", data.weather[0].main);
      console.log("Description:", data.weather[0].description);
      console.log("Weather ID:", data.weather[0].id);
      console.log("Icon:", data.weather[0].icon);
      console.log("=== SUNRISE/SUNSET ===");
      console.log("Sunrise:", new Date(data.sys.sunrise * 1000));
      console.log("Sunset:", new Date(data.sys.sunset * 1000));
      console.log("Current time:", new Date());
      // Get forecast data separately
      getForecastData(lat, lon, data);
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
    });
}

function getForecastData(lat, lon, currentWeatherData) {
  // Get 5-day forecast
  fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
  )
    .then((res) => {
      console.log("Forecast API response status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((forecastData) => {
      console.log("Forecast data received:", forecastData);
      // Get the timezone for this location
      getTimezoneForLocation(lat, lon, currentWeatherData, forecastData);
    })
    .catch((error) => {
      console.error("Error fetching forecast data:", error);
      // Still show current weather even if forecast fails
      const combinedData = {
        current: currentWeatherData,
        daily: [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      getCityName(lat, lon, combinedData);
    });
}

function getTimezoneForLocation(lat, lon, currentWeatherData, forecastData) {
  console.log("Getting timezone for coordinates:", lat, lon);

  // Use a more reliable timezone lookup service
  fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
  )
    .then((res) => {
      console.log("Geocoding API response status:", res.status);
      return res.json();
    })
    .then((geoData) => {
      console.log("Geocoding API response:", geoData);

      let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log("Browser timezone:", timezone);

      // Try to get timezone from the geocoding data
      if (geoData && geoData.timezone) {
        timezone = geoData.timezone;
        console.log("Using geocoding timezone:", timezone);
      } else {
        // Fallback: estimate timezone based on longitude
        console.log(
          "No timezone in geocoding data, using longitude estimation"
        );
        timezone = estimateTimezoneFromLongitude(lon);
      }

      console.log("Final timezone:", timezone);

      const combinedData = {
        current: currentWeatherData,
        daily: processForecastData(forecastData),
        timezone: timezone,
      };
      getCityName(lat, lon, combinedData);
    })
    .catch((error) => {
      console.error("Error fetching timezone:", error);
      // Fallback to estimated timezone
      console.log("API error, using longitude estimation");
      const timezone = estimateTimezoneFromLongitude(lon);
      const combinedData = {
        current: currentWeatherData,
        daily: processForecastData(forecastData),
        timezone: timezone,
      };
      getCityName(lat, lon, combinedData);
    });
}

function estimateTimezoneFromLongitude(lon) {
  // More accurate timezone estimation based on longitude and common timezone boundaries
  const timezoneMap = [
    { min: -180, max: -165, zone: "Pacific/Midway" },
    { min: -165, max: -150, zone: "Pacific/Honolulu" },
    { min: -150, max: -135, zone: "America/Anchorage" },
    { min: -135, max: -120, zone: "America/Los_Angeles" },
    { min: -120, max: -105, zone: "America/Denver" },
    { min: -105, max: -90, zone: "America/Chicago" },
    { min: -90, max: -75, zone: "America/Chicago" }, // Fixed: Tennessee is Central Time
    { min: -75, max: -60, zone: "America/New_York" },
    { min: -60, max: -45, zone: "America/Argentina/Buenos_Aires" },
    { min: -45, max: -30, zone: "Atlantic/South_Georgia" },
    { min: -30, max: -15, zone: "Atlantic/Azores" },
    { min: -15, max: 0, zone: "Europe/London" },
    { min: 0, max: 15, zone: "Europe/Paris" },
    { min: 15, max: 30, zone: "Europe/Moscow" },
    { min: 30, max: 45, zone: "Asia/Dubai" },
    { min: 45, max: 60, zone: "Asia/Karachi" },
    { min: 60, max: 75, zone: "Asia/Kolkata" },
    { min: 75, max: 90, zone: "Asia/Bangkok" },
    { min: 90, max: 105, zone: "Asia/Shanghai" },
    { min: 105, max: 120, zone: "Asia/Tokyo" },
    { min: 120, max: 135, zone: "Australia/Sydney" },
    { min: 135, max: 150, zone: "Pacific/Auckland" },
    { min: 150, max: 180, zone: "Pacific/Auckland" },
  ];

  console.log("Estimating timezone for longitude:", lon);

  for (const tz of timezoneMap) {
    if (lon >= tz.min && lon < tz.max) {
      console.log(
        "Found timezone:",
        tz.zone,
        "for longitude range",
        tz.min,
        "to",
        tz.max
      );
      return tz.zone;
    }
  }

  console.log("No timezone found, using UTC");
  return "UTC";
}

function processForecastData(forecastData) {
  // Process 5-day forecast data to match the expected format
  const dailyForecasts = [];
  const dailyData = {};

  forecastData.list.forEach((item) => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyData[date]) {
      dailyData[date] = {
        dt: item.dt,
        temp: { day: item.main.temp, night: item.main.temp },
        weather: item.weather,
      };
    } else {
      // Update night temperature (use the last temperature of the day)
      dailyData[date].temp.night = item.main.temp;
    }
  });

  return Object.values(dailyData).slice(0, 5); // Return first 5 days
}

function getCityName(lat, lon, weatherData) {
  fetch(
    `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
  )
    .then((res) => res.json())
    .then((geoData) => {
      if (geoData && geoData.length > 0) {
        const cityInfo = geoData[0];
        const locationData = {
          name: cityInfo.name,
          country: cityInfo.country,
          state: cityInfo.state,
          lat: lat,
          lon: lon,
        };

        // Save this location
        saveLocation(locationData);

        // Update the display
        showWeatherData(weatherData, locationData);
      } else {
        // Fallback if reverse geocoding fails
        showWeatherData(weatherData, {
          name: "Unknown",
          country: "",
          lat: lat,
          lon: lon,
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching city name:", error);
      // Fallback if reverse geocoding fails
      showWeatherData(weatherData, {
        name: "Unknown",
        country: "",
        lat: lat,
        lon: lon,
      });
    });
}

function showWeatherData(data, locationData = null) {
  console.log("showWeatherData called with:", data, locationData);
  let { humidity, temp } = data.current.main;
  let wind_speed = data.current.wind ? data.current.wind.speed : 0;
  console.log(
    "Wind speed value:",
    wind_speed,
    "Wind object:",
    data.current.wind
  );
  let { sunrise, sunset } = data.current.sys;

  // Format timezone properly
  console.log("Timezone data:", data.timezone);
  if (data.timezone && typeof data.timezone === "string") {
    timezone.innerHTML = data.timezone.replace(/_/g, " ");
  } else {
    timezone.innerHTML = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  if (locationData) {
    countryEl.innerHTML = `${locationData.name}, ${locationData.country}`;
  } else {
    countryEl.innerHTML =
      data.current.coord.lat +
      " &#176;N, " +
      data.current.coord.lon +
      " &#176;W";
  }
  // Format weather condition for display
  let condition = data.current.weather[0].main;
  if (condition === "Clouds") {
    condition = "Cloudy";
  }

  currentWeatherItemsEl.innerHTML = `
        <div class="temp-condition-row">
          <div class="temp-display">${Math.round(
            temp
          )}<span class="degree">&#176;</span></div>
          <div class="condition-display">${condition}</div>
        </div>
        <div class="city-display">${
          locationData ? locationData.name : "Unknown"
        }</div>
    `;

  // Display current weather
  currentTempEl.innerHTML = `
        <img src="http://openweathermap.org/img/wn/${
          data.current.weather[0].icon
        }@2x.png" alt="weather icon" class="w-icon">
        <div class="other">
            <div class="day">Today</div>
            <div class="temp">Current - ${Math.round(temp)}&#176; F</div>
            <div class="temp">Feels like - ${Math.round(
              data.current.main.feels_like
            )}&#176; F</div>
        </div>
        `;

  // Display forecast
  let otherDayForecast = "";
  if (data.daily && data.daily.length > 0) {
    data.daily.forEach((day, idx) => {
      if (idx > 0) {
        // Skip today since it's already shown
        otherDayForecast += `
            <div class="weather-forecast-item">
                  <div class="day">${window
                    .moment(day.dt * 1000)
                    .format("dddd")}</div>
                  <img src="http://openweathermap.org/img/wn/${
                    day.weather[0].icon
                  }@2x.png" alt="weather icon" class="w-icon">
                  <div class="temp">Night - ${Math.round(
                    day.temp.night
                  )}&#176; F</div>
                  <div class="temp">Day - ${Math.round(
                    day.temp.day
                  )}&#176; F</div>
            </div>
              `;
      }
    });
  }

  weatherForecastEl.innerHTML = otherDayForecast;
}
