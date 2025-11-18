import { Text } from 'pixi.js';
export default class Util {
    static _seed = Math.floor(Math.random() * 100);
    static resetSeed() {
        Util._seed = 5;
    }
    static _nextRandomNumber() {
        Util._seed = (Util._seed * 1314 + 2356) % 9527;
        return Util._seed / 9527;
    }
    static limitRandom(min, max) {
        let rand = Util._nextRandomNumber();
        let random = min + rand * (max - min);
        return Math.floor(random * 10000) / 10000;
    }

    static async delayTime(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    static waitWinAniCountTime(wincount, totalbet) {
        if (wincount <= 0) {
            return 0.1;
        }
        let delaytime = 1; //base time

        //The more you win, the longer the animation will last
        if (wincount >= totalbet * 5) {
            delaytime += 2;
        } else if (wincount > totalbet) {
            delaytime += (wincount / totalbet) * 0.4;
        }
        return delaytime;
    }
    static createrTxt(value, size, color, isbold) {
        let fontWeightstr = isbold ? 'bold' : 'normal';
        const text = new Text(value, {
            fill: color,
            fontFamily: 'swipegamefont',
            fontWeight: fontWeightstr,
            fontSize: size,
            lineJoin: 'round',
            align: 'center',
        });
        text.anchor.set(0.5, 0.5);
        return text;
    }
    static createrTxtStyle(value, size, style) {
        style.fontSize = size;
        const text = new Text(value, style);
        text.anchor.set(0.5, 0.5);
        return text;
    }
}
