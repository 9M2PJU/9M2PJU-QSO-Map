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
    gridSquareLabels.forEach(label => gridSquaresWorkedLabelsLayer.removeLayer(label));
    gridSquareLabels = [];

    // Add own position marker
    createOwnPosMarker(qthPos);

    // Iterate through qsos, creating markers
    data.forEach(function (d) {
        const pos = getIconPosition(d);
        if (anyQSOMatchesFilter(d) && pos != null) {
            // Add marker
            if (markersEnabled) {
                let m = L.marker(pos, {icon: getIcon(d)});

                // Create popup
                m.bindPopup(getPopupText(d));

                // Create label under the marker
                let tooltipText = getTooltipText(d);
                if (tooltipText) {
                    m.bindTooltip(tooltipText, {permanent: true, direction: 'bottom', offset: L.point(0, -10)});
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
                gridSquaresWorkedLayer.addLayer(square);
                gridSquares.set(fourDigitGrid, square);

                if (labelGridSquaresWorked) {
                    let centre = latLonForGridCentre(fourDigitGrid);
                    let label = new L.marker(centre, {
                        icon: new L.DivIcon({
                            html: "<div class='gridSquareLabel'>" + fourDigitGrid + "</div>",
                        })
                    });
                    gridSquaresWorkedLabelsLayer.addLayer(label);
                    gridSquareLabels.push(label);
                }
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
    let text = "<span style='display:inline-block; white-space: nowrap;'><i class='fa-solid fa-user markerPopupIcon'></i>&nbsp;<span class='popupBlock'><a href='https://www.qrz.com/db/" + d.call + "' target='_blank'><b>" + d.call + "</b></a>";
    if (d.name) {
        text += "&nbsp;&nbsp;" + d.name;
    }
    text += "</span></span><br/>"

    text += "<span style='display:inline-block; white-space: nowrap;'><i class='fa-solid fa-location-dot markerPopupIcon'></i>&nbsp;<span class='popupBlock'>";
    if (d.qth) {
        text += d.qth + ", ";
    }
    if (d.grid) {
        text += formatGrid(d.grid);
    }
    if (d.grid && qthPos) {
        text += "&nbsp;(" + getDistanceString(d) + ")";
    }
    text += "</span></span>"

    getQSOsMatchingFilter(d).forEach(qso => {
        if (qso.freq || qso.time || (qso.comment && showComments)) {
            text += "<br/><span style='display:inline-block; white-space: nowrap;'><i class='fa-solid fa-comment markerPopupIcon'></i>&nbsp;<span class='popupBlock'>";
        }
        if (qso.freq) {
            text += qso.freq.toFixed(3);
            if (qso.mode) {
                text += "&nbsp;MHz&nbsp;&nbsp;" + qso.mode;
            }
        }
        if (qso.time) {
            text += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + qso.time.format("HH:mm[&nbsp;UTC,&nbsp;]DD[&nbsp;]MMM[&nbsp;]YYYY");
        }
        if (qso.comment && showComments) {
            text += "<br/>&nbsp;&nbsp;&nbsp;" + qso.comment;
        }
        if (qso.freq || qso.time || (qso.comment && showComments)) {
            text += "</span></span>";
        }
    });
    return text;
}

// Get text for the permanent labels underneath the markers (referred to by Leaflet as tooltips)
function getTooltipText(d) {
    let showCall = showCallsignLabels && d.call;
    let showGrid = showGridSquareLabels && d.grid;
    let showDist = showDistanceLabels && d.grid;
    let labelText = "";

    if (showCall) {
        labelText += d.call;
    }
    if (showGrid) {
        if (labelText) {
            labelText += "<br/>";
        }
        labelText += formatGrid(d.grid);
    }
    if (showDist) {
        if (labelText) {
            labelText += "<br/>";
        }
        labelText += getDistanceString(d);
    }

    if (labelText) {
        return "<div style='color: " + (basemapIsDark ? "white" : "black") + "; text-align: center;'>" + labelText + "</div>";
    } else {
        return "";
    }
}

// Get text for the permanent labels underneath the own QTH marker (referred to by Leaflet as a tooltip).
function getOwnQTHTooltipText() {
    let showCall = showCallsignLabels && myCall;
    let showGrid = showGridSquareLabels && qthGrid;
    let labelText = "";

    if (showCall) {
        labelText += myCall;
    }
    if (showGrid) {
        if (labelText) {
            labelText += "<br/>";
        }
        labelText += formatGrid(qthGrid);
    }

    if (labelText) {
        return "<div style='color: " + (basemapIsDark ? "white" : "black") + "; text-align: center;'>" + labelText + "</div>";
    } else {
        return "";
    }
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


// Update the status indicator. Called regularly, and uses internal software state to choose what to display.
function updateStatus() {
    if (loadedAtLeastOnce) {
        let statusText = "";

        // Icon. Spinner if we are doing something, check if all done and every QSO has a grid, exclamation mark if
        // we have qsos without grids.
        if (loading || (queue.length > 0 && qrzToken)) {
            statusText = "<i class=\"fa-solid fa-spinner\"></i> ";
        } else if (queue.length > 0 || failedLookupCount > 0 || qsoCount === 0 || !lastLoadTypeRecognised) {
            statusText += "<i class=\"fa-solid fa-triangle-exclamation\"></i> ";
        } else {
            statusText += "<i class=\"fa-solid fa-check\"></i> ";
        }

        // Status text
        if (loading) {
            statusText += "Loading...";
        } else if (!lastLoadTypeRecognised) {
            statusText += "Could not parse this file as a supported format (ADIF, Cabrillo or SOTA CSV)"
        } else if (qsoCount > 0) {
            if (queue.length === 0 && failedLookupCount === 0) {
                statusText += "Loaded and displayed " + qsoCount + " QSOs.";
            } else if (queue.length === 0) {
                statusText += "Loaded " + qsoCount + " QSOs, failed to find grids for " + failedLookupCount + ".";
            } else if (failedLookupCount === 0) {
                if (qrzToken) {
                    statusText += "Loaded " + qsoCount + " QSOs, " + queue.length + " in lookup queue.";
                } else {
                    statusText += "Loaded " + qsoCount + " QSOs, " + queue.length + " had no grid.";
                }
            } else {
                statusText += "Loaded " + qsoCount + " QSOs, " + queue.length + " in queue, failed to find grids for " + failedLookupCount + ".";
            }
        } else {
            statusText += "Failed to parse QSOs in this file";
        }

        // Abort option
        if (queue.length > 0 && qrzToken) {
            statusText += "&nbsp;&nbsp;<a href='#' onClick='clearQueue();'>Cancel</a>";
        }

        $("#loadingStatus").html(statusText);
    }
}