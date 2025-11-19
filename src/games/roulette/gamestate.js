import LanguageMgr from '../common/language';
import RoomMgr from './roommgr';
import {ResultMaxLen} from './mainboard'
class BetInfo {
    constructor(hittag, numbers, amount, iscirlebet) {
        this.hittag = hittag;
        this.numbers = numbers;
        this.amount = amount;
        this.circlebet = iscirlebet;
    }
    getIsCircleBet() {
        return this.circlebet;
    }
    getHitTag() {
        return this.hittag;
    }
}
const HitActions = {
    Hit: 'Hit',
    Double: 'Double'
};
export default class GameState {
    static _instance = null;
    static getInstance() {
        if (GameState._instance == null) {
            GameState._instance = new GameState();
        }
        return GameState._instance;
    }
    constructor() {
        this._cid = 0;
        this.betresults = [];
        this.betList = [];
        this.betvalues = [
            {
                color: 'white.png',
                value: 10,
                index: 0,
            },
        ];
        this.hitaction = [];
        this.selectChip = this.betvalues[0];
        this.baseChipValue = this.selectChip.value;
        this.selectChipValue = this.selectChip.value;
        this.mainboard = null;

        //framework callfunc
        this.m_eventEmitter = null;
        this.m_getBalanceFunc = null;
        this.m_openModalDialogFunc = null;
        this.m_formatMoneyFunc = null;
        this.m_formatChipMoneyFunc = null;


        this.collectBalance=0;
        this.gamecfginit = false;
        this.gamemenuopen = false;
        this.languagemgr = new LanguageMgr();
    }
    registerEventEmitter(eventEmitter, getBalanceFunc, openModalDialogFunc) {
        this.m_eventEmitter = eventEmitter;
        this.m_getBalanceFunc = getBalanceFunc;
        this.m_openModalDialogFunc = openModalDialogFunc;
        this.registerServerEvents();
    }
    //server callfunc
    //spin
    //selectfree
    //collectinfo
    //updata-balance
    //updata-win
    //updata-bet
    registerServerEvents() {
        this.m_eventEmitter.addListener('updata-gamecfg', this.OnGameCfg.bind(this));
        this.m_eventEmitter.addListener('updata-bet', this.OnUpdateBet.bind(this));
        this.m_eventEmitter.addListener('updata-slotmessage', this.OnSpinRet.bind(this));
        this.m_eventEmitter.addListener('updata-collectinfo', this.OnCollectInfo.bind(this));
        this.m_eventEmitter.addListener('updata-music', this.OnMusicInfo.bind(this));
        this.m_eventEmitter.addListener('updata-menu', this.OnMenuInfo.bind(this));
        this.m_eventEmitter.addListener('updata-translation', this.OnTranslation.bind(this));
    }
    OnGameCfg(data) {
        console.log('Server:OnGameCfg', data);
        this.gamecfginit = true;
        if (data.status && data.status.gamecfg && data.status.gamecfg.linebets) {
            let linebets = data.status.gamecfg.linebets;
            let len = linebets.length;
            this.betvalues = [];
            for (let i = 0; i < len; i++) {
                let betcfg=linebets[i];
                betcfg.color=betcfg.color+'.png';
                betcfg.index=i;
                this.betvalues.push(betcfg);
            }
        }
        this.selectChip = this.betvalues[0];
        this.baseChipValue = this.selectChip.value;
        this.selectChipValue = this.selectChip.value;

        this.m_formatMoneyFunc = data.setMoneys;
        this.m_formatChipMoneyFunc = data.setMoneyInt;
    }
    OnUpdateBet(data) {
        // console.log('OnUpdateBet', data);
    }

    OnSpinRet(msg) {
        RoomMgr.getInstance().onGameModuleInfo(msg);
    }
    initHistoryFromServ(list){
        const startIndex=Math.max(0,list.length-1-ResultMaxLen);
        this.betresults=list.splice(startIndex);

    }
    handleResultRecords(resultnumber){
        this.betresults.push(resultnumber);
        //save ResultMaxLen records
        if (this.betresults.length > ResultMaxLen) {
            this.betresults.shift();
        }
    }
    //Receive the collect info from server
    //do nothing now
    OnCollectInfo(data) {
        // console.log('OnCollectInfo', data);
        if(data&&data.gold!=undefined){
            this.collectBalance=data.gold;
        }
    }
    OnMusicInfo(data) {
        // console.log('OnMusicInfo', data);
    }
    OnMenuInfo(data) {
        if (data == true) {
            this.gamemenuopen = true;
        } else {
            this.gamemenuopen = false;
        }
    }
    OnTranslation(data) {
        this.languagemgr.setLanguage(data);
    }
    getLanguage(key) {
        return this.languagemgr.getLanguage(key);
    }
    registerBoard(board) {
        this.mainboard = board;
    }
    //send collectinfo
    collectInfo() {
        this.m_eventEmitter.emit('collectinfo', 1);
    }
    //send the spin request to server
    sendSpinReq() {
        let data = {};
        let allbet = this.getTotalBetNumber();
        let betinfos = this.mergeBetForSpinReq();
        data.gamecode = 'roulette';
        data.command = 'placebet';
        data.allbet = allbet;
        data.places = { bets: betinfos };
        this.m_eventEmitter.emit('spin', data);
    }
    sendCancelSpinReq(){
        let data = {};
        let allbet = this.getTotalBetNumber();
        data.gamecode = 'roulette';
        data.command = 'cancelbet';
        data.allbet = allbet;
        this.m_eventEmitter.emit('spin', data);
    }

