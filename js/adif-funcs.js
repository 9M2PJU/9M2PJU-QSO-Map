/////////////////////////////
//   ADIF LOAD FUNCTIONS   //
/////////////////////////////

// Given the text of an adif file, populate the qsos map.
function loadAdif(text) {
    data = new Map();
    queue = [];
    qsoCount = 0;
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
                    qso.sig = qsoData.get("SIG");
                }

                // If the QSO has a grid, we can put it straight into the data map and it will be displayed immediately
                // once we have finished parsing the ADIF.
                if (qso.grid) {
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

                } else {
                    // The QSO has no grid, so we need to look it up. We place it in a queue, it will be dealt with
                    // later asynchronously.
                    queue.push(qso);
                }

                // Increment counter
                qsoCount++;
            }

            updateMapObjects();
            zoomToFit();
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }, 500);
}

// Update the status indicator. Called regularly, and uses internal software state to choose what to display.
function updateStatus() {
    if (loadedAtLeastOnce) {
        let statusText = "";
        if (loading) {
            statusText = "<i class=\"fa-solid fa-spinner\"></i> Loading...";
        } else {
            if (qsoCount > 0) {
                if (queue.length === 0) {
                    statusText += "<i class=\"fa-solid fa-check\"></i>";
                } else {
                    statusText += "<i class=\"fa-solid fa-triangle-exclamation\"></i>";
                }
                statusText += " Loaded " + qsoCount + " QSOs."
                if (queue.length >= 0) {
                    statusText += " " + (qsoCount - queue.length) + " contained grids.";
                }
            } else {
                statusText += "<i class=\"fa-solid fa-triangle-exclamation\"></i> Failed to parse QSOs in this file";
            }
        }
        $("#loadingStatus").html(statusText);
        $("#loadingStatus").show();
    }
}