// Export manager module - Handles exporting animations to video formats

export class ExportManager {
    constructor(app) { // Accept app instance
        this.app = app; // Store app instance
        this.chartRenderer = app.chartRenderer; // Get renderer from app
        this.recorder = null;
        this.chunks = [];
    }
    
    async exportToMP4(options = {}) { // Note: This will actually export WebM
        const { width = 1920, height = 1080, fps = 30, quality = 'medium', delayBetweenSlides = 3 } = options;

        try {
            // Show loading indicator
            this.showLoadingMessage('Preparing WebM export...'); // Updated message

            // Get the canvas stream
            const canvas = this.chartRenderer.getCanvas();
            // Ensure canvas has dimensions before capturing stream
            if (canvas.width === 0 || canvas.height === 0) {
                canvas.width = width;
                canvas.height = height;
                this.app.renderCurrentFrame(); // Render once to set initial size if needed
                await new Promise(requestAnimationFrame); // Wait for render
            }
            const stream = canvas.captureStream(fps);

            // Set up MediaRecorder with options
            const bitrates = {
                high: 5000000,    // 5 Mbps
                medium: 2500000,  // 2.5 Mbps
                low: 1000000      // 1 Mbps
            };

            // Check for supported MIME types
            let mimeType = 'video/webm;codecs=vp9';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                console.warn('VP9 codec not supported, trying VP8');
                mimeType = 'video/webm;codecs=vp8';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    console.warn('VP8 codec not supported, trying default webm');
                    mimeType = 'video/webm';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        throw new Error('No supported video/webm MIME type found for MediaRecorder');
                    }
                }
            }
            console.log('Using MIME type:', mimeType);

            const recorderOptions = {
                mimeType: mimeType,
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
                this.processRecording('webm'); // Process as webm
            };

            // Start recording
            this.recorder.start();

            // Update loading message
            this.showLoadingMessage('Recording animation...');

            // Render each slide and capture frames
            for (let i = 0; i < this.app.slides.length; i++) {
                this.app.selectSlide(i);
                await this.renderAnimationFrames(fps); // Capture frames for each slide
                
                // Add delay between slides
                await new Promise(resolve => setTimeout(resolve, delayBetweenSlides * 1000));
            }

            // Stop recording after all frames are rendered
            this.recorder.stop();

        } catch (error) {
            console.error('Error exporting to WebM:', error); // Updated message
            this.hideLoadingMessage();
            this.showErrorMessage('Failed to export WebM: ' + error.message);
        }
    }
    
    async exportToGIF(options = {}) {
        const { width = 1920, height = 1080, fps = 15, quality = 'medium' } = options;

        try {
            // Load the GIF.js library dynamically if needed
            await this.loadGifJsLibrary();

            // Show loading indicator
            this.showLoadingMessage('Preparing GIF export...');

            // Ensure canvas has dimensions
            const canvas = this.chartRenderer.getCanvas();
            if (canvas.width === 0 || canvas.height === 0) {
                canvas.width = width;
                canvas.height = height;
                this.app.renderCurrentFrame(); // Render once to set initial size if needed
                await new Promise(requestAnimationFrame); // Wait for render
            }

            // Create GIF encoder
            const gif = new GIF({
                workers: 4,
                quality: quality === 'high' ? 1 : quality === 'medium' ? 5 : 10,
                width: canvas.width, // Use actual canvas dimensions
                height: canvas.height, // Use actual canvas dimensions
                workerScript: 'src/js/libs/gif.worker.js' // Use local worker script
            });

            // Update loading message
            this.showLoadingMessage('Generating GIF frames...');

            // Capture frames
            const frames = await this.captureFrames(fps); // Pass app implicitly via this.app

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
        // Get animation controller and data from stored app instance
        const app = this.app;
        const totalFrames = Math.round(fps * app.animationDuration); // Use Math.round

        // Reset animation to start
        app.animationController.renderFrame(0);
        await new Promise(requestAnimationFrame); // Wait for first frame render

        // Render each frame using requestAnimationFrame for sync
        for (let i = 0; i <= totalFrames; i++) {
            const progress = totalFrames === 0 ? 1 : i / totalFrames; // Avoid division by zero
            app.animationController.renderFrame(progress);
            // Wait for the next animation frame to ensure the canvas has updated
            await new Promise(requestAnimationFrame);
        }
        // Render final frame state just in case
        app.animationController.renderFrame(1);
        await new Promise(requestAnimationFrame);
    }
    
    async captureFrames(fps) {
        const app = this.app;
        const totalFrames = Math.round(fps * app.animationDuration);
        const frames = [];
        const canvas = app.chartRenderer.getCanvas();

        // Reset animation to start
        app.animationController.renderFrame(0);
        await new Promise(requestAnimationFrame); // Wait for first frame render


        // Capture each frame using requestAnimationFrame for sync
        for (let i = 0; i <= totalFrames; i++) {
            const progress = totalFrames === 0 ? 1 : i / totalFrames; // Avoid division by zero
            app.animationController.renderFrame(progress);

            // Wait for the next animation frame to ensure the canvas has updated
            await new Promise(requestAnimationFrame);

            // Create a copy of the current canvas frame
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = canvas.width;
            frameCanvas.height = canvas.height;
            const ctx = frameCanvas.getContext('2d');

            // Draw a background color (e.g., white) before drawing the chart
            // This prevents transparency issues in the final GIF
            ctx.fillStyle = '#FFFFFF'; // Or use app.chartRenderer.getBackgroundColor() if available
            ctx.fillRect(0, 0, frameCanvas.width, frameCanvas.height);

            ctx.drawImage(canvas, 0, 0);
            frames.push(frameCanvas);
        }

        // Capture final frame state
        app.animationController.renderFrame(1);
        await new Promise(requestAnimationFrame);
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = canvas.width;
        frameCanvas.height = canvas.height;
        const ctx = frameCanvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, frameCanvas.width, frameCanvas.height);
        ctx.drawImage(canvas, 0, 0);
        frames.push(frameCanvas);


        return frames;
    }
    
    processRecording(format) {
        // Create a blob from the recorded chunks - always use video/webm
        const blob = new Blob(this.chunks, { type: 'video/webm' });

        // Hide loading message
        this.hideLoadingMessage();

        // Trigger download - always save as .webm
        this.downloadFile(blob, `chart-animation.webm`);
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
