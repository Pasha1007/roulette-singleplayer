import { Container, Graphics, Text, TextStyle } from 'pixi.js';

/**
 * Premium Sound Control Popup
 * Shows toggle switches for background music and game sounds
 */
export default class SoundPopup {
    constructor(mainBoard) {
        this.mainBoard = mainBoard;
        this.container = null;
        this.isVisible = false;
        this.bgMusicToggle = null;
        this.gameSoundToggle = null;

        // Sound states
        this.bgMusicMuted = false;
        this.gameSoundMuted = false;

        this.createPopup();
    }

    createPopup() {
        this.container = new Container();
        this.container.visible = false;
        this.container.zIndex = 10000; // Very high z-index to appear on top

        // Semi-transparent backdrop
        const backdrop = new Graphics();
        backdrop.beginFill(0x000000, 0.5);
        backdrop.drawRect(-2000, -2000, 4000, 4000);
        backdrop.endFill();
        backdrop.eventMode = 'static';
        backdrop.on('pointerdown', () => this.hide());
        this.container.addChild(backdrop);

        // Popup background - Premium card style (larger size for better visibility)
        const popupWidth = 500;
        const popupHeight = 350;

        const popupBg = new Graphics();
        popupBg.beginFill(0x1a1a1a, 0.95); // Dark background
        popupBg.lineStyle(2, 0xffd700, 1); // Gold border
        popupBg.drawRoundedRect(0, 0, popupWidth, popupHeight, 20);
        popupBg.endFill();

        // Add shadow effect
        const shadow = new Graphics();
        shadow.beginFill(0x000000, 0.3);
        shadow.drawRoundedRect(5, 5, popupWidth, popupHeight, 20);
        shadow.endFill();
        this.container.addChild(shadow);
        this.container.addChild(popupBg);

        // Store popup dimensions for centering
        this.popupWidth = popupWidth;
        this.popupHeight = popupHeight;

        // Title
        const titleStyle = new TextStyle({
            fill: '#FFD700',
            fontFamily: 'swipegamefont',
            fontWeight: 'bold',
            fontSize: 36,
        });
        const title = new Text('🔊 Sound Settings', titleStyle);
        title.anchor.set(0.5, 0);
        title.position.set(popupWidth / 2, 25);
        this.container.addChild(title);

        // Close button (X) - positioned in top-right corner
        const closeButton = new Container();
        closeButton.position.set(popupWidth - 40, 30);
        closeButton.eventMode = 'static';
        closeButton.cursor = 'pointer';

        // Close button background
        const closeBg = new Graphics();
        closeBg.beginFill(0xff0000, 0.8);
        closeBg.drawCircle(0, 0, 25);
        closeBg.endFill();
        closeButton.addChild(closeBg);

        // Close button X symbol
        const closeStyle = new TextStyle({
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontSize: 32,
        });
        const closeX = new Text('×', closeStyle);
        closeX.anchor.set(0.5, 0.5);
        closeX.position.set(0, -2);
        closeButton.addChild(closeX);

        // Close button interaction
        closeButton.on('pointerdown', () => this.hide());
        closeButton.on('pointerover', () => {
            closeBg.clear();
            closeBg.beginFill(0xff3333, 1);
            closeBg.drawCircle(0, 0, 25);
            closeBg.endFill();
        });
        closeButton.on('pointerout', () => {
            closeBg.clear();
            closeBg.beginFill(0xff0000, 0.8);
            closeBg.drawCircle(0, 0, 25);
            closeBg.endFill();
        });

        this.container.addChild(closeButton);

        // Divider line
        const divider = new Graphics();
        divider.lineStyle(1, 0xffd700, 0.3);
        divider.moveTo(30, 90);
        divider.lineTo(popupWidth - 30, 90);
        this.container.addChild(divider);

        // Background Music Toggle
        this.createToggle('Background Music', 150, (state) => {
            this.bgMusicMuted = !state;
            this.mainBoard.updateBackgroundMusicState(this.bgMusicMuted);
        });

        // Game Sound Toggle
        this.createToggle('Game Sounds', 240, (state) => {
            this.gameSoundMuted = !state;
            this.mainBoard.updateGameSoundState(this.gameSoundMuted);
        });

        // Position popup at center of screen
        this.updatePosition();
    }

    createToggle(label, yPosition, onToggle) {
        const labelStyle = new TextStyle({
            fill: '#FFFFFF',
            fontFamily: 'swipegamefont',
            fontSize: 28,
        });
        const labelText = new Text(label, labelStyle);
        labelText.anchor.set(0, 0.5);
        labelText.position.set(40, yPosition);
        this.container.addChild(labelText);

        // Toggle switch container - positioned for larger popup
        const toggleContainer = new Container();
        toggleContainer.position.set(370, yPosition);
        toggleContainer.eventMode = 'static';
        toggleContainer.cursor = 'pointer';

        let isOn = true; // Start with sound ON

        // Toggle background - larger size
        const toggleBg = new Graphics();
        const drawToggleBg = () => {
            toggleBg.clear();
            toggleBg.beginFill(isOn ? 0x4caf50 : 0x666666); // Green when ON, gray when OFF
            toggleBg.drawRoundedRect(0, -18, 85, 36, 18);
            toggleBg.endFill();
        };
        drawToggleBg();
        toggleContainer.addChild(toggleBg);

        // Toggle knob - larger size
        const toggleKnob = new Graphics();
        const drawToggleKnob = () => {
            toggleKnob.clear();
            toggleKnob.beginFill(0xffffff);
            toggleKnob.drawCircle(0, 0, 15);
            toggleKnob.endFill();
            toggleKnob.x = isOn ? 68 : 17;
        };
        drawToggleKnob();
        toggleContainer.addChild(toggleKnob);

        // Toggle interaction
        toggleContainer.on('pointerdown', () => {
            isOn = !isOn;

            // Animate toggle
            const targetX = isOn ? 68 : 17;
            const animateToggle = () => {
                const diff = targetX - toggleKnob.x;
                if (Math.abs(diff) > 0.5) {
                    toggleKnob.x += diff * 0.3;
                    requestAnimationFrame(animateToggle);
                } else {
                    toggleKnob.x = targetX;
                }
            };
            animateToggle();

            drawToggleBg();
            onToggle(isOn);
        });

        this.container.addChild(toggleContainer);

        // Store reference
        if (label === 'Background Music') {
            this.bgMusicToggle = { toggleBg, toggleKnob, isOn, updateState: drawToggleBg };
        } else {
            this.gameSoundToggle = { toggleBg, toggleKnob, isOn, updateState: drawToggleBg };
        }
    }

    updatePosition() {
        // Position popup on the left side of the sound button
        const screenWidth = window.innerWidth || 1024;
        const isMobile = screenWidth <= 768;
        const buttonX = isMobile ? 580 : 520; // Sound button X position from mainboard
        const buttonY = -50; // Sound button Y position from mainboard

        // Position popup to the left of the sound button with some spacing
        const spacing = 20; // Gap between button and popup
        this.container.x = buttonX - this.popupWidth - spacing;

        // Move popup up by 50% of its height for better positioning
        const verticalOffset = this.popupHeight * 1.85;
        this.container.y = buttonY - verticalOffset;

    }

    show() {
        this.isVisible = true;
        this.container.visible = true;
        this.updatePosition();
    }

    hide() {
        this.isVisible = false;
        this.container.visible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    getContainer() {
        return this.container;
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
}
