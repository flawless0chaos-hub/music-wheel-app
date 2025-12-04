// Social Features - Likes & Comments
// This file adds social features without changing existing UI

class SocialManager {
    constructor() {
        this.userId = this.getUserId();
        this.currentAlbum = null;
        this.currentTrack = null;
    }

    getUserId() {
        let userId = localStorage.getItem('music_wheel_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('music_wheel_user_id', userId);
        }
        return userId;
    }

    setCurrentTrack(albumName, trackNumber) {
        this.currentAlbum = albumName;
        this.currentTrack = trackNumber;
        this.loadSocialData();
    }

    async loadSocialData() {
        if (!this.currentAlbum || !this.currentTrack) return;

        // Load like status from localStorage
        const likeKey = `liked_${this.currentAlbum}_${this.currentTrack}`;
        const isLiked = localStorage.getItem(likeKey) === 'true';

        // Update UI if elements exist
        this.updateLikeUI(isLiked);
    }

    async toggleLike() {
        if (!this.currentAlbum || !this.currentTrack) return;

        try {
            const response = await fetch('/api/social/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    album: this.currentAlbum,
                    track: this.currentTrack,
                    userId: this.userId
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                const likeKey = `liked_${this.currentAlbum}_${this.currentTrack}`;
                if (data.liked) {
                    localStorage.setItem(likeKey, 'true');
                } else {
                    localStorage.removeItem(likeKey);
                }
                this.updateLikeUI(data.liked, data.count);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }

    updateLikeUI(isLiked, count) {
        // Update like button if it exists
        const likeBtn = document.querySelector('.like-btn');
        if (likeBtn) {
            if (isLiked) {
                likeBtn.classList.add('liked');
            } else {
                likeBtn.classList.remove('liked');
            }
        }

        // Update count if element exists
        const likeCount = document.querySelector('.like-count');
        if (likeCount && count !== undefined) {
            likeCount.textContent = count;
        }
    }

    async loadComments() {
        if (!this.currentAlbum || !this.currentTrack) return [];

        try {
            const response = await fetch(
                `/api/social/comments?album=${encodeURIComponent(this.currentAlbum)}&track=${this.currentTrack}`
            );
            const data = await response.json();
            return data.status === 'success' ? data.comments : [];
        } catch (error) {
            console.error('Error loading comments:', error);
            return [];
        }
    }

    async addComment(userName, commentText) {
        if (!this.currentAlbum || !this.currentTrack || !commentText.trim()) return null;

        try {
            const response = await fetch('/api/social/comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    album: this.currentAlbum,
                    track: this.currentTrack,
                    userName: userName || 'Anonymous',
                    comment: commentText.trim()
                })
            });

            const data = await response.json();
            return data.status === 'success' ? data.comment : null;
        } catch (error) {
            console.error('Error adding comment:', error);
            return null;
        }
    }
}

// Export for use in main.js
if (typeof window !== 'undefined') {
    window.SocialManager = SocialManager;
}
