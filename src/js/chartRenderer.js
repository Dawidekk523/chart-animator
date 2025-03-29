// Chart renderer module - Handles drawing of different chart types

export class ChartRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chartType = 'bar';
        this.theme = 'dark';
        
        // Set default dimensions
        this.resize();
        
        // Theme colors
        this.themes = {
            dark: {
                background: '#0F1118',
                text: '#FFFFFF',
                grid: '#2A2D39',
                gridAlpha: 0.5
            },
            light: {
                background: '#FFFFFF',
                text: '#333333',
                grid: '#CCCCCC',
                gridAlpha: 0.5
            },
            gradient: {
                background: 'linear-gradient(135deg, #1A1C25 0%, #2A2A3A 100%)',
                text: '#FFFFFF',
                grid: '#4A5065',
                gridAlpha: 0.4
            }
        };
    }
    
    resize() {
        // Get the container dimensions
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Set canvas size with a 16:9 aspect ratio
        const aspectRatio = 16/9;
        let width = containerWidth - 40; // 20px padding on each side
        let height = width / aspectRatio;
        
        // Make sure it fits in the container height
        if (height > containerHeight - 40) {
            height = containerHeight - 40;
            width = height * aspectRatio;
        }
        
        // Set canvas size with pixel density consideration
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        
        // Scale the context
        this.ctx.scale(dpr, dpr);
        
        // Store dimensions for calculations
        this.width = width;
        this.height = height;
        
        // Update internal dimensions for drawing
        this.updateDrawingDimensions();
    }
    
    updateDrawingDimensions() {
        // Set chart area dimensions with margins
        this.margin = {
            top: this.height * 0.1,
            right: this.width * 0.1,
            bottom: this.height * 0.15,
            left: this.width * 0.15
        };
        
        this.chartWidth = this.width - this.margin.left - this.margin.right;
        this.chartHeight = this.height - this.margin.top - this.margin.bottom;
    }
    
    setChartType(type) {
        this.chartType = type;
    }
    
    setTheme(theme) {
        this.theme = theme;
    }
    
    clear() {
        // Clear the entire canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background based on theme
        const bgColor = this.themes[this.theme].background;
        
        if (bgColor.includes('gradient')) {
            // Create gradient for background
            const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
            gradient.addColorStop(0, '#1A1C25');
            gradient.addColorStop(1, '#2A2A3A');
            this.ctx.fillStyle = gradient;
        } else {
            this.ctx.fillStyle = bgColor;
        }
        
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawAxes() {
        const { text, grid, gridAlpha } = this.themes[this.theme];
        
        // Save context state
        this.ctx.save();
        
        // Set styles for grid and axes
        this.ctx.strokeStyle = grid;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = gridAlpha;
        
        // Draw horizontal grid lines
        const yAxisSteps = 5;
        for (let i = 0; i <= yAxisSteps; i++) {
            const y = this.margin.top + (i / yAxisSteps) * this.chartHeight;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left, y);
            this.ctx.lineTo(this.width - this.margin.right, y);
            this.ctx.stroke();
        }
        
        // Restore context state
        this.ctx.restore();
    }
    
    drawLabels(data, progress = 1) {
        const textColor = this.themes[this.theme].text;
        
        // Save context state
        this.ctx.save();
        
        // Set style for labels
        this.ctx.fillStyle = textColor;
        this.ctx.font = '12px Inter';
        this.ctx.textAlign = 'center';
        
        // Only draw visible labels based on progress for x-axis (bar/line/area charts)
        if (['bar', 'line', 'area'].includes(this.chartType)) {
            const visibleItems = Math.ceil(data.length * progress);
            const barWidth = this.chartWidth / data.length;
            
            for (let i = 0; i < visibleItems; i++) {
                const x = this.margin.left + (i + 0.5) * barWidth;
                const y = this.height - this.margin.bottom + 20;
                
                // Fade in effect for labels
                const itemProgress = progress * data.length - i;
                const alpha = Math.min(1, Math.max(0, itemProgress));
                this.ctx.globalAlpha = alpha;
                
                this.ctx.fillText(data[i].label, x, y);
            }
        } else if (['pie', 'donut'].includes(this.chartType)) {
            // For pie/donut, we'll draw labels with lines pointing to each segment
            this.drawPieLabels(data, progress);
        }
        
        // Restore context state
        this.ctx.restore();
    }
    
    drawPieLabels(data, progress) {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const radius = Math.min(this.chartWidth, this.chartHeight) / 2;
        const centerX = this.margin.left + this.chartWidth / 2;
        const centerY = this.margin.top + this.chartHeight / 2;
        
        let startAngle = -Math.PI / 2; // Start from top
        
        for (let i = 0; i < data.length; i++) {
            const value = data[i].value;
            const sliceAngle = (value / total) * Math.PI * 2 * progress;
            const midAngle = startAngle + sliceAngle / 2;
            
            // Calculate label position (outside the pie)
            const labelRadius = radius * 1.2;
            const labelX = centerX + Math.cos(midAngle) * labelRadius;
            const labelY = centerY + Math.sin(midAngle) * labelRadius;
            
            // Only draw if segment is visible enough
            if (sliceAngle > 0.1) {
                // Draw line from segment to label
                this.ctx.beginPath();
                this.ctx.moveTo(
                    centerX + Math.cos(midAngle) * radius * 0.85, 
                    centerY + Math.sin(midAngle) * radius * 0.85
                );
                this.ctx.lineTo(labelX, labelY);
                this.ctx.strokeStyle = data[i].color;
                this.ctx.stroke();
                
                // Draw label text
                this.ctx.fillStyle = this.themes[this.theme].text;
                this.ctx.textAlign = midAngle < Math.PI ? 'left' : 'right';
                this.ctx.fillText(
                    `${data[i].label} (${Math.round(value / total * 100)}%)`, 
                    labelX + (midAngle < Math.PI ? 5 : -5), 
                    labelY
                );
            }
            
            startAngle += sliceAngle;
        }
    }
    
    drawLineChart(data, progress = 1) {
        if (!data || data.length === 0) return;

        const { text, grid, gridAlpha } = this.themes[this.theme];
        const lineColors = ['#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#BD10E0'];
        const tension = 0.3; // Controls the curve intensity

        // Calculate max value and point positions
        const maxValue = Math.max(...data.map(item => item.value)) * 1.1; // Add 10% padding
        const pointSpacing = this.chartWidth / (data.length - 1);

        const positions = data.map((item, i) => ({
            x: this.margin.left + i * pointSpacing,
            y: this.margin.top + this.chartHeight * (1 - item.value / maxValue)
        }));

        // --- Drawing Logic ---
        this.ctx.save();
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // --- Draw the CURVED line incrementally ---
        this.ctx.beginPath();
        this.ctx.moveTo(positions[0].x, positions[0].y);

        const totalPointsToDraw = (data.length - 1) * progress; // Total segments scaled by progress
        const currentSegmentIndex = Math.floor(totalPointsToDraw);
        const progressWithinSegment = totalPointsToDraw - currentSegmentIndex;

        // Draw full curved segments
        for (let i = 0; i < currentSegmentIndex; i++) {
            const p0 = positions[i];
            const p1 = positions[i + 1];
            const cp1x = p0.x + pointSpacing * tension;
            const cp1y = p0.y;
            const cp2x = p1.x - pointSpacing * tension;
            const cp2y = p1.y;
            this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
        }

        // Draw partial curved segment if needed
        if (progress < 1 && currentSegmentIndex < data.length - 1) {
            const p0 = positions[currentSegmentIndex];
            const p1 = positions[currentSegmentIndex + 1];
            const cp1x = p0.x + pointSpacing * tension;
            const cp1y = p0.y;
            const cp2x = p1.x - pointSpacing * tension;
            const cp2y = p1.y;

            const t = progressWithinSegment;
            const mt = 1 - t;

            // Calculate the point on the Bezier curve at time 't'
            const currentX = mt*mt*mt*p0.x + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*p1.x;
            const currentY = mt*mt*mt*p0.y + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*p1.y;

            // Draw the partial bezier segment (using approximation)
            const partialCp1x = p0.x + (cp1x - p0.x) * t;
            const partialCp1y = p0.y + (cp1y - p0.y) * t;
            const midCpX = cp1x + (cp2x - cp1x) * t;
            const midCpY = cp1y + (cp2y - cp1y) * t;
            const partialCp2x = partialCp1x + (midCpX - partialCp1x) * t;
            const partialCp2y = partialCp1y + (midCpY - partialCp1y) * t;
            this.ctx.bezierCurveTo(partialCp1x, partialCp1y, partialCp2x, partialCp2y, currentX, currentY);

        }

        // Apply line color
        const lineColor = lineColors[0 % lineColors.length];
        this.ctx.strokeStyle = lineColor;
        this.ctx.stroke();

        // --- Draw points with fade-in effect (remains the same) ---
        for (let i = 0; i < data.length; i++) {
             const pointProgress = Math.max(0, Math.min(1, (totalPointsToDraw - i + 1)));
             if (pointProgress > 0) {
                this.ctx.beginPath();
                this.ctx.arc(positions[i].x, positions[i].y, 5, 0, Math.PI * 2);
                this.ctx.fillStyle = lineColor;
                let alpha = Math.min(1, pointProgress * 5);
                 if (i === 0) {
                     alpha = Math.min(1, progress * data.length * 2);
                 }
                this.ctx.globalAlpha = alpha;
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
             }
        }

        this.ctx.restore();
    }

    drawAreaChart(data, progress = 1) {
        if (!data || data.length === 0) return;

        const { text, grid, gridAlpha } = this.themes[this.theme];
        const areaColors = ['rgba(74, 144, 226, 0.3)', 'rgba(80, 227, 194, 0.3)', 'rgba(245, 166, 35, 0.3)'];
        const lineColors = ['#4A90E2', '#50E3C2', '#F5A623'];
        const tension = 0.3; // Controls the curve intensity

        // Calculate max value and point positions
        const maxValue = Math.max(...data.map(item => item.value)) * 1.1;
        const pointSpacing = this.chartWidth / (data.length - 1);

        const positions = data.map((item, i) => ({
            x: this.margin.left + i * pointSpacing,
            y: this.margin.top + this.chartHeight * (1 - item.value / maxValue)
        }));

        const chartBottomY = this.margin.top + this.chartHeight;

        // --- Drawing Logic ---
        this.ctx.save();

        // --- Draw the CURVED area fill incrementally ---
        this.ctx.beginPath();
        this.ctx.moveTo(positions[0].x, chartBottomY); // Start from bottom-left
        this.ctx.lineTo(positions[0].x, positions[0].y); // Move to the first data point

        const totalPointsToDraw = (data.length - 1) * progress;
        const currentSegmentIndex = Math.floor(totalPointsToDraw);
        const progressWithinSegment = totalPointsToDraw - currentSegmentIndex;

        // Draw full curved segments for the top edge of the area
        for (let i = 0; i < currentSegmentIndex; i++) {
            const p0 = positions[i];
            const p1 = positions[i + 1];
            const cp1x = p0.x + pointSpacing * tension;
            const cp1y = p0.y;
            const cp2x = p1.x - pointSpacing * tension;
            const cp2y = p1.y;
            this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
        }

        let lastX = positions[0].x; // Keep track of the last X position drawn for closing the area
        let lastY = positions[0].y;

        // Update lastX/Y to the end of the last full segment drawn
        if (currentSegmentIndex > 0 && currentSegmentIndex < positions.length) {
            lastX = positions[currentSegmentIndex].x;
            lastY = positions[currentSegmentIndex].y;
        } else if (positions.length === 1) {
            lastX = positions[0].x;
            lastY = positions[0].y;
        }

        // Draw partial curved segment if needed
        if (progress < 1 && currentSegmentIndex < data.length - 1) {
            const p0 = positions[currentSegmentIndex];
            const p1 = positions[currentSegmentIndex + 1];
            const cp1x = p0.x + pointSpacing * tension;
            const cp1y = p0.y;
            const cp2x = p1.x - pointSpacing * tension;
            const cp2y = p1.y;

            const t = progressWithinSegment;
            const mt = 1 - t;

            // Calculate the point on the Bezier curve at time 't'
            lastX = mt*mt*mt*p0.x + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*p1.x;
            lastY = mt*mt*mt*p0.y + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*p1.y;

            // Draw the partial bezier segment (using approximation)
            const partialCp1x = p0.x + (cp1x - p0.x) * t;
            const partialCp1y = p0.y + (cp1y - p0.y) * t;
            const midCpX = cp1x + (cp2x - cp1x) * t;
            const midCpY = cp1y + (cp2y - cp1y) * t;
            const partialCp2x = partialCp1x + (midCpX - partialCp1x) * t;
            const partialCp2y = partialCp1y + (midCpY - partialCp1y) * t;
            this.ctx.bezierCurveTo(partialCp1x, partialCp1y, partialCp2x, partialCp2y, lastX, lastY);
        }

        // Line down to the bottom for the fill
        this.ctx.lineTo(lastX, chartBottomY);
        this.ctx.lineTo(positions[0].x, chartBottomY); // Back to start bottom-left
        this.ctx.closePath(); // Close the path for filling

        // Apply fill color
        const fillColor = areaColors[0 % areaColors.length];
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();

        // --- Draw the CURVED border line incrementally (same logic as line chart) ---
        this.ctx.beginPath();
        this.ctx.moveTo(positions[0].x, positions[0].y);
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw full curved segments for the border line
        for (let i = 0; i < currentSegmentIndex; i++) {
            const p0 = positions[i];
            const p1 = positions[i + 1];
            const cp1x = p0.x + pointSpacing * tension;
            const cp1y = p0.y;
            const cp2x = p1.x - pointSpacing * tension;
            const cp2y = p1.y;
            this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
        }

        // Draw partial curved segment for the border line if needed
        if (progress < 1 && currentSegmentIndex < data.length - 1) {
            const p0 = positions[currentSegmentIndex];
            const p1 = positions[currentSegmentIndex + 1];
            const cp1x = p0.x + pointSpacing * tension;
            const cp1y = p0.y;
            const cp2x = p1.x - pointSpacing * tension;
            const cp2y = p1.y;

            const t = progressWithinSegment;
            const mt = 1 - t;

            // Calculate the point on the Bezier curve at time 't'
            const currentX = mt*mt*mt*p0.x + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*p1.x;
            const currentY = mt*mt*mt*p0.y + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*p1.y;

            // Draw the partial bezier segment (using approximation)
            const partialCp1x = p0.x + (cp1x - p0.x) * t;
            const partialCp1y = p0.y + (cp1y - p0.y) * t;
            const midCpX = cp1x + (cp2x - cp1x) * t;
            const midCpY = cp1y + (cp2y - cp1y) * t;
            const partialCp2x = partialCp1x + (midCpX - partialCp1x) * t;
            const partialCp2y = partialCp1y + (midCpY - partialCp1y) * t;
            this.ctx.bezierCurveTo(partialCp1x, partialCp1y, partialCp2x, partialCp2y, currentX, currentY);
        }

        // Apply line color for the border
        const lineColor = lineColors[0 % lineColors.length];
        this.ctx.strokeStyle = lineColor;
        this.ctx.stroke();

        // --- Draw points with fade-in effect (remains the same) ---
        for (let i = 0; i < data.length; i++) {
            const pointProgress = Math.max(0, Math.min(1, (totalPointsToDraw - i + 1)));
            if (pointProgress > 0) {
                this.ctx.beginPath();
                this.ctx.arc(positions[i].x, positions[i].y, 5, 0, Math.PI * 2);
                this.ctx.fillStyle = lineColor;
                let alpha = Math.min(1, pointProgress * 5);
                 if (i === 0) {
                     alpha = Math.min(1, progress * data.length * 2);
                 }
                this.ctx.globalAlpha = alpha;
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }
        }

        this.ctx.restore();
    }

    drawBarChart(data, progress = 1) {
        // Calculate maximum value for scaling
        const maxValue = Math.max(...data.map(item => item.value)) * 1.1; // Add 10% padding
        
        // Calculate bar width
        const barWidth = this.chartWidth / data.length;
        const barPadding = barWidth * 0.2; // 20% of bar width
        
        // Draw each bar
        for (let i = 0; i < data.length; i++) {
            // Calculate current bar height based on progress
            const fullHeight = (data[i].value / maxValue) * this.chartHeight;
            
            // Apply animation easing
            // progress will be from 0 to 1 based on the animation controller
            const barProgress = Math.min(1, Math.max(0, progress * data.length - i));
            const height = fullHeight * barProgress;
            
            // Position the bar
            const x = this.margin.left + i * barWidth + barPadding / 2;
            const y = this.margin.top + this.chartHeight - height;
            const width = barWidth - barPadding;
            
            // Draw the bar
            this.ctx.fillStyle = data[i].color;
            this.ctx.fillRect(x, y, width, height);
            
            // Add value label on top of the bar if it's visible enough
            if (height > 20 && barProgress > 0.5) {
                this.ctx.fillStyle = this.themes[this.theme].text;
                this.ctx.font = 'bold 12px Inter';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    data[i].value.toString(), 
                    x + width / 2, 
                    y - 5
                );
            }
        }
    }
    
    drawPieChart(data, progress = 1, isDonut = false) {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const radius = Math.min(this.chartWidth, this.chartHeight) / 2;
        const centerX = this.margin.left + this.chartWidth / 2;
        const centerY = this.margin.top + this.chartHeight / 2;
        
        let startAngle = -Math.PI / 2; // Start from top
        
        // Draw each segment
        for (let i = 0; i < data.length; i++) {
            const value = data[i].value;
            const sliceAngle = (value / total) * Math.PI * 2 * progress;
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            this.ctx.closePath();
            
            this.ctx.fillStyle = data[i].color;
            this.ctx.fill();
            
            // Add white border
            this.ctx.strokeStyle = this.themes[this.theme].background;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            startAngle += sliceAngle;
        }
        
        // If it's a donut chart, cut out the center
        if (isDonut) {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
            this.ctx.fillStyle = this.themes[this.theme].background;
            this.ctx.fill();
            
            // Add total in the center
            this.ctx.fillStyle = this.themes[this.theme].text;
            this.ctx.font = 'bold 24px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(total.toString(), centerX, centerY);
        }
    }
    
    drawStatBar(data, progress) {
        // Constants
        const MAX_ROWS = 4; // Limit to maximum 4 rows
        const rowGap = 140; // Gap between rows
        const containerPadding = 20; // Padding around all stat bars
        
        // Limit data to maximum allowed rows
        const limitedData = data.slice(0, MAX_ROWS);
        const rowCount = limitedData.length;
        
        // Background color
        this.ctx.fillStyle = '#0F1118'; // Match the app's dark background
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Calculate total height needed for all rows
        const totalHeight = rowCount * rowGap;
        
        // Starting Y position (centered vertically)
        const startingY = (this.height - totalHeight) / 2;
        
        // Draw each row
        limitedData.forEach((rowData, rowIndex) => {
            // Extract the main value to display for this row
            const value = rowData.value;
            
            // Configuration
            const barWidth = 14;   // Width of each bar
            const barSpacing = 6;  // Space between bars
            const barHeight = 90;  // Height of each bar
            const totalBars = 20; // Total number of bars to display
            const filledColor = '#A239FF'; // Purple color for filled bars
            const emptyColor = '#EEEEEE';  // Light color for empty bars
            
            // Calculate values
            const maxValue = rowData.max || 100; // Maximum value (default 100)
            const minValue = rowData.min || 0;   // Minimum value (default 0)
            const startValue = rowData.start || 0; // Start value (default 0)
            
            // Apply easing function to make animation smoother
            // This uses cubic easing (ease-in-out)
            const easeInOutCubic = (t) => {
                return t < 0.5
                    ? 4 * t * t * t
                    : 1 - Math.pow(-2 * t + 2, 3) / 2;
            };
            
            // Apply the easing function to our progress
            const easedProgress = easeInOutCubic(progress);
            
            // Calculate how many bars should be filled based on the value
            const filledBarsRatio = (value - minValue) / (maxValue - minValue);
            const totalFilledBars = filledBarsRatio * totalBars;
            const filledBarsExact = totalFilledBars * easedProgress;
            const filledBarsInteger = Math.floor(filledBarsExact);
            const partialFillRatio = filledBarsExact - filledBarsInteger;
            
            // Calculate vertical position for this row
            const rowY = startingY + rowIndex * rowGap;
            
            // Start position (centered horizontally)
            const totalWidth = totalBars * barWidth + (totalBars - 1) * barSpacing;
            const startX = this.width / 2 - totalWidth / 2;
            const startY = rowY;
            
            // Draw bars
            for (let i = 0; i < totalBars; i++) {
                const barX = startX + i * (barWidth + barSpacing);
                
                // Determine fill state
                let isFilled = false;
                let isPartiallyFilled = false;
                let fillRatio = 0;
                
                if (i < filledBarsInteger) {
                    // This bar is completely filled
                    isFilled = true;
                } else if (i === filledBarsInteger && partialFillRatio > 0) {
                    // This bar is partially filled
                    isPartiallyFilled = true;
                    fillRatio = partialFillRatio;
                }
                
                // Set color based on fill state
                this.ctx.fillStyle = (isFilled || isPartiallyFilled) ? filledColor : emptyColor;
                
                // For bars that are completely filled or empty
                if (!isPartiallyFilled) {
                    // Simpler and more accurate approach for pill shape
                    this.ctx.beginPath();
                    const radius = barWidth / 2;
                    this.ctx.arc(barX + radius, startY + radius, radius, Math.PI, 0, false);
                    this.ctx.lineTo(barX + barWidth, startY + barHeight - radius);
                    this.ctx.arc(barX + radius, startY + barHeight - radius, radius, 0, Math.PI, false);
                    this.ctx.closePath();
                    this.ctx.fill();
                } else {
                    // For the bar that's partially filled, we'll draw it in two parts
                    
                    // 1. First draw the empty (background) pill
                    this.ctx.fillStyle = emptyColor;
                    this.ctx.beginPath();
                    const radius = barWidth / 2;
                    this.ctx.arc(barX + radius, startY + radius, radius, Math.PI, 0, false);
                    this.ctx.lineTo(barX + barWidth, startY + barHeight - radius);
                    this.ctx.arc(barX + radius, startY + barHeight - radius, radius, 0, Math.PI, false);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    // 2. Draw the filled portion as a rectangle with proper height
                    this.ctx.fillStyle = filledColor;
                    const filledHeight = barHeight * fillRatio;
                    const filledStartY = startY + barHeight - filledHeight;
                    
                    // Draw a rounded rectangle for the filled portion
                    this.ctx.beginPath();
                    
                    if (fillRatio >= 0.5) {
                        // If filling more than half, include the bottom rounded part
                        this.ctx.arc(barX + radius, startY + barHeight - radius, radius, 0, Math.PI, false);
                        this.ctx.lineTo(barX, filledStartY);
                        this.ctx.lineTo(barX + barWidth, filledStartY);
                        this.ctx.lineTo(barX + barWidth, startY + barHeight - radius);
                    } else {
                        // Just draw a rectangle for small fill amounts
                        this.ctx.rect(barX, filledStartY, barWidth, filledHeight);
                    }
                    
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            }
            
            // Position calculation for exact number placement
            const firstBarX = startX + barWidth/2;
            const lastBarX = startX + totalWidth - barWidth/2;
            const middleBarX = startX + (filledBarsInteger > 0 ? filledBarsInteger : 0) * (barWidth + barSpacing) + barWidth/2;
            
            // Draw label
            this.ctx.fillStyle = '#FFFFFF'; // White text
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(rowData.label || 'Stats ' + (rowIndex + 1), this.width / 2, startY + barHeight + 45);
            
            // Draw value indicators
            this.ctx.fillStyle = '#FFFFFF'; // White text
            this.ctx.font = 'bold 16px Arial';
            
            // Min value (exactly under first bar)
            this.ctx.textAlign = 'left';
            this.ctx.fillText(minValue, firstBarX - 5, startY + barHeight + 25);
            
            // Current value (positioned under the last filled bar)
            // Calculate the displayed value using the eased progress for smoother number changes
            const progressValue = Math.round(minValue + (value - minValue) * easedProgress);
            this.ctx.textAlign = 'center';
            this.ctx.fillText(progressValue, middleBarX, startY + barHeight + 25);
             
            // Max value (exactly under last bar)
            this.ctx.textAlign = 'right';
            this.ctx.fillText(maxValue, lastBarX + 5, startY + barHeight + 25);
             
            // Draw "New Stats" tooltip near the current value if progress is complete
            if (easedProgress >= 0.99) {
                const tooltipX = middleBarX;
                const tooltipY = startY - 45;  // Place tooltip above the bars
                const tooltipWidth = 120;
                const tooltipHeight = 36;
                 
                // Draw tooltip bubble
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                // Rounded rectangle tooltip with 18px border radius
                const cornerRadius = tooltipHeight / 2;  // Fully rounded corners for pill shape
                this.ctx.moveTo(tooltipX - tooltipWidth/2 + cornerRadius, tooltipY);
                this.ctx.lineTo(tooltipX + tooltipWidth/2 - cornerRadius, tooltipY);
                this.ctx.arcTo(tooltipX + tooltipWidth/2, tooltipY, tooltipX + tooltipWidth/2, tooltipY + cornerRadius, cornerRadius);
                this.ctx.lineTo(tooltipX + tooltipWidth/2, tooltipY + tooltipHeight - cornerRadius);
                this.ctx.arcTo(tooltipX + tooltipWidth/2, tooltipY + tooltipHeight, tooltipX + tooltipWidth/2 - cornerRadius, tooltipY + tooltipHeight, cornerRadius);
                this.ctx.lineTo(tooltipX + cornerRadius, tooltipY + tooltipHeight);
                this.ctx.arcTo(tooltipX - tooltipWidth/2, tooltipY + tooltipHeight, tooltipX - tooltipWidth/2, tooltipY + tooltipHeight - cornerRadius, cornerRadius);
                this.ctx.lineTo(tooltipX - tooltipWidth/2, tooltipY + cornerRadius);
                this.ctx.arcTo(tooltipX - tooltipWidth/2, tooltipY, tooltipX - tooltipWidth/2 + cornerRadius, tooltipY, cornerRadius);
                 
                // Arrow at the bottom
                this.ctx.moveTo(tooltipX - 10, tooltipY + tooltipHeight);
                this.ctx.lineTo(tooltipX, tooltipY + tooltipHeight + 20);  // Make the arrow longer and more pointed
                this.ctx.lineTo(tooltipX + 10, tooltipY + tooltipHeight);
                 
                this.ctx.fill();
                 
                // Draw tooltip text
                this.ctx.fillStyle = '#000000';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('New Stats ' + (rowIndex + 1), tooltipX, tooltipY + tooltipHeight/2 + 5);
            }
        }); // End of forEach loop for each data row
    }
    
    render(data, progress = 1) {
        // Clear canvas and prepare background
        this.clear();
        
        // Draw axes for certain chart types
        if (['bar', 'line', 'area'].includes(this.chartType)) {
            this.drawAxes();
        }
        
        // Draw the appropriate chart type
        switch (this.chartType) {
            case 'bar':
                this.drawBarChart(data, progress);
                break;
            case 'line':
                this.drawLineChart(data, progress);
                break;
            case 'area':
                this.drawAreaChart(data, progress);
                break;
            case 'pie':
                this.drawPieChart(data, progress, false);
                break;
            case 'donut':
                this.drawPieChart(data, progress, true);
                break;
            case 'statBar':
                this.drawStatBar(data, progress);
                break;
        }
        
        // Draw labels
        this.drawLabels(data, progress);
    }
    
    hexToRgba(hex, alpha) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse the hex values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Return rgba string
        return `rgba(${r},${g},${b},${alpha})`;
    }
    
    // Get the canvas for recording
    getCanvas() {
        return this.canvas;
    }
}
