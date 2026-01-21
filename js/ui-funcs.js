/////////////////////////////
//     CONTROLS SETUP      //
/////////////////////////////

// Listen for file select
$("#fileSelect").change(function () {
    // Get the file and parse it
    let file = $(this).prop('files')[0];
    const reader = new FileReader();
    reader.addEventListener(
        "load",
        () => loadFile(reader.result),
        false,
    );
    if (file) {
        reader.readAsText(file);
    }
});

// General method called on UI change, to update the software's internal model from
// the UI selections.
function updateModelFromUI() {
    setBasemap($("#basemap").val());
    setBasemapOpacity($("#basemapOpacity").val());
    updatePosFromGridInput();
    enableMaidenheadGrid($("#showMaidenheadGrid").is(':checked'));
    enableCQZones($("#showCQZones").is(':checked'));
    enableITUZones($("#showITUZones").is(':checked'));
    enableWABWAIGrid($("#showWABWAIGrid").is(':checked'));
    enableHeatmap($("#heatmapEnabled").is(':checked'));
    enablePerBandHeatmap($("#perBandHeatmapEnabled").is(':checked'));
    setFineZoomControl($("#fineZoomControl").is(':checked'));
    markersEnabled = $("#markersEnabled").is(':checked');
    localStorage.setItem('markersEnabled', markersEnabled);
    userLookupEnabled = $("#userLookupEnabled").is(':checked');
    localStorage.setItem('userLookupEnabled', userLookupEnabled);
    refLookupEnabled = $("#refLookupEnabled").is(':checked');
    localStorage.setItem('refLookupEnabled', refLookupEnabled);
    myCall = $("#myCall").val();
    $("#stats-callsign").text(myCall);
    localStorage.setItem('myCall', JSON.stringify(myCall));
    qthMarker = $("#qthMarker").is(':checked');
    localStorage.setItem('qthMarker', qthMarker);
    linesEnabled = $("#linesEnabled").is(':checked');
    localStorage.setItem('linesEnabled', linesEnabled);
    gridSquaresEnabled = $("#gridSquaresEnabled").is(':checked');
    localStorage.setItem('gridSquaresEnabled', gridSquaresEnabled);
    labelGridSquaresWorked = $("#labelGridSquaresWorked").is(':checked');
    localStorage.setItem('labelGridSquaresWorked', labelGridSquaresWorked);
    colourLines = $("#colourLines").is(':checked');
    localStorage.setItem('colourLines', colourLines);
    thickLines = $("#thickLines").is(':checked');
    localStorage.setItem('thickLines', thickLines);
    bandColours = $("#bandColours").is(':checked');
    localStorage.setItem('bandColours', bandColours);
    modeColours = $("#modeColours").is(':checked');
    localStorage.setItem('modeColours', modeColours);
    fixedMarkerColour = $("#fixedMarkerColour").val();
    localStorage.setItem('fixedMarkerColour', JSON.stringify(fixedMarkerColour));
    markerSize = $("#markerSize").val();
    localStorage.setItem('markerSize', markerSize);
    outlineMarkers = $("#outlineMarkers").is(':checked');
    localStorage.setItem('outlineMarkers', outlineMarkers);
    circleMarkers = $("#circleMarkers").is(':checked');
    localStorage.setItem('circleMarkers', circleMarkers);
    hybridMarkerSize = $("#hybridMarkerSize").is(':checked');
    localStorage.setItem('hybridMarkerSize', hybridMarkerSize);
    showMarkerShadows = $("#showMarkerShadows").is(':checked');
    showMarkerShadows ? $(".leaflet-shadow-pane").show() : $(".leaflet-shadow-pane").hide();
    localStorage.setItem('showMarkerShadows', showMarkerShadows);
    outdoorSymbols = $("#outdoorSymbols").is(':checked');
    localStorage.setItem('outdoorSymbols', outdoorSymbols);
    showCallsignLabels = $("#showCallsignLabels").is(':checked');
    localStorage.setItem('showCallsignLabels', showCallsignLabels);
    showGridSquareLabels = $("#showGridSquareLabels").is(':checked');
    localStorage.setItem('showGridSquareLabels', showGridSquareLabels);
    showDistanceLabels = $("#showDistanceLabels").is(':checked');
    localStorage.setItem('showDistanceLabels', showDistanceLabels);
    distanceUnit = $("#distanceUnit").val();
    localStorage.setItem('distanceUnit', JSON.stringify(distanceUnit));
    showComments = $("#showComments").is(':checked');
    localStorage.setItem('showComments', showComments);
    inferOutdoorActivitiesFromComments = $("#inferOutdoorActivitiesFromComments").is(':checked');
    localStorage.setItem('inferOutdoorActivitiesFromComments', inferOutdoorActivitiesFromComments);
    if ($("#filter-year").val()) {
        filterYear = $("#filter-year").val();
    }
    if ($("#filter-mode").val()) {
        filterMode = $("#filter-mode").val();
    }
    if ($("#filter-band").val()) {
        filterBand = $("#filter-band").val();
    }
    redrawAll();
}

