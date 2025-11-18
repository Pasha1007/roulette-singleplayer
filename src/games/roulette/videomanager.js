import { Container, Sprite, Texture, BaseTexture, Graphics } from 'pixi.js';
import Util from './Util';

class VideoManager {
    constructor() {
        this.container = new Container();
        this.container.zIndex = 1000;
        this.container.visible = true;
        this.container.alpha = 1;
        this.container.sortableChildren = true; // Enable z-index sorting
        this.container.eventMode = 'none'; // CRITICAL: Don't block clicks - let them pass through to table below
        this.container.interactiveChildren = true; // But allow video sprites to be interactive
        this.videoSprite = null;
        this.backgroundOverlay = null;
        this.currentVideo = null;
        this.bottomBorder = null;
        this.videoTextures = new Map();
        this.isPlaying = false;
        this.onVideoComplete = null;
        this.onVideoStart = null; // Callback when video starts playing
        this.backgroundMusicManager = null; // Reference to background music manager

        // Background video properties
        this.backgroundVideo = null;
        this.backgroundSprite = null;
        this.backgroundTexture = null;
        this.isBackgroundPlaying = false;

        // Initialize video assets mapping
        // Automatically map all 37 roulette numbers (0-36) to their video files
        this.videoMapping = {};
        for (let i = 0; i <= 36; i++) {
            this.videoMapping[i] = `assets/videos/number_${i}.mp4`;
        }

        // Background video path - Using local video for better performance
        this.backgroundVideoPath = 'assets/videos/background.mp4';
    }

    /**
     * Initialize video textures for efficient loading
     * ON-DEMAND LOADING: Videos load when needed for fast game startup
     */
    async initializeVideos() {
        try {
            // Initialize background video using same approach as result videos
            await this.initializeBackgroundVideo();
            
            // Skip eager preloading - videos will load on-demand when needed
            // This allows the game to start quickly without waiting for all 37 videos
            console.log('[VideoManager] Videos ready for on-demand loading');
        } catch (error) {
            console.log('[VideoManager] Video initialization error:', error);
        }
    }

    /**
     * Initialize background video for table view
     * Uses same proven approach as result videos to avoid texture issues
     */
    async initializeBackgroundVideo() {
        return new Promise((resolve) => {
            try {
                // Create background video element with same setup as result videos
                const backgroundVideo = document.createElement('video');
                backgroundVideo.src = this.backgroundVideoPath;
                backgroundVideo.crossOrigin = 'anonymous';
                backgroundVideo.loop = true;
                backgroundVideo.muted = true;
                backgroundVideo.preload = 'metadata'; // Same as result videos
                backgroundVideo.playsInline = true;
                backgroundVideo.setAttribute('playsinline', 'true');
                backgroundVideo.setAttribute('webkit-playsinline', 'true');
                backgroundVideo.setAttribute('controls', 'false');
                backgroundVideo.style.pointerEvents = 'none';
                backgroundVideo.style.display = 'none';

                // CRITICAL: Wait for loadedmetadata before creating texture (same as result videos)
                backgroundVideo.addEventListener('loadedmetadata', () => {
                    try {
                        // Create texture using SAME method as result videos
                        const texture = Texture.from(backgroundVideo);

                        // Create background sprite
                        this.backgroundSprite = new Sprite(texture);
                        this.backgroundSprite.anchor.set(0.5, 0.5);

                        // Position video sprite
                        this.positionVideoSprite(this.backgroundSprite, backgroundVideo, true);

                        this.backgroundSprite.zIndex = 1;
                        this.backgroundSprite.visible = true;
                        this.backgroundSprite.alpha = 1;

                        // Add to container
                        this.container.addChild(this.backgroundSprite);

                        // Store reference
                        this.backgroundVideo = backgroundVideo;

                        // Start playing
                        backgroundVideo.play().catch(() => {});

                        console.log('[VideoManager] Background video initialized successfully');
                        resolve(true);
                    } catch (error) {
                        console.log('[VideoManager] Background video texture creation failed:', error);
                        resolve(false);
                    }
                });

                backgroundVideo.addEventListener('error', () => {
                    console.log('[VideoManager] Background video load error');
                    resolve(false);
                });

                // Timeout fallback
                setTimeout(() => {
                    if (!this.backgroundSprite) {
                        console.log('[VideoManager] Background video timeout - proceeding without it');
                        resolve(false);
                    }
                }, 2000);

            } catch (error) {
                console.log('[VideoManager] Background video initialization error:', error);
                resolve(false);
            }
        });
    }

