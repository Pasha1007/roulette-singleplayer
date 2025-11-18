import { Container, Sprite, Graphics } from 'pixi.js';
import { RouletteCfg, RouletteNumbers } from './config';
import { Action } from 'pixijs-actions';
import Util from './Util';
import RoomMgr from './roommgr';
const effectiveRadius = 420; //Radius of rotation
const collisionRadius = 400; //Radius of collision
const numberoutRadius = 350; //Radius of number out
const ballstopRadius = 225; //Radius of stop point
const innerRadius = 190; //Radius of inner

const singleangle = (1 / 37) * 2 * Math.PI; //=0.1698
const jumpSpeedTag = 2; // Used to calculate the scall of the ball when jumping
const WheelSpiningSpeed = 1.2; 
const spinresultinspeed = 300; 
const angleSpeedBase = Math.PI * 2 * 60; //The angular velocity used for attenuation
const WheelState = {
    Idle: 1,
    StartSpin: 2,
    Spinning: 3,
    Waitresult: 4,
    Resulted: 5
};
const CollisionState = {
    Zero: 'zero',
    One: 'one',
    Two: 'two',
    Three: 'three',
    Four: 'four',
    Five: 'five',
};
class CollStateMgr {
    constructor() {
        this.states = new Map();
        this.currentState = null;
        this.curstateindex = -1;
    }
    addState(state) {
        let statename = state.statename;
        if (statename) {
            this.states.set(statename, state);
        }
    }
    transition(stname) {
        let state = this.states.get(stname);
        if (state && this.currentState) {
            this.currentState.exitState();
        }
        if (state) {
            state.enterState();
            this.currentState = state;
        }
    }
    update(dt) {
        if (this.currentState) {
            this.currentState.update(dt);
        }
    }
}
class CollBaseState {
    constructor(statemgr, wheel) {
        this.statemgr = statemgr;
        this.wheel = wheel;
        this.statename = CollisionState.Zero;
    }
    enterState() {}
    update(delta) {}
    exitState() {}
    disclosecheck(a, b, dir) {
        if (Math.abs(a - b) <= Math.abs(dir)) {
            return true;
        }
        return false;
    }
}

