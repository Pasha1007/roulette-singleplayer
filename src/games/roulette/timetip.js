import { Sprite, TextStyle, Text, Container } from 'pixi.js';
import { Action} from 'pixijs-actions';
import { Define } from './gamedefine';
import Util from './Util';
export default class TimeTip {
    constructor(textureName, text,textoffset,root,timetxtsize=undefined,txtsize = undefined, isBold = false){
        this.root = root;
        this.initTip(textureName,text,timetxtsize,textoffset,txtsize,isBold);
    }
    initTip(textureName,text,timetxtsize,textoffset,txtsize,isBold){
        this.tempSeconds=0;
        this.container = new Container();
        this.root.addChild(this.container);

        this._sprite = Sprite.from(textureName);
        this._sprite.anchor.set(0.5, 0.5);
        this._sprite.position.set(-60, 0);
        this.container.addChild(this._sprite); 

        let timestr= this.timeFormat(0);
        this._timetxt= Util.createrTxt(timestr, timetxtsize, '0xffffff', true);
        this._timetxt.position.set(30, 0);
        this.container.addChild(this._timetxt); 

        if (text != '') {
            let size = txtsize == undefined ? 38 : txtsize;
            let weight = isBold ? 'bold' : 'normal';
            const style = new TextStyle({
                fill: 'white',
                fontFamily: 'swipegamefont',
                fontWeight: weight,
                fontSize: size,
                lineJoin: 'round',
            });
            this._text = new Text(text, style);
            this._text.anchor.set(0.5, 0.5);
            this._text.position.set(textoffset.x, textoffset.y);
            this.textoffset = textoffset;
            this.container.addChild(this._text);
        }
    }
    timeFormat(milliseconds){
        if (typeof milliseconds !== 'number' || milliseconds <= 0 || isNaN(milliseconds)) {
            return "00:00";
        }
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const minstr=minutes.toString().padStart(2, '0');
        const secstr=seconds.toString().padStart(2, '0');
        return `${minstr}:${secstr}`;
    }
    refreshTime(milliseconds){
        if(this._timetxt){
            let timestr= this.timeFormat(milliseconds);
            this._timetxt.text=timestr;
            const nowtime=Math.floor(milliseconds / 1000);
            if(this.tempSeconds!=nowtime){
                this.tempSeconds=nowtime;
                this._sprite.run(Action.rotateBy(Math.PI, 0.2));
            }
        }
    }
    setColorRed(isred){
        const color=isred?'0xb30b0b':'0xffffff';
        this._timetxt.style.fill=color;
    }
    setPosition(px, py) {
        this.container.position.set(px, py);
    }
    setVisiable(visible) {
        this.container.visible = visible;
    }
}