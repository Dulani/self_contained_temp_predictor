// Data storage
let timeSeriesData = [];

// Load data from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('timeSeriesData');
    if (savedData) {
        timeSeriesData = JSON.parse(savedData);
        updatePlot();
    }

    // Set current date and time in the input
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('datetime').value = now.toISOString().slice(0, 16);
});

// Add data point
document.getElementById('add-data').addEventListener('click', () => {
    const datetime = document.getElementById('datetime').value;
    const value = parseFloat(document.getElementById('value').value);

    if (!datetime || isNaN(value)) {
        alert('Please enter both date/time and value');
        return;
    }

    timeSeriesData.push({
        time: new Date(datetime).getTime(),
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

    // Calculate linear regression
    const regression = ss.linearRegression(xValues.map((x, i) => [x, yValues[i]]));
    
    // Calculate future value (24 hours ahead)
    const lastTime = xValues[xValues.length - 1];
    const futureTime = lastTime + (24 * 60 * 60 * 1000); // 24 hours in milliseconds
    const futureValue = regression.m * futureTime + regression.b;

    // Update prediction info
    document.getElementById('future-value').textContent = 
        `Predicted value in 24 hours: ${futureValue.toFixed(2)}`;

    // Calculate when a specific value will be reached
    const targetValue = Math.max(...yValues) * 1.5; // Example: 50% higher than max value
    const targetTime = (targetValue - regression.b) / regression.m;
    
    document.getElementById('target-time').textContent = 
        `Estimated time to reach ${targetValue.toFixed(2)}: ${new Date(targetTime).toLocaleString()}`;

    updatePlot(regression);
});

// Update Vega-Lite plot
function updatePlot(regression = null) {
    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": "container",
        "height": 300,
        "data": {
            "values": timeSeriesData.map(d => ({
                "time": new Date(d.time).toISOString(),
                "value": d.value
            }))
        },
        "layer": [{
            "mark": {
                "type": "point",
                "filled": true,
                "size": 100
            },
            "encoding": {
                "x": {
                    "field": "time",
                    "type": "temporal",
                    "title": "Time"
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
        }]
    };

    // Add regression line if available
    if (regression) {
        const regressionData = timeSeriesData.map(d => ({
            time: new Date(d.time).toISOString(),
            predicted: regression.m * d.time + regression.b
        }));

        // Add future point
        const lastTime = timeSeriesData[timeSeriesData.length - 1].time;
        const futureTime = lastTime + (24 * 60 * 60 * 1000);
        regressionData.push({
            time: new Date(futureTime).toISOString(),
            predicted: regression.m * futureTime + regression.b
        });

        spec.layer.push({
            "data": {"values": regressionData},
            "mark": {"type": "line", "color": "red"},
            "encoding": {
                "x": {"field": "time", "type": "temporal"},
                "y": {"field": "predicted", "type": "quantitative"}
            }
        });
    }

    vegaEmbed('#plot', spec, {actions: false});
}
