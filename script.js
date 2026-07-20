const cells = document.querySelectorAll(".cell");
const status = document.getElementById("status");
const restart = document.getElementById("restart");

const DIRECTIONS = {
    "UP-LEFT": {y: -1, x: -1},
    "UP": {y: -1, x: 0},
    "UP-RIGHT": {y: -1, x: 1},
    "LEFT": {y: 0, x: -1},
    "RIGHT": {y: 0, x: 1},
    "DOWN-LEFT": {y: 1, x: -1},
    "DOWN": {y: 1, x: 0},
    "DOWN-RIGHT": {y: 1, x: 1}
};

// Change to make the board variable size eventually
let board = new Array(6).fill("").map(() => new Array(6).fill(""));
let currentPlayer = "X";
let selectedPiece = null;
let supplies = {
    X: {x: 8, X: 0},
    O: {o: 8, O: 0}
};
let gameOver = false;
let gamePhase = "place";
renderSupplies();

function checkBoard() {
    let threes = [];
    let bigCounter = 0;

    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            let point = {row: i, col: j};
            if (belongsToCurrentPlayer(point)) {
                if (getBoardPoint(point) === currentPlayer) {
                    bigCounter++;
                    if (bigCounter === 8) {
                        gamePhase = "win";
                        return;
                    }
                }
                let threesFromPoint = checkThreeInARow(point);
                for (three of threesFromPoint) {
                    let p1, p2, p3;
                    [p1, p2, p3] = [getBoardPoint(three[0]), getBoardPoint(three[1]), getBoardPoint(three[2])];
                    if (p1 === currentPlayer && p2 === currentPlayer && p3 === currentPlayer) {
                        gamePhase = "win";
                        return;
                    }
                }
                threes.push(...checkThreeInARow(point));
            }
        }
    }

    let supplyEmpty = supplies[currentPlayer][currentPlayer] === 0 && supplies[currentPlayer][currentPlayer.toLowerCase()] === 0;
    if (threes.length >= 1 && supplyEmpty) {
        gamePhase = "promoteThreeOrOne";
    } else if (supplyEmpty) {
        gamePhase = "promoteOne";
    } else if (threes.length > 1) {
        gamePhase = "promoteThree";
    } else if (threes.length === 1) {
        promote(threes[0]);
    }
}

function getThreePointsInDirection(origin, direction) {
    let p1 = origin;
    let p2 = addPointAndDirection(p1, direction);
    let p3 = addPointAndDirection(p2, direction);
    return [p1, p2, p3];
}

function checkThreeInARow(origin) {
    let threes = [];
    let directionsToCheck = [
        DIRECTIONS["RIGHT"],
        DIRECTIONS["DOWN-LEFT"],
        DIRECTIONS["DOWN"],
        DIRECTIONS["DOWN-RIGHT"]
    ];

    for (direction of directionsToCheck) {
        if (isThreeInARow(origin, direction)) {
            threes.push(getThreePointsInDirection(origin, direction));
        }
    }

    return threes;
}

function isThreeInARow(origin, direction) {
    // Can't make three in a row if it's too close to an edge
    if ((origin.row > 3 && direction.y === 1) ||
        (origin.col < 2 && direction.x === -1) ||
        (origin.col > 3 && direction.x === 1)
    ) return false;

    let p1 = origin;
    let p2 = addPointAndDirection(origin, direction);
    let p3 = addPointAndDirection(p2, direction);

    if (getBoardPoint(p1).toUpperCase() === getBoardPoint(p2).toUpperCase() &&
        getBoardPoint(p1).toUpperCase() === getBoardPoint(p3).toUpperCase()
    ) return true;

    return false;
}

function getBoardPoint(point) {
    if (point.row < 0 || point.row > 5 || point.col < 0 || point.col > 5) {
        return null;
    }
    return board[point.row][point.col];
}

function getCellIndex(point) {
    return (point.row * 6) + point.col;
}

function getIndexPoint(index) {
    let row = Math.floor(index / 6);
    let col = index % 6;

    return {row: row, col: col};
}

function addPointAndDirection(point, direction) {
    return {row: point.row + direction.y, col: point.col + direction.x};
}

/* Not actually necesary? the query selector might fetch the cells in order already
function sortPoints(points) {
    let pointsIndexes = points.map((point) => getCellIndex(point));
    pointsIndexes = pointsIndexes.sort((a, b) => a - b);
    return pointsIndexes.map((index) => getIndexPoint(index));
}
*/

function isInARow(points) {
    let p1, p2, p3;
    [p1, p2, p3] = points;
    let dir = {y: p2.row - p1.row, x: p2.col - p1.col};
    if (Math.abs(dir.y) > 1 || Math.abs(dir.x) > 1) {
        return false;
    }
    let testPoint = addPointAndDirection(p2, dir);
    // Point 3 should be the next point in the same direction as Point 1 to Point 2.
    return testPoint.row === p3.row && testPoint.col === p3.col;
}

function bump(point, direction) {
    if (point.row < 0 || point.row > 5 || point.col < 0 || point.col > 5) {
        // Out of bounds.
        return;
    }

    let targetRow = point.row + direction.y;
    let targetCol = point.col + direction.x;
    let target = {row: targetRow, col: targetCol};

    let bumpedPiece = getBoardPoint(point);

    if (targetRow < 0 || targetCol < 0 || targetRow > 5 || targetCol > 5) {
        // Bumped off.
        supplies[bumpedPiece.toUpperCase()][bumpedPiece]++;
    } else if (getBoardPoint(target) !== "") {
        // Piece in the way. Do not bump.
        return;
    } else {
        // Bumped to target.
        board[targetRow][targetCol] = bumpedPiece;
        cells[getCellIndex(target)].textContent = bumpedPiece;
    }
    board[point.row][point.col] = "";
    cells[getCellIndex(point)].textContent = "";
}

