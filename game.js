import Board from './board.js';
import Player from './player.js';
import { PHASES } from "./constants.js";

const PLAYER_IDS = ["X", "O", "C", "Z", "S", "V"];

class Game {
    #numPlayers;
    #board;
    #players;
    #gamePhase;
    #currentPlayer;
    #notifyStateChanged = () => {};
    constructor(numPlayers = 2, boardSize = 6) {
        this.#numPlayers = numPlayers;
        this.#players = {};
        for (let i = 0; i < numPlayers; i++) {
            this.#players[PLAYER_IDS[i]] = new Player(PLAYER_IDS[i]);
        }
        this.#board = new Board(boardSize);
        this.#currentPlayer = 0;
        this.#gamePhase = PHASES.Place;
    }

    setStateChangedNotifier(f) {
        this.#notifyStateChanged = f;
    }

    // ----------------------------------------- GETETERS -----------------------------------------

    getGameState() {
        const statePlayers = {};
        for (const player of this.getPlayerIds()) {
            statePlayers[player] = this.getPlayerSupply(player);
        }

        return {
            board: this.#board.getBoard(),
            currentPlayer: PLAYER_IDS[this.#currentPlayer],
            gamePhase: this.#gamePhase,
            players: statePlayers
        };
    }

    getBoardSize() {return this.#board.getSize();}
    getCurrentPlayerId() {return PLAYER_IDS[this.#currentPlayer]}
    getGamePhase() {return this.#gamePhase}

    getPieceAt(point) {
        return this.#board.getPieceAt(point);
    }

    getPlayerIds() {
        return Object.keys(this.#players);
    }

    getPlayerSupply(playerId) {
        const player = this.#players[playerId];
        return {big: player.getBigPieces(), small: player.getSmallPieces()};
    }

    // --------------------------------------------------------------------------------------------

    // ---------------------------------------- VALIDATORS ----------------------------------------

    isValidPlacement(piece, point) {
        // Condition 1: Piece belongs to current player
        // Condition 2: The selected point on the board is empty
        // Condition 3: The current player has the selected piece in their supply
        return piece.toUpperCase() === this.getCurrentPlayerId() && this.getPieceAt(point) === "" &&
               this.#players[this.getCurrentPlayerId()].hasPiece(piece);
    }

    numPointsMatchesGamePhase(points) {
        if (this.#gamePhase === PHASES.PromoteOne) {
            return points.length === 1;
        } else if (this.#gamePhase === PHASES.PromoteThree) {
            return points.length === 3;
        } else if (this.#gamePhase === PHASES.PromoteOneOrThree) {
            return points.length === 1 || points.length === 3;
        }
        return false;
    }

    piecesAllBelongToCurrentPlayer(points) {
        return points.every((point) => {
            return this.getPieceAt(point).toUpperCase() === this.getCurrentPlayerId();
        });
    }

    isInARow(points) {
        if (points.length === 1) return true;
        return this.#board.isInARow(points);
    }

    isValidPromotion(points) {
        return this.numPointsMatchesGamePhase(points) && this.piecesAllBelongToCurrentPlayer(points) &&
               this.isInARow(points);
    }

    // --------------------------------------------------------------------------------------------

    // ------------------------------------------ HELPERS -----------------------------------------

    returnToSupply(piece) {
        this.#players[piece.toUpperCase()].addToSupply(piece);
    }

    updateGamePhase() {
        const {threes, bigCounter, supplyEmpty} = this.#board.getBoardStatus(this.getCurrentPlayerId());
        if (bigCounter === 8) {
            this.#gamePhase = PHASES.Win;
            return;
        }
        for (const three of threes) {
            const [piece1, piece2, piece3] = [this.getPieceAt(three[0]), this.getPieceAt(three[1]), this.getPieceAt(three[2])];
            if (piece1 === this.getCurrentPlayerId() && piece1 === piece2 && piece1 === piece3) {
                this.#gamePhase = PHASES.Win;
                return;
            }
        }
        if (threes.length >= 1 && supplyEmpty) {
            this.#gamePhase = PHASES.PromoteOneOrThree;
            return;
        } else if (supplyEmpty) {
            this.#gamePhase = PHASES.PromoteOne;
            return;
        } else if (threes.length > 1) {
            this.#gamePhase = PHASES.PromoteThree;
            return;
        } else if (threes.length === 1) {
            for (const point of threes[0]) {
                const promotedPiece = this.getPieceAt(point).toUpperCase();
                this.#board.remove(point);
                this.#players[promotedPiece].addToSupply(promotedPiece);
            }
        }
        this.#gamePhase = PHASES.Place;
        this.#currentPlayer = (this.#currentPlayer + 1) % this.#numPlayers;
    }

    // --------------------------------------------------------------------------------------------

    // -------------------------------------- GAME OPERATIONS -------------------------------------

    place(piece, point) {
        if (!this.isValidPlacement(piece, point)) return false;
        this.#players[piece.toUpperCase()].takeFromSupply(piece);
        const fallenPieces = this.#board.place(piece, point);
        for (const fallenPiece of fallenPieces) {
            this.returnToSupply(fallenPiece);
        }
        this.updateGamePhase();
        this.#notifyStateChanged();
        return true;
    }

    promote(points) {
        if (!this.isValidPromotion(points)) return false;
        for (const point of points) {
            const promotedPiece = this.getPieceAt(point).toUpperCase();
            this.#board.remove(point);
            this.#players[promotedPiece].addToSupply(promotedPiece);
        }
        this.#currentPlayer = (this.#currentPlayer + 1) % this.#numPlayers; 
        this.#gamePhase = PHASES.Place;
        this.#notifyStateChanged();
        return true;
    }

    restart() {
        this.#board.clearBoard();
        for (let i = 0; i < this.#numPlayers; i++) {
            this.#players[PLAYER_IDS[i]].resetSupply();
        }
        this.#currentPlayer = 0;
        this.#gamePhase = PHASES.Place;
        this.#notifyStateChanged();
    }

    // --------------------------------------------------------------------------------------------
}
export default Game;