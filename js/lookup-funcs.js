/////////////////////////////
//    LOOKUP FUNCTIONS     //
/////////////////////////////

// Use a QSO's callsign to look up data through the Spothole API and fill in any missing info.
function performCallsignLookup(qso) {
    $.ajax({
        url: SPOTHOLE_BASE_URL + "/lookup/call",
        data: {call: qso.call},
        dataType: 'json',
        async: false,
        timeout: 10000,
        success: async function (result) {
            if (result.grid && result.grid.length > 0 && !qso.grid && result.grid !== "" && result.grid.toUpperCase() !== "AA00" && result.grid.toUpperCase() !== "AA00AA" && result.grid.toUpperCase() !== "AA00AA00") {
                qso.grid = result.grid;
            }

            if (result.dxcc_id && !qso.dxcc) {
                qso.dxcc = result.dxcc_id;
            }

            if (result.cq_zone && !qso.cqz) {
                qso.cqz = result.cq_zone;
            }

            if (result.itu_zone && !qso.ituz) {
                qso.ituz = result.itu_zone;
            }

            if (result.name && result.name.length > 0 && !qso.name) {
                qso.name = result.name;
            }

            let bestQTH = (result.qth && result.qth.length > 0) ? result.qth : result.country;
            if (bestQTH != null && bestQTH.length > 0 && !qso.qth) {
                qso.qth = bestQTH;
            }

            // Store the looked up info in case we see this callsign again, then we don't need to query the
            // API unnecessarily.
            lookupData.set(qso.call, {grid: qso.grid, name: qso.name, qth: qso.qth, dxcc: qso.dxcc, cqz: qso.cqz, ituz: qso.ituz});
            localStorage.setItem('lookupData', JSON.stringify(Object.fromEntries(lookupData)));
        },
        error: function () {
            console.log("Error from Spothole when looking up " + qso.call);
        }
    });
}

// Use a QSO's SIG reference to look up a grid via the Spothole API.
function performSIGRefLookup(qso) {
    $.ajax({
        url: SPOTHOLE_BASE_URL + "/lookup/sigref",
        data: {sig: qso.sigRefs[0].program, id: qso.sigRefs[0].ref},
        dataType: 'json',
        async: false,
        timeout: 10000,
        success: async function (result) {
            if (result.grid != null) {
                qso.grid = result.grid;
            }
            qso.qth = result.ref
            if (result.name != null) {
                qso.qth = result.ref + " " + result.name;
            }
        }
    });
}

// Process an item from the queue. This looks for queued QSOs (i.e. missing some data) and tries to use the Spothole API
// or our local cache of results to populate the grid fields. If successful, the QSO will be inserted into the proper
// data map. The map objects will then be updated to match.
async function processQSOFromQueue() {
    while (queue.length > 0) {
        // Pop the next QSO out of the queue
        let qso = queue.pop();
        // We have something in the queue. First see if it has a POTA/SOTA/WWBOTA reference; we can then query the
        // API for the reference's location.
        if (refLookupEnabled && qso.sigRefs != null && qso.sigRefs.length > 0) {
            performSIGRefLookup(qso);
            // Just done a lookup, so add an artificial pause to slow the process down and avoid hammering the server
            await new Promise(r => setTimeout(r, 100));
        }

        // If we still have some missing data (and we will, because the SIG ref lookup above don't give an operator
        // name), we can then move on to querying the callsign data.
        // But first, check if we have any cached data from previous lookups. This can prevent us from
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
            if (!qso.dxcc) {
                qso.dxcc = lookupData.get(qso.call).dxcc;
            }
            if (!qso.cqz) {
                qso.cqz = lookupData.get(qso.call).cqz;
            }
            if (!qso.ituz) {
                qso.ituz = lookupData.get(qso.call).ituz;
            }
        }

        // Now if we still have missing data, move on to making an actual query of the callsign
        if (userLookupEnabled && (!qso.grid || !qso.dxcc || !qso.cqz || !qso.ituz || !qso.qth || !qso.name)) {
            performCallsignLookup(qso);
            // Just done a lookup, so add an artificial pause to slow the process down and avoid hammering the server
            await new Promise(r => setTimeout(r, 100));
        }

        putQSOIntoDataMap(qso);
        if (qso.grid) {
            // If the QSO has grid info, render it. This is a bit wasteful in terms of CPU given we're going to
            // re-render once the queue is empty anyway, but it helps keep the user interested during long loads.
            redraw(qso.call + "-" + qso.grid);
        }

        // If we have now completed the queue, update stats and redraw everything.
        if (queue.length === 0) {
            redrawAll();
            recalculateStats();
        }
    }

    // Re-set a timeout for the next execution. This is done as a setTimeout rather than setInterval, because the
    // function is async and we don't know how long it will take.
    setTimeout(function () { processQSOFromQueue(); }, 1000);
}
