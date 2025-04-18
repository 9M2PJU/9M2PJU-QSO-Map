/////////////////////////////
//   ADIF LOAD FUNCTIONS   //
/////////////////////////////

// Put a QSO into the main data map. It must have a callsign and grid at this point. This can be called either from
// loadAdif() if the QSO is fully populated in ADIF, or from processQSOFromQueue() if the QSO was in the queue and we
// now have a lookup successfully returning a grid.
function putQSOIntoDataMap(qso) {
    // The data map is keyed by "CALL-GRID" so we do not duplicate the combination. If there has not
    // been a QSO with this combination before, we need to create it; we also add the "call", "grid"
    // properties at the top level for easier lookup. But if we have seen the combination before, this
    // is a dupe, and we just add the new qso to the existing qsos list.
    let key = qso.call + "-" + qso.grid;
    if (data.has(key)) {
        data.get(key).qsos.push(qso);
    } else {
        data.set(key, {qsos: [qso], call: qso.call, grid: qso.grid});
    }

    // If we haven't seen a name or a QTH description for this call & grid before, add them at the top
    // level, to avoid display functions having to iterate through qsos to find this.
    if (!data.get(key).name && qso.name) {
        data.get(key).name = qso.name;
    }
    if (!data.get(key).qth && qso.qth) {
        data.get(key).qth = qso.qth;
    }
}

// Given the text of an adif file, populate the qsos map.
function loadAdif(text) {
    data = new Map();
    queue = [];
    qsoCount = 0;
    failedLookupCount = 0;
    loading = true;
    loadedAtLeastOnce = true;
    let cursor = 0;

    setTimeout(function () {
        try {
            // Find the end of the header and the start of actual records
            while (text.substring(cursor, cursor + 5).toUpperCase() !== "<EOH>") {
                cursor += 1;
            }
            cursor += 5;

            // In the content. Parse the QSOs
            let finishedFile = false;
            while (!finishedFile) {
                let qsoData = new Map();
                let finishedRecord = false;
                while (!finishedRecord) {
                    let openBracketPos = text.indexOf('<', cursor);

                    // Figure out if this is the end of the file
                    if (!cursor || openBracketPos === -1 || cursor >= text.length) {
                        finishedRecord = true;
                        finishedFile = true;
                        break;
                    }

                    // Figure out if this is the end of the record
                    if (text.substring(openBracketPos, openBracketPos + 5).toUpperCase() === "<EOR>") {
                        finishedRecord = true;
                        cursor = openBracketPos + 5;
                        break;
                    }

                    // Still got more fields in this record, so continue to parse
                    let colonPos = text.indexOf(':', openBracketPos);
                    let fieldName = text.substring(openBracketPos + 1, colonPos).toUpperCase();
                    let closeBracketPos = text.indexOf('>', colonPos);
                    let fieldLength = parseInt(text.substring(colonPos + 1, closeBracketPos));
                    let fieldValue = text.substring(closeBracketPos + 1, closeBracketPos + 1 + fieldLength).trim();

                    // Populate QSO field
                    qsoData.set(fieldName, fieldValue);

                    // If we have MY_GRIDSQUARE, use it
                    if (fieldName === "MY_GRIDSQUARE") {
                        $("#qthGrid").val(fieldValue.substring(0, 6));
                        updatePosFromGridInput();
                    }

                    // Move the cursor ready for the next one
                    cursor = closeBracketPos + 1 + fieldLength;
                }

                // All the fields have been extracted into qsoData. Now turn them into a QSO object for storage.
                if (qsoData.has("CALL")) {
                    let qso = {call: qsoData.get("CALL")};
                    if (qsoData.has("NAME")) {
                        qso.name = qsoData.get("NAME");
                    }
                    if (qsoData.has("GRIDSQUARE")) {
                        qso.grid = qsoData.get("GRIDSQUARE").toUpperCase();
                    }
                    if (qsoData.has("QTH")) {
                        qso.qth = qsoData.get("QTH");
                    }
                    if (qsoData.has("FREQ")) {
                        qso.freq = parseFloat(qsoData.get("FREQ"));
                    }
                    if (qsoData.has("MODE")) {
                        qso.mode = qsoData.get("MODE");
                    }
                    if (qsoData.has("QSO_DATE") && qsoData.has("TIME_ON")) {
                        qso.time = moment.utc(qsoData.get("QSO_DATE") + qsoData.get("TIME_ON").substring(0, 4), "YYYYMMDDHHmm");
                    }
                    if (qsoData.has("SIG")) {
                        qso.program = qsoData.get("SIG");
                        // If we have no other QTH info recorded for the contact, but we do have SIG_INFO (e.g. POTA ref), use that as QTH
                        if (qsoData.has("SIG_INFO") && !qso.qth) {
                            qso.qth = qsoData.get("SIG") + " " + qsoData.get("SIG_INFO");
                        }
                    }

                    if (qso.grid) {
                        // If the QSO has a grid, we can put it straight into the data map and it will be displayed immediately
                        // once we have finished parsing the ADIF.
                        putQSOIntoDataMap(qso);
                    } else {
                        // The QSO has no grid, so we need to look it up. We place it in a queue, it will be dealt with
                        // later asynchronously.
                        queue.push(qso);
                    }

                    // Increment counter
                    qsoCount++;
                }
            }

            // Update the map
            updateMapObjects();
            // Zoom the map to fit the markers
            zoomToFit();

        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }, 500);
}

// Process an item from the queue. Called regularly, this looks for a queued QSO (i.e. no grid) and tries to use QRZ.com
// or our local cache of QRZ.com results to populate the grid fields. If successful, the QSO will be removed from the
// queue and inserted into the proper data map. The map objects will then be updated to match. We only clear one at a
// time this way to avoid overloading the QRZ.com API.
function processQSOFromQueue() {
    if (queue.length > 0 && qrzToken) {
        // Pop the next QSO out of the queue
        let qso = queue.pop();
        if (qso.call) {
            // See if we already have data about this callsign cached from a previous lookup
            if (lookupData.has(qso.call)) {
                // Already looked up this call, so just use that data and don't re-query
                qso.grid = lookupData.get(qso.call).grid;
                qso.name = lookupData.get(qso.call).name;
                qso.qth = lookupData.get(qso.call).qth;
                putQSOIntoDataMap(qso);
                updateMapObjects();

            } else {
                // Nothing in the cache, so make a lookup request.
                $.ajax({
                    url: QRZ_API_BASE_URL,
                    data: {s: qrzToken, callsign: encodeURI(qso.call), agent: QRZ_AGENT},
                    dataType: 'xml',
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

                            // Update the data map
                            putQSOIntoDataMap(qso);

                            // Update the (geographic) map
                            updateMapObjects();

                            // Store the looked up info in case we see this callsign again, then we don't need to query the
                            // API unnecessarily.
                            lookupData.set(qso.call, {grid: qso.grid, name: qso.name, qth: qso.qth});
                            localStorage.setItem('lookupData', JSON.stringify(Object.fromEntries(lookupData)));

                        } else {
                            // No grid in response or call is not in the QRZ database.
                            failedLookupCount++;
                            console.log("QRZ.com had no grid for " + qso.call);
                        }
                    },
                    error: function () {
                        failedLookupCount++;
                        console.log("Error from QRZ.com when looking up " + qso.call);
                    }
                });
            }
        } else {
            // QSO had no call, nothing to look up!
            failedLookupCount++;
        }
    }
}

