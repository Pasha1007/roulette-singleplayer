import { Text } from 'pixi.js';

const DefaultMinFontSize = 10;

export default class AutomaticallyText extends Text {
    m_initialFontSize = DefaultMinFontSize;
    m_minFontSize = DefaultMinFontSize;
    m_maxTextWidth = 0;
    m_maxTextHeight = 0;

    constructor(text, style, minFontSize, maxWidth, maxHeight) {
        super(text, style);

        this.m_initialFontSize = style ? style.fontSize : DefaultMinFontSize;
        this.m_minFontSize = minFontSize || DefaultMinFontSize;
        this.m_maxTextWidth = maxWidth || this.width;
        this.m_maxTextHeight = maxHeight || this.height;

        this.CalculateFontSize();
    }

    SetText(text) {
        this.text = text;
        this.CalculateFontSize();
    }

    CalculateFontSize() {
        this.style.fontSize = this.m_initialFontSize;
        while ((this.width > this.m_maxTextWidth || this.height > this.m_maxTextHeight) && this.style.fontSize > this.m_minFontSize) {
            this.style.fontSize--;
        }
    }
}
