/////////////////////////////
//    UTILITY FUNCTIONS    //
/////////////////////////////

// Set the QTH location to the provided grid
function setQTH(newPos) {
    // Store position
    qthPos = newPos;
    // Add or replace the marker
    createOwnPosMarker(newPos);
}

// Create and apply the own position marker
function createOwnPosMarker(newPos) {
    if (ownPosMarker != null) {
        ownPosLayer.removeLayer(ownPosMarker);
    }

    if (qthMarker && newPos != null) {
        if (circleMarkers) {
            ownPosMarker = L.circleMarker(newPos, { radius: 5 * markerSize, fillOpacity: 1.0, opacity: 1.0, weight: 1, fill: true, color: "black", fillColor: "grey", stroke: outlineMarkers });
        } else {
            ownPosMarker = L.marker(newPos, {
                icon: L.ExtraMarkers.icon({
                    icon: (markerSize >= 0.75) ? 'fa-tower-cell' : 'fa-none',
                    iconColor: 'white',
                    markerColor: 'grey',
                    shape: 'circle',
                    prefix: 'fa',
                    svg: true
                }),
                autoPan: true
            });
        }

        let tooltipText = getOwnQTHTooltipText();
        if (tooltipText) {
            ownPosMarker.bindTooltip(tooltipText, {permanent: true, direction: 'bottom', offset: L.point(0, -10)});
        }

        ownPosLayer.addLayer(ownPosMarker);

        // Adjust marker size (if we're using real markers not circles, circles already have their radius set at
        // creation, whereas markers need CSS applied here)
        if (!circleMarkers) {
            $(ownPosMarker._icon).find("svg").css("width", (32 * markerSize) + "px");
            $(ownPosMarker._icon).find("svg").css("height", (44 * markerSize) + "px");
            $(ownPosMarker._icon).find("svg").css("margin-top", ((1 - markerSize) * 40) + "px");
            $(ownPosMarker._icon).find("svg").css("margin-left", ((1 - markerSize) * 8) + "px");
            $(ownPosMarker._icon).find("i").css("font-size", (14 + (markerSize - 1) * 10) + "px");
            $(ownPosMarker._icon).find("i").css("margin-top", (10 + (1 - markerSize) * 28) + "px");
            $(ownPosMarker._icon).find("i").css("position", "absolute");
            $(ownPosMarker._icon).find("i").css("top", "0px");
            let ml = 0;
            if (markerSize > 1.4) {
                ml = 3;
            } else if (markerSize < 0.9 || (markerSize > 1.1 && markerSize < 1.4)) {
                ml = 1;
            }
            $(ownPosMarker._icon).find("i").css("margin-left", ml + "px");
        }

        // Use outlined icons if requested (standard markers version, needs doing after adding to layer)
        if (!circleMarkers && outlineMarkers) {
            $(ownPosMarker._icon).addClass("outlinedmarker");
        }
    }
}

// Convert a Maidenhead grid reference of arbitrary precision to the lat/long of the southwest corner of the square.
// Returns null if the grid format is invalid.
function latLonForGridSWCorner(grid) {
    let [lat, lon, latCellSize, lonCellSize] = latLonForGridSWCornerPlusSize(grid);
    if (lat != null && lon != null) {
        return [lat, lon];
    } else {
        return null;
    }
}

// Convert a Maidenhead grid reference of arbitrary precision to the lat/long of the northeast corner of the square.
// Returns null if the grid format is invalid.
function latLonForGridNECorner(grid) {
    let [lat, lon, latCellSize, lonCellSize] = latLonForGridSWCornerPlusSize(grid);
    if (lat != null && lon != null && latCellSize != null && lonCellSize != null) {
        return [lat + latCellSize, lon + lonCellSize];
    } else {
        return null;
    }
}

// Convert a Maidenhead grid reference of arbitrary precision to the lat/long of the centre point of the square.
// Returns null if the grid format is invalid.
function latLonForGridCentre(grid) {
    let [lat, lon, latCellSize, lonCellSize] = latLonForGridSWCornerPlusSize(grid);
    if (lat != null && lon != null && latCellSize != null && lonCellSize != null) {
        return [lat + latCellSize / 2.0, lon + lonCellSize / 2.0];
    } else {
        return null;
    }
}

