
const board = document.getElementById("board");
const levelText = document.getElementById("level");
const pairsText = document.getElementById("pairs");
const statusText = document.getElementById("status");
const levelTitle = document.getElementById("levelTitle");
const levelDescription = document.getElementById("levelDescription");
const nextBtn = document.getElementById("nextBtn");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalBtn = document.getElementById("modalBtn");

const SIZE = 5;
const TOTAL_LEVELS = 20;

const colors = [
  "#ff4242",
  "#35d9ff",
  "#b4ff38",
  "#d76bff",
  "#ff9b32"
];

// H — gorizontal, V — vertikal.
// Har bir juftlik alohida qator yoki ustunda joylashadi.
// Shu sababli juftliklar bir-birining yo‘lini to‘smaydi.
const layouts = [
  { type: "H", lanes: [0, 4] },
  { type: "V", lanes: [0, 4] },
  { type: "H", lanes: [1, 3] },
  { type: "V", lanes: [1, 3] },

  { type: "H", lanes: [0, 2, 4] },
  { type: "V", lanes: [0, 2, 4] },
  { type: "H", lanes: [0, 1, 4] },
  { type: "V", lanes: [0, 1, 4] },
  { type: "H", lanes: [0, 2, 3] },
  { type: "V", lanes: [0, 2, 3] },

  { type: "H", lanes: [0, 1, 3, 4] },
  { type: "V", lanes: [0, 1, 3, 4] },
  { type: "H", lanes: [0, 1, 2, 4] },
  { type: "V", lanes: [0, 1, 2, 4] },
  { type: "H", lanes: [0, 1, 2, 3, 4] },
  { type: "V", lanes: [0, 1, 2, 3, 4] },

  { type: "H", lanes: [4, 2, 0, 3, 1] },
  { type: "V", lanes: [4, 2, 0, 3, 1] },
  { type: "H", lanes: [1, 4, 0, 3, 2] },
  { type: "V", lanes: [1, 4, 0, 3, 2] }
];

let currentLevel = 1;
let paths = {};
let endpoints = {};
let activePath = null;
let completed = false;
let hintTimer = null;

function getLevelData() {
  const layout = layouts[currentLevel - 1];

  return layout.lanes.map((lane, i) => {
    const colorIndex = currentLevel % 2 === 0
      ? layout.lanes.length - 1 - i
      : i;

    let first;
    let second;

    if (layout.type === "H") {
      first = lane * SIZE;
      second = lane * SIZE + SIZE - 1;
    } else {
      first = lane;
      second = (SIZE - 1) * SIZE + lane;
    }

    return {
      color: colors[colorIndex],
      first,
      second
    };
  });
}

function createLevel() {
  clearTimeout(hintTimer);

  paths = {};
  endpoints = {};
  activePath = null;
  completed = false;

  const data = getLevelData();

  data.forEach(pair => {
    endpoints[pair.first] = {
      color: pair.color,
      partner: pair.second
    };

    endpoints[pair.second] = {
      color: pair.color,
      partner: pair.first
    };
  });

  levelText.textContent = `${currentLevel} / ${TOTAL_LEVELS}`;
  pairsText.textContent = `0 / ${data.length}`;
  statusText.textContent = "O‘yin";
  levelTitle.textContent = `${currentLevel}-bosqich`;

  if (currentLevel <= 4) {
    levelDescription.textContent = "Ikki rangli juftlikni birlashtiring.";
  } else if (currentLevel <= 9) {
    levelDescription.textContent = "Uchta rangli juftlikni birlashtiring.";
  } else if (currentLevel <= 14) {
    levelDescription.textContent = "To‘rtta rangni birlashtiring.";
  } else {
    levelDescription.textContent = "Beshta rangli juftlikni birlashtiring!";
  }

  nextBtn.disabled = true;
  modal.classList.add("hidden");

  renderBoard();
}

function renderBoard() {
  board.innerHTML = "";

  const occupied = {};

  Object.entries(paths).forEach(([color, cells]) => {
    cells.forEach(index => {
      occupied[index] = color;
    });
  });

  if (activePath) {
    activePath.cells.forEach(index => {
      occupied[index] = activePath.color;
    });
  }

  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;

    if (occupied[i]) {
      cell.classList.add("path");
      cell.style.setProperty("--path-color", occupied[i]);
    }

    if (endpoints[i]) {
      cell.classList.add("endpoint");
      cell.style.setProperty("--dot-color", endpoints[i].color);

      const dot = document.createElement("div");
      dot.className = "dot";
      dot.style.setProperty("--dot-color", endpoints[i].color);

      cell.appendChild(dot);
    }

    board.appendChild(cell);
  }
}

function isAdjacent(a, b) {
  const rowA = Math.floor(a / SIZE);
  const colA = a % SIZE;
  const rowB = Math.floor(b / SIZE);
  const colB = b % SIZE;

  return Math.abs(rowA - rowB) +
         Math.abs(colA - colB) === 1;
}

function isOccupied(index) {
  if (activePath && activePath.cells.includes(index)) {
    return false;
  }

  return Object.values(paths).some(cells =>
    cells.includes(index)
  );
}

function startDrawing(index) {
  if (completed || activePath) return;

  const endpoint = endpoints[index];

  if (!endpoint) return;

  const color = endpoint.color;

  if (paths[color]) return;

  activePath = {
    color,
    target: endpoint.partner,
    cells: [index]
  };

  renderBoard();
}

