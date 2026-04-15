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

const formations = {
  pro: {
    x: { x: 180, y: 410 },
    y: { x: 360, y: 410 },
    z: { x: 820, y: 410 },
    c: { x: 500, y: 410 },
    q: { x: 500, y: 500 },
  },
  trips: {
    x: { x: 260, y: 410 },
    y: { x: 340, y: 370 },
    z: { x: 420, y: 410 },
    c: { x: 500, y: 410 },
    q: { x: 500, y: 500 },
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

const formationSelect = document.querySelector("#formation-select");
const playCodeInput = document.querySelector("#play-code-input");
const playCodeBadge = document.querySelector("#play-code-badge");
const randomPlayButton = document.querySelector("#random-play-button");
const exportPptxButton = document.querySelector("#export-pptx-button");
const defenseSelect = document.querySelector("#defense-select");
const simulateButton = document.querySelector("#simulate-button");
const stopSimulationButton = document.querySelector("#stop-simulation-button");
const simulationStatus = document.querySelector("#simulation-status");
const defenseReportGrid = document.querySelector("#defense-report-grid");
const fieldSvg = document.querySelector("#field");
const routeLegend = document.querySelector("#route-legend");
const bunchSideGroup = document.querySelector("#bunch-side-group");
const bunchSideButtons = Array.from(document.querySelectorAll("[data-bunch-side]"));
const sequenceNameInput = document.querySelector("#sequence-name-input");
const saveSequenceButton = document.querySelector("#save-sequence-button");
const addPlayButton = document.querySelector("#add-play-button");
const sequenceStatus = document.querySelector("#sequence-status");
const sequenceList = document.querySelector("#sequence-list");

const routeInputs = {
  x: document.querySelector("#route-x"),
  y: document.querySelector("#route-y"),
  z: document.querySelector("#route-z"),
  c: document.querySelector("#route-c"),
};

const svgNs = "http://www.w3.org/2000/svg";
const storageKey = "flag-football-play-sequences";
const pptxMime = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

let bunchSide = "left";
let sequences = loadSequences();
let simulationFrameId = 0;
let animationStart = 0;
let activeSimulation = null;

function getAlignment(formationKey, side = bunchSide) {
  if (formationKey === "bunch") {
    const common = {
      x: { x: 400, y: 410 },
      y: { x: 600, y: 410 },
      c: { x: 500, y: 410 },
      q: { x: 500, y: 500 },
    };

    if (side === "right") {
      return {
        ...common,
        z: { x: 690, y: 372 },
      };
    }

    return {
      ...common,
      z: { x: 310, y: 452 },
    };
  }

  return formations[formationKey];
}

function currentPlaySnapshot() {
  return {
    formation: formationSelect.value,
    code: getPlayCode(),
    bunchSide,
  };
}

function applySnapshot(snapshot) {
  stopSimulationSilently();
  formationSelect.value = snapshot.formation;
  bunchSide = snapshot.bunchSide || "left";
  setPlayCode(snapshot.code);
}

function updateBunchToggleUI() {
  bunchSideButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.bunchSide === bunchSide);
  });
}

function updateFormationControls() {
  bunchSideGroup.classList.toggle("is-hidden", formationSelect.value !== "bunch");
}

function loadSequences() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSequences() {
  window.localStorage.setItem(storageKey, JSON.stringify(sequences));
}

function setStatus(message) {
  sequenceStatus.textContent = message;
}

function setSimulationStatus(message) {
  simulationStatus.textContent = message;
}

function sanitizeSequenceName(value) {
  return value.trim().slice(0, 40);
}

function findNamedSequence() {
  const name = sanitizeSequenceName(sequenceNameInput.value);
  if (!name) {
    return null;
  }
  return sequences.find((sequence) => sequence.name.toLowerCase() === name.toLowerCase()) || null;
}

