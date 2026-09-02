import OnlineController from './controller-online.js';
import UI from './ui.js';

const gameId = window.location.pathname.slice("/play/".length);

const socket = io({
    auth: { gameId }
});

const controller = new OnlineController(socket);
await controller.waitForInitialization();
const ui = new UI(controller);