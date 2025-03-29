// Data manager module - Handles data processing and formatting

export class DataManager {
    constructor() {
        this.data = [];
        this.defaultColors = [
            '#4A7CFF', // Blue
            '#FF4A7C', // Red
            '#7CFF4A', // Green
            '#FFC44A', // Orange
            '#4AFFDF', // Teal
            '#C44AFF', // Purple
            '#FFDF4A', // Yellow
            '#4AC4FF', // Light Blue
            '#FF4AC4'  // Pink
        ];
    }
    
    setData(data) {
        this.data = data;
    }
    
    getData() {
        return this.data;
    }
    
    importCSV(csvContent) {
        // Parse CSV content
        const lines = csvContent.split('\n');
        const result = [];
        
        // Find header row
        const headerRow = lines[0].split(',');
        let labelIndex = 0;
        let valueIndex = 1;
        
        // Try to detect columns by header names
        for (let i = 0; i < headerRow.length; i++) {
            const header = headerRow[i].toLowerCase().trim();
            if (header.includes('label') || header.includes('name') || header.includes('category')) {
                labelIndex = i;
            } else if (header.includes('value') || header.includes('amount') || header.includes('count')) {
                valueIndex = i;
            }
        }
        
        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Skip empty lines
            
            const values = lines[i].split(',');
            if (values.length <= Math.max(labelIndex, valueIndex)) continue;
            
            const label = values[labelIndex].trim();
            const value = parseFloat(values[valueIndex].trim());
            
            if (label && !isNaN(value)) {
                result.push({
                    label,
                    value,
                    color: this.defaultColors[(i - 1) % this.defaultColors.length]
                });
            }
        }
        
        // Update data if we have valid rows
        if (result.length > 0) {
            this.data = result;
        }
        
        return result;
    }
    
    exportCSV() {
        if (this.data.length === 0) return '';
        
        // Create header row
        let csvContent = 'Label,Value,Color\n';
        
        // Add data rows
        this.data.forEach(item => {
            csvContent += `${item.label},${item.value},${item.color}\n`;
        });
        
        return csvContent;
    }
    
    // Generate sample data for each chart type
    generateSampleData(type) {
        switch(type) {
            case 'bar':
            case 'pie':
            case 'donut':
                return this.generateCategoricalData();
                
            case 'line':
            case 'area':
                return this.generateTimeSeriesData();
                
            default:
                return this.generateCategoricalData();
        }
    }
    
    generateCategoricalData() {
        const categories = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'];
        return categories.map((label, index) => ({
            label,
            value: Math.floor(Math.random() * 90) + 10, // Random value between 10-100
            color: this.defaultColors[index % this.defaultColors.length]
        }));
    }
    
    generateTimeSeriesData() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const color = this.defaultColors[Math.floor(Math.random() * this.defaultColors.length)];
        
        return months.map(label => ({
            label,
            value: Math.floor(Math.random() * 90) + 10, // Random value between 10-100
            color
        }));
    }
}
