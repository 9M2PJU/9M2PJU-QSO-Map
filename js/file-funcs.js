/////////////////////////////
//   FILE LOAD FUNCTIONS   //
/////////////////////////////

// Loads ADIF content
function loadADIF(text) {
    // Reset the cursor to the start of the file
    let cursor = 0;
    // Temporary values to help us track progress
    let finishedFile = false;
    let setStationCallsign = false;
    let setStationGrid = false;

    // Find the end of the header and the start of actual records
    while (text.substring(cursor, cursor + 5).toUpperCase() !== "<EOH>") {
        cursor += 1;
    }
    cursor += 5;

    // In the content. Parse the QSOs
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
                qso.band = freqToBandName(qso.freq);
                bands.add(qso.band);
            }
            if (qsoData.has("MODE")) {
                qso.mode = qsoData.get("MODE");
                modes.add(qso.mode);
            }
            if (qsoData.has("QSO_DATE") && qsoData.has("TIME_ON")) {
                qso.time = moment.utc(qsoData.get("QSO_DATE") + qsoData.get("TIME_ON").substring(0, 4), "YYYYMMDDHHmm");
            }
            if (qsoData.has("QSO_DATE")) {
                qso.year = parseInt(qsoData.get("QSO_DATE").substring(0, 4));
                years.add(qso.year);
            }
            if (qsoData.has("SIG")) {
                qso.program = qsoData.get("SIG");
                // If we have no other QTH info recorded for the contact, but we do have SIG_INFO (e.g. POTA ref), use that as QTH
                if (qsoData.has("SIG_INFO")) {
                    qso.ref = qsoData.get("SIG_INFO");
                    if (!qso.qth) {
                        qso.qth = qsoData.get("SIG") + " " + qsoData.get("SIG_INFO");
                    }
                }
            }
            if (qsoData.has("COMMENT")) {
                qso.comment = qsoData.get("COMMENT");
            }

            if (qso.grid) {
                // If the QSO has a grid, we can put it straight into the data map and it will be displayed immediately
                // once we have finished parsing the file.
                putQSOIntoDataMap(qso);
            } else {
                // The QSO has no grid, so we need to look it up. We place it in a queue, it will be dealt with
                // later asynchronously.
                queue.push(qso);
            }

            // Increment counter
            qsoCount++;
        }

        // Go through the data and apply the station's callsign and gridsquare if we have the data.
        if (!setStationGrid && qsoData.has("MY_GRIDSQUARE")) {
            $("#qthGrid").val(formatGrid(qsoData.get("MY_GRIDSQUARE").substring(0, 6)));
            updatePosFromGridInput();
            setStationGrid = true;
        }
        // If we have STATION_CALLSIGN or OPERATOR, use it. Only use OPERATOR if we haven't already set
        // something from STATION_CALLSIGN, as that takes precedence.
        if (!setStationCallsign) {
            if (qsoData.has("STATION_CALLSIGN")) {
                myCall = qsoData.get("STATION_CALLSIGN");
                $("#myCall").val(myCall);
                localStorage.setItem('myCall', JSON.stringify(myCall));
                setStationCallsign = true;
            } else if (qsoData.has("OPERATOR")) {
                myCall = qsoData.get("OPERATOR");
                $("#myCall").val(myCall);
                localStorage.setItem('myCall', JSON.stringify(myCall));
                setStationCallsign = true;
            }
        }
    }
}

// Loads SOTA CSV content
function loadSOTACSV(text) {
    let setStationCallsign = false;

    // Parse CSV
    csvData = $.csv.toArrays(text);
    csvData.forEach(row => {
        if (!setStationCallsign) {
            myCall = row[1];
            $("#myCall").val(myCall);
            localStorage.setItem('myCall', JSON.stringify(myCall));
            setStationCallsign = true;
        }

        let qso = {call: row[7]};

        if (row[5].length > 3) {
            qso.freq = parseFloat(row[5].substring(-3));
            qso.band = freqToBandName(qso.freq);
            bands.add(qso.band);
        }

        if (row[6].length > 0) {
            qso.mode = row[6];
            modes.add(qso.mode);
        }

        if (row.length > 8 && row[8].length > 0) {
            qso.program = "SOTA";
            qso.ref = row[8];
            qso.qth = row[8];
        }

        if (row.length > 9 && row[9].length > 0) {
            qso.comment = row[9];
        }

        if (row[3].length > 0 && row[4].length > 0) {
            qso.time = moment.utc(row[3] + " " + row[4], "DD/MM/YY HH:mm");
        }
        if (row[3].length > 0) {
            qso.year = 2000 + parseInt(row[3].substring(-2));
            years.add(qso.year);
        }

        // There are no grids in SOTA data, so we will have to add the QSO to the lookup queue. Currently this will fetch
        // the operator's home QTH or whatever they have set in QRZ - see #27 for SOTA (and other) program lookups.
        queue.push(qso);

        // Increment counter
        qsoCount++;
    });
}

// Given the text of a supported log file, load the data and populate the map.
function loadFile(text) {
    // Figure out if we are appending to any previously loaded data, or replacing it, in which case call clearData().
    if (!appendOnLoad) {
        clearData();
    }
    // Set variables to tell the UI that we are loading
    loading = true;
    loadedAtLeastOnce = true;

    // Run the file loading task in a new thread.
    setTimeout(function () {
        try {
            // Load the content, delegating to a function based on file type.
            if (text.substring(0, 4) === "ADIF") {
                loadADIF(text);
                lastLoadTypeRecognised = true;
            } else if (text.substring(0, 3) === "V2,") {
                loadSOTACSV(text);
                lastLoadTypeRecognised = true;
            } else {
                lastLoadTypeRecognised = false;
            }

            if (lastLoadTypeRecognised) {
                // Update the map
                updateMapObjects();
                // Zoom the map to fit the markers
                zoomToFit();

                // Populate the filter controls
                populateFilterControls(years, bands, modes);
                // Remove the warning about loading a file before applying filters
                $("#qsoFilterWaitingForLoad").hide();
                $("#qsoFiltersTable").show();
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }, 500);
}