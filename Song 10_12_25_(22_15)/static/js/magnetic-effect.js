// Magnetic Effect for Info Bubbles
(function() {
    let infoBubbles = [];
    
    function initMagneticEffect() {
        infoBubbles = document.querySelectorAll('.info-box');
        
        document.addEventListener('mousemove', handleMouseMove);
    }
    
    function handleMouseMove(e) {
        infoBubbles.forEach(bubble => {
            const rect = bubble.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const distX = e.clientX - centerX;
            const distY = e.clientY - centerY;
            const distance = Math.sqrt(distX * distX + distY * distY);
            
            const magnetRadius = 150; // pixels
            
            if (distance < magnetRadius) {
                const strength = (magnetRadius - distance) / magnetRadius;
                const moveX = (distX / distance) * strength * 15;
                const moveY = (distY / distance) * strength * 15;
                
                bubble.style.setProperty('--mouse-x', moveX + 'px');
                bubble.style.setProperty('--mouse-y', moveY + 'px');
                bubble.classList.add('magnetic');
            } else {
                bubble.style.setProperty('--mouse-x', '0px');
                bubble.style.setProperty('--mouse-y', '0px');
                bubble.classList.remove('magnetic');
            }
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMagneticEffect);
    } else {
        initMagneticEffect();
    }
    
    // Re-init when info grid becomes visible
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('info-grid') && 
                mutation.target.classList.contains('visible')) {
                setTimeout(initMagneticEffect, 100);
            }
        });
    });
    
    const infoGrid = document.querySelector('.info-grid');
    if (infoGrid) {
        observer.observe(infoGrid, { attributes: true, attributeFilter: ['class'] });
    }
})();
