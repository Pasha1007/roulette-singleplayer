/**
 * Manage all state values of the current frameworks
 */
export const stateManager = {
    // state storage
    state: {
        gameid: '',
        bet: 1,
        gameClient: {},
        balance: 0,
        translation: {},
        servCfg: {},
        isShowTab: false,
        progress: '0%',
        gameCfg: {},
        settings: {
            bet: 1,
            sound: true,
        },
    },
    //state listening callback array
    listeners: [],
    // register state change listener
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter((fn) => fn !== callback);
        };
    },
    //Update the state and trigger view updates
    setState(partialState) {
        Object.assign(this.state, partialState);
        this.listeners.forEach((callback) => callback(this.state));
    },
    getState() {
        return this.state;
        //return JSON.parse(JSON.stringify(this.state));
    },
};
