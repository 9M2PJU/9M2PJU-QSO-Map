/////////////////////////////
//        CONSTANTS        //
/////////////////////////////

const BANDS = [
    {name: "160m", startFreq: 1.8, stopFreq: 2.0, color: "#7cfc00", contrastColor: "black"},
    {name: "80m", startFreq: 3.5, stopFreq: 4.0, color: "#e550e5", contrastColor: "black"},
    {name: "60m", startFreq: 5.25, stopFreq: 5.41, color: "#00008b", contrastColor: "white"},
    {name: "40m", startFreq: 7.0, stopFreq: 7.3, color: "#5959ff", contrastColor: "white"},
    {name: "30m", startFreq: 10.1, stopFreq: 10.15, color: "#62d962", contrastColor: "black"},
    {name: "20m", startFreq: 14.0, stopFreq: 14.35, color: "#f2c40c", contrastColor: "black"},
    {name: "17m", startFreq: 18.068, stopFreq: 18.168, color: "#f2f261", contrastColor: "black"},
    {name: "15m", startFreq: 21.0, stopFreq: 21.45, color: "#cca166", contrastColor: "black"},
    {name: "12m", startFreq: 24.89, stopFreq: 24.99, color: "#b22222", contrastColor: "white"},
    {name: "10m", startFreq: 28.0, stopFreq: 29.7, color: "#ff69b4", contrastColor: "black"},
    {name: "6m", startFreq: 50.0, stopFreq: 54.0, color: "#FF0000", contrastColor: "white"},
    {name: "4m", startFreq: 70.0, stopFreq: 70.5, color: "#cc0044", contrastColor: "white"},
    {name: "2m", startFreq: 144.0, stopFreq: 148.0, color: "#FF1493", contrastColor: "black"},
    {name: "70cm", startFreq: 420.0, stopFreq: 450.0, color: "#999900", contrastColor: "white"},
    {name: "23cm", startFreq: 1240.0, stopFreq: 1325.0, color: "#5AB8C7", contrastColor: "black"},
    {name: "13cm", startFreq: 2300.0, stopFreq: 2450.0, color: "#FF7F50", contrastColor: "black"}];
const API_LOOKUP_USER_AGENT_STRING = "M0TRT_QSO_Map_v1.0";
const QRZ_API_BASE_URL = "https://xmldata.qrz.com/xml/current/";
const HAMQTH_API_BASE_URL = "https://www.hamqth.com/xml.php";
const POTA_PARK_BASE_URL = "https://api.pota.app/park/";
const SOTA_SUMMIT_BASE_URL = "https://api-db2.sota.org.uk/api/summits/";
const WWBOTA_BUNKER_BASE_URL = "https://api.wwbota.org/bunkers/";
const GMA_REF_BASE_URL = "https://www.cqgma.org/api/ref/?";
const MAIDENHEAD_GRID_COLOR_LIGHT = 'rgba(200, 140, 140, 1.0)';
const CQ_ZONES_COLOR_LIGHT = 'rgba(140, 200, 140, 1.0)';
const ITU_ZONES_COLOR_LIGHT = 'rgba(200, 200, 140, 1.0)';
const WAB_GRID_COLOR_LIGHT = 'rgba(140, 140, 200, 1.0)';
const MAIDENHEAD_GRID_COLOR_DARK = 'rgba(120, 60, 60, 1.0)';
const CQ_ZONES_COLOR_DARK = 'rgba(60, 120, 60, 1.0)';
const ITU_ZONES_COLOR_DARK = 'rgba(120, 120, 60, 1.0)';
const WAB_GRID_COLOR_DARK = 'rgba(60, 60, 120, 1.0)';

/////////////////////////////
//      DATA STORAGE       //
/////////////////////////////

// Data is stored in a map. The key is CALLSIGN-GRID because we don't want more than one marker for the
// same call & grid anyway. The value is an object that contains list of all QSOs with that call & grid,
// along with the call and grid itself for lookup. So we may have for example:
// { "M0TRT-IO90BS" -> { call : "M0TRT", grid : "IO90BS". qsos : [ {time, freq, mode, etc.}, {time, freq, mode, etc.} ], } }
let data = new Map();
// A list of QSOs received without grid information, which have been held for lookup. Once they have
// grid information, they are removed from here and added to data.
let queue = [];
// A map of callsign to data we looked up from QRZ.com. Used so that we don't re-query QRZ again for a call we have
// already seen.
let lookupData = new Map();
// Count of all QSOs loaded from file(s)
let qsoCount = 0;
// Count of all QSOs we tried but failed to look up. Used for status reporting.
let failedLookupCount = 0;
// Track whether we have tried to load something, and whether we are still loading. Used to control the status indicator.
let loadedAtLeastOnce = false
let loading = false;
let lastLoadTypeRecognised = false;
// My callsign
let myCall;
// Position of the grey home marker
let qthGrid;
let qthPos;
// Marker, geodesic line and grid square graphic references. The graphics themselves are added to the Leaflet map but we also
// keep them in these data maps so we can easily e.g. find them to remove them when we need to. markers & lines are indexed
// by "CALLSIGN-GRID", the same as the main "data" map, because each CALLSIGN-GRID combo gets a single marker and/or line.
// gridsquares and gridsquarelabels are indexed by 4-digit square. Several QSOs can share the same square, so we use this to
// prevent drawing multiple overlapping squares.
let markers = new Map();
let lines = new Map();
let gridSquares = new Map();
let gridSquareLabels = new Map();
// Map and layers
let map;
let basemapLayer;
let markersLayer;
let linesLayer;
let gridSquaresWorkedLayer;
let gridSquaresWorkedLabelsLayer;
let ownPosLayer;
let ownPosMarker;
let maidenheadGrid;
let wabGrid;
let cqZones;
let ituZones;
// Session token for QRZ.com lookups
let qrzToken;
// Session token for HamQTH lookups
let hamQTHToken;
// Tracker for how many years, bands and modes we have in our data set.
let years = new Set();
let bands = new Set();
let modes = new Set();


/////////////////////////////
//  UI CONFIGURABLE VARS   //
/////////////////////////////

let appendOnLoad = false;
let basemap = "Esri.NatGeoWorldMap";
let basemapOpacity = 0.5;
let basemapIsDark = false;
let markersEnabled = true;
let qthMarker = true;
let linesEnabled = true;
let gridSquaresEnabled = false;
let labelGridSquaresWorked = false;
let colourLines = true;
let thickLines = true;
let bandColours = true;
let modeColours = true;
let smallMarkers = false;
let outdoorSymbols = false;
let hybridMarkerSize = false;
let showMaidenheadGrid = false;
let showCQZones = false;
let showITUZones = false;
let showWABGrid = false;
let showCallsignLabels = false;
let showGridSquareLabels = false;
let showDistanceLabels = false;
let distancesInMiles = false;
let showComments = true;
let inferOutdoorActivitiesFromComments = false;
let filterYear = "*";
let filterMode = "*";
let filterBand = "*";
let queryXOTA = true;
let queryQRZ = false;
let queryHamQTH = false;
let rememberPasswords = true;
