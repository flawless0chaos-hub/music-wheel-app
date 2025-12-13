// ===============================
// Upload API - Server Communication
// ===============================

class UploadAPI {
    constructor(uiManager) {
        this.ui = uiManager;
    }

    // Initialize album structure on server
    async initializeAlbum(albumName, trackCount, styles) {
        try {
            this.ui.showProgressModal('Creating Album');
            this.ui.updateProgress(0, trackCount, `Creating folder structure...`);

            const styleNames = styles.map(s => s.name);
            
            const response = await fetch('/api/album/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    album: albumName,
                    trackCount: trackCount,
                    styles: styleNames
                })
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                // Simulate progress for visual feedback
                for (let i = 1; i <= trackCount; i++) {
                    this.ui.updateProgress(i, trackCount, `Created Track ${i}/${trackCount}`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                this.ui.hideProgressModal();
                return { success: true };
            } else {
                this.ui.hideProgressModal();
                return { success: false, error: result.message };
            }
        } catch (error) {
            console.error('Error initializing album:', error);
            this.ui.hideProgressModal();
            return { success: false, error: error.message };
        }
    }

    // Upload all tracks
    async uploadAllTracks(albumName, trackCount, tracks, styles) {
        this.ui.showProgressModal('Uploading Tracks');
        const results = [];

        for (let trackNum = 1; trackNum <= trackCount; trackNum++) {
            this.ui.updateProgress(trackNum - 1, trackCount, `Uploading Track ${trackNum}/${trackCount}...`);

            const track = tracks[trackNum];
            if (!track) {
                results.push({ trackNum, result: { success: false, error: 'No track data' } });
                continue;
            }

            const result = await this.uploadTrack(albumName, trackNum, track, styles);
            results.push({ trackNum, result });

            await new Promise(resolve => setTimeout(resolve, 200));
        }

        this.ui.updateProgress(trackCount, trackCount, 'Upload complete!');
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.ui.hideProgressModal();

        return results;
    }

    // Upload single track
    async uploadTrack(albumName, trackNumber, track, styles) {
        try {
            const formData = new FormData();
            formData.append('album', albumName);
            formData.append('number', trackNumber);
            formData.append('name', track.name || `Track ${trackNumber}`);
            formData.append('artist', track.artist || 'Unknown Artist');

            // Add icon
            if (track.icon) {
                formData.append('icon', track.icon);
            }

            // Add files for each style
            const styleData = {};
            
            Object.entries(track.files || {}).forEach(([key, file]) => {
                // Parse key: "track1-track-0-mp3" or "track1-transition-0-lyrics"
                const parts = key.split('-');
                const type = parts[1]; // "track" or "transition"
                const styleIdx = parseInt(parts[2]);
                const fileType = parts[3]; // "mp3" or "lyrics"
                
                const styleName = styles[styleIdx].name.toLowerCase().replace(/\s+/g, '_');
                
                if (type === 'track') {
                    if (fileType === 'mp3') {
                        formData.append(`track_${styleName}`, file);
                    } else if (fileType === 'lyrics') {
                        formData.append(`lyrics_${styleName}`, file);
                    }
                } else if (type === 'transition') {
                    if (fileType === 'mp3') {
                        formData.append(`transition_${styleName}`, file);
                    } else if (fileType === 'lyrics') {
                        formData.append(`transition_lyrics_${styleName}`, file);
                    }
                }

                // Track which styles have data
                if (!styleData[styleName]) {
                    styleData[styleName] = {};
                }
                styleData[styleName][`${type}_${fileType}`] = true;
            });

            formData.append('styles', JSON.stringify(styleData));

            console.log(`📤 Uploading Track ${trackNumber}:`, {
                name: track.name,
                artist: track.artist,
                files: Object.keys(track.files || {}).length
            });

            const response = await fetch('/api/upload/track', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                console.log(`✅ Track ${trackNumber} uploaded successfully`);
            } else {
                console.error(`❌ Track ${trackNumber} upload failed:`, result.message);
            }

            return result;

        } catch (error) {
            console.error(`Error uploading track ${trackNumber}:`, error);
            return { status: 'error', message: error.message };
        }
    }
}