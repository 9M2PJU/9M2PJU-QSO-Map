/////////////////////////////
//         STARTUP         //
/////////////////////////////

// Set up map
setUpMap();

// Clear the file selector.
$("#fileSelect").val("");
// Add a short delay before we load the rest of the UI control settings into the model,
// to remove some issues with the ExtraMarkers library having an asynchronous load.
setTimeout(function () {
    loadLocalStorage();
}, 1000);

// Add the timed thread to process the queue. This is done as a setTimeout which is then re-called at the end of
// processQSOFromQueue, because the function is async and we don't know how long it will take.
setTimeout(function () { processQSOFromQueue(); }, 1000);

// Add the timed thread to update the status indicator.
setInterval(function () { updateStatus(); }, 500);
