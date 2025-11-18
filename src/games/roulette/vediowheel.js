import RoomMgr from './roommgr';
import GameState from './gamestate';
import VideoManager from './videomanager';
export default class VideoWheel {

    constructor(root) {
        this.root = root;
        this.initWheel();
    }
    initWheel() {
        this.videoManager = new VideoManager();
        this.videoContainer = this.videoManager.getContainer();
        this.videoContainer.x = 0;
        this.videoContainer.y = 0; // Position at root level, not offset
        this.videoContainer.zIndex = -100; // Very low priority to ensure background appears behind everything
        this.root.addChild(this.videoContainer); // Add to root, NOT wheel container!

        // Initialize videos asynchronously and show background video when ready
        this.videoManager.initializeVideos().then(() => {
            // Show background video when ready
            this.videoManager.showBackgroundVideo();
        });
    }
    /**
    * Play video for specific number result
    */
    async playNumberVideo(number) {
        if (this.videoManager) {

            // Enter split-screen mode: show both video and wheel
            this.enterSplitScreenMode();


            // Start video with split-screen layout
            this.beginVideoTransition(number);
        }
    }
    /**
    * Begin direct video transition - split screen with table
    */
    beginVideoTransition(number) {

        // Table resizing is now handled in MainBoard.actionPreStartSpin()
        // This method just manages video playback

        // Start video immediately with smooth entrance effect
        this.videoManager.playVideoForNumber(number, () => {
            
            
            // Restore game state and enable next round
            const roomMgr = RoomMgr.getInstance();
            if (roomMgr) {
                roomMgr.wheelEffectDone(); // Critical: restore normal game flow
            }
            // Exit split-screen mode first
            this.exitSplitScreenMode();
            //****************************************************************
            //NOW，convaiIntegration maybe should put in roommgr
            //clear and reset stat can put in roomMgr.wheelEffectDone
            //****************************************************************


            // // Notify ConvAI integration that video completed
            // const gameState = GameState.getInstance();  
            // let mainBoard = gameState.mainboard;
            // if (mainBoard && mainBoard.convaiIntegration) {
            //     mainBoard.convaiIntegration.handleGameEvent('video_completed', {
            //         number: number,
            //         isWin: false // Could be calculated based on betting
            //     });
            // }

            // // *** CLEAR BETS AND CHIPS FOR NEXT ROUND ***
            // gameState.clearBetList(); // Clear the bet list
            // if (mainBoard) {
            //     mainBoard.clearAllChips(); // Clear visual chips from table
            // }

            // // Find and reset main board state properly

            // // Try multiple approaches to find main board if not found via GameState
            // if (!mainBoard) {

            //     // Approach 1: Through parent chain
            //     if (this.parent?.parent?.parent && this.parent.parent.parent.boradtype !== undefined) {
            //         mainBoard = this.parent.parent.parent;
            //     }
            // }

            // if (mainBoard) {

            //     // Complete reset to enable next spin
            //     mainBoard.boradtype = 0; // MainBoradType.MenuState
            //     mainBoard.spinBtnAble = true;


            //     // Force button state refresh
            //     if (mainBoard.checkSpinBtnAble) {
            //         mainBoard.checkSpinBtnAble();
            //     }
            // } else {
            // }
        });
    }
    /**
     * Enter split-screen mode: position wheel on right, make room for video on left
     * NOW enterSplitScreenMode  maybe should put in mainBoard，because mainBoard know how to resize table and other containers
     */
    enterSplitScreenMode() {
        const gameState = GameState.getInstance();

        if (gameState &&gameState.getMainBoard()) {
            const mainborad=gameState.getMainBoard();
            mainborad.enterSplitScreenMode();
        }


        // Save original transforms if not already saved
        // if (!this.originalTransform) {
        //     this.originalTransform = {
        //         x: this.container.x,
        //         y: this.container.y,
        //         scaleX: this.container.scale.x,
        //         scaleY: this.container.scale.y,
        //         alpha: this.container.alpha
        //     };
        // }
        
        // // HIDE WHEEL COMPLETELY - User doesn't want to see real wheel
        // this.container.visible = false; // Hide wheel completely
        // this.container.alpha = 0;       // Make invisible
        
        // Table resizing is now handled in MainBoard.actionPreStartSpin()
        // Just ensure wheel is hidden during video
    }

    /**
     * Exit split-screen mode: restore original wheel and table positions
    * NOW enterSplitScreenMode  maybe should put in mainBoard，because mainBoard know how to resize table and other containers
     */
    exitSplitScreenMode() {
        const gameState = GameState.getInstance();

        if (gameState &&gameState.getMainBoard()) {
            const mainborad=gameState.getMainBoard();
            mainborad.exitSplitScreenMode();
        }

        // Restore wheel transforms
        // if (this.originalTransform) {
        //     this.container.x = this.originalTransform.x;
        //     this.container.y = this.originalTransform.y;
        //     this.container.scale.set(this.originalTransform.scaleX, this.originalTransform.scaleY);
        //     this.container.alpha = this.originalTransform.alpha;
        //     this.container.visible = true;
        // }
        
        // // RESTORE TABLE VIA MAINBOARD METHOD
        // const gameState = GameState.getInstance();
        // const mainBoard = gameState.mainboard;
        
        // if (mainBoard && mainBoard.restoreTableTransforms) {
        //     // Use MainBoard's own restoration method  
        //     mainBoard.restoreTableTransforms();
        // } else {
        // }
    }
}