class CollOneState extends CollBaseState {
    constructor(statemgr, wheel) {
        super(statemgr, wheel);
        this.statename = CollisionState.One;
    }
    enterState() {
        let nearangle = this.wheel.nearColloision(this.wheel.balltargetAngle);
        let temptime = (nearangle - this.wheel.ballAngle) / this.wheel.ballAngularVelocity;
        this.wheel.intargetradius = collisionRadius;
        this.wheel.inspeed = (this.wheel.intargetradius - this.wheel.rollradius) / temptime;
    }
    update(delta) {
        this.wheel.updateAngle(delta);
        this.wheel.updateWheelAndBall(delta);

        let stepdin = this.wheel.inspeed * delta;
        this.wheel.rollradius += stepdin;
        if (this.disclosecheck(this.wheel.rollradius, this.wheel.intargetradius, stepdin)) {
            this.statemgr.transition(CollisionState.Two);
        }
    }
}
class CollTwoState extends CollBaseState {
    constructor(statemgr, wheel) {
        super(statemgr, wheel);
        this.statename = CollisionState.Two;
    }
    enterState() {
        this.canNumberCollision = true;
        this.hasjump = false;

        let canjump = Util.limitRandom(0, 1) < 0.5;
        let curtime = this.wheel.wheelTimeToBall();
    

        let intime = curtime * 0.8;
        intime = Math.min(intime, 0.5);
        if (canjump) {
            this.hasjump = true;
            this.canNumberCollision = false;
            let ballv = this.wheel.ballAngularVelocity;
            this.wheel.scaleBallForJump(ballv, intime);
        }
        let targetRadius = (Util.limitRandom(0, 1) * 0.3 + 0.2) * innerRadius;
        if (curtime < 0.45) {
            targetRadius = ballstopRadius + Util.limitRandom(-1, 1) * 50;
        }

        this.defaultaction(intime, targetRadius);
    }
    defaultaction(temptime, targetRadius) {
        this.wheel.ballAngularVelocity = this.wheel.wheelAngularVelocity * 0.5;
        this.wheel.intargetradius = targetRadius;
        this.wheel.inspeed = (this.wheel.intargetradius - this.wheel.rollradius) / temptime;
    }
    update(delta) {
        this.wheel.updateAngle(delta);
        this.wheel.updateWheelAndBall(delta);
        let stepdin = this.wheel.inspeed * delta;
        this.wheel.rollradius += stepdin;
        if (this.canNumberCollision && this.wheel.rollradius <= numberoutRadius && this.wheel.rollradius >= innerRadius && this.checkNumberSlotCollision()) {
            this.canNumberCollision = false;
            let curtime = this.wheel.wheelTimeToBall();
            this.numberCollisionState(curtime);
        }
        if (this.disclosecheck(this.wheel.rollradius, this.wheel.intargetradius, stepdin)) {
            this.statemgr.transition(CollisionState.Three);
        }
    }
    numberCollisionState(curtime) {
        let targetRadius = this.wheel.intargetradius; 
        //Random collisions, inside or outside
        let isoutgo = Util.limitRandom(0, 1) < 0.5;
        if (isoutgo) {
            targetRadius = effectiveRadius;
        }
        let temptime = curtime * 0.7;
        temptime = Math.min(temptime, 0.8);
        this.defaultaction(temptime, targetRadius);
    }
    checkNumberSlotCollision() {
        let ball = this.wheel.formatPiAngle(this.wheel.ballAngle);
        let wheel = this.wheel.formatPiAngle(this.wheel.wheelAngle);
        let diff = Math.abs(ball - wheel);
        let formatdiff = this.wheel.formatPiAngle(diff, singleangle);
        if (formatdiff >= 0.49 * singleangle && formatdiff <= 0.51) {
            return true;
        }
        return false;
    }
}
class CollThreeState extends CollBaseState {
    constructor(statemgr, wheel) {
        super(statemgr, wheel);
        this.statename = CollisionState.Three;
    }
    enterState() {
        this.wheel.intargetradius = ballstopRadius;
        this.wheel.inspeed = 0;

        this.checkResuletState();
    }
    update(delta) {
        this.wheel.updateAngle(delta);
        this.wheel.updateWheelAndBall(delta);
        let stepdin = this.wheel.inspeed * delta;
        this.wheel.rollradius += stepdin;

        if (this.disclosecheck(this.wheel.rollradius, this.wheel.intargetradius, stepdin)) {
            this.wheel.ballAngularVelocity = this.wheel.wheelAngularVelocity;
            this.statemgr.transition(CollisionState.Zero);
            this.wheel.spinresulted();
        }
    }
    checkResuletState() {
        let resultangle = this.wheel.getAngleForNumber(this.wheel.resultNumber);
        let ballAngle = this.wheel.formatPiAngle(this.wheel.ballAngle);
        let wheelAngle = this.wheel.formatPiAngle(this.wheel.wheelAngle);

        let wheelneedto = this.wheel.formatPiAngle(this.wheel.ballAngle + resultangle);
        if (wheelneedto <= wheelAngle) {
            wheelneedto += Math.PI * 2;
        }

        this.wheel.ballAngle = ballAngle;
        this.wheel.wheelAngle = wheelAngle;
        this.wheel.wheeltargetAngle = wheelneedto;

        this.wheel.ballAngularVelocity = 0;
        let wheelspeed = this.wheel.wheelAngularVelocity;
        let cursteptime = (this.wheel.wheeltargetAngle - this.wheel.wheelAngle) / wheelspeed;

        this.wheel.inspeed = (this.wheel.intargetradius - this.wheel.rollradius) / cursteptime;
    }

    defaultresult() {
        let dir = this.wheel.intargetradius > this.wheel.rollradius ? 1 : -1;
        this.wheel.inspeed = dir * spinresultinspeed;
    }

