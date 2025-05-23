/////////////////////////////
//    LOOKUP FUNCTIONS     //
/////////////////////////////

// Use a QSO's callsign to look up data on QRZ.com and fill in any missing info.
function performQRZLookup(qso) {
    if (qso.call) {
        // See if we already have data about this callsign cached from a previous lookup
        if (lookupData.has(qso.call)) {
            // Already looked up this call, so just use that data and don't re-query
            // Make sure we don't override any existing data in the QSO from a lookup.
            if (!qso.name) {
                qso.name = lookupData.get(qso.call).name;
            }
            if (!qso.qth) {
                qso.qth = lookupData.get(qso.call).qth;
            }
            if (!qso.grid) {
                qso.grid = lookupData.get(qso.call).grid;
            }

        } else {
            // Nothing in the cache, so make a lookup request.
            $.ajax({
                url: QRZ_API_BASE_URL,
                data: {s: qrzToken, callsign: encodeURI(qso.call), agent: QRZ_AGENT},
                dataType: 'xml',
                async: false,
                timeout: 10000,
                success: async function (result) {
                    let grid = $(result).find("grid");
                    if (grid && grid.text().length > 0) {
                        // We have a good grid, so assign it to the QSO to make it ready to go into the data map.
                        qso.grid = grid.text();

                        // Get some name & QTH information for the QSO if we have it
                        if (!qso.name) {
                            let fname = $(result).find("fname");
                            let name = $(result).find("name");
                            let nameJoined = "";
                            if (fname && fname.text().length > 0) {
                                nameJoined += fname.text();
                            }
                            if (name && name.text().length > 0) {
                                nameJoined += " " + name.text();
                            }
                            qso.name = nameJoined;
                        }
                        if (!qso.qth) {
                            let country = $(result).find("country");
                            if (country && country.text().length > 0) {
                                qso.qth = country.text();
                            }
                        }

                        // Store the looked up info in case we see this callsign again, then we don't need to query the
                        // API unnecessarily.
                        lookupData.set(qso.call, {grid: qso.grid, name: qso.name, qth: qso.qth});
                        localStorage.setItem('lookupData', JSON.stringify(Object.fromEntries(lookupData)));

                    } else {
                        // No grid in response or call is not in the QRZ database.
                        console.log("QRZ.com had no grid for " + qso.call);
                    }
                },
                error: function () {
                    console.log("Error from QRZ.com when looking up " + qso.call);
                }
            });
        }
    }
}

// Use a QSO's POTA reference to look up a grid.
function performPOTALookup(qso) {
    let url = POTA_PARK_BASE_URL + qso.ref;
    $.ajax({
        url: url,
        dataType: 'json',
        async: false,
        timeout: 10000,
        success: async function (result) {
            qso.grid = result.grid6;
            qso.qth = result.reference + " " + result.name;
        }
    });
}

// Use a QSO's SOTA reference to look up a grid.
function performSOTALookup(qso) {
    let url = SOTA_SUMMIT_BASE_URL + qso.ref;
    $.ajax({
        url: url,
        dataType: 'json',
        async: false,
        timeout: 10000,
        success: async function (result) {
            qso.grid = result.locator;
            qso.qth = result.summitCode + " " + result.name;
        }
    });
}

// Use a QSO's WWBOTA reference to look up a grid.
function performWWBOTALookup(qso) {
    let url = WWBOTA_BUNKER_BASE_URL + qso.ref;
    $.ajax({
        url: url,
        dataType: 'json',
        async: false,
        timeout: 10000,
        success: async function (result) {
            qso.grid = result.locator;
            qso.qth = result.reference + " " + result.name;
        }
    });
}

// Use a QSO's GMA reference to look up a grid.
function performGMALookup(qso) {
    let url = GMA_REF_BASE_URL + qso.ref;
    $.ajax({
        url: url,
        dataType: 'json',
        async: false,
        timeout: 10000,
        success: async function (result) {
            qso.grid = result.locator;
            qso.qth = result.ref + " " + result.name;
        }
    });
}

// Process an item from the queue. Called regularly, this looks for a queued QSO (i.e. no grid) and tries to use an
// API (POTA, SOTA, WWBOTA or QRZ.com) or our local cache of QRZ.com results to populate the grid fields. If successful,
// the QSO will be inserted into the proper data map. The map objects will then be updated to match.
// We only clear one at a time this way to avoid overloading the remote APIs.
function processQSOFromQueue() {
    if (queue.length > 0) {
        // Pop the next QSO out of the queue
        let qso = queue.pop();
        // We have something in the queue. First see if it has a POTA/SOTA/WWBOTA reference; we can then query the
        // appropriate API for the details.
        if (queryXOTA && qso.program && qso.ref && qso.ref.length > 0) {
            if (qso.program === "POTA") {
                performPOTALookup(qso);
            } else if (qso.program === "SOTA") {
                performSOTALookup(qso);
            } else if (qso.program === "WWBOTA" || qso.program === "UKBOTA") {
                performWWBOTALookup(qso);
            } else if (qso.program === "WWFF" || qso.program === "GMA" || qso.program === "WCA"
                || qso.program === "ARLHS" || qso.program === "MOTA") {
                performGMALookup(qso);
            }
        }

        // Now see if we can query QRZ.com. We still do this even if we had a good POTA/SOTA lookup because this
        // could give us a name for the operator. But we don't override any grid or QTH we find this way, as they
        // would be superceded by the POTA/SOTA ones.
        if (qrzToken) {
            performQRZLookup(qso);
        }

        // If we got a grid from any of the above methods, we can put the QSO into the data map and render it.
        if (qso.grid) {
            putQSOIntoDataMap(qso);
            updateMapObjects();
        } else {
            // We tried and failed to look up this QSO with any available methods.
            failedLookupCount++;
        }
    }
}
