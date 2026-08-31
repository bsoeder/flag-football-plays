// App version — shown in the header. Bump alongside the service worker cache.
const APP_VERSION = "v1.17";

const routeTree = {
  0: "Step-forward screen",
  1: "Out",
  2: "Slant",
  3: "Comeback",
  4: "Hook / Curl",
  5: "Deep Out",
  6: "Cross",
  7: "Corner",
  8: "Post",
  9: "Go",
};

// Compact route names for the on-field tags so labels stay readable and don't collide.
const routeShortNames = {
  0: "Screen",
  1: "Out",
  2: "Slant",
  3: "Comeback",
  4: "Curl",
  5: "Deep Out",
  6: "Cross",
  7: "Corner",
  8: "Post",
  9: "Go",
};

// A player's "route" can be a run (R) instead of a pass route, matching the team's
// code convention (e.g. 56R9 = z runs). Runs draw as a green ball-carrier path.
const runRouteValue = "R";

function isRunRoute(codeChar) {
  return String(codeChar).toUpperCase() === runRouteValue;
}

function routeLabel(codeChar) {
  return isRunRoute(codeChar) ? "Run" : routeTree[Number(codeChar)] || "Route";
}

function routeTagText(codeChar) {
  return isRunRoute(codeChar) ? "Run" : `${codeChar} ${routeShortNames[Number(codeChar)] || ""}`.trim();
}

const conceptLibrary = {
  run: {
    none: {
      label: "No Run",
      shortLabel: "Routes Only",
      description: "Keep the call built around the route concept only.",
    },
    "qb-draw": {
      label: "QB Draw",
      shortLabel: "QB Draw",
      description: "Quarterback plants and attacks vertically through the middle.",
    },
    "c-dive": {
      label: "Center Dive",
      shortLabel: "Center Dive",
      description: "Fast inside handoff working downhill through the A gap.",
    },
    "jet-left": {
      label: "Jet Sweep Left",
      shortLabel: "Jet Left",
      description: "Orbit motion to the left edge for a speed sweep look.",
    },
    "jet-right": {
      label: "Jet Sweep Right",
      shortLabel: "Jet Right",
      description: "Jet action racing to the right edge for outside leverage.",
    },
    reverse: {
      label: "Reverse",
      shortLabel: "Reverse",
      description: "Ball action bends back across the formation after misdirection.",
    },
  },
  fake: {
    none: {
      label: "No Fake",
      shortLabel: "No Fake",
      description: "Keep the backfield clean without eye-candy action.",
    },
    "play-action": {
      label: "Play Action",
      shortLabel: "Play Action",
      description: "Sell an inside handoff before settling into the pass look.",
    },
    "jet-fake-left": {
      label: "Jet Fake Left",
      shortLabel: "Jet Fake L",
      description: "Flash motion left to pull eyes and force lateral flow.",
    },
    "jet-fake-right": {
      label: "Jet Fake Right",
      shortLabel: "Jet Fake R",
      description: "Send motion right to widen leverage before the snap look develops.",
    },
    "reverse-fake": {
      label: "Reverse Fake",
      shortLabel: "Reverse Fake",
      description: "Show reverse action behind the quarterback before the real play hits.",
    },
  },
  option: {
    none: {
      label: "No Option",
      shortLabel: "No Option",
      description: "Keep a single post-snap answer without branching choices.",
    },
    "read-left": {
      label: "Read Option Left",
      shortLabel: "Read L",
      description: "Mesh with a left-side read and let the quarterback keep or give.",
    },
    "read-right": {
      label: "Read Option Right",
      shortLabel: "Read R",
      description: "Read the right edge and branch the ball path off the mesh.",
    },
    "speed-left": {
      label: "Speed Option Left",
      shortLabel: "Speed L",
      description: "Attack the left flank with a keep-or-pitch option structure.",
    },
    "speed-right": {
      label: "Speed Option Right",
      shortLabel: "Speed R",
      description: "Stress the right edge with a speed-option pitch relationship.",
    },
    "rpo-bubble": {
      label: "RPO Bubble",
      shortLabel: "RPO Bubble",
      description: "Pair a run mesh with a quick bubble answer outside.",
    },
  },
};

const modeDescriptions = {
  compose: "Compose routes, runs, fakes, and options on the field.",
  playbooks: "Save the current call or pull a playbook into the field board.",
  simulation: "Review leverage and coverage fit against your selected defense.",
};

const formationLibrary = {
  bunch: { label: "Bunch", description: "Condensed stack creating natural rubs, picks, and quick throws." },
  pro: { label: "Pro", description: "Balanced Optimus / Tic Tac Toe / Wheeljack looks with backfield flex." },
  trips: { label: "Trips", description: "Three-strong surface (left or right) to flood one side." },
};

const playTypeLibrary = {
  pass: { label: "Pass", description: "Base dropback and rhythm throws off the route call." },
  run: { label: "Run", description: "Downhill and perimeter runs off the base call." },
  option: { label: "Option", description: "Post-snap reads that branch keep, throw, or pitch." },
  trick: { label: "Trick", description: "Reverses, Uno, and Starscream misdirection specials." },
  goalline: { label: "Goal Line", description: "Condensed red-zone and goal-line calls." },
};

// Plays imported from the Spring/Fall 2026 Seahawks 5/6 playbook (pptx slides 11-71).
// Four-digit codes follow the team's x-y-z-c order; concept letters in the source
// (Run / Fake / Option / Uno) are layered on as run, fake, and option concepts.
function libraryPlay(config) {
  return {
    bunchSide: "left",
    proMotion: "stay",
    ...config,
    concepts: { run: "none", fake: "none", option: "none", ...(config.concepts || {}) },
  };
}

const playLibrary = [
  // ----- Bunch (slides 11-22, 46-50) -----
  libraryPlay({ id: "bunch-starscream-56r9", name: "Bunch Starscream", formation: "bunch", type: "trick", code: "5609", concepts: { run: "jet-right" } }),
  libraryPlay({ id: "bunch-starscream-86fake7", name: "Bunch Starscream (Fake)", formation: "bunch", type: "trick", code: "8687", concepts: { fake: "play-action" } }),
  libraryPlay({ id: "bunch-starscream-86option9", name: "Bunch Starscream Option", formation: "bunch", type: "option", code: "8679", concepts: { option: "read-right" } }),
  libraryPlay({ id: "bunch-option-open-right", name: "Bunch Option Open Right", formation: "bunch", type: "option", code: "8679", bunchSide: "right", concepts: { option: "read-right" } }),
  libraryPlay({ id: "bunch-uno-run6fake5", name: "Bunch Uno", formation: "bunch", type: "trick", code: "0685", concepts: { run: "reverse", fake: "reverse-fake" } }),
  libraryPlay({ id: "bunch-uno-double-fake-9615", name: "Bunch Uno Double Fake", formation: "bunch", type: "trick", code: "9615", concepts: { run: "reverse", fake: "reverse-fake" } }),
  libraryPlay({ id: "bunch-pass-left-8626", name: "Bunch Pass Left", formation: "bunch", type: "pass", code: "8626", bunchSide: "left" }),
  libraryPlay({ id: "bunch-pass-right-6826", name: "Bunch Pass Right", formation: "bunch", type: "pass", code: "6826", bunchSide: "right" }),
  libraryPlay({ id: "bunch-pass-5529", name: "Bunch Pass 5529", formation: "bunch", type: "pass", code: "5529" }),
  libraryPlay({ id: "bunch-6206", name: "Bunch 6206", formation: "bunch", type: "goalline", code: "6206" }),
  libraryPlay({ id: "bunch-6208", name: "Bunch 6208", formation: "bunch", type: "goalline", code: "6208" }),
  libraryPlay({ id: "bunch-0261", name: "Bunch 0261", formation: "bunch", type: "goalline", code: "0261" }),
  libraryPlay({ id: "bunch-7671", name: "Bunch 7671", formation: "bunch", type: "goalline", code: "7671" }),
  libraryPlay({ id: "bunch-2627", name: "Bunch 2627", formation: "bunch", type: "goalline", code: "2627" }),

  // ----- Pro (slides 24-45) -----
  libraryPlay({ id: "optimus-prime-2222", name: "Optimus Prime", formation: "pro", type: "pass", code: "2222" }),
  libraryPlay({ id: "optimus-go-9999", name: "Optimus Go", formation: "pro", type: "pass", code: "9999" }),
  libraryPlay({ id: "optimus-go-run-99run9", name: "Optimus Go Run", formation: "pro", type: "run", code: "9909", concepts: { run: "qb-draw" } }),
  libraryPlay({ id: "optimus-curl-4444", name: "Optimus Curl", formation: "pro", type: "pass", code: "4444" }),
  libraryPlay({ id: "optimus-curl-fake-4424", name: "Optimus Curl Fake", formation: "pro", type: "pass", code: "4424", concepts: { fake: "play-action" } }),
  libraryPlay({ id: "optimus-outs-5578", name: "Optimus Outs", formation: "pro", type: "pass", code: "5578" }),
  libraryPlay({ id: "tictactoe-fake-left-90r1", name: "Tic Tac Toe Fake Left", formation: "pro", type: "run", code: "9001", proMotion: "left", concepts: { run: "c-dive", fake: "play-action" } }),
  libraryPlay({ id: "tictactoe-right-91option1", name: "Tic Tac Toe Right", formation: "pro", type: "option", code: "9171", concepts: { option: "read-right" } }),
  libraryPlay({ id: "tictactoe-motion-8fakeoption1", name: "Tic Tac Toe Motion Option", formation: "pro", type: "option", code: "8871", proMotion: "right", concepts: { fake: "play-action", option: "read-right" } }),
  libraryPlay({ id: "tictactoe-motion-8fakefake1", name: "Tic Tac Toe Motion Double Fake", formation: "pro", type: "trick", code: "8881", proMotion: "left", concepts: { fake: "play-action" } }),
  libraryPlay({ id: "double-sideswipe-0022", name: "Double Sideswipe", formation: "pro", type: "pass", code: "0022" }),
  libraryPlay({ id: "sideswipe-left-0922", name: "Sideswipe Left", formation: "pro", type: "pass", code: "0922" }),
  libraryPlay({ id: "sideswipe-right-9022", name: "Sideswipe Right", formation: "pro", type: "pass", code: "9022" }),
  libraryPlay({ id: "wheeljack-left-9348", name: "Wheeljack Left", formation: "pro", type: "pass", code: "9348", proMotion: "left" }),
  libraryPlay({ id: "wheeljack-sideswipe-9048", name: "Wheeljack Sideswipe", formation: "pro", type: "pass", code: "9048", proMotion: "left" }),
  libraryPlay({ id: "wheeljack-right-9586", name: "Wheeljack Right", formation: "pro", type: "pass", code: "9586", proMotion: "right" }),
  libraryPlay({ id: "option-left-5224", name: "Option Left", formation: "pro", type: "option", code: "5224", concepts: { option: "speed-left" } }),
  libraryPlay({ id: "option-right-2523", name: "Option Right", formation: "pro", type: "option", code: "2523", concepts: { option: "speed-right" } }),
  libraryPlay({ id: "reverse-starscream-2optionfake9", name: "Reverse Starscream", formation: "pro", type: "trick", code: "2789", concepts: { run: "reverse", fake: "reverse-fake", option: "read-right" } }),
  libraryPlay({ id: "uno-reverse-pro", name: "Uno Reverse", formation: "pro", type: "trick", code: "0660", concepts: { run: "reverse", fake: "reverse-fake" } }),

  // ----- Trips left/right (slides 52-62) -----
  libraryPlay({ id: "trips-left-8636", name: "Trips Left 8636", formation: "trips", type: "pass", code: "8636" }),
  libraryPlay({ id: "trips-right-8636", name: "Trips Right 8636", formation: "trips", type: "pass", code: "8636" }),
  libraryPlay({ id: "trips-left-5364", name: "Trips Left 5364", formation: "trips", type: "pass", code: "5364" }),
  libraryPlay({ id: "trips-right-5364", name: "Trips Right 5364", formation: "trips", type: "pass", code: "5364" }),
  libraryPlay({ id: "trips-left-5428", name: "Trips Left 5428", formation: "trips", type: "pass", code: "5428" }),
  libraryPlay({ id: "trips-right-5428", name: "Trips Right 5428", formation: "trips", type: "pass", code: "5428" }),
  libraryPlay({ id: "trips-left-54fake8", name: "Trips Left 54 Fake 8", formation: "trips", type: "pass", code: "5488", concepts: { fake: "play-action" } }),
  libraryPlay({ id: "trips-right-54fake8", name: "Trips Right 54 Fake 8", formation: "trips", type: "pass", code: "5488", concepts: { fake: "play-action" } }),
  libraryPlay({ id: "trips-left-54uno8", name: "Trips Left 54 Uno 8", formation: "trips", type: "trick", code: "5408", concepts: { run: "reverse", fake: "reverse-fake" } }),
  libraryPlay({ id: "trips-left-54run8", name: "Trips Left 54 Run 8", formation: "trips", type: "run", code: "5408", concepts: { run: "c-dive" } }),
  libraryPlay({ id: "trips-right-54run8", name: "Trips Right 54 Run 8", formation: "trips", type: "run", code: "5408", concepts: { run: "c-dive" } }),

  // ----- Offense specials (slides 64-71) -----
  libraryPlay({ id: "starscream-left", name: "Starscream Left", formation: "pro", type: "trick", code: "5609", concepts: { run: "jet-left" } }),
  libraryPlay({ id: "starscream-left-frosting", name: "Starscream Left with Frosting", formation: "pro", type: "trick", code: "5689", concepts: { run: "jet-left", fake: "play-action" } }),
  libraryPlay({ id: "starscream-left-cheese", name: "Starscream Left with Cheese", formation: "pro", type: "trick", code: "5620", concepts: { fake: "jet-fake-left" } }),
  libraryPlay({ id: "reverse-starscream-left", name: "Reverse Starscream Left", formation: "pro", type: "trick", code: "0669", concepts: { run: "reverse", fake: "reverse-fake" } }),
  libraryPlay({ id: "starscream-right", name: "Starscream Right", formation: "pro", type: "trick", code: "9605", concepts: { run: "jet-right" } }),
  libraryPlay({ id: "reverse-starscream-right", name: "Reverse Starscream Right", formation: "pro", type: "trick", code: "9660", concepts: { run: "reverse", fake: "reverse-fake" } }),
];

const routePlayers = ["x", "y", "z", "c"];
const allPlayers = ["x", "y", "z", "c", "q"];
const playerLabels = { x: "X", y: "Y", z: "Z", c: "C", q: "QB" };
const defaultOptionCarrier = "q";
const fieldWidth = 1000;
const fieldHeight = 600;
const fieldAspectRatio = fieldWidth / fieldHeight;
const zoomStep = 0.82;
const minViewportWidth = 280;

const playerColors = {
  x: "#000080",
  y: "#008000",
  z: "#ff0000",
  c: "#ffff00",
  q: "#ffa500",
};

const defenseColors = {
  cover2: "#fef3b0",
  cover3: "#a9def9",
  cover4: "#d8c4f1",
  man: "#ffb4a2",
};

const conceptColors = {
  run: "#9ad87c",
  fake: "#f0a35d",
  option: "#76c5ff",
};

// Alignments are centered on the field's vertical center line (x = 500); X and Y sit
// wide toward the sidelines so the picture fills the frame and reads well on a tablet.
const formations = {
  pro: {
    x: { x: 175, y: 405 },
    y: { x: 825, y: 405 },
    z: { x: 500, y: 545 },
    c: { x: 500, y: 405 },
    q: { x: 500, y: 495 },
  },
  trips: {
    x: { x: 175, y: 405 },
    y: { x: 330, y: 368 },
    z: { x: 485, y: 405 },
    c: { x: 825, y: 405 },
    q: { x: 560, y: 500 },
  },
};

const defenseLabels = {
  cover2: "Cover 2",
  cover3: "Cover 3",
  cover4: "Cover 4",
  man: "Man",
};

