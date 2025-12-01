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
                        this.positionVideoSprite(this.backgroundSprite, backgroundVideo);

                        this.backgroundSprite.zIndex = 1;
                        this.backgroundSprite.visible = true;
                        this.backgroundSprite.alpha = 1;

                        // Add to container
                        this.container.addChild(this.backgroundSprite);

                        // Add dark overlay on background video
                        this.backgroundOverlayDark = new Graphics();
                        this.backgroundOverlayDark.beginFill(0x000000, 0.5); // 50% black overlay
                        
                        // Match the video sprite dimensions and position
                        const videoWidth = backgroundVideo.videoWidth * this.backgroundSprite.scale.x;
                        const videoHeight = backgroundVideo.videoHeight * this.backgroundSprite.scale.y;
                        this.backgroundOverlayDark.drawRect(
                            this.backgroundSprite.x - videoWidth / 2,
                            this.backgroundSprite.y - videoHeight / 2,
                            videoWidth,
                            videoHeight
                        );
                        this.backgroundOverlayDark.endFill();
                        this.backgroundOverlayDark.zIndex = 2;
                        this.backgroundOverlayDark.visible = true;
                        this.backgroundOverlayDark.alpha = 1;
                        
                        this.container.addChild(this.backgroundOverlayDark);

                        // ADD SHADOW UNDER BACKGROUND VIDEO
                        this.backgroundShadow = new Graphics();
                        this.drawVideoShadow(
                            this.backgroundShadow,
                            this.backgroundSprite.x,
                            this.backgroundSprite.y,
                            videoWidth,
                            videoHeight
                        );
                        this.backgroundShadow.zIndex = 3;
                        this.backgroundShadow.visible = true;
                        this.backgroundShadow.alpha = 1;
                        this.container.addChild(this.backgroundShadow);

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
    positionVideoSprite(sprite, video) {
        const screenWidth = window.innerWidth || 1024;
        const screenHeight = window.innerHeight || 768;

        // Center horizontally
        sprite.x = 0;
        
        // Fixed vertical positioning based on screen size
        if (screenWidth >= 1024) {
            sprite.y = -700; // Desktop
        } else if (screenWidth >= 768) {
            sprite.y = -580; // Tablet
        } else {
            sprite.y = -480; // Mobile
        }

        // FIXED VIDEO DIMENSIONS - Same for all videos
        let fixedWidth, fixedHeight;

        if (screenWidth >= 1024) {
            // Desktop: Fixed size
            fixedWidth = 1400;
            fixedHeight = 800;
        } else if (screenWidth >= 768) {
            // Tablet: Fixed size
            fixedWidth = 1000;
            fixedHeight = 600;
        } else {
            // Mobile: Fixed size
            fixedWidth = 600;
            fixedHeight = 500;
        }

        // Calculate scale to achieve fixed dimensions
        const scaleX = fixedWidth / video.videoWidth;
        const scaleY = fixedHeight / video.videoHeight;
        
        // Use uniform scale (average) to maintain aspect ratio
        const scale = (scaleX + scaleY) / 2;

        // Set the same scale for all videos - no parent compensation needed
        sprite.scale.set(scale, scale);
    }

    /**
     * Draw elegant shadow beneath video for professional look
     * Shared method for both background and result videos
     */
    drawVideoShadow(shadowGraphics, videoX, videoY, videoWidth, videoHeight) {
        shadowGraphics.clear();
        
        const shadowHeight = 25; // Smaller, more subtle shadow
        const borderX = videoX - videoWidth / 2;
        const borderY = videoY + videoHeight / 2;

        // SUBTLE PROFESSIONAL SHADOW - 8-layer gradient for ultra-smooth blend
        // Layer 1: Core shadow - lighter for subtlety
        shadowGraphics.beginFill(0x000000, 0.35);
        shadowGraphics.drawRect(borderX, borderY, videoWidth, shadowHeight * 0.2);
        shadowGraphics.endFill();

        // Layer 2: Primary shadow
        shadowGraphics.beginFill(0x000000, 0.28);
        shadowGraphics.drawRect(borderX, borderY + shadowHeight * 0.2, videoWidth, shadowHeight * 0.22);
        shadowGraphics.endFill();

        // Layer 3: Mid-tone transition
        shadowGraphics.beginFill(0x000000, 0.22);
        shadowGraphics.drawRect(borderX, borderY + shadowHeight * 0.42, videoWidth, shadowHeight * 0.2);
        shadowGraphics.endFill();

        // Layer 4: Soft blend
        shadowGraphics.beginFill(0x000000, 0.17);
        shadowGraphics.drawRect(borderX, borderY + shadowHeight * 0.62, videoWidth, shadowHeight * 0.18);
        shadowGraphics.endFill();

        // Layer 5: Gentle fade
        shadowGraphics.beginFill(0x000000, 0.13);
        shadowGraphics.drawRect(borderX, borderY + shadowHeight * 0.8, videoWidth, shadowHeight * 0.16);
        shadowGraphics.endFill();

        // Layer 6: Subtle transition
        shadowGraphics.beginFill(0x000000, 0.09);
        shadowGraphics.drawRect(borderX, borderY + shadowHeight * 0.96, videoWidth, shadowHeight * 0.14);
        shadowGraphics.endFill();

        // Layer 7: Ultra-soft fade out
        shadowGraphics.beginFill(0x000000, 0.05);
        shadowGraphics.drawRect(borderX, borderY + shadowHeight * 1.1, videoWidth, shadowHeight * 0.12);
        shadowGraphics.endFill();

        // Layer 8: Final whisper for seamless blend
        shadowGraphics.beginFill(0x000000, 0.02);
        shadowGraphics.drawRect(borderX, borderY + shadowHeight * 1.22, videoWidth, shadowHeight * 0.1);
        shadowGraphics.endFill();
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
            // INSTANT HIDE: Hide background immediately for instant video switch
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
        this.positionVideoSprite(this.videoSprite, video);

        this.videoSprite.alpha = 1;
        this.videoSprite.visible = true;
        this.videoSprite.zIndex = 1000;

        // ADD SHADOW UNDER RESULT VIDEO (using shared method)
        if (!this.bottomBorder) {
            this.bottomBorder = new Graphics();
            this.container.addChild(this.bottomBorder);
        }

        // Calculate video dimensions
        const actualScale = this.videoSprite.scale.x;
        const scaledVideoWidth = video.videoWidth * actualScale;
        const scaledVideoHeight = video.videoHeight * actualScale;

        // Draw shadow using shared method
        this.drawVideoShadow(
            this.bottomBorder,
            this.videoSprite.x,
            this.videoSprite.y,
            scaledVideoWidth,
            scaledVideoHeight
        );
        
        this.bottomBorder.zIndex = 1001; // Above video
        this.bottomBorder.alpha = 1;
        this.bottomBorder.visible = true;

        // ADD TEMPORARY DARK OVERLAY on result video for smooth transition from idle
        if (!this.resultVideoOverlay) {
            this.resultVideoOverlay = new Graphics();
            this.container.addChild(this.resultVideoOverlay);
        }
        
        // Draw dark overlay matching video size
        this.resultVideoOverlay.clear();
        this.resultVideoOverlay.beginFill(0x000000, 0.5); // Same darkness as idle video overlay
        this.resultVideoOverlay.drawRect(
            this.videoSprite.x - scaledVideoWidth / 2,
            this.videoSprite.y - scaledVideoHeight / 2,
            scaledVideoWidth,
            scaledVideoHeight
        );
        this.resultVideoOverlay.endFill();
        this.resultVideoOverlay.zIndex = 1002; // Above video and shadow
        this.resultVideoOverlay.alpha = 1;
        this.resultVideoOverlay.visible = true;

        // INSTANT VIDEO APPEARANCE - Video shows immediately for instant switch
        this.videoSprite.alpha = 1;
        this.videoSprite.visible = true;
        if (this.bottomBorder) {
            this.bottomBorder.alpha = 1;
            this.bottomBorder.visible = true;
        }

        // SMOOTH FADE OUT of dark overlay only (for darkening effect)
        const startTime = Date.now();
        const duration = 400; // 400ms smooth overlay fade
        
        const fadeOutOverlay = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out for smooth deceleration
            const easeProgress = 1 - Math.pow(1 - progress, 2);
            
            // Only fade out dark overlay (video stays fully visible)
            this.resultVideoOverlay.alpha = 1 - easeProgress;
            
            if (progress < 1) {
                requestAnimationFrame(fadeOutOverlay);
            } else {
                // Fully faded
                this.resultVideoOverlay.visible = false;
                this.resultVideoOverlay.alpha = 0;
            }
        };
        
        fadeOutOverlay();

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

        // INSTANT CLEANUP: Hide result video immediately
        if (this.videoSprite) {
            this.videoSprite.visible = false;
            this.videoSprite.alpha = 0;
        }
        
        if (this.bottomBorder) {
            this.bottomBorder.visible = false;
            this.bottomBorder.alpha = 0;
        }
        
        if (this.resultVideoOverlay) {
            this.resultVideoOverlay.visible = false;
            this.resultVideoOverlay.alpha = 0;
        }
        
        // IMMEDIATE CALLBACK: Table restores instantly - ZERO DELAY
        if (this.onVideoComplete) {
            this.onVideoComplete();
        }
        
        // INSTANT BACKGROUND SHOW: Background appears immediately
        // Only the darkening overlay will fade smoothly
        this.showBackgroundVideoInstant();
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
     * Seamless fade out effect - transitions perfectly back to background
     */
    fadeOut(callback) {
        if (this.videoSprite) {
            const startTime = Date.now();
            const duration = 600; // 600ms smooth fade-out
            const startAlpha = this.videoSprite.alpha;
            
            const fadeOutTween = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease-in for smooth acceleration into fade
                const easeProgress = progress * progress;
                
                const newAlpha = startAlpha * (1 - easeProgress);
                this.videoSprite.alpha = newAlpha;
                
                // Fade out shadow with same timing
                if (this.bottomBorder) {
                    this.bottomBorder.alpha = newAlpha;
                }
                
                // Fade out result overlay if visible
                if (this.resultVideoOverlay && this.resultVideoOverlay.visible) {
                    this.resultVideoOverlay.alpha = newAlpha;
                }
                
                if (progress < 1) {
                    requestAnimationFrame(fadeOutTween);
                } else {
                    // Fully faded out
                    this.videoSprite.alpha = 0;
                    if (this.bottomBorder) {
                        this.bottomBorder.alpha = 0;
                    }
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
        // Use the instant show method with overlay fade
        this.showBackgroundVideoInstant();
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
     * INSTANT show background video with only overlay fade
     */
    showBackgroundVideoInstant() {
        if (!this.backgroundVideo || !this.backgroundSprite) {
            return;
        }

        try {
            // INSTANT SHOW: Video appears immediately
            this.backgroundSprite.visible = true;
            this.backgroundSprite.alpha = 1;
            
            if (this.backgroundShadow) {
                this.backgroundShadow.visible = true;
                this.backgroundShadow.alpha = 1;
            }

            if (this.backgroundVideo) {
                this.backgroundVideo.currentTime = 0; // Start from beginning

                // Try to play
                try {
                    this.backgroundVideo.play();
                    this.isBackgroundPlaying = true;
                } catch (playError) {
                    this.isBackgroundPlaying = false;
                }

                // Update texture
                if (this.backgroundSprite && this.backgroundSprite.texture.baseTexture.resource) {
                    this.backgroundSprite.texture.baseTexture.resource.source = this.backgroundVideo;
                    this.backgroundSprite.texture.baseTexture.update();
                }
            }

            // SMOOTH FADE IN of dark overlay only (for darkening effect)
            if (this.backgroundOverlayDark) {
                this.backgroundOverlayDark.visible = true;
                this.backgroundOverlayDark.alpha = 0; // Start invisible
                
                const startTime = Date.now();
                const duration = 400; // 400ms smooth overlay fade
                
                const fadeInOverlay = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Ease-out for smooth deceleration
                    const easeProgress = 1 - Math.pow(1 - progress, 2);
                    
                    this.backgroundOverlayDark.alpha = easeProgress;
                    
                    if (progress < 1) {
                        requestAnimationFrame(fadeInOverlay);
                    } else {
                        this.backgroundOverlayDark.alpha = 1;
                    }
                };
                
                fadeInOverlay();
            }
        } catch (error) {}
    }

    /**
     * SMOOTH hide background video with faster fade for seamless transition
     */
    hideBackgroundVideoSmooth() {
        if (!this.backgroundVideo || !this.backgroundSprite) {
            return;
        }

        // SMOOTH FAST FADE: Fade out quickly but smoothly (300ms)
        const startTime = Date.now();
        const duration = 300; // Quick fade
        const startAlpha = this.backgroundSprite.alpha;
        
        const smoothFade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-in-out for smooth acceleration and deceleration
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const newAlpha = startAlpha * (1 - easeProgress);
            this.backgroundSprite.alpha = newAlpha;
            
            if (this.backgroundShadow) {
                this.backgroundShadow.alpha = newAlpha;
            }
            
            if (this.backgroundOverlayDark) {
                this.backgroundOverlayDark.alpha = newAlpha;
            }
            
            if (progress < 1) {
                requestAnimationFrame(smoothFade);
            } else {
                // Fully hidden
                this.backgroundSprite.visible = false;
                if (this.backgroundShadow) {
                    this.backgroundShadow.visible = false;
                }
                if (this.backgroundOverlayDark) {
                    this.backgroundOverlayDark.visible = false;
                }
                if (this.backgroundVideo && this.isBackgroundPlaying) {
                    this.backgroundVideo.pause();
                    this.isBackgroundPlaying = false;
                }
            }
        };
        
        smoothFade();
    }

    /**
     * INSTANT hide background video for zero-delay transitions (backup method)
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
        
        if (this.backgroundOverlayDark) {
            this.backgroundOverlayDark.alpha = 0;
            this.backgroundOverlayDark.visible = false;
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
