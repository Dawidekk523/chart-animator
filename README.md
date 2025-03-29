# Chart Animator

A sleek web application for creating beautiful chart animations with easy export options to MP4 and GIF formats.

## Features

- Create animated visualizations with 5 chart types:
  - Bar Charts
  - Line Charts
  - Area Charts
  - Pie Charts
  - Donut Charts
- Customizable animation settings (duration, easing effects)
- Beautiful themes (dark, light, gradient)
- Import data from CSV files
- Export animations as MP4 videos or GIF images
- Responsive design works on all devices

## How to Use

1. **Select a Chart Template**: Choose from bar, line, area, pie, or donut chart types
2. **Input Your Data**: Add data points manually or import from a CSV file
3. **Customize Animation**: Adjust duration, easing effect, and theme
4. **Generate Animation**: Click the Generate button to create your animation
5. **Preview**: Use the timeline controls to preview your animation
6. **Export**: Export your animation as MP4 or GIF with customizable quality settings

## Implementation Details

Chart Animator is built with pure JavaScript and HTML5 Canvas for rendering charts, without relying on external charting libraries. This approach provides maximum flexibility for animations and visual styling.

Key components:

- **ChartRenderer**: Handles all chart drawing on HTML5 Canvas
- **AnimationController**: Manages animation timing and easing functions
- **DataManager**: Processes user data and CSV imports
- **ExportManager**: Handles MP4 and GIF exports using browser APIs

## Getting Started

Simply open `index.html` in your web browser to start using Chart Animator. No installation or build steps required!

```bash
# Navigate to the project directory
cd /path/to/chart-animator

# Start a local server (if you have Python installed)
python -m http.server 8000

# Or with Node.js
npx serve
```

Then open your browser and navigate to `http://localhost:8000`

## License

MIT