const schemeBonuses = {
  cover2: { 7: 16, 8: 15, 9: 10, 4: 9, 6: 8, 5: 5, 2: 3 },
  cover3: { 4: 14, 6: 13, 3: 10, 2: 8, 0: 8, 8: 6 },
  cover4: { 6: 14, 4: 12, 2: 10, 0: 9, 3: 9, 7: 4, 9: 2 },
  man: { 6: 16, 2: 14, 3: 12, 1: 10, 7: 8, 8: 7, 0: 6 },
};

const defenseDescriptions = {
  cover2: "Tests the deep half safeties and clouds the flats.",
  cover3: "Protects the deep thirds and squeezes sideline verticals.",
  cover4: "Keeps four defenders over the top and concedes underneath rhythm.",
  man: "Matches bodies directly and punishes routes that cannot separate.",
};

const conceptBonuses = {
  run: {
    "qb-draw": { cover2: 6, cover3: 8, cover4: 12, man: 5 },
    "c-dive": { cover2: 4, cover3: 7, cover4: 10, man: 3 },
    "jet-left": { cover2: 8, cover3: 5, cover4: 4, man: 7 },
    "jet-right": { cover2: 8, cover3: 5, cover4: 4, man: 7 },
    reverse: { cover2: 7, cover3: 10, cover4: 6, man: 8 },
  },
  fake: {
    "play-action": { cover2: 5, cover3: 8, cover4: 10, man: 4 },
    "jet-fake-left": { cover2: 6, cover3: 7, cover4: 5, man: 6 },
    "jet-fake-right": { cover2: 6, cover3: 7, cover4: 5, man: 6 },
    "reverse-fake": { cover2: 5, cover3: 9, cover4: 6, man: 7 },
  },
  option: {
    "read-left": { cover2: 6, cover3: 8, cover4: 9, man: 5 },
    "read-right": { cover2: 6, cover3: 8, cover4: 9, man: 5 },
    "speed-left": { cover2: 8, cover3: 6, cover4: 5, man: 7 },
    "speed-right": { cover2: 8, cover3: 6, cover4: 5, man: 7 },
    "rpo-bubble": { cover2: 9, cover3: 8, cover4: 6, man: 4 },
  },
};

const formationSelect = document.querySelector("#formation-select");
const playCodeInput = document.querySelector("#play-code-input");
const playCodeBadge = document.querySelector("#play-code-badge");
const currentPlayTitle = document.querySelector("#current-play-title");
const currentPlayConcepts = document.querySelector("#current-play-concepts");
const stageSubtitle = document.querySelector("#stage-subtitle");
const randomPlayButton = document.querySelector("#random-play-button");
const zoomOutButton = document.querySelector("#zoom-out-button");
const zoomInButton = document.querySelector("#zoom-in-button");
const resetViewButton = document.querySelector("#reset-view-button");
const resetRoutesButton = document.querySelector("#reset-routes-button");
const exportSvgButton = document.querySelector("#export-svg-button");
const exportPptxButton = document.querySelector("#export-pptx-button");
const defenseSelect = document.querySelector("#defense-select");
const simulateButton = document.querySelector("#simulate-button");
const stopSimulationButton = document.querySelector("#stop-simulation-button");
const simulationStatus = document.querySelector("#simulation-status");
const defenseReportGrid = document.querySelector("#defense-report-grid");
const fieldSvg = document.querySelector("#field");
const routeLegend = document.querySelector("#route-legend");
const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
const modePanels = Array.from(document.querySelectorAll("[data-mode-panel]"));
const bunchSideGroup = document.querySelector("#bunch-side-group");
const bunchSideButtons = Array.from(document.querySelectorAll("[data-bunch-side]"));
const proMotionGroup = document.querySelector("#pro-motion-group");
const proMotionButtons = Array.from(document.querySelectorAll("[data-pro-motion]"));
const savePlayName = document.querySelector("#save-play-name");
const savePlayType = document.querySelector("#save-play-type");
const savePlayButton = document.querySelector("#save-play-button");
const savePlayStatus = document.querySelector("#save-play-status");
const modeViews = Array.from(document.querySelectorAll("[data-mode-view]"));
const playbookBrowseButtons = Array.from(document.querySelectorAll("[data-browse]"));
const playbookFilter = document.querySelector("#playbook-filter");
const playbookGroups = document.querySelector("#playbook-groups");
const playbookSubnavButtons = Array.from(document.querySelectorAll("[data-subview]"));
const subviewPanels = Array.from(document.querySelectorAll("[data-subview-panel]"));
const newPlaybookName = document.querySelector("#new-playbook-name");
const createPlaybookButton = document.querySelector("#create-playbook-button");
const playbooksList = document.querySelector("#playbooks-list");
const exportDataButton = document.querySelector("#export-data-button");
const importDataInput = document.querySelector("#import-data-input");
const syncStatus = document.querySelector("#sync-status");
const airtableTokenInput = document.querySelector("#airtable-token");
const airtableBaseInput = document.querySelector("#airtable-base");
const airtableTableInput = document.querySelector("#airtable-table");
const airtableConnectButton = document.querySelector("#airtable-connect");
const airtableSyncButton = document.querySelector("#airtable-sync");
const airtablePullButton = document.querySelector("#airtable-pull");
const airtableDisconnectButton = document.querySelector("#airtable-disconnect");
const cloudSyncDetails = document.querySelector("#cloud-sync-details");
const cloudSyncBadge = document.querySelector("#cloud-sync-badge");
const playFullscreen = document.querySelector("#play-fullscreen");
const pfNameInput = document.querySelector("#pf-name-input");
const pfCode = document.querySelector("#pf-code");
const pfConcepts = document.querySelector("#pf-concepts");
const pfStatus = document.querySelector("#pf-status");
const pfField = document.querySelector("#pf-field");
const pfClose = document.querySelector("#pf-close");
const pfEdit = document.querySelector("#pf-edit");
const pfDelete = document.querySelector("#pf-delete");
const pfAddPlaybook = document.querySelector("#pf-add-playbook");
let fullscreenPlay = null;

const routeInputs = {
  x: document.querySelector("#route-x"),
  y: document.querySelector("#route-y"),
  z: document.querySelector("#route-z"),
  c: document.querySelector("#route-c"),
};

const conceptInputs = {
  run: document.querySelector("#run-concept-select"),
  fake: document.querySelector("#fake-concept-select"),
  option: document.querySelector("#option-concept-select"),
};

const optionCarrierSelect = document.querySelector("#option-carrier-select");

const svgNs = "http://www.w3.org/2000/svg";
const customPlaysKey = "flag-football-custom-plays";
const playbooksKey = "flag-football-playbooks";
const nameOverridesKey = "flag-football-name-overrides";
const playOverridesKey = "flag-football-play-overrides";
const svgMime = "image/svg+xml";
const pptxMime = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

let bunchSide = "left";
let proMotion = "stay";
let customPlays = loadCustomPlays();
let playbooks = loadPlaybooks();
let nameOverrides = loadNameOverrides();
let playOverrides = loadPlayOverrides();
let playbookSubview = "plays";
let openPickerBookId = null;
let editingPlayId = null;
let routeOverrides = {};
let alignmentOverrides = {};
let simulationFrameId = 0;
let animationStart = 0;
let activeSimulation = null;
let activeMode = "compose";
let playbookBrowseMode = "formation";
let playbookFilterValue = "all";
let fieldViewport = createDefaultViewport();
let activeRouteDrag = null;
let activePlayerDrag = null;

function normalizeBunchSide(value) {
  return value === "right" ? "right" : "left";
}

function normalizeProMotion(value) {
  return value === "left" || value === "right" ? value : "stay";
}

function getProBackfieldLayout(motion = proMotion) {
  const q = { ...formations.pro.q };
  const start = { ...formations.pro.z };
  const destinations = {
    stay: start,
    left: { x: 300, y: start.y },
    right: { x: 700, y: start.y },
  };

  return {
    q,
    start,
    destination: destinations[normalizeProMotion(motion)],
  };
}

function getAlignment(formationKey, options = {}) {
  const resolvedBunchSide = normalizeBunchSide(options?.bunchSide || bunchSide);
  const resolvedProMotion = normalizeProMotion(options?.proMotion || proMotion);

  if (formationKey === "bunch") {
    const common = {
      x: { x: 360, y: 405 },
      y: { x: 640, y: 405 },
      c: { x: 500, y: 405 },
      q: { x: 500, y: 505 },
    };

    // Z aligns in the backfield, slightly offset from the X/Y bunch toward the called side.
    if (resolvedBunchSide === "right") {
      return {
        ...common,
        z: { x: 575, y: 475 },
      };
    }

    return {
      ...common,
      z: { x: 425, y: 475 },
    };
  }

  if (formationKey === "pro") {
    const { q, destination } = getProBackfieldLayout(resolvedProMotion);
    return {
      x: { ...formations.pro.x },
      y: { ...formations.pro.y },
      z: destination,
      c: { ...formations.pro.c },
      q,
    };
  }

  return formations[formationKey];
}

function getSnapshotAlignment(snapshot) {
  const base = getAlignment(snapshot.formation, snapshot);
  const overrides = snapshot.alignmentOverrides;
  if (!overrides) {
    return base;
  }

  const merged = { ...base };
  allPlayers.forEach((player) => {
    const spot = overrides[player];
    if (spot && Number.isFinite(spot.x) && Number.isFinite(spot.y)) {
      merged[player] = { x: spot.x, y: spot.y };
    }
  });
  return merged;
}

function currentPlaySnapshot() {
  return {
    formation: formationSelect.value,
    code: getPlayCode(),
    bunchSide,
    proMotion,
    routeOverrides: cloneRouteOverrides(routeOverrides),
    alignmentOverrides: cloneAlignmentOverrides(alignmentOverrides),
    concepts: getCurrentConcepts(),
    optionCarrier: optionCarrierSelect.value,
    type: savePlayType && playTypeLibrary[savePlayType.value] ? savePlayType.value : "pass",
  };
}

function normalizeOptionCarrier(value) {
  return allPlayers.includes(value) ? value : defaultOptionCarrier;
}

function normalizePlayType(value) {
  return value && playTypeLibrary[value] ? value : "pass";
}

function applySnapshot(snapshot) {
  const normalized = normalizeSnapshot(snapshot);
  stopSimulationSilently();
  formationSelect.value = normalized.formation;
  bunchSide = normalized.bunchSide;
  proMotion = normalized.proMotion;
  routeOverrides = normalized.routeOverrides;
  alignmentOverrides = normalized.alignmentOverrides;
  applyConcepts(normalized.concepts);
  optionCarrierSelect.value = normalized.optionCarrier;
  if (savePlayType && playTypeLibrary[normalized.type]) {
    savePlayType.value = normalized.type;
  }
  setPlayCode(normalized.code, { preserveOverrides: true });
}

function normalizeSnapshot(snapshot) {
  return {
    formation: snapshot?.formation || "bunch",
    code: sanitizeCode(snapshot?.code || "0000"),
    bunchSide: normalizeBunchSide(snapshot?.bunchSide),
    proMotion: normalizeProMotion(snapshot?.proMotion),
    routeOverrides: normalizeRouteOverrides(snapshot?.routeOverrides),
    alignmentOverrides: normalizeAlignmentOverrides(snapshot?.alignmentOverrides),
    concepts: normalizeConcepts(snapshot?.concepts),
    optionCarrier: normalizeOptionCarrier(snapshot?.optionCarrier),
    type: normalizePlayType(snapshot?.type),
  };
}

function normalizeConcepts(value) {
  return Object.entries(conceptLibrary).reduce((accumulator, [kind, library]) => {
    const requested = value?.[kind];
    accumulator[kind] = requested && library[requested] ? requested : "none";
    return accumulator;
  }, {});
}

function getCurrentConcepts() {
  return normalizeConcepts(
    Object.fromEntries(
      Object.entries(conceptInputs).map(([kind, select]) => [kind, select.value]),
    ),
  );
}

function applyConcepts(concepts) {
  const normalized = normalizeConcepts(concepts);
  Object.entries(conceptInputs).forEach(([kind, select]) => {
    select.value = normalized[kind];
  });
}

function createDefaultViewport() {
  return {
    x: 0,
    y: 0,
    width: fieldWidth,
    height: fieldHeight,
  };
}

function formatViewBox(viewport) {
  return `${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`;
}

function clampViewport(viewport) {
  const width = clamp(viewport.width, minViewportWidth, fieldWidth);
  const height = width / fieldAspectRatio;
  return {
    x: clamp(viewport.x, 0, fieldWidth - width),
    y: clamp(viewport.y, 0, fieldHeight - height),
    width,
    height,
  };
}

function viewportCenter(viewport = fieldViewport) {
  return {
    x: viewport.x + viewport.width / 2,
    y: viewport.y + viewport.height / 2,
  };
}

function zoomField(factor, focus = viewportCenter()) {
  const nextWidth = fieldViewport.width * factor;
  const nextHeight = nextWidth / fieldAspectRatio;
  const relativeX = (focus.x - fieldViewport.x) / fieldViewport.width;
  const relativeY = (focus.y - fieldViewport.y) / fieldViewport.height;

  fieldViewport = clampViewport({
    x: focus.x - nextWidth * relativeX,
    y: focus.y - nextHeight * relativeY,
    width: nextWidth,
    height: nextHeight,
  });
  render();
}

function resetFieldView() {
  fieldViewport = createDefaultViewport();
  render();
}

function normalizeRouteOverrides(value) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return routePlayers.reduce((accumulator, player) => {
    const points = value[player];
    if (!Array.isArray(points)) {
      return accumulator;
    }

    const normalized = points
      .filter((point) => Array.isArray(point) && point.length >= 2)
      .map((point) => {
        const x = Number(point[0]);
        const y = Number(point[1]);
        return [
          clamp(Number.isFinite(x) ? x : 0, 0, fieldWidth),
          clamp(Number.isFinite(y) ? y : 0, 0, fieldHeight),
        ];
      });

    if (normalized.length > 0) {
      accumulator[player] = normalized;
    }

    return accumulator;
  }, {});
}

function cloneRouteOverrides(value = routeOverrides) {
  return normalizeRouteOverrides(value);
}

function clearRouteOverrides(players = routePlayers) {
  if (players.length === routePlayers.length) {
    routeOverrides = {};
    return;
  }

  players.forEach((player) => {
    delete routeOverrides[player];
  });
}

function setRouteOverride(player, points) {
  const overrides = points.slice(1).map((point) => [
    Math.round(clamp(point[0], 0, fieldWidth)),
    Math.round(clamp(point[1], 0, fieldHeight)),
  ]);

  if (overrides.length === 0) {
    delete routeOverrides[player];
    return;
  }

  routeOverrides = {
    ...routeOverrides,
    [player]: overrides,
  };
}

function normalizeAlignmentOverrides(value) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return allPlayers.reduce((accumulator, player) => {
    const spot = value[player];
    if (!spot || typeof spot !== "object") {
      return accumulator;
    }
    const x = Number(spot.x);
    const y = Number(spot.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      accumulator[player] = {
        x: clamp(x, 0, fieldWidth),
        y: clamp(y, 0, fieldHeight),
      };
    }
    return accumulator;
  }, {});
}

function cloneAlignmentOverrides(value = alignmentOverrides) {
  return normalizeAlignmentOverrides(value);
}

function clearAlignmentOverrides(players = allPlayers) {
  if (players.length === allPlayers.length) {
    alignmentOverrides = {};
    return;
  }
  players.forEach((player) => {
    delete alignmentOverrides[player];
  });
}

function setAlignmentOverride(player, spot) {
  alignmentOverrides = {
    ...alignmentOverrides,
    [player]: {
      x: Math.round(clamp(spot.x, 0, fieldWidth)),
      y: Math.round(clamp(spot.y, 0, fieldHeight)),
    },
  };
}

function activeConceptEntries(concepts) {
  const normalized = normalizeConcepts(concepts);
  return Object.entries(normalized)
    .filter(([, value]) => value !== "none")
    .map(([kind, value]) => ({
      kind,
      value,
      ...conceptLibrary[kind][value],
    }));
}

