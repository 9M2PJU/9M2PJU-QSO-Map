/////////////////////////////
//   UI UPDATE FUNCTIONS   //
/////////////////////////////

// Update the objects that are rendered on the map. Clear old markers and draw new ones. This is
// called when the data model changes due to a server query.
function updateMapObjects() {
    // Clear existing markers
    markers.forEach(marker => markersLayer.removeLayer(marker));
    markers = [];
    lines.forEach(line => linesLayer.removeLayer(line));
    lines = [];

    // Add own position marker
    createOwnPosMarker(qthPos);

    // Iterate through qsos, creating markers
    qsos.forEach(function (q) {
        const pos = getIconPosition(q);
        if (pos != null) {
            // No existing marker, data is valid, so create
            let m = L.marker(pos, { icon: getIcon(q) });

            // Add to map
            markersLayer.addLayer(m);

            // Set tooltip
            m.bindPopup(getTooltipText(q));

            // Set label
            if (callsignLabels) {
                m.bindTooltip("<span style='color: " + (basemapIsDark ? "white" : "black") + ";'>"
                    + q.get("CALL") + "</span>", {permanent: true, direction: 'center', offset: L.point(0, 10)});
            }

            // Add geodesic line
            if (linesEnabled && qthPos != null) {
                let line = L.geodesic([qthPos, m.getLatLng()], {
                    color: qsoToColour(q),
                    wrap: false,
                    steps: 5,
                    weight: 1
                });
                linesLayer.addLayer(line);
                lines.push(line);
            }

            // Add to internal data store
            markers.push(m);
        }
    });

    // Use small icons if requested
    if (smallIcons) {
        $(".leaflet-marker-icon svg").addClass("smallicon");
        $(".extra-marker i.fa").addClass("fa-smallicon");
    }
}

// Zoom the display to fit all markers
function zoomToFit() {
    var group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
}

// Shows/hides the Maidenhead grid overlay
function enableMaidenheadGrid(show) {
    showMaidenheadGrid = show;
    if (maidenheadGrid) {
        if (show) {
            maidenheadGrid.addTo(map);
            basemapLayer.bringToBack();
        } else {
            map.removeLayer(maidenheadGrid);
        }
    }
}



/////////////////////////////
//  QSO DISPLAY FUNCTIONS //
/////////////////////////////

// Tooltip text for the normal click-to-appear tooltips
function getTooltipText(qso) {
    let text = "<a href='https://www.qrz.com/db/" + qso.get("CALL") + "' target='_blank'><b>" + qso.get("CALL") + "</b></a>";
    if (qso.has("NAME")) {
        let displayName = qso.get("NAME");
        if (displayName.length > 30) {
            displayName = displayName.substring(0, 26).trim() + "..."
        }
        text += "&nbsp;&nbsp;" + displayName.replaceAll(" ", "&nbsp;");
    }
    text += "<br/>"
    if (qso.has("QTH")) {
        let displayQTH = qso.get("QTH");
        if (displayQTH.length > 30) {
            displayQTH = displayQTH.substring(0, 26).trim() + "..."
        }
        text += displayQTH.replaceAll(" ", "&nbsp;") + ",&nbsp;";
    }
    text += qso.get("GRIDSQUARE");
    if (qso.has("FREQ")) {
        text += "<br/>" + qso.get("FREQ").replaceAll("000", "");
        if (qso.has("MODE")) {
            text += "&nbsp;MHz&nbsp;&nbsp;" + qso.get("MODE");
        }
    }
    if (qso.has("TIME_ON")) {
        text += "<br/>" + qso.get("TIME_ON").substring(0, 2) + ":" + qso.get("TIME_ON").substring(2, 4);
        if (qso.has("QSO_DATE")) {
            text += "&nbsp;UTC on&nbsp;" + qso.get("QSO_DATE").substring(0, 4) + "-" + qso.get("QSO_DATE").substring(4, 6) + "-" + qso.get("QSO_DATE").substring(6, 8);
        }
    }
    return text;
}


// Gets the lat/long position for the icon representing a QSO. Null is returned if the position
// is unknown or 0,0. If the QTH location has been provided, we adjust the longitude of the
// qso to be their longitude +-180 degrees, so that we are correctly displaying markers either
// side of them on the map, and calculating the great circle distance and bearing as the short
// path.
function getIconPosition(q) {
    let grid = q.get("GRIDSQUARE");
    if (grid) {
        [lat, lon] = latLonForGrid(grid);
        if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon) && (lat !== 0.0 || lon !== 0.0)) {
            let wrapEitherSideOfLon = 0;
            if (qthPos != null) {
                wrapEitherSideOfLon = qthPos.lng;
            }
            let tmpLon = lon;
            while (tmpLon < wrapEitherSideOfLon - 180) {
                tmpLon += 360;
            }
            while (tmpLon > wrapEitherSideOfLon + 180) {
                tmpLon -= 360;
            }
            return [lat, tmpLon];
        }
    }
    return null;
}

// Set the basemap
function setBasemap(basemapname) {
    // Only change if we have to, to avoid a flash of reloading content
    if (basemap !== basemapname) {
        basemap = basemapname;
        if (typeof basemapLayer !== 'undefined') {
            map.removeLayer(basemapLayer);
        }
        basemapLayer = L.tileLayer.provider(basemapname, {
            opacity: basemapOpacity,
            edgeBufferTiles: 1
        });
        basemapLayer.addTo(map);
        basemapLayer.bringToBack();

        // Identify dark basemaps to ensure we use white text for unselected icons
        // and change the background colour appropriately
        basemapIsDark = basemapname == "CartoDB.DarkMatter" || basemapname == "Esri.WorldImagery";
        $("#map").css('background-color', basemapIsDark ? "black" : "white");
    }
}

// Set the basemap opacity
function setBasemapOpacity(opacity) {
    basemapOpacity = opacity;
    if (typeof basemapLayer !== 'undefined') {
        basemapLayer.setOpacity(opacity);
    }
}