function moveDrawing(index) {
  if (!activePath || completed) return;

  const cells = activePath.cells;
  const last = cells[cells.length - 1];

  if (index === last) return;

  // Bir katak orqaga qaytish
  if (cells.length > 1 && index === cells[cells.length - 2]) {
    cells.pop();
    renderBoard();
    return;
  }

  // Faqat yonma-yon katakka yurish
  if (!isAdjacent(last, index)) return;

  // Boshqa chiziq bilan band katak
  if (isOccupied(index)) return;

  // Boshqa rangli nuqtaga tegmaslik
  if (endpoints[index] &&
      endpoints[index].color !== activePath.color) {
    return;
  }

  // O‘z rangidagi noto‘g‘ri nuqtaga tegmaslik
  if (endpoints[index] && index !== activePath.target) {
    return;
  }

  cells.push(index);

  if (index === activePath.target) {
    paths[activePath.color] = [...cells];
    activePath = null;
    checkProgress();
  }

  renderBoard();
}

// Sichqoncha tez harakatlanganda oraliq kataklarni ham tekshirish
function moveToCell(index) {
  if (!activePath || index === null) return;

  const last = activePath.cells[activePath.cells.length - 1];

  if (isAdjacent(last, index)) {
    moveDrawing(index);
    return;
  }

  const row1 = Math.floor(last / SIZE);
  const col1 = last % SIZE;
  const row2 = Math.floor(index / SIZE);
  const col2 = index % SIZE;

  // Bir qatorda harakat
  if (row1 === row2) {
    const step = col2 > col1 ? 1 : -1;

    for (let col = col1 + step; col !== col2 + step; col += step) {
      if (!activePath) break;
      moveDrawing(row1 * SIZE + col);
    }
    return;
  }

  // Bir ustunda harakat
  if (col1 === col2) {
    const step = row2 > row1 ? 1 : -1;

    for (let row = row1 + step; row !== row2 + step; row += step) {
      if (!activePath) break;
      moveDrawing(row * SIZE + col1);
    }
  }
}

function getCellFromPoint(x, y) {
  const element = document.elementFromPoint(x, y);

  if (!element) return null;

  const cell = element.closest(".cell");

  if (!cell || !board.contains(cell)) return null;

  return Number(cell.dataset.index);
}

board.addEventListener("pointerdown", event => {
  const cell = event.target.closest(".cell");

  if (!cell) return;

  event.preventDefault();

  board.setPointerCapture(event.pointerId);
  startDrawing(Number(cell.dataset.index));
});

board.addEventListener("pointermove", event => {
  if (!activePath) return;

  event.preventDefault();

  const index = getCellFromPoint(event.clientX, event.clientY);

  moveToCell(index);
});

function finishDrawing() {
  if (!activePath) return;

  activePath = null;
  renderBoard();
}

board.addEventListener("pointerup", finishDrawing);
board.addEventListener("pointercancel", finishDrawing);

function checkProgress() {
  const connected = Object.keys(paths).length;
  const total = getLevelData().length;

  pairsText.textContent = `${connected} / ${total}`;

  if (connected === total) {
    completed = true;
    statusText.textContent = "Bajarildi!";
    nextBtn.disabled = false;

    const record = Number(
      localStorage.getItem("nuqtaRecord") || 0
    );

    if (currentLevel > record) {
      localStorage.setItem("nuqtaRecord", currentLevel);
    }

    setTimeout(showModal, 350);
  }
}

function showModal() {
  modal.classList.remove("hidden");

  if (currentLevel === TOTAL_LEVELS) {
    modalTitle.textContent = "Tabriklaymiz!";
    modalText.textContent =
      "Siz barcha 20 ta bosqichni muvaffaqiyatli tugatdingiz!";
    modalBtn.textContent = "Qayta o‘ynash";
  } else {
    modalTitle.textContent = "Ajoyib!";
    modalText.textContent =
      `${currentLevel}-bosqich bajarildi. Keyingi bosqichga o‘ting!`;
    modalBtn.textContent = "Keyingi bosqich";
  }
}

function nextLevel() {
  if (!completed) return;

  currentLevel++;

  if (currentLevel > TOTAL_LEVELS) {
    currentLevel = 1;
  }

  createLevel();
}

function resetLevel() {
  createLevel();
}

document.getElementById("resetBtn")
  .addEventListener("click", resetLevel);

document.getElementById("hintBtn")
  .addEventListener("click", () => {
    if (completed) return;

    clearTimeout(hintTimer);

    const pair = getLevelData().find(
      item => !paths[item.color]
    );

    if (!pair) return;

    const cells = board.querySelectorAll(".cell");

    cells[pair.first].classList.add("hint");
    cells[pair.second].classList.add("hint");

    statusText.textContent = "Bir xil ranglarni toping!";

    hintTimer = setTimeout(() => {
      cells[pair.first]?.classList.remove("hint");
      cells[pair.second]?.classList.remove("hint");

      if (!completed) {
        statusText.textContent = "O‘yin";
      }
    }, 1500);
  });

nextBtn.addEventListener("click", nextLevel);
modalBtn.addEventListener("click", nextLevel);

createLevel();
