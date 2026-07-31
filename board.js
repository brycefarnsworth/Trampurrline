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

function addPointAndDirection(point, direction) {
    return {row: point.row + direction.y, col: point.col + direction.x};
}


function getThreePointsInDirection(point, direction) {
    let p1 = point;
    let p2 = addPointAndDirection(p1, direction);
    let p3 = addPointAndDirection(p2, direction);
    return [p1, p2, p3];
}

function canBump(p1, p2) {
    return p1 === p1.toUpperCase() || p2 === p2.toLowerCase();
}

class Board {
    #size;
    #board;
    constructor(size) {
        this.#size = size;
        this.#board = new Array(size).fill("").map(() => new Array(size).fill(""));
    }

    getSize() {return this.#size;}

    getPieceAt(point) {return this.#board[point.row][point.col];}

    isOnBoard(point) {
        return point.row >= 0 && point.row < this.#size && point.col >= 0 && point.col < this.#size;
    }

    isInARow(points) {
        const [p1, p2, p3] = points;
        const dir = {y: p2.row - p1.row, x: p2.col - p1.col};
        if (Math.abs(dir.y) > 1 || Math.abs(dir.x) > 1) return false;
        let testPoint = addPointAndDirection(p2, dir);
        // Point 3 should be the next point in the same direction as Point 1 to Point 2.
        return testPoint.row === p3.row && testPoint.col === p3.col;
    }

    clearBoard() {
        for (const row of this.#board) {
            row.fill("");
        }
    }

    // ------------------------------- MOVING, PLACING, AND BUMPING -------------------------------

    remove(point) {
        this.#board[point.row][point.col] = "";
    }
    
    move(p1, p2) {
        let piece = this.getPieceAt(p1);
        this.#board[p2.row][p2.col] = piece;
        this.remove(p1);
    }

    place(piece, point) {
        this.#board[point.row][point.col] = piece;
        return this.bumpAdjacent(piece, point);
    }

    bumpAdjacent(piece, point) {
        const fallenPieces = [];
        for (const direction of Object.values(DIRECTIONS)) {
            let bumpedPoint = addPointAndDirection(point, direction);
            let fallenPiece = this.bump(piece, bumpedPoint, direction);
            if (fallenPiece) fallenPieces.push(fallenPiece);
        }
        return fallenPieces;
    }

    bump(bumperPiece, point, dir) {
        if (!this.isOnBoard(point)) return null; // Off board. Do nothing.
        let bumpedPiece = this.getPieceAt(point);
        if (!bumpedPiece) return null; // No piece to bump. Do nothing.
        if (!canBump(bumperPiece, bumpedPiece)) return null; // Piece cannot be bumped. Do nothing.
        let targetPoint = addPointAndDirection(point, dir);
        if (!this.isOnBoard(targetPoint)) {
            // Piece bumped off board.
            this.remove(point);
            return bumpedPiece;
        }
        if (this.getPieceAt(targetPoint)) return null; // The target point is already occupied. Do nothing.
        // After all these checks, we are assured the target point is on the board and empty.
        this.move(point, targetPoint);
        return null;
    }

    // --------------------------------------------------------------------------------------------

    // --------------------------------------- BOARD STATUS ---------------------------------------

    getThreesFromPoint(point) {
        let threes = [];
        let directionsToCheck = [
            DIRECTIONS["RIGHT"],
            DIRECTIONS["DOWN-LEFT"],
            DIRECTIONS["DOWN"],
            DIRECTIONS["DOWN-RIGHT"]
        ];
        
        for (const direction of directionsToCheck) {
            if (this.isThreeInARow(point, direction)) {
                threes.push(getThreePointsInDirection(point, direction))
            }
        }
        
        return threes;
    }

    isThreeInARow(point, direction) {
        // Can't make three in a row if it's too close to an edge.
        if ((point.row > (this.#size - 3) && direction.y === 1) ||
            (point.col < 2 && direction.x === -1) ||
            (point.col > (this.#size - 3) && direction.x === 1)
        ) return false;
        
        let p1 = point;
        let p2 = addPointAndDirection(point, direction);
        let p3 = addPointAndDirection(p2, direction);
        
        if (this.getPieceAt(p1).toUpperCase() === this.getPieceAt(p2).toUpperCase() &&
            this.getPieceAt(p1).toUpperCase() === this.getPieceAt(p3).toUpperCase()
        ) return true;
        
        return false;
    }

    getBoardStatus(currentPlayer) {
        let threes = [];
        let smallCounter = 0;
        let bigCounter = 0;
        
        for (let i = 0; i < this.#size; i++) {
            for (let j = 0; j < this.#size; j++) {
                let point = {row: i, col: j};
                let piece = this.getPieceAt(point);
                if (piece.toUpperCase() !== currentPlayer) continue;
                piece === currentPlayer ? bigCounter++ : smallCounter++;
                let threesFromPoint = this.getThreesFromPoint(point);
                threes.push(...threesFromPoint);
            }
        }
        
        let supplyEmpty = smallCounter + bigCounter === 8;

        return {threes: threes, bigCounter: bigCounter, supplyEmpty: supplyEmpty};
    }

    // --------------------------------------------------------------------------------------------
}
export default Board;