import { Sprite, Container } from 'pixi.js';
import GameState from './gamestate';
import Util from './Util';
export default class Chip {
    constructor(chipamount, chiphittag, texture, positionx, positiony, root) {
        this.root = root;
        this.chiphittag = chiphittag;
        this.chipamount = chipamount;
        this._dropPositionx = positionx;
        this._dropPositiony = positiony;
        this.initChip(texture);
    }

    initChip(textureName) {
        this.chipcontainer = new Container();
        let posix = this._dropPositionx + Math.random() * 10;
        let posiy = this._dropPositiony + Math.random() * 10;
        this.chipcontainer.position.set(posix, posiy);
        this.root.addChild(this.chipcontainer);
        let sprite = Sprite.from(textureName);
        sprite.anchor.set(0.5, 0.5);
        sprite.scale.set(0.5, 0.5); // Original size - will be scaled by tableroot's 1.2x
        this.chipcontainer.addChild(sprite);

        let amount = this.chipamount;
        let money = GameState.getInstance().formatChipMoney(amount);
        let amounttxt = Util.createrTxt(money, 22, '0x2f2f2f', false); // Original size - will be scaled by tableroot's 1.2x
        amounttxt.position.set(0, -3);
        this.chipcontainer.addChild(amounttxt);
    }
    randomMove() {
        let posix = this._dropPositionx + Math.random() * 10;
        let posiy = this._dropPositiony + Math.random() * 10;
        this.chipcontainer.position.set(posix, posiy);
    }
    destroy() {
        this.chipcontainer.destroy({ children: true });
        this.chipcontainer.removeFromParent();
    }
}
