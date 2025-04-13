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
            m.tooltip = getTooltipText(q);

            // Add geodesic line
            if (qthPos != null) {
                let line = L.geodesic([qthPos, m.getLatLng()], {
                    color: qsoToColour(q),
                    wrap: false,
                    steps: 5,
                    weight: 1
                });
                linesLayer.addLayer(line);
                console.log(line);
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
    map.fitBounds(group.getBounds().pad(0.05));
}



/////////////////////////////
//  QSO DISPLAY FUNCTIONS //
/////////////////////////////

// Tooltip text for the normal click-to-appear tooltips
function getTooltipText(qso) {
    // todo
    return "";
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