function formatConceptSummary(concepts) {
  const active = activeConceptEntries(concepts);
  if (active.length === 0) {
    return "Base route concept";
  }
  return active.map((entry) => entry.shortLabel).join(" · ");
}

function formationVariantText(snapshot) {
  const normalized = normalizeSnapshot(snapshot);
  if (normalized.formation === "bunch") {
    return `z ${normalized.bunchSide}`;
  }

  if (normalized.formation === "pro") {
    return normalized.proMotion === "stay" ? "z backfield" : `z motion ${normalized.proMotion}`;
  }

  return "";
}

function formationSetupText(snapshot) {
  const normalized = normalizeSnapshot(snapshot);
  const variant = formationVariantText(normalized);
  return variant ? `${normalized.formation} / ${variant}` : normalized.formation;
}

function setActiveMode(mode) {
  activeMode = modeDescriptions[mode] ? mode : "compose";
  render();
}

function renderActiveMode() {
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === activeMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  modePanels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.modePanel !== activeMode);
  });

  const activeView = activeMode === "playbooks" ? "playbooks" : "studio";
  modeViews.forEach((view) => {
    view.classList.toggle("is-hidden", view.dataset.modeView !== activeView);
  });

  stageSubtitle.textContent = modeDescriptions[activeMode];
}

function updateBunchToggleUI() {
  bunchSideButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.bunchSide === bunchSide);
    button.setAttribute("aria-pressed", button.dataset.bunchSide === bunchSide ? "true" : "false");
  });
}

function updateProMotionUI() {
  proMotionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.proMotion === proMotion);
    button.setAttribute("aria-pressed", button.dataset.proMotion === proMotion ? "true" : "false");
  });
}

function updateFormationControls() {
  bunchSideGroup.classList.toggle("is-hidden", formationSelect.value !== "bunch");
  proMotionGroup.classList.toggle("is-hidden", formationSelect.value !== "pro");
}

function loadJson(key) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeCustomPlay(play) {
  return { ...normalizeSnapshot(play), id: play.id, name: play.name, type: play.type, custom: true };
}

function normalizePlaybook(book) {
  return {
    id: book.id || createId("book"),
    name: book.name,
    playIds: Array.isArray(book.playIds) ? book.playIds.filter((id) => typeof id === "string") : [],
  };
}

function loadCustomPlays() {
  return loadJson(customPlaysKey)
    .filter((play) => play && play.id && play.name)
    .map(normalizeCustomPlay);
}

function persistCustomPlays() {
  window.localStorage.setItem(customPlaysKey, JSON.stringify(customPlays));
  scheduleAirtablePush();
}

function loadPlaybooks() {
  return loadJson(playbooksKey)
    .filter((book) => book && typeof book.name === "string")
    .map(normalizePlaybook);
}

function persistPlaybooks() {
  window.localStorage.setItem(playbooksKey, JSON.stringify(playbooks));
  scheduleAirtablePush();
}

// A snapshot of everything worth syncing, for the shared repo file / export.
function currentDataBundle() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    plays: customPlays,
    playbooks,
    nameOverrides,
    overrides: playOverrides,
  };
}

// Merge a data bundle in without clobbering local edits: add plays/playbooks the
// device doesn't already have (matched by id), and fill in any missing rename.
function mergeDataBundle(bundle) {
  if (!bundle || typeof bundle !== "object") {
    return { plays: 0, playbooks: 0 };
  }

  let addedPlays = 0;
  const knownPlayIds = new Set(customPlays.map((play) => play.id));
  (Array.isArray(bundle.plays) ? bundle.plays : [])
    .filter((play) => play && play.id && play.name && !knownPlayIds.has(play.id))
    .forEach((play) => {
      customPlays.push(normalizeCustomPlay(play));
      knownPlayIds.add(play.id);
      addedPlays += 1;
    });

  let addedBooks = 0;
  const knownBookIds = new Set(playbooks.map((book) => book.id));
  (Array.isArray(bundle.playbooks) ? bundle.playbooks : [])
    .filter((book) => book && book.id && typeof book.name === "string" && !knownBookIds.has(book.id))
    .forEach((book) => {
      playbooks.push(normalizePlaybook(book));
      knownBookIds.add(book.id);
      addedBooks += 1;
    });

  let changedNames = false;
  if (bundle.nameOverrides && typeof bundle.nameOverrides === "object") {
    Object.entries(bundle.nameOverrides).forEach(([id, name]) => {
      if (!(id in nameOverrides) && typeof name === "string") {
        nameOverrides[id] = name;
        changedNames = true;
      }
    });
  }

  let changedOverrides = false;
  if (bundle.overrides && typeof bundle.overrides === "object") {
    Object.entries(bundle.overrides).forEach(([id, play]) => {
      if (!(id in playOverrides) && play && typeof play === "object") {
        playOverrides[id] = play;
        changedOverrides = true;
      }
    });
  }

  if (addedPlays) {
    persistCustomPlays();
  }
  if (addedBooks) {
    persistPlaybooks();
  }
  if (changedNames) {
    persistNameOverrides();
  }
  if (changedOverrides) {
    persistPlayOverrides();
  }
  return { plays: addedPlays, playbooks: addedBooks };
}

// Load the shared library file committed to the repo, so a fresh device picks up
// the team's saved plays and playbooks. Local edits always win (merge is additive).
async function loadSharedLibrary() {
  try {
    const response = await fetch("./playbook-data.json", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const bundle = await response.json();
    const added = mergeDataBundle(bundle);
    if (added.plays || added.playbooks) {
      renderPlaybookLibrary();
      renderPlaybooks();
    }
  } catch {
    // No shared file (or offline) — the app still works with local data.
  }
}

function exportDataFile() {
  const bundle = currentDataBundle();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  downloadBlob(blob, "playbook-data.json");
  setSyncStatus(`Exported ${bundle.plays.length} play${bundle.plays.length === 1 ? "" : "s"} and ${bundle.playbooks.length} playbook${bundle.playbooks.length === 1 ? "" : "s"}. Commit playbook-data.json to sync all devices.`);
}

function importDataFile(file) {
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const bundle = JSON.parse(String(reader.result));
      const added = mergeDataBundle(bundle);
      renderPlaybookLibrary();
      renderPlaybooks();
      setSyncStatus(`Imported ${added.plays} new play${added.plays === 1 ? "" : "s"} and ${added.playbooks} new playbook${added.playbooks === 1 ? "" : "s"}.`);
    } catch {
      setSyncStatus("That file could not be read as playbook data.");
    }
  };
  reader.readAsText(file);
}

function setSyncStatus(message) {
  if (syncStatus) {
    syncStatus.textContent = message;
  }
}

// ---- Airtable cloud sync -------------------------------------------------
// Stores the bundle as three rows (Key = plays | playbooks | nameOverrides,
// Data = JSON) in an Airtable table, so plays/playbooks sync across devices.
const airtableConfigKey = "flag-football-airtable";
const airtableKeys = ["plays", "playbooks", "nameOverrides", "overrides"];
let airtableConfig = loadAirtableConfig();
let airtablePushTimer = null;
let airtableBusy = false;

function loadAirtableConfig() {
  try {
    const raw = window.localStorage.getItem(airtableConfigKey);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && parsed.token && parsed.baseId) {
      return { token: parsed.token, baseId: parsed.baseId, table: parsed.table || "PlayStudio" };
    }
  } catch {
    // fall through
  }
  return null;
}

function persistAirtableConfig() {
  if (airtableConfig) {
    window.localStorage.setItem(airtableConfigKey, JSON.stringify(airtableConfig));
  } else {
    window.localStorage.removeItem(airtableConfigKey);
  }
}

function airtableConnected() {
  return Boolean(airtableConfig && airtableConfig.token && airtableConfig.baseId);
}

function airtableUrl(suffix = "") {
  const table = encodeURIComponent(airtableConfig.table || "PlayStudio");
  return `https://api.airtable.com/v0/${encodeURIComponent(airtableConfig.baseId)}/${table}${suffix}`;
}

