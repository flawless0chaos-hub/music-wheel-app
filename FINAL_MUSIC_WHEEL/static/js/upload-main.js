// ===============================
// Upload Manager - Main Logic  
// ===============================

const uploadManager = {
    ui: new UploadUI(),
    storage: new UploadStorage(),
    
    currentStage: 'initial',
    totalTracksCount: 8,
    stylesCount: 5, // NEW: Dynamic styles count
    useTransitions: false, // NEW: Transitions toggle
    styles: [
        { name: 'Rock', color: '#d13b3b' },
        { name: 'Funk', color: '#9b3480' },
        { name: 'Hip Hop', color: '#513c99' },
        { name: 'Blues', color: '#2373a1' },
        { name: 'Theatrical', color: '#1da9a0' }
    ],
    currentTrackIndex: 0,
    currentElement: null,
    currentUploadMode: 'file', // NEW: 'file' or 'youtube'
    uploadedFiles: {},
    tracks: {},
    currentAlbumId: null,
    
    init() {
        // Initialize API with UI reference for progress tracking
        this.api = new UploadAPI(this.ui);
        this.setupEventListeners();
        this.loadSavedAlbums();
    },
    
    setupEventListeners() {
        document.getElementById('newAlbumCard').addEventListener('click', () => this.selectOption('new'));
        document.getElementById('existingAlbumCard').addEventListener('click', () => this.selectOption('existing'));
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextStage());
        document.getElementById('decreaseBtn').addEventListener('click', () => this.changeTrackCount(-1));
        document.getElementById('increaseBtn').addEventListener('click', () => this.changeTrackCount(1));
        document.getElementById('decreaseStylesBtn').addEventListener('click', () => this.changeStylesCount(-1));
        document.getElementById('increaseStylesBtn').addEventListener('click', () => this.changeStylesCount(1));
        document.getElementById('prevBtn').addEventListener('click', () => this.prevTrack());
        document.getElementById('nextTrackBtn').addEventListener('click', () => this.nextTrack());
        document.getElementById('iconUploadBtn').addEventListener('click', () => document.getElementById('iconInput').click());
        document.getElementById('iconInput').addEventListener('change', (e) => this.previewIcon(e));
        document.getElementById('fileDropZone').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('fileTabBtn').addEventListener('click', () => this.switchUploadMode('file'));
        document.getElementById('youtubeTabBtn').addEventListener('click', () => this.switchUploadMode('youtube'));
        document.getElementById('cancelBtn').addEventListener('click', () => this.ui.hideModal('uploadModal'));
        document.getElementById('confirmBtn').addEventListener('click', () => this.confirmUpload());
        document.getElementById('cancelAlbumBtn').addEventListener('click', () => this.ui.hideModal('selectAlbumModal'));
        
        // Style inputs listeners
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('style-input')) {
                const idx = parseInt(e.target.dataset.styleIndex);
                this.styles[idx].name = e.target.value;
            }
            if (e.target.classList.contains('color-picker')) {
                const idx = parseInt(e.target.dataset.styleIndex);
                this.styles[idx].color = e.target.value;
                this.ui.generateStyleInputs(this.styles, document.getElementById('styleList'));
            }
        });
        
        // Song/Artist inputs
        document.getElementById('songName').addEventListener('input', (e) => {
            if (!this.tracks[this.currentTrackIndex + 1]) {
                this.tracks[this.currentTrackIndex + 1] = { files: {} };
            }
            this.tracks[this.currentTrackIndex + 1].name = e.target.value;
        });
        
        document.getElementById('artistName').addEventListener('input', (e) => {
            if (!this.tracks[this.currentTrackIndex + 1]) {
                this.tracks[this.currentTrackIndex + 1] = { files: {} };
            }
            this.tracks[this.currentTrackIndex + 1].artist = e.target.value;
        });
    },
    
    selectOption(option) {
        if (option === 'new') {
            this.currentStage = 'setup';
            this.ui.showStage('setup');
            document.getElementById('backBtn').style.display = 'block';
            this.ui.generateStyleInputs(this.styles, document.getElementById('styleList'));
        } else {
            this.openSelectAlbumModal();
        }
    },
    
    async openSelectAlbumModal() {
        const list = document.getElementById('albumList');
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">Loading albums...</div>';
        
        this.ui.showModal('selectAlbumModal');
        
        // ✅ Show progress bar
        this.ui.showProgressModal('Loading Albums');
        this.ui.updateProgress(0, 1, 'Fetching album list from Google Drive...');
        
        try {
            const response = await fetch('/api/albums/list');
            const result = await response.json();
            
            // ✅ Hide progress bar
            this.ui.hideProgressModal();
            
            if (!result.albums || result.albums.length === 0) {
                list.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">No albums found in Drive</div>';
            } else {
                list.innerHTML = result.albums.map(albumName => `
                    <div class="album-item" data-album-name="${albumName}" style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1; cursor: pointer;" class="album-clickable">
                            <div class="album-item-name">${albumName}</div>
                            <div class="album-item-info">Saved in Google Drive</div>
                        </div>
                        <button class="btn btn-secondary delete-album-btn" data-album="${albumName}" style="background: rgba(255,0,0,0.2); border-color: rgba(255,0,0,0.4); color: #ff4444; padding: 8px 16px;">
                            🗑️ Delete
                        </button>
                    </div>
                `).join('');
                
                // Add click listeners for loading albums
                document.querySelectorAll('.album-clickable').forEach(item => {
                    const albumName = item.closest('.album-item').dataset.albumName;
                    item.addEventListener('click', () => this.loadAlbum(albumName));
                });
                
                // Add click listeners for delete buttons
                document.querySelectorAll('.delete-album-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteAlbum(btn.dataset.album);
                    });
                });
            }
        } catch (error) {
            console.error('Error loading albums:', error);
            this.ui.hideProgressModal();
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">Error loading albums</div>';
        }
    },
    
    async loadAlbum(albumName) {
        // ✅ Show progress bar
        this.ui.showProgressModal('Loading Album');
        this.ui.updateProgress(0, 1, `Loading "${albumName}" from Google Drive...`);
        
        try {
            const response = await fetch(`/api/album/load?album=${albumName}`);
            const result = await response.json();
            
            // ✅ Hide progress bar
            this.ui.hideProgressModal();
            
            if (result.status !== 'success') {
                alert('Failed to load album');
                return;
            }
            
            const albumData = result.data;
            
            // Extract styles from first track
            const firstTrack = Object.values(albumData.tracks || {})[0];
            if (firstTrack && firstTrack.styles) {
                const styleKeys = Object.keys(firstTrack.styles);
                const defaultColors = ['#d13b3b', '#9b3480', '#513c99', '#2373a1', '#1da9a0'];
                
                this.styles = styleKeys.map((key, idx) => ({
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    color: defaultColors[idx % defaultColors.length]
                }));
            }
            
            document.getElementById('albumName').value = albumData.albumName || albumName;
            this.totalTracksCount = Object.keys(albumData.tracks || {}).length;
            
            // Convert tracks to manager format
            this.tracks = {};
            Object.entries(albumData.tracks || {}).forEach(([trackNum, trackData]) => {
                this.tracks[parseInt(trackNum)] = {
                    name: trackData.name || '',
                    artist: trackData.artist || '',
                    files: {}
                };
            });

            this.ui.hideModal('selectAlbumModal');
            this.currentStage = 'manager';
            this.ui.showStage('manager');
            document.getElementById('backBtn').style.display = 'block';
            document.getElementById('nextBtn').textContent = 'Save All';
            
            this.generateFilesTable();
            this.updateNavigationButtons();
            document.getElementById('totalTracks').textContent = this.totalTracksCount;
            
        } catch (error) {
            console.error('Error loading album:', error);
            this.ui.hideProgressModal();
            alert('Failed to load album: ' + error.message);
        }
    },
    
    loadSavedAlbums() {
        // Albums loaded via storage class
    },
    
    async deleteAlbum(albumName) {
        const confirmed = confirm(`Are you sure you want to delete "${albumName}"?\n\nThis action cannot be undone!`);
        if (!confirmed) return;
        
        try {
            this.ui.showProgressModal('Deleting Album');
            this.ui.updateProgress(0, 1, `Deleting "${albumName}"...`);
            
            const response = await fetch('/api/album/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ album: albumName })
            });
            
            const result = await response.json();
            
            this.ui.hideProgressModal();
            
            if (result.status === 'success') {
                alert(`✅ Album "${albumName}" deleted successfully!`);
                // Reload the album list
                this.openSelectAlbumModal();
            } else {
                alert(`❌ Failed to delete album: ${result.message}`);
            }
        } catch (error) {
            console.error('Error deleting album:', error);
            this.ui.hideProgressModal();
            alert(`❌ Error deleting album: ${error.message}`);
        }
    },
    
    changeTrackCount(delta) {
        const newCount = this.totalTracksCount + delta;
        if (newCount >= 1 && newCount <= 16) {
            this.totalTracksCount = newCount;
            document.getElementById('trackCount').textContent = this.totalTracksCount;
        }
    },
    
    changeStylesCount(delta) {
        const newCount = Math.max(3, Math.min(15, this.stylesCount + delta));
        if (newCount !== this.stylesCount) {
            this.stylesCount = newCount;
            document.getElementById('styleCount').textContent = this.stylesCount;
            this.updateStyles();
        }
    },
    
    updateStyles() {
        const defaultColors = [
            '#d13b3b', '#9b3480', '#513c99', '#2373a1', '#1da9a0',
            '#25a56a', '#c6a527', '#d96c27', '#c73a63', '#7c4199',
            '#3498db', '#e74c3c', '#9b59b6', '#1abc9c', '#f39c12'
        ];
        const styleNames = ['Rock', 'Funk', 'Hip Hop', 'Blues', 'Jazz', 'Pop', 'Reggae', 'Metal', 'Classical', 'Electronic', 'Country', 'Soul', 'R&B', 'Indie', 'Dance'];
        
        // Adjust styles array
        while (this.styles.length < this.stylesCount) {
            const idx = this.styles.length;
            this.styles.push({
                name: styleNames[idx] || `Style ${idx + 1}`,
                color: defaultColors[idx % defaultColors.length]
            });
        }
        while (this.styles.length > this.stylesCount) {
            this.styles.pop();
        }
        
        this.ui.generateStyleInputs(this.styles, document.getElementById('styleList'));
    },
    
    switchUploadMode(mode) {
        this.currentUploadMode = mode;
        const fileTab = document.getElementById('fileTabBtn');
        const youtubeTab = document.getElementById('youtubeTabBtn');
        const fileOption = document.getElementById('fileUploadOption');
        const youtubeOption = document.getElementById('youtubeOption');
        
        if (mode === 'file') {
            fileTab.style.background = 'rgba(255,20,147,0.2)';
            fileTab.style.borderColor = '#ff1493';
            youtubeTab.style.background = 'rgba(255,255,255,0.05)';
            youtubeTab.style.borderColor = 'rgba(255,255,255,0.1)';
            fileOption.style.display = 'block';
            youtubeOption.style.display = 'none';
        } else {
            youtubeTab.style.background = 'rgba(255,20,147,0.2)';
            youtubeTab.style.borderColor = '#ff1493';
            fileTab.style.background = 'rgba(255,255,255,0.05)';
            fileTab.style.borderColor = 'rgba(255,255,255,0.1)';
            fileOption.style.display = 'none';
            youtubeOption.style.display = 'block';
        }
    },
    
    async nextStage() {
        if (this.currentStage === 'setup') {
            const albumName = document.getElementById('albumName').value.trim();
            if (!albumName) {
                alert('Please enter an album name');
                return;
            }

            const hasEmptyNames = this.styles.some(s => !s.name.trim());
            if (hasEmptyNames) {
                alert('Please fill in all style names');
                return;
            }

            // Initialize album on server
            console.log('🎵 Initializing album on server...');
            this.useTransitions = document.getElementById('useTransitions').checked;
            const result = await this.api.initializeAlbum(albumName, this.totalTracksCount, this.styles, this.useTransitions);
            
            if (!result.success) {
                alert('Failed to initialize album: ' + result.error);
                return;
            }

            this.currentStage = 'manager';
            this.ui.showStage('manager');
            document.getElementById('nextBtn').textContent = 'Save All';
            
            this.generateFilesTable();
            this.updateNavigationButtons();
            document.getElementById('totalTracks').textContent = this.totalTracksCount;
            
        } else if (this.currentStage === 'manager') {
            await this.saveAll();
        }
    },
    
    goBack() {
        if (this.currentStage === 'manager') {
            this.currentStage = 'setup';
            this.ui.showStage('setup');
            document.getElementById('nextBtn').textContent = 'Next';
            this.ui.generateStyleInputs(this.styles, document.getElementById('styleList'));
        } else if (this.currentStage === 'setup') {
            this.currentStage = 'initial';
            this.ui.showStage('initial');
            document.getElementById('backBtn').style.display = 'none';
        }
    },
    
    // ✅ NEW: Generate files table
    generateFilesTable() {
        const tableBody = document.getElementById('filesTableBody');
        
        if (!tableBody) {
            console.error('❌ filesTableBody not found');
            return;
        }
        
        // ✅ Use new table generation
        this.ui.generateFilesTable(tableBody, this.styles, this.currentTrackIndex, this.uploadedFiles);
        
        // ✅ Add click listeners to upload buttons
        document.querySelectorAll('.upload-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const type = btn.dataset.type;
                const idx = parseInt(btn.dataset.idx);
                const uploadType = btn.dataset.upload;
                const style = this.styles[idx];
                
                this.openUploadModal(type, idx, uploadType, style.name, style.color);
            });
        });
    },
    
    openUploadModal(type, styleIdx, uploadType, styleName, styleColor) {
        this.currentElement = { type, styleIdx, uploadType, styleName, styleColor };

        const subtitle = document.getElementById('modalSubtitle');
        const icon = document.getElementById('modalIcon');
        const text = document.getElementById('modalText');
        const fileInput = document.getElementById('fileInput');

        subtitle.textContent = `Track ${this.currentTrackIndex + 1} - ${styleName} ${type === 'track' ? 'Track' : 'Transition'}`;

        if (uploadType === 'mp3') {
            icon.textContent = '🎵';
            text.textContent = 'Click to upload MP3';
            fileInput.accept = '.mp3,audio/mpeg';
        } else if (uploadType === 'lyrics') {
            icon.textContent = '📝';
            text.textContent = 'Click to upload Lyrics (TXT)';
            fileInput.accept = '.txt,text/plain';
        }

        const key = `track${this.currentTrackIndex + 1}-${type}-${styleIdx}-${uploadType}`;
        if (this.uploadedFiles[key]) {
            document.getElementById('fileName').textContent = this.uploadedFiles[key].name;
        } else {
            document.getElementById('fileName').textContent = '';
        }

        fileInput.value = '';
        this.ui.showModal('uploadModal');
    },
    
    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('fileName').textContent = file.name;
        }
    },
    
    confirmUpload() {
        if (!this.currentElement) return;

        // Handle YouTube upload
        if (this.currentUploadMode === 'youtube') {
            const youtubeUrl = document.getElementById('youtubeInput').value.trim();
            if (!youtubeUrl) {
                alert('Please enter a YouTube URL');
                return;
            }
            
            const { type, styleIdx, uploadType } = this.currentElement;
            const key = `track${this.currentTrackIndex + 1}-${type}-${styleIdx}-${uploadType}`;
            
            // Store YouTube URL
            this.uploadedFiles[key] = { youtube: youtubeUrl, name: 'YouTube Link' };
            
            const trackNum = this.currentTrackIndex + 1;
            if (!this.tracks[trackNum]) {
                this.tracks[trackNum] = { files: {} };
            }
            if (!this.tracks[trackNum].files) {
                this.tracks[trackNum].files = {};
            }
            
            this.tracks[trackNum].files[key] = { youtube: youtubeUrl };
            
            console.log(`✅ YouTube link added: ${youtubeUrl} → ${key}`);
            
            this.ui.hideModal('uploadModal');
            this.currentElement = null;
            document.getElementById('youtubeInput').value = '';
            this.generateFilesTable();
            return;
        }

        // Handle file upload
        const file = document.getElementById('fileInput').files[0];
        if (!file) {
            alert('Please select a file');
            return;
        }

        const { type, styleIdx, uploadType } = this.currentElement;
        const key = `track${this.currentTrackIndex + 1}-${type}-${styleIdx}-${uploadType}`;

        // ✅ FIX: Store file properly
        this.uploadedFiles[key] = file;
        
        // Store in tracks object
        const trackNum = this.currentTrackIndex + 1;
        if (!this.tracks[trackNum]) {
            this.tracks[trackNum] = { files: {} };
        }
        if (!this.tracks[trackNum].files) {
            this.tracks[trackNum].files = {};
        }
        
        // ✅ FIX: Use proper key structure
        this.tracks[trackNum].files[key] = file;

        console.log(`✅ File added: ${file.name} → ${key}`);
        console.log(`📁 Track ${trackNum} files:`, Object.keys(this.tracks[trackNum].files));

        this.ui.hideModal('uploadModal');
        this.currentElement = null;
        this.generateFilesTable();
    },
    
    prevTrack() {
        if (this.currentTrackIndex > 0) {
            this.currentTrackIndex--;
            this.updateTrackDisplay();
        }
    },
    
    nextTrack() {
        if (this.currentTrackIndex < this.totalTracksCount - 1) {
            this.currentTrackIndex++;
            this.updateTrackDisplay();
        }
    },
    
    updateTrackDisplay() {
        document.getElementById('currentTrack').textContent = this.currentTrackIndex + 1;
        
        // Update song/artist fields
        const track = this.tracks[this.currentTrackIndex + 1] || {};
        document.getElementById('songName').value = track.name || '';
        document.getElementById('artistName').value = track.artist || '';
        
        // Update icon preview
        const iconPreview = document.getElementById('iconPreview');
        if (track.icon) {
            const reader = new FileReader();
            reader.onload = (e) => {
                iconPreview.innerHTML = `<img src="${e.target.result}">`;
            };
            reader.readAsDataURL(track.icon);
        } else {
            iconPreview.innerHTML = '🎵';
        }
        
        this.updateNavigationButtons();
        this.generateFilesTable();
    },
    
    updateNavigationButtons() {
        document.getElementById('prevBtn').disabled = this.currentTrackIndex === 0;
        document.getElementById('nextTrackBtn').disabled = this.currentTrackIndex >= this.totalTracksCount - 1;
    },
    
    previewIcon(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('iconPreview').innerHTML = `<img src="${event.target.result}">`;
            };
            reader.readAsDataURL(file);
            
            // Store icon
            const trackNum = this.currentTrackIndex + 1;
            if (!this.tracks[trackNum]) {
                this.tracks[trackNum] = { files: {} };
            }
            this.tracks[trackNum].icon = file;
        }
    },
    
    async saveAll() {
        const albumName = document.getElementById('albumName').value.trim();
        
        if (!albumName) {
            alert('Please enter an album name');
            return;
        }

        console.log('\n🚀 Starting full upload to server...');
        console.log('📊 Tracks to upload:', this.tracks);

        const results = await this.api.uploadAllTracks(albumName, this.totalTracksCount, this.tracks, this.styles);
        
        const successCount = results.filter(r => r.result && r.result.status === 'success').length;
        const tracksWithData = Object.keys(this.tracks).length;
        
        if (successCount === tracksWithData && tracksWithData > 0) {
            alert(`✅ Album "${albumName}" saved successfully!\n${successCount} tracks uploaded to Google Drive.`);
        } else if (successCount > 0) {
            alert(`✅ Partial upload complete!\n${successCount} tracks uploaded successfully.\n${tracksWithData - successCount} tracks had no files.`);
        } else {
            alert(`⚠️ No tracks were uploaded. Make sure to add files to at least one track.`);
        }
    }
};

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => uploadManager.init());
} else {
    uploadManager.init();
}