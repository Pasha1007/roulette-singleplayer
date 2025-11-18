import { Container, Point, Sprite, Texture, TextStyle, Text } from 'pixi.js';
import { Action } from 'pixijs-actions';
import { BlackNumbers, RouletteCfg, SingleHitConfig } from './config';
import GameButton from '../common/gamebutton';
import LayoutHelp from '../common/layouthelp';
import Chip from './chip';
import GameState from './gamestate';
import TableRect from './tablerect';
import Util from './Util';
import RoomMgr from './roommgr';
import TimeTip from './timetip';

import SoundPopup from './sound-popup';
import BackgroundMusicManager from './background-music-manager';
export const MainBoradType = {
    None: -1,
    MenuIdle: 0,
    WheelAni: 1,
};

export const ResultMaxLen = 12;
const HistoryLabel_DiffX = 78;
export default class MainBoard {
    constructor() {
        this.root = new Container();
        this.initData();
        this.initFastTables();
        this.initMenuButtons();
        this.intiHistory();
        this.checkMenuBtnsAble();
        GameState.getInstance().registerBoard(this);


        // Initialize sound popup
        this.soundPopup = new SoundPopup(this);
        this.root.addChild(this.soundPopup.getContainer());

        // Initialize background music playlist
        this.backgroundMusicManager = new BackgroundMusicManager();
        this.backgroundMusicManager.initialize();

        // Start music on first user interaction (for mobile browsers)
        this.setupMusicAutoplayHandler();
    }
    initData() {
        this.tableChipList = [];
        this.boradState = MainBoradType.None;
        this.isTableRect = true;
        this.isChipSelecting = false;
        this.tempDrawTime = 0;
    }
    //To present quickly
    initFastTables() {
        this.tableroot = new Container();
        this.root.addChild(this.tableroot);
        this.recttable = new TableRect(this.tableroot);
    }
    intiHistory() {
        this.history = new Container();
        this.historybg = new Container();
        let _sprite = Sprite.from('history2.png');
        _sprite.anchor.set(0, 0.5);
        _sprite.position.set(0, 0);
        this.historybg.addChild(_sprite);

        let _sprite1 = Sprite.from('history1.png');
        _sprite1.anchor.set(0, 0.5);
        _sprite1.position.set(0, 0);
        this.historybg.addChild(_sprite1);
    }
    initMenuButtons() {
        this.menucontainer = new Container();
        this.root.addChild(this.menucontainer);

        this.menubtnbg = Sprite.from('menubg2.png');
        this.menubtnbg.anchor.set(0.5, 0.5);
        this.menubtnbg.position.set(420, -50);
        this.menucontainer.addChild(this.menubtnbg);

        let lable1 = GameState.getInstance().getLanguage('roulette_ui_1');
        this.btnClearBet = new GameButton('betclear', 'betclear.png', lable1, new Point(0, 75), this.menucontainer, undefined, 30);

        let lable3 = GameState.getInstance().getLanguage('roulette_ui_4');
        this.btnUndoBet = new GameButton('undobet', 'undo.png', lable3, new Point(0, 75), this.menucontainer, undefined, 30);

        let money = '0';
        let texture = 'rgrayse.png';
        this.btnChipChange = new GameButton('chipbet', texture, money, new Point(0, -6), this.menucontainer, undefined, 42, true);
        this.btnChipChange.setTxtextColor(0x2f2f2f);

        let lable5 = GameState.getInstance().getLanguage('roulette_ui_5');
        this.btnDoubelBet = new GameButton('doubelbet', 'double.png', lable5, new Point(0, 75), this.menucontainer, undefined, 30);



        let lable7 = GameState.getInstance().getLanguage('roulette_ui_8');
        this.btnSpinDo = new GameButton('spin', 'spin.png', lable7, new Point(0, 110), this.menucontainer, undefined, 36, true);


        let lable8 = GameState.getInstance().getLanguage('roulette_ui_11');
        this.btnSpinCancel = new GameButton('cancelspin', 'cancel.png', lable8, new Point(0, 110), this.menucontainer, undefined, 36, true);

        // Sound control button - only sound icon, no background symbol
        this.isMuted = false; // Initialize sound state
        this.bgMusicMuted = false; // Background music state
        let soundLabel = '🔊';  // Sound speaker icon
        this.btnSoundCtrl = new GameButton('soundcontrol', 'spin.png', soundLabel, new Point(0, 0), this.menucontainer, undefined, 48);


        let labletime = GameState.getInstance().getLanguage('roulette_ui_10');
        this.timeTip = new TimeTip('timetip.png', labletime, new Point(0, 60), this.menucontainer, 42, 36, true);
        this.timeTip.setPosition(420, 500);

        this.btnClearBet.onClicked(this.handleButtonClick.bind(this));
        this.btnUndoBet.onClicked(this.handleButtonClick.bind(this));
        this.btnChipChange.onClicked(this.handleButtonClick.bind(this));
        this.btnDoubelBet.onClicked(this.handleButtonClick.bind(this));
        this.btnSpinDo.onClicked(this.handleButtonClick.bind(this));
        this.btnSpinCancel.onClicked(this.handleButtonClick.bind(this));

        this.btnSoundCtrl.onClicked(this.handleButtonClick.bind(this));

        this.btnClearBet.setPosition(420, -680);
        this.btnUndoBet.setPosition(420, -50 - 200);
        this.btnChipChange.setPosition(420, -50);
        this.btnDoubelBet.setPosition(420, -50 + 170);

        this.btnSoundCtrl.setPosition(420, -850); // Position above CLEAR button

        this.btnSpinDo.setPosition(420, 680);
        let autoposi = this.btnSpinDo.getPosition();
        this.btnSpinCancel.setPosition(autoposi.x, autoposi.y);
        this.btnSpinCancel.setVisiable(false);
    }
    initChipBets() {
        this.chipcontainer = new Container();
        this.root.addChild(this.chipcontainer);

        let chipbtnbg = Sprite.from('menubg1.png');
        chipbtnbg.anchor.set(0.5, 0.5);
        chipbtnbg.position.set(420, -50);
        this.chipcontainer.addChild(chipbtnbg);

        let list = GameState.getInstance().getChipLst();
        let chipbtns = [];
        for (let i = 0; i < list.length; i++) {
            let selectchip = list[i];
            let value = selectchip.value;
            let money = GameState.getInstance().formatChipMoney(value);
            let texture = selectchip.color;
            let btnname = 'selectbet' + value;
            let chipbtn = new GameButton(btnname, texture, money, new Point(0, -6), this.chipcontainer, undefined, 42, true);
            chipbtn.setTxtextColor(0x2f2f2f);
            chipbtns.push(chipbtn);
            chipbtn.onClicked(this.handleChangeChipClick.bind(this));
        }

        LayoutHelp.resetPositions(2, new Point(420, -50), 172, chipbtns);

        let posi = chipbtns[0].getPosition();
        this.chipslectbasey = posi.y;
        this.chipslect = Sprite.from('chipbg.png');
        this.chipslect.anchor.set(0.5, 0.5);
        this.chipslect.position.set(420, this.chipslectbasey - 6);
        this.chipcontainer.addChild(this.chipslect);

        this.chipcontainer.visible = false;
    }

