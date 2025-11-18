import { urlQuery } from './utils';
/**
 * Format currency
 * Get the symbol and reserved decimal places via currency code, and get the symbol position and separators via language.
 */
export default class formatCurrency {
    constructor(currency) {
        this.currency = currency;
        this.lang = urlQuery.lang;
        this.symbol = '€';
        this.decimalDigits = 2;
        this.init();
        this.setMoneys = this.setMoneys.bind(this);
        this.setMoneyInt = this.setMoneyInt.bind(this);
    }
    init() {
        this.setCurrency();
        this.precision();
        this.config = this.getLang();
    }
    setMoneyInt(value) {
        value = value / 100;
        if (value >= 1000) {
            return value % 1000 === 0 ? Math.floor(value / 1000) + 'k' : Math.floor(value / 1000) + 'K'; //(value/1000).toFixed(1) +'K'
        } else {
            return value;
        }
    }
    setMoneys(value, isSymbol) {
        value = value / 100;
        let symbolPosition = this.config.format || 'auto';
        let decimalDigits = this.decimalDigits;
        let decimalSeparator = this.config.decimal || '.';
        let thousandSeparator = this.config.thousand || ',';
        let autoDecimal = true;
        if (typeof value !== 'number' || isNaN(value)) return '';
        const isNegative = value < 0;
        const absoluteValue = Math.abs(value);
        let [integerPart, decimalPart] = absoluteValue.toFixed(autoDecimal ? decimalDigits : 0).split('.');
        if (!autoDecimal && decimalDigits > 0) {
            const multiplier = 10 ** decimalDigits;
            decimalPart = String(Math.round(absoluteValue * multiplier) % multiplier.toString().padStart(decimalDigits, '0'));
        }
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
        // 拼接逻辑
        const numberPart = [integerPart, decimalDigits > 0 ? decimalSeparator : '', decimalDigits > 0 ? decimalPart : ''].join('').replace(/\.$/, '');
        // 根据位置组装结果
        let fullNumber;
        switch (symbolPosition) {
            case 'after':
                fullNumber = isSymbol ? `${numberPart}${this.symbol}` : numberPart;
                break;
            case 'before':
            default:
                fullNumber = isSymbol ? `${this.symbol}${numberPart}` : numberPart;
        }
        // 处理负数
        const sign = isNegative ? '-' : '';
        return `${sign}${fullNumber}`;
    }

    setCurrency() {
        this.symbol =
            {
                CNY: '¥',
                RMB: '¥',
                JPY: '¥',
                ARS: '$',
                AUD: '$',
                BND: '$',
                CAD: '$',
                CLP: '$',
                COP: '$',
                HKD: '$',
                MXN: '$',
                NZD: '$',
                TTD: '$',
                USD: '$',
                HRK: 'kn',
                CZK: 'Kč',
                DKK: 'kr',
                SEK: 'kr',
                ISK: 'kr',
                NOK: 'kr',
                EUR: '€',
                GBP: '£',
                HUF: 'Ft',
                IDR: 'Rp',
                KHR: '៛',
                KRW: '₩',
                MYR: 'RM',
                PLN: 'zł',
                BRL: 'R$',
                RON: 'RON',
                RUB: 'руб',
                THB: '฿',
                VND: '₫',
                TRY: 'TL',
                UAH: '₴',
                VND: '₫',
                FUN: 'FUN',
                'GC.': 'GC.',
                'SC.': 'SC.',
                AED: 'د.إ',
                ALL: 'Lek',
                AMD: '֏',
                AZN: 'ман',
                BAM: 'KM',
                BDT: '৳',
                BGN: 'лв',
                BOB: '$b',
                BYN: 'Br',
                CDF: 'FC',
                CHF: 'CHF',
                DOP: 'RD$',
                GEL: 'ლ',
                GHS: '₵',
                HTG: 'G',
                ILS: '₪',
                INR: 'Rs',
                IQD: 'د.ع',
                IRR: '﷼',
                KES: 'KSh',
                KGS: 'лв',
                KZT: '₸',
                LAK: '₭',
                LKR: '₨',
                MAD: 'DH',
                MDL: 'L',
                MKD: 'ден',
                MMK: 'K',
                MNT: '₮',
                MVR: 'Rf',
                NGN: '₦',
                NPR: '₨',
                PEN: 'S/.',
                PHP: '₱',
                PKR: '₨',
                PYG: 'Gs',
                RSD: 'Дин.',
                RON: 'RON',
                RSD: 'Дин.',
                RWF: 'FRw',
                SAR: '﷼',
                SGD: 'S$',
                SZL: 'E',
                TJS: 'ЅМ',
                TMT: 'T',
                TND: 'د.ت',
                TWD: 'NT$',
                TZS: 'TSh',
                UGX: 'USh',
                UYU: '$U',
                UZS: 'лв',
                XAF: 'FCFA',
                XOF: '₣',
                ZAR: 'R',
                ZMW: 'K',
            }[this.currency] || '€';
    }

    getLang() {
        let data = {
            thousand: ',',
            format: 'before',
            decimal: '.',
        };
        let leftd = ['zh-CN', 'zh-TW', 'en-GB', 'en-US', 'en-SC', 'en-MT', 'sr-RS', 'hi-IN', 'bs-BA', 'mk-MK', 'sr-ME', 'ja-JP', 'ko-KR', 'ms-MY', 'th-TH']; //
        let left_d = ['da-DK', 'nl_BE', 'nl_NL', 'hu-HU', 'id-ID', 'it-IT', 'pt-BR'];
        let rightd = ['hr-HR', 'de-DE', 'el-GR', 'el-CY', 'km-KH', 'pt-PT', 'ro-RO', 'tr-TR', 'vi-VN'];
        let rightk = ['cs-CZ', 'et-EE', 'fi-FI', 'fr-FR', 'fr-BE', 'lv-LV', 'lt-LT', 'pl-PL', 'ru-RU', 'sk-SK', 'es-ES', 'es-MX', 'es-CO', 'sv-SE', 'uk-UA'];
        if (this.isInArray(left_d, this.lang)) {
            data.thousand = '.';
            data.decimal = ',';
        } else if (this.isInArray(rightd, this.lang)) {
            data.thousand = '.';
            data.format = 'after';
            data.decimal = ',';
        } else if (this.isInArray(rightk, this.lang)) {
            data.thousand = ' ';
            data.format = 'after';
            data.decimal = ',';
        }
        return data;
    }
    precision() {
        this.decimalDigits =
            {
                BIF: 0,
                JPY: 0,
                CLP: 0,
                KHR: 0,
                KRW: 0,
                LBP: 0,
                MGA: 0,
                VND: 0,
                PYG: 0,
                XOF: 0,
                IQD: 0,
                MWK: 0,
                KPW: 0,
                KPW: 0,
                SLL: 0,
                STD: 0,
                VEF: 0,
                TND: 3,
            }[this.currency] || 2;
    }
    isInArray(arr, val) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === val) {
                return true;
            }
        }
        return false;
    }
}
