// ===============================
// Configuration - Dynamic Styles & Settings
// ===============================

const CONFIG = {
    // Style colors (will be updated dynamically from album data)
    styles: {
        rock: { 
            name: 'Rock', 
            color: '#d13b3b', 
            radius: 225,  // Desktop 1.5x (150→225)
            mobileRadius: 195  // Mobile 1.3x (150→195)
        },
        funk: { 
            name: 'Funk', 
            color: '#9b3480', 
            radius: 195,  // Desktop 1.5x (130→195)
            mobileRadius: 169  // Mobile 1.3x (130→169)
        },
        hiphop: { 
            name: 'Hip Hop', 
            color: '#513c99', 
            radius: 165,  // Desktop 1.5x (110→165)
            mobileRadius: 143  // Mobile 1.3x (110→143)
        },
        blues: { 
            name: 'Blues', 
            color: '#2373a1', 
            radius: 135,  // Desktop 1.5x (90→135)
            mobileRadius: 117  // Mobile 1.3x (90→117)
        },
        theatrical: { 
            name: 'Theatrical', 
            color: '#1da9a0', 
            radius: 105,  // Desktop 1.5x (70→105)
            mobileRadius: 91  // Mobile 1.3x (70→91)
        }
    },
    
    // ⭐ CENTRALIZED RADIUS SETTINGS - Desktop scaled 1.5x
    defaultRadii: [225, 195, 165, 135, 105], // 150→225, 130→195, 110→165, 90→135, 70→105
    defaultMobileRadii: [195, 169, 143, 117, 91], // Scaled 1.3x: 150→195, 130→169, 110→143, 90→117, 70→91
    
    // Visual settings
    lineOpacity: 0.08,
    mobileBreakpoint: 768,
    
    // Audio settings
    defaultVolume: 0.7,
    
    // Update styles dynamically from album data
    updateStyles: function(albumStyles) {
        if (!albumStyles || albumStyles.length === 0) return;
        
        console.log('🎨 Updating CONFIG.styles with:', albumStyles);
        
        // Use centralized radii from CONFIG
        const radii = this.defaultRadii;
        const mobileRadii = this.defaultMobileRadii;
        
        // Clear existing styles
        this.styles = {};
        
        // Add new styles from album
        albumStyles.forEach((style, index) => {
            const key = style.key || style.name.toLowerCase().replace(/\s+/g, '_');
            this.styles[key] = {
                name: style.name,
                color: style.color,
                radius: radii[index] || 100,
                mobileRadius: mobileRadii[index] || 60
            };
        });
        
        console.log('✅ CONFIG.styles updated:', this.styles);
    }
};

// Make CONFIG globally available
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}