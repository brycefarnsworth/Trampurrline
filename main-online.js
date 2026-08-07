import OnlineController from './controller-online.js';
import UI from './ui.js';

const socket = io();
const controller = new OnlineController(socket);
await controller.waitForInitialization();
const ui = new UI(controller);