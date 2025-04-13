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

/* Get the latitude and longitude for a Maidenhead (grid square) Locator.
 *
 * This function takes a single string parameter that is a Maidenhead (grid
 * square) Locator. It must be 4 or 6 characters in length.
 *
 * Returns an array of floating point numbers `[latitude, longitude]`.
 *
 * Based on code by Paul Brewer KI6CQ and Stephen Houser N1SH
 * https://gist.github.com/stephenhouser/4ad8c1878165fc7125cb547431a2bdaa
 */
function latLonForGrid(grid) {
    if (grid) {
        grid = grid.toUpperCase();
        var lat = 0.0;
        var lon = 0.0;

        function lat4(g) {
            return 10 * (g.charCodeAt(1) - 'A'.charCodeAt(0)) + parseInt(g.charAt(3)) - 90;
        }

        function lon4(g) {
            return 20 * (g.charCodeAt(0) - 'A'.charCodeAt(0)) + 2 * parseInt(g.charAt(2)) - 180;
        }

        if (/^[A-R]{2}[0-9]{2}$/.test(grid)) {
            // Decode 4-character grid square
            lat = lat4(grid) + 0.5;
            lon = lon4(grid) + 1;
        } else if (/[A-R]{2}[0-9]{2}[A-X]{2}$/.test(grid)) {
            // Decode 6-character grid square
            lat = lat4(grid) + (1.0 / 60.0) * 2.5 * (grid.charCodeAt(5) - 'A'.charCodeAt(0) + 0.5);
            lon = lon4(grid) + (1.0 / 60.0) * 5 * (grid.charCodeAt(4) - 'A'.charCodeAt(0) + 0.5);
        } else {
            console.log("latLonForGrid: invalid grid: " + grid + ". Only 4 and 6 char grids supported");
        }

        return [lat, lon];
    }
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
    } else  if (smallIcons) {
        return "fa-none";
    } else {
        return "fa-circle"
    }
}