    delayCallBack(delaytime) {
        setTimeout(() => {
            this.defaultresult();
        }, delaytime * 1000);
    }
}
export default class Wheel {
    constructor(root) {
        this.root = root;
        this.initRoulette();
        this.initWheel();
    }
    initWheel() {
        this.container = new Container();

        let wheelbg = Sprite.from('wheelbg.png');
        wheelbg.anchor.set(0.5, 0.5);
        wheelbg.position.set(0, 0);
        this.container.addChild(wheelbg);

        this.wheel = Sprite.from('wheel.png');
        this.wheel.anchor.set(0.5, 0.5);
        this.wheel.position.set(0, -6);
        this.container.addChild(this.wheel);

        this.ball = Sprite.from('ball.png');
        this.ball.anchor.set(0.5, 0.5);
        this.ball.x = this.wheel.x + effectiveRadius * Math.sin(this.ballAngle);
        this.ball.y = this.wheel.y - effectiveRadius * Math.cos(this.ballAngle);
        this.ball.scale.set(0.3);

        this.container.addChild(this.ball);

        let wheeltop = Sprite.from('wheeltop.png');
        wheeltop.anchor.set(0.5, 0.5);
        wheeltop.position.set(0, 0);
        this.container.addChild(wheeltop);

        this.container.position.set(0, RouletteCfg.WheelDefaultY - 320);
        this.root.addChild(this.container);

        //Game statuses are currently fixed and not random in real time
        this.statemgr = new CollStateMgr();
        var statezero = new CollBaseState(this.statemgr, this);
        var stateone = new CollOneState(this.statemgr, this);
        var statetwo = new CollTwoState(this.statemgr, this);
        var statethree = new CollThreeState(this.statemgr, this);
        this.statemgr.addState(statezero);
        this.statemgr.addState(stateone);
        this.statemgr.addState(statetwo);
        this.statemgr.addState(statethree);
    }
    initRoulette() {
        this.ballAngle = 0;
        this.wheelAngle = 0;
        this.wheeltargetAngle = 0;
        this.balltargetAngle = 0;
        this.state = WheelState.Idle;

        this.resetWheel();
    }
    resetWheel() {
        this.ballAngularVelocity = 1; //ball initial speed
        this.balldeceleration = 1; // ball initial friction
        this.wheelAngularVelocity = 1; //wheel initial speed
        this.wheeldeceleration = 1; // wheel initial friction

        this.wheeltargetAngle = 0;
        this.balltargetAngle = 0;
        // this.wheelAngle = 0;
        // this.ballAngle = 0;

        this.inspeed = 0;
        this.intargetradius = 0;
        this.rollradius = effectiveRadius;
        this.resultNumber = -1;
        // Util.resetSeed(); // for test,reset random seed
    }
    spiningState() {
      
        this.balldeceleration = 1; 
        this.wheeldeceleration = 1; 
        this.state = WheelState.Spinning;
    }
    changeWheelIdle(){
        this.state=WheelState.Idle;
    }
    /**
     * Start the roulette wheel spin, the ball and the wheel will start to rotate
     */
    startSpin(result) {
        this.ballAngularVelocity = 10; //startSpin,ball initial speed
        this.balldeceleration = 1; // startSpin,ball initial friction
        this.wheelAngularVelocity = 8; //startSpin,wheel initial speed
        this.wheeldeceleration = 0.985; // startSpin,wheel initial friction

        this.inspeed = 0;
        this.intargetradius = 0;
        this.rollradius = effectiveRadius;

        this.wheeltargetAngle = 0;
        this.balltargetAngle = 0;
        this.collisionCount = CollisionState.Zero; // collision state
        this.state = WheelState.StartSpin;

        this.resultNumber = result;
    }
    /**
     * spin end
     */
    async spinresulted() {
        //Correction position
        let baseAngle = this.getAngleForNumber(this.resultNumber);
        this.ballAngle = this.wheelAngle - baseAngle;
        this.rollradius = ballstopRadius;
        this.state = WheelState.Resulted;
        this.inspeed = 0;
        this.intargetradius = 0;

        //After the resulted, the speed of the roulette wheel and the small ball remains the same
        this.balldeceleration = 1; 
        this.wheeldeceleration = 1; 
        this.ballAngularVelocity = this.wheelAngularVelocity;
        this.resultNumber=-1;
        RoomMgr.getInstance().wheelEffectDone();
    }
    spinResult() {
        const targetNumber=this.resultNumber;
        this.balldeceleration = 1;
        this.wheelAngle = this.formatPiAngle(this.wheelAngle);
        this.ballAngle = this.formatPiAngle(this.ballAngle);
        let baseAngle = this.getAngleForNumber(targetNumber);
        this.wheeltargetAngle = this.wheelAngle; 
        this.balltargetAngle = this.wheeltargetAngle - baseAngle;
        if (this.balltargetAngle <= this.ballAngle) {
            this.balltargetAngle += 2 * Math.PI;

        }
        let runtime = (this.balltargetAngle - this.ballAngle) / this.ballAngularVelocity + 1;
        let addangle = this.wheelAngularVelocity * runtime;
        this.wheeltargetAngle += addangle;
        this.balltargetAngle += addangle;



        this.state = WheelState.Waitresult;
        this.statemgr.transition(CollisionState.One);
    }
    wheelTimeToBall() {
        let wheelAngle = this.formatPiAngle(this.wheelAngle);
        let resultangle = this.getAngleForNumber(this.resultNumber);
        let wheelneedto = this.formatPiAngle(this.ballAngle + resultangle);
        if (wheelneedto <= wheelAngle) {
            wheelneedto += Math.PI * 2;
        }
        let wheelspeed = this.wheelAngularVelocity;
        let cursteptime = (wheelneedto - wheelAngle) / wheelspeed;
        return cursteptime;
    }

