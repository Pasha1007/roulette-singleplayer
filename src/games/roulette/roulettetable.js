import { Assets, Sprite, Container } from 'pixi.js';
import { Action, registerPixiJSActionsMixin } from 'pixijs-actions';
import { RouletteCfg } from './config';
import GameState from './gamestate';
import MainBoard from './mainboard';
import { Define } from './gamedefine';
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
        // Load green-bg.png - optimized: load after sprite sheets to reduce initial memory spike
        // The image will be loaded on-demand when initBackground is called
        let greenBackground = Sprite.from('assets/images/green-bg.png');
        greenBackground.anchor.set(0.5, 0.5);
        greenBackground.position.set(0, 0);
        this.bgcontainer.addChild(greenBackground);
        this.greenBackground = greenBackground;
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

        // Scale background image to cover only the area below the video (memory optimization)
        if (this.greenBackground && this.greenBackground.texture && this.greenBackground.texture.valid) {
            // Video is positioned at y = -700 with height 800, so bottom is at -700 + 400 = -300
            // In design coordinates, the video bottom is at approximately -300
            // Background should start from video bottom and cover to bottom of design area
            const videoBottomY = -300; // Video bottom in design coordinates
            const designBottomY = RouletteCfg.DesiHeight / 2; // Bottom of design area (960)
            const backgroundHeight = designBottomY - videoBottomY; // Height of area below video (1260)
            
            // Scale to cover width and the height below video
            const scaleX = RouletteCfg.DesiWidth / this.greenBackground.texture.width;
            const scaleY = backgroundHeight / this.greenBackground.texture.height;
            
            // Use the larger scale to ensure full coverage
            const scale = Math.max(scaleX, scaleY);
            this.greenBackground.scale.set(scale, scale);
            
            // Position background to cover area below video
            // Center horizontally, position vertically so it covers from video bottom to design bottom
            const backgroundCenterY = (videoBottomY + designBottomY) / 2; // Center of the area below video
            this.greenBackground.position.set(0, backgroundCenterY);
        }

        this.bgcontainer.position.set(this.renderwitdth * 0.5, this.renderheight * 0.5);
        this.bgcontainer.scale.set(scalew, scaleh);

        this.historycontainer.position.set(this.renderwitdth * 0.5, this.renderheight * 0.5);
        this.historycontainer.scale.set(scalew, scaleh);

        var scale = this.renderwitdth / RouletteCfg.DesiWidth;

        // Mobile adjustments: smaller size and moved down
        let tableY = this.renderheight * 0.4;
        if (this.renderwitdth <= 768) {
            scale = scale * 0.8; // 75% of original size on mobile
            tableY = this.renderheight * 0.5; // Move table down on mobile (55% from top)
        }

        this.container.position.set(this.renderwitdth * 0.5, tableY);
        this.container.scale.set(scale, scale);

        if (this.mainboard && this.mainboard.tableroot) {
            const tableBoost = 1.2;
            this.mainboard.tableroot.scale.set(tableBoost, tableBoost);
        }
    }

    // load assets
    async loadGameAssets() {
        try {
            Assets.add({ alias: 'gameui', src: '../../assets2/roulette/rouletteui.json' });
            this.setProgress(20);
            await Assets.load('gameui');
            this.setProgress(40);
            if (Define.NeedDefaultWheel) {
                Assets.add({ alias: 'wheelui', src: '../../assets2/roulette/roulettewheel.json' });
                await Assets.load('wheelui');
                this.setProgress(60);
            }
            if (Define.NeedDefaultWinUi) {
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
