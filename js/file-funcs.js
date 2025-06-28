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
            let qso = {call: qsoData.get("CALL"), sigRefs: []};
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

            // Find "special interest group" info e.g. POTA, SOTA
            if (qsoData.has("SIG") && qsoData.has("SIG_INFO")) {
                qso.sigRefs.push({program: qsoData.get("SIG"), ref: qsoData.get("SIG_INFO")});
            }

            // Some ADIFs feature POTA_REF, SOTA_REF and WWFF_REF separately to SIG/SIG_INFO. But don't duplicate these
            // if they would be duplicates of what we already got from SIG/SIG_INFO.
            if (qsoData.has("POTA_REF")) {
                // POTA allows more than one reference at a time
                let potaRefs = qsoData.get("POTA_REF").split(",");
                potaRefs.forEach(ref => {
                    if (!qso.sigRefs.some(p => p.program === "POTA" && p.ref === ref)) {
                        qso.sigRefs.push({program: "POTA", ref: ref});
                    }
                });
            }
            if (qsoData.has("SOTA_REF")) {
                if (!qso.sigRefs.some(p => p.program === "SOTA" && p.ref === qsoData.get("SOTA_REF"))) {
                    qso.sigRefs.push({program: "SOTA", ref: qsoData.get("SOTA_REF")});
                }
            }
            if (qsoData.has("WWFF_REF")) {
                if (!qso.sigRefs.some(p => p.program === "WWFF" && p.ref === qsoData.get("WWFF_REF"))) {
                    qso.sigRefs.push({program: "WWFF", ref: qsoData.get("WWFF_REF")});
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
                setMyCall(qsoData.get("STATION_CALLSIGN"));
                setStationCallsign = true;
            } else if (qsoData.has("OPERATOR")) {
                setMyCall(qsoData.get("OPERATOR"));
                setStationCallsign = true;
            }
        }
    }
}

// Loads Cabrillo content
function loadCabrillo(text) {
    var lines = text.split(/\r?\n|\r|\n/g);
    lines.forEach(line => {
        if (line.startsWith("CALLSIGN:")) {
            setMyCall(line.substring(10));
        }

        if (line.startsWith("QSO:")) {
            let parts = line.split(/\s+/);
            let qso = {
                call: parts[8],
                freq: parseFloat(parts[1]) / 1000.0,
                mode: parts[2],
                time: moment.utc(parts[3] + " " + parts[4], "YYYY-MM-DD HHmm"),
                year: parseInt(parts[3].substring(0, 4))
            };

            qso.band = freqToBandName(qso.freq);
            bands.add(qso.band);
            modes.add(qso.mode);
            years.add(qso.year);

            // There are no grids in Cabrillo data, so we will have to add the QSO to the lookup queue.
            queue.push(qso);
            qsoCount++;
        }
    });
}

// Loads SOTA CSV content
function loadSOTACSV(text) {
    let setStationCallsign = false;

    // Parse CSV
    csvData = $.csv.toArrays(text);
    csvData.forEach(row => {
        if (!setStationCallsign) {
            setMyCall(row[1]);
            setStationCallsign = true;
        }

        let qso = {call: row[7], sigRefs: []};

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
            if (!qso.sigRefs.some(p => p.program === "SOTA" && p.ref === row[8])) {
                qso.sigRefs.push({program: "SOTA", ref: row[8]});
            }
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

        // There are no grids in SOTA data, so we will have to add the QSO to the lookup queue.
        queue.push(qso);
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
            if (text.substring(0, 4) === "ADIF" || text.includes("<EOH>")) {
                loadADIF(text);
                lastLoadTypeRecognised = true;
            } else if (text.substring(0, 13) === "START-OF-LOG:") {
                loadCabrillo(text);
                lastLoadTypeRecognised = true;
            } else if (text.substring(0, 3) === "V2,") {
                loadSOTACSV(text);
                lastLoadTypeRecognised = true;
            } else {
                lastLoadTypeRecognised = false;
            }

            if (lastLoadTypeRecognised) {
                // Update the map
                redrawAll();
                // Zoom the map to fit the markers
                zoomToFit();

                // Populate the filter controls
                populateFilterControls(years, bands, modes);
                // Remove the warning about loading a file before applying filters
                $("#qsoFilterMessage").text("The list of available filters is based on the contents of your log.");
                $("#qsoFiltersTable").show();
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }, 500);
}
