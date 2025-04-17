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
    let tmpBbasemap = localStorageGetOrDefault('basemap', basemap);
    $("#basemap").val(tmpBbasemap);
    let tmpBasemapOpacity = localStorageGetOrDefault('basemapOpacity', basemapOpacity);
    $("#basemapOpacity").val(tmpBasemapOpacity);
    let tmpQthGrid = localStorageGetOrDefault('qthGrid', '');
    $("#qthGrid").val(tmpQthGrid);
    let tmpShowMaidenheadGrid = localStorageGetOrDefault('showMaidenheadGrid', showMaidenheadGrid);
    $("#showMaidenheadGrid").prop('checked', tmpShowMaidenheadGrid);
    let tmpLinesEnabled = localStorageGetOrDefault('linesEnabled', linesEnabled);
    $("#linesEnabled").prop('checked', tmpLinesEnabled);
    let tmpColourLines = localStorageGetOrDefault('colourLines', colourLines);
    $("#colourLines").prop('checked', tmpColourLines);
    let tmpBandColours = localStorageGetOrDefault('bandColours', bandColours);
    $("#bandColours").prop('checked', tmpBandColours);
    let tmpModeColours = localStorageGetOrDefault('modeColours', modeColours);
    $("#modeColours").prop('checked', tmpModeColours);
    let tmpSmallIcons = localStorageGetOrDefault('smallIcons', smallIcons);
    $("#smallIcons").prop('checked', tmpSmallIcons);
    let tmpOutdoorSymbols = localStorageGetOrDefault('outdoorSymbols', outdoorSymbols);
    $("#outdoorSymbols").prop('checked', tmpOutdoorSymbols);
    let tmpCallsignLabels = localStorageGetOrDefault('callsignLabels', callsignLabels);
    $("#callsignLabels").prop('checked', tmpCallsignLabels);
    let tmpQueryQRZ = localStorageGetOrDefault('queryQRZ', queryQRZ);
    $("#queryQRZ").prop('checked', tmpQueryQRZ);
    let tmpQrzUser = localStorageGetOrDefault('qrzUser', '');
    $("#qrzUser").val(tmpQrzUser);
    let tmpQrzPass = localStorageGetOrDefault('qrzPass', '');
    $("#qrzPass").val(tmpQrzPass);

    updateModelFromUI();
}
