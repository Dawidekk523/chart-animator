// Animation controller module - Handles animation timing and frame calculations

export class AnimationController {
    constructor() {
        this.data = [];
        this.config = {
            duration: 3,
            easing: 'easeInOut',
            type: 'bar',
            theme: 'dark'
        };
        this.renderer = null;
    }
    
    setupAnimation(data, config, renderer) {
        this.data = data;
        this.config = { ...this.config, ...config };
        this.renderer = renderer;
    }
    
    renderFrame(progress) {
        if (!this.renderer || !this.data.length) return;
        
        // Apply easing function
        const easedProgress = this.applyEasing(progress, this.config.easing);
        
        // Render the frame
        this.renderer.render(this.data, easedProgress);
    }
    
    applyEasing(progress, easingType) {
        // Constrain progress to [0, 1]
        progress = Math.min(1, Math.max(0, progress));
        
        switch (easingType) {
            case 'linear':
                return progress;
                
            case 'easeInOut':
                // Smooth acceleration and deceleration
                return progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
            case 'elastic':
                // Elastic bounce effect
                const c4 = (2 * Math.PI) / 3;
                return progress === 0
                    ? 0
                    : progress === 1
                    ? 1
                    : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) + 1;
                
            case 'bounce':
                // Bounce effect
                const n1 = 7.5625;
                const d1 = 2.75;
                
                if (progress < 1 / d1) {
                    return n1 * progress * progress;
                } else if (progress < 2 / d1) {
                    return n1 * (progress -= 1.5 / d1) * progress + 0.75;
                } else if (progress < 2.5 / d1) {
                    return n1 * (progress -= 2.25 / d1) * progress + 0.9375;
                } else {
                    return n1 * (progress -= 2.625 / d1) * progress + 0.984375;
                }
                
            default:
                return progress;
        }
    }
    
    generateKeyframes(numFrames) {
        const frames = [];
        
        for (let i = 0; i < numFrames; i++) {
            const progress = i / (numFrames - 1);
            const easedProgress = this.applyEasing(progress, this.config.easing);
            frames.push(easedProgress);
        }
        
        return frames;
    }
}
