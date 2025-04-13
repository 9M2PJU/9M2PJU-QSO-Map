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

    if (newPos != null) {
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

// Convert a Maidenhead grid reference of arbitrary precision to lat/long.
function latLonForGrid(grid) {
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
        } else {
            // Numbers in this block
            lonCellNo = parseInt(grid.charAt(block * 2));
            latCellNo = parseInt(grid.charAt(block * 2+1));
        }

        // Aggregate the angles
        lat += latCellNo * latCellSize;
        lon += lonCellNo * lonCellSize;

        // Reduce the cell size for the next block, unless we are on the last cell. If we are on the last cell, instead
        // move the position into the middle of the cell rather than its south-west corner.
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
        } else {
            // This is the last block, so move the marker to the middle.
            lat += latCellSize / 2;
            lon += lonCellSize / 2;
        }
    }

    // Offset back to (-180, -90) where the grid starts
    lon -= 180.0;
    lat -= 90.0;

    return [lat, lon];
}

// Returns a colour based on QSO band, if enabled, otherwise returns neutral blue
function qsoToColour(qso) {
    if (bandColours) {
        for (band of BANDS) {
            let f = parseFloat(qso.get("FREQ"));
            if (f >= band.startFreq && f <= band.stopFreq) {
                return band.color;
            }
        }
        return "grey";
    }
    return "dodgerblue";
}

// Returns a colour to contrast with the result of qsoToColor, based on QSO band, if enabled, otherwise returns white
function qsoToContrastColor(qso) {
    if (bandColours) {
        let f = parseFloat(qso.get("FREQ"));
        for (band of BANDS) {
            if (f >= band.startFreq && f <= band.stopFreq) {
                return band.contrastColor;
            }
        }
    }
    return "white";
}

// Get an icon for a qso, based on its band, using PSK Reporter colours, its program etc.
function getIcon(qso) {
    return L.ExtraMarkers.icon({
        icon: getIconName(qso),
        iconColor: qsoToContrastColor(qso),
        markerColor: qsoToColour(qso),
        shape: 'circle',
        prefix: 'fa',
        svg: true
    });
}

// Get Font Awesome icon name for the QSO
function getIconName(qso) {
    if (outdoorSymbols) {
        if (qso.has("SIG")) {
            program = qso.get("SIG");
            if (program === "POTA") {
                return "fa-tree";
            } else if (program === "SOTA") {
                return "fa-mountain-sun";
            } else if (program === "WWFF") {
                return "fa-seedling";
            } else if (program === "GMA") {
                return "fa-person-hiking";
            } else if (program === "WWBOTA" || program === "UKBOTA") {
                return "fa-radiation";
            } else if (program === "IOTA") {
                return "fa-umbrella-beach";
            } else if (program === "WCA") {
                return "fa-chess-rook";
            } else if (program === "ALHRS") {
                return "fa-tower-observation";
            } else if (program === "MOTA") {
                return "fa-fan";
            }
        }
        return "fa-crosshairs";
    } else if (smallIcons) {
        return "fa-none";
    } else {
        return "fa-circle"
    }
}
