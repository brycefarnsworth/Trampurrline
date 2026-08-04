const PHASES = { // Copied from game.js. Redundant?
    Place: "place",
    PromoteOne: "promoteOne",
    PromoteThree: "promoteThree",
    PromoteOneOrThree: "promoteOneOrThree",
    Win: "win"
}

class UI {
    #cells;
    #board = document.getElementById("board");
    #status = document.getElementById("status");
    #restart = document.getElementById("restart");
    #game;
    #boardSize;
    #selectedPiece = null;

    // --------------------------------------- INITIALIZERS ---------------------------------------

    constructor(game) {
        this.#game = game;
        this.#boardSize = game.getBoardSize();
        this.createBoard();
        this.#cells = document.querySelectorAll(".cell");
        this.#restart.addEventListener("click", () => {this.restartClickHandler()});
        this.renderAll();
    }

    createBoard() {
        this.#board.style.gridTemplateColumns = `repeat(${this.#boardSize}, 100px)`;
        let cellIndex = 0;
        while(cellIndex < this.#boardSize * this.#boardSize) {
            const newCell = document.createElement("button");
            newCell.className = "cell";
            newCell.dataset.index = cellIndex;
            newCell.textContent = "";
            newCell.addEventListener("click", () => {this.cellClickHandler(newCell)})
            this.#board.appendChild(newCell);
            cellIndex++;
        }
    }

    // --------------------------------------------------------------------------------------------

    // ------------------------------------------ HELPERS -----------------------------------------

    indexToPoint(index) {
        const row = Math.floor(index / this.#boardSize);
        const col = index % this.#boardSize;
        return {row: row, col: col};
    }

    isInARow(points) {
        return this.#game.isInARow(points);
    }

    // --------------------------------------------------------------------------------------------

    // ------------------------------------- GAME CONTROLLERS -------------------------------------

    getCurrentPlayer() {return this.#game.getCurrentPlayerId()}
    getGamePhase() {return this.#game.getGamePhase()}
    gamePlace(piece, point) {this.#game.place(piece, point)}
    gamePromote(points) {this.#game.promote(points)}
    gameRestart() {this.#game.restart()}

    // --------------------------------------------------------------------------------------------

    // ----------------------------------------- RENDERERS ----------------------------------------

    renderAll() {
        this.renderBoard();
        this.renderSupplies();
        this.renderStatus();
    }

    renderBoard() {
        let cellIndex = 0;
        while(cellIndex < this.#boardSize * this.#boardSize) {
            this.renderCellIndex(cellIndex);
            cellIndex++;
        }
    }

    renderCellIndex(index) {
        const point = this.indexToPoint(index);
        this.#cells[index].textContent = this.#game.getPieceAt(point);
    }

    renderSupplies() {
        for(const playerId of this.#game.getPlayerIds()) {
            this.renderSupply(playerId);
        }
    }

    renderSupply(playerId) {
        const supply = document.getElementById(`${playerId.toLowerCase()}-supply`);
        supply.innerHTML = "";
        const playerPieces = this.#game.getPlayerSupply(playerId);
        for (let i = 0; i < playerPieces.big; i++) {
            supply.appendChild(this.makePiece(playerId));
        }
        for (let i = 0; i < playerPieces.small; i++) {
            supply.appendChild(this.makePiece(playerId.toLowerCase()));
        }
    }
    
    makePiece(piece) {
        const newPiece = document.createElement("button");
        newPiece.className = `piece ${piece}`;
        newPiece.textContent = piece;
        newPiece.addEventListener("click", () => {this.supplyPieceClickHandler(newPiece)})
        return newPiece;
    }

    renderStatus() {
        const gamePhase = this.#game.getGamePhase();
        const currentPlayer = this.#game.getCurrentPlayerId();
        if (gamePhase === PHASES.Win) {
            this.#status.textContent = `Player ${currentPlayer} wins!`;
        } else if (gamePhase === PHASES.Place) {
            this.#status.textContent = `Player ${currentPlayer}'s turn`;
        } else {
            if (gamePhase === PHASES.PromoteOne) {
                this.#status.textContent = `Player ${currentPlayer}: Select a piece to promote`;
            } else if (gamePhase === PHASES.PromoteThree) {
                this.#status.textContent = `Player ${currentPlayer}: Select three in a row to promote`;
            } else if (gamePhase === PHASES.PromoteOneOrThree) {
                this.#status.textContent = `Player ${currentPlayer}: Select a piece or three in a row to promote`;
            }
            let button = document.createElement("button");
            button.textContent = "Select";
            button.addEventListener("click", () => {this.promoteSelectionHandler();})
            this.#status.appendChild(button);
        }
    }

    // --------------------------------------------------------------------------------------------

    // -------------------------------------- EVENT HANDLERS --------------------------------------

    cellClickHandler(cell) {
        if (this.getGamePhase() === PHASES.Win) return;
        if (this.getGamePhase() === PHASES.Place) {
            this.placeCellClickHandler(cell);
            return;
        }
        this.promoteCellClickHandler(cell);
    }

    placeCellClickHandler(cell) {
        if (!this.#selectedPiece || cell.textContent) return;
        const piece = this.#selectedPiece.textContent;
        const point = this.indexToPoint(cell.dataset.index);
        this.gamePlace(piece, point);
        document.querySelectorAll(".piece.selected").forEach(p => p.classList.remove("selected"));
        this.#selectedPiece = null;
        this.renderAll();
    }

    promoteCellClickHandler(cell) {
        if (cell.classList.contains("selected")) {
            cell.classList.remove("selected");
            return;
        }

        const maxSelected = this.getGamePhase() === PHASES.PromoteOne ? 1 : 3;
        const selectedCells = document.querySelectorAll(".cell.selected");

        if (cell.textContent.toUpperCase() === this.getCurrentPlayer() && selectedCells.length < maxSelected) {
            cell.classList.add("selected");
        }
    }

    promoteSelectionHandler() {
        const selectedCells = [...document.querySelectorAll(".cell.selected")];
        const gamePhase = this.getGamePhase();
        if (gamePhase === PHASES.PromoteOne && selectedCells.length !== 1) return;
        if (gamePhase === PHASES.PromoteThree && selectedCells.length !== 3) return;
        if (gamePhase === PHASES.PromoteOneOrThree && selectedCells.length !== 3 && selectedCells.length !== 1) return;
        
        const points = selectedCells.map((cell) => this.indexToPoint(cell.dataset.index));
        if ((points.length === 3 && this.isInARow(points)) || points.length === 1) {
            this.gamePromote(points);
            selectedCells.forEach((cell) => cell.classList.remove("selected"));
            this.renderAll();
        }
    }

    supplyPieceClickHandler(piece) {
        if (this.#game.getGamePhase() === PHASES.Place && 
            this.#game.getCurrentPlayerId() === piece.textContent.toUpperCase()) {
                document.querySelectorAll(".piece.selected").forEach(p => p.classList.remove("selected"));
                piece.classList.add("selected");
                this.#selectedPiece = piece;
        }
    }

    restartClickHandler() {
        this.gameRestart();
        document.querySelectorAll(".piece.selected").forEach(p => p.classList.remove("selected"));
        document.querySelectorAll(".cell.selected").forEach(c => c.classList.remove("selected"));
        this.#selectedPiece = null;
        this.renderAll();
    }

    // --------------------------------------------------------------------------------------------
}
export default UI;