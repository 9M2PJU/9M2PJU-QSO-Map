/////////////////////////////
//       MAP SETUP         //
/////////////////////////////

function setUpMap() {
    // Create map
    map = L.map('map', {
        zoomControl: false,
        minZoom: 2,
        zoomDelta: 0.25,
        wheelPxPerZoomLevel: 200,
        zoomSnap: 0
    });

    // Add basemap
    backgroundTileLayer = L.tileLayer.provider(basemap, {
        opacity: basemapOpacity,
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
