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
//Server tick msg keys
const MSG_ID_CRASH_INFO = 'crashinfo';
//prepareToPlay msg received ,when server round result out.but this msg not contain user win ,because user maybe not click spin.
const MSG_ACTION_ROUNDRESULT = 'prepareToPlay';
const MSG_ACTION_ROUNDEND = 'playToCrash';
const MSG_ACTION_ROUNDPREPARE = 'crashToPrepare';

// gamemodule msg,received in login，spin，cancel spin，round result after user spined 
const MSG_ID_GAMEMODULE_INFO = 'gamemoduleinfo';
const MSG_CMD_CANCELBET = 'cancelbet';

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

        this.gameWheel = null;
        this.gameVedioWheel = null;
        this.uiWinAni = null;
    }

    registerUiRootAndMainboard(mainboard, uiroot) {
        this.mainboard = mainboard;
        this.uiRoot=uiroot;

        //Define.NeedDefaultWheel is false,use video wheel instead.default wheel res also not loaded.
        if(Define.NeedDefaultWheel){
            this.gameWheel =new Wheel(uiroot);
        }
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
        //default wheel need update
        // if(this.gameWheel){
        //     this.gameWheel.update(dt);
        // }
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
    // from server,tick info.
    onCrashInfo(msg) {
        if (msg && msg.msgid == MSG_ID_CRASH_INFO) {

            const crashtime = msg.remainDrawTime;
            if(crashtime!=undefined){
                this.nextResultTime=crashtime;
                if(crashtime<=Define.NonOperableTime&&!this.nonOperable){
                    this.nonOperable=true;
                    if(this.mainboard){
                        this.mainboard.refreshTimeTipColor(true);
                        this.mainboard.lockMenuBtnButSpin(true); 
                        this.mainboard.refreshSpinBtnState(false);
                        this.mainboard.refreshSpinCancelBtnState(false);
                    }
                }
            }
            //firsht crashinfo msg contain historyList
            if(!this.crashInfoInit&&msg.historyList){
                GameState.getInstance().initHistoryFromServ(msg.historyList);
                this.crashInfoInit=true;
            }


            const actionid = msg.action;
            if (actionid == MSG_ACTION_ROUNDRESULT) {
                // console.log('prepareToPlay',msg);
                const data = msg.curGameModParam;
                this.roundResultNumber=data.winningNumber;  
                this.roundTotalWin= 0;
                this.wheelEffectStart(this.roundResultNumber);
                GameState.getInstance().handleResultRecords(this.roundResultNumber);

            }
            if (actionid == MSG_ACTION_ROUNDEND) {
                // console.log('playToCrash ',msg);
            }
            if (actionid == MSG_ACTION_ROUNDPREPARE) {
                // console.log('crashToPrepare',msg);
            }
        }
    }
    //msg is same with gamemoduleinfo,but this callback timing has been fixed.
    onSpinActionCallBack(msg) {
        if (msg.gmi && msg.gmi.replyPlay && msg.gmi.replyPlay.nextCommands) {
            const nextCommands = msg.gmi.replyPlay.nextCommands;
            const cancelaction = nextCommands.indexOf(MSG_CMD_CANCELBET) >= 0;
            this.mainboard.refreshCancelBtnVisiable(cancelaction);
        }
    }
    // from server,received in login，spin，cancel spin，round result after user spined 
    onGameModuleInfo(msg) {
        // console.log('OnGameModuleInfo', msg);
        if (msg && msg.msgid == MSG_ID_GAMEMODULE_INFO) {
            //the first msg is the login msg,maybe contain un collect msg.
            //handle un collect msg,only show winnumber and refresh ui win now.  
            if(!this.gameModuleInfoInit){
                if(msg.gmi && msg.gmi.replyPlay&&msg.gmi.replyPlay.results){
                    const lastround = msg.gmi.replyPlay.results[0];
                    const data = lastround.clientData.curGameModParam;
                    this.roundResultNumber=data.winningNumber;  
                    this.roundTotalWin= data.totalWin;
                }
                this.gameModuleInfoInit=true;
                return;
            }
            //handle round result
            //msg.gmi.replyPlay.isDraw is the msg key
            if(msg.gmi && msg.gmi.replyPlay&& msg.gmi.replyPlay.isDraw&&msg.gmi.replyPlay.results){
                const spinresult = msg.gmi.replyPlay.results[0];
                const data = spinresult.clientData.curGameModParam;
                this.roundResultNumber=data.winningNumber;  
                this.roundTotalWin= data.totalWin;
                GameState.getInstance().collectInfo();
                // this.wheelEffectStart(this.roundResultNumber);
                // GameState.getInstance().handleResultRecords(this.roundResultNumber);
            }
        }
    }
    spinBtnAction() {
        this.mainboard.lockMenuBtnButSpin(true);
        this.mainboard.refreshSpinBtnState(false); 
        GameState.getInstance().sendSpinReq();
        GameState.getInstance().calculateBalanceUi(true);
    }
    cancelSpinBtnAction() {
        this.mainboard.lockMenuBtnButSpin(false); 
        this.mainboard.refreshSpinCancelBtnState(false);
        GameState.getInstance().sendCancelSpinReq();
        GameState.getInstance().calculateBalanceUi(false);
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
        // if (this.gameWheel) {
        //     this.mainboard.playCameraMove();
        //     this.gameWheel.resetWheel();
        //     this.gameWheel.startSpin(winnumber);
        // }
    }
    //called frome wheel self
    async wheelEffectDone(){
        const spinResult=this.roundResultNumber;
        const roundWin=this.roundTotalWin;
        let totalbet = GameState.getInstance().getTotalBetNumber();
        this.mainboard.refreshTimeTipColor(false);
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
        // if(this.gameWheel){
        //     this.gameWheel.changeWheelIdle();
        // }
        this.mainboard.resetCameraPosi();
        this.mainboard.refreshResultTip(spinResult);
        GameState.getInstance().refreshWinUi(roundWin);
        GameState.getInstance().refreshBalanceUi();
        await Util.delayTime(200);
        this.nonOperable=false;
        this.mainboard.endResetState();
    }
}