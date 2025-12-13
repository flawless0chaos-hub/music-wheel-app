// ===============================
// Upload UI - UI Management
// ===============================

class UploadUI {
    constructor() {
        this.progressOverlay = document.getElementById('progressOverlay');
        this.progressBarFill = document.getElementById('progressBarFill');
        this.progressText = document.getElementById('progressText');
        this.progressPercentage = document.getElementById('progressPercentage');
        this.progressSubtitle = document.getElementById('progressSubtitle');
    }

    // Show specific stage
    showStage(stageName) {
        document.querySelectorAll('.stage').forEach(stage => {
            stage.classList.remove('active');
        });
        document.getElementById(`${stageName}Stage`).classList.add('active');
    }

    // Show modal
    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    // Hide modal
    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    // Show progress overlay
    showProgressModal(title) {
        if (this.progressOverlay) {
            this.progressOverlay.querySelector('.progress-title').textContent = title;
            this.progressOverlay.classList.add('show');
        }
    }

    // Hide progress overlay
    hideProgressModal() {
        if (this.progressOverlay) {
            this.progressOverlay.classList.remove('show');
        }
    }

    // Update progress bar
    updateProgress(current, total, message) {
        const percentage = Math.round((current / total) * 100);
        
        if (this.progressBarFill) {
            this.progressBarFill.style.width = percentage + '%';
        }
        if (this.progressText) {
            this.progressText.textContent = message;
        }
        if (this.progressPercentage) {
            this.progressPercentage.textContent = percentage + '%';
        }
    }

    // Generate style inputs
    generateStyleInputs(styles, container) {
        if (!container) return;
        
        container.innerHTML = styles.map((style, idx) => `
            <div class="style-item">
                <div class="style-number">${idx + 1}</div>
                <input type="text" 
                       class="style-input" 
                       data-style-index="${idx}" 
                       value="${style.name}" 
                       placeholder="Style name...">
                <input type="color" 
                       class="color-picker" 
                       data-style-index="${idx}" 
                       value="${style.color}">
                <div class="color-preview" style="background: ${style.color}"></div>
            </div>
        `).join('');
    }

    // Generate files table for current track
    generateFilesTable(tableBody, styles, trackIndex, uploadedFiles) {
        if (!tableBody) return;
        
        const trackNum = trackIndex + 1;
        
        tableBody.innerHTML = styles.map((style, idx) => {
            // Check file status
            const trackMP3Key = `track${trackNum}-track-${idx}-mp3`;
            const trackLyricsKey = `track${trackNum}-track-${idx}-lyrics`;
            const transitionMP3Key = `track${trackNum}-transition-${idx}-mp3`;
            const transitionLyricsKey = `track${trackNum}-transition-${idx}-lyrics`;
            
            const hasTrackMP3 = !!uploadedFiles[trackMP3Key];
            const hasTrackLyrics = !!uploadedFiles[trackLyricsKey];
            const hasTransitionMP3 = !!uploadedFiles[transitionMP3Key];
            const hasTransitionLyrics = !!uploadedFiles[transitionLyricsKey];
            
            const totalFiles = [hasTrackMP3, hasTrackLyrics, hasTransitionMP3, hasTransitionLyrics].filter(Boolean).length;
            
            let statusClass = 'empty';
            let statusText = 'Empty';
            let statusIcon = '○';
            
            if (totalFiles === 4) {
                statusClass = 'complete';
                statusText = 'Complete';
                statusIcon = '✓';
            } else if (totalFiles > 0) {
                statusClass = 'partial';
                statusText = `${totalFiles}/4`;
                statusIcon = '◐';
            }
            
            return `
                <tr>
                    <td>
                        <div class="style-name">
                            <div class="style-color-dot" style="background: ${style.color}"></div>
                            ${style.name}
                        </div>
                    </td>
                    <td>
                        <div class="upload-cell">
                            <button class="upload-btn ${hasTrackMP3 ? 'uploaded' : ''}" 
                                    data-type="track" 
                                    data-idx="${idx}" 
                                    data-upload="mp3">
                                ${hasTrackMP3 ? '✓ Uploaded' : 'Upload MP3'}
                            </button>
                        </div>
                    </td>
                    <td>
                        <div class="upload-cell">
                            <button class="upload-btn ${hasTrackLyrics ? 'uploaded' : ''}" 
                                    data-type="track" 
                                    data-idx="${idx}" 
                                    data-upload="lyrics">
                                ${hasTrackLyrics ? '✓ Uploaded' : 'Upload TXT'}
                            </button>
                        </div>
                    </td>
                    <td>
                        <div class="upload-cell">
                            <button class="upload-btn ${hasTransitionMP3 ? 'uploaded' : ''}" 
                                    data-type="transition" 
                                    data-idx="${idx}" 
                                    data-upload="mp3">
                                ${hasTransitionMP3 ? '✓ Uploaded' : 'Upload MP3'}
                            </button>
                        </div>
                    </td>
                    <td>
                        <div class="upload-cell">
                            <button class="upload-btn ${hasTransitionLyrics ? 'uploaded' : ''}" 
                                    data-type="transition" 
                                    data-idx="${idx}" 
                                    data-upload="lyrics">
                                ${hasTransitionLyrics ? '✓ Uploaded' : 'Upload TXT'}
                            </button>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${statusIcon} ${statusText}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }
}