    initTableHit() {
        this.recttable.initHits();
    }
    initCircleTable() {
        //noting
    }
    serCfgSuccess() {
        //more resources present
        this.refreshBetChip();
        this.initTableHit();
        this.initChipBets();
        this.initCircleTable();
        this.refreshServHistory();
        this.refreshUnCollectResult();
        this.boradState = MainBoradType.MenuIdle;
        RoomMgr.getInstance().registerUiRootAndMainboard(this, this.root);

    }
    cannotHitChip() {
        let menushow = GameState.getInstance().gamemenuopen;
        let nobet = this.boradState != MainBoradType.MenuIdle || menushow;
        return nobet;
    }
    changeMainboardAni() {
        this.boradState = MainBoradType.WheelAni;
    }
    checkMenuBtnsAble() {
        let nobet = GameState.getInstance().betInfoEnmpty();
        if (nobet || this.boradState != MainBoradType.MenuIdle) {
            this.btnClearBet.setEnabled(false);
            this.btnUndoBet.setEnabled(false);
            this.btnDoubelBet.setEnabled(false);
            this.btnSpinDo.setEnabled(false);
        } else {
            this.btnClearBet.setEnabled(true);
            this.btnUndoBet.setEnabled(true);
            this.btnDoubelBet.setEnabled(true);
            this.btnSpinDo.setEnabled(true);
        }
    }
    lockMenuBtnButSpin(islock) {
        if (islock) {
            this.btnClearBet.setEnabled(false);
            this.btnUndoBet.setEnabled(false);
            this.btnDoubelBet.setEnabled(false);
        } else {
            let nobet = GameState.getInstance().betInfoEnmpty();
            if (nobet || this.boradState != MainBoradType.MenuIdle) {
                this.lockMenuBtnButSpin(true);
            } else {
                this.btnClearBet.setEnabled(true);
                this.btnUndoBet.setEnabled(true);
                this.btnDoubelBet.setEnabled(true);
            }
        }
    }
    createHistoryLabel(text, color) {
        const style = new TextStyle({
            fill: color,
            fontFamily: 'swipegamefont',
            fontSize: 48,
            fontWeight: 'normal',
            lineJoin: 'round',
        });
        let _text = new Text(text, style);
        _text.anchor.set(0.5, 0.5);
        return _text;
    }
    refreshUnCollectResult() {
        const result = RoomMgr.getInstance().getRoundResultNumber();
        const win = RoomMgr.getInstance().getRoundWin();
        if (result != -1) {
            this.refreshResultTip(result);
        }
        GameState.getInstance().refreshWinUi(win);
    }
    refreshServHistory() {
        const lst = GameState.getInstance().getHistoryResults();
        const lstlen = lst.length;
        if (lstlen == 0) return;
        for (let i = 0; i < lstlen; i++) {
            let number = lst[i];
            let color = number == 0 ? '0x1fd911' : BlackNumbers.indexOf(number) >= 0 ? '0x000000' : '0xb30b0b';
            let txtlabel = this.createHistoryLabel(number, color);
            txtlabel.position.set(100 + (lstlen - 1 - i) * HistoryLabel_DiffX, 0);
            this.history.addChild(txtlabel);
        }
    }
    async refreshHistory() {
        let lst = GameState.getInstance().getHistoryResults();
        if (lst.length == 0) return;
        let thelabels = this.history.children;
        if (thelabels.length > ResultMaxLen) {
            let fistlabel = thelabels[0];
            fistlabel.removeFromParent();
            fistlabel.destroy();
        }
        let haslabels = this.history.children;
        for (let i = 0; i < haslabels.length; i++) {
            let label = haslabels[i];
            let move = Action.moveBy(HistoryLabel_DiffX, 0, 0.2);
            label.run(move);
        }
        await Util.delayTime(0.2 * 1000);
        let lastone = lst[lst.length - 1];
        let color = lastone == 0 ? '0x1fd911' : BlackNumbers.indexOf(lastone) >= 0 ? '0x000000' : '0xb30b0b';
        let txtlabel = this.createHistoryLabel(lastone, color);
        txtlabel.position.set(100, 0);
        this.history.addChild(txtlabel);

        let fadein = Action.fadeIn(0.2);
        let scalebig = Action.sequence([Action.scaleTo(1.2, 1.2, 0.2), Action.scaleTo(1, 1, 0.2)]);
        txtlabel.run(fadein);
        txtlabel.run(scalebig);
    }
    update(dt) {
        this.refreshNextDrawTime(dt);
        RoomMgr.getInstance().update(dt);
    }
    refreshNextDrawTime(dt) {
        this.tempDrawTime += dt;
        if (this.tempDrawTime > 0.4) {
            this.tempDrawTime = 0;
            const time = RoomMgr.getInstance().getResultTime();
            this.timeTip.refreshTime(time);
        }
    }
    refreshResultTip(spinresult) {
        this.recttable.showResultItip(spinresult);
    }
    endResetState() {
        this.boradState = MainBoradType.MenuIdle;
        this.lockMenuBtnButSpin(false);
        this.refreshCancelBtnVisiable(false);
        this.refreshHistory();
    }
    refreshBetChip() {
        let selectchip = GameState.getInstance().selectChip;
        let value = selectchip.value;
        let money = GameState.getInstance().formatChipMoney(value);
        let texture = selectchip.color;
        let frame = Texture.from(texture);
        this.btnChipChange.setSpTexture(frame);
        this.btnChipChange.setTxtext(money);
    }
    handleChangeChipClick(name) {
        if (this.boradState != MainBoradType.MenuIdle) {
            return;
        }
        let thenumber = name.replace(/[^\d]/g, '');
        let number = parseInt(thenumber);
        let selectchip = GameState.getInstance().getSelectChipObj(number);
        if (selectchip != null) {
            let index = selectchip.index;
            let posiy = this.chipslectbasey - 6 + 172 * index;
            this.chipslect.position.set(420, posiy);

            GameState.getInstance().setSelectChipAmount(number);
            this.refreshBetChip();

            this.isChipSelecting = false;
            this.refreshChipSelect();
        }
    }
    refreshChipSelect() {
        if (this.isChipSelecting) {
            this.btnUndoBet.setVisiable(false);
            this.btnChipChange.setVisiable(false);
            this.btnDoubelBet.setVisiable(false);
            this.menubtnbg.visible = false;
            this.chipcontainer.visible = true;
        } else {
            this.btnUndoBet.setVisiable(true);
            this.btnChipChange.setVisiable(true);
            this.btnDoubelBet.setVisiable(true);
            this.menubtnbg.visible = true;
            this.chipcontainer.visible = false;
        }
    }
    handleButtonClick(name) {
        if (this.boradState != MainBoradType.MenuIdle) {
            return;
        }
        if (name == 'betclear') {
            GameState.getInstance().clearBetList();
            this.clearAllChips();
            this.checkMenuBtnsAble();
            return;
        }
        if (name == 'soundcontrol') {
            this.toggleSound();
            return;
        }
        if (name == 'undobet') {
            let undohits = GameState.getInstance().undoHitBet();
            this.refreshChipByUndo(undohits);
            this.checkMenuBtnsAble();
            return;
        }
        if (name == 'chipbet') {
            this.isChipSelecting = true;
            this.refreshChipSelect();
            return;
        }
        if (name == 'doubelbet') {
            let dohits = GameState.getInstance().doubleCurHit();
            this.handleDoubleClick(dohits);
            this.refreshAllBetNumberAni();
            return;
        }

        if (name == 'spin') {
            if (!GameState.getInstance().spinCheckEnoughMoney()) {
                return;
            }
            if (GameState.getInstance().betInfoEnmpty()) {
                return;
            }
            this.isChipSelecting = false;
            this.refreshChipSelect();
            this.actionWithStartSpin();
            return;
        }
        if (name == 'cancelspin') {
            this.actionCancelSpin();
        }

    }

