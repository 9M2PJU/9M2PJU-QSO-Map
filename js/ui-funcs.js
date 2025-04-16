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
    colourLines = $("#colourLines").is(':checked');
    bandColours = $("#bandColours").is(':checked');
    modeColours = $("#modeColours").is(':checked');
    smallIcons = $("#smallIcons").is(':checked');
    outdoorSymbols = $("#outdoorSymbols").is(':checked');
    callsignLabels = $("#showCallsignLabels").is(':checked');
    queryQRZ = $("#queryQRZ").is(':checked');
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
$("#qthGrid").on("input", function() {
    updateModelFromUI();
});

// Listen for lines enabled toggle
$("#linesEnabled").change(function () {
    updateModelFromUI();
});

// Listen for colour lines toggle
$("#colourLines").change(function () {
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

// Query missing info from QRZ.com
$("#queryQRZ").change(function () {
    updateModelFromUI();
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
