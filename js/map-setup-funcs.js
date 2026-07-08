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
    try {
        maidenheadGrid = L.maidenhead({
            color : MAIDENHEAD_GRID_COLOR_LIGHT
        });
    } catch (e) {
        console.warn("Maidenhead grid layer unavailable", e);
    }

    // Add CQ zone layer (toggleable)
    try {
        cqZones = L.cqzones({
            color : CQ_ZONES_COLOR_LIGHT
        });
    } catch (e) {
        console.warn("CQ zone layer unavailable", e);
    }

    // Add ITU zone layer (toggleable)
    try {
        ituZones = L.ituzones({
            color : ITU_ZONES_COLOR_LIGHT
        });
    } catch (e) {
        console.warn("ITU zone layer unavailable", e);
    }

    // Add WAB/WAI grid layer (toggleable)
    try {
        wabwaiGrid = L.workedAllBritainIreland({
            color : WAB_WAI_GRID_COLOR_LIGHT
        });
    } catch (e) {
        console.warn("WAB/WAI grid layer unavailable", e);
    }

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

    // Add heatmap layers
    try {
        heatmapLayer = L.heatLayer([], {radius: 25});
        perBandHeatmapsGroup = new L.LayerGroup();
        HEATMAP_BAND_RENDER_ORDER.forEach(bandName => {
            let color = "black";
            BANDS.forEach(band => {
                if (band.name === bandName) {
                    color = band.color;
                }
            })
            let l = L.heatLayer([], {radius: 25, gradient: {1: color}});
            l.addTo(perBandHeatmapsGroup);
            perBandHeatmaps.set(bandName, l);
        });
    } catch (e) {
        console.warn("Heatmap layer unavailable", e);
    }

    // Display a default view.
    map.setView([30, 0], 3);
}