// Convert a Maidenhead grid reference of arbitrary precision to lat/long, including in the result the size of the
// lowest grid square. This is a utility method used by the main methods that return the centre, southwest, and
// northeast coordinates of a grid square.
// The return type is always an array of size 4. The elements in it are null if the grid format is invalid.
function latLonForGridSWCornerPlusSize(grid) {
    // Make sure we are in upper case so our maths works. Case is arbitrary for Maidenhead references
    grid = grid.toUpperCase();

    // Return null if our Maidenhead string is invalid or too short
    let len = grid.length;
    if (len <= 0 || (len % 2) !== 0) {
        return [null, null, null, null];
    }

    let lat = 0.0; // aggregated latitude
    let lon = 0.0; // aggregated longitude
    let latCellSize = 10; // Size in degrees latitude of the current cell. Starts at 20 and gets smaller as the calculation progresses
    let lonCellSize = 20; // Size in degrees longitude of the current cell. Starts at 20 and gets smaller as the calculation progresses
    let latCellNo; // grid latitude cell number this time
    let lonCellNo; // grid longitude cell number this time

    // Iterate through blocks (two-character sections)
    for (let block = 0; block * 2 < len; block += 1) {
        if (block % 2 === 0) {
            // Letters in this block
            lonCellNo = grid.charCodeAt(block * 2) - 'A'.charCodeAt(0);
            latCellNo = grid.charCodeAt(block * 2 + 1) - 'A'.charCodeAt(0);
            // Bail if the values aren't in range. Allowed values are A-R (0-17) for the first letter block, or
            // A-X (0-23) thereafter.
            let maxCellNo = (block === 0) ? 17 : 23;
            if (latCellNo < 0 || latCellNo > maxCellNo || lonCellNo < 0 || lonCellNo > maxCellNo) {
                return [null, null, null, null];
            }
        } else {
            // Numbers in this block
            lonCellNo = parseInt(grid.charAt(block * 2));
            latCellNo = parseInt(grid.charAt(block * 2 + 1));
            // Bail if the values aren't in range 0-9..
            if (latCellNo < 0 || latCellNo > 9 || lonCellNo < 0 || lonCellNo > 9) {
                return [null, null, null, null];
            }
        }

        // Aggregate the angles
        lat += latCellNo * latCellSize;
        lon += lonCellNo * lonCellSize;

        // Reduce the cell size for the next block, unless we are on the last cell.
        if (block * 2 < len - 2) {
            // Still have more work to do, so reduce the cell size
            if (block % 2 === 0) {
                // Just dealt with letters, next block will be numbers so cells will be 1/10 the current size
                latCellSize = latCellSize / 10.0;
                lonCellSize = lonCellSize / 10.0;
            } else {
                // Just dealt with numbers, next block will be letters so cells will be 1/24 the current size
                latCellSize = latCellSize / 24.0;
                lonCellSize = lonCellSize / 24.0;
            }
        }
    }

    // Offset back to (-180, -90) where the grid starts
    lon -= 180.0;
    lat -= 90.0;

    // Return nulls on maths errors
    if (isNaN(lat) || isNaN(lon) || isNaN(latCellSize) ||  isNaN(lonCellSize)) {
        return [null, null, null, null];
    }

    return [lat, lon, latCellSize, lonCellSize];
}

// Returns a colour based on data item's QSOs' band or mode, if enabled, otherwise returns neutral blue.
// If there would be multiple colours, purple is used.
function qsoToColour(d) {
    let qsoColours = [];
    getQSOsMatchingFilter(d).forEach((qso) => {
        if (bandColours) {
            let found = false;
            for (band of BANDS) {
                if (qso.band === band.name) {
                    qsoColours.push(band.color);
                    found = true;
                    break;
                }
            }
            if (!found) {
                qsoColours.push("grey");
            }

        } else if (modeColours) {
            if (qso.mode) {
                if (getModeFamily(qso.mode) === "Phone") {
                    qsoColours.push("green");
                } else if (qso.mode === "CW") {
                    qsoColours.push("red");
                } else {
                    qsoColours.push("blue");
                }
            } else {
                qsoColours.push("grey");
            }

        } else {
            qsoColours.push(fixedMarkerColour);
        }
    });
    let allEqual = qsoColours.every( (val, i, arr) => val === arr[0] );
    if (allEqual) {
        return qsoColours[0];
    } else {
        return "rebeccapurple";
    }
}

// Returns a colour to contrast with the result of qsoToColor, based on data item QSOs' bands or modes, if enabled,
// otherwise returns white.
function qsoToContrastColor(d) {
    let qsoColours = [];
    getQSOsMatchingFilter(d).forEach((qso) => {
        if (bandColours) {
            let found = false;
            for (band of BANDS) {
                if (qso.band === band.name) {
                    qsoColours.push(band.contrastColor);
                    found = true;
                    break;
                }
            }
            if (!found) {
                qsoColours.push("white");
            }
        } else if (modeColours) {
            qsoColours.push("white");
        } else {
            qsoColours.push("white");
        }
    });
    let allEqual = qsoColours.every( (val, i, arr) => val === arr[0] );
    if (allEqual) {
        return qsoColours[0];
    } else {
        return "white";
    }
}

