// Global variables and constants
const DEFAULT_LOCATIONS = {
  PRAGUE: [50.0755, 14.4378],
  SAINT_PETERSBURG: [59.9343, 30.3351],
  BARCELONA: [41.3851, 2.1734],
};

const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Map instances
let map1, map2, map3;

// State flags
let isThreeMapsMode = false;
let isSynchronizing = false; // Flag to prevent recursive synchronization
let isUpdatingUrl = false; // Flag to prevent recursive URL updates
let lastActiveMap = null; // Track the last map the user interacted with

// Airport data
let airports = [];
let selectedSuggestionIndex = -1;

// Initialize maps when the document is ready
document.addEventListener("DOMContentLoaded", () => {
  initMaps();
  loadAirportsData();
  setupSearchFunctionality();
});

/**
 * Load airports data from CSV file
 */
function loadAirportsData() {
  fetch("airports.csv")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.text();
    })
    .then((data) => {
      // Parse CSV data
      const lines = data.split("\n");
      const headers = lines[0].split(",");

      // Skip header row and process each line
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines

        const values = lines[i].split(",");
        const airport = {
          code: values[0],
          city: values[1],
          country: values[2],
          lat: parseFloat(values[3]),
          lon: parseFloat(values[4]),
        };

        // Only add airports with valid coordinates
        if (!isNaN(airport.lat) && !isNaN(airport.lon)) {
          airports.push(airport);
        }
      }

      console.log(`Loaded ${airports.length} airports`);
    })
    .catch((error) => {
      console.error("Error loading airports data:", error);
    });
}

/**
 * Set up airport search functionality
 */
function setupSearchFunctionality() {
  const searchInput = document.getElementById("airport-search");
  const suggestionsContainer = document.getElementById("search-suggestions");
  const clearButton = document.getElementById("search-clear");

  // Show clear button when input has text
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    clearButton.style.display = query ? "block" : "none";

    if (query.length >= 2) {
      showSuggestions(query);
    } else {
      suggestionsContainer.style.display = "none";
      selectedSuggestionIndex = -1;
    }
  });

  // Clear search input
  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    suggestionsContainer.style.display = "none";
    clearButton.style.display = "none";
    selectedSuggestionIndex = -1;
  });

  // Handle keyboard navigation in suggestions
  searchInput.addEventListener("keydown", (e) => {
    const suggestions = document.querySelectorAll(".search-suggestion");

    if (suggestions.length === 0) return;

    // Down arrow
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedSuggestionIndex = Math.min(
        selectedSuggestionIndex + 1,
        suggestions.length - 1
      );
      updateSelectedSuggestion(suggestions);
    }
    // Up arrow
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
      updateSelectedSuggestion(suggestions);
    }
    // Enter key
    else if (e.key === "Enter") {
      e.preventDefault();
      if (
        selectedSuggestionIndex >= 0 &&
        selectedSuggestionIndex < suggestions.length
      ) {
        suggestions[selectedSuggestionIndex].click();
      }
    }
    // Escape key
    else if (e.key === "Escape") {
      suggestionsContainer.style.display = "none";
      selectedSuggestionIndex = -1;
    }
  });

  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !searchInput.contains(e.target) &&
      !suggestionsContainer.contains(e.target)
    ) {
      suggestionsContainer.style.display = "none";
    }
  });
}

/**
 * Show airport suggestions based on search query
 * @param {string} query - The search query
 */
