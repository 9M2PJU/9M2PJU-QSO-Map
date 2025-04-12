/////////////////////////////
//       MAP SETUP         //
/////////////////////////////

function setUpMap() {
    // Create map
    map = L.map('map', {
        zoomControl: false,
        minZoom: 2,
        zoomSnap: 0.5
    });

    // Manually add zoom control so we can put it in the top right
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Add basemap
    backgroundTileLayer = L.tileLayer.provider(BASEMAP, {
        opacity: BASEMAP_OPACITY,
        edgeBufferTiles: 1
    });
    backgroundTileLayer.addTo(map);
    backgroundTileLayer.bringToBack();

    // Add marker layer
    markersLayer = new L.LayerGroup();
    markersLayer.addTo(map);

    // Add lines layer
    linesLayer = new L.LayerGroup();
    linesLayer.addTo(map);

    // Display a default view.
    map.setView([30, 0], 3);
}