function updatePosFromGridInput() {
    qthGrid = $("#qthGrid").val().toUpperCase();
    $("#stats-qth").text(qthGrid);
    localStorage.setItem('qthGrid', JSON.stringify(qthGrid));

    let pos = latLonForGridCentre(qthGrid);
    if (pos != null) {
        setQTH(pos);
    }
}

// Handle switching between append and replace existing QSOs on load
$(".loadBehaviourControl").change(function () {
    appendOnLoad = $("#appendOnLoad").is(':checked');
    localStorage.setItem('appendOnLoad', appendOnLoad);
});

// Handle clearing existing QSOs
$("#clearQSOs").click(function () {
    clearData();
    redrawAll();
    recalculateStats();
});

// Listen for toggle changes where another should be toggled off when this is toggled on. These are called before the
// generic binding to .control so that their action happens before updateModelFromUI gets called.
$("#bandColours").change(function () {
    if ($("#bandColours").is(':checked')) {
        $("#modeColours").prop('checked', false);
    }
});
$("#modeColours").change(function () {
    if ($("#modeColours").is(':checked')) {
        $("#bandColours").prop('checked', false);
    }
});

// Listen for circle marker type toggle
$("#circleMarkers").change(function () {
    if ($("#circleMarkers").is(':checked')) {
        $("#outdoorSymbols").prop('checked', false);
        $("#hybridMarkerSize").prop('checked', false);
        $("#showMarkerShadows").prop('checked', false);
    }
});

// Listen for control changes. Most controls have this class, and therefore all perform the same updateModelFromUI()
// function when they are changed. WARNING: The order in which jQuery bindings are done is important, some bindings
// deliberately happen before this section, and others after.
$(".control").change(function() {
    updateModelFromUI();
});
$(".textControl").on("input", function() {
    updateModelFromUI();
});

// Open/close panels
function toggleData() {
    hidePanel("displayPanel", "displayMenuButton");
    hidePanel("statsPanel", "statsMenuButton");
    togglePanel("dataPanel", "dataMenuButton");
}
function toggleDisplay() {
    hidePanel("dataPanel", "dataMenuButton");
    hidePanel("statsPanel", "statsMenuButton");
    togglePanel("displayPanel", "displayMenuButton");
}
function toggleStats() {
    hidePanel("displayPanel", "displayMenuButton");
    hidePanel("dataPanel", "dataMenuButton");
    togglePanel("statsPanel", "statsMenuButton");
}
function hidePanel(panelID, buttonID) {
    $("#" + panelID).hide(0);
    $("#" + buttonID).removeClass("menuButtonActive");
}
function togglePanel(panelID, buttonID) {
    if ($("#" + panelID).is(":visible")) {
        $("#" + buttonID).removeClass("menuButtonActive");
    } else {
        $("#" + buttonID).addClass("menuButtonActive");
    }
    $("#" + panelID).toggle(0);
}

// Open/close menu sections
$(".menu-heading").click(function () {
    let contentDiv = $(this).next();
    if (contentDiv.is(":visible")) {
        contentDiv.hide(100);
        $(this).find(".arrow").html("&#9654;");
    } else {
        contentDiv.show(100);
        $(this).find(".arrow").html("&#9660;");
    }
});

// Open dialogs
function openDialog(id) {
    $("#" + id).show();
}
function closeDialog(id) {
    $("#" + id).hide();
}

// Populate the filter controls based on the years, bands and modes in the data we have loaded
function populateFilterControls(years, bands, modes) {
    $("#filter-year").empty();
    $("#filter-year").append($("<option></option>").attr("value", "*").text("All years"));
    // Years are sorted in reverse
    Array.from(years).sort().reverse().forEach(function (y) {
        $("#filter-year").append($("<option></option>").attr("value", y).text(y));
    });

    $("#filter-band").empty();
    $("#filter-band").append($("<option></option>").attr("value", "*").text("All bands"));
    // Bands are sorted according to the order they appear in our BANDS global
    Array.from(bands).filter(b => b != null && b.length > 0)
        .sort((a, b) => BANDS.findIndex((band) => band.name === a) - BANDS.findIndex((band) => band.name === b)).forEach(function (b) {
        $("#filter-band").append($("<option></option>").attr("value", b).text(b));
    });

    $("#filter-mode").empty();
    $("#filter-mode").append($("<option></option>").attr("value", "*").text("All modes"));
    // Modes are sorted alphabetically
    Array.from(modes).filter(m => m.length > 0).sort().forEach(function (m) {
        $("#filter-mode").append($("<option></option>").attr("value", m).text(m));
    });
}

// Set my callsign and save to local storage.
function setMyCall(call) {
    myCall = call;
    $("#myCall").val(myCall);
    $("#stats-callsign").text(myCall);
    localStorage.setItem('myCall', JSON.stringify(myCall));
}