function showSuggestions(query) {
  const suggestionsContainer = document.getElementById("search-suggestions");

  // Filter airports based on query
  const filteredAirports = airports
    .filter((airport) => {
      const searchString = query.toLowerCase();
      return (
        airport.code.toLowerCase().includes(searchString) ||
        airport.city.toLowerCase().includes(searchString) ||
        airport.country.toLowerCase().includes(searchString)
      );
    })
    .slice(0, 10); // Limit to 10 results

  if (filteredAirports.length === 0) {
    suggestionsContainer.style.display = "none";
    return;
  }

  // Clear previous suggestions
  suggestionsContainer.innerHTML = "";

  // Create suggestion elements
  filteredAirports.forEach((airport) => {
    const suggestion = document.createElement("div");
    suggestion.className = "search-suggestion";
    suggestion.innerHTML = `
      <span class="airport-code">${airport.code}</span>
      <span class="airport-name">${airport.city}</span>
      <span class="airport-location">${airport.country}</span>
    `;

    // Handle suggestion click
    suggestion.addEventListener("click", () => {
      teleportToAirport(airport);
      document.getElementById(
        "airport-search"
      ).value = `${airport.city}, ${airport.country} (${airport.code})`;
      suggestionsContainer.style.display = "none";
      document.getElementById("search-clear").style.display = "block";
    });

    suggestionsContainer.appendChild(suggestion);
  });

  // Show suggestions
  suggestionsContainer.style.display = "block";
  selectedSuggestionIndex = -1;
}

/**
 * Update the selected suggestion styling
 * @param {NodeList} suggestions - The list of suggestion elements
 */
function updateSelectedSuggestion(suggestions) {
  // Remove selected class from all suggestions
  suggestions.forEach((suggestion) => {
    suggestion.classList.remove("selected");
  });

  // Add selected class to the current suggestion
  if (selectedSuggestionIndex >= 0) {
    suggestions[selectedSuggestionIndex].classList.add("selected");
    suggestions[selectedSuggestionIndex].scrollIntoView({ block: "nearest" });
  }
}

/**
 * Teleport to the selected airport location on the last active map only
 * @param {Object} airport - The selected airport
 */
function teleportToAirport(airport) {
  const { lat, lon } = airport;

  // If no map has been interacted with yet, default to map1
  const targetMap = lastActiveMap || map1;

  // Update only the target map
  targetMap.setView([lat, lon], 12);

  // Update URL with new state
  updateUrlWithMapState();
}

/**
 * Parse URL parameters to get saved map state
 * @returns {Object} Map state parameters
 */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    zoom: parseInt(params.get("zoom")) || 12,
    maps: parseInt(params.get("maps")) || 2,
    center1: parseLocationParam(
      params.get("center1"),
      DEFAULT_LOCATIONS.PRAGUE
    ),
    center2: parseLocationParam(
      params.get("center2"),
      DEFAULT_LOCATIONS.SAINT_PETERSBURG
    ),
    center3: parseLocationParam(
      params.get("center3"),
      DEFAULT_LOCATIONS.BARCELONA
    ),
  };
}

/**
 * Helper function to parse location parameter (format: "lat,lng")
 * @param {string} param - The location parameter string
 * @param {Array} defaultValue - Default location if parsing fails
 * @returns {Array} Parsed location [lat, lng]
 */
