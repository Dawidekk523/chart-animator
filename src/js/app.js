// Main application file
import { ChartRenderer } from './chartRenderer.js';
import { AnimationController } from './animationController.js';
import { DataManager } from './dataManager.js';
import { ExportManager } from './exportManager.js';

class ChartAnimatorApp {
    constructor() {
        this.chartType = 'bar';
        this.theme = 'dark';
        this.animationDuration = 3.0;
        this.animationEasing = 'easeInOut';
        this.isPlaying = false;
        this.currentTime = 0;
        
        // Initialize modules
        this.dataManager = new DataManager();
        this.chartRenderer = new ChartRenderer('chartCanvas');
        this.animationController = new AnimationController();
        this.exportManager = new ExportManager(this.chartRenderer);
        
        // Initialize UI
        this.initUI();
        this.setupEventListeners();
        
        // Load default data
        this.loadDefaultData();
    }
    
    initUI() {
        // Template selection
        this.templateItems = document.querySelectorAll('.template-item');
        
        // Data table
        this.dataTable = document.getElementById('dataTable');
        this.addRowBtn = document.getElementById('addRowBtn');
        
        // Animation controls
        this.durationSlider = document.getElementById('animDuration');
        this.durationValue = document.getElementById('animDurationValue');
        this.easingSelect = document.getElementById('animEasing');
        this.themeOptions = document.querySelectorAll('.theme-option');
        
        // Playback controls
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.timeSlider = document.getElementById('timeSlider');
        this.timeDisplay = document.getElementById('currentTimeDisplay');
        
        // Action buttons
        this.generateBtn = document.getElementById('generateBtn');
        this.exportMP4Btn = document.getElementById('exportMP4Btn');
        this.exportGIFBtn = document.getElementById('exportGIFBtn');
        this.importCSVBtn = document.getElementById('importCSVBtn');
        
        // Modal
        this.exportModal = document.getElementById('exportModal');
        this.closeModalBtn = document.querySelector('.close-modal-btn');
        this.confirmExportBtn = document.getElementById('confirmExportBtn');
        this.cancelExportBtn = document.getElementById('cancelExportBtn');
    }
    
