/////////////////////////////
//    UTILITY FUNCTIONS    //
/////////////////////////////

// Utility to convert an object created by JSON.parse() into a proper JS map.
function objectToMap(o) {
    let m = new Map();
    for (let k of Object.keys(o)) {
        m.set(k, o[k]);
    }
    return m;
}

// Set the QTH location to the provided grid
function setQTH(newPos) {
    // Store position
    qthPos = newPos;
    // Add or replace the marker
    createOwnPosMarker(newPos);
}

// Create and apply the own position marker
function createOwnPosMarker(newPos) {
    if (ownPosLayer == null) {
        ownPosLayer = new L.LayerGroup();
        ownPosLayer.addTo(map);
    }
    if (ownPosMarker != null) {
        ownPosLayer.removeLayer(ownPosMarker);
    }

    if (qthMarker && newPos != null) {
        ownPosMarker = L.marker(newPos, {
            icon: L.ExtraMarkers.icon({
                icon: 'fa-tower-cell',
                iconColor: 'white',
                markerColor: 'grey',
                shape: 'circle',
                prefix: 'fa',
                svg: true
            }),
            autoPan: true
        });
        ownPosLayer.addLayer(ownPosMarker);
    }
}

// Convert a Maidenhead grid reference of arbitrary precision to the lat/long of the southwest corner of the square.
function latLonForGridSWCorner(grid) {
    [lat, lon, latCellSize, lonCellSize] = latLonForGridSWCornerPlusSize(grid);
    return [lat, lon];
}

// Convert a Maidenhead grid reference of arbitrary precision to the lat/long of the northeast corner of the square.
function latLonForGridNECorner(grid) {
    [lat, lon, latCellSize, lonCellSize] = latLonForGridSWCornerPlusSize(grid);
    return [lat + latCellSize, lon + lonCellSize];
}

// Convert a Maidenhead grid reference of arbitrary precision to the lat/long of the centre point of the square.
function latLonForGridCentre(grid) {
    [lat, lon, latCellSize, lonCellSize] = latLonForGridSWCornerPlusSize(grid);
    return [lat + latCellSize / 2.0, lon + lonCellSize / 2.0];
}

// Convert a Maidenhead grid reference of arbitrary precision to lat/long, including in the result the size of the
// lowest grid square. This is a utility method used by the main methods that return the centre, southwest, and
// northeast coordinates of a grid square.
function latLonForGridSWCornerPlusSize(grid) {
    // Make sure we are in upper case so our maths works. Case is arbitrary for Maidenhead references
    grid = grid.toUpperCase();

    // Return null if our Maidenhead string is invalid or too short
    let len = grid.length;
    if (len <= 0 || (len % 2) !== 0) {
        return null;
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
                return null;
            }
        } else {
            // Numbers in this block
            lonCellNo = parseInt(grid.charAt(block * 2));
            latCellNo = parseInt(grid.charAt(block * 2 + 1));
            // Bail if the values aren't in range 0-9..
            if (latCellNo < 0 || latCellNo > 9 || lonCellNo < 0 || lonCellNo > 9) {
                return null;
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

    return [lat, lon, latCellSize, lonCellSize];
}

// Returns a colour based on data item's QSOs' band or mode, if enabled, otherwise returns neutral blue.
// If there would be multiple colours, purple is used.
function qsoToColour(d) {
    let qsoColours = [];
    d.qsos.forEach((qso) => {
        if (bandColours) {
            let found = false;
            for (band of BANDS) {
                let f = parseFloat(qso.freq);
                if (f >= band.startFreq && f <= band.stopFreq) {
                    qsoColours.push(band.color);
                    found = true;
                }
            }
            if (!found) {
                qsoColours.push("grey");
            }

        } else if (modeColours) {
            if (qso.mode) {
                if (qso.mode === "SSB" || qso.mode === "USB" || qso.mode === "LSB") {
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
            qsoColours.push("dodgerblue");
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
    d.qsos.forEach((qso) => {
        if (bandColours) {
            let found = false;
            let f = parseFloat(qso.freq);
            for (band of BANDS) {
                if (f >= band.startFreq && f <= band.stopFreq) {
                    qsoColours.push(band.contrastColor);
                    found = true;
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
function getIcon(d) {
    return L.ExtraMarkers.icon({
        icon: getIconName(d),
        iconColor: qsoToContrastColor(d),
        markerColor: qsoToColour(d),
        shape: 'circle',
        prefix: 'fa',
        svg: true
    });
}

// Get Font Awesome icon name for the data item. If multiple icons would be used, a star is used instead.
function getIconName(d) {
    if (outdoorSymbols) {
        // Outdoor activity symbols in use, so figure out what they are for each QSO.
        let qsoIcons = [];
        d.qsos.forEach((qso) => {
            if (qso.program && qso.program.length > 0) {
                let program = qso.program;
                if (program === "POTA") {
                    qsoIcons.push("fa-tree");
                } else if (program === "SOTA") {
                    qsoIcons.push("fa-mountain-sun");
                } else if (program === "WWFF") {
                    qsoIcons.push("fa-seedling");
                } else if (program === "GMA") {
                    qsoIcons.push("fa-person-hiking");
                } else if (program === "WWBOTA" || program === "UKBOTA") {
                    qsoIcons.push("fa-radiation");
                } else if (program === "IOTA") {
                    qsoIcons.push("fa-umbrella-beach");
                } else if (program === "WCA") {
                    qsoIcons.push("fa-chess-rook");
                } else if (program === "ALHRS") {
                    qsoIcons.push("fa-tower-observation");
                } else if (program === "MOTA") {
                    qsoIcons.push("fa-fan");
                } else {
                    qsoIcons.push("fa-crosshairs");
                }
            } else if (hybridMarkerSize) {
                // This is a QSO with a hunter, and we have hybrid size turned on, so this will be a small marker, and we want no icon.
                qsoIcons.push("fa-none");
            } else {
                // This is a QSO with a hunter, and we don't have hybrid size on, so use crosshairs symbol.
                qsoIcons.push("fa-crosshairs");
            }
        });
        let allEqual = qsoIcons.every( (val, i, arr) => val === arr[0] );
        if (allEqual) {
            // All QSOs with this callsign + grid have the same icon, so use it
            return qsoIcons[0];
        } else {
            // Multiple different icons are specified by this QSO set, so show a star
            return "fa-star";
        }
    } else if (smallMarkers) {
        // Outdoor activity icons not in use, and small icons set, so use no symbol.
        return "fa-none";
    } else {
        // Outdoor activity icons not in use, and small icons not set, so use a circle symbol like a "standard" map marker.
        return "fa-circle"
    }
}