    // Merge the bet list for the spin request
    mergeBetForSpinReq() {
        let betTags = [];
        let betInfos = [];
        let betlens = this.betList.length;
        for (let i = 0; i < betlens; i++) {
            let betinfo = this.betList[i];
            let betamount = betinfo.amount;
            let bettag = betinfo.getHitTag();
            let tagindex = betTags.indexOf(bettag);
            if (tagindex == -1) {
                let onebet = { amount: betamount, numbers: betinfo.numbers };
                betTags.push(bettag);
                betInfos.push(onebet);
            } else {
                let thebet = betInfos[tagindex];
                thebet.amount += betamount;
            }
        }
        return betInfos;
    }
    //change the select chip value
    setSelectChipAmount(amount) {
        let length = this.betvalues.length;
        for (let i = 0; i < length; i++) {
            let betvalue = this.betvalues[i];
            if (amount == betvalue.value) {
                this.selectChipValue = amount;
                this.selectChip = betvalue;
                return;
            }
        }
    }
    // Get the select chip object by amount
    getSelectChipObj(amount) {
        let length = this.betvalues.length;
        for (let i = 0; i < length; i++) {
            let betvalue = this.betvalues[i];
            if (amount == betvalue.value) {
                return betvalue;
            }
        }
        return null;
    }
    getMaxChipObj(amount) {
        let length = this.betvalues.length;
        for (let i = length - 1; i >= 0; i--) {
            let betvalue = this.betvalues[i];
            if (amount >= betvalue.value) {
                return betvalue;
            }
        }
        return null;
    }
    getHistoryResults() {
        return this.betresults;
    }
    getMainBoard() {
        return this.mainboard;
    }
    getChipLst() {
        return this.betvalues;
    }
    HasEnoughMoney(totalbet) {
        if (this.m_getBalanceFunc) {
            let curbalance = this.m_getBalanceFunc();
            return curbalance >= totalbet;
        }
        return false;
    }
    // Check if the hit tag is within the maximum limits
    checkMaxLimits(hittag, addbet) {
        let basebet = this.baseChipValue;
        let curbet = this.getHitTotalBetNumber(hittag);
        if (hittag.indexOf('Single') != -1) {
            let thenumber = hittag.replace(/[^\d]/g, '');
            let index = parseInt(thenumber);
            if (index >= 0 && index <= 36) {
                return basebet * 2500 >= curbet + addbet;
            }
            if (index >= 37 && index <= 39) {
                return basebet * 30000 >= curbet + addbet;
            }
            if (index >= 40 && index <= 42) {
                return basebet * 30000 >= curbet + addbet;
            }
            if (index >= 43 && index <= 48) {
                return basebet * 50000 >= curbet + addbet;
            }
        }
        if (hittag.indexOf('Split') != -1) {
            return basebet * 5000 >= curbet + addbet;
        }
        if (hittag.indexOf('Street') != -1) {
            return basebet * 7500 >= curbet + addbet;
        }
        if (hittag.indexOf('Corner') != -1) {
            return basebet * 1000 >= curbet + addbet;
        }
        if (hittag.indexOf('Six') != -1) {
            return basebet * 15000 >= curbet + addbet;
        }
        return true;
    }
    // Place a bet on the table
    hitBet(hittag, numbers) {
        if (!this.gamecfginit) {
            return null;
        }
        let curallbet = this.getTotalBetNumber();
        let amount = this.selectChip.value;
        if (!this.HasEnoughMoney(curallbet + amount)) {
            this.noEnoughMoney();
            return null;
        }
        if (!this.checkMaxLimits(hittag, amount)) {
            this.maxTotalBet();
            return null;
        }

        this._cid++;
        let info = new BetInfo(hittag, numbers, amount, false);
        this.betList.push(info);
        this.hitaction.push(HitActions.Hit);
        this.refreshBetUi();
        return info;
    }
    // Double the current bet
    doubleCurHit() {
        let curallbet = this.getTotalBetNumber();
        if (!this.HasEnoughMoney(curallbet * 2)) {
            this.noEnoughMoney();
            return null;
        }
        let addbet = [];
        let betlen = this.betList.length;
        for (let i = 0; i < betlen; i++) {
            let betinfo = this.betList[i];
            let hittag = betinfo.getHitTag();
            let numbers = betinfo.numbers;
            let amount = betinfo.amount;
            let iscirlebet = betinfo.circlebet;
            this._cid++;
            let info = new BetInfo(hittag, numbers, amount, iscirlebet);
            this.betList.push(info);
            addbet.push(info);
        }
        let curbetlen = this.betList.length;
        let addbetlen = addbet.length;
        for (let i = 0; i < addbetlen; i++) {
            let betinfo = addbet[i];
            let hittag = betinfo.getHitTag();
            if (!this.checkMaxLimits(hittag, 0)) {
                this.betList.splice(curbetlen - addbetlen);
                this.maxTotalBet();
                return null;
            }
        }

        this.hitaction.push(HitActions.Double);
        this.refreshBetUi();
        return addbet;
    }
    betInfoEnmpty() {
        return this.betList.length <= 0;
    }
    spinCheckEnoughMoney() {
        let curallbet = this.getTotalBetNumber();
        if (!this.HasEnoughMoney(curallbet)) {
            this.noEnoughMoney();
            return false;
        }
        return true;
    }
    getBetLsts() {
        return this.betList;
    }
    clearBetList() {
        this.betList = [];
        this.hitaction = [];
        this.refreshBetUi();
    }
    // Undo the last hit bet action
    undoHitBet() {
        if (this.hitaction.length <= 0 || this.betList.length <= 0) {
            return null;
        }
        let lastaction = this.hitaction.pop();
        let betlistlen = this.betList.length;
        if (lastaction == HitActions.Hit) {
            let unhits = this.betList.splice(betlistlen - 1);
            this.refreshBetUi();
            return unhits;
        }
        if (lastaction == HitActions.Double) {
            let half = Math.floor(betlistlen / 2);
            let unhits = this.betList.splice(half);
            this.refreshBetUi();
            return unhits;
        }
        return null;
    }
    endReset() {
        this._cid = 0;
        this.betList.length = 0;
    }
    refreshBetUi(setvalue) {
        if (setvalue != undefined) {
            this.m_eventEmitter.emit('updata-bet', setvalue);
            return;
        }
        let allbet = this.getTotalBetNumber();
        this.m_eventEmitter.emit('updata-bet', allbet);
    }
    getCurBetAmount(){
        let betlen = this.betList.length;
        let allbet = 0;
        for (let i = 0; i < betlen; i++) {
            let betinfo = this.betList[i];
            allbet += betinfo.amount;
        }
        return allbet;
    }
    calculateBalanceUi(isspin){
        if (this.m_getBalanceFunc) {
            let curbalance = this.m_getBalanceFunc();
            let betamount=this.getCurBetAmount();
            let resultbalance =isspin? (curbalance - betamount):(curbalance + betamount);
            this.m_eventEmitter.emit('updata-balance', resultbalance);
        }
    }
    refreshBalanceUi(){
        if(this.collectBalance){
            this.m_eventEmitter.emit('updata-balance', this.collectBalance); 
        }
    }
    refreshWinUi(totalwin) {
        this.m_eventEmitter.emit('updata-win', totalwin);
    }
    getTotalBetNumber() {
        let allbet = 0;
        let betlen = this.betList.length;
        for (let i = 0; i < betlen; i++) {
            let betinfo = this.betList[i];
            allbet += betinfo.amount;
        }
        return allbet;
    }
    getHitTotalBetNumber(hittag) {
        let allbet = 0;
        let betlen = this.betList.length;
        for (let i = 0; i < betlen; i++) {
            let betinfo = this.betList[i];
            if (betinfo.getHitTag() == hittag) {
                allbet += betinfo.amount;
            }
        }
        return allbet;
    }

    formatMoney(number, hassym) {
        if (hassym == undefined) {
            hassym = true;
        }
        if (this.m_formatMoneyFunc) {
            return this.m_formatMoneyFunc(number, hassym);
        }

        return number.toString();
    }
    formatChipMoney(number) {
        return this.m_formatChipMoneyFunc(number);
    }
    maxTotalBet() {
        this.openModalDialog({ errorCode: 'MAX-TOTAL-BET', type: 0, gameid: 'roulette', message: 'Exceed the maximum betting amount.' });
    }
    noEnoughMoney() {
        this.openModalDialog({ errorCode: '000107', type: 0, gameid: 'roulette' });
    }
    openModalDialog(data) {
        if (this.m_openModalDialogFunc) {
            this.m_openModalDialogFunc(data);
        }
    }
}