    actionWithStartSpin() {
        // this.recttable.clearResulttip();
        GameState.getInstance().refreshBetUi();
        GameState.getInstance().refreshWinUi(0);
        RoomMgr.getInstance().spinBtnAction();
    }
    actionCancelSpin() {
        RoomMgr.getInstance().cancelSpinBtnAction();
    }
    refreshTimeTipColor(isRed) {
        this.timeTip.setColorRed(isRed);
    }
    refreshCancelBtnVisiable(active) {
        let operable = RoomMgr.getInstance().isUerOperable();
        this.btnSpinCancel.setVisiable(active);
        this.btnSpinDo.setVisiable(!active);

        this.btnSpinCancel.setEnabled(active && operable);
        this.btnSpinDo.setEnabled(!active && operable);
    }
    refreshSpinBtnState(active) {
        this.btnSpinDo.setEnabled(active);
    }
    refreshSpinCancelBtnState(active) {
        this.btnSpinCancel.setEnabled(active);
    }
    resetCameraPosi() {
        let moveaction = Action.moveTo(0, 0, 0.2);
        this.root.run(moveaction);
    }
    playCameraMove() {
        let moveaction = Action.moveTo(0, -RouletteCfg.WheelDefaultY, 0.2);
        this.root.run(moveaction);
    }
    handleDoubleClick(dohits) {
        if (dohits == null || dohits.length == 0) {
            return;
        }
        this.refreshChipByUndo(dohits);
    }
    PlayChipNumberAni(number, posix, posiy, root) {
        let money = GameState.getInstance().formatMoney(number);
        var chipnumber = Util.createrTxt(money, 48, '0xe6be01', true);
        chipnumber.anchor.set(0.5, 0.5);
        chipnumber.position.set(posix, posiy);
        root.addChild(chipnumber);
        let action = Action.moveBy(0, -50, 1);
        chipnumber.run(action, () => {
            chipnumber.removeFromParent();
            chipnumber.destroy();
        });
    }
    checkHideChipMenu() {
        if (this.isChipSelecting) {
            this.isChipSelecting = false;
            this.refreshChipSelect();
        }
    }
    canHitBetInBoard() {
        let operable = RoomMgr.getInstance().isUerOperable();
        let cancelbtn = this.btnSpinCancel.isBtnAble();
        return this.boradState == MainBoradType.MenuIdle && operable && !cancelbtn;
    }
    handleCircleClick(betinfos) {
        return;
    }
    handleBoardClick(betinfo) {
        this.checkHideChipMenu();
        let hittag = betinfo.getHitTag();
        let position = this.recttable.clickPositionRect(hittag);
        if (position == null) {
            return;
        }

        let chiphittag = betinfo.getHitTag();
        this.destroyBoardChip(chiphittag);

        let amount = this.betInfoTotalBet(chiphittag, false);

        let selectchip = GameState.getInstance().getMaxChipObj(amount);
        if (selectchip != null) {
            let texture = selectchip.color;
            let chip = new Chip(amount, chiphittag, texture, position.x, position.y, this.tableroot);
            this.tableChipList.push(chip);
        }

        this.checkMenuBtnsAble();
    }
    destroyBoardChip(chiphittag) {
        let chiplen = this.tableChipList.length;
        for (let i = chiplen - 1; i >= 0; i--) {
            let chip = this.tableChipList[i];
            if (chip.chiphittag == chiphittag) {
                let lastchip = this.tableChipList.splice(i, 1);
                lastchip[0].destroy();
                return;
            }
        }
    }
    refreshChipByUndo(dohits) {
        if (dohits == null || dohits.length == 0) {
            return;
        }
        let refreshtags = [];
        let refreshbets = [];
        for (let i = dohits.length - 1; i >= 0; i--) {
            let betinfo = dohits[i];
            let chiptag = betinfo.getHitTag();
            if (refreshtags.indexOf(chiptag) == -1) {
                refreshtags.push(chiptag);
                refreshbets.push(betinfo);
            }
        }
        for (let i = refreshbets.length - 1; i >= 0; i--) {
            let betinfo = refreshbets[i];
            if (betinfo.getIsCircleBet()) {
                let circletag = betinfo.getHitTag();
                this.clearTheChipsByTag(circletag);

                let chiptag = betinfo.getHitTag();
                this.clearTheChipsByTag(chiptag);
            } else {
                let chiptag = betinfo.getHitTag();
                this.clearTheChipsByTag(chiptag);
            }
        }

        for (let i = refreshbets.length - 1; i >= 0; i--) {
            let betinfo = refreshbets[i];

            if (betinfo.getIsCircleBet()) {
                // 环形附带处理了table
                this.handleCircleClick([betinfo]);
            } else {
                this.handleBoardClick(betinfo);
            }
        }
    }
    boradTotalBet(iscircle) {
        let betTags = [];
        let betInfos = [];
        let betList = GameState.getInstance().getBetLsts();
        let betlens = betList.length;
        for (let i = 0; i < betlens; i++) {
            let betinfo = betList[i];
            if (iscircle && !betinfo.getIsCircleBet()) {
                continue;
            }
            let bettag = betinfo.getHitTag();
            let betamount = betinfo.amount;
            let tagindex = betTags.indexOf(bettag);
            if (tagindex == -1) {
                let onebet = { amount: betamount, hittag: bettag };
                betTags.push(bettag);
                betInfos.push(onebet);
            } else {
                let thebet = betInfos[tagindex];
                thebet.amount += betamount;
            }
        }
        return betInfos;
    }
    betInfoTotalBet(betinfotag, iscircle) {
        let totalbet = 0;
        let betList = GameState.getInstance().getBetLsts();
        let betlens = betList.length;
        for (let i = 0; i < betlens; i++) {
            let betinfo = betList[i];
            let bettag = betinfo.getHitTag();
            if (iscircle) {
                bettag = betinfo.getHitTag();
            }
            let betamount = betinfo.amount;
            if (bettag == betinfotag) {
                totalbet += betamount;
            }
        }
        return totalbet;
    }
    refreshTableBetNumberAni(betinfo) {
        if (!this.isTableRect) {
            return;
        }
        let betinfotag = betinfo.getHitTag();
        let amount = this.betInfoTotalBet(betinfotag, false);
        let position = this.recttable.clickPositionRect(betinfotag);
        if (position != null) {
            this.PlayChipNumberAni(amount, position.x, position.y, this.tableroot);
        }
    }
    refreshAllBetNumberAni() {
        if (this.isTableRect) {
            let bets = this.boradTotalBet(false);
            for (let i = bets.length - 1; i >= 0; i--) {
                let betinfo = bets[i];
                let hittag = betinfo.hittag;
                let amount = betinfo.amount;
                let position = this.recttable.clickPositionRect(hittag);
                if (position == null) {
                    continue;
                }
                this.PlayChipNumberAni(amount, position.x, position.y, this.tableroot);
            }
        }
    }
    clearTheChipsByTag(chiptag) {
        for (let i = this.tableChipList.length - 1; i >= 0; i--) {
            let chip = this.tableChipList[i];
            if (chip.chiphittag == chiptag) {
                chip.destroy();
                this.tableChipList.splice(i, 1);
            }
        }
    }
    clearAllChips() {
        for (let i = this.tableChipList.length - 1; i >= 0; i--) {
            let chip = this.tableChipList[i];
            chip.destroy();
        }
        this.tableChipList.length = 0;
    }

