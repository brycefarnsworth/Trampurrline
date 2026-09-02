import Game from "./game.js";

class GameManager {
    #io;
    #games = new Map();
    #sockets = new Map();
    constructor(io) {
        this.#io = io;
    }

    // ------------------------------------------ HELPERS -----------------------------------------

    generateGameId() {
        let gameId;

        do {
            gameId = Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();
        } while (this.#games.has(gameId));

        return gameId;
    }

    gameExists(gameId) {
        return this.#games.has(gameId);
    }

    getSocketGame(socket) {
        const socketGameId = this.#sockets.get(socket.id).gameId;
        return this.#games.get(socketGameId);
    }

    getSocketPlayerId(socket) {
        return this.#sockets.get(socket.id).playerId;
    }

    getGameState(gameId) {
        return this.#games.get(gameId).getGameState();
    }

    getNewPlayerAssignment(gameId) {
        const socketIds = this.#io.sockets.adapter.rooms.get(gameId) ?? [];

        const playerIds = {
            X: null,
            O: null
        };

        for (const socketId of socketIds) {
            let playerId = this.#sockets.get(socketId).playerId;

            if (playerId === "X" || playerId === "O") {
                playerIds[playerId] = socketId;
            }
        }
        
        if (!playerIds.X) return "X";
        if (!playerIds.O) return "O";
        return "spectator";
    }

    getGameList() {
        const gameList = [];

        for (const [gameId, game] of this.#games) {
            const g = {
                gameId,
                maxPlayers: game.getPlayerIds().length,
                players: 0
            };

            for (const socketId of this.#io.sockets.adapter.rooms.get(gameId)) {
                if (this.#sockets.get(socketId).playerId !== "spectator") {
                    g.players++;
                }
            }

            gameList.push(g);
        }

        return gameList;
    }

    // --------------------------------------------------------------------------------------------

    // -------------------------- CREATE, CONNECT, DISCONNECT, AND DELETE -------------------------

    createGame(gameSettings) {
        const newGame = new Game(gameSettings.numPlayers, gameSettings.boardSize);
        const newGameId = this.generateGameId();

        newGame.setStateChangedNotifier(() => {
            this.#io.to(newGameId).emit("gameStateChanged", newGame.getGameState());
        });

        this.#games.set(newGameId, newGame);

        return newGameId;
    }

    connectUser(socket, gameId) {
        const game = this.#games.get(gameId);
        
        if (!game) {
            return false;
        }

        const playerId = this.getNewPlayerAssignment(gameId);

        this.#sockets.set(socket.id, {gameId, playerId});
        socket.join(gameId);

        return true;
    }

    disconnectUser(socket) {
        const { gameId } = this.#sockets.get(socket.id);

        this.#sockets.delete(socket.id);
        
        const socketIds = this.#io.sockets.adapter.rooms.get(gameId);

        if (!socketIds || socketIds.size === 0) {
            this.closeGame(gameId);
        }
    }

    closeGame(gameId) {
        this.#games.delete(gameId);
    }

    // --------------------------------------------------------------------------------------------

    // ------------------------------------- GAME INTERFACING -------------------------------------

    requestMove(socket, piece, point) {
        const game = this.getSocketGame(socket);

        if (!game) {
            socket.emit("reqFailure");
            return false;
        }

        // Check that piece belongs to player.
        if (this.#sockets.get(socket.id).playerId !== piece.toUpperCase()) {
            socket.emit("reqFailure");
            return false;
        }

        const success = game.place(piece, point);
        if (success) {
            socket.emit("reqSuccess");
        } else {
            socket.emit("reqFailure");
        }
        return success;
    }

    requestPromote(socket, points) {
        const game = this.getSocketGame(socket);

        if (!game) {
            socket.emit("reqFailure");
            return false;
        }

        // Check that all points selected belong to player.
        for (const point of points) {
            const piece = game.getPieceAt(point);
            if (this.#sockets.get(socket.id).playerId !== piece.toUpperCase()) {
                socket.emit("reqFailure");
                return false;
            }
        }

        const success = game.promote(points);
        if (success) {
            socket.emit("reqSuccess");
        } else {
            socket.emit("reqFailure");
        }
        return success;
    }

    requestRestart(socket) {
        const game = this.getSocketGame(socket);

        if (!game) {
            socket.emit("reqFailure");
            return false;
        }
        
        // Only players can restart the game.
        if (this.#sockets.get(socket.id).playerId === "spectator") return false;

        game.restart();

        return true;
    }

    // --------------------------------------------------------------------------------------------
}
export default GameManager;