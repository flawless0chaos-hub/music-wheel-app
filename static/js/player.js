// ===============================
// Audio Player with Tone.js + YouTube Support
// ===============================

class MusicPlayer {
    constructor() {
        this.player = null;
        this.youtubePlayer = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 0.7;
        this.onTimeUpdate = null;
        this.onEnded = null;
        this.currentPlayerType = null; // 'audio', 'youtube', or null
        this.youtubeReady = false;
        
        // Initialize Tone.js (if available)
        if (typeof Tone !== 'undefined') {
            this.useTone = true;
            Tone.Transport.start();
            console.log('✓ Using Tone.js');
        } else {
            this.useTone = false;
            this.audio = new Audio();
            this.audio.volume = this.volume;
            console.log('✓ Using Web Audio API');
            this.setupWebAudioListeners();
        }
        
        // Setup YouTube player when API is ready
        this.initYouTubePlayer();
    }
    
    // Initialize YouTube IFrame Player
    initYouTubePlayer() {
        // Create hidden div for YouTube player
        if (!document.getElementById('youtube-player-container')) {
            const container = document.createElement('div');
            container.id = 'youtube-player-container';
            container.style.cssText = 'position: fixed; top: -9999px; left: -9999px; width: 1px; height: 1px;';
            document.body.appendChild(container);
        }
        
        // Wait for YouTube API to load
        const checkYouTubeAPI = () => {
            if (typeof YT !== 'undefined' && YT.Player) {
                this.youtubePlayer = new YT.Player('youtube-player-container', {
                    height: '1',
                    width: '1',
                    playerVars: {
                        autoplay: 0,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        modestbranding: 1,
                        playsinline: 1
                    },
                    events: {
                        'onReady': () => {
                            this.youtubeReady = true;
                            console.log('✓ YouTube Player ready');
                        },
                        'onStateChange': (event) => this.onYouTubeStateChange(event),
                        'onError': (event) => {
                            console.error('YouTube Player error:', event.data);
                        }
                    }
                });
            } else {
                setTimeout(checkYouTubeAPI, 100);
            }
        };
        
        checkYouTubeAPI();
    }
    
    // YouTube state change handler
    onYouTubeStateChange(event) {
        // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
        if (event.data === YT.PlayerState.ENDED) {
            this.isPlaying = false;
            if (this.onEnded) {
                this.onEnded();
            }
        } else if (event.data === YT.PlayerState.PLAYING) {
            this.isPlaying = true;
            this.startYouTubeProgressTracking();
        } else if (event.data === YT.PlayerState.PAUSED) {
            this.isPlaying = false;
            this.stopYouTubeProgressTracking();
        }
    }
    
    // Track YouTube progress
    startYouTubeProgressTracking() {
        if (this.youtubeProgressInterval) {
            clearInterval(this.youtubeProgressInterval);
        }
        
        this.youtubeProgressInterval = setInterval(() => {
            if (this.youtubePlayer && this.currentPlayerType === 'youtube') {
                try {
                    this.currentTime = this.youtubePlayer.getCurrentTime() || 0;
                    this.duration = this.youtubePlayer.getDuration() || 0;
                    
                    if (this.onTimeUpdate) {
                        this.onTimeUpdate(this.currentTime, this.duration);
                    }
                } catch (e) {
                    // Player might not be ready yet
                }
            }
        }, 100);
    }
    
    stopYouTubeProgressTracking() {
        if (this.youtubeProgressInterval) {
            clearInterval(this.youtubeProgressInterval);
            this.youtubeProgressInterval = null;
        }
    }
    