function canBump(p1, p2) {
    return p1 === p1.toUpperCase() || p2 === p2.toLowerCase();
}

function bumpAdjacent(point) {
    for (direction of Object.values(DIRECTIONS)) {
        let bumpedPoint = addPointAndDirection(point, direction);
        let bumpedPiece = getBoardPoint(bumpedPoint);
        if (bumpedPiece && bumpedPiece !== "" && canBump(getBoardPoint(point), bumpedPiece)) {
            bump(bumpedPoint, direction);
        }
    }
}

function belongsToCurrentPlayer(point) {
    return getBoardPoint(point).toUpperCase() === currentPlayer;
}

function promote(points) {
    for (point of points) {
        supplies[currentPlayer][currentPlayer]++;
        board[point.row][point.col] = "";
        cells[getCellIndex(point)].textContent = "";
    }
    renderSupply(currentPlayer);
}

function makePiece(piece) {
    const newPiece = document.createElement("button");
    newPiece.className = `piece ${piece}`;
    newPiece.textContent = piece;
    newPiece.addEventListener("click", () => {
        if (!gameOver && currentPlayer === piece.toUpperCase()) {
            document.querySelectorAll(".piece.selected").forEach(p => p.classList.remove("selected"));
            newPiece.classList.add("selected");
            selectedPiece = newPiece;
        }
    })
    return newPiece;
}

function renderSupply(player) {
    const supply = document.getElementById(`${player.toLowerCase()}-supply`);
    supply.innerHTML = "";
    for (let i = 0; i < supplies[player][player]; i++) {
        supply.appendChild(makePiece(player));
    }
    for (let i = 0; i < supplies[player][player.toLowerCase()]; i++) {
        supply.appendChild(makePiece(player.toLowerCase()));
    }
}

function renderSupplies() {
    renderSupply("X");
    renderSupply("O");
}

function placeHandler(cell) {
    const index = cell.dataset.index;
    const point = getIndexPoint(index);

    if (getBoardPoint(point) !== "" || gameOver || selectedPiece === null) return;

    board[point.row][point.col] = selectedPiece.textContent;
    supplies[currentPlayer][selectedPiece.textContent]--;
    cell.textContent = selectedPiece.textContent;

    bumpAdjacent(point);

    document.querySelectorAll(".piece.selected").forEach(p => p.classList.remove("selected"));
    selectedPiece = null;

    renderSupplies();

    checkBoard();

    if (gamePhase === "win") {
        status.textContent = `Player ${currentPlayer} wins!`;
        gameOver = true;
    } else if (gamePhase === "place") {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        status.textContent = `Player ${currentPlayer}'s turn`;
    } else {
        if (gamePhase === "promoteOne") {
            status.textContent = `Player ${currentPlayer}: Select a piece to promote`;
        } else if (gamePhase === "promoteThree") {
            status.textContent = `Player ${currentPlayer}: Select three in a row to promote`;
        } else if (gamePhase === "promoteThreeOrOne") {
            status.textContent = `Player ${currentPlayer}: Select a piece or three in a row to promote`;
        }
        let button = document.createElement("button");
        button.textContent = "Select";
        button.addEventListener("click", () => {
            promoteSelectionHandler();
        })
        status.appendChild(button);
    }
}

function promoteHandler(cell) {
    if (cell.classList.contains("selected")) {
        cell.classList.remove("selected");
        return;
    }

    let selectedCells = document.querySelectorAll(".cell.selected");
    let maxSelected = gamePhase === "promoteOne" ? 1 : 3;

    if (belongsToCurrentPlayer(getIndexPoint(cell.dataset.index)) && selectedCells.length < maxSelected) {
        cell.classList.add("selected");
    }
}

function promoteSelectionHandler() {
    let selectedCells = [...document.querySelectorAll(".cell.selected")];
    if (gamePhase === "promoteOne" && selectedCells.length !== 1) {
        return;
    }
    if (gamePhase === "promoteThree" && selectedCells.length !== 3) {
        return;
    }
    if (gamePhase === "promoteThreeOrOne" && selectedCells.length !== 3 && selectedCells.length !== 1) {
        return;
    }

    let points = selectedCells.map((cell) => getIndexPoint(cell.dataset.index));
    if ((points.length === 3 && isInARow(points)) || points.length === 1) {
        promote(points);
        selectedCells.forEach((cell) => cell.classList.remove("selected"));
        gamePhase = "place";
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        status.textContent = `Player ${currentPlayer}'s turn`;
    }
}

cells.forEach(cell => {
    cell.addEventListener("click", () => {
        if (gamePhase === "place") {
            placeHandler(cell);
        } else if (gamePhase !== "win") {
            promoteHandler(cell);
        }
    });
});

restart.addEventListener("click", () => {
    for (const row of board) {
        row.fill("");
    }
    currentPlayer = "X";
    supplies.X.x = 8;
    supplies.X.X = 0;
    supplies.O.o = 8;
    supplies.O.O = 0;
    gameOver = false;
    gamePhase = "place";
    document.querySelectorAll(".piece.selected").forEach(p => p.classList.remove("selected"));
    document.querySelectorAll(".cell.selected").forEach(c => c.classList.remove("selected"));
    selectedPiece = null;

    cells.forEach(cell => {
        cell.textContent = "";
    });

    renderSupplies();

    status.textContent = "Player X's turn";
});