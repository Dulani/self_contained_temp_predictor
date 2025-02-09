// Data storage
let timeSeriesData = [];

// Create tooltip element
const tooltip = document.createElement('div');
tooltip.id = 'custom-tooltip';
tooltip.style.position = 'absolute';
tooltip.style.display = 'none';
tooltip.style.backgroundColor = 'rgba(0,0,0,0.8)';
tooltip.style.color = 'white';
tooltip.style.padding = '8px';
tooltip.style.borderRadius = '4px';
tooltip.style.fontSize = '12px';
tooltip.style.pointerEvents = 'none';
tooltip.style.zIndex = '1000';
tooltip.style.whiteSpace = 'pre-line';

// Load data from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add tooltip to document
    document.body.appendChild(tooltip);
    
    const savedData = localStorage.getItem('timeSeriesData');
    if (savedData) {
        timeSeriesData = JSON.parse(savedData);
        updatePlot();
    }

    // Set current date and time in the input
    const now = new Date();
    const dateString = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    document.getElementById('datetime').value = dateString;
});

// Add data point
document.getElementById('add-data').addEventListener('click', () => {
    const datetime = document.getElementById('datetime').value;
    const value = parseFloat(document.getElementById('value').value);

    if (!datetime || isNaN(value)) {
        alert('Please enter both date/time and value');
        return;
    }

    // Parse date and ensure it's in the correct timezone
    const date = new Date(datetime);
    if (isNaN(date.getTime())) {
        alert('Invalid date format');
        return;
    }
    
    // Adjust for timezone to ensure consistent timestamps
    const timestamp = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes()
    );
    
    timeSeriesData.push({
        time: timestamp,
        value: value
    });

    // Sort data by time
    timeSeriesData.sort((a, b) => a.time - b.time);

    // Save to localStorage
    localStorage.setItem('timeSeriesData', JSON.stringify(timeSeriesData));

    // Update visualization
    updatePlot();
    
    // Clear input fields
    document.getElementById('value').value = '';
});

// Export CSV
document.getElementById('export-csv').addEventListener('click', () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
        'DateTime,Value\n' +
        timeSeriesData.map(row => {
            return `${new Date(row.time).toISOString()},${row.value}`;
        }).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'time_series_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Clear data
document.getElementById('clear-data').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        // Clear data from localStorage
        localStorage.removeItem('timeSeriesData');
        
        // Reset application state
        timeSeriesData = [];
        
        // Reset prediction info if visible
        const predictionInfo = document.getElementById('prediction-info');
        predictionInfo.classList.add('hidden');
        
        // Update visualization
        updatePlot();
    }
});

// Show prediction
document.getElementById('predict').addEventListener('click', () => {
    if (timeSeriesData.length < 2) {
        alert('Need at least 2 data points for prediction');
        return;
    }

    const predictionInfo = document.getElementById('prediction-info');
    predictionInfo.classList.remove('hidden');

    // Prepare data for regression
    const xValues = timeSeriesData.map(d => d.time);
    const yValues = timeSeriesData.map(d => d.value);

    // Use milliseconds since epoch for regression
    const points = xValues.map((x, i) => [x, yValues[i]]);
    const regression = ss.linearRegression(points);
    
    // Create regression line function that works with timestamps
    const regressionLine = timestamp => regression.m * timestamp + regression.b;
    
    // Calculate future value (24 hours ahead)
    const lastTime = xValues[xValues.length - 1];
    const futureTime = lastTime + (24 * 60 * 60 * 1000); // 24 hours in milliseconds
    const futureValue = regressionLine(futureTime);
    console.log('Regression data:', {
        points,
        regression,
        futureTime,
        futureValue
    });

    // Update prediction info
    document.getElementById('future-value').textContent = 
        `Predicted value in 24 hours: ${futureValue.toFixed(2)}`;

    // Calculate when a specific value will be reached
    const targetValue = Math.max(...yValues) * 1.5; // Example: 50% higher than max value
    // Calculate time to reach target value
    const timeToTarget = (targetValue - regression.b) / regression.m;
    const targetTime = new Date(timeToTarget);
    
    document.getElementById('target-time').textContent = 
        `Estimated time to reach ${targetValue.toFixed(2)}: ${targetTime.toLocaleString()}`;

    updatePlot(regression, regressionLine);
});

