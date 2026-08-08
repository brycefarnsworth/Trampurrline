import { PHASES } from "./constants.js";

class UI {
    #controller;
    #cells;
    #board = document.getElementById("board");
    #status = document.getElementById("status");
    #restart = document.getElementById("restart");
    #selectedPiece = null;

    // --------------------------------------- INITIALIZERS ---------------------------------------

    constructor(controller) {
        this.#controller = controller;
        this.createBoard();
        this.#cells = document.querySelectorAll(".cell");
        this.#restart.addEventListener("click", () => {this.restartClickHandler()});
        this.#controller.setGameStateChangedNotifier(() => {
            this.renderAll();
        })
        this.#controller.setReqSuccessNotifier(() => {
            document.querySelectorAll(".piece.selected").forEach(p => p.classList.remove("selected"));
            document.querySelectorAll(".cell.selected").forEach(c => c.classList.remove("selected"));
            this.#selectedPiece = null;
        })
        this.#controller.setReqFailureNotifier(() => {
            return; // Do nothing. Eventually might want to change to give an error message.
        })
        this.renderAll();
    }

    createBoard() {
        const boardSize = this.#controller.getBoardSize();
        this.#board.style.gridTemplateColumns = `repeat(${boardSize}, 100px)`;
        for (let i = 0; i < boardSize * boardSize; i++) {
            const newCell = document.createElement("button");
            newCell.className = "cell";
            newCell.dataset.index = i;
            newCell.textContent = "";
            newCell.addEventListener("click", () => {this.cellClickHandler(newCell)})
            this.#board.appendChild(newCell);
        }
    }

    // --------------------------------------------------------------------------------------------

    // ------------------------------------------ HELPERS -----------------------------------------

    indexToPoint(index) {
        const boardSize = this.#controller.getBoardSize();
        const row = Math.floor(index / boardSize);
        const col = index % boardSize;
        return {row: row, col: col};
    }

    // --------------------------------------------------------------------------------------------

    // ------------------------------------- GAME CONTROLLERS -------------------------------------

    controllerPlace(piece, point) {this.#controller.place(piece, point)}
    controllerPromote(points) {this.#controller.promote(points)}
    controllerRestart() {this.#controller.restart()}

    // --------------------------------------------------------------------------------------------

    // ----------------------------------------- RENDERERS ----------------------------------------

    renderAll() {
        this.renderBoard();
        this.renderSupplies();
        this.renderStatus();
    }

    renderBoard() {
        for (let i = 0; i < this.#cells.length; i++) {
            this.renderCellIndex(i);
        }
    }

    renderCellIndex(index) {
        const point = this.indexToPoint(index);
        this.#cells[index].textContent = this.#controller.getPieceAt(point);
    }

    renderSupplies() {
        for(const playerId of this.#controller.getPlayerIds()) {
            this.renderSupply(playerId);
        }
    }

    renderSupply(playerId) {
        const supply = document.getElementById(`${playerId.toLowerCase()}-supply`);
        supply.innerHTML = "";
        const playerPieces = this.#controller.getPlayerSupply(playerId);
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
        const {message, needsPromoteButton} = this.#controller.getStatusMessage();
        this.#status.textContent = message;
        if (needsPromoteButton) {
            const button = document.createElement("button");
            button.textContent = "Select";
            button.addEventListener("click", () => {this.promoteSelectionHandler();})
            this.#status.appendChild(button);
        }
    }

    // --------------------------------------------------------------------------------------------

    // -------------------------------------- EVENT HANDLERS --------------------------------------

    cellClickHandler(cell) {
        if (this.#controller.getGamePhase() === PHASES.Win) return;
        if (this.#controller.getGamePhase() === PHASES.Place) {
            this.placeCellClickHandler(cell);
            return;
        }
        this.promoteCellClickHandler(cell);
    }

    placeCellClickHandler(cell) {
        if (!this.#selectedPiece) return;
        const piece = this.#selectedPiece.textContent;
        const point = this.indexToPoint(cell.dataset.index);
        this.controllerPlace(piece, point);
    }

    promoteCellClickHandler(cell) {
        if (cell.classList.contains("selected")) {
            cell.classList.remove("selected");
            return;
        }

        const maxSelected = this.#controller.getGamePhase() === PHASES.PromoteOne ? 1 : 3;
        const selectedCells = document.querySelectorAll(".cell.selected");

        if (cell.textContent.toUpperCase() === this.#controller.getControllerPlayer() &&
            selectedCells.length < maxSelected) {
            cell.classList.add("selected");
        }
    }

    promoteSelectionHandler() {
        const selectedCells = [...document.querySelectorAll(".cell.selected")];

        const points = selectedCells.map((cell) => this.indexToPoint(cell.dataset.index));
        this.controllerPromote(points);
    }

    supplyPieceClickHandler(piece) {
        if (this.#controller.getGamePhase() === PHASES.Place && 
            this.#controller.getControllerPlayer() === piece.textContent.toUpperCase() &&
            this.#controller.getControllerPlayer() === this.#controller.getCurrentPlayer()) {
                document.querySelectorAll(".piece.selected").forEach(p => p.classList.remove("selected"));
                piece.classList.add("selected");
                this.#selectedPiece = piece;
        }
    }

    restartClickHandler() {
        this.controllerRestart();
        document.querySelectorAll(".piece.selected").forEach(p => p.classList.remove("selected"));
        document.querySelectorAll(".cell.selected").forEach(c => c.classList.remove("selected"));
        this.#selectedPiece = null;
    }

    // --------------------------------------------------------------------------------------------
}
export default UI;