export const urlQuery = location.search
    .substring(1)
    .split('&')
    .reduce(function (map, value) {
        let pair = value.split('=').map(decodeURIComponent);
        if (!(pair[0] in map)) map[pair[0]] = pair[1];
        else if (Array.isArray(map[pair[0]])) map[pair[0]].push(pair[1]);
        else map[pair[0]] = [map[pair[0]], pair[1]];
        return map;
    }, {});

export const isBool = (bool) => {
    switch (typeof bool) {
        case 'undefined':
            return false;
        case 'boolean':
            return bool;
        case 'string':
            return bool == 'true' ? true : false;
        case null:
            return false;
        default:
            return false;
    }
};

export const fetchPost = (url, method, data) => {
    return new Promise((resolve, reject) => {
        try {
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json', // 必须声明 JSON 类型
                },
                body: JSON.stringify(data),
            })
                .then((res) => res.json())
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        } catch (e) {
            reject(err);
        }
    });
};

export const fetchGet = (url) => {
    return new Promise((resolve, reject) => {
        try {
            fetch(url)
                .then((res) => res.json())
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        } catch (e) {
            reject(err);
        }
    });
};
//是否是数组
export const isArray = (arr) => {
    if (arr == undefined) return [];
    if (Array.isArray(arr)) {
        return arr;
    } else {
        return [];
    }
};
//储存当前数据在本地
export const StorageDataSet = (data) => {
    let curtime = new Date().getTime(); // 获取当前时间 ，转换成JSON字符串序列
    let valueDate = JSON.stringify({
        val: data,
        timer: curtime,
    });
    try {
        localStorage.setItem(`${getHost()}_${data.gameCode}_fun`, valueDate);
    } catch (e) {
        if (isQuotaExceeded(e)) {
            localStorage.clear();
        }
    }
};
/**
 * 是否为number
 */
export const isNumber = (num) => {
    switch (typeof num) {
        case 'undefined':
            return 0;
        case 'number':
            return num;
        case 'string':
            let intNum = parseInt(num);
            if (Number.isNaN(intNum)) {
                return 0;
            } else {
                return intNum;
            }
        default:
            return 0;
    }
};
/**
 * 字符串替换
 */
export const reqstr = (strs, req) => {
    let reg = /\{(.+?)\}/g;
    let arr = strs.match(reg);
    let str;
    if (!arr) return '';
    for (let i = 0; i < arr.length; i++) {
        str = strs.replace(arr[i], req);
    }
    return str;
};
export const getFitFontSize = (container, text, maxFontSize = 25, minFontSize = 8) => {
    const testDiv = document.createElement('div');
    testDiv.style.position = 'absolute';
    testDiv.style.visibility = 'hidden'; // 隐藏但保留布局计算
    testDiv.style.whiteSpace = 'nowrap'; // 不自动换行（如需换行可改为'normal'）
    testDiv.style.width = container.clientWidth + 'px'; // 限制宽度与目标容器一致
    testDiv.style.height = container.clientHeight + 'px'; // 限制高度
    testDiv.style.overflow = 'hidden'; // 溢出隐藏（用于判断是否超出）
    testDiv.textContent = text; // 填充文本内容
    document.body.appendChild(testDiv);
    let fontSize = maxFontSize;
    let bestSize = minFontSize;
    // 从最大字体开始测试，逐步减小
    while (fontSize >= minFontSize) {
        testDiv.style.fontSize = fontSize + 'px';
        testDiv.style.lineHeight = '1.2'; // 可根据需求调整行高
        // 判断文本是否超出容器宽高
        const isOverflow = testDiv.scrollWidth > testDiv.clientWidth || testDiv.scrollHeight > testDiv.clientHeight;

        if (!isOverflow) {
            // 未溢出，记录当前字体大小并尝试更大的（跳出循环，因为从大到小测试）
            bestSize = fontSize;
            break;
        }

        // 溢出则减小字体大小（步长可调整，如2px、1px）
        fontSize -= 1;
    }

    // 移除测试容器
    document.body.removeChild(testDiv);
    return bestSize;
};
export const FreeExpiryTime = (time) => {
    if (time.toString().length == 10) {
        time = time * 1000;
    }
    let date = new Date(time);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = month < 10 ? '0' + month : month; //月补0
    let day = date.getDate();
    day = day < 10 ? '0' + day : day; //天补0
    let hour = date.getHours();
    hour = hour < 10 ? '0' + hour : hour; //小时补0
    let minute = date.getMinutes();
    minute = minute < 10 ? '0' + minute : minute; //分钟补0
    let second = date.getSeconds();
    second = second < 10 ? '0' + second : second; //秒补0
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
};
const isQuotaExceeded = (e) => {
    let quotaExceeded = false;
    if (e) {
        if (e.code) {
            switch (e.code) {
                case 22:
                    quotaExceeded = true;
                    break;
                case 1014:
                    if (e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                        quotaExceeded = true;
                    }
                    break;
            }
        } else if (e.number === -2147024882) {
            quotaExceeded = true;
        }
    }
    return quotaExceeded;
};
//获取当前储存的数据
export const StorageDataGet = (gameCode) => {
    const ua = window.navigator.userAgent;
    let exp = 60 * 60 * 24 * 90 * 1000; // 设置三个月过期时间
    let newValue;
    if (localStorage.getItem(`${getHost()}_${gameCode}_fun`)) {
        try {
            let vals = localStorage.getItem(`${getHost()}_${gameCode}_fun`); // 获取本地存储的值
            let dataObj = JSON.parse(vals); // 将字符串转换成JSON对象
            let isTimed = new Date().getTime() - dataObj.timer > exp;
            if (isTimed) {
                localStorage.removeItem(`${getHost()}_${gameCode}_fun`);
                return null;
            } else {
                newValue = dataObj.val;
            }
            return newValue;
        } catch (e) {
            return {
                bet: 1,
                sound: true,
            };
        }
    } else {
        return {
            bet: 1,
            sound: true,
        };
    }
};

const getHost = () => {
    if (window.parent && window.parent !== window) {
        //先获取父窗口  如果浏览器安全限制  则获取当前子页面的host
        try {
            return window.parent.location.host;
        } catch (e) {
            return window.location.host;
        }
    } else {
        return window.location.host;
    }
};

export const isMobile = () => {
    // 匹配常见移动设备的关键词
    const mobileReg = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i;
    // 获取浏览器的 User-Agent 字符串
    const userAgent = navigator.userAgent;
    // 测试是否匹配
    return mobileReg.test(userAgent);
};
export const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export const generate18MixedRandom = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charCount = chars.length;
    let result = '';
    for (let i = 0; i < 18; i++) {
        const randomIndex = Math.floor(Math.random() * charCount);
        result += chars[randomIndex];
    }
    return result;
};