// Update Vega-Lite plot
function updatePlot(regression = null, regressionLine = null) {
    // Calculate time domain focusing on actual data range
    const times = timeSeriesData.map(d => d.time);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    // Add padding (2 hours before and after)
    const paddingTime = 2 * 60 * 60 * 1000;
    const domainStart = new Date(minTime - paddingTime);
    const domainEnd = new Date(maxTime + (regression ? 24 * 60 * 60 * 1000 : 0) + paddingTime);
    
    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": "container",
        "height": 300,
        "usermeta": {"embedOptions": {"actions": false}},
        "layer": [
            {
                "data": {
                    "values": timeSeriesData.map(d => ({
                        "time": new Date(d.time).toISOString(),
                        "value": d.value
                    }))
                },
                "mark": {
                    "type": "point",
                    "filled": true,
                    "size": 100
                },
                "encoding": {
                    "x": {
                        "field": "time",
                        "type": "temporal",
                        "title": "Time",
                        "scale": {
                            "type": "utc",
                            "domain": [
                                domainStart.toISOString(),
                                domainEnd.toISOString()
                            ],
                            "nice": "hour"
                        }
                    },
                    "y": {
                        "field": "value",
                        "type": "quantitative",
                        "title": "Value"
                    },
                    "tooltip": [
                        {"field": "time", "type": "temporal", "title": "Time"},
                        {"field": "value", "type": "quantitative", "title": "Value"}
                    ]
                }
            }
        ]
    };

    // Add regression line if available
    if (regression) {
        // Generate dense interpolation for regression line with hover support
        const firstTime = timeSeriesData[0].time;
        const lastTime = timeSeriesData[timeSeriesData.length - 1].time;
        const futureTime = lastTime + (24 * 60 * 60 * 1000);
        
        const numSamples = 1000; // Increased for even smoother interaction
        const timeIncrement = (futureTime - firstTime) / numSamples;
        
        const regressionData = [];
        for (let i = 0; i <= numSamples; i++) {
            const t = firstTime + i * timeIncrement;
            // Calculate predicted value using actual timestamp
            const predicted = regressionLine ? regressionLine(t) : 0;
            const validDate = new Date(t);
            
            // Ensure date is valid before adding to regression data
            if (!isNaN(validDate.getTime())) {
                regressionData.push({
                    time: validDate.toISOString(),
                    predicted: predicted
                });
            }
        }

        // Add regression visualization with custom hover interaction
        const regressionLayer = {
            "data": {"values": regressionData},
            "layer": [
                {
                    "mark": {"type": "line", "color": "red", "strokeWidth": 3},
                    "encoding": {
                        "x": {"field": "time", "type": "temporal"},
                        "y": {"field": "predicted", "type": "quantitative"}
                    }
                }
            ]
        };
        spec.layer.push(regressionLayer);
    }

    // Render plot and set up hover interaction
    vegaEmbed('#plot', spec, {actions: false}).then(() => {
        if (regression && regressionLine) {
            const plotArea = document.querySelector('.marks');
            const rect = plotArea.getBoundingClientRect();
            const tooltip = document.getElementById('custom-tooltip');
            const firstTime = timeSeriesData[0].time;
            const lastTime = timeSeriesData[timeSeriesData.length - 1].time;
            const futureTime = lastTime + (24 * 60 * 60 * 1000);
            
            // Calculate domain range for time interpolation
            const times = timeSeriesData.map(d => d.time);
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);
            const paddingTime = 2 * 60 * 60 * 1000; // 2 hours padding
            const domainStart = new Date(minTime - paddingTime).getTime();
            const domainEnd = new Date(maxTime + (24 * 60 * 60 * 1000) + paddingTime).getTime();
            
            console.log('Time domain:', {
                start: new Date(domainStart).toLocaleString(),
                end: new Date(domainEnd).toLocaleString(),
                range: (domainEnd - domainStart) / (60 * 60 * 1000) + ' hours'
            });
            
            plotArea.addEventListener('mousemove', (event) => {
                const x = event.clientX - rect.left;
                const xScale = (x / rect.width);
                
                if (xScale >= 0 && xScale <= 1) {
                    const timeRange = domainEnd - domainStart;
                    const currentTime = domainStart + (timeRange * xScale);
                    const predictedValue = regressionLine(currentTime);
                    
                    tooltip.style.display = 'block';
                    tooltip.style.left = (event.clientX + 10) + 'px';
                    tooltip.style.top = (event.clientY + 10) + 'px';
                    tooltip.textContent = `Time: ${new Date(currentTime).toLocaleString()}\nPredicted: ${predictedValue.toFixed(2)}`;
                    
                    console.log('Hover position:', {
                        xPercent: (xScale * 100).toFixed(1) + '%',
                        time: new Date(currentTime).toLocaleString(),
                        value: predictedValue.toFixed(2)
                    });
                }
            });
            
            plotArea.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }
    });
}