// Get an icon for a data item, based on its band, using PSK Reporter colours, its program etc.
function getIcon(d, thisMarkerSize) {
    return L.ExtraMarkers.icon({
        // If marker scale is less than 75%, there's no room for an icon
        icon: (thisMarkerSize >= 0.75) ? getIconName(d) : "fa-none",
        iconColor: qsoToContrastColor(d),
        markerColor: qsoToColour(d),
        shape: 'circle',
        prefix: 'fa',
        svg: true
    });
}

// Get Font Awesome icon name for the data item. If multiple icons would be used, a star is used instead.
function getIconName(d) {
    let chosenIcon;
    if (outdoorSymbols) {
        // Outdoor activity symbols in use, so figure out what they are for each QSO.
        let qsoIcons = [];
        getQSOsMatchingFilter(d).forEach((qso) => {
            // First, see if the QSO has any Special Interest Group (e.g. xOTA) references set.
            if (qso.sigRefs && qso.sigRefs.length > 0) {
                qso.sigRefs.forEach(p => {
                    if (p.program === "POTA") {
                        qsoIcons.push("fa-tree");
                    } else if (p.program === "SOTA") {
                        qsoIcons.push("fa-mountain-sun");
                    } else if (p.program === "WWFF") {
                        qsoIcons.push("fa-seedling");
                    } else if (p.program === "GMA") {
                        qsoIcons.push("fa-person-hiking");
                    } else if (p.program === "WWBOTA" || p.program === "UKBOTA") {
                        qsoIcons.push("fa-radiation");
                    } else if (p.program === "IOTA") {
                        qsoIcons.push("fa-umbrella-beach");
                    } else if (p.program === "WCA") {
                        qsoIcons.push("fa-chess-rook");
                    } else if (p.program === "ARLHS") {
                        qsoIcons.push("fa-tower-observation");
                    } else if (p.program === "MOTA") {
                        qsoIcons.push("fa-fan");
                    } else {
                        // A program was set but not one we recognise, so show a question mark
                        qsoIcons.push("fa-question");
                    }
                });

            } else if (inferOutdoorActivitiesFromComments && qso.comment && qso.comment.length > 0) {
                // Now if we are allowed to infer outdoor activities from comments, parse the comments for anything useful
                let comment = qso.comment.toUpperCase();
                if (comment.includes("POTA") || comment.includes("P2P") || comment.includes("PARK")) {
                    qsoIcons.push("fa-tree");
                } else if (comment.includes("SOTA") || comment.includes("S2S") || comment.includes("SUMMIT")) {
                    qsoIcons.push("fa-mountain-sun");
                } else if (comment.includes("WWFF")) {
                    qsoIcons.push("fa-seedling");
                } else if (comment.includes("GMA")) {
                    qsoIcons.push("fa-person-hiking");
                } else if (comment.includes("BOTA") || comment.includes("BUNKER")) {
                    qsoIcons.push("fa-radiation");
                } else if (comment.includes("IOTA") || comment.includes("ISLAND")) {
                    qsoIcons.push("fa-umbrella-beach");
                } else if (comment.includes("WCA") || comment.includes("CASTLE")) {
                    qsoIcons.push("fa-chess-rook");
                } else if (comment.includes("ALHRS") || comment.includes("LIGHTHOUSE")) {
                    qsoIcons.push("fa-tower-observation");
                } else if (comment.includes("MOTA") || comment.includes("MILL")) {
                    qsoIcons.push("fa-fan");
                } else {
                    qsoIcons.push("fa-crosshairs");
                }
            } else {
                // No outdoor activity program could be inferred. Since "show activity symbols" is on, we assume we were portable, so
                // this is a QSO with a hunter, and we don't have hybrid size on, so use crosshairs symbol.
                qsoIcons.push("fa-crosshairs");
            }
        });
        let allEqual = qsoIcons.every( (val, i, arr) => val === arr[0] );
        if (allEqual) {
            // All QSOs with this callsign + grid have the same icon, so use it
            chosenIcon = qsoIcons[0];
        } else {
            // Multiple different icons are specified by this QSO set, so show a star
            chosenIcon = "fa-star";
        }
    } else {
        // Outdoor activity icons not in use, and normal or larger size icons in use, so use a circle symbol like a
        // "standard" map marker.
        chosenIcon = "fa-circle"
    }
    return chosenIcon;
}

