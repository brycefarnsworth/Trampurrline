import Game from './game.js';
import LocalController from './controller-local.js';
import UI from './ui.js';

const game = new Game(2, 6);
const controller = new LocalController(game);
const ui = new UI(controller);