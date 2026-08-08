import { PHASES } from "./constants.js";

class LocalController {
    #game;
    #reqSuccess = () => {};
    #reqFailure = () => {};
    constructor(game) {
        this.#game = game;
    }

    // ----------------------------------------- GETTERS ------------------------------------------

    getControllerPlayer() {
        return this.#game.getCurrentPlayerId();
    }

    getGameState() {
        return this.#game.getState();
    }

    getBoardSize() {
        return this.#game.getBoardSize();
    }

    getPieceAt(point) {
        return this.#game.getPieceAt(point);
    }

    getCurrentPlayer() {
        return this.#game.getCurrentPlayerId();
    }

    getGamePhase() {
        return this.#game.getGamePhase();
    }

    getPlayerIds() {
        return this.#game.getPlayerIds();
    }

    getPlayerSupply(playerId) {
        return this.#game.getPlayerSupply(playerId);
    }

    getStatusMessage() {
        let message;
        let needsPromoteButton = false;
        const gamePhase = this.#game.getGamePhase();
        const currentPlayer = this.#game.getCurrentPlayerId();
        if (gamePhase === PHASES.Win) {
            message = `Player ${currentPlayer} wins!`;
        } else if (gamePhase === PHASES.Place) {
            message = `Player ${currentPlayer}'s turn`;
        } else {
            if (gamePhase === PHASES.PromoteOne) {
                message = `Player ${currentPlayer}: select a piece to promote`;
            } else if (gamePhase === PHASES.PromoteThree) {
                message = `Player ${currentPlayer}: select three in a row to promote`;
            } else if (gamePhase === PHASES.PromoteOneOrThree) {
                message = `Player ${currentPlayer}: select one piece or three in a row to promote`;
            }
            needsPromoteButton = true;
        }
        return {message, needsPromoteButton};
    }

    // --------------------------------------------------------------------------------------------

    // ------------------------------------- NOTIFIER SETTERS -------------------------------------

    setGameStateChangedNotifier(f) {
        this.#game.setStateChangedNotifier(f);
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
        const success = this.#game.place(piece, point);
        if (success) {
            this.#reqSuccess();
        } else {
            this.#reqFailure();
        }
    }

    promote(points) {
        const success = this.#game.promote(points);
        if (success) {
            this.#reqSuccess();
        } else {
            this.#reqFailure();
        }
    }

    restart() {
        this.#game.restart();
    }

    // --------------------------------------------------------------------------------------------
}
export default LocalController;