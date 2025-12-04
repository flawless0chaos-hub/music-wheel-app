// ===============================
// Canvas Drawing Module - DYNAMIC & BEAUTIFUL
// ===============================

class WheelCanvas {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.canvasSize = 500;
        this.centerX = 0;
        this.centerY = 0;
        this.isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
        
        this.albumData = null;
        this.currentStyle = null;
        this.currentSegment = null;
        this.hoveredPoint = null;
        this.progressAngle = 0;
        
        this.numStyles = 5;
        this.numTracks = 8;
        
        this.setupCanvas();
        this.setupEventListeners();
    }
    
    setupCanvas() {
        this.isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
        const container = this.canvas.parentElement;
        
        // Use fixed container size - no dynamic calculations
        this.canvasSize = this.isMobile ? 500 : 600;
        
        // Use high DPI for crisp rendering on retina displays
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvasSize * dpr;
        this.canvas.height = this.canvasSize * dpr;
        this.canvas.style.width = this.canvasSize + 'px';
        this.canvas.style.height = this.canvasSize + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        this.centerX = this.canvasSize / 2;
        this.centerY = this.canvasSize / 2;
    }
    
    setupEventListeners() {
        let resizeTimeout;
        let lastWidth = window.innerWidth;
        let lastHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            // Only resize if actual window dimensions changed
            if (window.innerWidth !== lastWidth || window.innerHeight !== lastHeight) {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    lastWidth = window.innerWidth;
                    lastHeight = window.innerHeight;
                    this.setupCanvas();
                    this.draw();
                }, 100);
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }
    
    getRadius(style) {
        const config = CONFIG.styles[style];
        if (!config) return 100;
        
        // Use radii directly from config - they're already set correctly
        return this.isMobile ? config.mobileRadius : config.radius;
    }
    
    setAlbumData(albumData, numStyles, numTracks) {
        this.albumData = albumData;
        this.numStyles = numStyles || Object.keys(CONFIG.styles).length;
        this.numTracks = numTracks || 8;
        console.log(`🎨 Canvas set: ${this.numTracks} tracks, ${this.numStyles} styles`);
        this.draw();
    }
    
    setCurrentSegment(segment) {
        this.currentSegment = segment;
        this.draw();
    }
    
    setCurrentStyle(style) {
        this.currentStyle = style;
        this.draw();
    }
    
    setProgressAngle(angle) {
        this.progressAngle = angle;
        this.draw();
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
        this.drawRadialLines();
        this.drawRings();
        this.drawPoints();
        // Icons removed - no more icons on tracks
    }
    
    drawRadialLines() {
        const numLines = this.numTracks * 2;
        
        // ✅ Get the outermost ring radius
        const styleKeys = Object.keys(CONFIG.styles);
        const maxRadius = styleKeys.length > 0 ? 
            this.getRadius(styleKeys[0]) * 1.15 : 
            200;
        
        for (let i = 0; i < numLines; i++) {
            const angle = ((i * 2 * Math.PI / numLines) - Math.PI / 2);
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            const endX = this.centerX + Math.cos(angle) * maxRadius;
            const endY = this.centerY + Math.sin(angle) * maxRadius;
            this.ctx.lineTo(endX, endY);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${CONFIG.lineOpacity})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }
    
    drawRings() {
        // ✅ Check if CONFIG.styles exists
        if (!CONFIG || !CONFIG.styles || Object.keys(CONFIG.styles).length === 0) {
            console.warn('⚠️ CONFIG.styles is empty, skipping rings');
            return;
        }
        
        // ✅ Draw all 5 rings with proper colors and full opacity
        Object.entries(CONFIG.styles).forEach(([styleKey, styleConfig]) => {
            const radius = this.getRadius(styleKey);
            const isActive = styleKey === this.currentStyle;
            
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, radius, 0, 2 * Math.PI);
            this.ctx.strokeStyle = styleConfig.color;
            this.ctx.lineWidth = isActive ? 5 : 3;
            this.ctx.globalAlpha = 1;  // ✅ Always full opacity
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        });
    }
    
    // ✅ Draw white points ONLY where MP3 exists
    drawPoints() {
        if (!this.albumData) return;
        
        const numSegments = this.numTracks * 2;
        
        Object.entries(this.albumData.tracks).forEach(([segment, track]) => {
            const segmentNum = parseInt(segment);
            const angle = ((segmentNum - 1) * 2 * Math.PI / numSegments) - Math.PI / 2;
            
            Object.entries(CONFIG.styles).forEach(([styleKey, styleConfig]) => {
                // ✅ FIXED: Check for 'url' instead of 'audio_url'
                if (!track.styles[styleKey] || !track.styles[styleKey].url) return;
                
                const radius = this.getRadius(styleKey);
                const x = this.centerX + Math.cos(angle) * radius;
                const y = this.centerY + Math.sin(angle) * radius;
                
                const isActive = segmentNum === this.currentSegment && styleKey === this.currentStyle;
                const isHovered = this.hoveredPoint?.segment === segmentNum && this.hoveredPoint?.style === styleKey;
                
                // Draw glow effect for hovered/active
                if (isActive || isHovered) {
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 24, 0, 2 * Math.PI);
                    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 24);
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    this.ctx.fillStyle = gradient;
                    this.ctx.fill();
                }
                
                // Draw main point
                this.ctx.beginPath();
                this.ctx.arc(x, y, isActive ? 12 : (isHovered ? 10 : 6), 0, 2 * Math.PI);
                this.ctx.fillStyle = isActive ? styleConfig.color : (isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.9)');
                this.ctx.fill();
                
                // Add border for active point
                if (isActive) {
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 3;
                    this.ctx.stroke();
                }
            });
        });
    }
    
    drawIcons() {
        if (!this.albumData) return;
        
        const numSegments = this.numTracks * 2;
        const styleKeys = Object.keys(CONFIG.styles);
        const iconRadius = styleKeys.length > 0 ? 
            this.getRadius(styleKeys[0]) * 1.18 : 
            200;
        
        Object.entries(this.albumData.tracks).forEach(([segment, track]) => {
            const segmentNum = parseInt(segment);
            const angle = ((segmentNum - 1) * 2 * Math.PI / numSegments) - Math.PI / 2;
            
            const x = this.centerX + Math.cos(angle) * iconRadius;
            const y = this.centerY + Math.sin(angle) * iconRadius;
            
            const icon = track.icon || '🎵';
            
            // Skip if icon is a URL (don't draw URLs as text)
            if (icon.startsWith('http') || icon.startsWith('https://')) {
                return;
            }
            
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(icon, x, y);
        });
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.hoveredPoint = this.getPointAtPosition(x, y);
        this.canvas.style.cursor = this.hoveredPoint ? 'pointer' : 'default';
        this.draw();
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const point = this.getPointAtPosition(x, y);
        if (point && this.onPointClick) {
            this.onPointClick(point.segment, point.style, point.track);
        }
    }
    
    getPointAtPosition(x, y) {
        if (!this.albumData) return null;
        
        const numSegments = this.numTracks * 2;
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx) + Math.PI / 2;
        if (angle < 0) angle += 2 * Math.PI;
        
        const segmentAngle = 2 * Math.PI / numSegments;
        const segmentIndex = Math.round(angle / segmentAngle) % numSegments;
        const segment = segmentIndex + 1;
        
        if (!this.albumData.tracks[segment]) return null;
        
        for (const [styleKey, styleConfig] of Object.entries(CONFIG.styles)) {
            const radius = this.getRadius(styleKey);
            const track = this.albumData.tracks[segment];
            
            // ✅ FIXED: Check for 'url' instead of 'audio_url'
            if (!track.styles[styleKey] || !track.styles[styleKey].url) continue;
            
            if (Math.abs(distance - radius) < 10) {
                return { segment, style: styleKey, track };
            }
        }
        
        return null;
    }
}