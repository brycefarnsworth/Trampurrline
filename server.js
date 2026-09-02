import express from "express";
import GameManager from './game-manager.js';
import path from "path";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.json());
app.use(express.static(__dirname));

const gameManager = new GameManager(io);

io.on("connection", (socket) => {
    const { gameId } = socket.handshake.auth;

    const connected = gameManager.connectUser(socket, gameId);

    if (!connected) {
        socket.disconnect();
        return;
    }

    console.log(`${socket.id} connected!`);

    const playerId = gameManager.getSocketPlayerId(socket);

    socket.emit("initialize", {
        assignedPlayerId: playerId,
        gameState: gameManager.getGameState(gameId)
    });

    if (playerId !== "spectator") {
        console.log(`${socket.id} assigned as Player ${playerId}.`);
    } else {
        console.log(`${socket.id} assigned as spectator.`);
    }

    socket.on("place", (move) => {
        const { piece, point } = move;
        
        gameManager.requestMove(socket, piece, point);
    });

    socket.on("promote", (promotion) => {
        const { points } = promotion;
        
        gameManager.requestPromote(socket, points);
    });

    socket.on("restart", () => {
        gameManager.requestRestart(socket);
    });

    socket.on("disconnect", () => {
        gameManager.disconnectUser(socket);

        console.log(`${socket.id} disconnected.`);
    });
});

app.get("/play", (req, res) => {
    res.sendFile(path.join(__dirname, "lobby.html"));
});

app.get("/local", (req, res) => {
    res.sendfile(path.join(__dirname, "game.html"));
});

app.get("/play/:gameId", (req, res) => {
    const { gameId } = req.params;

    if (!gameManager.gameExists(gameId)) {
        return res.redirect("/play");
    }
    
    res.sendFile(path.join(__dirname, "game.html"));
});

app.get("/api/games", (req, res) => {
    const gameList = gameManager.getGameList();
    res.json(gameList);
});

app.post("/api/games", (req, res) => {
    const newGameId = gameManager.createGame(req.body);
    res.json(newGameId);
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});