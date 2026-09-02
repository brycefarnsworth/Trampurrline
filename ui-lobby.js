class LobbyUI {
    constructor() {
        const createGameButton = document.getElementById("create-game");
        createGameButton.addEventListener("click", () => {
            this.createGameHandler();
        });

        const refreshButton = document.getElementById("refresh");
        refreshButton.addEventListener("click", () => {
            this.loadAndRenderGameList();
        });

        this.loadAndRenderGameList();
    }

    createGameHandler() {
        // TODO: Open a modal to let the user choose game settings
        this.confirmCreateGameHandler({numPlayers: 2, boardSize: 6});
    }

    async confirmCreateGameHandler(newGameSettings) {
        const response = await fetch("/api/games",{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newGameSettings)
        });

        if (!response.ok) {
            console.error("Request failed", response.status);
            return;
        }

        const newGameId = await response.json();
        window.location.href = `/play/${newGameId}`;
    }

    joinGameHandler(gameId) {
        window.location.href = `/play/${gameId}`;
    }

    async loadAndRenderGameList() {
        const response = await fetch("/api/games");

        if (!response.ok) {
            console.error("Request failed", response.status);
            return;
        }

        const gameList = await response.json();
        this.renderGameList(gameList);
    }

    renderGameList(gameList) {
        const docList = document.getElementById("game-list");
        docList.innerHTML = "";
        for (const game of gameList) {
            const newLI = document.createElement("li");
            newLI.textContent = `Game ${game.gameId} - ${game.players}/${game.maxPlayers}`;
            const joinGameButton = document.createElement("button");
            joinGameButton.textContent = "Join Game";
            joinGameButton.addEventListener("click", () => {
                this.joinGameHandler(game.gameId);
            });
            newLI.appendChild(joinGameButton);
            docList.appendChild(newLI);
        }
    }
}

new LobbyUI();