# Self-Contained Temperature Predictor

A standalone web application for visualizing and predicting time series data, with a focus on temperature measurements. This application runs entirely in the browser with minimal external dependencies.

## Features

1. **Standalone Web Application**
   - Static HTML/JS implementation
   - Minimal external dependencies
   - Runs entirely in the browser

2. **Time Input**
   - Up-to-date date/time picker
   - Automatically sets to current time
   - Manual time adjustment capability

3. **Temperature Input**
   - Numeric value input field
   - Validation for proper number format
   - Clear feedback on input requirements

4. **Data Visualization**
   - Interactive Vega-Lite based X-Y plot
   - Time values on X-axis
   - Temperature measurements on Y-axis
   - Interactive tooltips for data points

5. **Data Export**
   - Export all data points to CSV format
   - Includes timestamps and temperature values
   - Downloads directly to user's device

6. **Data Persistence**
   - Automatic storage in browser's localStorage
   - Data survives page refreshes
   - No server required

7. **Prediction Capabilities**
   - Linear regression for trend analysis
   - Future value prediction
   - Visual trend line display
   - 24-hour forecast calculation

8. **Future Value Estimation**
   - Hover functionality for detailed information
   - Predicts when specific temperatures will be reached
   - Uses forecast line for calculations
   - Clear display of prediction results

## Dependencies
- Vega-Lite for data visualization
- Simple-Statistics for linear regression calculations

## Usage
1. Open index.html in a web browser
2. Enter date/time and temperature values
3. Click "Add Data Point" to record measurements
4. Use "Show Prediction" to see future estimates
5. Export data using the "Export CSV" button

All data is stored locally in your browser and can be exported as needed.