    /**
     * SHARED positioning logic for both background and result videos
     * Ensures consistent size and position across all videos
     */
    positionVideoSprite(sprite, video, applyParentScaleCompensation = true) {
        const screenWidth = window.innerWidth || 1024;
        const screenHeight = window.innerHeight || 768;

        // Position: Same for both desktop and mobile
        sprite.x = 0; // Center horizontally
        if (screenWidth >= 1024) {
            sprite.y = -900;
        } else if (screenWidth >= 768) {
            sprite.y = -900;
        } else if (screenWidth >= 400) {
            sprite.y = -650;
        } else if (screenWidth <= 399) {
            sprite.y = -650;
        } else {
            sprite.y = -1300;
        }

        // Size: Calculate responsive dimensions
        let videoWidth, targetHeight;

        if (screenWidth >= 1024) {
            videoWidth = screenWidth * 1.55;
            targetHeight = screenHeight * 0.9;
        } else if (screenWidth >= 768) {
            videoWidth = screenWidth * 1.2;
            targetHeight = screenHeight * 0.6;
        } else if (screenWidth >= 400) {
            videoWidth = screenWidth * 1.6;
            targetHeight = screenHeight * 0.9;
        } else if (screenWidth <= 399) {
            videoWidth = screenWidth * 1.58;
            targetHeight = screenHeight * 0.9;
        } else {
            videoWidth = screenWidth * 1.0;
            targetHeight = screenHeight * 0.8;
        }

        // Scale to match appropriate width for device
        const scaleX = videoWidth / video.videoWidth;
        const scaleY = targetHeight / video.videoHeight;
        const scale = screenWidth > 768 ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);

