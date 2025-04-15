/////////////////////////////
//         STARTUP         //
/////////////////////////////

// Set up map
setUpMap();

// Restore previous values and clear the ADIF file selector.
$("#fileSelect").val("");
try {
    $('.auto-save').savy('load', function () {
        // Load the basemap immediately to avoid a flash when the rest of the settings are loaded
        setBasemap($("#basemap").val());
        setBasemapOpacity($("#basemapOpacity").val());
        // Add a hort delay before we load the rest of the UI control settings into the model,
        // to remove some issues with the ExtraMarkers library having an asynchronous load.
        setTimeout(function () {
            updateModelFromUI();
        }, 1000);
    });
} catch (e) {
    // Error loading from localstorage, clear it
    localStorage.clear();
}

// Add the timed thread to update the status indicator.
setInterval(function () { updateStatus(); }, 500);