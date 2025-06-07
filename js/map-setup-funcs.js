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
        color : MAIDENHEAD_GRID_COLOR_LIGHT
    });

    // Add CQ zone layer (toggleable)
    cqZones = L.cqzones({
        color : CQ_ZONES_COLOR_LIGHT
    });

    // Add ITU zone layer (toggleable)
    ituZones = L.ituzones({
        color : ITU_ZONES_COLOR_LIGHT
    });

    // Add WAB square layer (toggleable)
    wabGrid = L.workedAllBritain({
        color : WAB_GRID_COLOR_LIGHT
    });

    // Add marker layer
    markersLayer = new L.LayerGroup();
    markersLayer.addTo(map);

    // Add lines layer
    linesLayer = new L.LayerGroup();
    linesLayer.addTo(map);

    // Add own position marker layer
    ownPosLayer = new L.LayerGroup();
    ownPosLayer.addTo(map);

    // Add gridsquares worked layers
    gridSquaresWorkedLayer = new L.LayerGroup();
    gridSquaresWorkedLayer.addTo(map);
    gridSquaresWorkedLabelsLayer = new L.LayerGroup();
    gridSquaresWorkedLabelsLayer.addTo(map);

    // Display a default view.
    map.setView([30, 0], 3);
}
