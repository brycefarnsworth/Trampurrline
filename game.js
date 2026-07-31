import Board from './board.js';
import Player from './player.js';

const PHASES = {
    Place: "place",
    PromoteOne: "promoteOne",
    PromoteThree: "promoteThree",
    PromoteOneOrThree: "promoteOneOrThree",
    Win: "win"
}

const PLAYER_IDS = ["X", "O", "C", "Z", "S", "V"];

class Game {
    #numPlayers;
    #board;
    #players;
    #gamePhase;
    #currentPlayer;
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

    returnToSupply(piece) {
        this.#players[piece.toUpperCase()].addToSupply(piece);
    }

    isInARow(points) {
        return this.#board.isInARow(points);
    }

    place(piece, point) {
        this.#players[piece.toUpperCase()].takeFromSupply(piece);
        const fallenPieces = this.#board.place(piece, point);
        for (const fallenPiece of fallenPieces) {
            this.returnToSupply(fallenPiece);
        }
        this.updateGamePhase();
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
            this.promote(threes[0]);
            return;
        }
        this.#gamePhase = PHASES.Place;
        this.#currentPlayer = (this.#currentPlayer + 1) % this.#numPlayers;
    }

    promote(points) {
        for (const point of points) {
            const promotedPiece = this.getPieceAt(point).toUpperCase();
            this.#board.remove(point);
            this.#players[promotedPiece].addToSupply(promotedPiece);
        }
        this.#currentPlayer = (this.#currentPlayer + 1) % this.#numPlayers; 
        this.#gamePhase = PHASES.Place;
    }

    restart() {
        this.#board.clearBoard();
        for (let i = 0; i < this.#numPlayers; i++) {
            this.#players[PLAYER_IDS[i]].resetSupply();
        }
        this.#currentPlayer = 0;
        this.#gamePhase = PHASES.Place;
    }
}
export default Game;