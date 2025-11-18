import { stateManager } from './state';
import { StorageDataGet, urlQuery, fetchGet, isMobile } from './utils';
import CasinoBridge from './serv.js';
import EventEmitter from './eventEmitter';
import formatCurrency from './formatCurrency';
import frameworksUi from './frameworksUi';
import './index.less';
export class SwipeGame {
    constructor() {
        this.changeState({ gameid: urlQuery.gameCode || 'roulette' });
        this.customServerUrl = `wss://gameserv2.rgstest.slammerstudios.com/`;
        this.dispatchEvent = new EventEmitter();
        this.resize();
        this.init();
        window.addEventListener('resize', this.resize.bind(this));
        window.addEventListener('visibilitychange', this.visibilityChange.bind(this));
        //On mobile devices, trial play is not allowed in landscape orientation.
        if (isMobile()) {
            this.setupOrientationListeners();
            this.detectOrientation();
        }
    }

    init() {
        //game loading
        this.gameloading();
        //Load client-side resources
        const gameClient = require(`./games/${this.state.gameid}.js`);
        let game = new gameClient.Roulette({
            Event: this.dispatchEvent,
            progress: this.setProgress.bind(this),
            getBalance: this.getBalance.bind(this),
            openModalDialog: this.openModalDialog.bind(this),
            closeModalDialog: this.closeModalDialog.bind(this),
        });
        this.changeState({ gameClient: game });
        //Get the settings
        let settings = {};
        if (StorageDataGet(this.state.gameid)) {
            settings = StorageDataGet(this.state.gameid);
        } else {
            settings = {
                sound: true,
                bet: 1,
            };
        }
        this.changeState({ settings: settings });
            //Custom-deployed server
            let customTranslationPromise = new Promise((resolve, reject) => {
                let langurl = '../lang/en-GB.json';
                fetchGet(langurl).then((common) => {
                    this.changeState({ translation: common });
                     this.dispatchEvent.emit('updata-translation', { ...this.state.servCfg });
                    resolve();
                });
            });
            let customServerPromise = new Promise((resolve, reject) => {
                let serv = new CasinoBridge(`${this.customServerUrl}`, this.state.gameid,this.dispatchEvent);
                serv.servLoadOk().then(() => {
                    this.changeState({ servCfg: serv });
                    resolve();
                });
            });
            Promise.all([customTranslationPromise, customServerPromise]).then(() => {
                //Start the game
                this.formatCurrency = new formatCurrency(this.state.servCfg['status']['userbaseinfo']['userbaseinfo']['currency']);
                let data = {
                    setMoneys: this.formatCurrency.setMoneys,
                    setMoneyInt: this.formatCurrency.setMoneyInt,
                    autoplayDisable: this.state.gameCfg.autoplayDisable || false,
                    realityCheck: this.state.gameCfg.realityCheck || false,
                    isPT: urlQuery.jurisdiction === 'PT' ? true : false,
                    disableNearwin: urlQuery.jurisdiction === 'PT' ? true : false,
                };
                this.changeState({ servCfg: Object.assign(this.state.servCfg, data) });
                this.changeState({ balance: this.state.servCfg['status']['userbaseinfo']['userbaseinfo']['gold'] });
                this.dispatchEvent.emit('updata-gamecfg', { ...this.state.servCfg });
                new frameworksUi({
                    Event: this.dispatchEvent,
                    state: this.state,
                    changeState: this.changeState.bind(this),
                });
            });
    }
    visibilityChange() {
        if (document.visibilityState === 'hidden') return;
    }
    gameloading() {
        if (document.getElementById('loading')) document.getElementById('loading').remove();
        let div = document.createElement('div');
        div.id = 'loading';
        document.getElementById('game-container').appendChild(div);
        let loadingdiv = document.createElement('div');
        div.appendChild(loadingdiv);
        loadingdiv.id = 'loadingdiv';
        let html = `<div class="leo-gameloading-content">
                    <div class="leo-gameloading-title">loading</div>
                    <div class="leo-gameloading-content1" style="z-index:1"></div>
                     <div class="leo-gameloading-content2" id="leo-content2" style="z-index:2"></div>
        </div>`;
        loadingdiv.innerHTML = html;
    }
    resize = () => {
        let size = { x: 1920, y: 1280 };
        let viewport = this.getViewport();
        let fontsize = Math.min(Math.max(viewport.x, viewport.y) / size.x, Math.min(viewport.y, viewport.x) / size.y);
        document.body.style.fontSize = fontsize + 'em';
        const designWidth = 1080;
        const designHeight = 1920;
        const container = document.getElementById('game-container');
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        let targetWidth, targetHeight;
        targetHeight = screenHeight;
        targetWidth = (designWidth / designHeight) * targetHeight > screenWidth ? screenWidth : (designWidth / designHeight) * targetHeight;
        container.style.width = `${Math.ceil(targetWidth)}px`;
        container.style.height = `${Math.ceil(targetHeight)}px`;
        if (!window.matchMedia('(orientation: landscape)').matches) {
            if (screenWidth < 768) document.getElementsByTagName('body')[0].style.fontSize = '0.58em';
        }
    };
    setupOrientationListeners = () => {
        if (window.screen.orientation) {
            // webAPI
            window.screen.orientation.addEventListener('change', this.detectOrientation);
        } else if (window.orientation !== undefined) {
            // iOS Safari
            window.addEventListener('orientationchange', this.detectOrientation);
        } else {
            window.addEventListener('resize', this.detectOrientation);
        }
    };
    detectOrientation = () => {
        if (window.screen.orientation) {
            this.currentOrientation = window.screen.orientation.type.includes('portrait') ? 'portrait' : 'landscape';
        } else if (window.orientation !== undefined) {
            // iOS Safari
            this.currentOrientation = Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';
        } else {
            this.currentOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        }
        if (this.currentOrientation === 'portrait') {
            if (document.getElementById('game-landscape')) document.getElementById('game-landscape').remove();
        } else {
            let nodes = document.getElementById('game-container');
            let div;
            if (!document.getElementById('game-landscape')) {
                div = document.createElement('div');
                div.id = 'game-landscape';
                nodes.appendChild(div);
            }
            let html = `<div class="game-landscape-content">
                <div class="game-landscape-content-img"></div>
            </div>`;
            div.innerHTML = html;
        }
    };
    getViewport() {
        return {
            x: window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth,
            y: window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight,
        };
    }
    changeState(data) {
        stateManager.setState(data);
        this.state = stateManager.getState();
    }
    setProgress = (progress) => {
        let pro = 100 - parseInt(progress) + '%';
        this.changeState({ progress: pro });
        if (document.getElementById('leo-content2')) {
            document.getElementById('leo-content2').style.clipPath = `inset(0 ${this.state.progress} 0 0)`;
            document.getElementById('leo-content2').style.webkitClipPath = `inset(0 ${this.state.progress} 0 0)`;
            if (this.state.progress === '0%') {
                setTimeout(() => {
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('loading').innerHTML = ``;
                }, 100);
            }
        }
    };
    openModalDialog = () => {};
    closeModalDialog = () => {};
    getBalance() {
        return this.state.balance;
    }
}

new SwipeGame();
