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

// Convert a Maidenhead grid reference to lat/long. Based on C code from
// https://www.hexnut.net/2019/05/maidenhead-locator-to-gps-and-back.html
function latLonForGrid(grid) {
    grid = grid.toUpperCase();

    // Scaling table. Applied in degrees longitude, so latitude will be half this
    let table = [
        20.0,
        2.0,
        (1.0 / 12.0),
        (1.0 / 120.0),
        (1.0 / 2880.0),
        (1.0 / 28800.0),
        (1.0 / 6912000.0),
        (1.0 / 69120000.0),
        (1.0 / 165888000.0)
    ];

    let len = grid.length;

    // Return null if our Maidenhead string is invalid or too short or longer than we know what to do with
    if (len <= 0 || (len % 2) !== 0 || len > table.length * 2) {
        return null;
    }

    let j = 0;
    let lat = 0.0; // aggregated latitude
    let lon = 0.0; // aggregated longitude
    let uc; // grid longitude cell number
    let ud; // grid latitude cell number

    for (let i = 0; i < len; i += 2) {
        if (j % 2 === 0) {
            // Alphabetic characters in this block
            uc = grid.charCodeAt(i) - 'A'.charCodeAt(0);
            ud = grid.charCodeAt(i + 1) - 'A'.charCodeAt(0);
        } else {
            // Numeric characters in this block
            uc = parseInt(grid.charAt(i));
            ud = parseInt(grid.charAt(i+1));
        }
        lon += uc * table[j];
        lat += ud * table[j];
        j++;
    }

    // Correct for latitude blocks being half the size of longitude blocks
    lat /= 2.0;

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
