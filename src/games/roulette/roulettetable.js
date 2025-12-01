import { Assets, Sprite, Container, Graphics } from 'pixi.js';
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
        
        // Enable z-index sorting on stage
        stage.sortableChildren = true;
        
        // Add green background rectangle first - directly to stage to ensure it's behind everything
        const greenBackground = new Graphics();
        greenBackground.beginFill(0x0E3D27); // Dark green casino color
        greenBackground.drawRect(0, 0, this.m_app.screen.width * 2, this.m_app.screen.height * 2);
        greenBackground.endFill();
        greenBackground.position.set(-this.m_app.screen.width / 2, -this.m_app.screen.height / 2);
        greenBackground.zIndex = -999; // Ensure it's behind everything
        greenBackground.eventMode = 'none'; // Disable pointer events so it doesn't block clicks
        greenBackground.interactive = false; // Make sure it's not interactive
        stage.addChild(greenBackground);
        this.greenBackground = greenBackground;
        
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
        // Additional background in container for scaling
        const background = new Graphics();
        background.beginFill(0x0E3D27); // Dark green casino color
        background.drawRect(-5000, -5000, 10000, 10000);
        background.endFill();
        background.eventMode = 'none'; // Disable pointer events
        background.interactive = false; // Make sure it's not interactive
        this.bgcontainer.addChild(background);
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

        // Update green background to cover entire screen
        if (this.greenBackground) {
            this.greenBackground.clear();
            this.greenBackground.beginFill(0x0E3D27);
            this.greenBackground.drawRect(0, 0, this.renderwitdth * 3, this.renderheight * 3);
            this.greenBackground.endFill();
            this.greenBackground.position.set(-this.renderwitdth, -this.renderheight);
        }

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
