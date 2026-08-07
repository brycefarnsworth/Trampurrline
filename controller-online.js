import { PHASES } from "./constants.js";

class OnlineController {
    #socket;
    #playerId;
    #gameState;
    #gameStateChanged = () => {};
    #reqSuccess = () => {};
    #reqFailure = () => {};
    constructor(socket) {
        this.#socket = socket;

        this.#socket.on("gameStateChanged", (gameState) => {
            this.#gameState = gameState;
            this.#gameStateChanged();
        });
        this.#socket.on("reqSuccess", () => {
            this.#reqSuccess();
        });
        this.#socket.on("reqFailure", () => {
            this.#reqFailure();
        });
    }

    waitForInitialization() {
        return new Promise((resolve) => {
            this.#socket.once("initialize", (initData) => {
                this.#playerId = initData.assignedPlayerId;
                this.#gameState = initData.gameState;

                resolve();
            });
        });
    }

    // ----------------------------------------- GETTERS ------------------------------------------

    getControllerPlayer() {
        return this.#playerId;
    }

    getGameState() {
        return this.#gameState;
    }

    getBoardSize() {
        return this.#gameState.board.length;
    }

    getPieceAt(point) {
        return this.#gameState.board[point.row][point.col];
    }

    getCurrentPlayer() {
        return this.#gameState.currentPlayer;
    }

    getGamePhase() {
        return this.#gameState.gamePhase;
    }

    getPlayerIds() {
        return Object.keys(this.#gameState.players);
    }

    getPlayerSupply(playerId) {
        return this.#gameState.players[playerId];
    }

    getStatusMessage() {
        let message;
        let needsPromoteButton = false;
        const gamePhase = this.#gameState.gamePhase;
        const currentPlayer = this.#gameState.currentPlayer;
        const isMyTurn = currentPlayer === this.#playerId;
        if (gamePhase === PHASES.Win) {
            if (isMyTurn) {
                message = `You win!`;
            } else {
                message = `Player ${currentPlayer} wins!`;
            }
        } else if (gamePhase === PHASES.Place) {
            if (isMyTurn) {
                message = `Your turn`;
            } else {
                message = `Player ${currentPlayer}'s turn`;
            }
        } else {
            if (gamePhase === PHASES.PromoteOne) {
                if (isMyTurn) {
                    message = `Select a piece to promote`;
                } else {
                    message = `Player ${currentPlayer} is selecting a piece to promote`;
                }
            } else if (gamePhase === PHASES.PromoteThree) {
                if (isMyTurn) {
                    message = `Select three in a row to promote`;
                } else {
                    message = `Player ${currentPlayer} is selecting three in a row to promote`;
                }
            } else if (gamePhase === PHASES.PromoteOneOrThree) {
                if (isMyTurn) {
                    message = `Select one piece or three in a row to promote`;
                } else {
                    message = `Player ${currentPlayer} is selecting one or more pieces to promote`;
                }
            }
            if (isMyTurn) needsPromoteButton = true;
        }
        return {message, needsPromoteButton};
    }

    // --------------------------------------------------------------------------------------------

    // ------------------------------------- NOTIFIER SETTERS -------------------------------------

    setGameStateChangedNotifier(f) {
        this.#gameStateChanged = f;
    }

    setReqSuccessNotifier(f) {
        this.#reqSuccess = f;
    }

    setReqFailureNotifier(f) {
        this.#reqFailure = f;
    }

    // --------------------------------------------------------------------------------------------

    // -------------------------------------- GAME INTERFACE --------------------------------------

    place(piece, point) {
        this.#socket.emit("place", {piece, point});
    }

    promote(points) {
        this.#socket.emit("promote", {points});
    }

    restart() {
        this.#socket.emit("restart");
    }

    // --------------------------------------------------------------------------------------------
}
export default OnlineController;