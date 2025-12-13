// ===============================
// Audio Player with Tone.js
// ===============================

class MusicPlayer {
    constructor() {
        this.player = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 0.7;
        this.onTimeUpdate = null;
        this.onEnded = null;
        
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
    
    // Load a track from URL
    async loadTrack(url) {
        console.log('Loading track:', url);
        
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
                // Store current time before disposing
                const currentTime = this.player ? Tone.Transport.seconds : 0;
                
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
            const currentTime = this.audio.currentTime || 0;
            this.audio.src = url;
            this.audio.load();
            
            const onCanPlay = () => {
                if (currentTime > 0) {
                    this.audio.currentTime = currentTime;
                }
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
        if (this.useTone) {
            await Tone.start(); // Required for Tone.js
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
        if (this.useTone) {
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
        if (this.useTone && this.player) {
            this.player.seek(time);
        } else {
            this.audio.currentTime = time;
        }
        this.currentTime = time;
    }
    
    // Set volume (0-1)
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        
        if (this.useTone && this.player) {
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
        
        if (this.useTone && this.player) {
            this.player.dispose();
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicPlayer;
}