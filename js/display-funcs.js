/////////////////////////////
//   UI UPDATE FUNCTIONS   //
/////////////////////////////

// Update the objects that are rendered on the map. Clear old markers and draw new ones. This is
// called when the data model changes due to a server query.
function updateMapObjects() {
    // Clear existing markers and lines
    markers.forEach(marker => markersLayer.removeLayer(marker));
    markers = [];
    lines.forEach(line => linesLayer.removeLayer(line));
    lines = [];
    gridSquares.forEach(square => gridSquaresWorkedLayer.removeLayer(square));
    gridSquares = new Map();

    // Add own position marker
    createOwnPosMarker(qthPos);

    // Iterate through qsos, creating markers
    data.forEach(function (d) {
        const pos = getIconPosition(d);
        if (pos != null) {
            // Add marker
            if (markersEnabled) {
                let m = L.marker(pos, {icon: getIcon(d)});

                // Create popup
                m.bindPopup(getPopupText(d));

                // Create label under the marker
                if (showCallsignLabels || showDistanceLabels) {
                    m.bindTooltip(getTooltipText(d), {permanent: true, direction: 'bottom', offset: L.point(0, -10)});
                }

                // Add to the map
                markersLayer.addLayer(m);
                markers.push(m);

                // Use small icons if requested. This is if "small icons" is enabled, of if "hybrid marker size"
                // is selected and the marker has no icon.
                if (smallMarkers || (hybridMarkerSize && getIconName(d) === "fa-none")) {
                    $(m._icon).addClass("smallmarker");
                }
            }

            // Add geodesic line
            if (linesEnabled && qthPos != null) {
                let line = L.geodesic([qthPos, pos], {
                    color: colourLines ? qsoToColour(d) : "black",
                    wrap: false,
                    steps: 5,
                    weight: thickLines ? 3 : 1
                });
                linesLayer.addLayer(line);
                lines.push(line);
            }

            // Add worked square. Must not be a dupe of one we have already added.
            let fourDigitGrid = d.grid.substring(0, 4);
            if (gridSquaresEnabled && !gridSquares.has(fourDigitGrid)) {
                let swCorner = latLonForGridSWCorner(fourDigitGrid);
                let neCorner = latLonForGridNECorner(fourDigitGrid);
                let square = L.rectangle([swCorner, neCorner], {color: 'blue'});
                square.bindPopup(fourDigitGrid);
                gridSquaresWorkedLayer.addLayer(square);
                gridSquares.set(fourDigitGrid, square);
            }
        }
    });
}

// Zoom the display to fit all markers, so long as we have at least three so the zoom isn't janky
function zoomToFit() {
    if (markers.length > 3) {
        var group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
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
    localStorage.setItem('showMaidenheadGrid', showMaidenheadGrid);
}



/////////////////////////////
//  QSO DISPLAY FUNCTIONS //
/////////////////////////////

// Get text for the normal click-to-appear popups. Takes a data item that may contain multiple QSOs.
function getPopupText(d) {
    let text = "<a href='https://www.qrz.com/db/" + d.call + "' target='_blank'><b>" + d.call + "</b></a>";
    if (d.name) {
        let displayName = d.name;
        if (displayName.length > 30) {
            displayName = displayName.substring(0, 26).trim() + "..."
        }
        text += "&nbsp;&nbsp;" + displayName.replaceAll(" ", "&nbsp;");
    }
    text += "<br/>"

    if (d.qth) {
        let displayQTH = d.qth;
        if (displayQTH.length > 30) {
            displayQTH = displayQTH.substring(0, 22).trim() + "..."
        }
        text += displayQTH.replaceAll(" ", "&nbsp;") + ",&nbsp;";
    }
    if (d.grid) {
        text += d.grid;
    }
    if (d.grid && qthPos) {
        text += "&nbsp;(" + getDistanceString(d) + ")";
    }

    d.qsos.forEach(qso => {
        if (qso.freq) {
            text += "<br/>" + qso.freq.toFixed(3);
            if (qso.mode) {
                text += "&nbsp;MHz&nbsp;&nbsp;" + qso.mode;
            }
        }
        if (qso.time) {
            text += "&nbsp;&nbsp; &nbsp;&nbsp;" + qso.time.format("HH:mm DD/MM/YYYY");
        }
    });
    return text;
}

// Get text for the permanent labels underneath the markers (referred to by Leaflet as tooltips)
function getTooltipText(d) {
    let labelHTML = "<div style='color: " + (basemapIsDark ? "white" : "black") + "; text-align: center;'>";
    if (showCallsignLabels) {
        labelHTML += d.call;
    }
    if (showCallsignLabels && showDistanceLabels) {
        labelHTML += "<br/>";
    }
    if (showDistanceLabels) {
        labelHTML += getDistanceString(d);
    }
    labelHTML += "</div>";
    return labelHTML;
}

// Get text for the permanent labels underneath the own QTH marker (referred to by Leaflet as a tooltip).
function getOwnQTHTooltipText(callsign) {
    let labelHTML = "<div style='color: " + (basemapIsDark ? "white" : "black") + "; text-align: center;'>";
    if (showCallsignLabels) {
        labelHTML += callsign;
    }
    labelHTML += "</div>";
    return labelHTML;
}


// Gets the lat/long position for a data item's grid reference. Null is returned if the position
// is unknown or 0,0. If the user QTH location has been provided, we adjust the longitude of the
// qso to be their longitude +-180 degrees, so that we are correctly displaying markers either
// side of them on the map, and calculating the great circle distance and bearing as the short
// path.
function getIconPosition(d) {
    let grid = d.grid;
    if (grid && latLonForGridCentre(grid) != null) {
        [lat, lon] = latLonForGridCentre(grid);
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
        basemapIsDark = basemapname === "CartoDB.DarkMatter" || basemapname === "Esri.WorldImagery";
        $("#map").css('background-color', basemapIsDark ? "black" : "white");
    }
    localStorage.setItem('basemap', JSON.stringify(basemap));
}

// Set the basemap opacity
function setBasemapOpacity(opacity) {
    basemapOpacity = opacity;
    if (typeof basemapLayer !== 'undefined') {
        basemapLayer.setOpacity(opacity);
    }
    localStorage.setItem('basemapOpacity', basemapOpacity);
}
