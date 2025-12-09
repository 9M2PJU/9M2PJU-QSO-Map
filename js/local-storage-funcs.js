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
    let tmpBasemap = localStorageGetOrDefault('basemap', basemap);
    let tmpUserLookupEnabled = localStorageGetOrDefault('userLookupEnabled', userLookupEnabled);
    $("#userLookupEnabled").prop('checked', tmpUserLookupEnabled);
    let tmpRefLookupEnabled = localStorageGetOrDefault('refLookupEnabled', refLookupEnabled);
    $("#refLookupEnabled").prop('checked', tmpRefLookupEnabled);
    $("#basemap").val(tmpBasemap);
    let tmpBasemapOpacity = localStorageGetOrDefault('basemapOpacity', basemapOpacity);
    $("#basemapOpacity").val(tmpBasemapOpacity);
    let tmpMyCall = localStorageGetOrDefault('myCall', '');
    $("#myCall").val(tmpMyCall);
    let tmpQthGrid = localStorageGetOrDefault('qthGrid', '');
    $("#qthGrid").val(tmpQthGrid);
    let tmpShowMaidenheadGrid = localStorageGetOrDefault('showMaidenheadGrid', showMaidenheadGrid);
    $("#showMaidenheadGrid").prop('checked', tmpShowMaidenheadGrid);
    let tmpShowCQZones = localStorageGetOrDefault('showCQZones', showCQZones);
    $("#showCQZones").prop('checked', tmpShowCQZones);
    let tmpShowITUZones = localStorageGetOrDefault('showITUZones', showITUZones);
    $("#showITUZones").prop('checked', tmpShowITUZones);
    let tmpShowWABWAIGrid = localStorageGetOrDefault('showWABWAIGrid', showWABWAIGrid);
    $("#showWABWAIGrid").prop('checked', tmpShowWABWAIGrid);
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
    let tmpHeatmapEnabled = localStorageGetOrDefault('heatmapEnabled', heatmapEnabled);
    $("#heatmapEnabled").prop('checked', tmpHeatmapEnabled);
    let tmpPerBandHeatmapEnabled = localStorageGetOrDefault('perBandHeatmapEnabled', perBandHeatmapEnabled);
    $("#perBandHeatmapEnabled").prop('checked', tmpPerBandHeatmapEnabled);
    let tmpBandColours = localStorageGetOrDefault('bandColours', bandColours);
    $("#bandColours").prop('checked', tmpBandColours);
    let tmpModeColours = localStorageGetOrDefault('modeColours', modeColours);
    $("#modeColours").prop('checked', tmpModeColours);
    $("#fixedColour").prop('checked', !tmpBandColours && !tmpModeColours);
    let tmpFixedMarkerColour = localStorageGetOrDefault('fixedMarkerColour', fixedMarkerColour);
    $("#fixedMarkerColour").val(tmpFixedMarkerColour);
    let tmpMarkerSize = localStorageGetOrDefault('markerSize', markerSize);
    $("#markerSize").val(tmpMarkerSize);
    let tmpCircleMarkers = localStorageGetOrDefault('circleMarkers', circleMarkers);
    $("#circleMarkers").prop('checked', tmpCircleMarkers);
    let tmpOutlineMarkers = localStorageGetOrDefault('outlineMarkers', outlineMarkers);
    $("#outlineMarkers").prop('checked', tmpOutlineMarkers);
    let tmpOutdoorSymbols = localStorageGetOrDefault('outdoorSymbols', outdoorSymbols);
    $("#outdoorSymbols").prop('checked', tmpOutdoorSymbols);
    let tmpHybridMarkerSize = localStorageGetOrDefault('hybridMarkerSize', hybridMarkerSize);
    $("#hybridMarkerSize").prop('checked', tmpHybridMarkerSize);
    let tmpShowMarkerShadows = localStorageGetOrDefault('showMarkerShadows', showMarkerShadows);
    $("#showMarkerShadows").prop('checked', tmpShowMarkerShadows);
    let tmpShowCallsignLabels = localStorageGetOrDefault('showCallsignLabels', showCallsignLabels);
    $("#showCallsignLabels").prop('checked', tmpShowCallsignLabels);
    let tmpShowGridSquareLabels = localStorageGetOrDefault('showGridSquareLabels', showGridSquareLabels);
    $("#showGridSquareLabels").prop('checked', tmpShowGridSquareLabels);
    let tmpShowDistanceLabels = localStorageGetOrDefault('showDistanceLabels', showDistanceLabels);
    $("#showDistanceLabels").prop('checked', tmpShowDistanceLabels);
    let tmpDistanceUnit = localStorageGetOrDefault('distanceUnit', distanceUnit);
    $("#distanceUnit").val(tmpDistanceUnit);
    let tmpShowComments = localStorageGetOrDefault('showComments', showComments);
    $("#showComments").prop('checked', tmpShowComments);
    let tmpInferOutdoorActivitiesFromComments = localStorageGetOrDefault('inferOutdoorActivitiesFromComments', inferOutdoorActivitiesFromComments);
    $("#inferOutdoorActivitiesFromComments").prop('checked', tmpInferOutdoorActivitiesFromComments);
    let tmpFineZoomControl = localStorageGetOrDefault('fineZoomControl', fineZoomControl);
    $("#fineZoomControl").prop('checked', tmpFineZoomControl);

    // Load lookup data. This had to be converted to an object for storage, now we need it back as a map.
    const lookupDataStr = localStorage.getItem('lookupData');
    if (lookupDataStr !== null) {
        lookupData = new Map(Object.entries(JSON.parse(lookupDataStr)));
    }

    updateModelFromUI();
}