function renderSequences() {
  if (sequences.length === 0) {
    sequenceList.innerHTML = '<p class="field-help">No saved sequences yet.</p>';
    return;
  }

  sequenceList.innerHTML = sequences
    .map(
      (sequence, sequenceIndex) => `
        <section class="sequence-card">
          <div class="sequence-header">
            <div>
              <strong>${escapeHtml(sequence.name)}</strong>
              <div class="sequence-meta">${sequence.plays.length} play${sequence.plays.length === 1 ? "" : "s"}</div>
            </div>
            <button class="secondary-button" type="button" data-delete-sequence="${sequenceIndex}">Delete</button>
          </div>
          <div class="sequence-play-list">
            ${sequence.plays
              .map(
                (play, playIndex) => `
                  <div class="sequence-play">
                    <span class="sequence-play-code">${play.code}</span>
                    <span>${play.formation}${play.formation === "bunch" ? ` / z ${play.bunchSide || "left"}` : ""}</span>
                    <button type="button" data-load-sequence-play="${sequenceIndex}:${playIndex}">Load</button>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>
      `,
    )
    .join("");

  sequenceList.querySelectorAll("[data-delete-sequence]").forEach((button) => {
    button.addEventListener("click", () => {
      sequences.splice(Number(button.dataset.deleteSequence), 1);
      persistSequences();
      renderSequences();
      setStatus("Sequence deleted.");
    });
  });

  sequenceList.querySelectorAll("[data-load-sequence-play]").forEach((button) => {
    button.addEventListener("click", () => {
      const [sequenceIndex, playIndex] = button.dataset.loadSequencePlay.split(":").map(Number);
      applySnapshot(sequences[sequenceIndex].plays[playIndex]);
      setStatus(`Loaded ${sequences[sequenceIndex].name} play ${playIndex + 1}.`);
    });
  });
}

function buildRouteOptions() {
  Object.entries(routeInputs).forEach(([, select]) => {
    select.innerHTML = Object.entries(routeTree)
      .map(([value, label]) => `<option value="${value}">${value} - ${label}</option>`)
      .join("");
  });
}

function buildLegend() {
  routeLegend.innerHTML = Object.entries(routeTree)
    .map(
      ([value, label]) => `
        <div class="legend-card">
          <strong>${value}</strong>
          <span>${escapeHtml(label)}</span>
        </div>
      `,
    )
    .join("");
}

function sanitizeCode(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.padEnd(4, "0");
}

function getPlayCode() {
  return sanitizeCode(playCodeInput.value);
}

function syncSelectorsFromCode(code) {
  ["x", "y", "z", "c"].forEach((player, index) => {
    routeInputs[player].value = code[index];
  });
}

function syncCodeFromSelectors() {
  const code = ["x", "y", "z", "c"].map((player) => routeInputs[player].value).join("");
  playCodeInput.value = code;
  return code;
}

function setPlayCode(code) {
  const cleaned = sanitizeCode(code);
  playCodeInput.value = cleaned;
  syncSelectorsFromCode(cleaned);
  render();
}

function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(svgNs, tag);
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
  return element;
}

function clearSvg(target) {
  target.innerHTML = "";
}

function drawFieldBase(target) {
  const defs = createSvgElement("defs");
  const marker = createSvgElement("marker", {
    id: "arrowhead",
    markerWidth: "10",
    markerHeight: "10",
    refX: "8",
    refY: "5",
    orient: "auto",
  });
  marker.appendChild(
    createSvgElement("path", {
      d: "M 0 0 L 10 5 L 0 10 z",
      fill: "#ffeb7a",
    }),
  );
  defs.appendChild(marker);
  target.appendChild(defs);

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

  switch (Number(routeNumber)) {
    case 0:
      return [[x, y], [x, y + 26], [x + 55 * towardMiddle, y + 26]];
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

function getOffensePositions(snapshot, progress) {
  const alignment = getAlignment(snapshot.formation, snapshot.bunchSide);
  const positions = {};
  const routeDelay = { x: 0, y: 0.03, z: 0.06, c: 0.12 };

  ["x", "y", "z", "c"].forEach((player, index) => {
    const adjusted = clamp((progress - routeDelay[player]) / (1 - routeDelay[player]), 0, 1);
    const eased = 1 - (1 - adjusted) * (1 - adjusted);
    const points = routePoints(snapshot.code[index], alignment[player]);
    positions[player] = samplePolyline(points, eased);
  });

  positions.q = {
    x: alignment.q.x,
    y: alignment.q.y - Math.min(48, progress * 70),
  };

  return positions;
}

function drawRoutes(target, snapshot) {
  const alignment = getAlignment(snapshot.formation, snapshot.bunchSide);
  const labels = { x: snapshot.code[0], y: snapshot.code[1], z: snapshot.code[2], c: snapshot.code[3] };

  Object.entries(labels).forEach(([player, routeNumber]) => {
    const points = routePoints(routeNumber, alignment[player]);
    target.appendChild(
      createSvgElement("path", {
        d: buildPath(points),
        fill: "none",
        stroke: "#ffeb7a",
        "stroke-width": 8,
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
        "stroke-width": 4,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "marker-end": "url(#arrowhead)",
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

function drawPlayers(target, snapshot, positions) {
  const alignment = getAlignment(snapshot.formation, snapshot.bunchSide);
  const routeMap = { x: snapshot.code[0], y: snapshot.code[1], z: snapshot.code[2], c: snapshot.code[3], q: "QB" };
  const currentPositions = positions || alignment;

  Object.entries(currentPositions).forEach(([player, position]) => {
    target.appendChild(
      createSvgElement("circle", {
        cx: position.x,
        cy: position.y,
        r: player === "q" ? 24 : 22,
        fill: playerColors[player],
        stroke: "rgba(255,255,255,0.9)",
        "stroke-width": 4,
      }),
    );

    const label = createSvgElement("text", {
      x: position.x,
      y: position.y + 6,
      "text-anchor": "middle",
      "font-family": "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif",
      "font-size": player === "q" ? "26" : "24",
      "letter-spacing": "0.08em",
      fill: "#ffffff",
    });
    label.textContent = player.toUpperCase();
    target.appendChild(label);

    const tag = createSvgElement("text", {
      x: position.x,
      y: position.y + 52,
      "text-anchor": "middle",
      "font-family": "Avenir Next, Trebuchet MS, sans-serif",
      "font-size": "18",
      "font-weight": "700",
      fill: "#fff7eb",
    });
    tag.textContent = player === "q" ? "snap / drop" : `${routeMap[player]} - ${routeTree[routeMap[player]]}`;
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
        r: 20,
        fill: defenseColors[defense],
        stroke: "rgba(19,42,30,0.82)",
        "stroke-width": 4,
      }),
    );
    const label = createSvgElement("text", {
      x: defender.position.x,
      y: defender.position.y + 5,
      "text-anchor": "middle",
      "font-family": "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif",
      "font-size": "18",
      fill: "#132a1e",
    });
    label.textContent = defender.label;
    target.appendChild(label);
  });
}

function renderField(target, snapshot, simulation = null) {
  clearSvg(target);
  drawFieldBase(target);
  drawRoutes(target, snapshot);

  if (simulation) {
    const offensePositions = getOffensePositions(snapshot, simulation.progress);
    drawDefense(target, simulation.defense, offensePositions, simulation.progress);
    drawPlayers(target, snapshot, offensePositions);
    return;
  }

  drawPlayers(target, snapshot);
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

function simulateDefense(snapshot, defense) {
  const routePlayers = ["x", "y", "z", "c"];
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
      const route = Number(snapshot.code[index]);
      const base = bestByPlayer[player].distance;
      const bonus = schemeBonuses[defense][route] || 0;
      return {
        player,
        route,
        distance: base,
        score: Math.round(base * 0.65 + bonus),
      };
    })
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const totalScore = clamp(Math.round(ranked.reduce((sum, item) => sum + item.score, 0) / ranked.length), 20, 95);

  return {
    defense,
    label: defenseLabels[defense],
    score: totalScore,
    bestPlayer: best.player,
    bestRoute: routeTree[best.route],
    weakestPlayer: worst.player,
    summary: `${best.player.toUpperCase()} on the ${routeTree[best.route].toLowerCase()} gives the cleanest window.`,
    detail: `${defenseDescriptions[defense]} The tightest problem is ${worst.player.toUpperCase()}, where leverage closes fastest.`,
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
  updateFormationControls();
  updateBunchToggleUI();
  renderField(fieldSvg, snapshot, activeSimulation);
  renderDefenseReports();
}

function bindEvents() {
  formationSelect.addEventListener("change", () => {
    stopSimulationSilently();
    render();
  });

  playCodeInput.addEventListener("input", () => {
    const code = getPlayCode();
    syncSelectorsFromCode(code);
    stopSimulationSilently();
    render();
  });

  Object.entries(routeInputs).forEach(([, select]) => {
    select.addEventListener("change", () => {
      syncCodeFromSelectors();
      stopSimulationSilently();
      render();
    });
  });

  randomPlayButton.addEventListener("click", () => {
    const code = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join("");
    setPlayCode(code);
  });

  bunchSideButtons.forEach((button) => {
    button.addEventListener("click", () => {
      bunchSide = button.dataset.bunchSide;
      stopSimulationSilently();
      render();
    });
  });

  document.querySelectorAll(".quick-play").forEach((button) => {
    button.addEventListener("click", () => {
      formationSelect.value = button.dataset.formation;
      setPlayCode(button.dataset.code);
      stopSimulationSilently();
      render();
    });
  });

  saveSequenceButton.addEventListener("click", () => {
    const name = sanitizeSequenceName(sequenceNameInput.value);
    if (!name) {
      setStatus("Enter a sequence name before saving.");
      return;
    }

    const existing = sequences.find((sequence) => sequence.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.plays = [currentPlaySnapshot()];
      setStatus(`Replaced ${name} with the current play.`);
    } else {
      sequences.unshift({ name, plays: [currentPlaySnapshot()] });
      setStatus(`Saved ${name}.`);
    }

    persistSequences();
    renderSequences();
  });

  addPlayButton.addEventListener("click", () => {
    const name = sanitizeSequenceName(sequenceNameInput.value);
    if (!name) {
      setStatus("Enter a sequence name before adding a play.");
      return;
    }

    let sequence = sequences.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
    if (!sequence) {
      sequence = { name, plays: [] };
      sequences.unshift(sequence);
    }

    sequence.plays.push(currentPlaySnapshot());
    persistSequences();
    renderSequences();
    setStatus(`Added play ${sequence.plays.length} to ${sequence.name}.`);
  });

  defenseSelect.addEventListener("change", render);
  simulateButton.addEventListener("click", startSimulation);
  stopSimulationButton.addEventListener("click", stopSimulation);
  exportPptxButton.addEventListener("click", exportPptx);
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
  const namedSequence = findNamedSequence();
  if (namedSequence) {
    return {
      title: namedSequence.name,
      plays: namedSequence.plays,
    };
  }

  const snapshot = currentPlaySnapshot();
  return {
    title: `${snapshot.formation} ${snapshot.code}`,
    plays: [snapshot],
  };
}

function buildExportSvg(snapshot, report) {
  const tempSvg = createSvgElement("svg", {
    xmlns: svgNs,
    viewBox: "0 0 1000 600",
  });
  renderField(tempSvg, snapshot);

  if (report) {
    const banner = createSvgElement("rect", {
      x: 28,
      y: 26,
      width: 380,
      height: 104,
      rx: 18,
      fill: "rgba(19,42,30,0.78)",
    });
    tempSvg.appendChild(banner);

    const title = createSvgElement("text", {
      x: 50,
      y: 66,
      fill: "#fff7eb",
      "font-family": "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif",
      "font-size": "28",
    });
    title.textContent = `${report.label} ${report.score}/100`;
    tempSvg.appendChild(title);

    const body = createSvgElement("text", {
      x: 50,
      y: 100,
      fill: "#fff7eb",
      "font-family": "Avenir Next, Trebuchet MS, sans-serif",
      "font-size": "18",
    });
    body.textContent = report.summary;
    tempSvg.appendChild(body);
  }

  return new XMLSerializer().serializeToString(tempSvg);
}

function exportPptx() {
  const exportSet = collectExportPlays();
  const reports = exportSet.plays.map((play) => simulateDefense(play, defenseSelect.value));
  const svgFiles = exportSet.plays.map((play, index) => ({
    name: `ppt/media/image${index + 1}.svg`,
    data: buildExportSvg(play, reports[index]),
  }));

  const pptxBytes = buildPptx(exportSet.title, exportSet.plays, reports, svgFiles);
  const blob = new Blob([pptxBytes], { type: pptxMime });
  const safeName = exportSet.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "playbook";
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
  const label = `${play.formation.toUpperCase()} ${play.code}${play.formation === "bunch" ? ` / Z ${play.bunchSide.toUpperCase()}` : ""}`;
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

buildRouteOptions();
buildLegend();
bindEvents();
syncSelectorsFromCode(getPlayCode());
renderSequences();
render();