    // Setup listeners for standard Web Audio
    setupWebAudioListeners() {
        this.audio.addEventListener('timeupdate', () => {
            this.currentTime = this.audio.currentTime;
            this.duration = this.audio.duration;
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.currentTime, this.duration);
            }
        });
        
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            if (this.onEnded) {
                this.onEnded();
            }
        });
        
        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            console.log('✓ Track loaded, duration:', this.duration);
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
        });
    }
    
    // Extract YouTube video ID from URL
    extractYouTubeId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    }
    
    // Load a track from URL (supports both regular audio and YouTube)
    async loadTrack(url, trackType = 'file') {
        console.log('Loading track:', url, 'Type:', trackType);
        
        // Stop any current playback
        this.pause();
        
        // Determine if this is a YouTube URL
        const youtubeId = this.extractYouTubeId(url);
        
        if (youtubeId || trackType === 'youtube') {
            return this.loadYouTubeTrack(youtubeId || url);
        } else {
            return this.loadAudioTrack(url);
        }
    }
    
    // Load YouTube track
    async loadYouTubeTrack(videoId) {
        return new Promise((resolve, reject) => {
            if (!this.youtubeReady) {
                console.warn('YouTube player not ready yet, waiting...');
                setTimeout(() => {
                    this.loadYouTubeTrack(videoId).then(resolve).catch(reject);
                }, 500);
                return;
            }
            
            try {
                // Stop other players
                if (this.useTone && this.player) {
                    this.player.stop();
                }
                if (!this.useTone && this.audio) {
                    this.audio.pause();
                }
                
                this.currentPlayerType = 'youtube';
                
                // Load the video
                this.youtubePlayer.loadVideoById({
                    videoId: videoId,
                    startSeconds: 0
                });
                
                // Set volume
                this.youtubePlayer.setVolume(this.volume * 100);
                
                console.log('✓ YouTube track loaded:', videoId);
                
                // Wait a bit for the video to load
                setTimeout(() => {
                    try {
                        this.duration = this.youtubePlayer.getDuration() || 0;
                        resolve();
                    } catch (e) {
                        resolve(); // Resolve anyway
                    }
                }, 500);
                
            } catch (error) {
                console.error('Error loading YouTube track:', error);
                reject(error);
            }
        });
    }
    
    // Load regular audio track
    async loadAudioTrack(url) {
        // Stop YouTube if playing
        if (this.currentPlayerType === 'youtube' && this.youtubePlayer) {
            this.youtubePlayer.pauseVideo();
            this.stopYouTubeProgressTracking();
        }
        
        this.currentPlayerType = 'audio';
        
        if (this.useTone) {
            return this.loadWithTone(url);
        } else {
            return this.loadWithWebAudio(url);
        }
    }
    
    // Load using Tone.js
    async loadWithTone(url) {
        return new Promise((resolve, reject) => {
            try {
                // Dispose previous player
                if (this.player) {
                    this.player.stop();
                    this.player.dispose();
                }
                
                // Create new player
                this.player = new Tone.Player({
                    url: url,
                    onload: () => {
                        this.duration = this.player.buffer.duration;
                        console.log('✓ Track loaded, duration:', this.duration);
                        resolve();
                    },
                    onerror: (err) => {
                        console.error('Tone.js load error:', err);
                        reject(err);
                    }
                }).toDestination();
                
                this.player.volume.value = Tone.gainToDb(this.volume);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Load using Web Audio API
    async loadWithWebAudio(url) {
        return new Promise((resolve, reject) => {
            this.audio.src = url;
            this.audio.load();
            
            const onCanPlay = () => {
                this.audio.removeEventListener('canplay', onCanPlay);
                resolve();
            };
            
            const onError = (err) => {
                this.audio.removeEventListener('error', onError);
                reject(err);
            };
            
            this.audio.addEventListener('canplay', onCanPlay);
            this.audio.addEventListener('error', onError);
        });
    }
    
    // Play the track
    async play() {
        if (this.currentPlayerType === 'youtube') {
            if (this.youtubePlayer && this.youtubeReady) {
                this.youtubePlayer.playVideo();
                this.isPlaying = true;
            }
        } else if (this.useTone) {
            await Tone.start();
            if (this.player && this.player.loaded) {
                this.player.start();
                this.isPlaying = true;
                this.startProgressTracking();
            }
        } else {
            try {
                await this.audio.play();
                this.isPlaying = true;
            } catch (e) {
                console.error('Play error:', e);
            }
        }
    }
    
    // Pause the track
    pause() {
        if (this.currentPlayerType === 'youtube') {
            if (this.youtubePlayer && this.youtubeReady) {
                this.youtubePlayer.pauseVideo();
                this.stopYouTubeProgressTracking();
            }
        } else if (this.useTone) {
            if (this.player) {
                this.player.stop();
            }
            this.stopProgressTracking();
        } else {
            this.audio.pause();
        }
        this.isPlaying = false;
    }
    
    // Stop and reset
    stop() {
        this.pause();
        this.seek(0);
    }
    
    // Seek to time
    seek(time) {
        if (this.currentPlayerType === 'youtube') {
            if (this.youtubePlayer && this.youtubeReady) {
                this.youtubePlayer.seekTo(time, true);
            }
        } else if (this.useTone && this.player) {
            this.player.seek(time);
        } else {
            this.audio.currentTime = time;
        }
        this.currentTime = time;
    }
    
    // Set volume (0-1)
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        
        if (this.currentPlayerType === 'youtube') {
            if (this.youtubePlayer && this.youtubeReady) {
                this.youtubePlayer.setVolume(this.volume * 100);
            }
        } else if (this.useTone && this.player) {
            this.player.volume.value = Tone.gainToDb(this.volume);
        } else {
            this.audio.volume = this.volume;
        }
    }
    
    // Progress tracking for Tone.js
    startProgressTracking() {
        if (!this.useTone) return;
        
        this.progressInterval = setInterval(() => {
            if (this.player && this.isPlaying) {
                this.currentTime = Tone.Transport.seconds;
                
                if (this.onTimeUpdate) {
                    this.onTimeUpdate(this.currentTime, this.duration);
                }
                
                // Check if ended
                if (this.currentTime >= this.duration) {
                    this.isPlaying = false;
                    this.stopProgressTracking();
                    if (this.onEnded) {
                        this.onEnded();
                    }
                }
            }
        }, 100);
    }
    
    stopProgressTracking() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
    
    // Clean up
    dispose() {
        this.pause();
        this.stopProgressTracking();
        this.stopYouTubeProgressTracking();
        
        if (this.useTone && this.player) {
            this.player.dispose();
        }
        
        if (this.youtubePlayer) {
            this.youtubePlayer.destroy();
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicPlayer;
}
