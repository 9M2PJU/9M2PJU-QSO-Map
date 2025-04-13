/////////////////////////////
//     CONTROLS SETUP      //
/////////////////////////////

// Listen for file select
$("#fileSelect").change(function () {
    let file = $(this).prop('files')[0];
    const reader = new FileReader();
    reader.addEventListener(
        "load",
        () => loadAdif(reader.result),
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
    linesEnabled = $("#linesEnabled").is(':checked');
    bandColours = $("#bandColours").is(':checked');
    modeColours = $("#modeColours").is(':checked');
    smallIcons = $("#smallIcons").is(':checked');
    outdoorSymbols = $("#outdoorSymbols").is(':checked');
    callsignLabels = $("#showCallsignLabels").is(':checked');
    updateMapObjects();
}

function updatePosFromGridInput() {
    let grid = $("#qthGrid").val().toUpperCase();
    let pos = null;
    if (/^[A-R]{2}[0-9]{2}([A-X]{2})?$/.test(grid)) {
        pos = latLonForGrid(grid);
    }
    setQTH(pos);
}

// Listen for basemap & opacity changes
$("#basemap").change(function() {
    updateModelFromUI();
});
$("#basemapOpacity").change(function() {
    updateModelFromUI();
});

// Listen for QTH grid input
$("#qthGrid").on("input", function(e) {
    updateModelFromUI();
});

// Listen for lines enabled toggle
$("#linesEnabled").change(function () {
    updateModelFromUI();
});

// Listen for band/mode colours toggles. Only one can be turned on at a time.
$("#bandColours").change(function () {
    if ($("#bandColours").is(':checked')) {
        $("#modeColours").prop('checked', false);
    }
    updateModelFromUI();
});
$("#modeColours").change(function () {
    if ($("#modeColours").is(':checked')) {
        $("#bandColours").prop('checked', false);
    }
    updateModelFromUI();
});

// Listen for small icons toggle
$("#smallIcons").change(function () {
    updateModelFromUI();
});

// Listen for outdoor activity symbols toggle
$("#outdoorSymbols").change(function () {
    updateModelFromUI();
});

// Show Maidenhead grid overlay
$("#showMaidenheadGrid").change(function () {
    updateModelFromUI();
});

// Show callsign labels
$("#showCallsignLabels").change(function () {
    updateModelFromUI();
});

// Open/close controls
function openControls() {
    $("#menuButton").hide();
    $("#controls").show();
}
function closeControls() {
    $("#controls").hide();
    $("#menuButton").show();
}
