// rgs server
//Get the configuration
/*let configUrl = `${urlQuery.jurisdiction ? `${urlQuery.configUrl}?jurisdiction=${urlQuery.jurisdiction}&` : `${urlQuery.configUrl}?`}${urlQuery.license ? `license=${urlQuery.license}` : ''}&gameCode=${this.state.gameid}&lang=${urlQuery.lang}`;
fetchGet(configUrl).then((res) => {
    this.changeState({ gameCfg: res }); //Parameter example: Please refer to gameCfg.json.
    //Connect to the server
    let serverPromise = new Promise((resolve, reject) => {
        let serv = new CasinoBridge(this.state.gameCfg['gameServerConfig']['gameServer3Api'], this.state.gameid);
        serv.servLoadOk().then(() => {
            this.changeState({ servCfg: serv });
            resolve();
        });
    });
    //Get the translation
    let translationPromise = new Promise((resolve, reject) => {
        fetchGet(res.commonTranslationJsonUrl).then((common) => {
            this.changeState({ translation: common });
            if (this.state.gameCfg.gameTranslationJsonUrl) {
                fetchGet(res.gameTranslationJsonUrl).then((game) => {
                    let translation = Object.assign(this.state.translation, game);
                    this.changeState({ translation: translation });
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
    //Wait for the server and translation to be loaded
    Promise.all([serverPromise, translationPromise]).then(() => {
        //Start the game
        this.formatCurrency = new formatCurrency(this.state.servCfg['status']['userbaseinfo']['userbaseinfo']['currency']);
        let data = {
            setMoneys: this.formatCurrency.setMoneys,
            setMoneyInt: this.formatCurrency.setMoneyInt,
            autoplayDisable: this.state.gameCfg.autoplayDisable,
            realityCheck: this.state.gameCfg.realityCheck,
            isPT: urlQuery.jurisdiction === 'PT' ? true : false,
            disableNearwin: urlQuery.jurisdiction === 'PT' ? true : false,
        };
        this.changeState({ servCfg: Object.assign(this.state.servCfg, data) });
        this.changeState({ balance: this.state.servCfg['status']['userbaseinfo']['userbaseinfo']['gold'] });
        this.dispatchEvent.emit('updata-gamecfg', { ...this.state.servCfg });
        new frameworksUi({
            Event: this.dispatchEvent,
            state: this.state,
            changeState: this.changeState.bind(this),
        });
    });
});
*/
