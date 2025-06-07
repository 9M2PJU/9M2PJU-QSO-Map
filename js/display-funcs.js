/////////////////////////////
//  QSO DISPLAY FUNCTIONS //
/////////////////////////////

// Redraw all the objects that are rendered on the map. Clear old markers and draw new ones. This is
// called when a bulk change needs to happen, for example the first load occurs, a clear occurs,
// or a UI change occurs e.g. changing how colours are done for all markers.
function redrawAll() {
    // Clear existing markers and lines
    markers.forEach(marker => markersLayer.removeLayer(marker));
    markers = new Map();
    lines.forEach(line => linesLayer.removeLayer(line));
    lines = new Map();
    gridSquares.forEach(square => gridSquaresWorkedLayer.removeLayer(square));
    gridSquares = new Map();
    gridSquareLabels.forEach(label => gridSquaresWorkedLabelsLayer.removeLayer(label));
    gridSquareLabels = new Map();

    // Add own position marker
    createOwnPosMarker(qthPos);

    // Iterate through qsos, creating markers
    data.forEach((value, key) => redraw(key));
}

// Redraw a specific QSO (which can include creating the marker for the first time if it doesn't
// already exist, but cannot include deleting it). This is called when processing updates from the
// queue, because at this point we know we only need to update a single marker, and we don't need
// to redraw everything. (This is also delegated to from the redrawAll method to avoid duplication
// of code.) The key parameter is the CALLSIGN-GRID key from the "data" map.
function redraw(key) {
    let d = data.get(key);
    const pos = getIconPosition(d);
    if (anyQSOMatchesFilter(d) && pos != null) {
        // Add or update marker
        if (markersEnabled) {
            // Get an existing marker if we have one, else create a new one.
            let m = (markers.has(key)) ? markers.get(key) : L.marker(pos);

            // Set the icon for the marker
            m.setIcon(getIcon(d));

            // Set popup text for the marker
            m.bindPopup(getPopupText(d));

            // Create label under the marker
            let tooltipText = getTooltipText(d);
            if (tooltipText) {
                m.bindTooltip(tooltipText, {permanent: true, direction: 'bottom', offset: L.point(0, -10)});
            }

            // If this marker was newly created, add it to the layer
            if (!markers.has(key)) {
                markersLayer.addLayer(m);
            }

            // Use small icons if requested. This is if "small icons" is enabled, of if "hybrid marker size"
            // is selected and the marker has no icon.
            if (smallMarkers || (hybridMarkerSize && getIconName(d) === "fa-none")) {
                $(m._icon).addClass("smallmarker");
            }

            // Store the marker for next time
            markers.set(key, m);
        }

        // Add or replace geodesic line
        if (linesEnabled && qthPos != null) {
            // Leaflet.Geodesic doesn't support changing the style of a line after creation, so we need
            // to remove the existing line if it exists, and replace it.
            if (lines.has(key)) {
                linesLayer.removeLayer(lines.get(key));
            }

            let line = L.geodesic([qthPos, pos], {
                color: colourLines ? qsoToColour(d) : "black",
                wrap: false,
                steps: 5,
                weight: thickLines ? 3 : 1
            });
            linesLayer.addLayer(line);

            // Store the line so we can clear it next time
            lines.set(key, line);
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
                gridSquareLabels.set(fourDigitGrid, label);
            }
        }
    }
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

// Shows/hides the CQ zone overlay
function enableCQZones(show) {
    showCQZones = show;
    if (cqZones) {
        if (show) {
            cqZones.addTo(map);
            basemapLayer.bringToBack();
        } else {
            map.removeLayer(cqZones);
        }
    }
    localStorage.setItem('showCQZones', show);
}

// Shows/hides the ITU zone overlay
function enableITUZones(show) {
    showITUZones = show;
    if (ituZones) {
        if (show) {
            ituZones.addTo(map);
            basemapLayer.bringToBack();
        } else {
            map.removeLayer(ituZones);
        }
    }
    localStorage.setItem('showITUZones', show);
}

// Shows/hides the WAB grid overlay
function enableWABGrid(show) {
    showWABGrid = show;
    if (wabGrid) {
        if (show) {
            wabGrid.addTo(map);
            basemapLayer.bringToBack();
        } else {
            map.removeLayer(wabGrid);
        }
    }
    localStorage.setItem('showWABGrid', show);
}

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

        // Change the colour of the grid and zone overlays to match
        if (basemapIsDark) {
            maidenheadGrid.options.color = MAIDENHEAD_GRID_COLOR_DARK;
            cqZones.options.color = CQ_ZONES_COLOR_DARK;
            ituZones.options.color = ITU_ZONES_COLOR_DARK;
            wabGrid.options.color = WAB_GRID_COLOR_DARK;
        } else {
            maidenheadGrid.options.color = MAIDENHEAD_GRID_COLOR_LIGHT;
            cqZones.options.color = CQ_ZONES_COLOR_LIGHT;
            ituZones.options.color = ITU_ZONES_COLOR_LIGHT;
            wabGrid.options.color = WAB_GRID_COLOR_LIGHT;
        }
        if (showMaidenheadGrid) {
            map.removeLayer(maidenheadGrid);
            maidenheadGrid.addTo(map);
            basemapLayer.bringToBack();
        }
        if (showCQZones) {
            map.removeLayer(cqZones);
            cqZones.addTo(map);
            basemapLayer.bringToBack();
        }
        if (showITUZones) {
            map.removeLayer(ituZones);
            ituZones.addTo(map);
            basemapLayer.bringToBack();
        }
        if (showWABGrid) {
            map.removeLayer(wabGrid);
            wabGrid.addTo(map);
            basemapLayer.bringToBack();
        }
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