function parseLocationParam(param, defaultValue) {
  if (!param) return defaultValue;

  try {
    const [lat, lng] = param.split(",").map(Number);
    if (isNaN(lat) || isNaN(lng)) return defaultValue;
    return [lat, lng];
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Update URL with current map state
 */
function updateUrlWithMapState() {
  if (isUpdatingUrl) return; // Prevent recursive updates

  isUpdatingUrl = true;

  try {
    const zoom = map1.getZoom();
    const center1 = map1.getCenter();
    const center2 = map2.getCenter();
    const center3 = map3.getCenter();
    const maps = isThreeMapsMode ? 3 : 2;

    const params = new URLSearchParams();
    params.set("zoom", zoom);
    params.set("maps", maps);
    params.set(
      "center1",
      `${center1.lat.toFixed(6)},${center1.lng.toFixed(6)}`
    );
    params.set(
      "center2",
      `${center2.lat.toFixed(6)},${center2.lng.toFixed(6)}`
    );

    if (isThreeMapsMode) {
      params.set(
        "center3",
        `${center3.lat.toFixed(6)},${center3.lng.toFixed(6)}`
      );
    }

    // Update URL without reloading the page
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  } finally {
    // Reset the flag after a short delay
    setTimeout(() => {
      isUpdatingUrl = false;
    }, 50);
  }
}

/**
 * Create a map with the given options
 * @param {string} id - Map container ID
 * @param {Object} options - Map options
 * @returns {Object} Leaflet map instance
 */
function createMap(id, options) {
  const map = L.map(id, options);

  // Add tile layer
  L.tileLayer(TILE_LAYER_URL, {
    attribution: TILE_LAYER_ATTRIBUTION,
    maxZoom: 19,
  }).addTo(map);

  return map;
}

/**
 * Initialize all maps
 */
function initMaps() {
  try {
    // Get parameters from URL or use defaults
    const params = getUrlParams();

    // Set three maps mode based on URL parameter
    isThreeMapsMode = params.maps === 3;

    // Default zoom level for all maps from URL or default
    const defaultZoom = params.zoom;

    // Common map options
    const baseMapOptions = {
      zoom: defaultZoom,
      zoomControl: false,
      scrollWheelZoom: true,
    };

    // Create maps with different centers
    map1 = createMap("map1", { ...baseMapOptions, center: params.center1 });
    map2 = createMap("map2", { ...baseMapOptions, center: params.center2 });
    map3 = createMap("map3", { ...baseMapOptions, center: params.center3 });

    // Add event listeners to track the last active map
    setupActiveMapTracking();

    // Set up event listeners to keep only zoom levels in sync
    setupSyncedZoom();

    // Set up custom zoom controls
    setupCustomZoomControls();

    // Set up map mode toggle
    setupMapModeToggle();

    // Update the maps container class based on the mode
    updateMapContainerClass();

    // Ensure all maps have the same zoom level after initialization
    setTimeout(() => {
      // Make sure synchronization flag is reset
      isSynchronizing = false;
      synchronizeZoomLevels();

      // Update URL with initial state
      updateUrlWithMapState();
    }, 100);
  } catch (error) {
    handleMapError(error);
  }
}

/**
 * Set up event listeners to track the last active map
 */
function setupActiveMapTracking() {
  // Function to update the last active map
  const updateActiveMap = (map) => {
    lastActiveMap = map;

    // Remove active class from all maps
    document.getElementById("map1").classList.remove("active-map");
    document.getElementById("map2").classList.remove("active-map");
    document.getElementById("map3").classList.remove("active-map");

    // Add active class to the current map
    if (map === map1) {
      document.getElementById("map1").classList.add("active-map");
    } else if (map === map2) {
      document.getElementById("map2").classList.add("active-map");
    } else if (map === map3) {
      document.getElementById("map3").classList.add("active-map");
    }
  };

  // Add event listeners for user interactions
  map1.on("click", () => updateActiveMap(map1));
  map1.on("drag", () => updateActiveMap(map1));
  map1.on("zoom", () => updateActiveMap(map1));

  map2.on("click", () => updateActiveMap(map2));
  map2.on("drag", () => updateActiveMap(map2));
  map2.on("zoom", () => updateActiveMap(map2));

  map3.on("click", () => updateActiveMap(map3));
  map3.on("drag", () => updateActiveMap(map3));
  map3.on("zoom", () => updateActiveMap(map3));

  // Set map1 as active by default
  updateActiveMap(map1);
}

/**
 * Update map container class based on current mode
 */
function updateMapContainerClass() {
  const mapsContainer = document.querySelector(".maps-container");
  const toggleText = document.querySelector("#toggle-map-mode .toggle-text");

  if (isThreeMapsMode) {
    mapsContainer.classList.remove("two-maps-mode");
    mapsContainer.classList.add("three-maps-mode");
    toggleText.textContent = "Show 2 Maps";
  } else {
    mapsContainer.classList.remove("three-maps-mode");
    mapsContainer.classList.add("two-maps-mode");
    toggleText.textContent = "Show 3 Maps";
  }
}

/**
 * Set up event listeners to keep zoom levels in sync
 */
function setupSyncedZoom() {
  // Helper function to handle zoom events
  const handleZoomEvent = (sourceMap, targetMaps) => {
    if (isSynchronizing) return;

    const newZoom = sourceMap.getZoom();
    targetMaps.forEach((targetMap) => {
      if (targetMap && targetMap.getZoom() !== newZoom) {
        targetMap.setZoom(newZoom);
      }
    });

    updateUrlWithMapState();
  };

  // Helper function to handle move events
  const handleMoveEvent = (map) => {
    if (!isSynchronizing) {
      synchronizeZoomLevels();
      updateUrlWithMapState();
    }
  };

  // Set up event handlers for each map
  map1.on("zoom", () =>
    handleZoomEvent(map1, [map2, isThreeMapsMode ? map3 : null])
  );
  map2.on("zoom", () =>
    handleZoomEvent(map2, [map1, isThreeMapsMode ? map3 : null])
  );
  map3.on("zoom", () => {
    if (!isThreeMapsMode) return;
    handleZoomEvent(map3, [map1, map2]);
  });

  // Handle move events
  map1.on("moveend", () => handleMoveEvent(map1));
  map2.on("moveend", () => handleMoveEvent(map2));
  map3.on("moveend", () => {
    if (isThreeMapsMode) handleMoveEvent(map3);
  });
}

/**
 * Set up custom zoom control buttons
 */
function setupCustomZoomControls() {
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const shareBtn = document.getElementById("share-btn");
  const shareNotification = document.getElementById("share-notification");

  // Helper function to update zoom on all maps
  const updateZoomOnAllMaps = (zoomDelta) => {
    const currentZoom = map1.getZoom();
    const newZoom = currentZoom + zoomDelta;

    // Update all maps directly
    map1.setZoom(newZoom);
    map2.setZoom(newZoom);
    if (isThreeMapsMode) {
      map3.setZoom(newZoom);
    }
  };

  // Zoom in button click handler
  zoomInBtn.addEventListener("click", () => updateZoomOnAllMaps(1));

  // Zoom out button click handler
  zoomOutBtn.addEventListener("click", () => updateZoomOnAllMaps(-1));

  // Share button click handler
  shareBtn.addEventListener("click", () => {
    // Make sure URL is up to date
    updateUrlWithMapState();

    // Copy the current URL to clipboard
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        // Show notification
        shareNotification.classList.add("visible");

        // Hide notification after 3 seconds
        setTimeout(() => {
          shareNotification.classList.remove("visible");
        }, 3000);
      })
      .catch((err) => {
        console.error("Could not copy URL: ", err);
        alert("Could not copy URL to clipboard. Please copy it manually.");
      });
  });
}

