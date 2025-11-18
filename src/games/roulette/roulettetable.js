import { Assets, Sprite, Container } from 'pixi.js';
import { Action, registerPixiJSActionsMixin } from 'pixijs-actions';
import { RouletteCfg } from './config';
import GameState from './gamestate';
import MainBoard from './mainboard';
import {Define} from "./gamedefine"
registerPixiJSActionsMixin(Container);
export default class RouletteTabel {
    constructor() {}
    inittable(pixiApp, eventEmitter, setProgress, getBalanceFunc, openModalDialogFunc) {
        this.m_app = pixiApp;
        this.setProgress = setProgress;
        this.renderwitdth = pixiApp.screen.width;
        this.renderheight = pixiApp.screen.height;
        this.hasInitCfg = false;
        this.loadresdone = false;
        let state = GameState.getInstance();
        // Register the framework callfunc
        state.registerEventEmitter(eventEmitter, getBalanceFunc, openModalDialogFunc);
        this.setProgress(10);
    }
    onRticker(dt) {
        let deltaTime = dt / 60;
        Action.tick(deltaTime * 1000);
        //the initialization of game  might be faster than the framework.
        if (!this.hasInitCfg) {
            let gamecfginit = GameState.getInstance().gamecfginit;
            if (gamecfginit && this.loadresdone) {
                this.hasInitCfg = true;
                this.mainboard.serCfgSuccess();
            }
        }
        if (this.hasInitCfg) {
            this.mainboard.update(deltaTime);
        }
        this.resizeTable(false);
    }
    initTicker() {
        let ticker = this.m_app.ticker;
        ticker.add(this.onRticker.bind(this));
        ticker.start();
    }
    initComponents() {
        var stage = this.m_app.stage;
        this.bgcontainer = new Container();
        stage.addChild(this.bgcontainer);

        this.container = new Container();
        stage.addChild(this.container);

        this.historycontainer = new Container();
        stage.addChild(this.historycontainer);

        this.initBackground();
        this.initTable();
        this.resizeTable(true);
    }
    initBackground() {
        let designwidth = RouletteCfg.DesiWidth;
        let designheight = RouletteCfg.DesiHeight;

        let nineSlicePlaneCenter = Sprite.from('bgcenter.jpg');
        nineSlicePlaneCenter.anchor.set(0.5, 0.5);
        nineSlicePlaneCenter.position.set(0, 0);
        let scalew0 = designwidth / 540 + 0.2;
        let scaleh0 = designheight / 960 + 0.2;
        nineSlicePlaneCenter.scale.set(scalew0, scaleh0);
        this.bgcontainer.addChild(nineSlicePlaneCenter);
    }
    initTable() {
        this.mainboard = new MainBoard();
        this.container.addChild(this.mainboard.root);

        let designwidth = RouletteCfg.DesiWidth;
        let designheight = RouletteCfg.DesiHeight;
        let history = this.mainboard.history;
        history.position.set(-designwidth / 2, -designheight / 2 + 42);
        this.historycontainer.addChild(history);

        let historybg = this.mainboard.historybg;
        historybg.position.set(-designwidth / 2, -designheight / 2 + 42);
        this.historycontainer.addChild(historybg);
    }
    resizeTable(isforce) {
        if (this.renderwitdth == this.m_app.screen.width && this.renderheight == this.m_app.screen.height && !isforce) {
            return;
        }
        this.renderwitdth = this.m_app.screen.width;
        this.renderheight = this.m_app.screen.height;
        let scalew = this.renderwitdth / RouletteCfg.DesiWidth;
        let scaleh = this.renderheight / RouletteCfg.DesiHeight;

        this.bgcontainer.position.set(this.renderwitdth * 0.5, this.renderheight * 0.5);
        this.bgcontainer.scale.set(scalew, scaleh);

        this.historycontainer.position.set(this.renderwitdth * 0.5, this.renderheight * 0.5);
        this.historycontainer.scale.set(scalew, scaleh);

        // this.container.position.set(this.renderwitdth * 0.5, this.renderheight * 0.5);
        // var scale = this.renderwitdth / RouletteCfg.DesiWidth;
        // this.container.scale.set(scale, scale);

        var scale = this.renderwitdth / RouletteCfg.DesiWidth;

        // Mobile adjustments: smaller size and moved down
        let tableY = this.renderheight * 0.4;
        if (this.renderwitdth <= 768) {
            scale = scale * 0.8; // 75% of original size on mobile
            tableY = this.renderheight * 0.5; // Move table down on mobile (55% from top)
        }

        this.container.position.set(this.renderwitdth * 0.5, tableY);
        this.container.scale.set(scale, scale);
    }
    // load assets
    async loadGameAssets() {
        try {
        Assets.add({ alias: 'gameui', src: '../../assets2/roulette/rouletteui.json' });
        this.setProgress(20);
        await Assets.load('gameui');
        this.setProgress(40);
        if(Define.NeedDefaultWheel){
            Assets.add({ alias: 'wheelui', src: '../../assets2/roulette/roulettewheel.json' });
            await Assets.load('wheelui');
            this.setProgress(60);
        }
        if(Define.NeedDefaultWinUi){
            Assets.add({ alias: 'winui', src: '../../assets2/roulette/roulettewin.json' });
            await Assets.load('winui');
            this.setProgress(80);
        }
        this.loadresdone = true;
        this.setProgress(95);
        this.initComponents();
        this.initTicker();
        this.setProgress(100);
    } catch (error) {
        console.error('[ROULETTE] Failed to load game assets:', error);
        // Still mark as complete to hide loading screen even if assets fail
        this.setProgress(100);
    }
    }
}
