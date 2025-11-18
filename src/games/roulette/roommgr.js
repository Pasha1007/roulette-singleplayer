import GameState from "./gamestate";
import Wheel from "./wheel"
import VedioWheel from "./vediowheel"
import RouletteWin from "./roulettewin"
import Util from "./Util";
import {Define} from "./gamedefine"
import { RouletteCfg} from './config';

/**
 * To facilitate further modifications to the project, `roommgr.js` reorganizes the previous project structure and centralizes modifiable logic within itself as much as possible.
 * convaiIntegration maybe should put in roommgr，todo
 * Detailed in the README_CLIENT
 */

// gamemodule msg,received after spin 
const MSG_ID_GAMEMODULE_INFO = 'gamemoduleinfo';

export default class RoomMgr {
    static _instance = null;
    static getInstance() {
        if (RoomMgr._instance == null) {
            RoomMgr._instance = new RoomMgr();
        }
        return RoomMgr._instance;
    }
    constructor() {
        this.nextResultTime = 0;
        this.roundResultNumber=-1;
        this.roundTotalWin = 0;

        this.gameModuleInfoInit=false;
        this.crashInfoInit=false;
        this.nonOperable=false;

        this.mainboard = null;
        this.uiRoot=null;

        this.gameVedioWheel = null;
        this.uiWinAni = null;
    }

    registerUiRootAndMainboard(mainboard, uiroot) {
        this.mainboard = mainboard;
        this.uiRoot=uiroot;

        //Define.NeedDefaultWheel is false,use video wheel instead.default wheel res also not loaded.
        this.gameVedioWheel=new VedioWheel(uiroot);
         // Enable sorting for z-index to work
         if (this.uiRoot.sortableChildren !== undefined) {
            this.uiRoot.sortableChildren = true;
        }
        
        // Force sorting after adding video container
        if (this.uiRoot.sortChildren) {
            this.uiRoot.sortChildren();
        }

        if(Define.NeedDefaultWinUi){
            this.uiWinAni=new RouletteWin(uiroot);
            let defaultposiy=Define.NeedDefaultWheel?RouletteCfg.WheelDefaultY - 320:0;
            this.uiWinAni.initWinAniPosi(0,defaultposiy);
        }
    }
    update(dt) {
        if(this.uiWinAni){
            this.uiWinAni.update(dt);
        }
    }
    getResultTime(){
        return this.nextResultTime;
    }
    getRoundResultNumber(){
        return this.roundResultNumber;
    }
    getRoundWin(){
        return this.roundTotalWin;
    }
    isUerOperable() {
        return !this.nonOperable
    }
    //single play, received in after spin
    onGameModuleInfo(msg) {
        // console.log('OnGameModuleInfo', msg);
        if (msg && msg.msgid == MSG_ID_GAMEMODULE_INFO) {

            const results = msg.gmi.replyPlay.results;
            const spinresult = results[0];
            this.roundResultNumber = spinresult.clientData.curGameModParam.winningNumber;
            this.roundTotalWin = msg.gmi.totalwin;
            GameState.getInstance().collectInfo();
        }
    }
    spinBtnAction() {
        this.mainboard.lockMenuBtnButSpin(true);
        this.mainboard.refreshSpinBtnState(false); 
        GameState.getInstance().sendSpinReq();
        GameState.getInstance().calculateBalanceUi(true);
    }
    // NEW METHOD: Play video with result from server (called from OnSpinRet)
    playResultVideo(resultNumber) {
        
        // Ensure video shows above table with proper z-index sorting
        if (this.uiRoot.sortChildren) {
            this.uiRoot.sortChildren();
        }
        // Play video with actual server result
        this.gameVedioWheel.playNumberVideo(resultNumber);
    }
    wheelEffectStart(winnumber){
        if(this.mainboard){
            this.mainboard.changeMainboardAni();
        }
        if(this.gameVedioWheel){
           this.playResultVideo(winnumber);
        }

    }
    //called frome wheel self
    async wheelEffectDone(){
        const spinResult=this.roundResultNumber;
        const roundWin=this.roundTotalWin;
        let totalbet = GameState.getInstance().getTotalBetNumber();
        await Util.delayTime(200);
        if(roundWin>0){
            if(this.uiWinAni){
                this.uiWinAni.initResultNumber(spinResult);
                await Util.delayTime(500);
                const anitime = Util.waitWinAniCountTime(roundWin, totalbet);
                this.uiWinAni.initCoinWin(roundWin, totalbet, anitime);
                let delaytime = (anitime + 0.2) * 1000+1000;
                await Util.delayTime(delaytime);
                this.uiWinAni.clearCoinWin();
            }  
        }
        this.mainboard.resetCameraPosi();
        this.mainboard.refreshResultTip(spinResult);
        GameState.getInstance().refreshWinUi(roundWin);
        GameState.getInstance().refreshBalanceUi();
        await Util.delayTime(200);
        this.nonOperable=false;
        this.mainboard.endResetState();
    }
}