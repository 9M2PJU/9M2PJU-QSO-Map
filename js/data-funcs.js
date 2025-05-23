///////////////////////////////
// DATA MANAGEMENT FUNCTIONS //
///////////////////////////////

// Put a QSO into the main data map. It must have a callsign and grid at this point. This can be called either from
// loadFile() if the QSO is fully populated in the file, or from processQSOFromQueue() if the QSO was in the queue and
// we now have a lookup successfully returning a grid.
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

// Clear the main "data" map, queue, associated counters, and our tracking of what years/bands/modes we have loaded.
// Called from the Clear button or before loading a new data file if we are in Replace rather than Append mode.
function clearData() {
    data = new Map();
    queue = [];
    qsoCount = 0;
    failedLookupCount = 0;
    loadedAtLeastOnce = false;
    years = new Set();
    bands = new Set();
    modes = new Set();
    $("#qsoFiltersTable").hide();
}