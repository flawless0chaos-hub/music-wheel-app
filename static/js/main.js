// ===============================
// Main Application Logic
// ===============================

console.log('📜 main.js loaded');

class MusicWheelApp {
    constructor() {
        console.log('🚀 Initializing MusicWheelApp...');
        
        this.player = new MusicPlayer();
        this.canvas = new WheelCanvas(document.getElementById('wheel-canvas'));
        this.ui = new UIManager();
        
        this.albumData = null;
        this.albumStyles = [];
        this.currentTrack = null;
        this.currentStyle = null;
        this.currentSegment = null;
        this.currentAlbumName = null;
        
        this.setupCallbacks();
        this.setupUI();
        
        console.log('✅ MusicWheelApp initialized');
        
        // Load albums list
        this.loadAlbumsList().then(() => {
            console.log('✅ Albums list loaded');
        }).catch(err => {
            console.error('❌ Error loading albums:', err);
        });
    }
    
    setupUI() {
        console.log('🔧 Setting up UI...');
        
        // Load Album button
        const loadAlbumBtn = document.getElementById('loadAlbumBtn');
        const dropdown = document.getElementById('albumDropdown');
        
        console.log('📍 Elements found:', {
            loadAlbumBtn: !!loadAlbumBtn,
            dropdown: !!dropdown
        });
        
        if (loadAlbumBtn) {
            console.log('✅ Adding click listener to Load Album button');
            loadAlbumBtn.addEventListener('click', async () => {
                console.log('🖱️ Load Album clicked!');
                const selectedAlbum = dropdown.value;
                console.log('📋 Selected album:', selectedAlbum);
                
                if (selectedAlbum) {
                    loadAlbumBtn.disabled = true;
                    loadAlbumBtn.classList.add('loading');
                    await this.loadAlbumData(selectedAlbum);
                    loadAlbumBtn.disabled = false;
                    loadAlbumBtn.classList.remove('loading');
                } else {
                    alert('Please select an album first!');
                }
            });
        } else {
            console.error('❌ loadAlbumBtn not found!');
        }
        
        // Center play button
        const centerPlayBtn = document.getElementById('centerPlayBtn');
        if (centerPlayBtn) {
            console.log('✅ Adding click listener to center play button');
            centerPlayBtn.addEventListener('click', () => {
                console.log('🖱️ Center play clicked!');
                this.togglePlayPause();
            });
        }
        
        // Lyrics box click - open full lyrics
        const lyricsBox = document.getElementById('lyricsBox');
        const lyricsOverlay = document.getElementById('lyricsOverlay');
        const lyricsClose = document.getElementById('lyricsClose');
        
        if (lyricsBox) {
            lyricsBox.addEventListener('click', () => {
                if (lyricsOverlay) lyricsOverlay.classList.add('visible');
            });
            lyricsBox.style.cursor = 'pointer';
        }
        
        if (lyricsClose) {
            lyricsClose.addEventListener('click', () => {
                lyricsOverlay.classList.remove('visible');
            });
        }
        
        // Action buttons
        const likeBtn = document.getElementById('likeBtn');
        const commentBtn = document.getElementById('commentBtn');
        const spotifyBtn = document.getElementById('spotifyBtn');
        
        // Toggle buttons
        const styleToggle = document.getElementById('styleToggle');
        const volumeToggle = document.getElementById('volumeToggle');
        const bottomSection = document.getElementById('bottomSection');
        const volumeControl = document.getElementById('volumeControl');
        
        if (styleToggle && bottomSection) {
            styleToggle.addEventListener('click', () => {
                bottomSection.classList.toggle('open');
            });
        }
        
        if (volumeToggle && volumeControl) {
            volumeToggle.addEventListener('click', () => {
                volumeControl.classList.toggle('open');
            });
        }
        
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                console.log('❤️ Like clicked');
                alert('אהבתי!');
            });
        }
        
        if (commentBtn) {
            commentBtn.addEventListener('click', () => {
                console.log('💬 Comment clicked');
                alert('תגובה בקרוב!');
            });
        }
        
        if (spotifyBtn) {
            spotifyBtn.addEventListener('click', () => {
                console.log('🎵 Spotify clicked');
                alert('Spotify integration coming soon!');
            });
        }
        
        // Generate radial grid
        this.generateRadialGrid();
        
        // Volume control
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        
        if (volumeSlider) {
            console.log('✅ Adding volume control listener');
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value);
                console.log('🔊 Volume changed:', volume);
                if (volumeValue) {
                    volumeValue.textContent = volume + '%';
                }
                this.setVolume(volume);
            });
        }
        
        console.log('✅ UI setup complete');
    }
    
    generateRadialGrid() {
        const grid = document.getElementById('radialGrid');
        if (!grid) return;
        
        const numLines = 24;  // More lines for infinity effect
        
        for (let i = 0; i < numLines; i++) {
            const line = document.createElement('div');
            line.className = 'radial-line';
            const angle = (i * 360 / numLines);
            line.style.transform = `rotate(${angle}deg)`;
            
            // Random delay for each line
            const randomDelay = Math.random() * 2;
            line.style.animationDelay = `${randomDelay}s, ${randomDelay + 1.5}s`;
            
            grid.appendChild(line);
        }
    }
    
    setupCallbacks() {
        // Canvas callbacks
        this.canvas.onPointClick = (segment, style, track) => {
            this.playTrack(segment, style, track);
        };
        
        // UI callbacks
        this.ui.onPlayPause = () => this.togglePlayPause();
        this.ui.onPrevious = () => this.previousTrack();
        this.ui.onNext = () => this.nextTrack();
        this.ui.onVolumeChange = (volume) => this.setVolume(volume);
        this.ui.onStyleChange = (style) => this.switchStyle(style);
        
        // Player callbacks
        this.player.onTimeUpdate = (current, duration) => {
            // Update progress visualization if needed
        };
        
        this.player.onEnded = () => {
            this.nextTrack();
        };
    }
    
    async loadAlbumsList() {
        const dropdown = document.getElementById('albumDropdown');
        
        try {
            this.ui.updateStatus('Loading albums...');
            console.log('📡 Fetching albums list...');
            
            const response = await fetch('/api/albums/list');
            const result = await response.json();
            
            if (result.status === 'success' && result.albums.length > 0) {
                console.log('📋 Albums available:', result.albums);
                
                // Populate dropdown
                dropdown.innerHTML = '<option value="">Select an album...</option>' +
                    result.albums.map(name => `<option value="${name}">${name}</option>`).join('');
                
                this.ui.updateStatus('✅ Ready - Select an album');
            } else {
                console.warn('⚠️ No albums found');
                this.ui.updateStatus('⚠️ No albums found', 'error');
                dropdown.innerHTML = '<option value="">No albums available</option>';
            }
        } catch (error) {
            console.error('❌ Error loading albums:', error);
            this.ui.updateStatus('Error loading albums', 'error');
            dropdown.innerHTML = '<option value="">Error loading albums</option>';
        }
    }
    
    async loadAlbumData(albumName) {
        try {
            this.ui.updateStatus('טוען אלבום...');
            
            console.log(`📖 Loading album: ${albumName}`);
            
            const response = await fetch(`/api/album/load?album=${albumName}`);
            const result = await response.json();
            
            if (result.status === 'success') {
                const albumJson = result.data;
                
                console.log('✅ Album JSON loaded:', albumJson.albumName);
                console.log('📊 Raw tracks:', Object.keys(albumJson.tracks || {}).length);
                
                // ✅ Extract album styles - PRIORITIZE styles from JSON, fallback to track styles
                if (albumJson.styles && albumJson.styles.length > 0) {
                    console.log('✅ Using styles from album_metadata.json');
                    this.albumStyles = albumJson.styles.map(s => ({
                        key: s.key,
                        name: s.name,
                        color: s.color
                    }));
                } else {
                    console.log('⚠️  No album_metadata.json, extracting from tracks');
                    this.albumStyles = this.extractAlbumStyles(albumJson);
                }
                
                console.log('🎨 Album styles:', this.albumStyles);
                
                // ✅ Update CONFIG dynamically
                this.updateConfigWithAlbumStyles(this.albumStyles);
                
                // ✅ Convert album data
                this.albumData = this.convertAlbumData(albumJson);
                
                // ✅ Update canvas with dynamic config
                this.canvas.setAlbumData(this.albumData, this.albumStyles.length, Object.keys(this.albumData.tracks).length);
                
                // ✅ Show album name + artist
                this.showAlbumInfo(albumJson.albumName, albumJson.artist);
                
                // ✅ Render style dots
                this.renderStyleDots();
                
                // Set first style as active
                if (this.albumStyles.length > 0) {
                    this.currentStyle = Object.keys(CONFIG.styles)[0];
                }
                
                console.log('✅ Converted tracks:', Object.keys(this.albumData.tracks).length);
                
                if (Object.keys(this.albumData.tracks).length > 0) {
                    this.ui.updateStatus('לחץ על נקודה כדי להתחיל');
                } else {
                    this.ui.updateStatus('אין שירים באלבום - העלה שירים דרך דף ההעלאה');
                }
            } else {
                console.error('❌ Failed to load album:', result.message);
                this.ui.updateStatus('האלבום עדיין לא קיים - צור אותו דרך דף ההעלאה', 'error');
            }
        } catch (error) {
            console.error('❌ Error loading album:', error);
            this.ui.updateStatus('שגיאת חיבור לשרת - ודא ש-Flask רץ', 'error');
        }
    }
    
    extractAlbumStyles(albumJson) {
        const firstTrack = Object.values(albumJson.tracks || {})[0];
        if (!firstTrack || !firstTrack.styles) {
            return [];
        }
        
        const styleKeys = Object.keys(firstTrack.styles);
        const defaultColors = ['#d13b3b', '#9b3480', '#513c99', '#2373a1', '#1da9a0'];
        
        return styleKeys.map((key, idx) => ({
            key: key,
            name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            color: defaultColors[idx % defaultColors.length]
        }));
    }
    
    updateConfigWithAlbumStyles(styles) {
        CONFIG.styles = {};
        
        // Read radii from CONFIG - single source of truth!
        const baseRadii = CONFIG.defaultRadii;
        const mobileRadii = CONFIG.defaultMobileRadii;
        
        styles.forEach((style, idx) => {
            CONFIG.styles[style.key] = {
                color: style.color,
                radius: baseRadii[idx % baseRadii.length],
                mobileRadius: mobileRadii[idx % mobileRadii.length],
                name: style.name
            };
        });
        
        console.log('✅ CONFIG.styles updated:', CONFIG.styles);
        
        // ✅ CRITICAL: Force canvas redraw with new config
        this.canvas.draw();
    }
    
    convertAlbumData(albumJson) {
        const converted = { tracks: {} };
        
        Object.entries(albumJson.tracks || {}).forEach(([segmentStr, trackData]) => {
            const segment = parseInt(segmentStr);
            
            converted.tracks[segment] = {
                number: trackData.number || segment,
                name: trackData.name || `Track ${segment}`,
                artist: trackData.artist || 'Unknown Artist',
                icon: trackData.icon || '🎵',
                styles: {}
            };
            
            Object.entries(trackData.styles || {}).forEach(([styleKey, styleData]) => {
                // Support both regular URL and YouTube
                if (styleData.url || styleData.youtube_id) {
                    converted.tracks[segment].styles[styleKey] = {
                        url: styleData.url || null,
                        youtube_id: styleData.youtube_id || null,
                        audio_type: styleData.audio_type || 'file',
                        lyrics_url: styleData.lyrics_url || null
                    };
                }
            });
        });
        
        return converted;
    }
    
    showAlbumInfo(albumName, artist) {
        this.currentAlbumName = albumName;
        
        const infoGrid = document.getElementById('infoGrid');
        const bottomRow = document.getElementById('bottomRow');
        const albumNameValue = document.getElementById('albumNameValue');
        
        // Show album name
        if (albumNameValue) {
            albumNameValue.textContent = albumName;
        }
        
        // Show info sections
        if (infoGrid) infoGrid.classList.add('visible');
        if (bottomRow) bottomRow.classList.add('visible');
    }
    
    renderStyleDots() {
        const container = document.getElementById('styleDots');
        if (!container) return;
        
        container.innerHTML = this.albumStyles.map((style, idx) => `
            <div class="style-dot" data-style="${style.key}">
                <div class="style-circle" style="background: ${style.color};">
                    <span class="style-label">${style.name}</span>
                </div>
            </div>
        `).join('');
        
        // Add click listeners to style dots
        document.querySelectorAll('.style-dot').forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                const styleKey = this.albumStyles[idx].key;
                this.switchStyle(styleKey);
            });
        });
        
        console.log('✅ Style legend rendered');
    }
    
    async playTrack(segment, style, track) {
        console.log(`▶️  Playing: Segment ${segment}, Style ${style}`);
        
        const trackData = this.albumData.tracks[segment];
        if (!trackData) return;
        
        const styleData = trackData.styles[style];
        if (!styleData || !styleData.url) return;
        
        this.currentSegment = segment;
        this.currentStyle = style;
        this.currentTrack = trackData;
        
        // Update 5 boxes
        document.getElementById('trackNameValue').textContent = trackData.name || '-';
        document.getElementById('styleValue').textContent = CONFIG.styles[style]?.name || style;
        document.getElementById('artistNameValue').textContent = trackData.artist || '-';
        document.getElementById('durationValue').textContent = '3:45'; // TODO: Get real duration
        
        // Update lyrics preview
        const lyricsPreview = document.getElementById('lyricsPreview');
        if (styleData.lyrics_url) {
            await this.loadLyrics(styleData.lyrics_url);
            const lyricsText = document.getElementById('lyricsText').textContent;
            if (lyricsPreview) {
                lyricsPreview.textContent = lyricsText.substring(0, 200) + '...';
            }
        } else {
            if (lyricsPreview) lyricsPreview.textContent = 'אין מילים זמינות...';
        }
        
        // Update canvas
        this.canvas.setCurrentSegment(segment);
        this.canvas.setCurrentStyle(style);
        
        // Update style dots
        document.querySelectorAll('.style-dot').forEach(dot => {
            dot.classList.toggle('active', dot.dataset.style === style);
        });
        
        // Play audio
        try {
            if (styleData.audio_type === 'youtube' && styleData.youtube_id) {
                console.log('🎬 Playing YouTube:', styleData.youtube_id);
                await this.player.loadYouTube(styleData.youtube_id);
            } else if (styleData.url) {
                // Use proxy for R2 files to avoid CORS
                const audioUrl = styleData.url.includes('r2.dev') 
                    ? `/api/proxy/audio?url=${encodeURIComponent(styleData.url)}`
                    : styleData.url;
                console.log('🎵 Playing file:', audioUrl);
                await this.player.loadTrack(audioUrl);
            } else {
                console.error('❌ No audio source available');
                this.ui.updateStatus('אין קובץ אודיו זמין', 'error');
                return;
            }
            
            await this.player.play();
            this.updatePlayButton(true);
        } catch (error) {
            console.error('Error playing:', error);
            this.ui.updateStatus('שגיאה בהשמעה', 'error');
        }
    }
    
    async switchStyle(newStyle) {
        if (!this.currentSegment || newStyle === this.currentStyle) return;
        
        const trackData = this.albumData.tracks[this.currentSegment];
        if (!trackData || !trackData.styles[newStyle]) {
            this.ui.updateStatus('No audio for this style', 'error');
            return;
        }
        
        const currentTime = this.player.currentTime;
        const wasPlaying = this.player.isPlaying;
        
        this.currentStyle = newStyle;
        this.canvas.setCurrentStyle(newStyle);
        
        // Update active style dot
        document.querySelectorAll('.style-dot').forEach(dot => {
            dot.classList.toggle('active', dot.dataset.style === newStyle);
        });
        
        // Update style value in info box
        document.getElementById('styleValue').textContent = CONFIG.styles[newStyle]?.name || newStyle;
        
        const styleData = trackData.styles[newStyle];
        
        try {
            if (styleData.audio_type === 'youtube' && styleData.youtube_id) {
                console.log('🎬 Switching to YouTube:', styleData.youtube_id);
                await this.player.loadYouTube(styleData.youtube_id);
            } else if (styleData.url) {
                // Use proxy for R2 files to avoid CORS
                const audioUrl = styleData.url.includes('r2.dev') 
                    ? `/api/proxy/audio?url=${encodeURIComponent(styleData.url)}`
                    : styleData.url;
                console.log('🎵 Switching to file:', audioUrl);
                await this.player.loadTrack(audioUrl);
            }
            
            this.player.seek(currentTime);
            
            if (wasPlaying) {
                await this.player.play();
            }
            
            // Update lyrics
            const lyricsBtnCenter = document.getElementById('lyricsBtnCenter');
            if (styleData.lyrics_url) {
                this.loadLyrics(styleData.lyrics_url);
                if (lyricsBtnCenter) lyricsBtnCenter.classList.add('visible');
            } else {
                document.getElementById('lyricsText').textContent = 'No lyrics available';
                if (lyricsBtnCenter) lyricsBtnCenter.classList.remove('visible');
            }
        } catch (error) {
            console.error('Error switching style:', error);
            this.ui.updateStatus('Error switching style', 'error');
        }
    }
    
    async loadLyrics(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            const lyricsText = document.getElementById('lyricsText');
            if (lyricsText) {
                lyricsText.textContent = text;
            }
        } catch (error) {
            console.error('Error loading lyrics:', error);
            const lyricsText = document.getElementById('lyricsText');
            if (lyricsText) {
                lyricsText.textContent = 'Failed to load lyrics';
            }
        }
    }
    
    updatePlayButton(isPlaying) {
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        const centerBtn = document.getElementById('centerPlayBtn');
        
        if (playIcon && pauseIcon) {
            if (isPlaying) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
                if (centerBtn) centerBtn.classList.add('playing');
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
                if (centerBtn) centerBtn.classList.remove('playing');
            }
        }
    }
    
    togglePlayPause() {
        if (!this.currentTrack) {
            this.ui.updateStatus('Select a track first', 'error');
            return;
        }
        
        if (this.player.isPlaying) {
            this.player.pause();
            this.updatePlayButton(false);
            this.ui.updateStatus('Paused');
        } else {
            this.player.play();
            this.updatePlayButton(true);
            this.ui.updateStatus('Playing...');
        }
    }
    
    previousTrack() {
        if (!this.albumData || !this.currentSegment) return;
        
        const segments = Object.keys(this.albumData.tracks).map(Number).sort((a, b) => a - b);
        const currentIndex = segments.indexOf(this.currentSegment);
        
        if (currentIndex > 0) {
            const prevSegment = segments[currentIndex - 1];
            this.playTrack(prevSegment, this.currentStyle, this.albumData.tracks[prevSegment]);
        }
    }
    
    nextTrack() {
        if (!this.albumData || !this.currentSegment) return;
        
        const segments = Object.keys(this.albumData.tracks).map(Number).sort((a, b) => a - b);
        const currentIndex = segments.indexOf(this.currentSegment);
        
        if (currentIndex < segments.length - 1) {
            const nextSegment = segments[currentIndex + 1];
            this.playTrack(nextSegment, this.currentStyle, this.albumData.tracks[nextSegment]);
        }
    }
    
    setVolume(volume) {
        this.player.setVolume(volume / 100);
    }
}

// Initialize app when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Initializing app...');
        window.app = new MusicWheelApp();
    });
} else {
    console.log('🚀 Initializing app...');
    window.app = new MusicWheelApp();
}