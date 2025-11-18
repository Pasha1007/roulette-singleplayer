import { Container, Point, Graphics, TextStyle, Sprite, AnimatedSprite, Texture } from 'pixi.js';
import { Action } from 'pixijs-actions';
import Util from './Util';
import GameState from './gamestate';
import { BlackNumbers, RedNumbers} from './config';
export default class RouletteWin {
    constructor(root) {
        this.coinanicountspeed = 1;
        this.coinanitimecount = 0;
        this.coinanitimediff = 0.1;
        this.coinanistilltime = -1;
        this.coincontainer = null;
        this.stopupdate = true;
        this.container = new Container();
        root.addChild(this.container)
    }

    numberColor(number) {
        if (RedNumbers.indexOf(number) >= 0) {
            return 0x7e0000;
        } else if (BlackNumbers.indexOf(number) >= 0) {
            return 0x000000;
        } else {
            return 0x307c03;
        }
    }
    initWinAniPosi(px,py){
        this.container.position.set(px,py);
    }
    initResultNumber(resultnumber) {
        this.resultnode = new Container();

        let resultcolor = this.numberColor(resultnumber);
        let initialCircle = new Graphics();
        initialCircle.beginFill(resultcolor);
        initialCircle.drawCircle(0, 0, 130);
        initialCircle.endFill();
        this.resultnode.addChild(initialCircle);

        let board = Sprite.from('winbg.png');
        board.anchor.set(0.5, 0.5);
        board.position.set(0, 0);
        this.resultnode.addChild(board);

        let resulttext = Util.createrTxt(resultnumber, 128, '0xffffff', true);
        resulttext.anchor.set(0.5, 0.5);
        this.resultnode.addChild(resulttext);
        this.resultnode.position.set(0, -300);

        this.resultnode.scale.set(0, 0);
        this.container.addChild(this.resultnode);

        let scaleto = Action.scaleTo(1, 1, 0.2);
        this.resultnode.run(scaleto);
    }
    initCoinWin(targetcoin, totalbet, anitime) {
        if (targetcoin <= 0) {
            return;
        }
        this.stopupdate = false;

        this.coinanicountspeed = Math.floor((targetcoin / totalbet) * 0.4) + 1;
        this.coinanicountspeed = Math.min(5, this.coinanicountspeed);
        this.coinanitimediff = 0.01;
        this.coinanitimecount = 0;
        this.coinanistilltime = anitime;

        let wintipbasey = -150;
        this.coincontainer = new Container();
        this.container.addChild(this.coincontainer);

        let winbg = Sprite.from('resultwin.png');
        winbg.anchor.set(0.5, 0.5);
        winbg.position.set(0, wintipbasey + 200);
        this.container.addChild(winbg);

        let style = new TextStyle({
            fill: 0xfff47c,
            fontFamily: 'swipegamefont',
            fontWeight: 'bold',
            fontSize: 220,
            lineJoin: 'round',
        });

        let youwin = GameState.getInstance().getLanguage('common_label_congratulations');
        let youwinText = Util.createrTxtStyle(youwin, 72, style);
        youwinText.position.set(0, wintipbasey + 100);
        this.container.addChild(youwinText);

        let money = GameState.getInstance().formatMoney(targetcoin);
        this.m_numberText = Util.createrTxtStyle(money, 120, style);
        this.m_numberText.anchor.set(0.5, 0.5);
        this.m_numberText.position.set(0, wintipbasey + 250);
        this.container.addChild(this.m_numberText);

        this.scaleCoinWinNumber();
    }
    clearCoinWin() {
        this.stopupdate = true;
        this.coinanistilltime = -1;
        if (this.coincontainer != null) {
            this.coincontainer.removeFromParent();
            this.coincontainer.destroy({ children: true });
            this.coincontainer = null;
        }
        if (this.resultnode != null) {
            this.resultnode.removeFromParent();
            this.resultnode.destroy({ children: true });
            this.resultnode = null;
        }
        this.container.removeChildren();
    }
    update(dt) {
        if (this.stopupdate) {
            return;
        }
        if (this.coinanistilltime > 0) {
            this.coinanistilltime -= dt;
            this.coinanitimecount += dt;
            if (this.coinanitimecount >= this.coinanitimediff) {
                this.coinanitimediff += 0.008;
                this.coinanitimediff = Math.min(this.coinanitimediff, 0.5);
                this.coinanitimecount = 0;
                this.showWinAni();
            }
        }
    }
    scaleCoinWinNumber() {
        let scalebig = Action.scaleTo(1.3, 1.3, 0.1);
        let scalesmall = Action.scaleTo(1, 1, 0.1);
        let sq = Action.sequence([scalebig, scalesmall]);
        this.m_numberText.run(sq);
    }
    showWinAni() {
        for (let i = 0; i < this.coinanicountspeed; i++) {
            let origin = new Point(0, 0);
            let destination = new Point(0, 0);
            let spr = new Sprite();
            spr.anchor.set(0.5, 0.5);
            let point = this.GetRandomPointInRing(0, 50);
            origin.x = point.x;
            origin.y = point.y;
            point = this.GetRandomPointInRing(1000, 1100);
            destination.x = point.x;
            destination.y = point.y;
            spr.position.set(origin.x, origin.y);
            this.coincontainer.addChild(spr);
            this.AddCoinFrameAni(spr);
            this.PlayCoinAni(spr, destination);
        }
    }
    AddCoinFrameAni(parent) {
        const textures = [];
        for (let i = 0; i < 8; ++i) {
            textures.push(Texture.from(`rslot_coin_${i}.png`));
        }

        const spr = new AnimatedSprite(textures);
        spr.anchor.set(0.5, 0.5);
        spr.animationSpeed = 0.5;
        spr.scale.set(2.5, 2.5);
        spr.rotation = Math.random() * 360;
        parent.addChild(spr);
        spr.play();
    }
    PlayCoinAni(spr, destination) {
        spr.scale.set(0.5);
        const duration = Math.random() * 1 + 1;
        const action = Action.group([
            Action.scaleTo(1.5, duration + 0.5),
            Action.sequence([Action.moveTo(destination, duration), Action.fadeOut(duration * 0.5)]),
        ]);
        spr.run(action, () => {
            if (this.coincontainer) {
                this.coincontainer.removeChild(spr);
            }
        });
    }
    GetRandomPointInRing(start, end) {
        //random radius 
        const radius = Math.random() * (end - start) + start;
       //random angle 
        const angle = Math.random() * 2 * Math.PI;
        
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        return { x, y };
    }
}
