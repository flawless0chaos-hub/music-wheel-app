// ===============================
// UI Manager Module
// ===============================

class UIManager {
    constructor() {
        this.elements = this.cacheElements();
        this.setupEventListeners();
    }
    
    cacheElements() {
        return {
            // Title and info
            songTitle: document.getElementById('songTitle'),
            lyricsText: document.getElementById('lyricsText'),
            statusBar: document.getElementById('statusBar'),
            
            // Player controls
            playBtn: document.getElementById('playBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            playIcon: document.getElementById('playIcon'),
            pauseIcon: document.getElementById('pauseIcon'),
            
            // Volume
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            
            // Style labels
            scaleLabels: document.querySelectorAll('.scale-label'),
            
            // Canvas
            canvas: document.getElementById('wheel-canvas')
        };
    }
    
    setupEventListeners() {
        // Play/Pause button
        if (this.elements.playBtn) {
            this.elements.playBtn.addEventListener('click', () => {
                if (this.onPlayPause) this.onPlayPause();
            });
        }
        
        // Previous button
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', () => {
                if (this.onPrevious) this.onPrevious();
            });
        }
        
        // Next button
        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => {
                if (this.onNext) this.onNext();
            });
        }
        
        // Volume slider
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value);
                this.updateVolumeDisplay(volume);
                if (this.onVolumeChange) this.onVolumeChange(volume);
            });
        }
        
        // Style selection
        this.elements.scaleLabels.forEach(label => {
            label.addEventListener('click', () => {
                const style = label.dataset.style;
                if (this.onStyleChange) this.onStyleChange(style);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return; // Ignore if typing
            
            switch(e.key) {
                case ' ': // Spacebar
                    e.preventDefault();
                    if (this.onPlayPause) this.onPlayPause();
                    break;
                case 'ArrowLeft':
                    if (this.onPrevious) this.onPrevious();
                    break;
                case 'ArrowRight':
                    if (this.onNext) this.onNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.changeVolume(5);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.changeVolume(-5);
                    break;
            }
        });
    }
    
    // Update song title
    updateSongTitle(title) {
        if (this.elements.songTitle) {
            this.elements.songTitle.textContent = title;
            this.elements.songTitle.classList.add('fade-in');
        }
    }
    
    // Update lyrics display
    updateLyrics(text) {
        if (this.elements.lyricsText) {
            this.elements.lyricsText.textContent = text;
        }
    }
    
    // Update status bar
    updateStatus(message, type = 'info') {
        if (this.elements.statusBar) {
            this.elements.statusBar.textContent = message;
            this.elements.statusBar.className = `status-bar status-${type}`;
        }
    }
    
    // Update play button state
    updatePlayButton(isPlaying) {
        if (this.elements.playIcon && this.elements.pauseIcon) {
            if (isPlaying) {
                this.elements.playIcon.style.display = 'none';
                this.elements.pauseIcon.style.display = 'block';
            } else {
                this.elements.playIcon.style.display = 'block';
                this.elements.pauseIcon.style.display = 'none';
            }
        }
    }
    
    // Update volume display
    updateVolumeDisplay(volume) {
        if (this.elements.volumeValue) {
            this.elements.volumeValue.textContent = `${volume}%`;
        }
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.value = volume;
        }
    }
    
    // Change volume by delta
    changeVolume(delta) {
        if (this.elements.volumeSlider) {
            const currentVolume = parseInt(this.elements.volumeSlider.value);
            const newVolume = Math.max(0, Math.min(100, currentVolume + delta));
            this.elements.volumeSlider.value = newVolume;
            this.updateVolumeDisplay(newVolume);
            if (this.onVolumeChange) this.onVolumeChange(newVolume);
        }
    }
    
    // Update active style label
    updateStyleLabels(activeStyle) {
        this.elements.scaleLabels.forEach(label => {
            if (label.dataset.style === activeStyle) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
    }
    
    // Show loading state
    showLoading(element) {
        if (element) {
            element.classList.add('loading');
        }
    }
    
    // Hide loading state
    hideLoading(element) {
        if (element) {
            element.classList.remove('loading');
        }
    }
    
    // Show notification
    showNotification(message, duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification fade-in';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(29, 169, 160, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    // Enable/disable controls
    setControlsEnabled(enabled) {
        [this.elements.playBtn, this.elements.prevBtn, this.elements.nextBtn].forEach(btn => {
            if (btn) btn.disabled = !enabled;
        });
    }
    
    // Format time for display
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}