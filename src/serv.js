import { urlQuery, fetchGet, generate18MixedRandom } from './utils';
export default class CasinoBridge {
    constructor(wss, gameid) {
        this.wss = wss;
        this.gameid = gameid;
        this.heartTime = 30000;
        this.socket = null;
        this.status = {
            webSocketState: false,
            lockReconnect: false,
            reconnectTime: 5000,
            reconnectSetTime: null,
            reconnectflag: false,
            assetsMessage: [],
            g_state: {
                collectinfo: null,
                isFirstMessage: true,
            },
        };
        this.init();
    }

    init() {
        if (this.socket) return;
        this.socket = new WebSocket(this.wss);
        this.socket.addEventListener('open', (messobj) => {
            this._send({
                cmdid: 'flblogin',
                gamecode: this.gameid,
                businessid: urlQuery.businessCode || 'guest',
                jurisdiction: urlQuery.jurisdiction || 'MT',
                token: urlQuery.platformToken || generate18MixedRandom(),
                clienttype: 'web',
                language: 'en',
            });
            setInterval(() => {
                this._send({ cmdid: 'keepalive' });
            }, this.heartTime);
            this.status.assetsMessage.map((item, key) => {
                if (item.name == 'WEBSOCKTCLOSE') item.update();
            });
        });
        this.socket.addEventListener('message', (event) => {
            let messobj = JSON.parse(event.data);
            if (messobj.msgid == 'timesync') this.status.time = messobj.servtime;
            if (messobj.msgid === 'cmdret' && messobj.cmdid === 'flblogin' && messobj.isok) {
                this._send({ cmdid: 'comeingame3', gamecode: this.gameid, tableid: '', isreconnect: false });
            }
            if (messobj.msgid === 'gameuserinfo') this.status.gameuserinfo = messobj;
            if (messobj.msgid === 'gamemoduleinfo') {
                this.slot = messobj;
                this.status.assetsMessage.map((item, key) => {
                    if (item.name == 'getServ') item.update();
                });
            }
            if (messobj.cmdid === 'refresh' && messobj.isok) {
                this.status.assetsMessage.map((item, key) => {
                    if (item.name == 'getBalance') item.update();
                });
            }
            if (messobj.msgid === 'userbaseinfo') this.status.userbaseinfo = messobj;
            if (messobj.msgid === 'gamecfg') this.status.gamecfg = messobj;
            //init ok
            if (messobj.msgid === 'cmdret' && messobj.cmdid === 'comeingame3' && messobj.isok) {
                
                this.status.assetsMessage.map((item, key) => {
                    if (item.name == 'servLoadOk') item.update();
                });
               
            }
            if (messobj.msgid === 'collectinfo') {
                this.collectinfo = messobj;
                this.status.assetsMessage.map((item, key) => {
                    if (item.name == 'collectinfo') item.update();
                });
            }
            //
            if (messobj.msgid === 'cmdret' && messobj.cmdid === 'collect' && messobj.isok) {
                this.status.assetsMessage.map((item, key) => {
                    if (item.name == 'collectinfo') item.update();
                });
            }
            //error
            if (messobj.msgid === 'noticemsg2') {
                if (typeof messobj.msgparam != 'undefined') {
                    let strarr = messobj.msgparam.dtapierrcode ? messobj.msgparam.dtapierrcode.split('|') : '';
                    let code = strarr != '' ? strarr[0] : messobj.msgparam.httpcode;
                    let errorCode = `${messobj.msgcode} | ${typeof messobj.msgparam.dtapierrcode != 'undefined' ? messobj.msgparam.dtapierrcode : messobj.msgparam.httpcode}`;
                }
            }
            //console.log(messobj)
        });
        this.socket.addEventListener('error', (event) => {
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }
            this.reconnect();
        });
        this.socket.addEventListener('close', (event) => {
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }
            this.reconnect();
        });
    }
    reconnect = () => {
        if (this.status.lockReconnect) return;
        this.status.lockReconnect = true;
        this.status.reconnectSetTime && clearTimeout(this.status.reconnectSetTime);
        //this.openModalDialog({ errorCode: 'WEBSOCKTCLOSE', type: 0, gameid:this.gameid });
        this.loadAssets('WEBSOCKTCLOSE').then(() => {
            this.cleanAssets('WEBSOCKTCLOSE');
            //this.closeModalDialog();
        });
        this.status.reconnectSetTime = setTimeout(() => {
            this.init();
            this.status.lockReconnect = false;
        }, this.status.reconnectTime);
    };
    //spin
    g_spin = (data) => {
        let ctrlparam = {
            autonums: -1,
            bet: data?.allbet,
            lines: 1,
            times: 1,
            command:data.command,
            commandParam:data.places?JSON.stringify(data.places):"",
            lstrand: data.cheat,
        };
        this._send({ cmdid: 'gamectrl3', gameid: this.slot.gameid, ctrlid: this.status.gameuserinfo.ctrlid, ctrlname: 'spin', ctrlparam: ctrlparam });
        return new Promise((resolve, reject) => {
            this.loadAssets('getServ').then(() => {
                this.cleanAssets('getServ');
                resolve(this.slot);
            });
        });
    };
    getBalance = () => {
        let data = {
            cmdid: 'refresh',
            gameid: this.slot.gameid,
            userbaseinfo: ['gold'],
        };
        this._send(data);
        return new Promise((resolve, reject) => {
            this.loadAssets('getBalance').then(() => {
                this.cleanAssets('getBalance');
                resolve(this.status.userbaseinfo.userbaseinfo.gold);
            });
        });
    };
    //The server has finished loading.
    servLoadOk() {
        return new Promise((resolve, reject) => {
            this.loadAssets('servLoadOk').then(() => {
                this.cleanAssets('servLoadOk');
                resolve(this);
            });
        });
    }

    spinCollectGame = () => {
        let param = { cmdid: 'collect', gameid: this.slot.gameid, playIndex: this.slot.gmi.replyPlay.results.length - 1 };
        this._send(param);
        return new Promise((resolve, reject) => {
            this.loadAssets('collectinfo').then(() => {
                this.cleanAssets('collectinfo');
                resolve(this.collectinfo);
            });
        });
    };
    _send(data) {
        try {
            if (this.socket.readyState) {
                this.socket.send(JSON.stringify(data));
            }
        } catch (e) {
            // Error sending data
        }
    }
    //Get the history records
    getHistory = (data) => {
        return new Promise((resolve, reject) => {
            fetchGet(`${data.historyApi}?gameCode=${this.gameid}&token=${urlQuery.platformToken}&limit=${data.limit}&offset=${data.offset}`)
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    //this.openModalDialog({ errorCode: 'SERVER-ERROR', type: 0, gameid: this.gameid });
                });
        });
    };
    //Add event blocking
    loadAssets = (name) => {
        return new Promise((resolve) =>
            this.status.assetsMessage.push({
                name: name,
                update() {
                    resolve();
                },
            })
        );
    };
    //Clear event blocking
    cleanAssets = (name) => {
        let index = this.status.assetsMessage.findIndex((obj) => obj.name === name);
        this.status.assetsMessage.splice(index, 1);
    };
}
