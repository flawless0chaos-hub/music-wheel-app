// ===============================
// Configuration - Dynamic Styles & Settings
// ===============================

const CONFIG = {
    // Style colors (will be updated dynamically from album data)
    styles: {
        rock: { 
            name: 'Rock', 
            color: '#d13b3b', 
            radius: 150,  // From defaultRadii[0]
            mobileRadius: 150  // From defaultMobileRadii[0]
        },
        funk: { 
            name: 'Funk', 
            color: '#9b3480', 
            radius: 130,  // From defaultRadii[1]
            mobileRadius: 130  // From defaultMobileRadii[1]
        },
        hiphop: { 
            name: 'Hip Hop', 
            color: '#513c99', 
            radius: 110,  // From defaultRadii[2]
            mobileRadius: 110  // From defaultMobileRadii[2]
        },
        blues: { 
            name: 'Blues', 
            color: '#2373a1', 
            radius: 90,  // From defaultRadii[3]
            mobileRadius: 90  // From defaultMobileRadii[3]
        },
        theatrical: { 
            name: 'Theatrical', 
            color: '#1da9a0', 
            radius: 70,  // From defaultRadii[4]
            mobileRadius: 70  // From defaultMobileRadii[4]
        }
    },
    
    // ⭐ CENTRALIZED RADIUS SETTINGS - שנה רק כאן!
    defaultRadii: [150, 130, 110, 90, 70],
    defaultMobileRadii: [150, 130, 110, 90, 70],
    
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