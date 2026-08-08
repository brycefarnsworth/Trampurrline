class Player {
    #id;
    #supply = {};
    constructor(id) {
        this.#id = id.toUpperCase();
        this.#supply = {
            "big": 0,
            "small": 8
        };
    }

    getPlayerId() {return this.#id;}
    getSmallPieces() {return this.#supply["small"];}
    getBigPieces() {return this.#supply["big"];}

    getPieceSize(piece) {
        return piece === piece.toUpperCase() ? "big" : "small";
    }

    hasPiece(piece) {
        return piece.toUpperCase() === this.#id && this.#supply[this.getPieceSize(piece)] > 0;
    }

    takeFromSupply(piece) {
        if (piece.toUpperCase() !== this.#id) {
            throw new Error(`Invalid Call: Piece ${piece} does not belong to Player ${this.#id}`);
        }
        this.#supply[this.getPieceSize(piece)]--;
    }

    addToSupply(piece) {
        if (piece.toUpperCase() !== this.#id) {
            throw new Error(`Invalid Call: Piece ${piece} does not belong to Player ${this.#id}`);
        }
        this.#supply[this.getPieceSize(piece)]++;
    }

    resetSupply() {
        this.#supply["big"] = 0;
        this.#supply["small"] = 8;
    }
}
export default Player;