    formatPiAngle(angle, format) {
        if (format == undefined) {
            format = 2 * Math.PI;
        }
        let reuslt = angle;

        if (reuslt > 0) {
            for (let i = angle; i > format; i -= format) {
                reuslt = i - format;
            }
        } else {
            for (let i = angle; i < 0; i += format) {
                reuslt = i + format;
            }
        }
        return this.fixNumber4(reuslt);
    }
    fixNumber4(angle) {
        return Math.floor(angle * 10000) / 10000;
    }
    updateAngle(delta) {


        this.ballAngularVelocity -= (1 - this.balldeceleration) * angleSpeedBase * delta;
        this.ballAngularVelocity = Math.max(this.ballAngularVelocity, 0); 

        this.ballAngle += this.ballAngularVelocity * delta;
        this.ballAngle = this.fixNumber4(this.ballAngle);

        this.wheelAngularVelocity -= (1 - this.wheeldeceleration) * angleSpeedBase * delta;
        this.wheelAngularVelocity = Math.max(this.wheelAngularVelocity, 1); 
        this.wheelAngle += this.wheelAngularVelocity * delta;
        this.wheelAngle = this.fixNumber4(this.wheelAngle);

    }
    updateWheelAndBall(delta) {
        this.ball.x = this.wheel.x + this.rollradius * Math.sin(this.ballAngle);
        this.ball.y = this.wheel.y - this.rollradius * Math.cos(this.ballAngle);
        this.wheel.rotation = this.wheelAngle;
    }
    update(delta) {
        if (this.state == WheelState.Idle) {
            return;
        }
        if (this.state == WheelState.Spinning || this.state == WheelState.Resulted) {
            this.updateAngle(delta);
            this.updateWheelAndBall(delta);

            if (this.state == WheelState.Spinning && this.resultNumber != -1) {
                this.spinResult(this.resultNumber);
            }
            return;
        }
        if (this.state == WheelState.StartSpin) {
            this.updateAngle(delta);
            this.updateWheelAndBall(delta);
            if (this.wheelAngularVelocity <= WheelSpiningSpeed) {
                this.spiningState();
            }
            return;
        }
        if (this.state == WheelState.Waitresult) {
            this.statemgr.update(delta);
            return;
        }
    }

    nearColloision(curBallangle) {
        let collisionCount = 8;
        let collisionAngle = (Math.PI * 2) / collisionCount;
        for (let i = 0; ; i++) {
            let collangle = i * collisionAngle + collisionAngle * 0.3;
            if (curBallangle < collangle) {
                if (Math.abs(collangle - curBallangle) < collisionAngle * 0.2) {
                    return collangle + collisionAngle;
                } else {
                    return collangle;
                }
            }
        }
    }

    getAngleForNumber(number) {
        let index = RouletteNumbers.indexOf(number);
        if (index === -1) throw new Error('number not found in RouletteNumbers');
        return -1 * index * ((2 * Math.PI) / 37);
    }
    scaleBallForJump(speed, time) {
        let basescale = 0.3;
        let scale = 1 + (speed * 0.5) / jumpSpeedTag;
        let scalestartt = 0.2 + Util.limitRandom(0, 0.6);
        let actionbig = Action.scaleTo(scale * basescale, scale * basescale, time * scalestartt);
        let actionsmall = Action.scaleTo(1 * basescale, 1 * basescale, time * (1 - scalestartt));
        let seq = Action.sequence([actionbig, actionsmall]);
        this.ball.run(seq);
    }
}
