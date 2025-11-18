import { Sprite, TextStyle, Text, Container } from 'pixi.js';
export default class GameButton {
    constructor(buttonname, textureName, text, textoffset, root, childtexture = undefined, txtsize = undefined, isBold = false) {
        this.root = root;
        this._onClick = null;
        this.buttonname = buttonname;
        this.initButton(textureName, childtexture, text, textoffset, txtsize, isBold);
    }
    initButton(textureName, childtexture, text, textoffset, txtsize, isBold) {
        this.container = new Container();
        this.root.addChild(this.container);

        this._sprite = Sprite.from(textureName);
        this._sprite.anchor.set(0.5, 0.5);
        this._sprite.position.set(0, 0);
        this.container.addChild(this._sprite);

        this._sprite.interactive = true;
        this._sprite.buttonMode = true;
        this._sprite.on('pointerdown', this.handleOnPointerDown, this);

        if (childtexture != undefined) {
            this._childsprite = Sprite.from(childtexture);
            this._childsprite.anchor.set(0.5, 0.5);
            this._childsprite.position.set(0, 0);
            this.container.addChild(this._childsprite);
        }

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
    setVisiable(visible) {
        this.container.visible = visible;
    }
    setEnabled(enabled) {
        this._sprite.interactive = enabled;
        let alpha = enabled ? 1 : 0.5;
        this._sprite.alpha = alpha;
        if (this._childsprite) {
            this._childsprite.alpha = alpha;
        }
    }
    isBtnAble(){
        return this.container.visible&&this._sprite.interactive ;
    }
    setScale(scale) {
        this._sprite.scale.set(scale, scale);
        if (this._childsprite) {
            this._childsprite.scale.set(scale, scale);
        }
    }
    setPosition(px, py) {
        this.container.position.set(px, py);
    }
    getPosition() {
        return this.container.position;
    }
    setTxtext(text) {
        if (this._text) {
            this._text.text = text;
        }
    }
    setTxtextColor(color) {
        if (this._text) {
            this._text.style.fill = color;
        }
    }
    setSpTexture(texture) {
        this._sprite.texture = texture;
    }
    onClicked(callback) {
        this._onClick = callback;
    }
    handleOnPointerDown() {
        if (this._onClick) {
            this._onClick(this.buttonname);
        }
    }
    destory() {
        this.container.removeFromParent();
    }
}
