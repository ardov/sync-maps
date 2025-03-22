# Synchronized Maps

A web application that displays synchronized interactive maps using Leaflet.js. This tool allows users to view and compare different locations simultaneously across multiple map views.

## Features

- **Multiple Map Views**: Toggle between 2 or 3 synchronized map views
- **Interactive Controls**:
  - Synchronized zooming and panning across all maps
  - Custom zoom controls
  - Map mode toggle (2/3 maps)
- **Airport Search**:
  - Search by city, country, or airport code
  - Autocomplete suggestions
  - Quick teleport to selected airports
- **Share Functionality**: Share current map views via URL
- **Responsive Design**: Works on both desktop and mobile devices

## Technical Stack

- HTML5
- CSS3
- JavaScript (Vanilla)
- Leaflet.js (v1.9.4)
- OpenStreetMap tiles

## Setup

1. Clone the repository
2. Open `index.html` in a modern web browser
3. No additional setup required - the application runs entirely client-side

## Usage

- Use the search bar to find and navigate to airports
- Toggle between 2 and 3 map views using the "Show 3 Maps" button
- Zoom and pan maps using the custom controls or mouse/touch gestures
- Share your current view using the "Share" button
- All maps stay synchronized for easy comparison

## Data Source

The application uses airport data from `airports.csv`, which contains information about airports worldwide including their coordinates and codes.
