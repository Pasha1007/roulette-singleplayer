/**
 * Background Music Playlist Manager
 * Manages background music playlist with sequential playback and loop
 * Handles mobile browser autoplay restrictions
 */
export default class BackgroundMusicManager {
    constructor() {
        this.playlist = [
            'assets/music/bgmusic1.mp3',
            'assets/music/bgmusic2.mp3',
            'assets/music/bgmusic3.mp3',
            'assets/music/bgmusic4.mp3',
            'assets/music/bgmusic5.mp3',
            'assets/music/bgmusic6.mp3',
        ];

        this.currentTrackIndex = 0;
        this.audio = null;
        this.isMuted = false;
        this.volume = 0.3; // 30% volume - playing quietly in background
        this.isInitialized = false;
        this.hasUserInteracted = false;
        
        console.log('[BG Music] Manager created');
    }

    /**
     * Initialize the music manager
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('[BG Music] Already initialized');
            return;
        }

        console.log('[BG Music] Initializing...');
        
        this.audio = new Audio();
        this.audio.volume = this.volume;
        this.audio.loop = false; // We handle looping manually for playlist
        this.audio.preload = 'auto';

        // When current track ends, play next track
        this.audio.addEventListener('ended', () => {
            console.log('[BG Music] Track ended, playing next');
            this.playNextTrack();
        });

        // Handle errors gracefully
        this.audio.addEventListener('error', (e) => {
            console.error('[BG Music] Error:', e);
            this.playNextTrack();
        });
        
        // Log when music starts playing
        this.audio.addEventListener('play', () => {
            console.log('[BG Music] ✓ Music playing - Track', this.currentTrackIndex + 1);
        });
        
        this.audio.addEventListener('pause', () => {
            console.log('[BG Music] Music paused');
        });

        this.isInitialized = true;
        console.log('[BG Music] Initialized successfully');

        // Try to play immediately (will fail on mobile, that's OK)
        await this.tryPlay();
    }

    /**
     * Try to play music (handles autoplay restrictions)
     */
    async tryPlay() {
        if (!this.audio) {
            console.log('[BG Music] Audio not ready');
            await this.initialize();
            return;
        }

        if (this.isMuted) {
            console.log('[BG Music] Muted, not playing');
            return;
        }

        try {
            console.log('[BG Music] Attempting to play track', this.currentTrackIndex + 1);
            this.audio.src = this.playlist[this.currentTrackIndex];
            this.audio.volume = this.volume;

            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('[BG Music] ✓ Autoplay SUCCESS!');
                        this.hasUserInteracted = true;
                    })
                    .catch((error) => {
                        console.log('[BG Music] Autoplay blocked (normal on mobile):', error.name);
                        console.log('[BG Music] Waiting for user interaction...');
                    });
            }
        } catch (error) {
            console.error('[BG Music] Play error:', error);
        }
    }

    /**
     * Start music after user interaction (called by event handlers)
     */
    startOnUserInteraction() {
        console.log('[BG Music] User interaction detected!');
        
        if (this.hasUserInteracted) {
            console.log('[BG Music] Already started, ignoring');
            return;
        }
        
        if (!this.audio) {
            console.log('[BG Music] Audio not initialized');
            return;
        }
        
        console.log('[BG Music] Starting music from user interaction...');
        this.hasUserInteracted = true;
        this.tryPlay();
    }

    /**
     * Play next track in playlist
     */
    playNextTrack() {
        // Move to next track, loop back to start if at end
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        console.log('[BG Music] Next track:', this.currentTrackIndex + 1);
        this.tryPlay();
    }

    /**
     * Pause current track
     */
    pause() {
        if (this.audio) {
            this.audio.pause();
        }
    }

    /**
     * Resume playing
     */
    resume() {
        if (this.audio && !this.isMuted) {
            console.log('[BG Music] Resuming...');
            this.audio.play().catch(() => {});
        }
    }

    /**
     * Resume playing if not muted (used when video audio plays)
     * Forces background music to continue playing alongside video audio
     */
    resumeIfNotMuted() {
        if (!this.audio || this.isMuted) {
            return;
        }

        // Check if audio is paused (iOS may have auto-paused it)
        if (this.audio.paused) {
            console.log('[BG Music] iOS paused music, resuming to play with video...');
            this.audio.play().catch((err) => {
                console.log('[BG Music] Resume blocked:', err.name);
            });
        } else {
            console.log('[BG Music] Already playing, no resume needed');
        }
    }

    /**
     * Mute background music
     */
    mute() {
        console.log('[BG Music] Muting');
        this.isMuted = true;
        if (this.audio) {
            this.audio.pause();
        }
    }

    /**
     * Unmute background music
     */
    unmute() {
        console.log('[BG Music] Unmuting');
        this.isMuted = false;
        if (this.audio && this.isInitialized) {
            this.audio.play().catch(() => {});
        } else {
            this.initialize();
        }
    }

    /**
     * Set volume (0.0 to 1.0)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audio) {
            this.audio.volume = this.volume;
        }
        console.log('[BG Music] Volume set to', this.volume);
    }

    /**
     * Get current mute state
     */
    isMutedState() {
        return this.isMuted;
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        console.log('[BG Music] Destroying');
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
        }
        this.isInitialized = false;
    }
}
