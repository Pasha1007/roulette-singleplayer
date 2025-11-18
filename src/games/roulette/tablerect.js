import { Container, Sprite, Rectangle, Graphics, Point } from 'pixi.js';
import { SixHitConfig, FourHitConfig, ThreeHitConfig, TwoHitConfig, SingleHitConfig } from './config';
import GameState from './gamestate';
export const DefaultTableDiffx = -95;
export const DefaultTableDiffY = -50;

const BighitScaleX = 4.2;
const BighitScaleY = 14;
const smallcountw = 3;
const smallcounth = 12;
const centerRectW = 40;
const bigrect = new Rectangle(0 - 580 * 0.5 + 108, 0 - 1340 * 0.5, 580, 1340);
export default class TableRect {
    constructor(root) {
        this.root = root;
        this.initTable();
    }

    initTable() {
        this.container = new Container();
        this.container.position.set(DefaultTableDiffx, DefaultTableDiffY);
        this.root.addChild(this.container);

        let board = Sprite.from('table1.png');
        board.anchor.set(0.5, 0.5);
        board.position.set(0, 0);
        this.container.addChild(board);
    }
    initHits() {
        this.winnumbertip = null;
        this.hitsptips = [];
        this.singleHitRects = [];
        this.doubleHitRects = [];
        this.threeHitRects = [];
        this.fourHitRects = [];
        this.sixHitRects = [];
        this.initHitTips();
        this.initHitLeftTips();
        this.initHitBottomTips();
        this.initHitRightTips();

        this.initDoubleRect();
        this.initThreeRect();
        this.initFourRect();
        this.initSixRect();
        this.initHitEvents();
    }
    initSixRect() {
        let smallhitw = bigrect.width / smallcountw;
        let smallhith = bigrect.height / smallcounth;
        let startx = bigrect.x;
        let starty = bigrect.y;

        for (let y = 1; y < smallcounth; y++) {
            let rect = new Rectangle(startx - centerRectW * 0.5, starty + y * smallhith - centerRectW * 0.5, centerRectW, centerRectW);
            this.sixHitRects.push(rect);

            // let graphics = new Graphics();
            // graphics.beginFill(0xFF0000);
            // graphics.drawRect(rect.x, rect.y, rect.width, rect.height);
            // graphics.endFill();
            // this.container.addChild(graphics);
        }
    }
    initFourRect() {
        let smallhitw = bigrect.width / smallcountw;
        let smallhith = bigrect.height / smallcounth;
        let startx = bigrect.x;
        let starty = bigrect.y;

        let rect = new Rectangle(startx - centerRectW * 0.5, starty - centerRectW * 0.5, centerRectW, centerRectW);
        this.fourHitRects.push(rect);

        // let graphics = new Graphics();
        // graphics.beginFill(0xFF0000);
        // graphics.drawRect(rect.x, rect.y, rect.width, rect.height);
        // graphics.endFill();
        // this.container.addChild(graphics);

        for (let y = 1; y < smallcounth; y++) {
            for (let x = 1; x < smallcountw; x++) {
                let rect = new Rectangle(startx + x * smallhitw - centerRectW * 0.5, starty + y * smallhith - centerRectW * 0.5, centerRectW, centerRectW);
                this.fourHitRects.push(rect);

                // let graphics = new Graphics();
                // graphics.beginFill(0xFF0000);
                // graphics.drawRect(rect.x, rect.y, rect.width, rect.height);
                // graphics.endFill();
                // this.container.addChild(graphics);
            }
        }
    }
    initThreeRect() {
        let smallhitw = bigrect.width / smallcountw;
        let smallhith = bigrect.height / smallcounth;
        let startx = bigrect.x;
        let starty = bigrect.y;

        for (let y = 0; y < smallcounth; y++) {
            let rect = new Rectangle(startx - centerRectW * 0.5, starty + y * smallhith, centerRectW, smallhith);
            this.threeHitRects.push(rect);

            // let graphics = new Graphics();
            // graphics.beginFill(0xFF0000);
            // graphics.drawRect(rect.x, rect.y, rect.width, rect.height);
            // graphics.endFill();
            // this.container.addChild(graphics);
        }

        let rect1 = new Rectangle(startx + smallhitw - centerRectW * 0.5, starty - centerRectW * 0.5, centerRectW, centerRectW);
        this.threeHitRects.push(rect1);

        // let graphics1 = new Graphics();
        // graphics1.beginFill(0xFF0000);
        // graphics1.drawRect(rect1.x, rect1.y, rect1.width, rect1.height);
        // graphics1.endFill();
        // this.container.addChild(graphics1);

        let rect2 = new Rectangle(startx + 2 * smallhitw - centerRectW * 0.5, starty - centerRectW * 0.5, centerRectW, centerRectW);
        this.threeHitRects.push(rect2);

        // let graphics2 = new Graphics();
        // graphics2.beginFill(0xFF0000);
        // graphics2.drawRect(rect2.x, rect2.y, rect2.width, rect2.height);
        // graphics2.endFill();
        // this.container.addChild(graphics2);
    }
    initDoubleRect() {
        let smallhitw = bigrect.width / smallcountw;
        let smallhith = bigrect.height / smallcounth;
        let startx = bigrect.x;
        let starty = bigrect.y;

        for (let y = 0; y < smallcounth; y++) {
            for (let x = 0; x < smallcountw; x++) {
                let rect = new Rectangle(startx + x * smallhitw, starty + y * smallhith - centerRectW * 0.5, smallhitw, centerRectW);
                this.doubleHitRects.push(rect);

                // let graphics = new Graphics();
                // graphics.beginFill(0xFF0000);
                // graphics.drawRect(rect.x, rect.y, rect.width, rect.height);
                // graphics.endFill();
                // this.container.addChild(graphics);
            }
        }

        for (let y = 0; y < smallcounth; y++) {
            for (let x = 1; x < smallcountw; x++) {
                let rect = new Rectangle(startx - centerRectW * 0.5 + x * smallhitw, starty + y * smallhith, centerRectW, smallhith);
                this.doubleHitRects.push(rect);

                // let graphics = new Graphics();
                // graphics.beginFill(0xFF0000);
                // graphics.drawRect(rect.x, rect.y, rect.width, rect.height);
                // graphics.endFill();
                // this.container.addChild(graphics);
            }
        }
    }
    initHitTips() {
        //rect&&tip:0
        let hittip0 = Sprite.from('chiptip4.png');
        hittip0.anchor.set(0.5, 0.5);
        hittip0.position.set(108, -720);
        hittip0.alpha = 0;
        this.container.addChild(hittip0);
        this.hitsptips.push(hittip0);

        let rect = new Rectangle(108 - 580 * 0.5, -720 - 95 * 0.5, 580, 95);
        this.singleHitRects.push(rect);


        // let graphics2 = new Graphics();
        // graphics2.beginFill(0xFF0000);
        // graphics2.drawRect(bigrect.x, bigrect.y, bigrect.width, bigrect.height);
        // graphics2.endFill();
        // this.container.addChild(graphics2);
        //rect&&tip:1-36
        let startx = bigrect.x;
        let starty = bigrect.y;
        let smallhitw = bigrect.width / smallcountw;
        let smallhith = bigrect.height / smallcounth;

        for (let y = 0; y < smallcounth; y++) {
            for (let x = 0; x < smallcountw; x++) {
                let posix = startx + x * smallhitw + smallhitw * 0.5;
                let posiy = starty + y * smallhith + smallhith * 0.5;
                let recttip = Sprite.from('chiptip1.png');
                recttip.anchor.set(0.5, 0.5);
                recttip.alpha = 0;
                recttip.position.set(posix, posiy);
                this.container.addChild(recttip);
                this.hitsptips.push(recttip);

                let rect = new Rectangle(startx + x * smallhitw, starty + y * smallhith, smallhitw, smallhith);
                this.singleHitRects.push(rect);
            }
        }
    }
    initHitLeftTips() {
        //rect&&tip:left37-39
        let hittip37 = Sprite.from('chiptip0.png');
        hittip37.anchor.set(0.5, 0.5);
        hittip37.position.set(-238, -447);
        hittip37.alpha = 0;
        this.container.addChild(hittip37);
        this.hitsptips.push(hittip37);

        let rect37 = new Rectangle(-238 - 106 * 0.5, -447 - 446 * 0.5, 106, 446);
        this.singleHitRects.push(rect37);

        let hittip38 = Sprite.from('chiptip0.png');
        hittip38.anchor.set(0.5, 0.5);
        hittip38.position.set(-238, 0);
        hittip38.alpha = 0;
        this.container.addChild(hittip38);
        this.hitsptips.push(hittip38);

        let rect38 = new Rectangle(-238 - 106 * 0.5, 0 - 446 * 0.5, 106, 446);
        this.singleHitRects.push(rect38);

        let hittip39 = Sprite.from('chiptip0.png');
        hittip39.anchor.set(0.5, 0.5);
        hittip39.position.set(-238, 447);
        hittip39.alpha = 0;
        this.container.addChild(hittip39);
        this.hitsptips.push(hittip39);

        let rect39 = new Rectangle(-238 - 106 * 0.5, 447 - 446 * 0.5, 106, 446);
        this.singleHitRects.push(rect39);
    }
    initHitBottomTips() {
        //rect&&tip:left40-42
        let hittip40 = Sprite.from('chiptip2.png');
        hittip40.anchor.set(0.5, 0.5);
        hittip40.position.set(-86, 720);
        hittip40.alpha = 0;
        this.container.addChild(hittip40);
        this.hitsptips.push(hittip40);

        let rect40 = new Rectangle(-86 - 192 * 0.5, 720 - 92 * 0.5, 192, 92);
        this.singleHitRects.push(rect40);

        let hittip41 = Sprite.from('chiptip1.png');
        hittip41.anchor.set(0.5, 0.5);
        hittip41.position.set(-86 + 194, 720);
        hittip41.scale.set(1, 0.836);
        hittip41.alpha = 0;
        this.container.addChild(hittip41);
        this.hitsptips.push(hittip41);

        let rect41 = new Rectangle(-86 + 194 - 192 * 0.5, 720 - 92 * 0.5, 192, 92);
        this.singleHitRects.push(rect41);

        let hittip42 = Sprite.from('chiptip2.png');
        hittip42.anchor.set(0.5, 0.5);
        hittip42.position.set(-86 + 194 + 194, 720);
        hittip42.scale.set(-1, 1);
        hittip42.alpha = 0;
        this.container.addChild(hittip42);
        this.hitsptips.push(hittip42);

        let rect42 = new Rectangle(-86 + 194 + 194 - 192 * 0.5, 720 - 92 * 0.5, 192, 92);
        this.singleHitRects.push(rect42);
    }
    initHitRightTips() {
        //rect&&tip:left43-48
        let hittip43 = Sprite.from('chiptip3.png');
        hittip43.anchor.set(0.5, 0.5);
        hittip43.position.set(-346, -558);
        hittip43.alpha = 0;
        this.container.addChild(hittip43);
        this.hitsptips.push(hittip43);

        let rect43 = new Rectangle(-346 - 106 * 0.5, -558 - 222 * 0.5, 106, 222);
        this.singleHitRects.push(rect43);

        for (let i = 0; i < 4; i++) {
            let hittip44 = Sprite.from('chiptip1.png');
            hittip44.anchor.set(0.5, 0.5);
            hittip44.position.set(-346, -336 + 224 * i);
            hittip44.scale.set(0.55, 2.02);
            hittip44.alpha = 0;
            this.container.addChild(hittip44);
            this.hitsptips.push(hittip44);

            let rect44 = new Rectangle(-346 - 106 * 0.5, -336 + 224 * i - 222 * 0.5, 106, 222);
            this.singleHitRects.push(rect44);
        }

        let hittip48 = Sprite.from('chiptip3.png');
        hittip48.anchor.set(0.5, 0.5);
        hittip48.position.set(-346, 560);
        hittip48.scale.set(1, -1);
        hittip48.alpha = 0;
        this.container.addChild(hittip48);
        this.hitsptips.push(hittip48);

        let rect48 = new Rectangle(-346 - 106 * 0.5, 560 - 222 * 0.5, 106, 222);
        this.singleHitRects.push(rect48);
    }
    initHitEvents() {
        this.hitevent = Sprite.from('chiptip1.png');
        this.hitevent.alpha = 0;
        this.hitevent.anchor.set(0.5, 0.5);
        this.hitevent.position.set(0, 0);
        this.hitevent.scale.set(BighitScaleX, BighitScaleY);
        this.container.addChild(this.hitevent);
        this.hitevent.interactive = true;
        this.hitevent.buttonMode = true;
        this.hitevent.on('pointermove', this.handleOnPointerMove.bind(this), this);
        this.hitevent.on('pointerout', this.handleOnPointerOut.bind(this), this);
        this.hitevent.on('pointerdown', this.handleOnPointerDown.bind(this), this);
    }
    handleOnPointerDown(event) {
        let mainborad = GameState.getInstance().getMainBoard();
        if (mainborad && mainborad.cannotHitChip()) {
            return;
        }

        const localPos = event.data.getLocalPosition(this.hitevent);
        let posixx = localPos.x * BighitScaleX;
        let posixy = localPos.y * BighitScaleY;

        let rectlen6 = this.sixHitRects.length;
        for (let i = 0; i < rectlen6; i++) {
            let rect = this.sixHitRects[i];
            if (rect.contains(posixx, posixy)) {
                let posis = SixHitConfig.hit[i];
                let hittag = SixHitConfig.type + i;
                this.handleTableClick(hittag, posis);
                this.clearAllHitTips();
                return;
            }
        }
        let rectlen4 = this.fourHitRects.length;
        for (let i = 0; i < rectlen4; i++) {
            let rect = this.fourHitRects[i];
            if (rect.contains(posixx, posixy)) {
                let posis = FourHitConfig.hit[i];
                let hittag = FourHitConfig.type + i;
                this.handleTableClick(hittag, posis);
                this.clearAllHitTips();
                return;
            }
        }

        let rectlen3 = this.threeHitRects.length;
        for (let i = 0; i < rectlen3; i++) {
            let rect = this.threeHitRects[i];
            if (rect.contains(posixx, posixy)) {
                let posis = ThreeHitConfig.hit[i];
                let hittag = ThreeHitConfig.type + i;
                this.handleTableClick(hittag, posis);
                this.clearAllHitTips();
                return;
            }
        }

        let rectlen2 = this.doubleHitRects.length;
        for (let i = 0; i < rectlen2; i++) {
            let rect = this.doubleHitRects[i];
            if (rect.contains(posixx, posixy)) {
                let posis = TwoHitConfig.hit[i];
                let hittag = TwoHitConfig.type + i;
                this.handleTableClick(hittag, posis);
                this.clearAllHitTips();
                return;
            }
        }

        let rectlen = this.singleHitRects.length;
        for (let i = 0; i < rectlen; i++) {
            let rect = this.singleHitRects[i];
            if (rect.contains(posixx, posixy)) {
                let posis = SingleHitConfig.hit[i];
                let hittag = SingleHitConfig.type + i;
                this.handleTableClick(hittag, posis);
                this.clearAllHitTips();
                return;
            }
        }
    }
    handleOnPointerMove(event) {
        let mainborad = GameState.getInstance().getMainBoard();
        if (mainborad && mainborad.cannotHitChip()) {
            return;
        }
        const localPos = event.data.getLocalPosition(this.hitevent);
        let posixx = localPos.x * BighitScaleX;
        let posixy = localPos.y * BighitScaleY;

        let rectlen6 = this.sixHitRects.length;
        for (let i = 0; i < rectlen6; i++) {
            let rect = this.sixHitRects[i];
            if (rect.contains(posixx, posixy)) {
                let posis = SixHitConfig.hit[i];
                this.clearHitTips(posis);
                return;
            }
        }
        let rectlen4 = this.fourHitRects.length;
        for (let i = 0; i < rectlen4; i++) {
            let rect = this.fourHitRects[i];
            if (rect.contains(posixx, posixy)) {
                let posis = FourHitConfig.hit[i];
                this.clearHitTips(posis);
                return;
            }
        }

        let rectlen3 = this.threeHitRects.length;
        for (let i = 0; i < rectlen3; i++) {
            let rect = this.threeHitRects[i];
            if (rect.contains(posixx, posixy)) {
                let posis = ThreeHitConfig.hit[i];
                this.clearHitTips(posis);
                return;
            }
        }

        let rectlen2 = this.doubleHitRects.length;
        for (let i = 0; i < rectlen2; i++) {
            let rect = this.doubleHitRects[i];
            if (rect.contains(posixx, posixy)) {
                let posis = TwoHitConfig.hit[i];
                this.clearHitTips(posis);
                return;
            }
        }

        let rectlen = this.singleHitRects.length;
        for (let i = 0; i < rectlen; i++) {
            let rect = this.singleHitRects[i];
            if (rect.contains(posixx, posixy)) {
                let posis = SingleHitConfig.hit[i];
                this.clearHitTips(posis);

                return;
            }
        }
    }
    handleOnPointerOut() {
        this.clearAllHitTips();
    }
    clearAllHitTips() {
        this.clearHitTips();
    }
    clearHitTips(shows) {
        if (shows == null || shows == undefined) {
            shows = [];
        }
        let len = this.hitsptips.length;
        for (let i = 0; i < len; i++) {
            let tips = this.hitsptips[i];
            tips.alpha = 0;
        }
        let len2 = shows.length;
        for (let i = 0; i < len2; i++) {
            let index = shows[i];
            let tips = this.hitsptips[index];
            tips.alpha = 1;
        }
    }