    /**
     * new add
     */
    toggleSound() {
        // Show/hide the sound popup
        if (this.soundPopup) {
            this.soundPopup.toggle();
        }
    }

    setupMusicAutoplayHandler() {
        console.log('[MainBoard] Setting up music autoplay handlers');

        let hasTriggered = false;

        // Handle mobile browser autoplay restrictions
        // Start music on FIRST user interaction
        const startMusicOnInteraction = (event) => {
            if (hasTriggered) {
                return; // Already handled
            }

            hasTriggered = true;
            console.log('[MainBoard] ✓ User interaction detected:', event.type);

            if (this.backgroundMusicManager) {
                this.backgroundMusicManager.startOnUserInteraction();
            }

            // Remove all listeners after first trigger
            removeAllListeners();
        };

        const removeAllListeners = () => {
            events.forEach(eventType => {
                document.removeEventListener(eventType, startMusicOnInteraction, true);
                window.removeEventListener(eventType, startMusicOnInteraction, true);
            });
        };

        // Listen for ALL possible user interactions
        const events = ['touchstart', 'touchend', 'mousedown', 'mouseup', 'click', 'keydown', 'pointerdown'];

        // Add listeners on both capture and bubble phase to catch everything
        events.forEach(eventType => {
            // Document level (capture phase = true)
            document.addEventListener(eventType, startMusicOnInteraction, true);
            // Window level
            window.addEventListener(eventType, startMusicOnInteraction, false);
        });

        console.log('[MainBoard] Music autoplay handlers ready - waiting for ANY user touch/click');
    }