        // Apply parent scale compensation only for result videos (when table scales to 0.7)
        if (applyParentScaleCompensation) {
            const parentScale = 0.7;
            const compensatedScale = scale / parentScale;
            sprite.scale.set(compensatedScale);
        } else {
            sprite.scale.set(scale);
        }
    }

    /**
     * Load and cache a video texture
     */
    async loadVideoTexture(number, videoPath) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = videoPath;
            video.crossOrigin = 'anonymous';
            video.loop = false;
            video.muted = true; // Start muted to avoid autoplay issues
            video.preload = 'metadata';

            // CRITICAL MOBILE FIXES: Prevent video from opening separately on mobile
            video.playsInline = true; // Essential for iOS Safari inline playback
            video.setAttribute('playsinline', 'true'); // Additional iOS compatibility
            video.setAttribute('webkit-playsinline', 'true'); // Older iOS versions
            video.setAttribute('controls', 'false'); // Ensure no controls show
            video.style.pointerEvents = 'none'; // Prevent user interaction
            video.style.display = 'none'; // Hide the actual video element

            video.addEventListener('loadedmetadata', () => {
                try {
                    const texture = Texture.from(video);
                    this.videoTextures.set(number, { video, texture });
                    resolve(texture);
                } catch (error) {
                    reject(error);
                }
            });

            video.addEventListener('error', (e) => {
                reject(e);
            });
        });
    }

    /**
     * Play video for specific number result
     */
    async playVideoForNumber(number, onComplete) {
        this.onVideoComplete = onComplete;

        // Check if we have a video for this number
        if (!this.videoTextures.has(number)) {
            // Try to load video dynamically
            if (this.videoMapping[number]) {
                try {
                    await this.loadVideoTexture(number, this.videoMapping[number]);
                } catch (error) {
                    if (onComplete) onComplete();
                    return false;
                }
            } else {
                // Fallback to wheel animation for numbers without videos
                if (onComplete) onComplete();
                return false;
            }
        }

        const videoData = this.videoTextures.get(number);
        if (!videoData) {
            if (onComplete) onComplete();
            return false;
        }

        try {
            // INSTANT TRANSITION: Hide background immediately without waiting for fade
            this.hideBackgroundVideoInstant();

            await this.startVideoPlayback(videoData);
            return true;
        } catch (error) {
            if (onComplete) onComplete();
            return false;
        }
    }

    /**
     * Start video playback with fade in effect
     */
    async startVideoPlayback(videoData) {
        const { video, texture } = videoData;

        // Skip background overlay - no gray background needed

        // Create video sprite if not exists
        if (!this.videoSprite) {
            this.videoSprite = new Sprite(texture);
            this.videoSprite.anchor.set(0.5, 0.5);
            this.container.addChild(this.videoSprite);
        } else {
            this.videoSprite.texture = texture;
        }

        // Use SHARED positioning logic for consistent sizing
        this.positionVideoSprite(this.videoSprite, video, true); // true = apply parent scale compensation

        this.videoSprite.alpha = 1;
        this.videoSprite.visible = true;
        this.videoSprite.zIndex = 1000;

        // ADD BLACK BOTTOM BORDER
        if (!this.bottomBorder) {
            this.bottomBorder = new Graphics();
            this.container.addChild(this.bottomBorder);
        }

        // Clear previous border and draw new one
        this.bottomBorder.clear();

        // Calculate border position and size based on scaled video
        // Get the actual scale from the sprite (already set by positionVideoSprite)
        const actualScale = this.videoSprite.scale.x;
        const scaledVideoWidth = video.videoWidth * actualScale;
        const scaledVideoHeight = video.videoHeight * actualScale;
        const shadowHeight = 35; // Thicker shadow for professional look

        // Position border at bottom of video
        const borderX = this.videoSprite.x - scaledVideoWidth / 2;
        const borderY = this.videoSprite.y + scaledVideoHeight / 2;

        // PROFESSIONAL REALISTIC SHADOW - Multi-layer gradient for depth
        // Core shadow - most prominent
        this.bottomBorder.beginFill(0x000000, 0.5); // Professional darker shadow
        this.bottomBorder.drawRect(borderX, borderY, scaledVideoWidth, shadowHeight * 0.4);
        this.bottomBorder.endFill();

        // Mid shadow layer for smooth transition
        this.bottomBorder.beginFill(0x000000, 0.35); // Medium darkness
        this.bottomBorder.drawRect(borderX, borderY + shadowHeight * 0.4, scaledVideoWidth, shadowHeight * 0.35);
        this.bottomBorder.endFill();

        // Outer shadow layer for realistic fade
        this.bottomBorder.beginFill(0x000000, 0.25); // Moderate darkness
        this.bottomBorder.drawRect(borderX, borderY + shadowHeight * 0.75, scaledVideoWidth, shadowHeight * 0.3);
        this.bottomBorder.endFill();

        // Soft edge for natural look
        this.bottomBorder.beginFill(0x000000, 0.18); // Softer edge
        this.bottomBorder.drawRect(borderX, borderY + shadowHeight * 1.05, scaledVideoWidth, shadowHeight * 0.25);
        this.bottomBorder.endFill();

        // Subtle fade-out for professional finish
        this.bottomBorder.beginFill(0x000000, 0.12); // Very soft fade
        this.bottomBorder.drawRect(borderX, borderY + shadowHeight * 1.3, scaledVideoWidth, shadowHeight * 0.2);
        this.bottomBorder.endFill();

        // Final soft edge for ultimate realism
        this.bottomBorder.beginFill(0x000000, 0.06); // Ultra-soft edge
        this.bottomBorder.drawRect(borderX, borderY + shadowHeight * 1.5, scaledVideoWidth, shadowHeight * 0.15);
        this.bottomBorder.endFill();
        this.bottomBorder.zIndex = 1001; // Above video
        this.bottomBorder.alpha = 1;
        this.bottomBorder.visible = true;

        // SMOOTH VIDEO ENTRANCE: Enhanced cinematic transition
        this.fadeIn();

        // Debug: Check container hierarchy after sprites are created

        // Setup video event handlers
        video.addEventListener('ended', this.onVideoEnded.bind(this), { once: true });

        // Start video playback
        this.isPlaying = true;
        this.currentVideo = video;

        try {
            // *** FIX: RESET VIDEO TO START FROM BEGINNING ***
            video.currentTime = 0;

            // ENABLE AUDIO: Play video with sound
            // We'll handle background music continuation separately
            video.muted = false;
            video.volume = 0.8; // Video at 80% volume

            await video.play();

            // CRITICAL: Update texture source to ensure PixiJS renders the video
            this.videoSprite.texture.baseTexture.resource.source = video;
            this.videoSprite.texture.baseTexture.update();

            // Force texture refresh for immediate display
            this.videoSprite.texture.updateUvs();
            this.videoSprite._textureID = -1; // Force texture refresh

            // iOS FIX: Resume background music after video starts
            // On iOS, when video with audio plays, it may interrupt other audio
            // We need to manually resume the background music
            if (this.backgroundMusicManager) {
                // Wait a tiny bit for video to start, then resume background music
                setTimeout(() => {
                    console.log('[VideoManager] Resuming background music alongside video');
                    this.backgroundMusicManager.resumeIfNotMuted();
                }, 100);
            }

            // Notify callback that video started
            if (this.onVideoStart) {
                this.onVideoStart();
            }
        } catch (error) {
            this.isPlaying = false;
            if (this.onVideoComplete) this.onVideoComplete();
        }
    }

    /**
     * Handle video playback completion and cleanup
     */
    onVideoEnded() {
        this.isPlaying = false;

        // Hide and cleanup video sprite
        if (this.videoSprite) {
            this.videoSprite.visible = false;
            this.videoSprite.alpha = 0;
        }

        // Hide bottom border
        if (this.bottomBorder) {
            this.bottomBorder.visible = false;
            this.bottomBorder.alpha = 0;
        }

        this.fadeOut(() => {
            // Show background video again when result video ends
            setTimeout(() => {
                this.showBackgroundVideo();
            }, 500);

            if (this.onVideoComplete) {
                this.onVideoComplete();
            }
        });
    }

    /**
     * INSTANT video appearance for zero-delay transitions
     */
    fadeIn() {
        if (this.videoSprite) {
            // INSTANT TRANSITION: Show video immediately with no delay
            this.videoSprite.alpha = 1;
            this.videoSprite.visible = true;

            // Show border instantly too
            if (this.bottomBorder) {
                this.bottomBorder.alpha = 1;
                this.bottomBorder.visible = true;
            }
            
            // No animation - instant display for zero perceived delay
        }
    }

    /**
     * Ultra-smooth cinematic video entrance effect - preserves target scale
     */
    smoothVideoEntrance(targetScale = 1.0) {
        const fadeSpeed = 0.15; // Enhanced smooth entrance speed
        let currentAlpha = 0;

        // Add subtle scale effect for professional cinema-like entrance
        let currentScale = this.videoSprite.scale.x; // Start from current scale
        const scaleSpeed = 0.008;

        const entranceAnimation = () => {
            // Smooth alpha fade-in
            currentAlpha += fadeSpeed;
            this.videoSprite.alpha = Math.min(1, currentAlpha);

            // Fade in border with same alpha
            if (this.bottomBorder) {
                this.bottomBorder.alpha = Math.min(1, currentAlpha);
            }

            // Subtle scale-down to target scale (not 1.0)
            if (currentScale > targetScale) {
                currentScale = Math.max(targetScale, currentScale - scaleSpeed);
                this.videoSprite.scale.set(currentScale);
            }

            if (currentAlpha < 1 || currentScale > targetScale) {
                requestAnimationFrame(entranceAnimation);
            }
        };

        // Immediate transition - no delay for instant response
        requestAnimationFrame(entranceAnimation);
    }

    /**
     * Smooth fade in animation for realistic transition
     */
    smoothFadeIn() {
        const fadeSpeed = 0.08; // Smooth but quick fade
        const fadeInAnimation = () => {
            if (this.videoSprite) {
                // Gradually increase alpha for smooth transition
                this.videoSprite.alpha = Math.min(1, this.videoSprite.alpha + fadeSpeed);

                // Continue animation until fully visible
                if (this.videoSprite.alpha < 1) {
                    requestAnimationFrame(fadeInAnimation);
                } else {
                }
            }
        };

        // Start the smooth animation
        fadeInAnimation();
    }

    /**
     * Seamless fade out effect - transitions perfectly back to wheel
     */
    fadeOut(callback) {
        if (this.videoSprite) {
            const fadeOutTween = () => {
                this.videoSprite.alpha = Math.max(0, this.videoSprite.alpha - 0.1);
                if (this.videoSprite.alpha > 0) {
                    requestAnimationFrame(fadeOutTween);
                } else {
                    if (callback) callback();
                }
            };
            fadeOutTween();
        } else if (callback) {
            callback();
        }
    }

    /**
     * Stop current video playback
     */
    stopVideo() {
        if (this.currentVideo && this.isPlaying) {
            this.currentVideo.pause();
            this.currentVideo.currentTime = 0;
            this.isPlaying = false;
        }

        if (this.videoSprite) {
            this.videoSprite.alpha = 0;
        }
    }

    /**
     * Set reference to background music manager
     * This allows us to resume music when video plays
     */
    setBackgroundMusicManager(manager) {
        this.backgroundMusicManager = manager;
        console.log('[VideoManager] Background music manager linked');
    }

    /**
     * Get the video container for adding to scene
     */
    getContainer() {
        return this.container;
    }

    /**
     * Clean up video resources
     */
    destroy() {
        this.stopVideo();
        this.videoTextures.forEach(({ video, texture }) => {
            video.removeAttribute('src');
            video.load();
            texture.destroy();
        });
        this.videoTextures.clear();

        if (this.videoSprite) {
            this.videoSprite.destroy();
            this.videoSprite = null;
        }

        if (this.container) {
            this.container.destroy();
        }
    }

    /**
     * Show background video during table view with smooth fade-in
     */
    async showBackgroundVideo() {
        if (!this.backgroundVideo || !this.backgroundSprite) {
            return;
        }

        try {
            // Start invisible for smooth fade-in effect
            this.backgroundSprite.visible = true;
            this.backgroundSprite.alpha = 0;

            if (this.backgroundVideo) {
                this.backgroundVideo.currentTime = 0; // Start from beginning

                // Try to play - handle autoplay restrictions
                try {
                    await this.backgroundVideo.play();
                    this.isBackgroundPlaying = true;
                } catch (playError) {
                    // If autoplay fails, keep video ready but not playing
                    this.isBackgroundPlaying = false;
                }

                // Update texture to show video frame
                if (this.backgroundSprite && this.backgroundSprite.texture.baseTexture.resource) {
                    this.backgroundSprite.texture.baseTexture.resource.source = this.backgroundVideo;
                    this.backgroundSprite.texture.baseTexture.update();
                }
            }

            // Smooth fade-in animation
            const fadeIn = () => {
                if (this.backgroundSprite) {
                    this.backgroundSprite.alpha = Math.min(1, this.backgroundSprite.alpha + 0.06);
                    
                    // Fade in shadow with same timing
                    if (this.backgroundShadow) {
                        this.backgroundShadow.visible = true;
                        this.backgroundShadow.alpha = this.backgroundSprite.alpha;
                    }
                    
                    if (this.backgroundSprite.alpha < 1) {
                        requestAnimationFrame(fadeIn);
                    }
                }
            };
            fadeIn();
        } catch (error) {}
    }

    /**
     * Hide background video during wheel view with smooth fade-out
     * Returns a promise that resolves when fade is complete
     */
    async hideBackgroundVideo() {
        if (!this.backgroundVideo || !this.backgroundSprite) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            // Smooth fade out animation for both video and shadow
            const fadeOut = () => {
                this.backgroundSprite.alpha = Math.max(0, this.backgroundSprite.alpha - 0.15);
                
                // Fade out shadow with same timing
                if (this.backgroundShadow) {
                    this.backgroundShadow.alpha = this.backgroundSprite.alpha;
                }
                
                if (this.backgroundSprite.alpha > 0) {
                    requestAnimationFrame(fadeOut);
                } else {
                    // Hide sprite and pause video when fully faded
                    this.backgroundSprite.visible = false;
                    if (this.backgroundShadow) {
                        this.backgroundShadow.visible = false;
                    }
                    if (this.backgroundVideo && this.isBackgroundPlaying) {
                        this.backgroundVideo.pause();
                        this.isBackgroundPlaying = false;
                    }
                    resolve();
                }
            };
            fadeOut();
        });
    }

    /**
     * INSTANT hide background video for zero-delay transitions
     */
    hideBackgroundVideoInstant() {
        if (!this.backgroundVideo || !this.backgroundSprite) {
            return;
        }

        // INSTANT: Hide immediately without animation
        this.backgroundSprite.alpha = 0;
        this.backgroundSprite.visible = false;
        
        if (this.backgroundShadow) {
            this.backgroundShadow.alpha = 0;
            this.backgroundShadow.visible = false;
        }
        
        if (this.backgroundVideo && this.isBackgroundPlaying) {
            this.backgroundVideo.pause();
            this.isBackgroundPlaying = false;
        }
    }

    /**
     * Check if video is currently playing
     */
    getIsPlaying() {
        return this.isPlaying;
    }

    /**
     * Check if background video is currently playing
     */
    getIsBackgroundPlaying() {
        return this.isBackgroundPlaying;
    }
}

export default VideoManager;