// Utility function to get the distance to a QSO's grid from your grid, in a format for displaying on screen.
// If there is insufficient data, a blank string is returned.
function getDistanceString(d) {
    let ret = "";
    if (d.grid && qthPos) {
        let iconPos = getIconPosition(d);
        let distanceMetres = L.GeometryUtil.length([new L.LatLng(qthPos[0], qthPos[1]), new L.LatLng(iconPos[0], iconPos[1])]);
        if (distanceUnit === "mi") {
            ret = (distanceMetres / 1609.0).toFixed(0) + "&nbsp;mi";
        } else {
            ret = (distanceMetres / 1000.0).toFixed(0) + "&nbsp;km";
        }
    }
    return ret;
}

// Format a Maidenhead grid with alternating alphabetic blocks in lower case
function formatGrid(grid) {
    grid = grid.toUpperCase();
    if (grid.length >= 6) {
        grid = grid.substring(0, 4) + grid.substring(4, 6).toLowerCase() + grid.substring(6);
    }
    if (grid.length >= 12) {
        grid = grid.substring(0, 10) + grid.substring(10, 12).toLowerCase() + grid.substring(14);
    }
    return grid;
}

// Takes a frequency and determines which band it belongs to, returned as a string.
// Null is returned if the frequency is null, invalid, or outside the ham bands.
function freqToBandName(f) {
    for (band of BANDS) {
        if (f >= band.startFreq && f <= band.stopFreq) {
            return band.name;
        }
    }
    return null;
}

// Return true if the QSO matches the current filter, false otherwise.
function qsoMatchesFilter(qso) {
    return (filterYear === "*" ||  qso.year === parseInt(filterYear)) && (filterMode === "*" || qso.mode === filterMode)
        && (filterBand === "*" || qso.band === filterBand);
}

// Return any QSOs in this data object that match the current filter.
function getQSOsMatchingFilter(d) {
    return d.qsos.filter(q => qsoMatchesFilter(q));
}

// Return true if any QSO in this data object matches the current filter, false otherwise.
function anyQSOMatchesFilter(d) {
    return getQSOsMatchingFilter(d).length > 0;
}

// Given a QSO, list any SIG/xOTA references that the QSO partner was logged at, as a string in a deterministic order,
// including HTML links to each reference. If there are none, a blank string will be returned.
function listSIGRefsWithLinks(q) {
    if (q.sigRefs != null) {
        return "" + q.sigRefs.map(p => sigRefToHTMLLink(p)).sort().join(", ");
    } else {
        return "";
    }
}

// For a given SIG/xOTA reference, produce an HTML link to it in the relevant programme.
function sigRefToHTMLLink(p) {
    let url = getURLforReference(p.program, p.ref);
    if (url) {
        return "<a href='" + url + "' target='_blank'>" + p.ref + "</a>";
    } else {
        return p.ref;
    }
}

// Take a SIG/xOTA program and reference, and produce a URL to go to the relevant part/summit/etc. page on
// the program's website.
function getURLforReference(program, reference) {
    if (program === "POTA") {
        return "https://pota.app/#/park/" + reference;
    } else if (program === "SOTA") {
        return "https://www.sotadata.org.uk/en/summit/" + reference;
    } else if (program === "WWFF") {
        return "https://wwff.co/directory/?showRef=" + reference;
    } else if (program === "WWBOTA" || program === "UKBOTA") {
        if (reference.substring(0,3) === "B/G") {
            return "https://bunkerwiki.org/?s=" + reference;
        } else {
            return null;
        }
    } else if (program === "GMA" || program === "IOTA" || program === "WCA" || program === "ARLHS" || program === "MOTA") {
        return "https://www.cqgma.org/zinfo.php?ref=" + reference;
    } else {
        return null;
    }
}

// Format a duration for the stats panel
function formatDurationText(duration) {
    let durationMins = duration.as('minutes');
    let durationHours = Math.floor(durationMins / 60.0);
    durationMins = durationMins - (durationHours * 60.0);
    if (durationHours === 0) {
        return durationMins + " minute" + (durationMins === 1 ? "" : "s");
    } else if (durationHours === 1) {
        return durationHours + " hour " + durationMins + " min" + (durationMins === 1 ? "" : "s");
    } else if (durationHours < 72) {
        return durationHours + " hours " + durationMins + " min" + (durationMins === 1 ? "" : "s");
    } else {
        let durationDays = Math.ceil(durationHours / 24.0);
        return durationDays + " days ";
    }
}

// For a mode, return the "mode family".
function getModeFamily(mode) {
    if (mode.toUpperCase() === "CW") {
        return "CW";
    } else if (["PHONE", "PH", "SSB", "USB", "LSB", "AM", "FM", "DV", "DMR", "DSTAR", "C4FM", "M17"].includes(mode.toUpperCase())) {
        return "Phone";
    } else {
        return "Data";
    }
}