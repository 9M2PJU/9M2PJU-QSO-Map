/////////////////////////////
//    LOOKUP FUNCTIONS     //
/////////////////////////////

// Use a QSO's callsign to look up data on QRZ.com and fill in any missing info.
function performQRZLookup(qso) {
    $.ajax({
        url: QRZ_API_BASE_URL,
        data: {s: qrzToken, callsign: encodeURIComponent(qso.call), agent: API_LOOKUP_USER_AGENT_STRING},
        dataType: 'xml',
        async: false,
        timeout: 10000,
        success: async function (result) {
            let grid = $(result).find("grid");
            if (grid && grid.text().length > 0) {
                // We have a good grid, so assign it to the QSO to make it ready to go into the data map. Note that we
                // must only set the grid if it doesn't already exist, to avoid overwriting a grid from e.g. POTA park
                // lookup.
                let gridText = grid.text();
                if (!qso.grid) {
                    qso.grid = gridText;
                }

                // Get some name & QTH information for the QSO if we have it. Note that we must only set the name and
                // QTH if it doesn't already exist, to avoid overwriting a grid from e.g. POTA park lookup.
                let fname = $(result).find("fname");
                let sname = $(result).find("name");
                let nameText = "";
                if (fname && fname.text().length > 0) {
                    nameText += fname.text();
                }
                if (sname && sname.text().length > 0) {
                    nameText += " " + sname.text();
                }
                if (!qso.name) {
                    qso.name = nameText;
                }

                let qth = $(result).find("country");
                let qthText = "";
                if (qth && qth.text().length > 0) {
                    qthText = qth.text();
                    if (!qso.qth) {
                        qso.qth = qthText;
                    }
                }

                // Store the looked up info in case we see this callsign again, then we don't need to query the
                // API unnecessarily.
                lookupData.set(qso.call, {grid: gridText, name: nameText, qth: qthText});
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

// Use a QSO's callsign to look up data on HamQTH and fill in any missing info.
function performHamQTHLookup(qso) {
    $.ajax({
        url: HAMQTH_API_BASE_URL,
        data: {id: hamQTHToken, callsign: encodeURIComponent(qso.call), prg: API_LOOKUP_USER_AGENT_STRING},
        dataType: 'xml',
        async: false,
        timeout: 10000,
        success: async function (result) {
            let grid = $(result).find("grid");
            if (grid && grid.text().length > 0) {
                // We have a good grid, so assign it to the QSO to make it ready to go into the data map. Note that we
                // must only set the grid if it doesn't already exist, to avoid overwriting a grid from e.g. POTA park
                // lookup.
                let gridText = grid.text();
                if (!qso.grid) {
                    qso.grid = gridText;
                }

                // Get some name & QTH information for the QSO if we have it. Note that we must only set the name and
                // QTH if it doesn't already exist, to avoid overwriting a grid from e.g. POTA park lookup.
                let name = $(result).find("nick");
                let nameText = "";
                if (name && name.text().length > 0) {
                    nameText = name.text();
                    if (!qso.name) {
                        qso.name = nameText;
                    }
                }
                let qth = $(result).find("qth");
                let qthText = "";
                if (qth && qth.text().length > 0) {
                    qthText = qth.text();
                    if (!qso.qth) {
                        qso.qth = qthText;
                    }
                }

                // Store the looked up info in case we see this callsign again, then we don't need to query the
                // API unnecessarily.
                lookupData.set(qso.call, {grid: gridText, name: nameText, qth: qthText});
                localStorage.setItem('lookupData', JSON.stringify(Object.fromEntries(lookupData)));

            } else {
                // No grid in response or call is not in the HamQTH database.
                console.log("HamQTH had no grid for " + qso.call);
            }
        },
        error: function () {
            console.log("Error from HamQTH when looking up " + qso.call);
        }
    });
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

        // If we still have some missing data (and we will, because the program lookups above don't give an operator
        // name), we can then move on to querying QRZ.com or HamQTH.
        // But first, check if we have any cached data from previous QRZ.com/HamQTH lookups. This can prevent us from
        // calling the API again for the same data. Name, QTH and grid are updated in the QSO if this data is found and
        // the QSO doesn't already have that data. (Not overwriting is important, because we don't want to risk
        // overwriting a POTA reference grid with the user's home QTH grid from QRZ etc.)
        if (lookupData.has(qso.call)) {
            if (!qso.name) {
                qso.name = lookupData.get(qso.call).name;
            }
            if (!qso.qth) {
                qso.qth = lookupData.get(qso.call).qth;
            }
            if (!qso.grid) {
                qso.grid = lookupData.get(qso.call).grid;
            }
        }

        // Now if we still have missing data, move on to making an actual query to QRZ.com or HamQTH. To do this we need
        // a token for the service.
        if (qrzToken && (!qso.grid || !qso.qth || !qso.name)) {
            performQRZLookup(qso);
        }
        if (hamQTHToken && (!qso.grid || !qso.qth || !qso.name)) {
            performHamQTHLookup(qso);
        }

        // If we got a grid from any of the above methods, we can put the QSO into the data map and render it.
        if (qso.grid) {
            putQSOIntoDataMap(qso);
            redraw(qso.call + "-" + qso.grid);
        } else {
            // We tried and failed to look up this QSO with any available methods.
            failedLookupCount++;
        }
    }
}