/**
 * Set up map mode toggle button
 */
function setupMapModeToggle() {
  const toggleBtn = document.getElementById("toggle-map-mode");

  toggleBtn.addEventListener("click", () => {
    isThreeMapsMode = !isThreeMapsMode;

    // Update the UI to reflect the new mode
    updateMapContainerClass();

    // Synchronize maps after mode change
    const mapsToUpdate = isThreeMapsMode ? [map1, map2, map3] : [map1, map2];

    // Need to update the map size when layout changes
    setTimeout(() => {
      // Invalidate size of all visible maps
      mapsToUpdate.forEach((map) => map.invalidateSize());

      // Ensure zoom levels are synchronized after resize
      isSynchronizing = false;
      synchronizeZoomLevels();

      // Update URL with new state
      updateUrlWithMapState();
    }, 100);
  });
}

/**
 * Helper function to synchronize zoom levels across all visible maps
 */
function synchronizeZoomLevels() {
  // Prevent recursive calls
  if (isSynchronizing) return;

  isSynchronizing = true;

  try {
    const currentZoom = map1.getZoom();

    // Only set zoom if it's different to avoid unnecessary updates
    if (map2.getZoom() !== currentZoom) {
      map2.setZoom(currentZoom);
    }

    if (isThreeMapsMode && map3.getZoom() !== currentZoom) {
      map3.setZoom(currentZoom);
    }
  } finally {
    // Reset the flag after a short delay to allow animations to complete
    setTimeout(() => {
      isSynchronizing = false;
    }, 50);
  }
}

/**
 * Handle errors with the map initialization
 * @param {Error} error - The error that occurred
 */
function handleMapError(error) {
  console.error("Error loading maps:", error);
  document.querySelector("main").innerHTML = `
    <div class="error-message">
      <h2>Error Loading Maps</h2>
      <p>There was a problem loading the maps. Please try again later.</p>
      <p>Technical details: ${error.message || "Unknown error"}</p>
    </div>
  `;
}
