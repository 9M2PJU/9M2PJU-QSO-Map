/////////////////////////////
//     CONTROLS SETUP      //
/////////////////////////////

// Listen for file select
$("#fileSelect").change(function () {
    // If QRZ username and password were filled in, but the user hasn't clicked Login yet, but they have QRZ lookup
    // enabled, simulate a login click.
    if (queryQRZ && !qrzToken && $("#qrzUser").val().length > 0 && $("#qrzPass").val().length > 0) {
        $("#qrzLogin").click();
    }

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
    markersEnabled = $("#markersEnabled").is(':checked');
    localStorage.setItem('markersEnabled', markersEnabled);
    myCall = $("#myCall").val();
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
    smallMarkers = $("#smallMarkers").is(':checked');
    localStorage.setItem('smallMarkers', smallMarkers);
    hybridMarkerSize = $("#hybridMarkerSize").is(':checked');
    localStorage.setItem('hybridMarkerSize', hybridMarkerSize);
    outdoorSymbols = $("#outdoorSymbols").is(':checked');
    localStorage.setItem('outdoorSymbols', outdoorSymbols);
    showCallsignLabels = $("#showCallsignLabels").is(':checked');
    localStorage.setItem('showCallsignLabels', showCallsignLabels);
    showGridSquareLabels = $("#showGridSquareLabels").is(':checked');
    localStorage.setItem('showGridSquareLabels', showGridSquareLabels);
    showDistanceLabels = $("#showDistanceLabels").is(':checked');
    localStorage.setItem('showDistanceLabels', showDistanceLabels);
    distancesInMiles = $("#distancesInMiles").is(':checked');
    localStorage.setItem('distancesInMiles', distancesInMiles);
    if ($("#filter-year").val()) {
        filterYear = $("#filter-year").val();
    }
    if ($("#filter-mode").val()) {
        filterMode = $("#filter-mode").val();
    }
    if ($("#filter-band").val()) {
        filterBand = $("#filter-band").val();
    }
    queryXOTA = $("#queryXOTA").is(':checked');
    localStorage.setItem('queryXOTA', queryXOTA);
    queryQRZ = $("#queryQRZ").is(':checked');
    localStorage.setItem('queryQRZ', queryQRZ);
    redrawAll();
}

function updatePosFromGridInput() {
    qthGrid = $("#qthGrid").val().toUpperCase();
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

// Listen for small icons toggle
$("#smallMarkers").change(function () {
    if ($("#smallMarkers").is(':checked')) {
        $("#hybridMarkerSize").prop('checked', false);
    }
});

// Listen for outdoor activity symbols toggle
$("#outdoorSymbols").change(function () {
    if (!$("#outdoorSymbols").is(':checked')) {
        $("#hybridMarkerSize").prop('checked', false);
    }
});

// Listen for hybrid marker size toggle
$("#hybridMarkerSize").change(function () {
    if ($("#hybridMarkerSize").is(':checked')) {
        $("#smallMarkers").prop('checked', false);
    }
    if ($("#hybridMarkerSize").is(':checked')) {
        $("#outdoorSymbols").prop('checked', true);
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

// Query missing info from QRZ.com. Should be done after the updateModelFromUI call so we bind this afterwards.
$("#queryQRZ").change(function () {
    // If QRZ username and password were filled in, but the user hasn't clicked Login yet, but they just turned on this
    // option, simulate a login click.
    if (queryQRZ && !qrzToken && $("#qrzUser").val().length > 0 && $("#qrzPass").val().length > 0) {
        $("#qrzLogin").click();
    }
});

// Log into QRZ.com, get a session token if the login was correct. Show a status indicator next to the login button.
$("#qrzLogin").click(function() {
    $("#qrzApiStatus").show();
    $("#qrzApiStatus").html("<i class=\"fa-solid fa-spinner\"></i> Logging into QRZ.com...");

    let username = $("#qrzUser").val();
    let password = $("#qrzPass").val();
    $.ajax({
        url: QRZ_API_BASE_URL,
        data: { username: encodeURI(username), password: encodeURI(password), agent: QRZ_AGENT },
        dataType: 'xml',
        timeout: 10000,
        success: async function (result) {
            let key = $(result).find("Key");
            if (key && key.text().length > 0) {
                if ($(result).find("SubExp") === "non-subscriber") {
                    // Non-subscriber, warn the user
                    $("#qrzApiStatus").html("<i class='fa-solid fa-triangle-exclamation'></i> User has no QRZ.com XML API subscription");
                } else {
                    // Got a token and a proper "subscription expiry" string so we are good to go.
                    qrzToken = key.text();
                    $("#qrzApiStatus").html("<i class='fa-solid fa-check'></i> QRZ.com authentication successful");
                    // If the user hasn't turned on QRZ querying yet, they probably want it on so do that for them.
                    $("#queryQRZ").prop('checked', true);
                }

            } else {
                // No key, so login failed
                $("#qrzApiStatus").html("<i class='fa-solid fa-xmark'></i> Incorrect username or password");
            }
        },
        error: function () {
            $("#qrzApiStatus").html("<i class='fa-solid fa-triangle-exclamation'></i> QRZ.com API error, please try again later");
        }
    });
    localStorage.setItem('qrzUser', JSON.stringify(username));
    localStorage.setItem('qrzPass', JSON.stringify(password));
});

// Open/close controls
function openControls() {
    $("#menuButton").hide();
    $("#controls").show(100);
}
function closeControls() {
    $("#controls").hide(100);
    $("#menuButton").show();
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

// Clear the lookup queue, cancelling any pending requests.
function clearQueue() {
    failedLookupCount += queue.length;
    queue = [];
}

// Set my callsign and save to local storage.
function setMyCall(call) {
    myCall = call;
    $("#myCall").val(myCall);
    localStorage.setItem('myCall', JSON.stringify(myCall));
}
