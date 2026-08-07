import express from "express";
import Game from './game.js';
import path from "path";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

const serverGame = new Game(2, 6);
serverGame.setStateChangedNotifier(() => {
    io.emit("gameStateChanged", serverGame.getGameState());
});

const PLAYER_IDS = ["X", "O"];
const players = {
    "X": null,
    "O": null
};

function assignPlayer(socket) {
    for (const playerId of PLAYER_IDS) {
        if (!players[playerId]) {
            players[playerId] = socket.id;
            return playerId;
        }
    }
    return null;
}

io.on("connection", (socket) => {
    console.log(`${socket.id} connected!`);

    const playerId = assignPlayer(socket);
    socket.data.playerId = playerId;
    // TODO: Make a socket.emit("initialize", ...) that lumps assignPlayer and gameStateChanged together
    //       Handle player assignment and game state initialization at once.
    socket.emit("initialize", {
        assignedPlayerId: playerId,
        gameState: serverGame.getGameState()
    });
    if (playerId) {
        console.log(`${socket.id} assigned as Player ${playerId}.`);
    } else {
        console.log(`${socket.id} assigned as spectator.`);
    }

    socket.on("place", (move) => {
        const {piece, point} = move;
        // Check that piece belongs to player.
        // This might be better off somewhere else at some point.
        if (socket.data.playerId !== piece.toUpperCase()) {
            socket.emit("reqFailure");
            return;
        }
        const success = serverGame.place(piece, point);
        if (success) {
            socket.emit("reqSuccess");
        } else {
            socket.emit("reqFailure");
        }
    })

    socket.on("promote", (promotion) => {
        const {points} = promotion;
        // Check that pieces at all points belong to player
        // This might be better off somewhere else at some point.
        for (const point of points) {
            const piece = serverGame.getPieceAt(point);
            if (socket.data.playerId !== piece.toUpperCase()) {
                socket.emit("reqFailure");
                return;
            }
        }
        const success = serverGame.promote(points);
        if (success) {
            socket.emit("reqSuccess");
        } else {
            socket.emit("reqFailure");
        }
    })

    socket.on("restart", () => {
        // Make sure request came from an actual player. Spectators cannot restart.
        // This might be better off somewhere else at some point.
        if (socket.data.playerId) {
            serverGame.restart();
        }
    })

    socket.on("disconnect", () => {
        if (socket.data.playerId) {
            players[socket.data.playerId] = null;
        }

        console.log(`${socket.id} disconnected.`);
    });
});

app.get(["/online", "/local"], (req, res) => {
    res.sendFile(path.join(__dirname, "game.html"));
})

server.listen(3000, () => {
    console.log("Server running on port 3000");
})