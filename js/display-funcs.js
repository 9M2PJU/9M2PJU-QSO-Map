/////////////////////////////
//  QSO DISPLAY FUNCTIONS //
/////////////////////////////

// Redraw all the objects that are rendered on the map. Clear old markers and draw new ones. This is
// called when a bulk change needs to happen, for example the first load occurs, a clear occurs,
// or a UI change occurs e.g. changing how colours are done for all markers.
function redrawAll() {
    // Clear existing markers, lines and heatmaps
    markers.forEach(marker => markersLayer.removeLayer(marker));
    markers = new Map();
    lines.forEach(line => linesLayer.removeLayer(line));
    lines = new Map();
    gridSquares.forEach(square => gridSquaresWorkedLayer.removeLayer(square));
    gridSquares = new Map();
    gridSquareLabels.forEach(label => gridSquaresWorkedLabelsLayer.removeLayer(label));
    gridSquareLabels = new Map();
    try {
        heatmapLayer.setLatLngs([]);
    } catch (e) {}
    perBandHeatmapsGroup.eachLayer(function (l) {
        try {
            l.setLatLngs([]);
        } catch (e) {}
    });

    // Add own position marker
    createOwnPosMarker(qthPos);

    // Iterate through qsos, creating markers, lines, worked squares etc. This covers everything displayed per-QSO apart
    // from the heatmaps, which are covered further down.
    data.forEach((value, key) => redraw(key));

    // Calculate data sets for the heatmaps. We have to do this in two stages because the "intensity" value we use when
    // drawing the heatmap is based on how many total qsos there are, or how qsos per band there are. So first, we build
    // data sets. Each item is simply a [lat,lon].
    heatmapData = [];
    perBandHeatmapsData = new Map();
    BANDS.forEach(band => perBandHeatmapsData.set(band.name, []));
    data.forEach((d) => {
        let pos = getIconPosition(d);
        if (pos != null) {
            d.qsos.forEach((qso) => {
                heatmapData.push([pos[0], pos[1], 1]);
                if (qso.band && perBandHeatmapsData.has(qso.band)) {
                    perBandHeatmapsData.get(qso.band).push([pos[0], pos[1], 1]);
                }
            });
        }
    });

    // Now for every point, calculate an intensity based on the total number of points, and store it.
    heatmapData.forEach(d => d[2] = (heatmapData.size > 0) ? (1000 / Math.max(Math.min(heatmapData.size / 100, 5), 1)) : 1000);
    perBandHeatmapsData.forEach(pbd => {
        pbd.forEach(d => d[2] = (heatmapData.size > 0) ? (5000 / Math.max(Math.min(pbd.size / 100, 5), 1)) : 1000);
    });

    // Load the data into the heatmaps
    try {
    heatmapLayer.setLatLngs(heatmapData);
    } catch (e) {}
    perBandHeatmaps.forEach((value, key) => {
        try {
        value.setLatLngs(perBandHeatmapsData.get(key));
        } catch (e) {}
    });
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
            let m;
            if (markers.has(key)) {
                m = markers.get(key)
            } else if (circleMarkers) {
                m = L.circleMarker(pos, { radius: 5 * markerSize, fillOpacity: 1.0, opacity: 1.0, weight: 1, fill: true, color: "black" });
            } else {
                m = L.marker(pos);
            }

            // Set the icon for the marker
            if (circleMarkers) {
                // Set the colour
                m.options.fillColor = qsoToColour(d);
            } else {
                // Set the icon
                m.setIcon(getIcon(d, markerSize));
            }

            // Set popup text for the marker
            m.bindPopup(getPopupText(d));

            // Create label under the marker
            let tooltipText = getTooltipText(d);
            if (tooltipText) {
                m.bindTooltip(tooltipText, {permanent: true, direction: 'bottom', offset: L.point(0, -10)});
            }

            // Use outlined icons if requested (circle markers version, needs doing before adding to layer)
            if (circleMarkers) {
                m.options.stroke = outlineMarkers;
            }

            // If this marker was newly created, add it to the layer
            if (!markers.has(key)) {
                markersLayer.addLayer(m);
            }

            // If we are using hybrid marker size and this is a non-xOTA marker, reduce its size
            let thisMarkerSize = markerSize;
            if (hybridMarkerSize && (getIconName(d) === "fa-crosshairs" || getIconName(d) === "fa-none")) {
                thisMarkerSize = thisMarkerSize - 0.5;
                if (thisMarkerSize < 0.125) {
                    thisMarkerSize = 0.125;
                }
                m.setIcon(getIcon(d, thisMarkerSize));
            }

            // Adjust marker size (if we're using real markers not circles, circles already have their radius set at
            // creation, whereas markers need CSS applied here)
            if (!circleMarkers) {
                $(m._icon).find("svg").css("width", (32 * thisMarkerSize) + "px");
                $(m._icon).find("svg").css("height", (44 * thisMarkerSize) + "px");
                $(m._icon).find("svg").css("margin-top", ((1 - thisMarkerSize) * 40) + "px");
                $(m._icon).find("svg").css("margin-left", ((1 - thisMarkerSize) * 8) + "px");
                $(m._icon).find("i").css("font-size", (14 + (thisMarkerSize - 1) * 10 - ((getIconName(d) === "fa-circle") ? 2 : 0)) + "px");
                $(m._icon).find("i").css("margin-top", (10 + (1 - thisMarkerSize) * 28 + ((getIconName(d) === "fa-circle") ? 2 : 0)) + "px");
                $(m._icon).find("i").css("position", "absolute");
                $(m._icon).find("i").css("top", "0px");
                let ml = 0;
                if (thisMarkerSize > 1.4) {
                    ml = 3;
                } else if (thisMarkerSize < 0.9 || (thisMarkerSize > 1.1 && thisMarkerSize < 1.4)) {
                    ml = 1;
                }
                $(m._icon).find("i").css("margin-left", ml + "px");
            }

            // Use outlined icons if requested (standard markers version, needs doing after adding to layer)
            if (!circleMarkers && outlineMarkers) {
                $(m._icon).addClass("outlinedmarker");
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

// Shows/hides the WAB/WAI grid overlay
function enableWABWAIGrid(show) {
    showWABWAIGrid = show;
    if (wabwaiGrid) {
        if (show) {
            wabwaiGrid.addTo(map);
            basemapLayer.bringToBack();
        } else {
            map.removeLayer(wabwaiGrid);
        }
    }
    localStorage.setItem('showWABWAIGrid', show);
}

// Shows/hides the Heatmap layer
function enableHeatmap(show) {
    heatmapEnabled = show;
    if (heatmapLayer) {
        if (show) {
            // Repopulate the display
            try {
                heatmapLayer.setLatLngs(heatmapData);
            } catch (e) {}
            heatmapLayer.addTo(map);
            basemapLayer.bringToBack();
        } else {
            map.removeLayer(heatmapLayer);
        }
    }
    localStorage.setItem('heatmapEnabled', show);
}

// Shows/hides the Per-Band Heatmap layer
function enablePerBandHeatmap(show) {
    perBandHeatmapEnabled = show;
    if (perBandHeatmapsGroup) {
        if (show) {
            // Repopulate the display
            perBandHeatmaps.forEach((value, key) => {
                try {
                    value.setLatLngs(perBandHeatmapsData.get(key));
                } catch (e) {}
            });
            perBandHeatmapsGroup.addTo(map);
            basemapLayer.bringToBack();
        } else {
            map.removeLayer(perBandHeatmapsGroup);
        }
    }
    localStorage.setItem('perBandHeatmapEnabled', show);
}

// Enable/disable fine control of the map zoom level
function setFineZoomControl(enable) {
    if (enable) {
        map.options.zoomDelta = 0.25;
        map.options.zoomSnap = 0;
        map.options.wheelPxPerZoomLevel = 200;
    } else {
        map.options.zoomDelta = 1.0;
        map.options.zoomSnap = 1.0;
        map.options.wheelPxPerZoomLevel = 60;
    }
    fineZoomControl = enable;
    localStorage.setItem('fineZoomControl', fineZoomControl);
}

// Get text for the normal click-to-appear popups. Takes a data item that may contain multiple QSOs.
function getPopupText(d) {
    let text = "<span style='display:inline-block; white-space: nowrap;'><i class='fa-solid fa-user markerPopupIcon'></i>&nbsp;<span class='popupBlock'><a href='https://www.qrz.com/db/" + d.call + "' target='_blank'><b>" + d.call + "</b></a>";
    if (d.name) {
        text += "&nbsp;&nbsp;" + d.name;
    }
    text += "</span></span><br/>"

    // QTH information. If we have one or more QSOs with SIG/xOTA references but they're all the same, we list them. If
    // we don't have any QSOs with SIG/xOTA references, we use the qth text which will be from QRZ or HamQTH. If we have
    // more than one QSO with *different* references, we only display the grid here, and instead list the references
    // separately under each QSO.
    let sigRefsPerQSO = d.qsos.map(q => listSIGRefsWithLinks(q));
    let sigRefsExist = sigRefsPerQSO.every(v => v.length > 0);
    let sigRefsEqual = sigRefsPerQSO.every((val, i, arr) => val === arr[0]);

    text += "<span style='display:inline-block; white-space: nowrap;'><i class='fa-solid fa-location-dot markerPopupIcon'></i>&nbsp;<span class='popupBlock'>";
    if (!sigRefsExist) {
        if (d.qth) {
            text += d.qth + "&nbsp;&nbsp;&nbsp;";
        }
    } else if (sigRefsEqual) {
        text += sigRefsPerQSO[0] + "&nbsp;&nbsp;&nbsp;";
    }

    if (d.grid) {
        text += formatGrid(d.grid);
        if (qthPos) {
            text += "&nbsp;(" + getDistanceString(d) + ")";
        }
    }
    text += "</span></span><table class='popupQSOTable'>"

    getQSOsMatchingFilter(d).forEach(qso => {
        if (qso.freq || qso.time || (qso.comment && showComments)) {
            text += "<tr><td><i class='fa-solid fa-comment markerPopupIcon'></i></td><td>";
            if (qso.freq) {
                text += qso.freq.toFixed(3);
                if (qso.mode) {
                    text += "&nbsp;MHz&nbsp;" + qso.mode + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
                }
            }
            text += "</td><td style='text-align: right'>";
            if (qso.time) {
                text += qso.time.format("HH:mm[,&nbsp;]DD[&nbsp;]MMM[&nbsp;]YYYY");
            }
            text += "</td></tr>";

            // As above, if our SIG/xOTA references were different for each QSO, we now need to list them. Again if one set
            // is empty we use the QTH field if it exists. This could be the case if you have e.g. two QSOs with a hunter,
            // one of which was a P2P and the other they were at home, both in the same grid.
            if (sigRefsExist && !sigRefsEqual) {
                let sigRefs = listSIGRefsWithLinks(qso);
                if (sigRefs.length > 0) {
                    text += "<tr><td></td><td colspan='2'>" + sigRefs + "</td></tr>";
                } else if (d.qth) {
                    text += "<tr><td></td><td colspan='2'>" + d.qth + "</td></tr>";
                }
            }
            if (qso.comment && showComments) {
                text += "<tr><td></td><td colspan='2'>" + qso.comment + "</td></tr>";
            }

            text += "</tr>";
        }
    });
    text += "</table>";
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
        return "<div style='padding-top: 5px; color: " + (basemapIsDark ? "white" : "black") + "; text-align: center;'>" + labelText + "</div>";
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
        return "<div style='padding-top: 5px; color: " + (basemapIsDark ? "white" : "black") + "; text-align: center;'>" + labelText + "</div>";
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
                wrapEitherSideOfLon = qthPos[1];
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
            wabwaiGrid.options.color = WAB_WAI_GRID_COLOR_DARK;
        } else {
            maidenheadGrid.options.color = MAIDENHEAD_GRID_COLOR_LIGHT;
            cqZones.options.color = CQ_ZONES_COLOR_LIGHT;
            ituZones.options.color = ITU_ZONES_COLOR_LIGHT;
            wabwaiGrid.options.color = WAB_WAI_GRID_COLOR_LIGHT;
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
        if (showWABWAIGrid) {
            map.removeLayer(wabwaiGrid);
            wabwaiGrid.addTo(map);
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
async function updateStatus() {
    if (loadedAtLeastOnce) {
        let qsosDone = qsoCount - queue.length;
        let status = `<progress id="file" value="${qsosDone}" max="${qsoCount}"></progress>&nbsp;${qsosDone}/${qsoCount}`;
        if (qsosDone === qsoCount && qsoCount !== 0) {
            status = status + " <b>Done!</b>";
        }

        $("#loadingStatus").html(status);
        $("#loadingStatus").show();
    }
}

// Update the stats
function recalculateStats() {
    // Prepare a list of all QSOs, not structured underneath callsigns, to extract data that's easier to deal with this way.
    let allQSOs = [];
    data.forEach((d) => {
        d.qsos.forEach((qso) => {
            allQSOs.push(qso);
        });
    });

    // QSO and callsign count
    $("#stats-qso-count").text(allQSOs.length);
    $("#stats-call-count").text(data.size);

    // Sort QSOs by time, find start and end
    allQSOs.sort((a, b) => a.time < b.time ? -1 : 1);
    let totalDuration;
    if (allQSOs.length > 0) {
        $("#stats-start-time").text(allQSOs[0].time.format('DD MMM YYYY HH:mm'));
        if (allQSOs.length > 1) {
            totalDuration = moment.duration(allQSOs[allQSOs.length - 1].time.diff(allQSOs[0].time));
            $("#stats-end-time").text(allQSOs[allQSOs.length - 1].time.format('DD MMM YYYY HH:mm'));
            $("#stats-duration").text(formatDurationText(totalDuration));
        } else {
            $("#stats-end-time").text("-");
            $("#stats-duration").text("-");
        }
    } else {
        $("#stats-start-time").text("-");
        $("#stats-end-time").text("-");
        $("#stats-duration").text("-");
    }

    // Find any "off times". The rows for these are normally hidden, but if we have a gap of >1 hour anywhere in the
    // log, we consider this an "off time" for contesting purposes and show how much on/off time there was.
    if (allQSOs.length > 1) {
        let totalOffTime = moment.duration(0);
        for (let i = 1; i < allQSOs.length; i++) {
            let gap = moment.duration(allQSOs[i].time.diff(allQSOs[i - 1].time));
            if (gap.as('minutes') >= 60) {
                totalOffTime.add(gap);
            }
        }
        if (totalOffTime.as('minutes') > 0) {
            $("#stats-time-off").text(formatDurationText(totalOffTime));
            $("#stats-time-on").text(formatDurationText(totalDuration.subtract(totalOffTime)));
            $(".statsTimeOnOffRow").show();
        } else {
            $(".statsTimeOnOffRow").hide();
        }
    } else {
        $(".statsTimeOnOffRow").hide();
    }

    // Find all unique grids
    let allGridSquares = [...new Set(allQSOs.filter(q => q.grid != null && q.grid.length >= 4).map(q => q.grid.substring(0, 4)))].sort();
    $("#stats-gridsquare-count").text(allGridSquares.length);
    $("#stats-gridsquare-list").text(allGridSquares.join(", "));
    let allGridFields = [...new Set(allQSOs.filter(q => q.grid != null && q.grid.length >= 2).map(q => q.grid.substring(0, 2)))].sort();
    $("#stats-gridfield-count").text(allGridFields.length);
    $("#stats-gridfield-list").text(allGridFields.join(", "));

    // Find all unique DXCCs, sort them by their name
    let allDXCCs = [...new Set(allQSOs.filter(q => q.dxcc != null && q.dxcc !== "").map(q => q.dxcc))].sort((a, b) => DXCC_DATA[a].name < DXCC_DATA[b].name ? -1 : 1);
    $("#stats-dxcc-count").text(allDXCCs.length);
    // For DXCCs, the list is a bit more complex as we want counts per DXCC and names/flags. We also want the display to
    // be a table to improve the layout. So now we map DXCCs to QSOs and extract details, and build the table.
    let dxccTable = $("#stats-dxcc-table");
    dxccTable.html("");
    dxccTable.append("<thead><tr><th>DXCC</th><th>QSOs</th><th>DXCC</th><th>QSOs</th><th>DXCC</th><th>QSOs</th></tr></thead>");
    dxccTable.append("<tbody>");
    // Faff making the table because we need three sets of columns to use the space neatly
    let rowCount = Math.ceil(allDXCCs.length / 3.0) * 3;
    for (let row = 0; row < rowCount; row++) {
        let tr2 = $(`<tr></tr>`);
        for (let col = 0; col < 3; col++) {
            if (allDXCCs.length > (row * 3) + col) {
                // Create cells for DXCC flag/name and QSO count
                let dxcc = allDXCCs[(row * 3) + col];
                let qsosInDXCC = [...new Set(allQSOs.filter(q => q.dxcc === dxcc))];
                tr2.append(`<td><img src="img/flags/${dxcc}.png" class="flag" width="24" alt="${DXCC_DATA[dxcc].name} flag"/>&nbsp;${DXCC_DATA[dxcc].name}</td>`);
                tr2.append(`<td>${qsosInDXCC.length}</td>`);
            }
        }
        dxccTable.find('tbody').append(tr2);
    }

    // Find all unique CQ zones
    let allCQZs = [...new Set(allQSOs.filter(q => q.cqz != null && q.cqz !== "").map(q => q.cqz))].sort((a, b) => parseInt(a) < parseInt(b) ? -1 : 1);
    $("#stats-cqz-count").text(allCQZs.length);
    $("#stats-cqz-list").text(allCQZs.join(", "));

    // Find all unique ITU zones
    let allITUZs = [...new Set(allQSOs.filter(q => q.ituz != null && q.ituz !== "").map(q => q.ituz))].sort((a, b) => parseInt(a) < parseInt(b) ? -1 : 1);
    $("#stats-ituz-count").text(allITUZs.length);
    $("#stats-ituz-list").text(allITUZs.join(", "));

    // Find all combinations of band and mode, and for each mode note down how many uses there were.
    let bandsUsed = [...new Set(allQSOs.map(q => q.band))];
    let modeFamilies = ["CW", "Phone", "Data"];

    // Create band/mode table
    let bandModeTable = $("#stats-band-mode-table");
    bandModeTable.html("");
    bandModeTable.append("<thead><tr><th>Band</th><th>QSOs</th></tr></thead>");
    bandModeTable.append("<tbody>");
    modeFamilies.forEach(m => {
        bandModeTable.find('thead tr').append(`<th>${m}</th>`);
    });
    BANDS.forEach(band => {
       if (bandsUsed.includes(band.name)) {
           let tr = $(`<tr></tr>`);
           tr.append(`<th>${band.name}</th>`);
           tr.append(`<td>${allQSOs.filter(q => q.band === band.name).length}</td>`);
           modeFamilies.forEach(m => {
               tr.append(`<td>${allQSOs.filter(q => q.band === band.name && getModeFamily(q.mode) === m).length}</td>`);
           });
           bandModeTable.find('tbody').append(tr);
       }
    });

}
