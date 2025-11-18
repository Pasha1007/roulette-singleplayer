/**
 *  Ui for frameworks
 */
export default class frameworksUi {
    constructor(data) {
        this.dispatchEvent = data.Event;
        this.state = data.state;
        this.changeState = data.changeState;
        this.dom = document.getElementById('game-container');
        this.dispatchEvent.addListener('spin', this.g_spin.bind(this));
        this.dispatchEvent.addListener('collectinfo', this.spinCollectGame.bind(this));
        this.dispatchEvent.addListener('updata-balance', this.changeBalance.bind(this));
        this.dispatchEvent.addListener('updata-win', this.changeWin.bind(this));
        this.dispatchEvent.addListener('updata-bet', this.changeBet.bind(this));
        this.init();
    }
    init() {
        //If any unfinished items are found, settle them.
        let refgame = this.state.servCfg.slot.gmi.replyPlay && this.state.servCfg.slot.gmi.replyPlay.results.length > 0 ? true : false;
        if (refgame && this.state.gameid === 'roulette') {
            this.spinCollectGame(1);
        }
        //Render the UI
        this.renderUi();
    }
    renderUi() {
        let header = document.createElement('div');
        header.id = 'header';
        header.innerHTML = `<div class="devicon">
            <div class="${isDev?'devicon-logo':''}">${isDev?'Dev':''}</div>
        </div> <div class="menuicon"><div class="menuicon-logo"></div></div>`;
        this.dom.appendChild(header);

        if(isDev)document.querySelector('.devicon-logo').addEventListener('click', () => {
            this.showCheat();
        });
        
        document.querySelector('.menuicon-logo').addEventListener('click', () => {});

        if (document.getElementById('foot')) return;
        let foot = document.createElement('div');
        foot.id = 'foot';
        let foothtml = `
                <div class="foot-top" id="roulette1" style="z-index:1">
                 <div class="foot-balance">
                        <span class="foot-text">${this.state.translation.common_label_Balance}&nbsp;:&nbsp;&nbsp;</span>
                        <span class="foot-value roulette balance">${this.state.servCfg.setMoneys(this.state.balance, true)}</span>
                 </div>
                <div class="foot-balance" style="justify-content:flex-end;padding-right:1em">
                         <span class="foot-text">${this.state.translation.common_label_win}&nbsp;:&nbsp;&nbsp;</span>
                        <span class="foot-value roulette win">—</span>
                 </div>
                </div> 
                 <div class="foot-top" id="roulette1" style="z-index:1">
                 <div class="foot-balance">
                        <span class="foot-text">${this.state.translation.common_label_Totalbet}&nbsp;:&nbsp;&nbsp;</span>
                        <span class="foot-value roulette bet">—</span>
                 </div>
                <div class="foot-balance" style="justify-content:flex-end;padding-right:1em">
                         <span class="foot-text">Roulettle&nbsp;:&nbsp;&nbsp;</span>
                        <span class="foot-value roulette roulette-tiem" style="color:#fff">00:00:00</span>
                 </div>
                </div>
                `;
        foot.innerHTML = foothtml;
        this.dom.appendChild(foot);
        this.getTime();
    }
    getTime() {
        setInterval(() => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const formattedTime = `${hours}:${minutes}:${seconds}`;
            document.querySelector('.roulette-tiem').innerHTML = formattedTime;
        }, 1000);
    }
    spinCollectGame = (index) => {
        this.state.servCfg.spinCollectGame(index).then((res) => {
            this.dispatchEvent.emit('updata-collectinfo', res);
        });
    };
    changeBalance = (balance) => {
        this.changeState({ balance: balance });
        this.isDomOk('balance').then(() => {
            document.querySelector('.balance').innerHTML = this.state.servCfg.setMoneys(balance, true);
        });
    };

    changeWin = (win) => {
        document.querySelector('.win').innerHTML = win > 0 ? this.state.servCfg.setMoneys(win, true) : '—';
    };

    changeBet = (bet) => {
        this.changeState({ bet: bet });
        document.querySelector('.bet').innerHTML = bet > 0 ? this.state.servCfg.setMoneys(bet, true) : '—';
    };
    //spin
    g_spin = (data) => {
        if (this.getCheatValue()){
            let fr = [];
            this.getCheatValue()
                .split(',')
                .map((item) => {
                    fr.push(parseInt(item));
                });
            data.cheat = fr;
        }
        //this.state.servCfg.g_spin(data)
        this.state.servCfg.g_spin(data).then((res) => {
            this.dispatchEvent.emit('updata-spinEnd', res);
        });
    };
    showCheat() {
        if (!document.getElementById('cheatdiv')) {
            let cheatdiv = document.createElement('div');
            cheatdiv.id = 'cheatdiv';
            document.getElementById('game-container').appendChild(cheatdiv);
        }
        if (document.getElementById(`${this.state.gameid}cheatdiv`)) {
            document.getElementById(`${this.state.gameid}cheatdiv`).style.display = 'block';
            return;
        }
        let div = document.createElement('div');
        div.className = 'resizable';
        div.id = `${this.state.gameid}cheatdiv`;
        let html = '';
        html += `<div class="cheatValue" id="${this.state.gameid}cheatValue">`;
        for (let i = 0; i < 37; i++) {
            html += `<input type="radio" name="roulette" value="${i}">${i}`;
        }
        html += `</div>`;
        div.innerHTML = html;
        const handle = document.createElement('div');
        handle.className = 'drag-handle';
        handle.innerHTML = this.resizeHtml();
        div.appendChild(handle);
        const close = document.createElement('div');
        close.className = 'closeCheat';
        close.innerHTML = 'X';
        close.addEventListener('click', () => {
            if (document.getElementById(`${this.state.gameid}cheatdiv`)) {
                document.getElementById(`${this.state.gameid}cheatdiv`).style.display = 'none';
            }
        });
        div.appendChild(close);
        document.getElementById('cheatdiv').appendChild(div);
        handle.addEventListener('mousedown', initDrag);
        const minWidth = '100%';
        const minHeight = 80;
        let cheatValueNode = document.getElementById(`${this.state.gameid}cheatValue`);
        let startX, startY, startWidth, startHeight, parentRect, elRect;
        function initDrag(e) {
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(cheatValueNode).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(cheatValueNode).height, 10);
            elRect = cheatValueNode.getBoundingClientRect();
            parentRect = document.getElementById('game-container').getBoundingClientRect();
            document.documentElement.addEventListener('mousemove', doDrag, false);
            document.documentElement.addEventListener('mouseup', stopDrag, false);
            e.preventDefault();
        }

        function doDrag(e) {
            let newWidth = startWidth + (e.clientX - startX);
            let newHeight = startHeight + (e.clientY - startY);
            const maxWidth = parentRect.right - elRect.left;
            const maxHeight = parentRect.bottom - elRect.top;
            newWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
            newHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
            cheatValueNode.style.width = newWidth + 'px';
            cheatValueNode.style.height = newHeight + 'px';
        }

        function stopDrag() {
            document.documentElement.removeEventListener('mousemove', doDrag, false);
            document.documentElement.removeEventListener('mouseup', stopDrag, false);
        }
    }
    getCheatValue() {
        let radios = document.querySelectorAll(`input[name="${this.state.gameid}"]`);
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                return radios[i].value;
            }
        }
        return '';
    }
    isDomOk(str) {
        return new Promise((resolve, reject) => {
            let id = setInterval(() => {
                if (document.querySelector(`.${str}`)) {
                    clearInterval(id);
                    resolve();
                }
            }, 10);
        });
    }
    resizeHtml() {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#70617e" d="M8.465 7.05l2.828-3.05h-7.293v7.293l3.051-2.829 8.484 8.486-2.828 3.05h7.293v-7.292l-3.051 2.828z"/></svg>`;
    }
}