    updateBackgroundMusicState(muted) {
        this.bgMusicMuted = muted;

        // Control background music playlist
        if (this.backgroundMusicManager) {
            if (muted) {
                this.backgroundMusicManager.mute();
            } else {
                this.backgroundMusicManager.unmute();
            }
        }

        // Control background video sound
        if (this.wheel && this.wheel.videoManager) {
            const bgVideo = this.wheel.videoManager.backgroundVideo;
            if (bgVideo) {
                bgVideo.muted = muted;
            }
        }
    }

    updateGameSoundState(muted) {
        this.gameSoundMuted = muted;

        // Control result video sound
        if (this.wheel && this.wheel.videoManager && this.wheel.videoManager.currentVideo) {
            this.wheel.videoManager.currentVideo.muted = muted;
        }

        // Also control background video if game sound is muted
        if (muted && this.wheel && this.wheel.videoManager) {
            const bgVideo = this.wheel.videoManager.backgroundVideo;
            if (bgVideo) {
                bgVideo.muted = true;
            }
        }
    }
    // HIDE UI ELEMENTS: Hide Clear, Undo, coin image, X2 double and border during video
    hideVideoModeUIElements() {
        // Hide specific UI elements: Clear, Undo, coin image, X2 double
        this.btnClearBet.setVisiable(false); // Clear
        this.btnSoundCtrl.setVisiable(false); // Sound
        this.btnUndoBet.setVisiable(false); // Undo
        this.btnChipChange.setVisiable(false); // Coin image
        this.btnDoubelBet.setVisiable(false); // X2 double
        this.timeTip.setVisiable(false);
        // Hide the UI border/background
        this.menubtnbg.visible = false; // Menu background border
    }

