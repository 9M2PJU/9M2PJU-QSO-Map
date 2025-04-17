/////////////////////////////
//       MAP SETUP         //
/////////////////////////////

function setUpMap() {
    // Create map
    map = L.map('map', {
        zoomControl: false,
        minZoom: 2,
        maxZoom: 17,
        zoomSnap: 1
    });

    // Add basemap
    basemapLayer = L.tileLayer.provider(basemap, {
        opacity: basemapOpacity,
        edgeBufferTiles: 1
    });
    basemapLayer.addTo(map);
    basemapLayer.bringToBack();

    // Add Maidenhead grid (toggleable)
    maidenheadGrid = L.maidenhead({
        color : 'rgba(0, 0, 0, 0.4)'
    });

    // Add marker layer
    markersLayer = new L.LayerGroup();
    markersLayer.addTo(map);

    // Add lines layer
    linesLayer = new L.LayerGroup();
    linesLayer.addTo(map);

    // Display a default view.
    map.setView([30, 0], 3);
}
