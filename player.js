class Player {
    #id;
    #supply = {};
    constructor(id) {
        this.#id = id.toUpperCase();
        this.#supply[id.toLowerCase()] = 8;
        this.#supply[id.toUpperCase()] = 0;
    }

    getPlayerId() {return this.#id;}
    getSmallPieces() {return this.#supply[this.#id.toLowerCase()];}
    getBigPieces() {return this.#supply[this.#id];}

    takeFromSupply(piece) {
        if (piece.toUpperCase() !== this.#id) {
            throw new Error(`Invalid Call: Piece ${piece} does not belong to Player ${this.#id}`);
        }
        this.#supply[piece]--;
    }

    addToSupply(piece) {
        if (piece.toUpperCase() !== this.#id) {
            throw new Error(`Invalid Call: Piece ${piece} does not belong to Player ${this.#id}`);
        }
        this.#supply[piece]++;
    }

    resetSupply() {
        this.#supply[this.#id.toLowerCase()] = 8;
        this.#supply[this.#id] = 0;
    }
}
export default Player;