    handleTableClick(hittag, numbers) {
        let mainborad = GameState.getInstance().getMainBoard();
        if(mainborad&&mainborad.canHitBetInBoard()){
            const betinfo = GameState.getInstance().hitBet(hittag, numbers);
            mainborad.handleBoardClick(betinfo);
            mainborad.refreshTableBetNumberAni(betinfo);
        }
    }
    showResultItip(number) {
        this.clearResulttip();
        let hitinfo = SingleHitConfig.type + number;
        let position = this.clickPositionRect(hitinfo);
        if (position != null) {
            let wink = 'wink1.png';
            if (number == 0) {
                wink = 'wink0.png';
            }
            this.winnumbertip = Sprite.from(wink);
            this.winnumbertip.anchor.set(0.5, 0.5);
            this.winnumbertip.position.set(position.x - DefaultTableDiffx, position.y - DefaultTableDiffY);
            this.container.addChild(this.winnumbertip);
        }
    }
    clearResulttip() {
        if (this.winnumbertip != null) {
            this.winnumbertip.removeFromParent();
            this.winnumbertip.destroy();
            this.winnumbertip = null;
        }
    }
    clickPositionRect(hittag) {
        let thenumber = hittag.replace(/[^\d]/g, '');
        let index = parseInt(thenumber);
        let rect = null;
        if (hittag.indexOf('Six') != -1) {
            rect = this.sixHitRects[index];
        }
        if (hittag.indexOf('Corner') != -1) {
            rect = this.fourHitRects[index];
        }
        if (hittag.indexOf('Street') != -1) {
            rect = this.threeHitRects[index];
        }
        if (hittag.indexOf('Split') != -1) {
            rect = this.doubleHitRects[index];
        }
        if (hittag.indexOf('Single') != -1) {
            rect = this.singleHitRects[index];
        }
        if (rect != null) {
            let centerposi = new Point(rect.x + rect.width / 2, rect.y + rect.height / 2);
            centerposi.x += DefaultTableDiffx;
            centerposi.y += DefaultTableDiffY;
            return centerposi;
        }
        return null;
    }
}