// Update the status indicator. Called regularly, and uses internal software state to choose what to display.
function updateStatus() {
    if (loadedAtLeastOnce) {
        let statusText = "";

        // Icon. Spinner if we are doing something, check if all done and every QSO has a grid, exclamation mark if
        // we have qsos without grids.
        if (loading || (queue.length > 0 && qrzToken)) {
            statusText = "<i class=\"fa-solid fa-spinner\"></i> ";
        } else if (queue.length > 0 || failedLookupCount > 0) {
            statusText += "<i class=\"fa-solid fa-triangle-exclamation\"></i> ";
        } else {
            statusText += "<i class=\"fa-solid fa-check\"></i> ";
        }

        // Status text
        if (loading) {
            statusText += "Loading...";
        } else if (qsoCount > 0) {
            if (queue.length === 0 && failedLookupCount === 0) {
                statusText += "Loaded and displayed " + qsoCount + " QSOs.";
            } else if (queue.length === 0) {
                statusText += "Loaded " + qsoCount + " QSOs, failed to find grids for " + failedLookupCount + ".";
            } else if (failedLookupCount === 0) {
                if (qrzToken) {
                    statusText += "Loaded " + qsoCount + " QSOs, " + queue.length + " in lookup queue.";
                } else {
                    statusText += "Loaded " + qsoCount + " QSOs, " + queue.length + " had no grid.";
                }
            } else {
                statusText += "Loaded " + qsoCount + " QSOs, " + queue.length + " in queue, failed to find grids for " + failedLookupCount + ".";
            }
        } else {
            statusText += "<i class=\"fa-solid fa-triangle-exclamation\"></i> Failed to parse QSOs in this file";
        }

        $("#loadingStatus").html(statusText);
        $("#loadingStatus").show();
    }
}