    setupEventListeners() {
        // Chart template selection
        this.templateItems.forEach(item => {
            item.addEventListener('click', () => this.selectTemplate(item));
        });
        
        // Data management
        this.addRowBtn.addEventListener('click', () => this.addDataRow());
        this.dataTable.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-row-btn')) {
                const row = e.target.closest('tr');
                if (row && this.dataTable.querySelectorAll('tbody tr').length > 1) {
                    row.remove();
                }
            }
        });
        
        // Settings controls
        this.durationSlider.addEventListener('input', () => {
            this.animationDuration = parseFloat(this.durationSlider.value);
            this.durationValue.textContent = this.animationDuration.toFixed(1);
        });
        
        this.easingSelect.addEventListener('change', () => {
            this.animationEasing = this.easingSelect.value;
        });
        
        this.themeOptions.forEach(option => {
            option.addEventListener('click', () => this.selectTheme(option));
        });
        
        // Animation controls
        this.playPauseBtn.addEventListener('click', () => this.togglePlayback());
        this.timeSlider.addEventListener('input', () => {
            this.currentTime = parseInt(this.timeSlider.value) / 100 * this.animationDuration;
            this.updateTimeDisplay();
            this.renderCurrentFrame();
        });
        
        // Action buttons
        this.generateBtn.addEventListener('click', () => this.generateAnimation());
        this.exportMP4Btn.addEventListener('click', () => this.showExportModal('mp4'));
        this.exportGIFBtn.addEventListener('click', () => this.showExportModal('gif'));
        this.importCSVBtn.addEventListener('click', () => this.importCSV());
        
        // Modal controls
        this.closeModalBtn.addEventListener('click', () => this.closeExportModal());
        this.cancelExportBtn.addEventListener('click', () => this.closeExportModal());
        this.confirmExportBtn.addEventListener('click', () => this.confirmExport());
        
        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    loadDefaultData() {
        // Default data is already in the HTML table
        // This function can be used to load saved data in the future
        this.updateChartFromTable();
        this.generateAnimation();
    }
    
    selectTemplate(item) {
        this.templateItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.chartType = item.dataset.type;
        
        // Update the renderer with the new chart type
        this.chartRenderer.setChartType(this.chartType);
        
        // Special handling for StatBar chart type
        if (this.chartType === 'statBar') {
            this.setupStatBarDataInput();
        } else {
            // Restore default data input if coming from StatBar
            const headerRow = this.dataTable.querySelector('thead tr');
            if (headerRow && headerRow.querySelector('th').textContent === 'Stat Name') {
                // We were in StatBar mode, reset to normal table
                headerRow.innerHTML = `
                    <th>Label</th>
                    <th>Value</th>
                    <th>Color</th>
                    <th></th>
                `;
                
                // Add default rows if table is empty
                const tbody = this.dataTable.querySelector('tbody');
                if (tbody.querySelectorAll('tr').length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td><input type="text" value="Category 1"></td>
                            <td><input type="number" value="42"></td>
                            <td><input type="color" value="#4A7CFF"></td>
                            <td><button class="remove-row-btn">×</button></td>
                        </tr>
                        <tr>
                            <td><input type="text" value="Category 2"></td>
                            <td><input type="number" value="78"></td>
                            <td><input type="color" value="#FF4A7C"></td>
                            <td><button class="remove-row-btn">×</button></td>
                        </tr>
                    `;
                }
            }
        }
        
        this.generateAnimation();
    }
    
    /**
     * Set up the data input table for StatBar chart type
     */
    setupStatBarDataInput() {
        // Clear existing table data
        const tbody = this.dataTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        // Update header row for StatBar specific fields
        const headerRow = this.dataTable.querySelector('thead tr');
        headerRow.innerHTML = `
            <th>Stat Name</th>
            <th>Current Value</th>
            <th>Max Value</th>
            <th>Min Value</th>
            <th>Color</th>
            <th></th>
        `;
        
        // Add a default row for the StatBar
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="text" value="Complete Tasks"></td>
            <td><input type="number" value="65" min="0"></td>
            <td><input type="number" value="100" min="0"></td>
            <td><input type="number" value="0" min="0"></td>
            <td><input type="color" value="#A239FF"></td>
            <td><button class="remove-row-btn">×</button></td>
        `;
        
        tbody.appendChild(newRow);
        
        // Make sure add row button is usable for stat bars
        this.addRowBtn.disabled = false;
    }
    
    selectTheme(option) {
        this.themeOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        this.theme = option.dataset.theme;
        
        // Update the renderer with the new theme
        this.chartRenderer.setTheme(this.theme);
        this.renderCurrentFrame();
    }
    
    addDataRow() {
        const tbody = this.dataTable.querySelector('tbody');
        const newRow = document.createElement('tr');
        
        // Special handling for StatBar chart type
        if (this.chartType === 'statBar') {
            // Generate a random color with hue in the purple/blue range
            const hue = 240 + Math.floor(Math.random() * 120);
            const randomColor = `hsl(${hue}, 80%, 60%)`;
            
            newRow.innerHTML = `
                <td><input type="text" value="New Stat"></td>
                <td><input type="number" value="50" min="0"></td>
                <td><input type="number" value="100" min="0"></td>
                <td><input type="number" value="0" min="0"></td>
                <td><input type="color" value="${randomColor}"></td>
                <td><button class="remove-row-btn">×</button></td>
            `;
        } else {
            // Generate a random color
            const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
            
            newRow.innerHTML = `
                <td><input type="text" value="New Item"></td>
                <td><input type="number" value="50"></td>
                <td><input type="color" value="${randomColor}"></td>
                <td><button class="remove-row-btn">×</button></td>
            `;
        }
        
        tbody.appendChild(newRow);
    }
    
    updateChartFromTable() {
        const rows = this.dataTable.querySelectorAll('tbody tr');
        const chartData = [];
        
        // Special handling for StatBar chart type
        if (this.chartType === 'statBar') {
            // Process all rows for stat bars (not just the first one)
            rows.forEach(row => {
                const inputs = row.querySelectorAll('input');
                
                if (inputs.length >= 4) {
                    const label = inputs[0].value;
                    let value = parseFloat(inputs[1].value);
                    const max = parseFloat(inputs[2].value);
                    const min = inputs.length >= 4 ? parseFloat(inputs[3].value) : 0;
                    const color = inputs.length >= 5 ? inputs[4].value : '#A239FF';
                    
                    // Ensure value is within bounds
                    value = Math.max(min, Math.min(max, value));
                    
                    // Update the input field if value was clamped
                    if (value !== parseFloat(inputs[1].value)) {
                        inputs[1].value = value;
                    }
                    
                    chartData.push({ 
                        label, 
                        value, 
                        max, 
                        min,
                        color
                    });
                }
            });
        } else {
            // Normal handling for other chart types
            rows.forEach(row => {
                const label = row.querySelector('input[type="text"]').value;
                const value = parseFloat(row.querySelector('input[type="number"]').value);
                const color = row.querySelector('input[type="color"]').value;
                
                chartData.push({ label, value, color });
            });
        }
        
        this.dataManager.setData(chartData);
    }
    
    generateAnimation() {
        // Get current data from the table
        this.updateChartFromTable();
        
        // Configure animation
        const animationConfig = {
            duration: this.animationDuration,
            easing: this.animationEasing,
            type: this.chartType,
            theme: this.theme
        };
        
        // Set up the animation
        this.animationController.setupAnimation(
            this.dataManager.getData(),
            animationConfig,
            this.chartRenderer
        );
        
        // Reset playback
        this.currentTime = 0;
        this.timeSlider.value = 0;
        this.updateTimeDisplay();
        this.renderCurrentFrame();
    }
    
    togglePlayback() {
        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }
    
    startPlayback() {
        if (this.isPlaying) return;
        
        // If we're at the end, start from the beginning
        if (this.currentTime >= this.animationDuration) {
            this.currentTime = 0;
        }
        
        this.isPlaying = true;
        this.playPauseBtn.classList.add('pause');
        this.playPauseBtn.classList.remove('play-btn');
        this.playPauseBtn.innerHTML = '❚❚'; // Pause symbol
        
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.updatePlayback.bind(this));
    }
    
    stopPlayback() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        this.playPauseBtn.classList.remove('pause');
        this.playPauseBtn.classList.add('play-btn');
        this.playPauseBtn.innerHTML = ''; // Reset to CSS triangle
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
    
    updatePlayback(timestamp) {
        const elapsed = (timestamp - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = timestamp;
        
        // Update current time
        this.currentTime += elapsed;
        
        // Check if animation is complete
        if (this.currentTime >= this.animationDuration) {
            this.currentTime = this.animationDuration;
            this.stopPlayback();
        }
        
        // Update slider and time display
        this.timeSlider.value = (this.currentTime / this.animationDuration) * 100;
        this.updateTimeDisplay();
        
        // Render the current frame
        this.renderCurrentFrame();
        
        // Continue animation loop if still playing
        if (this.isPlaying) {
            this.animationFrameId = requestAnimationFrame(this.updatePlayback.bind(this));
        }
    }
    
    renderCurrentFrame() {
        const progress = this.currentTime / this.animationDuration;
        this.animationController.renderFrame(progress);
    }
    
    updateTimeDisplay() {
        const currentMinutes = Math.floor(this.currentTime / 60);
        const currentSeconds = Math.floor(this.currentTime % 60);
        const totalMinutes = Math.floor(this.animationDuration / 60);
        const totalSeconds = Math.floor(this.animationDuration % 60);
        
        const formatTime = (m, s) => `${m}:${s.toString().padStart(2, '0')}`;
        
        this.timeDisplay.textContent = 
            `${formatTime(currentMinutes, currentSeconds)} / ${formatTime(totalMinutes, totalSeconds)}`;
    }
    
    showExportModal(format) {
        this.exportFormat = format;
        this.exportModal.style.display = 'block';
    }
    
    closeExportModal() {
        this.exportModal.style.display = 'none';
    }
    
    confirmExport() {
        const width = parseInt(document.getElementById('exportWidth').value);
        const height = parseInt(document.getElementById('exportHeight').value);
        const fps = parseInt(document.getElementById('exportFPS').value);
        const quality = document.getElementById('exportQuality').value;
        
        const exportOptions = { width, height, fps, quality };
        
        if (this.exportFormat === 'mp4') {
            this.exportManager.exportToMP4(exportOptions);
        } else if (this.exportFormat === 'gif') {
            this.exportManager.exportToGIF(exportOptions);
        }
        
        this.closeExportModal();
    }
    
    importCSV() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const csvData = event.target.result;
                this.dataManager.importCSV(csvData);
                this.updateTableFromData();
                this.generateAnimation();
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    updateTableFromData() {
        const data = this.dataManager.getData();
        const tbody = this.dataTable.querySelector('tbody');
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        // Add new rows
        data.forEach(item => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="text" value="${item.label}"></td>
                <td><input type="number" value="${item.value}"></td>
                <td><input type="color" value="${item.color}"></td>
                <td><button class="remove-row-btn">×</button></td>
            `;
            tbody.appendChild(newRow);
        });
    }
    
    handleResize() {
        this.chartRenderer.resize();
        this.renderCurrentFrame();
    }
}

// Initialize the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chartAnimatorApp = new ChartAnimatorApp();
});
