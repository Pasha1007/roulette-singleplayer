import { Application, Ticker } from 'pixi.js';
import RouletteTabel from './roulette/roulettetable';
class Roulette {
    constructor(data) {
        this.m_eventEmitter = data.Event;
        this.setProgress = data.progress;
        this.getBalance = data.getBalance;
        this.openModalDialog = data.openModalDialog;
        this.InitGame();
    }
    async InitGame() {
        const app = new Application({
            backgroundColor: 0x000000, // Black background - will be covered by green-bg.png image
            width: document.getElementById('game-container').offsetWidth,
            height: document.getElementById('game-container').offsetHeight,
            autoDensity: true,
            resolution: window.devicePixelRatio,
            resizeTo: document.getElementById('game-container'),
            antialias: true, 
        });
        app.view.id = 'roulette';
        // app.ticker.maxFPS = 20;
        document.getElementById('game-container').appendChild(app.view);
        this.app = app;

        let roulettetable = new RouletteTabel();
        roulettetable.inittable(app, this.m_eventEmitter, this.setProgress, this.getBalance, this.openModalDialog);
        await roulettetable.loadGameAssets();
    }
}
module.exports = { Roulette };