    // SHOW UI ELEMENTS: Restore Clear, Undo, coin image, X2 double and border after video
    showVideoModeUIElements() {
        // Show specific UI elements: Clear, Undo, coin image, X2 double
        this.btnClearBet.setVisiable(true); // Clear
        this.btnSoundCtrl.setVisiable(true); // Sound
        this.btnUndoBet.setVisiable(true); // Undo
        this.btnChipChange.setVisiable(true); // Coin image
        this.btnDoubelBet.setVisiable(true); // X2 double
        this.timeTip.setVisiable(true); // Time tip
        // Show the UI border/background
        this.menubtnbg.visible = true; // Menu background border
    }
    // RESTORE TABLE TO ORIGINAL SIZE - Called when video ends
    restoreTableTransforms() {
        if (this.originalTableTransforms) {
            // Restore tableroot to original scale AND position
            this.tableroot.scale.set(this.originalTableTransforms.tableroot.scaleX, this.originalTableTransforms.tableroot.scaleY);
            this.tableroot.position.set(this.originalTableTransforms.tableroot.x, this.originalTableTransforms.tableroot.y);

            // Restore chipcontainer to original scale AND position
            this.chipcontainer.scale.set(this.originalTableTransforms.chipcontainer.scaleX, this.originalTableTransforms.chipcontainer.scaleY);
            this.chipcontainer.position.set(this.originalTableTransforms.chipcontainer.x, this.originalTableTransforms.chipcontainer.y);

            // Clear saved transforms for next use
            this.originalTableTransforms = null;

            // RESTORE UI ELEMENTS after video ends
            this.showVideoModeUIElements();
        }
    }
    enterSplitScreenMode() {
        // Save original transforms AND positions for both containers
        if (!this.originalTableTransforms) {
            this.originalTableTransforms = {
                tableroot: {
                    scaleX: this.tableroot.scale.x,
                    scaleY: this.tableroot.scale.y,
                    x: this.tableroot.x,
                    y: this.tableroot.y,
                },
                chipcontainer: {
                    scaleX: this.chipcontainer.scale.x,
                    scaleY: this.chipcontainer.scale.y,
                    x: this.chipcontainer.x,
                    y: this.chipcontainer.y,
                },
            };
        }
         // Get table bounds and compute visual center point
         const tableBounds = this.tableroot.getLocalBounds();
         const chipBounds = this.chipcontainer.getLocalBounds();
 
         // Calculate center points in local coordinates
         const tableCenterLocal = { x: tableBounds.x + tableBounds.width / 2, y: tableBounds.y + tableBounds.height / 2 };
         const chipCenterLocal = { x: chipBounds.x + chipBounds.width / 2, y: chipBounds.y + chipBounds.height / 2 };


          // Convert to global coordinates BEFORE scaling
        const tableCenterGlobalBefore = this.tableroot.toGlobal(tableCenterLocal);
        const chipCenterGlobalBefore = this.chipcontainer.toGlobal(chipCenterLocal);

        // HIDE UI ELEMENTS during video playback
        this.hideVideoModeUIElements();

        // Apply scaling temporarily to calculate drift, then smooth transition
        // Shrink table much more - scale down to 0.5 width and 0.6 height for much smaller size during spin
        this.tableroot.scale.set(0.5, 0.6);
        this.chipcontainer.scale.set(0.5, 0.6);

        // Convert same local points to global coordinates AFTER scaling
        const tableCenterGlobalAfter = this.tableroot.toGlobal(tableCenterLocal);
        const chipCenterGlobalAfter = this.chipcontainer.toGlobal(chipCenterLocal);

        // Calculate drift and compensate by adjusting container positions
        const tableDrift = {
            x: tableCenterGlobalBefore.x - tableCenterGlobalAfter.x,
            y: tableCenterGlobalBefore.y - tableCenterGlobalAfter.y,
        };
        const chipDrift = {
            x: chipCenterGlobalBefore.x - chipCenterGlobalAfter.x,
            y: chipCenterGlobalBefore.y - chipCenterGlobalAfter.y,
        };

        // Reset scale for smooth transition
        this.tableroot.scale.set(this.originalTableTransforms.tableroot.scaleX, this.originalTableTransforms.tableroot.scaleY);
        this.chipcontainer.scale.set(this.originalTableTransforms.chipcontainer.scaleX, this.originalTableTransforms.chipcontainer.scaleY);

        // SMOOTH TABLE TRANSITION: Calculate final positions with drift compensation and movement
        // Desktop: Normal movement, Mobile: Move table down much more
        const screenWidth = window.innerWidth || 1024;
        const tableMovement = screenWidth > 768 ? 400 : 500; // Mobile moves down much more for better video visibility
        const tableTargetX = this.tableroot.x + tableDrift.x;
        const tableTargetY = this.tableroot.y + tableDrift.y + tableMovement;
        const chipTargetX = this.chipcontainer.x + chipDrift.x;
        const chipTargetY = this.chipcontainer.y + chipDrift.y + tableMovement;

        // Create smooth transition actions (0.5 second duration)
        const transitionDuration = 0.5;
        // Shrink table much more - scale down to 0.5 width and 0.6 height
        const tableScaleAction = Action.scaleTo(0.5, 0.6, transitionDuration);
        const chipScaleAction = Action.scaleTo(0.5, 0.6, transitionDuration);
        const tableMoveAction = Action.moveTo(tableTargetX, tableTargetY, transitionDuration);
        const chipMoveAction = Action.moveTo(chipTargetX, chipTargetY, transitionDuration);

        // Combine scale and move actions for simultaneous smooth transition
        const tableAction = Action.group([tableScaleAction, tableMoveAction]);
        const chipAction = Action.group([chipScaleAction, chipMoveAction]);

        // Run both transitions simultaneously, wait for server response to play video
        this.tableroot.run(tableAction);
        this.chipcontainer.run(chipAction, () => {
            // Notify ConvAI integration that spin started
            // if (this.convaiIntegration) {
            //     this.convaiIntegration.handleGameEvent('spin_started');
            // }
            
            // Video will be triggered from OnSpinRet() when server responds
        });


    }

    exitSplitScreenMode() {
        this.restoreTableTransforms();
    }
}
