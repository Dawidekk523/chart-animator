// Export manager module - Handles exporting animations to video formats

export class ExportManager {
    constructor(chartRenderer) {
        this.chartRenderer = chartRenderer;
        this.recorder = null;
        this.chunks = [];
    }
    
    async exportToMP4(options = {}) {
        const { width = 1920, height = 1080, fps = 30, quality = 'medium' } = options;
        
        try {
            // Show loading indicator
            this.showLoadingMessage('Preparing export...');
            
            // Get the canvas stream
            const canvas = this.chartRenderer.getCanvas();
            const stream = canvas.captureStream(fps);
            
            // Set up MediaRecorder with options
            const bitrates = {
                high: 5000000,    // 5 Mbps
                medium: 2500000,  // 2.5 Mbps
                low: 1000000      // 1 Mbps
            };
            
            const recorderOptions = {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: bitrates[quality] || bitrates.medium
            };
            
            this.recorder = new MediaRecorder(stream, recorderOptions);
            this.chunks = [];
            
            this.recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                }
            };
            
            this.recorder.onstop = () => {
                this.processRecording('mp4');
            };
            
            // Start recording
            this.recorder.start();
            
            // Update loading message
            this.showLoadingMessage('Recording animation...');
            
            // Render animation frames
            await this.renderAnimationFrames(fps);
            
            // Stop recording after all frames are rendered
            this.recorder.stop();
            
        } catch (error) {
            console.error('Error exporting to MP4:', error);
            this.hideLoadingMessage();
            this.showErrorMessage('Failed to export MP4: ' + error.message);
        }
    }
    
    async exportToGIF(options = {}) {
        const { width = 1920, height = 1080, fps = 15, quality = 'medium' } = options;
        
        try {
            // Load the GIF.js library dynamically if needed
            await this.loadGifJsLibrary();
            
            // Show loading indicator
            this.showLoadingMessage('Preparing GIF export...');
            
            // Create GIF encoder
            const gif = new GIF({
                workers: 4,
                quality: quality === 'high' ? 1 : quality === 'medium' ? 5 : 10,
                width: width,
                height: height,
                workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
            });
            
            // Update loading message
            this.showLoadingMessage('Generating GIF frames...');
            
            // Capture frames
            const canvas = this.chartRenderer.getCanvas();
            const frames = await this.captureFrames(fps);
            
            // Add frames to GIF
            frames.forEach(frame => {
                gif.addFrame(frame, { delay: 1000 / fps, copy: true });
            });
            
            // Render GIF
            this.showLoadingMessage('Rendering GIF...');
            
            gif.on('finished', blob => {
                this.hideLoadingMessage();
                this.downloadFile(blob, 'chart-animation.gif');
            });
            
            gif.on('progress', progress => {
                this.showLoadingMessage(`Rendering GIF... ${Math.round(progress * 100)}%`);
            });
            
            gif.render();
            
        } catch (error) {
            console.error('Error exporting to GIF:', error);
            this.hideLoadingMessage();
            this.showErrorMessage('Failed to export GIF: ' + error.message);
        }
    }
    
    async loadGifJsLibrary() {
        // Check if GIF.js is already loaded
        if (window.GIF) return Promise.resolve();
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load GIF.js library'));
            document.head.appendChild(script);
        });
    }
    
    async renderAnimationFrames(fps) {
        // Get animation controller and data from chartRenderer
        const app = window.chartAnimatorApp;
        const totalFrames = fps * app.animationDuration;
        
        // Render each frame with a small delay to allow for canvas updates
        for (let i = 0; i <= totalFrames; i++) {
            const progress = i / totalFrames;
            app.animationController.renderFrame(progress);
            await new Promise(resolve => setTimeout(resolve, 10)); // Small delay for canvas to update
        }
    }
    
    async captureFrames(fps) {
        const app = window.chartAnimatorApp;
        const totalFrames = fps * app.animationDuration;
        const frames = [];
        
        const canvas = this.chartRenderer.getCanvas();
        
        // Capture each frame
        for (let i = 0; i <= totalFrames; i++) {
            const progress = i / totalFrames;
            app.animationController.renderFrame(progress);
            
            // Create a copy of the current canvas frame
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = canvas.width;
            frameCanvas.height = canvas.height;
            const ctx = frameCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0);
            
            frames.push(frameCanvas);
            
            // Small delay to allow for canvas updates
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return frames;
    }
    
    processRecording(format) {
        // Create a blob from the recorded chunks
        const blob = new Blob(this.chunks, { type: format === 'mp4' ? 'video/mp4' : 'video/webm' });
        
        // Hide loading message
        this.hideLoadingMessage();
        
        // Trigger download
        this.downloadFile(blob, `chart-animation.${format}`);
    }
    
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    showLoadingMessage(message) {
        // Create or update loading message element
        let loadingEl = document.getElementById('export-loading');
        
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'export-loading';
            loadingEl.style.position = 'fixed';
            loadingEl.style.top = '50%';
            loadingEl.style.left = '50%';
            loadingEl.style.transform = 'translate(-50%, -50%)';
            loadingEl.style.padding = '20px 40px';
            loadingEl.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            loadingEl.style.color = 'white';
            loadingEl.style.borderRadius = '8px';
            loadingEl.style.zIndex = '1000';
            loadingEl.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
            document.body.appendChild(loadingEl);
        }
        
        loadingEl.innerHTML = `
            <div style="text-align: center">
                <div style="margin-bottom: 10px">
                    <div class="loading-spinner"></div>
                </div>
                <div>${message}</div>
            </div>
        `;
        
        // Add spinner style if not already added
        if (!document.getElementById('loading-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'loading-spinner-style';
            style.textContent = `
                .loading-spinner {
                    display: inline-block;
                    width: 30px;
                    height: 30px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 1s ease-in-out infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    hideLoadingMessage() {
        const loadingEl = document.getElementById('export-loading');
        if (loadingEl) {
            document.body.removeChild(loadingEl);
        }
    }
    
    showErrorMessage(message) {
        alert(message);
    }
}
