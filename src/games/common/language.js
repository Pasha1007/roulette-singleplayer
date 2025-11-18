import {DefaultLanguage} from "../roulette/gamedefine"
export default class LanguageMgr {
    constructor() {
        this.languagemap = {};
    }
    setLanguage(map) {
        this.languagemap = map;
    }
    setMapValue(key, value) {
        this.languagemap[key] = value;
    }
    getLanguage(key) {
        let value = this.languagemap[key];
        if (value == undefined) {
            value=DefaultLanguage[key]
        }
        return value;
    }
}
