/////////////////////////////
// LOCAL STORAGE FUNCTIONS //
/////////////////////////////
// noinspection JSJQueryEfficiency

// Load from local storage or use default
function localStorageGetOrDefault(key, defaultVal) {
    const valStr = localStorage.getItem(key);
    if (null === valStr) {
        return defaultVal;
    } else {
        return JSON.parse(valStr);
    }
}

// Load from local storage and set GUI up appropriately
function loadLocalStorage() {
    let tmpAppendOnLoad = localStorageGetOrDefault('appendOnLoad', appendOnLoad);
    appendOnLoad = tmpAppendOnLoad;
    $("#appendOnLoad").prop('checked', tmpAppendOnLoad);
    let tmpBbasemap = localStorageGetOrDefault('basemap', basemap);
    $("#basemap").val(tmpBbasemap);
    let tmpBasemapOpacity = localStorageGetOrDefault('basemapOpacity', basemapOpacity);
    $("#basemapOpacity").val(tmpBasemapOpacity);
    let tmpMyCall = localStorageGetOrDefault('myCall', '');
    $("#myCall").val(tmpMyCall);
    let tmpQthGrid = localStorageGetOrDefault('qthGrid', '');
    $("#qthGrid").val(tmpQthGrid);
    let tmpShowMaidenheadGrid = localStorageGetOrDefault('showMaidenheadGrid', showMaidenheadGrid);
    $("#showMaidenheadGrid").prop('checked', tmpShowMaidenheadGrid);
    let tmpMarkersEnabled = localStorageGetOrDefault('markersEnabled', markersEnabled);
    $("#markersEnabled").prop('checked', tmpMarkersEnabled);
    let tmpQTHMarker = localStorageGetOrDefault('qthMarker', qthMarker);
    $("#qthMarker").prop('checked', tmpQTHMarker);
    let tmpLinesEnabled = localStorageGetOrDefault('linesEnabled', linesEnabled);
    $("#linesEnabled").prop('checked', tmpLinesEnabled);
    let tmpGridSquaresEnabled = localStorageGetOrDefault('gridSquaresEnabled', gridSquaresEnabled);
    $("#gridSquaresEnabled").prop('checked', tmpGridSquaresEnabled);
    let tmpLabelGridSquaresWorked = localStorageGetOrDefault('labelGridSquaresWorked', labelGridSquaresWorked);
    $("#labelGridSquaresWorked").prop('checked', tmpLabelGridSquaresWorked);
    let tmpColourLines = localStorageGetOrDefault('colourLines', colourLines);
    $("#colourLines").prop('checked', tmpColourLines);
    let tmpThickLines = localStorageGetOrDefault('thickLines', thickLines);
    $("#thickLines").prop('checked', tmpThickLines);
    let tmpBandColours = localStorageGetOrDefault('bandColours', bandColours);
    $("#bandColours").prop('checked', tmpBandColours);
    let tmpModeColours = localStorageGetOrDefault('modeColours', modeColours);
    $("#modeColours").prop('checked', tmpModeColours);
    let tmpSmallMarkers = localStorageGetOrDefault('smallMarkers', smallMarkers);
    $("#smallMarkers").prop('checked', tmpSmallMarkers);
    let tmpOutdoorSymbols = localStorageGetOrDefault('outdoorSymbols', outdoorSymbols);
    $("#outdoorSymbols").prop('checked', tmpOutdoorSymbols);
    let tmpHybridMarkerSize = localStorageGetOrDefault('hybridMarkerSize', hybridMarkerSize);
    $("#hybridMarkerSize").prop('checked', tmpHybridMarkerSize);
    let tmpShowCallsignLabels = localStorageGetOrDefault('showCallsignLabels', showCallsignLabels);
    $("#showCallsignLabels").prop('checked', tmpShowCallsignLabels);
    let tmpShowGridSquareLabels = localStorageGetOrDefault('showGridSquareLabels', showGridSquareLabels);
    $("#showGridSquareLabels").prop('checked', tmpShowGridSquareLabels);
    let tmpShowDistanceLabels = localStorageGetOrDefault('showDistanceLabels', showDistanceLabels);
    $("#showDistanceLabels").prop('checked', tmpShowDistanceLabels);
    let tmpDistancesInMiles = localStorageGetOrDefault('distancesInMiles', distancesInMiles);
    $("#distancesInMiles").prop('checked', tmpDistancesInMiles);
    let tmpShowComments = localStorageGetOrDefault('showComments', showComments);
    $("#showComments").prop('checked', tmpShowComments);
    let tmpInferOutdoorActivitiesFromComments = localStorageGetOrDefault('inferOutdoorActivitiesFromComments', inferOutdoorActivitiesFromComments);
    $("#inferOutdoorActivitiesFromComments").prop('checked', tmpInferOutdoorActivitiesFromComments);
    let tmpQueryXOTA = localStorageGetOrDefault('queryXOTA', queryXOTA);
    $("#queryXOTA").prop('checked', tmpQueryXOTA);
    let tmpQueryQRZ = localStorageGetOrDefault('queryQRZ', queryQRZ);
    $("#queryQRZ").prop('checked', tmpQueryQRZ);
    let tmpQrzUser = localStorageGetOrDefault('qrzUser', '');
    $("#qrzUser").val(tmpQrzUser);
    let tmpQrzPass = localStorageGetOrDefault('qrzPass', '');
    $("#qrzPass").val(tmpQrzPass);
    let tmpQueryHamQTH = localStorageGetOrDefault('queryHamQTH', queryHamQTH);
    $("#queryHamQTH").prop('checked', tmpQueryHamQTH);
    let tmpHamQTHUser = localStorageGetOrDefault('hamQTHUser', '');
    $("#hamqthUser").val(tmpHamQTHUser);
    let tmpHamQTHPass = localStorageGetOrDefault('hamQTHPass', '');
    $("#hamqthPass").val(tmpHamQTHPass);
    let tmpRememberPasswords = localStorageGetOrDefault('rememberPasswords', rememberPasswords);
    $("#rememberPasswords").val(tmpRememberPasswords);

    // Load lookup data. This had to be converted to an object for storage, now we need it back as a map.
    const lookupDataStr = localStorage.getItem('lookupData');
    if (lookupDataStr !== null) {
        lookupData = new Map(Object.entries(JSON.parse(lookupDataStr)));
    }

    updateModelFromUI();
}
