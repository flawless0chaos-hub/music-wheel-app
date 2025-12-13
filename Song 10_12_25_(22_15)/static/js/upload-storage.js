// ===============================
// Upload Storage - localStorage Management
// ===============================

class UploadStorage {
    constructor() {
        this.storageKey = 'musicWheelAlbums';
    }

    // Load all saved albums
    loadAlbums() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Error loading albums:', e);
            return {};
        }
    }

    // Save album
    saveAlbum(albumId, albumData) {
        try {
            const albums = this.loadAlbums();
            albums[albumId] = albumData;
            localStorage.setItem(this.storageKey, JSON.stringify(albums));
            console.log('💾 Album saved to localStorage');
            return true;
        } catch (e) {
            console.error('Error saving album:', e);
            return false;
        }
    }

    // Get specific album
    getAlbum(albumId) {
        const albums = this.loadAlbums();
        return albums[albumId] || null;
    }

    // Delete album
    deleteAlbum(albumId) {
        try {
            const albums = this.loadAlbums();
            delete albums[albumId];
            localStorage.setItem(this.storageKey, JSON.stringify(albums));
            return true;
        } catch (e) {
            console.error('Error deleting album:', e);
            return false;
        }
    }

    // Update album files
    updateAlbumFiles(albumId, files) {
        const albums = this.loadAlbums();
        if (albums[albumId]) {
            albums[albumId].files = files;
            localStorage.setItem(this.storageKey, JSON.stringify(albums));
            return true;
        }
        return false;
    }

    // Clear all albums
    clearAll() {
        localStorage.removeItem(this.storageKey);
        console.log('🗑️ All albums cleared');
    }
}