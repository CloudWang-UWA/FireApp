// Create map centered near Albany, L is Leaflet
const map = L.map('map').setView([-34.95, 117.9], 9);

// OpenStreetMap basemap
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { maxZoom: 19 }
).addTo(map);

// Load demo heritage data
fetch("demo.geojson")
    .then(res => res.json())
    .then(data => {

        L.geoJSON(data, {
            onEachFeature: (feature, layer) => {

                layer.bindPopup(
                    "<b>ID:</b> " + feature.properties.ID +
                    "<br><b>Type:</b> " + feature.properties["Place Type"]
                );

            }
        }).addTo(map);

    });