async function airtableRequest(method, suffix, body) {
  const response = await fetch(airtableUrl(suffix), {
    method,
    headers: {
      Authorization: `Bearer ${airtableConfig.token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    let detail = `${response.status}`;
    try {
      const err = await response.json();
      detail = err?.error?.message || err?.error?.type || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return response.json();
}

async function airtableGetRecords() {
  const data = await airtableRequest("GET", "?pageSize=100");
  return (data.records || []).map((record) => ({
    id: record.id,
    key: record.fields?.Key,
    data: record.fields?.Data,
  }));
}

async function airtableUpsert(records, key, dataString) {
  const existing = records.find((record) => record.key === key);
  if (existing) {
    await airtableRequest("PATCH", `/${existing.id}`, { fields: { Data: dataString } });
  } else {
    await airtableRequest("POST", "", { records: [{ fields: { Key: key, Data: dataString } }] });
  }
}

async function airtablePush() {
  if (!airtableConnected()) {
    return;
  }
  const records = await airtableGetRecords();
  const bundle = currentDataBundle();
  await airtableUpsert(records, "plays", JSON.stringify(bundle.plays));
  await airtableUpsert(records, "playbooks", JSON.stringify(bundle.playbooks));
  await airtableUpsert(records, "nameOverrides", JSON.stringify(bundle.nameOverrides));
  await airtableUpsert(records, "overrides", JSON.stringify(bundle.overrides));
}

async function airtablePullBundle() {
  const records = await airtableGetRecords();
  const bundle = { plays: [], playbooks: [], nameOverrides: {}, overrides: {} };
  records.forEach((record) => {
    if (!airtableKeys.includes(record.key) || typeof record.data !== "string") {
      return;
    }
    try {
      bundle[record.key] = JSON.parse(record.data);
    } catch {
      // skip a malformed row
    }
  });
  return bundle;
}

// Apply the cloud copy so EDITS propagate, not just new items: for a play/playbook
// present in both, the cloud version wins (that's the latest push); local-only items
// (not yet uploaded) are kept so nothing unsynced is lost.
function applyCloudBundle(bundle) {
  const cloudPlays = (Array.isArray(bundle.plays) ? bundle.plays : [])
    .filter((play) => play && play.id && play.name)
    .map(normalizeCustomPlay);
  const cloudPlayIds = new Set(cloudPlays.map((play) => play.id));
  customPlays = cloudPlays.concat(customPlays.filter((play) => !cloudPlayIds.has(play.id)));

  const cloudBooks = (Array.isArray(bundle.playbooks) ? bundle.playbooks : [])
    .filter((book) => book && book.id && typeof book.name === "string")
    .map(normalizePlaybook);
  const cloudBookIds = new Set(cloudBooks.map((book) => book.id));
  playbooks = cloudBooks.concat(playbooks.filter((book) => !cloudBookIds.has(book.id)));

  // Cloud renames win for shared ids; keep any local-only renames.
  if (bundle.nameOverrides && typeof bundle.nameOverrides === "object") {
    nameOverrides = { ...nameOverrides, ...bundle.nameOverrides };
  }

  // Cloud edits to built-in plays win for shared ids; keep any local-only edits.
  if (bundle.overrides && typeof bundle.overrides === "object") {
    playOverrides = { ...playOverrides, ...bundle.overrides };
  }

  persistCustomPlays();
  persistPlaybooks();
  persistNameOverrides();
  persistPlayOverrides();
}

// Pull (cloud wins for shared items, so edits propagate) then push local-only items up.
async function airtableSyncNow(reason = "") {
  if (!airtableConnected() || airtableBusy) {
    return;
  }
  airtableBusy = true;
  setSyncStatus(reason ? `Syncing (${reason})…` : "Syncing…");
  try {
    const bundle = await airtablePullBundle();
    applyCloudBundle(bundle);
    renderPlaybookLibrary();
    renderPlaybooks();
    await airtablePush();
    const stamp = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setSyncStatus(`Cloud sync on. Last synced ${stamp}.`);
  } catch (error) {
    setSyncStatus(`Airtable sync failed: ${error.message}. Check the token, base ID, and table.`);
  } finally {
    airtableBusy = false;
  }
}

// Lightweight background pull (no push) — used on focus and on a timer so an
// already-open device picks up edits made elsewhere.
async function airtablePullOnly() {
  if (!airtableConnected() || airtableBusy) {
    return;
  }
  airtableBusy = true;
  try {
    const bundle = await airtablePullBundle();
    applyCloudBundle(bundle);
    renderPlaybookLibrary();
    renderPlaybooks();
    const stamp = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setSyncStatus(`Cloud sync on. Checked ${stamp}.`);
  } catch {
    // Leave the last status; a transient check failure isn't worth alarming about.
  } finally {
    airtableBusy = false;
  }
}

// Replace local data with the cloud copy (so deletes on another device take effect).
async function airtablePullReplace() {
  if (!airtableConnected() || airtableBusy) {
    return;
  }
  airtableBusy = true;
  setSyncStatus("Pulling from cloud…");
  try {
    const bundle = await airtablePullBundle();
    customPlays = (Array.isArray(bundle.plays) ? bundle.plays : [])
      .filter((play) => play && play.id && play.name)
      .map(normalizeCustomPlay);
    playbooks = (Array.isArray(bundle.playbooks) ? bundle.playbooks : [])
      .filter((book) => book && book.id && typeof book.name === "string")
      .map(normalizePlaybook);
    nameOverrides = bundle.nameOverrides && typeof bundle.nameOverrides === "object" ? bundle.nameOverrides : {};
    playOverrides = bundle.overrides && typeof bundle.overrides === "object" ? bundle.overrides : {};
    persistCustomPlays();
    persistPlaybooks();
    persistNameOverrides();
    persistPlayOverrides();
    renderPlaybookLibrary();
    renderPlaybooks();
    setSyncStatus(`Replaced local data with the cloud copy (${customPlays.length} play(s), ${playbooks.length} playbook(s)).`);
  } catch (error) {
    setSyncStatus(`Pull failed: ${error.message}.`);
  } finally {
    airtableBusy = false;
  }
}

// Debounced background push after a local change.
function scheduleAirtablePush() {
  if (!airtableConnected()) {
    return;
  }
  window.clearTimeout(airtablePushTimer);
  airtablePushTimer = window.setTimeout(async () => {
    if (airtableBusy) {
      return;
    }
    airtableBusy = true;
    setSyncStatus("Saving to cloud…");
    try {
      await airtablePush();
      const stamp = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      setSyncStatus(`Cloud sync on. Saved ${stamp}.`);
    } catch (error) {
      setSyncStatus(`Cloud save failed: ${error.message}.`);
    } finally {
      airtableBusy = false;
    }
  }, 900);
}

function renderAirtableConfig() {
  if (!airtableTokenInput) {
    return;
  }
  airtableTokenInput.value = airtableConfig?.token || "";
  airtableBaseInput.value = airtableConfig?.baseId || "";
  airtableTableInput.value = airtableConfig?.table || "PlayStudio";
  const on = airtableConnected();
  if (airtableDisconnectButton) {
    airtableDisconnectButton.classList.toggle("is-hidden", !on);
  }
  if (airtableSyncButton) {
    airtableSyncButton.classList.toggle("is-hidden", !on);
  }
  if (airtablePullButton) {
    airtablePullButton.classList.toggle("is-hidden", !on);
  }
  if (cloudSyncBadge) {
    cloudSyncBadge.textContent = on ? "On" : "Off";
    cloudSyncBadge.dataset.state = on ? "on" : "off";
  }
  // Auto-collapse the panel once connected (setup is done); open it for setup.
  if (cloudSyncDetails) {
    cloudSyncDetails.open = !on;
  }
}

function connectAirtable() {
  const token = (airtableTokenInput?.value || "").trim();
  const baseId = (airtableBaseInput?.value || "").trim();
  const table = (airtableTableInput?.value || "").trim() || "PlayStudio";
  if (!token || !baseId) {
    setSyncStatus("Enter your Airtable token and base ID to connect.");
    return;
  }
  airtableConfig = { token, baseId, table };
  persistAirtableConfig();
  renderAirtableConfig();
  airtableSyncNow("connect");
}

function disconnectAirtable() {
  airtableConfig = null;
  persistAirtableConfig();
  renderAirtableConfig();
  setSyncStatus("Cloud sync disconnected. Your data stays on this device.");
}

function setSimulationStatus(message) {
  simulationStatus.textContent = message;
}

function setSaveStatus(message) {
  if (savePlayStatus) {
    savePlayStatus.textContent = message;
  }
}

function sanitizeName(value) {
  return String(value || "").trim().slice(0, 40);
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadNameOverrides() {
  try {
    const raw = window.localStorage.getItem(nameOverridesKey);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function persistNameOverrides() {
  window.localStorage.setItem(nameOverridesKey, JSON.stringify(nameOverrides));
  scheduleAirtablePush();
}

function loadPlayOverrides() {
  try {
    const raw = window.localStorage.getItem(playOverridesKey);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function persistPlayOverrides() {
  window.localStorage.setItem(playOverridesKey, JSON.stringify(playOverrides));
  scheduleAirtablePush();
}

// Every play the app knows about: the built-in install (with any edits applied in place)
// plus the user's saved plays.
function allPlays() {
  const base = playLibrary.map((play) => {
    const override = playOverrides[play.id];
    return override ? { ...override, id: play.id, custom: false, overridden: true } : play;
  });
  return base.concat(customPlays);
}

function findAnyPlay(id) {
  return allPlays().find((play) => play.id === id) || null;
}

// The name to show for a play — a user rename wins over the play's own name.
function displayName(play) {
  if (!play) {
    return "";
  }
  const override = nameOverrides[play.id];
  return override && override.trim() ? override : play.name;
}

function renamePlay(id, rawName) {
  const play = findAnyPlay(id);
  if (!play) {
    return;
  }
  const clean = sanitizeName(rawName);
  if (!clean) {
    return;
  }

  if (clean === play.name) {
    delete nameOverrides[id];
  } else {
    nameOverrides[id] = clean;
  }
  persistNameOverrides();
  renderPlaybookLibrary();
  renderPlaybooks();
}

function saveCurrentPlay() {
  const name = sanitizeName(savePlayName?.value);
  if (!name) {
    setSaveStatus("Enter a play name before saving.");
    savePlayName?.focus();
    return;
  }

  const type = savePlayType && playTypeLibrary[savePlayType.value] ? savePlayType.value : "pass";
  const snapshot = normalizeSnapshot(currentPlaySnapshot());
  const editing = editingPlayId ? findAnyPlay(editingPlayId) : null;

  if (editing && editing.custom) {
    // Editing a saved play: update it in place by id (so renames and playbook
    // references stay intact, and edits show everywhere the play appears).
    const updated = { ...snapshot, name, type, custom: true, id: editing.id };
    customPlays = customPlays.map((entry) => (entry.id === editing.id ? updated : entry));
    if (nameOverrides[editing.id]) {
      delete nameOverrides[editing.id];
      persistNameOverrides();
    }
    editingPlayId = editing.id;
    setSaveStatus(`Updated “${name}”.`);
  } else if (editing && !editing.custom) {
    // Editing a built-in play: overwrite it in place with an override keyed by its id,
    // so the edit shows everywhere (library + playbooks) with no duplicate.
    playOverrides = { ...playOverrides, [editing.id]: { ...snapshot, name, type, id: editing.id } };
    persistPlayOverrides();
    editingPlayId = editing.id;
    setSaveStatus(`Updated “${name}”.`);
  } else {
    // Fresh play (not opened for editing): upsert by name.
    const existing = customPlays.find((play) => play.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      const updated = { ...snapshot, name, type, custom: true, id: existing.id };
      customPlays = customPlays.map((entry) => (entry.id === existing.id ? updated : entry));
      editingPlayId = existing.id;
      setSaveStatus(`Updated “${name}” in your library.`);
    } else {
      const created = { ...snapshot, name, type, custom: true, id: createId("custom") };
      customPlays = [created, ...customPlays];
      editingPlayId = created.id;
      setSaveStatus(`Saved “${name}” to your library.`);
    }
  }

  persistCustomPlays();
  renderPlaybookLibrary();
  renderPlaybooks();
}

function deleteCustomPlay(id) {
  const play = customPlays.find((entry) => entry.id === id);
  const shownName = play ? displayName(play) : "";
  customPlays = customPlays.filter((entry) => entry.id !== id);
  persistCustomPlays();
  if (nameOverrides[id]) {
    delete nameOverrides[id];
    persistNameOverrides();
  }
  // Drop the play from any playbooks that referenced it.
  playbooks = playbooks.map((book) => ({ ...book, playIds: book.playIds.filter((pid) => pid !== id) }));
  persistPlaybooks();
  renderPlaybookLibrary();
  renderPlaybooks();
  if (play) {
    setSaveStatus(`Deleted “${shownName}”.`);
  }
}

function createPlaybook(name) {
  const clean = sanitizeName(name);
  if (!clean) {
    return null;
  }
  const existing = playbooks.find((book) => book.name.toLowerCase() === clean.toLowerCase());
  if (existing) {
    return existing;
  }
  const book = { id: createId("book"), name: clean, playIds: [] };
  playbooks = [book, ...playbooks];
  persistPlaybooks();
  return book;
}

function deletePlaybook(id) {
  playbooks = playbooks.filter((book) => book.id !== id);
  persistPlaybooks();
  renderPlaybooks();
  refreshFullscreenPlaybookOptions();
}

function addPlayToPlaybook(bookId, playId) {
  const book = playbooks.find((entry) => entry.id === bookId);
  if (!book || book.playIds.includes(playId)) {
    return false;
  }
  book.playIds = [...book.playIds, playId];
  persistPlaybooks();
  renderPlaybooks();
  return true;
}

function removePlayFromPlaybook(bookId, playId) {
  const book = playbooks.find((entry) => entry.id === bookId);
  if (!book) {
    return;
  }
  book.playIds = book.playIds.filter((id) => id !== playId);
  persistPlaybooks();
  renderPlaybooks();
}

function renderPlaybookSubview() {
  playbookSubnavButtons.forEach((button) => {
    const isActive = button.dataset.subview === playbookSubview;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
  subviewPanels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.subviewPanel !== playbookSubview);
  });
}

function renderPlaybooks() {
  if (!playbooksList) {
    return;
  }

  if (playbooks.length === 0) {
    playbooksList.innerHTML = '<p class="field-help">No playbooks yet. Name one above to start grouping plays.</p>';
    return;
  }

  playbooksList.innerHTML = playbooks
    .map((book) => {
      const plays = book.playIds.map(findAnyPlay).filter(Boolean);
      const playRows = plays.length === 0
        ? '<p class="field-help">No plays yet — use “Add plays”.</p>'
        : plays
            .map(
              (play) => `
                <div class="book-play" data-open-play="${escapeHtml(play.id)}" role="button" tabindex="0">
                  <span class="book-play-code">${escapeHtml(normalizeSnapshot(play).code)}</span>
                  <span class="book-play-name">${escapeHtml(displayName(play))}</span>
                  <button class="book-remove" type="button" data-remove="${escapeHtml(book.id)}:${escapeHtml(play.id)}" aria-label="Remove ${escapeHtml(displayName(play))}">✕</button>
                </div>
              `,
            )
            .join("");

      return `
        <section class="book-card" data-book="${escapeHtml(book.id)}">
          <div class="book-header">
            <div>
              <strong>${escapeHtml(book.name)}</strong>
              <div class="book-meta">${plays.length} play${plays.length === 1 ? "" : "s"}</div>
            </div>
            <div class="book-actions">
              <button class="secondary-button book-add-toggle" type="button" data-add-toggle="${escapeHtml(book.id)}">Add plays</button>
              <button class="secondary-button" type="button" data-export-book="${escapeHtml(book.id)}">Export PPTX</button>
              <button class="secondary-button book-delete" type="button" data-delete-book="${escapeHtml(book.id)}">Delete</button>
            </div>
          </div>
          <div class="book-play-list">${playRows}</div>
          <div class="book-picker is-hidden" data-picker="${escapeHtml(book.id)}"></div>
        </section>
      `;
    })
    .join("");

  bindPlaybookListEvents();

  // Keep an open "Add plays" picker open across adds so several plays can be added in a row.
  if (openPickerBookId) {
    const picker = playbooksList.querySelector(`[data-picker="${openPickerBookId}"]`);
    if (picker) {
      renderBookPicker(picker, openPickerBookId);
      picker.classList.remove("is-hidden");
    } else {
      openPickerBookId = null;
    }
  }
}

function bindPlaybookListEvents() {
  playbooksList.querySelectorAll("[data-delete-book]").forEach((button) => {
    button.addEventListener("click", () => deletePlaybook(button.dataset.deleteBook));
  });

  playbooksList.querySelectorAll("[data-export-book]").forEach((button) => {
    button.addEventListener("click", () => exportPlaybook(button.dataset.exportBook));
  });

  playbooksList.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const [bookId, playId] = button.dataset.remove.split(":");
      removePlayFromPlaybook(bookId, playId);
    });
  });

  playbooksList.querySelectorAll("[data-open-play]").forEach((row) => {
    const open = () => {
      const play = findAnyPlay(row.dataset.openPlay);
      if (play) {
        openPlayFullscreen(play);
      }
    };
    row.addEventListener("click", open);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });

  playbooksList.querySelectorAll("[data-add-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      openPickerBookId = openPickerBookId === button.dataset.addToggle ? null : button.dataset.addToggle;
      renderPlaybooks();
    });
  });
}

function renderBookPicker(picker, bookId) {
  const book = playbooks.find((entry) => entry.id === bookId);
  const available = allPlays().filter((play) => !book.playIds.includes(play.id));
  if (available.length === 0) {
    picker.innerHTML = '<p class="field-help">Every play is already in this book.</p>';
    return;
  }

  picker.innerHTML = available
    .map(
      (play) => `
        <button class="picker-row" type="button" data-add-play="${escapeHtml(bookId)}:${escapeHtml(play.id)}">
          <span class="picker-code">${escapeHtml(normalizeSnapshot(play).code)}</span>
          <span class="picker-name">${escapeHtml(displayName(play))}</span>
          <span class="picker-tag">${escapeHtml(formationLibrary[play.formation].label)}</span>
          <span class="picker-plus">＋</span>
        </button>
      `,
    )
    .join("");

  picker.querySelectorAll("[data-add-play]").forEach((button) => {
    button.addEventListener("click", () => {
      const [id, playId] = button.dataset.addPlay.split(":");
      addPlayToPlaybook(id, playId);
    });
  });
}

function exportPlaybook(bookId) {
  const book = playbooks.find((entry) => entry.id === bookId);
  if (!book) {
    return;
  }
  const plays = book.playIds.map(findAnyPlay).filter(Boolean).map((play) => normalizeSnapshot(play));
  if (plays.length === 0) {
    setSimulationStatus("Add plays to the playbook before exporting.");
    return;
  }
  exportPptx({ title: book.name, plays });
}

function playbookDimension() {
  return playbookBrowseMode === "type"
    ? { library: playTypeLibrary, key: "type" }
    : { library: formationLibrary, key: "formation" };
}

function renderPlaybookFilters() {
  const { library } = playbookDimension();
  const categories = ["all", ...Object.keys(library)];
  if (!categories.includes(playbookFilterValue)) {
    playbookFilterValue = "all";
  }

  playbookFilter.innerHTML = categories
    .map((category) => {
      const label = category === "all" ? "All Plays" : library[category].label;
      const isActive = category === playbookFilterValue;
      return `<button class="filter-chip${isActive ? " is-active" : ""}" type="button" data-filter="${category}" aria-pressed="${isActive}">${escapeHtml(label)}</button>`;
    })
    .join("");

  playbookFilter.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      playbookFilterValue = button.dataset.filter;
      renderPlaybookLibrary();
    });
  });
}

function playbookThumbnail(play) {
  const svg = createSvgElement("svg", {
    viewBox: "0 0 1000 600",
    class: "play-thumb",
    role: "img",
    "aria-label": `${displayName(play)} diagram`,
  });
  renderField(svg, normalizeSnapshot(play));
  return svg;
}

function createPlaybookCard(play, groupKey) {
  const card = document.createElement("article");
  card.className = "playbook-card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.title = `Open ${displayName(play)} full screen`;

  const thumb = document.createElement("div");
  thumb.className = "playbook-thumb-shell";
  thumb.appendChild(playbookThumbnail(play));
  card.appendChild(thumb);

  // Show only the badge for the dimension you are NOT grouping by, to keep cards short.
  const badge = groupKey === "type"
    ? `<span class="playbook-badge" data-badge="formation">${escapeHtml(formationLibrary[play.formation].label)}</span>`
    : `<span class="playbook-badge" data-badge="type">${escapeHtml(playTypeLibrary[play.type].label)}</span>`;

  const savedBadge = play.custom
    ? '<span class="playbook-badge" data-badge="saved">Saved</span>'
    : play.overridden
      ? '<span class="playbook-badge" data-badge="edited">Edited</span>'
      : "";

  const body = document.createElement("div");
  body.className = "playbook-card-body";
  body.innerHTML = `
    <div class="playbook-card-head">
      <strong>${escapeHtml(displayName(play))}</strong>
      <span class="playbook-code">${escapeHtml(normalizeSnapshot(play).code)}</span>
    </div>
    <div class="playbook-meta">
      ${badge}
      ${savedBadge}
      <span class="playbook-card-note">${escapeHtml(formatConceptSummary(play.concepts))}</span>
    </div>
  `;
  card.appendChild(body);

  const open = () => openLibraryPlay(play.id);
  card.addEventListener("click", open);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });

  return card;
}

function renderPlaybookLibrary() {
  playbookBrowseButtons.forEach((button) => {
    const isActive = button.dataset.browse === playbookBrowseMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  renderPlaybookFilters();

  const { library, key } = playbookDimension();
  const categories = Object.keys(library).filter(
    (category) => playbookFilterValue === "all" || category === playbookFilterValue,
  );

  const everyPlay = allPlays();
  playbookGroups.innerHTML = "";
  categories.forEach((category) => {
    const plays = everyPlay.filter((play) => play[key] === category);
    if (plays.length === 0) {
      return;
    }

    const group = document.createElement("section");
    group.className = "playbook-group";
    const header = document.createElement("div");
    header.className = "playbook-group-header";
    header.innerHTML = `
      <div>
        <h3>${escapeHtml(library[category].label)}</h3>
        <p>${escapeHtml(library[category].description)}</p>
      </div>
      <span class="playbook-group-count">${plays.length} play${plays.length === 1 ? "" : "s"}</span>
    `;
    group.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "playbook-card-grid";
    plays.forEach((play) => grid.appendChild(createPlaybookCard(play, key)));
    group.appendChild(grid);
    playbookGroups.appendChild(group);
  });
}

function openLibraryPlay(id) {
  const play = findAnyPlay(id);
  if (!play) {
    return;
  }
  openPlayFullscreen(play);
}

function openPlayFullscreen(play) {
  if (!playFullscreen) {
    return;
  }

  fullscreenPlay = play;
  const snapshot = normalizeSnapshot(play);
  if (pfNameInput) {
    pfNameInput.value = displayName(play);
  }
  pfCode.textContent = snapshot.code;
  pfConcepts.textContent = formatConceptSummary(snapshot.concepts);
  if (pfStatus) {
    pfStatus.textContent = "";
  }
  renderField(pfField, snapshot);

  if (pfDelete) {
    // Custom plays can be deleted; edited built-ins can be reset to the original.
    const canDelete = play.custom || play.overridden;
    pfDelete.classList.toggle("is-hidden", !canDelete);
    pfDelete.textContent = play.overridden && !play.custom ? "Reset to original" : "Delete";
  }
  refreshFullscreenPlaybookOptions();

  // A fixed, viewport-filling overlay is the reliable "full screen" across devices —
  // iOS Safari (the iPad target) does not support Element.requestFullscreen.
  playFullscreen.classList.remove("is-hidden");
  document.body.classList.add("is-fullscreen-open");
  pfClose?.focus();
}

function refreshFullscreenPlaybookOptions() {
  if (!pfAddPlaybook) {
    return;
  }
  const options = ['<option value="">Add to playbook…</option>']
    .concat(playbooks.map((book) => `<option value="${escapeHtml(book.id)}">${escapeHtml(book.name)}</option>`))
    .concat('<option value="__new__">＋ New playbook…</option>');
  pfAddPlaybook.innerHTML = options.join("");
  pfAddPlaybook.value = "";
}

function handleAddToPlaybookChange() {
  if (!pfAddPlaybook || !fullscreenPlay) {
    return;
  }
  const value = pfAddPlaybook.value;
  if (!value) {
    return;
  }

  let bookId = value;
  if (value === "__new__") {
    const name = sanitizeName(window.prompt("Name the new playbook:", ""));
    if (!name) {
      pfAddPlaybook.value = "";
      return;
    }
    const book = createPlaybook(name);
    bookId = book.id;
    refreshFullscreenPlaybookOptions();
  }

  const added = addPlayToPlaybook(bookId, fullscreenPlay.id);
  const book = playbooks.find((entry) => entry.id === bookId);
  if (pfStatus) {
    pfStatus.textContent = added
      ? `Added to ${book ? book.name : "playbook"}.`
      : `Already in ${book ? book.name : "playbook"}.`;
  }
  pfAddPlaybook.value = "";
}

function resetPlayOverride(id) {
  if (playOverrides[id]) {
    delete playOverrides[id];
    persistPlayOverrides();
  }
  renderPlaybookLibrary();
  renderPlaybooks();
}

function deleteFullscreenPlay() {
  if (!fullscreenPlay) {
    return;
  }
  const id = fullscreenPlay.id;
  if (fullscreenPlay.custom) {
    closePlayFullscreen();
    deleteCustomPlay(id);
  } else if (fullscreenPlay.overridden) {
    // Built-in with a saved edit: revert to the original install play.
    closePlayFullscreen();
    resetPlayOverride(id);
  }
}

function commitFullscreenRename() {
  if (!fullscreenPlay || !pfNameInput) {
    return;
  }
  const clean = sanitizeName(pfNameInput.value);
  if (!clean) {
    // Empty name: revert the field to the current display name, change nothing.
    pfNameInput.value = displayName(fullscreenPlay);
    return;
  }
  if (clean === displayName(fullscreenPlay)) {
    pfNameInput.value = clean;
    return;
  }
  renamePlay(fullscreenPlay.id, clean);
  pfNameInput.value = displayName(fullscreenPlay);
  if (pfStatus) {
    pfStatus.textContent = "Renamed.";
  }
}

function closePlayFullscreen() {
  if (!playFullscreen) {
    return;
  }
  fullscreenPlay = null;
  playFullscreen.classList.add("is-hidden");
  document.body.classList.remove("is-fullscreen-open");
}

function editFullscreenPlay() {
  if (!fullscreenPlay) {
    return;
  }
  const play = fullscreenPlay;
  closePlayFullscreen();
  applySnapshot(play);
  // Remember which play we're editing so Save updates it in place (and repoints
  // playbooks for a built-in) instead of creating an unrelated copy.
  editingPlayId = play.id;
  // Prefill the save form so editing an existing play saves back over it.
  const shownName = displayName(play);
  if (savePlayName) {
    savePlayName.value = shownName || "";
  }
  if (savePlayType && play.type && playTypeLibrary[play.type]) {
    savePlayType.value = play.type;
  }
  setSaveStatus(play.custom ? `Editing “${shownName}”. Save to update it.` : `Editing ${shownName}. Save to add it to your library.`);
  setActiveMode("compose");
}

function buildRouteOptions() {
  const routeOptions = Object.entries(routeTree)
    .map(([value, label]) => `<option value="${value}">${value} - ${label}</option>`)
    .join("");
  const runOption = `<option value="${runRouteValue}">${runRouteValue} - Run</option>`;
  Object.entries(routeInputs).forEach(([, select]) => {
    select.innerHTML = routeOptions + runOption;
  });
}

function buildConceptOptions() {
  Object.entries(conceptInputs).forEach(([kind, select]) => {
    select.innerHTML = Object.entries(conceptLibrary[kind])
      .map(([value, concept]) => `<option value="${value}">${escapeHtml(concept.label)}</option>`)
      .join("");
  });
}

function buildOptionCarrierOptions() {
  optionCarrierSelect.innerHTML = allPlayers
    .map((player) => `<option value="${player}">${escapeHtml(playerLabels[player] || player.toUpperCase())}</option>`)
    .join("");
  optionCarrierSelect.value = defaultOptionCarrier;
}

function buildLegend() {
  const routeCards = Object.entries(routeTree)
    .concat([[runRouteValue, "Run (ball carrier)"]])
    .map(
      ([value, label]) => `
        <article class="legend-card">
          <strong>${value}</strong>
          <span>${escapeHtml(label)}</span>
        </article>
      `,
    )
    .join("");

  const conceptSections = Object.entries(conceptLibrary)
    .map(([kind, entries]) => {
      const heading = kind.charAt(0).toUpperCase() + kind.slice(1);
      const cards = Object.entries(entries)
        .filter(([value]) => value !== "none")
        .map(
          ([, entry]) => `
            <article class="legend-card concept-card" data-kind="${kind}">
              <strong>${escapeHtml(entry.label)}</strong>
              <span>${escapeHtml(entry.description)}</span>
            </article>
          `,
        )
        .join("");

      return `
        <section class="legend-section">
          <div class="legend-header">
            <h4>${heading}</h4>
            <span class="legend-subtitle">Built-in ${heading.toLowerCase()} packages</span>
          </div>
          <div class="legend-grid">${cards}</div>
        </section>
      `;
    })
    .join("");

  routeLegend.innerHTML = `
    <section class="legend-section">
      <div class="legend-header">
        <h4>Routes</h4>
        <span class="legend-subtitle">Base digit tree</span>
      </div>
      <div class="legend-grid">${routeCards}</div>
    </section>
    ${conceptSections}
  `;
}

function sanitizeCode(value) {
  const chars = String(value).toUpperCase().replace(/[^0-9R]/g, "").slice(0, 4);
  return chars.padEnd(4, "0");
}

function getPlayCode() {
  return sanitizeCode(playCodeInput.value);
}

function syncSelectorsFromCode(code) {
  routePlayers.forEach((player, index) => {
    routeInputs[player].value = code[index];
  });
}

function syncCodeFromSelectors() {
  const code = routePlayers.map((player) => routeInputs[player].value).join("");
  playCodeInput.value = code;
  return code;
}

function setPlayCode(code, options = {}) {
  const { preserveOverrides = false, previousCode = playCodeBadge.textContent } = options;
  const lastCode = sanitizeCode(previousCode || "0000");
  const cleaned = sanitizeCode(code);
  playCodeInput.value = cleaned;
  syncSelectorsFromCode(cleaned);

  if (!preserveOverrides) {
    routePlayers.forEach((player, index) => {
      if (lastCode[index] !== cleaned[index]) {
        delete routeOverrides[player];
      }
    });
  }

  render();
}

function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(svgNs, tag);
  Object.entries(attributes).forEach(([name, value]) => {
    if (value !== null && value !== undefined) {
      element.setAttribute(name, value);
    }
  });
  return element;
}

function clearSvg(target) {
  target.innerHTML = "";
}

function appendArrowMarker(defs, id, fill) {
  const marker = createSvgElement("marker", {
    id,
    markerWidth: "10",
    markerHeight: "10",
    refX: "8",
    refY: "5",
    orient: "auto",
  });
  marker.appendChild(
    createSvgElement("path", {
      d: "M 0 0 L 10 5 L 0 10 z",
      fill,
    }),
  );
  defs.appendChild(marker);
}

function drawFieldBase(target) {
  const defs = createSvgElement("defs");
  const fieldGradient = createSvgElement("linearGradient", {
    id: "field-gradient",
    x1: "0%",
    y1: "0%",
    x2: "0%",
    y2: "100%",
  });
  fieldGradient.appendChild(
    createSvgElement("stop", {
      offset: "0%",
      "stop-color": "#2d7f4d",
    }),
  );
  fieldGradient.appendChild(
    createSvgElement("stop", {
      offset: "100%",
      "stop-color": "#1e6a3d",
    }),
  );
  defs.appendChild(fieldGradient);
  appendArrowMarker(defs, "arrowhead-route", "#ffeb7a");
  appendArrowMarker(defs, "arrowhead-run", conceptColors.run);
  appendArrowMarker(defs, "arrowhead-fake", conceptColors.fake);
  appendArrowMarker(defs, "arrowhead-option", conceptColors.option);
  target.appendChild(defs);
  target.appendChild(
    createSvgElement("rect", {
      x: 0,
      y: 0,
      width: 1000,
      height: 600,
      fill: "url(#field-gradient)",
    }),
  );

  for (let yard = 0; yard <= 10; yard += 1) {
    target.appendChild(
      createSvgElement("line", {
        x1: yard * 100,
        y1: 0,
        x2: yard * 100,
        y2: 600,
        stroke: "rgba(255,255,255,0.18)",
        "stroke-width": yard % 5 === 0 ? 4 : 2,
      }),
    );
  }

  for (let stripe = 1; stripe < 6; stripe += 1) {
    target.appendChild(
      createSvgElement("line", {
        x1: 0,
        y1: stripe * 100,
        x2: 1000,
        y2: stripe * 100,
        stroke: "rgba(255,255,255,0.12)",
        "stroke-width": 2,
      }),
    );
  }

  target.appendChild(
    createSvgElement("line", {
      x1: 0,
      y1: 410,
      x2: 1000,
      y2: 410,
      stroke: "rgba(255,255,255,0.45)",
      "stroke-width": 4,
      "stroke-dasharray": "12 10",
    }),
  );
}

function routePoints(routeNumber, start) {
  const x = start.x;
  const y = start.y;
  const short = 70;
  const medium = 120;
  const deep = 190;
  const side = 110;
  const wide = 160;
  const towardMiddle = x < 500 ? 1 : -1;
  const towardSideline = towardMiddle * -1;

  // Run: a downhill ball-carrier path forward with a slight cut toward the middle.
  if (isRunRoute(routeNumber)) {
    return [[x, y], [x, y - 55], [x + 32 * towardMiddle, y - 165]];
  }

  switch (Number(routeNumber)) {
    case 0:
      return [[x, y], [x, y - 30], [x + 55 * towardMiddle, y - 30]];
    case 1:
      return [[x, y], [x, y - short], [x + side * towardSideline, y - short]];
    case 2:
      return [[x, y], [x + side * towardMiddle, y - medium]];
    case 3:
      return [[x, y], [x, y - deep], [x + 50 * towardSideline, y - deep + 18]];
    case 4:
      return [[x, y], [x, y - medium], [x, y - medium + 26]];
    case 5:
      return [[x, y], [x, y - deep], [x + wide * towardSideline, y - deep]];
    case 6:
      return [[x, y], [x, y - medium], [x + wide * towardMiddle, y - medium]];
    case 7:
      return [[x, y], [x, y - deep + 20], [x + wide * towardSideline, y - deep - 35]];
    case 8:
      return [[x, y], [x, y - short], [x + 55 * towardMiddle, y - medium]];
    case 9:
      return [[x, y], [x, y - 250]];
    default:
      return [[x, y], [x, y - medium]];
  }
}

function routeCodeForPlayer(snapshot, player) {
  return snapshot.code[routePlayers.indexOf(player)];
}

function conceptValue(snapshot, kind) {
  return normalizeConcepts(snapshot.concepts)[kind];
}

function optionCarrierValue(snapshot) {
  return normalizeOptionCarrier(snapshot.optionCarrier);
}

// The player who first gets the ball on the play — the "first touch" to star-flag.
function firstTouchPlayer(snapshot, alignment) {
  if (conceptValue(snapshot, "option") !== "none") {
    return optionCarrierValue(snapshot);
  }
  const run = conceptValue(snapshot, "run");
  if (run === "c-dive") {
    return "c";
  }
  if (run === "reverse") {
    return rightEdgePlayer(alignment);
  }
  // QB draw, jet motion, and every pass/plain call: the QB takes the snap first.
  return "q";
}

function getRoutePoints(snapshot, player) {
  const alignment = getSnapshotAlignment(snapshot);
  const defaults = routePoints(routeCodeForPlayer(snapshot, player), alignment[player]);
  const overrides = snapshot.routeOverrides?.[player];

  if (!Array.isArray(overrides) || overrides.length === 0) {
    return defaults;
  }

  return defaults.map((point, index) => {
    if (index === 0) {
      return [point[0], point[1]];
    }

    const override = overrides[index - 1];
    if (!Array.isArray(override) || override.length < 2) {
      return [point[0], point[1]];
    }

    const x = Number(override[0]);
    const y = Number(override[1]);
    return [
      clamp(Number.isFinite(x) ? x : point[0], 0, fieldWidth),
      clamp(Number.isFinite(y) ? y : point[1], 0, fieldHeight),
    ];
  });
}

function buildPath(points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`).join(" ");
}

function polylineLength(points) {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += distance(points[index - 1], points[index]);
  }
  return length;
}

function samplePolyline(points, progress) {
  if (progress <= 0) {
    return { x: points[0][0], y: points[0][1] };
  }
  if (progress >= 1) {
    const end = points[points.length - 1];
    return { x: end[0], y: end[1] };
  }

  const totalLength = polylineLength(points);
  let remaining = totalLength * progress;
  for (let index = 1; index < points.length; index += 1) {
    const from = { x: points[index - 1][0], y: points[index - 1][1] };
    const to = { x: points[index][0], y: points[index][1] };
    const segmentLength = distance(from, to);
    if (remaining <= segmentLength) {
      const segmentProgress = segmentLength === 0 ? 0 : remaining / segmentLength;
      return {
        x: from.x + (to.x - from.x) * segmentProgress,
        y: from.y + (to.y - from.y) * segmentProgress,
      };
    }
    remaining -= segmentLength;
  }

  const end = points[points.length - 1];
  return { x: end[0], y: end[1] };
}

function leftEdgePlayer(alignment) {
  return routePlayers.reduce((left, player) => (alignment[player].x < alignment[left].x ? player : left), routePlayers[0]);
}

function rightEdgePlayer(alignment) {
  return routePlayers.reduce((right, player) => (alignment[player].x > alignment[right].x ? player : right), routePlayers[0]);
}

function getPreSnapMotionPath(snapshot) {
  if (snapshot.formation !== "pro" || normalizeProMotion(snapshot.proMotion) === "stay") {
    return null;
  }

  const { start, destination } = getProBackfieldLayout(snapshot.proMotion);
  return [
    [start.x, start.y],
    [destination.x, destination.y],
  ];
}

function getOffensePositions(snapshot, progress) {
  const alignment = getSnapshotAlignment(snapshot);
  const positions = {};
  const routeDelay = { x: 0, y: 0.03, z: 0.06, c: 0.12 };

  routePlayers.forEach((player) => {
    const adjusted = clamp((progress - routeDelay[player]) / (1 - routeDelay[player]), 0, 1);
    const eased = 1 - (1 - adjusted) * (1 - adjusted);
    const points = getRoutePoints(snapshot, player);
    positions[player] = samplePolyline(points, eased);
  });

  positions.q = {
    x: alignment.q.x,
    y: alignment.q.y - Math.min(48, progress * 70),
  };

  return positions;
}

function drawRoutes(target, snapshot) {
  const alignment = getSnapshotAlignment(snapshot);
  const preSnapMotion = getPreSnapMotionPath(snapshot);

  if (preSnapMotion) {
    drawStyledPath(target, preSnapMotion, {
      stroke: playerColors.z,
      width: 5,
      dasharray: "16 10",
      opacity: 0.7,
    });
  }

  routePlayers.forEach((player) => {
    const points = getRoutePoints(snapshot, player);

    if (isRunRoute(routeCodeForPlayer(snapshot, player))) {
      // Handoff / pitch line from the QB to the ball carrier, then the run path in green.
      drawStyledPath(target, [[alignment.q.x, alignment.q.y], [points[0][0], points[0][1]]], {
        stroke: "rgba(255,255,255,0.75)",
        width: 3,
        dasharray: "10 8",
      });
      drawStyledPath(target, points, { stroke: conceptColors.run, width: 12, opacity: 0.18 });
      drawStyledPath(target, points, { stroke: conceptColors.run, width: 7, marker: "arrowhead-run" });
      return;
    }

    target.appendChild(
      createSvgElement("path", {
        d: buildPath(points),
        fill: "none",
        stroke: "#ffeb7a",
        "stroke-width": 11,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-opacity": "0.15",
      }),
    );
    target.appendChild(
      createSvgElement("path", {
        d: buildPath(points),
        fill: "none",
        stroke: "#ffeb7a",
        "stroke-width": 6,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "marker-end": "url(#arrowhead-route)",
      }),
    );
  });

  target.appendChild(
    createSvgElement("path", {
      d: `M ${alignment.c.x} ${alignment.c.y + 6} L ${alignment.q.x} ${alignment.q.y - 18}`,
      fill: "none",
      stroke: "rgba(255,255,255,0.7)",
      "stroke-width": 3,
      "stroke-dasharray": "10 8",
    }),
  );

  target.appendChild(
    createSvgElement("path", {
      d: `M ${alignment.q.x} ${alignment.q.y} L ${alignment.q.x} ${alignment.q.y - 48}`,
      fill: "none",
      stroke: "rgba(255,255,255,0.65)",
      "stroke-width": 3,
      "stroke-dasharray": "10 8",
    }),
  );
}

function drawStyledPath(target, points, style) {
  target.appendChild(
    createSvgElement("path", {
      d: buildPath(points),
      fill: "none",
      stroke: style.stroke,
      "stroke-width": style.width || 5,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-dasharray": style.dasharray || null,
      "stroke-opacity": style.opacity || null,
      "marker-end": style.marker ? `url(#${style.marker})` : null,
    }),
  );
}

function drawDecisionNode(target, x, y, color) {
  target.appendChild(
    createSvgElement("circle", {
      cx: x,
      cy: y,
      r: 10,
      fill: "#fff7eb",
      stroke: color,
      "stroke-width": 4,
    }),
  );
}

function drawStar(target, cx, cy, radius, color) {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? radius : radius * 0.42;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  target.appendChild(
    createSvgElement("polygon", {
      points: points.join(" "),
      fill: color,
      stroke: "#1b2431",
      "stroke-width": 2,
      "stroke-linejoin": "round",
    }),
  );
}

function drawConcepts(target, snapshot) {
  const alignment = getSnapshotAlignment(snapshot);
  const q = alignment.q;
  const c = alignment.c;
  const leftPlayer = leftEdgePlayer(alignment);
  const rightPlayer = rightEdgePlayer(alignment);
  const leftPoint = alignment[leftPlayer];
  const rightPoint = alignment[rightPlayer];

  switch (conceptValue(snapshot, "run")) {
    case "qb-draw":
      drawStyledPath(target, [[q.x, q.y], [q.x, q.y - 56], [q.x, q.y - 180]], {
        stroke: conceptColors.run,
        width: 6,
        marker: "arrowhead-run",
      });
      break;
    case "c-dive":
      drawStyledPath(target, [[q.x, q.y], [c.x, c.y + 16], [c.x, c.y - 60], [c.x, c.y - 170]], {
        stroke: conceptColors.run,
        width: 6,
        marker: "arrowhead-run",
      });
      break;
    case "jet-left":
      drawStyledPath(target, [[q.x, q.y], [q.x - 70, q.y - 40], [q.x - 180, q.y - 110], [q.x - 280, q.y - 150]], {
        stroke: conceptColors.run,
        width: 6,
        marker: "arrowhead-run",
      });
      break;
    case "jet-right":
      drawStyledPath(target, [[q.x, q.y], [q.x + 70, q.y - 40], [q.x + 180, q.y - 110], [q.x + 280, q.y - 150]], {
        stroke: conceptColors.run,
        width: 6,
        marker: "arrowhead-run",
      });
      break;
    case "reverse":
      drawStyledPath(target, [[rightPoint.x, rightPoint.y], [q.x + 70, q.y - 12], [q.x - 120, q.y - 78], [q.x - 280, q.y - 128]], {
        stroke: conceptColors.run,
        width: 6,
        marker: "arrowhead-run",
      });
      break;
    default:
      break;
  }

  switch (conceptValue(snapshot, "fake")) {
    case "play-action":
      drawStyledPath(target, [[q.x, q.y], [c.x, c.y + 10], [c.x, c.y - 60]], {
        stroke: conceptColors.fake,
        width: 4,
        dasharray: "12 10",
        marker: "arrowhead-fake",
      });
      break;
    case "jet-fake-left":
      drawStyledPath(target, [[rightPoint.x, rightPoint.y], [q.x + 20, q.y - 4], [q.x - 130, q.y - 22], [q.x - 250, q.y - 84]], {
        stroke: conceptColors.fake,
        width: 4,
        dasharray: "12 10",
        marker: "arrowhead-fake",
      });
      break;
    case "jet-fake-right":
      drawStyledPath(target, [[leftPoint.x, leftPoint.y], [q.x - 20, q.y - 4], [q.x + 130, q.y - 22], [q.x + 250, q.y - 84]], {
        stroke: conceptColors.fake,
        width: 4,
        dasharray: "12 10",
        marker: "arrowhead-fake",
      });
      break;
    case "reverse-fake":
      drawStyledPath(target, [[leftPoint.x, leftPoint.y], [q.x - 40, q.y - 10], [q.x + 110, q.y - 76], [q.x + 250, q.y - 128]], {
        stroke: conceptColors.fake,
        width: 4,
        dasharray: "12 10",
        marker: "arrowhead-fake",
      });
      break;
    default:
      break;
  }

  const optionCarrier = optionCarrierValue(snapshot);
  const o = alignment[optionCarrier] || q;
  // The give/pitch teammate should never be the carrier themselves; fall back to the QB spot.
  const giveMate = (playerKey) => (playerKey === optionCarrier ? q : alignment[playerKey] || q);
  const gc = giveMate("c");
  const gl = giveMate(leftPlayer);
  const gr = giveMate(rightPlayer);

  // When someone other than the QB carries the option, show the snap/handoff that gets them the ball first.
  if (conceptValue(snapshot, "option") !== "none" && optionCarrier !== "q") {
    drawStyledPath(target, [[q.x, q.y], [o.x, o.y]], {
      stroke: conceptColors.option,
      width: 4,
      dasharray: "6 8",
      marker: "arrowhead-option",
    });
  }

  // Star-flag the first touch — the player who first gets the ball on every play.
  // Offset to the top-right shoulder so it clears the player circle (drawn later).
  // Green flags a pass (the first touch throws it); gold otherwise (keep/run/pitch).
  const firstTouch = alignment[firstTouchPlayer(snapshot, alignment)] || q;
  const starColor = normalizePlayType(snapshot.type) === "pass" ? conceptColors.run : "#ffd23f";
  drawStar(target, firstTouch.x + 34, firstTouch.y - 34, 14, starColor);

  switch (conceptValue(snapshot, "option")) {
    case "read-left": {
      const mesh = [o.x, o.y - 52];
      drawStyledPath(target, [[o.x, o.y], mesh], {
        stroke: conceptColors.option,
        width: 5,
      });
      drawStyledPath(target, [mesh, [o.x - 110, o.y - 130]], {
        stroke: conceptColors.option,
        width: 5,
        marker: "arrowhead-option",
      });
      drawStyledPath(target, [mesh, [gc.x - 24, gc.y - 126]], {
        stroke: conceptColors.option,
        width: 4,
        dasharray: "10 8",
        marker: "arrowhead-option",
      });
      drawDecisionNode(target, mesh[0], mesh[1], conceptColors.option);
      break;
    }
    case "read-right": {
      const mesh = [o.x, o.y - 52];
      drawStyledPath(target, [[o.x, o.y], mesh], {
        stroke: conceptColors.option,
        width: 5,
      });
      drawStyledPath(target, [mesh, [o.x + 110, o.y - 130]], {
        stroke: conceptColors.option,
        width: 5,
        marker: "arrowhead-option",
      });
      drawStyledPath(target, [mesh, [gc.x + 24, gc.y - 126]], {
        stroke: conceptColors.option,
        width: 4,
        dasharray: "10 8",
        marker: "arrowhead-option",
      });
      drawDecisionNode(target, mesh[0], mesh[1], conceptColors.option);
      break;
    }
    case "speed-left": {
      const pitch = [o.x - 50, o.y - 62];
      drawStyledPath(target, [[o.x, o.y], pitch, [o.x - 150, o.y - 126]], {
        stroke: conceptColors.option,
        width: 5,
        marker: "arrowhead-option",
      });
      drawStyledPath(target, [pitch, [gl.x + 28, gl.y - 68]], {
        stroke: conceptColors.option,
        width: 4,
        dasharray: "10 8",
        marker: "arrowhead-option",
      });
      drawDecisionNode(target, pitch[0], pitch[1], conceptColors.option);
      break;
    }
    case "speed-right": {
      const pitch = [o.x + 50, o.y - 62];
      drawStyledPath(target, [[o.x, o.y], pitch, [o.x + 150, o.y - 126]], {
        stroke: conceptColors.option,
        width: 5,
        marker: "arrowhead-option",
      });
      drawStyledPath(target, [pitch, [gr.x - 28, gr.y - 68]], {
        stroke: conceptColors.option,
        width: 4,
        dasharray: "10 8",
        marker: "arrowhead-option",
      });
      drawDecisionNode(target, pitch[0], pitch[1], conceptColors.option);
      break;
    }
    case "rpo-bubble": {
      const mesh = [o.x, o.y - 46];
      drawStyledPath(target, [[o.x, o.y], mesh, [gc.x, gc.y - 140]], {
        stroke: conceptColors.option,
        width: 5,
        marker: "arrowhead-option",
      });
      drawStyledPath(target, [[rightPoint.x, rightPoint.y], [rightPoint.x + 40, rightPoint.y - 14], [rightPoint.x + 74, rightPoint.y + 4]], {
        stroke: conceptColors.option,
        width: 4,
        dasharray: "10 8",
        marker: "arrowhead-option",
      });
      drawDecisionNode(target, mesh[0], mesh[1], conceptColors.option);
      break;
    }
    default:
      break;
  }
}

function drawRouteHandles(target, snapshot) {
  routePlayers.forEach((player) => {
    const points = getRoutePoints(snapshot, player);
    points.slice(1).forEach((point, index) => {
      target.appendChild(
        createSvgElement("circle", {
          cx: point[0],
          cy: point[1],
          r: 15,
          fill: "rgba(255,247,235,0.98)",
          stroke: playerColors[player],
          "stroke-width": 5,
          "data-route-player": player,
          "data-route-point-index": String(index + 1),
          cursor: "grab",
        }),
      );
      target.appendChild(
        createSvgElement("circle", {
          cx: point[0],
          cy: point[1],
          r: 5,
          fill: playerColors[player],
          "pointer-events": "none",
        }),
      );
    });
  });
}

function drawPlayers(target, snapshot, positions, interactive = false) {
  const alignment = getSnapshotAlignment(snapshot);
  const routeMap = { x: snapshot.code[0], y: snapshot.code[1], z: snapshot.code[2], c: snapshot.code[3], q: "QB" };
  const currentPositions = positions || alignment;
  const ballCarrier = firstTouchPlayer(snapshot, alignment);
  const carrierColor = normalizePlayType(snapshot.type) === "pass" ? conceptColors.run : "#ffd23f";

  Object.entries(currentPositions).forEach(([player, position]) => {
    // Highlight the player running with the ball with a colored ring behind their marker.
    if (player === ballCarrier) {
      target.appendChild(
        createSvgElement("circle", {
          cx: position.x,
          cy: position.y,
          r: (player === "q" ? 30 : 28) + 9,
          fill: "none",
          stroke: carrierColor,
          "stroke-width": 6,
          "pointer-events": "none",
        }),
      );
    }

    const circleAttrs = {
      cx: position.x,
      cy: position.y,
      r: player === "q" ? 30 : 28,
      fill: playerColors[player],
      stroke: "rgba(255,255,255,0.9)",
      "stroke-width": 5,
    };
    if (interactive) {
      circleAttrs["data-player-move"] = player;
      circleAttrs.cursor = "grab";
    }
    target.appendChild(createSvgElement("circle", circleAttrs));

    const label = createSvgElement("text", {
      x: position.x,
      y: position.y + 8,
      "text-anchor": "middle",
      "font-family": "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif",
      "font-size": player === "q" ? "34" : "32",
      "letter-spacing": "0.06em",
      fill: "#ffffff",
      "pointer-events": "none",
    });
    label.textContent = player.toUpperCase();
    target.appendChild(label);

    // Place the route tag below the player by default, but flip it above when another
    // player sits directly beneath (the C/Q/Z stack on the center line) so labels don't collide.
    const above = position.y - 42;
    const below = position.y + 62;
    let tagY = below;
    if (player === "q") {
      tagY = snapshot.formation === "pro" && Math.abs(alignment.z.x - alignment.q.x) < 40 ? above : below;
    } else if (player === "c" && Math.abs(alignment.c.x - alignment.q.x) < 46) {
      tagY = above;
    }

    const tag = createSvgElement("text", {
      x: position.x,
      y: tagY,
      "text-anchor": "middle",
      "font-family": "Avenir Next, Trebuchet MS, sans-serif",
      "font-size": "24",
      "font-weight": "700",
      fill: "#fff7eb",
      "pointer-events": "none",
    });
    tag.textContent = player === "q" ? "snap / drop" : routeTagText(routeMap[player]);
    target.appendChild(tag);
  });
}

function drawDefense(target, defense, offensePositions, progress) {
  const defenders = getDefensePositions(defense, offensePositions, progress);
  defenders.forEach((defender) => {
    target.appendChild(
      createSvgElement("circle", {
        cx: defender.position.x,
        cy: defender.position.y,
        r: 25,
        fill: defenseColors[defense],
        stroke: "rgba(19,42,30,0.82)",
        "stroke-width": 5,
      }),
    );
    const label = createSvgElement("text", {
      x: defender.position.x,
      y: defender.position.y + 7,
      "text-anchor": "middle",
      "font-family": "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif",
      "font-size": "23",
      fill: "#132a1e",
    });
    label.textContent = defender.label;
    target.appendChild(label);
  });
}

function renderField(target, snapshot, simulation = null) {
  const viewport = target === fieldSvg ? fieldViewport : createDefaultViewport();
  target.setAttribute("viewBox", formatViewBox(viewport));
  clearSvg(target);
  drawFieldBase(target);
  drawRoutes(target, snapshot);
  drawConcepts(target, snapshot);

  if (simulation) {
    const offensePositions = getOffensePositions(snapshot, simulation.progress);
    drawDefense(target, simulation.defense, offensePositions, simulation.progress);
    drawPlayers(target, snapshot, offensePositions);
    return;
  }

  const interactive = target === fieldSvg && activeMode === "compose";
  drawPlayers(target, snapshot, undefined, interactive);
  if (interactive) {
    drawRouteHandles(target, snapshot);
  }
}

function getDefensePositions(defense, offensePositions, progress) {
  const qb = offensePositions.q;
  const definitions = {
    cover2: [
      { label: "F1", anchor: { x: 240, y: 330 }, zone: { minX: 0, maxX: 360, minY: 260, maxY: 600 } },
      { label: "M", anchor: { x: 500, y: 315 }, zone: { minX: 280, maxX: 720, minY: 200, maxY: 460 } },
      { label: "F2", anchor: { x: 760, y: 330 }, zone: { minX: 640, maxX: 1000, minY: 260, maxY: 600 } },
      { label: "S1", anchor: { x: 300, y: 210 }, zone: { minX: 0, maxX: 500, minY: 0, maxY: 320 } },
      { label: "S2", anchor: { x: 700, y: 210 }, zone: { minX: 500, maxX: 1000, minY: 0, maxY: 320 } },
    ],
    cover3: [
      { label: "D1", anchor: { x: 210, y: 215 }, zone: { minX: 0, maxX: 333, minY: 0, maxY: 320 } },
      { label: "D2", anchor: { x: 500, y: 195 }, zone: { minX: 250, maxX: 750, minY: 0, maxY: 300 } },
      { label: "D3", anchor: { x: 790, y: 215 }, zone: { minX: 667, maxX: 1000, minY: 0, maxY: 320 } },
      { label: "U1", anchor: { x: 360, y: 320 }, zone: { minX: 0, maxX: 500, minY: 220, maxY: 520 } },
      { label: "U2", anchor: { x: 640, y: 320 }, zone: { minX: 500, maxX: 1000, minY: 220, maxY: 520 } },
    ],
    cover4: [
      { label: "Q1", anchor: { x: 160, y: 215 }, zone: { minX: 0, maxX: 250, minY: 0, maxY: 320 } },
      { label: "Q2", anchor: { x: 390, y: 215 }, zone: { minX: 250, maxX: 500, minY: 0, maxY: 320 } },
      { label: "Q3", anchor: { x: 610, y: 215 }, zone: { minX: 500, maxX: 750, minY: 0, maxY: 320 } },
      { label: "Q4", anchor: { x: 840, y: 215 }, zone: { minX: 750, maxX: 1000, minY: 0, maxY: 320 } },
      { label: "R", anchor: { x: 500, y: 315 }, zone: { minX: 260, maxX: 740, minY: 200, maxY: 520 } },
    ],
    man: [
      { label: "MX", mark: "x", leverage: { x: 10, y: -55 } },
      { label: "MY", mark: "y", leverage: { x: -10, y: -55 } },
      { label: "MZ", mark: "z", leverage: { x: 0, y: -55 } },
      { label: "MC", mark: "c", leverage: { x: 0, y: -45 } },
      { label: "SPY", mark: "q", leverage: { x: 0, y: -85 } },
    ],
  };

  if (defense === "man") {
    return definitions.man.map((defender) => ({
      label: defender.label,
      position: {
        x: offensePositions[defender.mark].x + defender.leverage.x,
        y: offensePositions[defender.mark].y + defender.leverage.y + progress * 18,
      },
    }));
  }

  return definitions[defense].map((defender) => {
    const threats = Object.values(offensePositions).filter(
      (player) =>
        player.x >= defender.zone.minX &&
        player.x <= defender.zone.maxX &&
        player.y >= defender.zone.minY &&
        player.y <= defender.zone.maxY,
    );

    const target = threats.length === 0
      ? defender.anchor
      : threats.reduce(
          (best, player) => (distance(player, defender.anchor) < distance(best, defender.anchor) ? player : best),
          threats[0],
        );

    const blend = 0.25 + progress * 0.55;
    const chaseBias = target === defender.anchor ? 1 : 0.78;
    return {
      label: defender.label,
      position: {
        x: defender.anchor.x + (target.x - defender.anchor.x) * blend * chaseBias,
        y: defender.anchor.y + (target.y - defender.anchor.y) * blend * chaseBias,
      },
    };
  });
}

function totalConceptBonus(snapshot, defense) {
  const concepts = normalizeConcepts(snapshot.concepts);
  return Object.entries(concepts).reduce((sum, [kind, value]) => {
    if (value === "none") {
      return sum;
    }
    return sum + (conceptBonuses[kind][value]?.[defense] || 0);
  }, 0);
}

function simulateDefense(snapshot, defense) {
  const bestByPlayer = {};
  const samples = [];

  for (let step = 0; step <= 20; step += 1) {
    const progress = step / 20;
    const offensePositions = getOffensePositions(snapshot, progress);
    const defenders = getDefensePositions(defense, offensePositions, progress);

    routePlayers.forEach((player) => {
      const minDistance = Math.min(
        ...defenders.map((defender) => distance(defender.position, offensePositions[player])),
      );
      if (!bestByPlayer[player] || minDistance > bestByPlayer[player].distance) {
        bestByPlayer[player] = { distance: minDistance, progress };
      }
      samples.push({ player, minDistance, progress });
    });
  }

  const ranked = routePlayers
    .map((player, index) => {
      const routeChar = snapshot.code[index];
      const base = bestByPlayer[player].distance;
      const bonus = schemeBonuses[defense][Number(routeChar)] || 0;
      return {
        player,
        routeChar,
        distance: base,
        score: Math.round(base * 0.65 + bonus),
      };
    })
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const conceptBonus = totalConceptBonus(snapshot, defense);
  const totalScore = clamp(
    Math.round(ranked.reduce((sum, item) => sum + item.score, 0) / ranked.length + conceptBonus),
    20,
    99,
  );
  const conceptText = formatConceptSummary(snapshot.concepts);

  return {
    defense,
    label: defenseLabels[defense],
    score: totalScore,
    bestPlayer: best.player,
    bestRoute: routeLabel(best.routeChar),
    weakestPlayer: worst.player,
    summary: `${best.player.toUpperCase()} on the ${routeLabel(best.routeChar).toLowerCase()} gives the cleanest window. ${conceptText}.`,
    detail: `${defenseDescriptions[defense]} The tightest problem is ${worst.player.toUpperCase()}, where leverage closes fastest. Concept boost: +${conceptBonus}.`,
  };
}

function renderDefenseReports() {
  const snapshot = currentPlaySnapshot();
  const defenses = ["cover2", "cover3", "cover4", "man"];
  const reports = defenses.map((defense) => simulateDefense(snapshot, defense));
  const activeDefense = activeSimulation ? activeSimulation.defense : defenseSelect.value;

  defenseReportGrid.innerHTML = reports
    .map(
      (report) => `
        <article class="report-card ${report.defense === activeDefense ? "is-active" : ""}">
          <strong>${report.label}</strong>
          <span class="report-score">${report.score}/100</span>
          <p>${escapeHtml(report.summary)}</p>
          <p>${escapeHtml(report.detail)}</p>
        </article>
      `,
    )
    .join("");
}

function stopSimulation() {
  if (simulationFrameId) {
    window.cancelAnimationFrame(simulationFrameId);
    simulationFrameId = 0;
  }
  activeSimulation = null;
  render();
  setSimulationStatus("Simulation stopped.");
}

function stepSimulation(timestamp) {
  if (!activeSimulation) {
    return;
  }

  if (!animationStart) {
    animationStart = timestamp;
  }

  const elapsed = timestamp - animationStart;
  const progress = Math.min(1, elapsed / 3600);
  activeSimulation.progress = progress;
  render();

  if (progress < 1) {
    simulationFrameId = window.requestAnimationFrame(stepSimulation);
    return;
  }

  simulationFrameId = 0;
  const report = simulateDefense(currentPlaySnapshot(), activeSimulation.defense);
  activeSimulation.report = report;
  setSimulationStatus(`${report.label}: ${report.summary}`);
}

function startSimulation() {
  stopSimulationSilently();
  animationStart = 0;
  activeSimulation = {
    defense: defenseSelect.value,
    progress: 0,
  };
  setSimulationStatus(`Running ${defenseLabels[activeSimulation.defense]} simulation...`);
  render();
  simulationFrameId = window.requestAnimationFrame(stepSimulation);
}

function stopSimulationSilently() {
  if (simulationFrameId) {
    window.cancelAnimationFrame(simulationFrameId);
    simulationFrameId = 0;
  }
  activeSimulation = null;
}

function render() {
  const snapshot = currentPlaySnapshot();
  playCodeInput.value = snapshot.code;
  playCodeBadge.textContent = snapshot.code;
  currentPlayTitle.textContent = formatPlayTitle(snapshot);
  currentPlayConcepts.innerHTML = activeConceptEntries(snapshot.concepts)
    .map(
      (entry) => `<span class="concept-pill" data-kind="${entry.kind}">${escapeHtml(entry.shortLabel)}</span>`,
    )
    .join("");
  if (currentPlayConcepts.innerHTML === "") {
    currentPlayConcepts.innerHTML = '<span class="concept-pill">Base route concept</span>';
  }
  renderActiveMode();
  updateFormationControls();
  updateBunchToggleUI();
  updateProMotionUI();
  renderField(fieldSvg, snapshot, activeSimulation);
  renderDefenseReports();
}

function svgPointFromEvent(target, event) {
  const point = target.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = target.getScreenCTM();
  if (!matrix) {
    return null;
  }
  return point.matrixTransform(matrix.inverse());
}

function updateDraggedRoute(event) {
  if (!activeRouteDrag || event.pointerId !== activeRouteDrag.pointerId) {
    return;
  }

  const svgPoint = svgPointFromEvent(fieldSvg, event);
  if (!svgPoint) {
    return;
  }

  const snapshot = currentPlaySnapshot();
  const points = getRoutePoints(snapshot, activeRouteDrag.player);
  points[activeRouteDrag.pointIndex] = [
    clamp(svgPoint.x, 0, fieldWidth),
    clamp(svgPoint.y, 0, fieldHeight),
  ];
  setRouteOverride(activeRouteDrag.player, points);
  render();
}

function releaseRouteDrag(pointerId) {
  if (!activeRouteDrag || (pointerId !== undefined && activeRouteDrag.pointerId !== pointerId)) {
    return;
  }

  if (typeof fieldSvg.hasPointerCapture === "function" && fieldSvg.hasPointerCapture(activeRouteDrag.pointerId)) {
    fieldSvg.releasePointerCapture(activeRouteDrag.pointerId);
  }
  activeRouteDrag = null;
}

function updateDraggedPlayer(event) {
  if (!activePlayerDrag || event.pointerId !== activePlayerDrag.pointerId) {
    return;
  }

  const svgPoint = svgPointFromEvent(fieldSvg, event);
  if (!svgPoint) {
    return;
  }

  const nextX = clamp(activePlayerDrag.playerStart.x + (svgPoint.x - activePlayerDrag.pointerStart.x), 0, fieldWidth);
  const nextY = clamp(activePlayerDrag.playerStart.y + (svgPoint.y - activePlayerDrag.pointerStart.y), 0, fieldHeight);
  setAlignmentOverride(activePlayerDrag.player, { x: nextX, y: nextY });

  // Translate any custom route arrows by the same delta so the whole route follows the player.
  if (activePlayerDrag.routeStart) {
    const deltaX = nextX - activePlayerDrag.playerStart.x;
    const deltaY = nextY - activePlayerDrag.playerStart.y;
    routeOverrides = {
      ...routeOverrides,
      [activePlayerDrag.player]: activePlayerDrag.routeStart.map((point) => [
        clamp(point[0] + deltaX, 0, fieldWidth),
        clamp(point[1] + deltaY, 0, fieldHeight),
      ]),
    };
  }

  render();
}

function releasePlayerDrag(pointerId) {
  if (!activePlayerDrag || (pointerId !== undefined && activePlayerDrag.pointerId !== pointerId)) {
    return;
  }

  if (typeof fieldSvg.hasPointerCapture === "function" && fieldSvg.hasPointerCapture(activePlayerDrag.pointerId)) {
    fieldSvg.releasePointerCapture(activePlayerDrag.pointerId);
  }
  activePlayerDrag = null;
}

function handleFieldPointerDown(event) {
  if (activeMode !== "compose") {
    return;
  }

  if (typeof event.target.closest !== "function") {
    return;
  }

  const handle = event.target.closest("[data-route-player]");
  if (handle) {
    event.preventDefault();
    stopSimulationSilently();
    activeRouteDrag = {
      pointerId: event.pointerId,
      player: handle.getAttribute("data-route-player"),
      pointIndex: Number(handle.getAttribute("data-route-point-index")),
    };
    fieldSvg.setPointerCapture(event.pointerId);
    updateDraggedRoute(event);
    return;
  }

  const playerHandle = event.target.closest("[data-player-move]");
  if (playerHandle) {
    event.preventDefault();
    stopSimulationSilently();
    const player = playerHandle.getAttribute("data-player-move");
    const svgPoint = svgPointFromEvent(fieldSvg, event);
    const alignment = getSnapshotAlignment(currentPlaySnapshot());
    const routeOverride = routeOverrides[player];
    activePlayerDrag = {
      pointerId: event.pointerId,
      player,
      pointerStart: { x: svgPoint.x, y: svgPoint.y },
      playerStart: { x: alignment[player].x, y: alignment[player].y },
      routeStart: Array.isArray(routeOverride) ? routeOverride.map((point) => [point[0], point[1]]) : null,
    };
    fieldSvg.setPointerCapture(event.pointerId);
  }
}

function handleFieldPointerMove(event) {
  updateDraggedRoute(event);
  updateDraggedPlayer(event);
}

function handleFieldPointerUp(event) {
  const wasDragging =
    (activeRouteDrag && activeRouteDrag.pointerId === event.pointerId) ||
    (activePlayerDrag && activePlayerDrag.pointerId === event.pointerId);
  if (!wasDragging) {
    return;
  }

  releaseRouteDrag(event.pointerId);
  releasePlayerDrag(event.pointerId);
  render();
}

function bindEvents() {
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveMode(button.dataset.mode);
    });
  });

  playbookBrowseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      playbookBrowseMode = button.dataset.browse === "type" ? "type" : "formation";
      playbookFilterValue = "all";
      renderPlaybookLibrary();
    });
  });

  formationSelect.addEventListener("change", () => {
    stopSimulationSilently();
    clearRouteOverrides();
    clearAlignmentOverrides();
    render();
  });

  playCodeInput.addEventListener("input", () => {
    stopSimulationSilently();
    setPlayCode(playCodeInput.value);
  });

  Object.entries(routeInputs).forEach(([, select]) => {
    select.addEventListener("change", () => {
      stopSimulationSilently();
      setPlayCode(syncCodeFromSelectors());
    });
  });

  Object.entries(conceptInputs).forEach(([, select]) => {
    select.addEventListener("change", () => {
      stopSimulationSilently();
      render();
    });
  });

  optionCarrierSelect.addEventListener("change", () => {
    stopSimulationSilently();
    render();
  });

  if (savePlayType) {
    savePlayType.addEventListener("change", () => {
      render();
    });
  }

  randomPlayButton.addEventListener("click", () => {
    stopSimulationSilently();
    clearRouteOverrides();
    clearAlignmentOverrides();
    editingPlayId = null;
    const code = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join("");
    setPlayCode(code);
  });

  bunchSideButtons.forEach((button) => {
    button.addEventListener("click", () => {
      bunchSide = normalizeBunchSide(button.dataset.bunchSide);
      stopSimulationSilently();
      clearRouteOverrides();
      clearAlignmentOverrides();
      render();
    });
  });

  proMotionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      proMotion = normalizeProMotion(button.dataset.proMotion);
      stopSimulationSilently();
      clearRouteOverrides(["z"]);
      clearAlignmentOverrides(["z"]);
      render();
    });
  });

  document.querySelectorAll(".quick-play").forEach((button) => {
    button.addEventListener("click", () => {
      formationSelect.value = button.dataset.formation;
      stopSimulationSilently();
      clearRouteOverrides();
      clearAlignmentOverrides();
      editingPlayId = null;
      setPlayCode(button.dataset.code);
    });
  });

  if (savePlayButton) {
    savePlayButton.addEventListener("click", saveCurrentPlay);
  }
  if (savePlayName) {
    savePlayName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveCurrentPlay();
      }
    });
  }

  playbookSubnavButtons.forEach((button) => {
    button.addEventListener("click", () => {
      playbookSubview = button.dataset.subview === "books" ? "books" : "plays";
      renderPlaybookSubview();
    });
  });

  if (createPlaybookButton) {
    const create = () => {
      const book = createPlaybook(newPlaybookName?.value);
      if (!book) {
        return;
      }
      if (newPlaybookName) {
        newPlaybookName.value = "";
      }
      renderPlaybooks();
    };
    createPlaybookButton.addEventListener("click", create);
    if (newPlaybookName) {
      newPlaybookName.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          create();
        }
      });
    }
  }

  if (exportDataButton) {
    exportDataButton.addEventListener("click", exportDataFile);
  }
  if (importDataInput) {
    importDataInput.addEventListener("change", () => {
      importDataFile(importDataInput.files && importDataInput.files[0]);
      importDataInput.value = "";
    });
  }

  if (airtableConnectButton) {
    airtableConnectButton.addEventListener("click", connectAirtable);
  }
  if (airtableSyncButton) {
    airtableSyncButton.addEventListener("click", () => airtableSyncNow("manual"));
  }
  if (airtablePullButton) {
    airtablePullButton.addEventListener("click", airtablePullReplace);
  }
  if (airtableDisconnectButton) {
    airtableDisconnectButton.addEventListener("click", disconnectAirtable);
  }

  // Pick up edits from other devices: when the app regains focus, and on a light timer.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      airtablePullOnly();
    }
  });
  window.setInterval(() => {
    if (document.visibilityState === "visible") {
      airtablePullOnly();
    }
  }, 60000);

  if (pfClose) {
    pfClose.addEventListener("click", closePlayFullscreen);
  }
  if (pfEdit) {
    pfEdit.addEventListener("click", editFullscreenPlay);
  }
  if (pfDelete) {
    pfDelete.addEventListener("click", deleteFullscreenPlay);
  }
  if (pfNameInput) {
    pfNameInput.addEventListener("blur", commitFullscreenRename);
    pfNameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        pfNameInput.blur();
      }
    });
  }
  if (pfAddPlaybook) {
    pfAddPlaybook.addEventListener("change", handleAddToPlaybookChange);
  }
  if (playFullscreen) {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !playFullscreen.classList.contains("is-hidden")) {
        closePlayFullscreen();
      }
    });
  }

  defenseSelect.addEventListener("change", render);
  simulateButton.addEventListener("click", startSimulation);
  stopSimulationButton.addEventListener("click", stopSimulation);
  zoomOutButton.addEventListener("click", () => zoomField(1 / zoomStep));
  zoomInButton.addEventListener("click", () => zoomField(zoomStep));
  resetViewButton.addEventListener("click", resetFieldView);
  resetRoutesButton.addEventListener("click", () => {
    stopSimulationSilently();
    clearRouteOverrides();
    clearAlignmentOverrides();
    render();
    setSimulationStatus("Reset custom routes and player spots.");
  });
  fieldSvg.addEventListener("wheel", (event) => {
    event.preventDefault();
    const focus = svgPointFromEvent(fieldSvg, event) || viewportCenter();
    zoomField(event.deltaY < 0 ? zoomStep : 1 / zoomStep, focus);
  }, { passive: false });
  fieldSvg.addEventListener("pointerdown", handleFieldPointerDown);
  fieldSvg.addEventListener("pointermove", handleFieldPointerMove);
  fieldSvg.addEventListener("pointerup", handleFieldPointerUp);
  fieldSvg.addEventListener("pointercancel", handleFieldPointerUp);
  exportSvgButton.addEventListener("click", copyPlaySvg);
  exportPptxButton.addEventListener("click", () => exportPptx());
}

