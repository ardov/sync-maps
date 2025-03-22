# Synchronized Maps Web App

This web application displays two maps side by side with synchronized zoom levels. When you zoom in or out on one map, the other map will automatically adjust to match the zoom level, while allowing you to explore different locations on each map independently.

## Features

- Two maps displayed side by side using Leaflet and OpenStreetMap
- Synchronized zoom levels between both maps
- Independent map positioning (you can explore different locations on each map)
- Responsive design that works on desktop and mobile devices
- Error handling for map loading issues
- **No API key required!**

## Setup Instructions

1. Clone or download this repository to your local machine.

2. Open the `index.html` file in a web browser.

That's it! No API key or additional setup is required.

## How It Works

This application uses:

- [Leaflet](https://leafletjs.com/) - An open-source JavaScript library for mobile-friendly interactive maps
- [OpenStreetMap](https://www.openstreetmap.org/) - A free, editable map of the world created by volunteers

## Customization

You can customize the application by modifying the following files:

- `index.html` - Structure of the web page
- `styles.css` - Appearance and layout
- `script.js` - Map functionality and synchronization

### Customization Options

- To change the default locations, modify the `location1` and `location2` arrays in `script.js`
- To change the default zoom level, modify the `zoom` property in the `mapOptions1` and `mapOptions2` objects
- To use a different map style, change the tile layer URL in the `L.tileLayer()` function

## Alternative Map Styles

You can use different map styles by changing the tile layer URL. Here are some examples:

1. **Stamen Watercolor** (artistic map):

   ```javascript
   L.tileLayer(
     "https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg",
     {
       attribution:
         'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
       maxZoom: 16,
     }
   ).addTo(map);
   ```

2. **Stamen Toner** (high contrast black and white):
   ```javascript
   L.tileLayer(
     "https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",
     {
       attribution:
         'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
       maxZoom: 18,
     }
   ).addTo(map);
   ```

## Browser Compatibility

This application works in all modern browsers, including:

- Chrome
- Firefox
- Safari
- Edge

## License

This project is open source and available for personal and commercial use.