function distance(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function collectExportPlays() {
  const snapshot = currentPlaySnapshot();
  return {
    title: `${snapshot.formation} ${snapshot.code}`,
    plays: [snapshot],
  };
}

function formatPlayTitle(snapshot) {
  const formation = snapshot.formation.charAt(0).toUpperCase() + snapshot.formation.slice(1);
  return `${formation} ${snapshot.code}`;
}

function formatPlayBoardLabel(snapshot) {
  const normalized = normalizeSnapshot(snapshot);
  const variant = formationVariantText(normalized);
  return `${normalized.formation.toUpperCase()} ${normalized.code}${variant ? ` / ${variant.toUpperCase()}` : ""}`;
}

function buildExportSvg(snapshot, options = {}) {
  const { report = null, title = "" } = options;
  const tempSvg = createSvgElement("svg", {
    xmlns: svgNs,
    viewBox: "0 0 1000 600",
    width: "1000",
    height: "600",
  });
  renderField(tempSvg, snapshot);

  if (title) {
    const titleWidth = Math.max(220, Math.min(420, 100 + title.length * 14));
    const banner = createSvgElement("rect", {
      x: 28,
      y: 26,
      width: titleWidth,
      height: 58,
      rx: 18,
      fill: "rgba(19,42,30,0.78)",
    });
    tempSvg.appendChild(banner);

    const titleText = createSvgElement("text", {
      x: 50,
      y: 64,
      fill: "#fff7eb",
      "font-family": "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif",
      "font-size": "30",
    });
    titleText.textContent = title;
    tempSvg.appendChild(titleText);
  }

  if (report) {
    const reportY = title ? 96 : 26;
    const banner = createSvgElement("rect", {
      x: 28,
      y: reportY,
      width: 380,
      height: 104,
      rx: 18,
      fill: "rgba(19,42,30,0.78)",
    });
    tempSvg.appendChild(banner);

    const title = createSvgElement("text", {
      x: 50,
      y: reportY + 40,
      fill: "#fff7eb",
      "font-family": "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif",
      "font-size": "28",
    });
    title.textContent = `${report.label} ${report.score}/100`;
    tempSvg.appendChild(title);

    const body = createSvgElement("text", {
      x: 50,
      y: reportY + 74,
      fill: "#fff7eb",
      "font-family": "Avenir Next, Trebuchet MS, sans-serif",
      "font-size": "18",
    });
    body.textContent = report.summary;
    tempSvg.appendChild(body);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(tempSvg)}`;
}

function copyTextFallback(value) {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, value.length);
  const copied = document.execCommand("copy");
  textArea.remove();
  return copied;
}

function safeExportName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "playbook";
}

function describePlayExport(play) {
  const normalized = normalizeSnapshot(play);
  const variant = formationVariantText(normalized).replace(/\s+/g, "-");
  return `${normalized.formation}-${normalized.code}${variant ? `-${variant}` : ""}`;
}

function buildSvgExportSet(exportSet) {
  const reports = exportSet.plays.map((play) => simulateDefense(play, defenseSelect.value));
  const files = exportSet.plays.map((play, index) => ({
    name: `${String(index + 1).padStart(2, "0")}-${safeExportName(describePlayExport(play))}.svg`,
    data: buildExportSvg(play, { report: reports[index] }),
  }));

  return { reports, files };
}

async function copyPlaySvg() {
  const snapshot = currentPlaySnapshot();
  const title = formatPlayTitle(snapshot);
  const svgMarkup = buildExportSvg(snapshot, { title });

  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([
        new ClipboardItem({
          [svgMime]: new Blob([svgMarkup], { type: svgMime }),
          "text/plain": new Blob([svgMarkup], { type: "text/plain" }),
        }),
      ]);
      setSimulationStatus(`Copied ${title} to the clipboard.`);
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(svgMarkup);
      setSimulationStatus(`Copied SVG markup for ${title} to the clipboard.`);
      return;
    }
  } catch {
    // Fall through to the legacy copy path below.
  }

  if (copyTextFallback(svgMarkup)) {
    setSimulationStatus(`Copied SVG markup for ${title} to the clipboard.`);
    return;
  }

  setSimulationStatus("Clipboard access is unavailable in this browser context.");
}

function exportPptx(exportSet = collectExportPlays()) {
  const { reports, files } = buildSvgExportSet(exportSet);
  const svgFiles = files.map((file, index) => ({
    name: `ppt/media/image${index + 1}.svg`,
    data: file.data,
  }));

  const pptxBytes = buildPptx(exportSet.title, exportSet.plays, reports, svgFiles);
  const blob = new Blob([pptxBytes], { type: pptxMime });
  const safeName = safeExportName(exportSet.title);
  downloadBlob(blob, `${safeName}.pptx`);
  setSimulationStatus(`Exported ${exportSet.plays.length} slide${exportSet.plays.length === 1 ? "" : "s"} to PPTX.`);
}

function buildPptx(title, plays, reports, svgFiles) {
  const slideCount = plays.length + 1;
  const files = [
    { name: "[Content_Types].xml", data: buildContentTypes(slideCount, svgFiles.length) },
    { name: "_rels/.rels", data: rootRelsXml() },
    { name: "docProps/app.xml", data: appPropsXml(slideCount) },
    { name: "docProps/core.xml", data: corePropsXml(title) },
    { name: "ppt/presentation.xml", data: presentationXml(slideCount) },
    { name: "ppt/_rels/presentation.xml.rels", data: presentationRelsXml(slideCount) },
    { name: "ppt/theme/theme1.xml", data: themeXml() },
    { name: "ppt/slideMasters/slideMaster1.xml", data: slideMasterXml() },
    { name: "ppt/slideMasters/_rels/slideMaster1.xml.rels", data: slideMasterRelsXml() },
    { name: "ppt/slideLayouts/slideLayout1.xml", data: slideLayoutXml() },
    { name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels", data: slideLayoutRelsXml() },
    { name: "ppt/presProps.xml", data: presPropsXml() },
    { name: "ppt/viewProps.xml", data: viewPropsXml() },
    { name: "ppt/tableStyles.xml", data: tableStylesXml() },
  ];

  files.push({
    name: "ppt/slides/slide1.xml",
    data: titleSlideXml(title, plays.length),
  });
  files.push({
    name: "ppt/slides/_rels/slide1.xml.rels",
    data: titleSlideRelsXml(),
  });

  plays.forEach((play, index) => {
    const slideNumber = index + 2;
    const report = reports[index];
    files.push({
      name: `ppt/slides/slide${slideNumber}.xml`,
      data: playSlideXml(play, report, index + 1),
    });
    files.push({
      name: `ppt/slides/_rels/slide${slideNumber}.xml.rels`,
      data: playSlideRelsXml(index + 1),
    });
  });

  svgFiles.forEach((file) => files.push(file));
  return createZip(files);
}

function buildContentTypes(slideCount, imageCount) {
  const slideOverrides = Array.from({ length: slideCount }, (_, index) =>
    `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  ).join("");

  const imageOverrides = Array.from({ length: imageCount }, (_, index) =>
    `<Override PartName="/ppt/media/image${index + 1}.svg" ContentType="image/svg+xml"/>`,
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
  <Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
  <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
  ${slideOverrides}
  ${imageOverrides}
</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function appPropsXml(slideCount) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex Flag Football Visualizer</Application>
  <Slides>${slideCount}</Slides>
  <PresentationFormat>On-screen Show (4:3)</PresentationFormat>
</Properties>`;
}

function corePropsXml(title) {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(title)}</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

function presentationXml(slideCount) {
  const slideIds = Array.from({ length: slideCount }, (_, index) =>
    `<p:sldId id="${256 + index}" r:id="rId${index + 3}"/>`,
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>${slideIds}</p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
}

function presentationRelsXml(slideCount) {
  const slideRels = Array.from({ length: slideCount }, (_, index) =>
    `<Relationship Id="rId${index + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`,
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>
  ${slideRels}
</Relationships>`;
}

function slideMasterXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr/>
    </p:spTree>
  </p:cSld>
  <p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" bg1="lt1" bg2="lt2" folHlink="folHlink" hlink="hlink" tx1="dk1" tx2="dk2"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="1" r:id="rId1"/>
  </p:sldLayoutIdLst>
  <p:txStyles/>
</p:sldMaster>`;
}

function slideMasterRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;
}

function slideLayoutXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr/>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sldLayout>`;
}

function slideLayoutRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;
}

function presPropsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentationPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`;
}

function viewPropsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:viewPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`;
}

function tableStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def=""/>`;
}

function titleSlideXml(title, playCount) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      ${textShapeXml(2, "Title", title, 548640, 731520, 8046720, 731520, 28)}
      ${textShapeXml(3, "Subtitle", `${playCount} exported play${playCount === 1 ? "" : "s"} from the flag football visualizer`, 548640, 1554480, 8046720, 548640, 18)}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function titleSlideRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;
}

function playSlideXml(play, report, imageIndex) {
  const label = formatPlayBoardLabel(play);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      ${textShapeXml(2, "Play Title", label, 365760, 182880, 4023360, 365760, 22)}
      ${textShapeXml(3, "Play Body", `${report.label}: ${report.summary}`, 365760, 5943600, 8046720, 365760, 16)}
      ${pictureShapeXml(4, `Play ${imageIndex}`, 365760, 914400, 8412480, 4754880)}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function playSlideRelsXml(imageIndex) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${imageIndex}.svg"/>
</Relationships>`;
}

function textShapeXml(id, name, text, x, y, cx, cy, fontSize) {
  return `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="${id}" name="${name}"/>
      <p:cNvSpPr/>
      <p:nvPr/>
    </p:nvSpPr>
    <p:spPr>
      <a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    </p:spPr>
    <p:txBody>
      <a:bodyPr/>
      <a:lstStyle/>
      <a:p><a:r><a:rPr lang="en-US" sz="${fontSize * 100}" b="1"/><a:t>${escapeXml(text)}</a:t></a:r></a:p>
    </p:txBody>
  </p:sp>`;
}

function pictureShapeXml(id, name, x, y, cx, cy) {
  return `<p:pic>
    <p:nvPicPr>
      <p:cNvPr id="${id}" name="${name}"/>
      <p:cNvPicPr/>
      <p:nvPr/>
    </p:nvPicPr>
    <p:blipFill>
      <a:blip r:embed="rId2"/>
      <a:stretch><a:fillRect/></a:stretch>
    </p:blipFill>
    <p:spPr>
      <a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    </p:spPr>
  </p:pic>`;
}

function themeXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:srgbClr val="000000"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F1F1F"/></a:dk2>
      <a:lt2><a:srgbClr val="F7F7F7"/></a:lt2>
      <a:accent1><a:srgbClr val="C74F2D"/></a:accent1>
      <a:accent2><a:srgbClr val="214432"/></a:accent2>
      <a:accent3><a:srgbClr val="3F88C5"/></a:accent3>
      <a:accent4><a:srgbClr val="6A4C93"/></a:accent4>
      <a:accent5><a:srgbClr val="F49D37"/></a:accent5>
      <a:accent6><a:srgbClr val="D7263D"/></a:accent6>
      <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
      <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Arial"/></a:majorFont>
      <a:minorFont><a:latin typeface="Arial"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office"><a:fillStyleLst/><a:lnStyleLst/><a:effectStyleLst/><a:bgFillStyleLst/></a:fmtScheme>
  </a:themeElements>
</a:theme>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function createZip(files) {
  const encoder = new TextEncoder();
  const parts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.data === "string" ? encoder.encode(file.data) : file.data;
    const crc = crc32(dataBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, dataBytes.length, true);
    localView.setUint32(22, dataBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, dataBytes.length, true);
    centralView.setUint32(24, dataBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    parts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const centralOffset = offset;
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralOffset, true);
  endView.setUint16(20, 0, true);

  return concatUint8Arrays([...parts, ...centralParts, endRecord]);
}

function concatUint8Arrays(arrays) {
  const total = arrays.reduce((sum, array) => sum + array.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  arrays.forEach((array) => {
    result.set(array, offset);
    offset += array.length;
  });
  return result;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = crcTable[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function registerAppShell() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch {
      // Ignore service worker registration issues during local development.
    }
  });
}

buildRouteOptions();
buildConceptOptions();
buildOptionCarrierOptions();
buildLegend();
bindEvents();
syncSelectorsFromCode(getPlayCode());
applyConcepts({});
renderPlaybookLibrary();
renderPlaybooks();
renderPlaybookSubview();
const appVersionEl = document.querySelector("#app-version");
if (appVersionEl) {
  appVersionEl.textContent = APP_VERSION;
}
registerAppShell();
render();
renderAirtableConfig();
loadSharedLibrary();
if (airtableConnected()) {
  airtableSyncNow("startup");
}
