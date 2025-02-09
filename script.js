// Data storage
let timeSeriesData = [];

// Helper function to format dates for datetime-local input
const formatDateForInput = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

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

    // Set current date and time in the input (ensure valid initial date)
    const now = new Date();
    // Use a fixed date in 2025 for testing
    const initialDate = new Date(Date.UTC(2025, 1, 9, 18, 32)); // Feb 9, 2025, 18:32 UTC
    
    // Create properly formatted date string
    const dateString = formatDateForInput(initialDate);
    
    // Set initial date and verify it's valid
    const datetimeInput = document.getElementById('datetime');
    datetimeInput.value = dateString;
    datetimeInput.defaultValue = dateString;  // Set default value to maintain format
    datetimeInput.min = '1970-01-01T00:00';
    datetimeInput.max = '2999-12-31T23:59';
    
    // Add event listener to ensure date format is maintained
    datetimeInput.addEventListener('change', (e) => {
        const [datePart, timePart] = e.target.value.split('T');
        if (!datePart || !timePart) return;

        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);

        // Create date using UTC to avoid timezone issues
        const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
        
        if (!isNaN(utcDate.getTime())) {
            const formattedDate = formatDateForInput(utcDate);
            e.target.value = formattedDate;
            
            console.log('Date input changed:', {
                inputValue: e.target.value,
                utcDate: utcDate.toISOString(),
                formattedValue: formatDateForInput(utcDate)
            });
        }
    });
    
    console.log('Initial date setup:', {
        date: initialDate.toISOString(),
        formattedString: dateString,
        utcComponents: {
            year: initialDate.getUTCFullYear(),
            month: initialDate.getUTCMonth() + 1,
            day: initialDate.getUTCDate(),
            hours: initialDate.getUTCHours(),
            minutes: initialDate.getUTCMinutes()
        }
    });
});

// Add data point
document.getElementById('add-data').addEventListener('click', () => {
    const datetimeInput = document.getElementById('datetime');
    const datetime = datetimeInput.getAttribute('value') || datetimeInput.value;
    const value = parseFloat(document.getElementById('value').value);
    
    console.log('Add data point clicked:', {
        rawDatetime: datetime,
        inputElement: {
            value: datetimeInput.value,
            defaultValue: datetimeInput.defaultValue,
            attributeValue: datetimeInput.getAttribute('value'),
            type: datetimeInput.type
        }
    });
    
    console.log('Add data point clicked:', {
        rawDatetime: datetime,
        inputElement: {
            value: datetimeInput.value,
            defaultValue: datetimeInput.defaultValue,
            type: datetimeInput.type
        }
    });

    if (!datetime || isNaN(value)) {
        alert('Please enter both date/time and value');
        return;
    }

    // Parse and validate date using existing datetimeInput variable
    const inputValue = datetimeInput.value;
    
    const [datePart, timePart] = inputValue.split('T');
    if (!datePart || !timePart) {
        alert('Invalid date format. Please use YYYY-MM-DDTHH:mm format.');
        return;
    }

    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Create date using UTC to avoid timezone issues
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    
    console.log('Datetime input processing:', {
        originalInput: datetime,
        inputValue,
        elementValue: datetimeInput.value,
        formattedDate: formatDateForInput(utcDate),
        components: { year, month, day, hours, minutes },
        utcDate: utcDate.toISOString()
    });
    
    console.log('Parsed datetime components:', {
        datePart,
        timePart,
        components: { year, month, day, hours, minutes },
        utcDate: utcDate.toISOString()
    });
    
    // Validate date components
    if (isNaN(utcDate.getTime()) || 
        year < 1970 || year > 3000 || 
        month < 1 || month > 12 || 
        day < 1 || day > 31 || 
        hours < 0 || hours > 23 || 
        minutes < 0 || minutes > 59) {
        alert('Invalid date. Please enter a valid date between 1970 and 3000.');
        return;
    }
    
    // Format date for display using our helper function
    const formattedDate = formatDateForInput(utcDate);
    
    console.log('Date parsing:', {
        input: datetime,
        components: { year, month, day, hours, minutes },
        utcDate: utcDate.toISOString(),
        formattedDate
    });
    
    // Create UTC timestamp in milliseconds since epoch
    const timestamp = utcDate.getTime();
    
    // Check if this timestamp already exists
    if (timeSeriesData.some(d => d.time === timestamp)) {
        alert('A data point already exists for this time. Please choose a different time.');
        return;
    }
    
    // Validate timestamp is within reasonable range
    const now = new Date();
    const fiveYearsFromNow = new Date(Date.UTC(
        now.getUTCFullYear() + 5,
        now.getUTCMonth(),
        now.getUTCDate()
    ));
    if (timestamp > fiveYearsFromNow.getTime()) {
        alert('Please enter a date within the next 5 years.');
        return;
    }
    
    console.log('Date validation:', {
        input: datetime,
        utcDate: utcDate.toISOString(),
        timestamp,
        formattedDate
    });
    
    console.log('Adding data point:', {
        inputDateTime: datetime,
        utcDate: utcDate.toISOString(),
        timestamp,
        value,
        validationChecks: {
            isValid: !isNaN(timestamp),
            isFuture: timestamp > now.getTime(),
            isWithinRange: timestamp <= fiveYearsFromNow.getTime()
        }
    });
    
    // Add new data point
    const newPoint = {
        time: timestamp,
        value: Number(value)
    };
    
    console.log('Adding new point:', {
        point: newPoint,
        existingPoints: timeSeriesData.map(d => ({
            time: new Date(d.time).toISOString(),
            value: d.value
        }))
    });
    
    timeSeriesData.push(newPoint);

    // Sort data by time
    timeSeriesData.sort((a, b) => a.time - b.time);
    
    console.log('Updated time series:', {
        points: timeSeriesData.map(d => ({
            time: new Date(d.time).toISOString(),
            value: d.value
        })),
        count: timeSeriesData.length,
        timeRange: timeSeriesData.length > 1 ? {
            start: new Date(Math.min(...timeSeriesData.map(d => d.time))).toISOString(),
            end: new Date(Math.max(...timeSeriesData.map(d => d.time))).toISOString(),
            hours: (Math.max(...timeSeriesData.map(d => d.time)) - Math.min(...timeSeriesData.map(d => d.time))) / (60 * 60 * 1000)
        } : null
    });

    // Save to localStorage
    localStorage.setItem('timeSeriesData', JSON.stringify(timeSeriesData));

    // Update visualization
    updatePlot();
    
    // Clear value input and increment datetime by 15 minutes for next point
    document.getElementById('value').value = '';
    
    // Calculate next date using UTC to maintain consistency
    const nextDate = new Date(utcDate.getTime() + 15 * 60 * 1000);
    
    // Format next date string using our helper function
    const nextDateString = formatDateForInput(nextDate);
    document.getElementById('datetime').value = nextDateString;
    
    console.log('Next data point setup:', {
        currentDate: utcDate.toISOString(),
        nextDate: nextDate.toISOString(),
        formattedString: nextDateString
    });
    
    console.log('Data point added:', {
        currentPoints: timeSeriesData.map(d => ({
            time: new Date(d.time).toISOString(),
            value: d.value
        }))
    });
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
        
        // Remove any existing hover listeners
        const plotArea = document.querySelector('.marks');
        if (plotArea) {
            plotArea.replaceWith(plotArea.cloneNode(true));
        }
        
        // Reset datetime input to current time
        const now = new Date();
        const dateString = now.toISOString().slice(0, 16);
        document.getElementById('datetime').value = dateString;
        document.getElementById('value').value = '';
        
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

    // Prepare and validate data for regression
    console.log('Raw time series data:', timeSeriesData);
    
    const xValues = timeSeriesData.map(d => d.time);
    const yValues = timeSeriesData.map(d => d.value);
    
    console.log('Input data:', {
        timestamps: xValues.map(t => new Date(t).toISOString()),
        values: yValues,
        timeRange: (Math.max(...xValues) - Math.min(...xValues)) / (60 * 60 * 1000) + ' hours'
    });

    // Verify we have at least two different timestamps
    const uniqueTimes = new Set(xValues);
    if (uniqueTimes.size < 2) {
        alert('Need at least 2 different time points for prediction');
        return;
    }

    // Normalize timestamps for regression to prevent numerical precision issues
    const firstTimestamp = Math.min(...xValues);
    const lastTimestamp = Math.max(...xValues);
    
    // Ensure we have a valid time range
    if (lastTimestamp === firstTimestamp) {
        alert('Time points must be different for prediction');
        return;
    }
    
    // Convert to hours for better numerical stability and ensure numeric values
    const timeScale = 60 * 60 * 1000; // milliseconds to hours
    const normalizedX = xValues.map(x => (x - firstTimestamp) / timeScale);
    const numericY = yValues.map(y => Number(y));
    
    // Create regression points as [x, y] pairs for simple-statistics
    const points = normalizedX.map((x, i) => [Number(x), Number(numericY[i])]);
    
    // Store time normalization info for later use
    const timeNormalization = {
        offset: firstTimestamp,
        scale: timeScale
    };
    
    // Verify regression input data
    const validPoints = points.every(([x, y]) => 
        !isNaN(x) && isFinite(x) && !isNaN(y) && isFinite(y)
    );
    
    console.log('Regression input data:', {
        originalPoints: timeSeriesData.map(d => ({
            time: new Date(d.time).toISOString(),
            value: d.value
        })),
        normalizedPoints: points,
        timeRange: {
            start: new Date(firstTimestamp).toISOString(),
            end: new Date(lastTimestamp).toISOString(),
            hours: (lastTimestamp - firstTimestamp) / timeScale
        },
        validPoints
    });
    
    if (!validPoints) {
        console.error('Invalid regression points:', points);
        alert('Error: Invalid data for regression calculation');
        return;
    }
    
    // Validate regression input data
    const validInput = points.every(point => 
        point.length === 2 && 
        !isNaN(point[0]) && 
        isFinite(point[0]) && 
        !isNaN(point[1]) && 
        isFinite(point[1])
    );
    
    if (!validInput) {
        console.error('Invalid regression input data:', points);
        alert('Error: Invalid data for regression calculation');
        return;
    }
    
    // Verify we have at least two different x values
    const uniqueX = new Set(points.map(p => p[0]));
    if (uniqueX.size < 2) {
        console.error('Need at least two different x values for regression');
        alert('Error: Need at least two different time points for regression');
        return;
    }
    
    console.log('Regression input:', {
        points,
        uniqueXValues: Array.from(uniqueX).sort(),
        timeRangeHours: Math.max(...points.map(p => p[0])) - Math.min(...points.map(p => p[0]))
    });
    
    // Calculate regression using simple-statistics
    const regression = ss.linearRegression(points);
    const regressionFunc = ss.linearRegressionLine(regression);
    
    console.log('Regression model:', {
        points,
        slope: regression.m,
        intercept: regression.b,
        equation: `y = ${regression.m.toFixed(4)}x + ${regression.b.toFixed(4)}`
    });
    
    // Create regression line function that works with normalized timestamps
    const regressionLine = timestamp => {
        // Convert timestamp to hours using stored normalization
        const normalizedTime = (timestamp - timeNormalization.offset) / timeNormalization.scale;
        
        // Use simple-statistics regression function to predict value
        const predicted = regressionFunc(normalizedTime);
        
        // Validate prediction
        if (isNaN(predicted) || !isFinite(predicted)) {
            console.error('Invalid prediction:', {
                timestamp: new Date(timestamp).toISOString(),
                normalizedTime,
                predicted,
                equation: `y = ${regression.m.toFixed(4)}x + ${regression.b.toFixed(4)}`
            });
            return null;
        }
        
        console.log('Regression prediction:', {
            timestamp: new Date(timestamp).toISOString(),
            normalizedTime,
            predicted,
            equation: `${regression.m.toFixed(4)} * ${normalizedTime.toFixed(4)} + ${regression.b.toFixed(4)} = ${predicted.toFixed(4)}`
        });
        
        return predicted;
    };
    
    // Calculate future value (24 hours ahead)
    const futureTime = lastTimestamp + (24 * 60 * 60 * 1000); // 24 hours in milliseconds
    const futureValue = regressionLine(futureTime);
    
    // Verify regression calculation is working
    const currentValue = regressionLine(lastTimestamp);
    console.log('Regression verification:', {
        currentValue,
        futureValue,
        timeDiff: (futureTime - lastTimestamp) / (60 * 60 * 1000) + ' hours',
        valueDiff: futureValue - currentValue
    });
    
    console.log('Regression calculation:', {
        normalizedPoints: points,
        rawPoints: xValues.map((x, i) => [x, yValues[i]]),
        m: regression.m,
        b: regression.b,
        currentValue: regressionLine(Date.now()),
        futureValue: regressionLine(futureTime),
        lastTime: new Date(lastTime).toISOString(),
        futureTime: new Date(futureTime).toISOString()
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
    let domainStart, domainEnd;
    
    console.log('Time series data before domain calculation:', {
        points: timeSeriesData.map(d => ({
            time: new Date(d.time).toISOString(),
            value: d.value
        })),
        count: timeSeriesData.length
    });
    
    if (timeSeriesData.length === 0) {
        // If no data, show last 24 hours
        const now = new Date();
        domainEnd = now;
        domainStart = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    } else {
        // Extract timestamps and ensure they're numbers
        const times = timeSeriesData.map(d => Number(d.time));
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        console.log('Time range calculation:', {
            timestamps: times.map(t => new Date(t).toISOString()),
            minTime: new Date(minTime).toISOString(),
            maxTime: new Date(maxTime).toISOString(),
            timeRange: (maxTime - minTime) / (60 * 60 * 1000) + ' hours'
        });
        
        // Add padding and future time for predictions
        const paddingTime = 2 * 60 * 60 * 1000; // 2 hours padding
        const futureTime = regression ? (24 * 60 * 60 * 1000) : 0; // 24 hours for predictions
        
        // Calculate domain with proper padding and future time
        domainStart = new Date(minTime - paddingTime);
        domainEnd = new Date(maxTime + futureTime + paddingTime);
        
        console.log('Domain calculations:', {
            start: domainStart.toISOString(),
            end: domainEnd.toISOString(),
            minTime: new Date(minTime).toISOString(),
            maxTime: new Date(maxTime).toISOString(),
            includesFuture: regression,
            paddingHours: paddingTime / (60 * 60 * 1000),
            futureHours: regression ? 24 : 0
        });
    }
    
    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": "container",
        "height": 300,
        "usermeta": {"embedOptions": {"actions": false}},
        "params": [
            {
                "name": "grid",
                "select": "interval",
                "bind": "scales"
            }
        ],
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
                            "nice": "hour",
                            "zoom": true
                        }
                    },
                    "y": {
                        "field": "value",
                        "type": "quantitative",
                        "title": "Value",
                        "scale": {"zoom": true}
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
    if (regression && regressionLine) {
        // Use timestamps from regression calculation for consistency
        const times = timeSeriesData.map(d => d.time);
        const firstTime = Math.min(...times);
        const lastTime = Math.max(...times);
        const futureTime = lastTime + (24 * 60 * 60 * 1000);
        
        const numSamples = 1000; // Increased for even smoother interaction
        const timeIncrement = (futureTime - firstTime) / numSamples;
        
        console.log('Regression data generation:', {
            firstTime: new Date(firstTime).toISOString(),
            lastTime: new Date(lastTime).toISOString(),
            futureTime: new Date(futureTime).toISOString(),
            timeIncrement,
            timeIncrementHours: timeIncrement / (60 * 60 * 1000)
        });
        
        // Generate regression data points
        const regressionData = [];
        let validPoints = 0;
        let invalidPoints = 0;
        
        for (let i = 0; i <= numSamples; i++) {
            const t = firstTime + i * timeIncrement;
            const predicted = regressionLine(t);
            const validDate = new Date(t);
            
            // Only add point if both date and prediction are valid
            if (predicted !== null && !isNaN(validDate.getTime())) {
                regressionData.push({
                    time: validDate.toISOString(),
                    predicted: predicted
                });
                validPoints++;
            } else {
                invalidPoints++;
            }
        }
        
        // Verify we have enough valid points for regression line
        if (regressionData.length < 2) {
            console.error('Not enough valid regression points generated');
            return;
        }
        
        // Debug: Log regression data details
        console.log('Generated regression points:', {
            validPoints,
            invalidPoints,
            totalPoints: regressionData.length,
            expectedPoints: numSamples + 1,
            firstPoint: regressionData[0],
            lastPoint: regressionData[regressionData.length - 1],
            timeRange: {
                start: new Date(firstTime).toISOString(),
                end: new Date(futureTime).toISOString(),
                hours: (futureTime - firstTime) / (60 * 60 * 1000)
            }
        });

        // Add regression visualization with custom hover interaction
        const regressionLayer = {
            "data": {
                "values": regressionData
            },
            "mark": {
                "type": "line",
                "color": "red",
                "strokeWidth": 2,
                "tooltip": true
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
                        "nice": "hour",
                        "zoom": true
                    }
                },
                "y": {
                    "field": "predicted",
                    "type": "quantitative",
                    "title": "Predicted Value",
                    "scale": {"zoom": true}
                },
                "tooltip": [
                    {"field": "time", "type": "temporal", "title": "Time", "format": "%Y-%m-%d %H:%M"},
                    {"field": "predicted", "type": "quantitative", "title": "Predicted Value", "format": ".2f"}
                ]
            }
        };
        console.log('Layer configuration:', {
            mainLayer: {
                x: spec.layer[0].encoding.x,
                y: spec.layer[0].encoding.y
            },
            regressionLayer: {
                x: regressionLayer.encoding.x,
                y: regressionLayer.encoding.y
            },
            regressionData: regressionData.slice(0, 3),
            scalesMatch: 
                JSON.stringify(spec.layer[0].encoding.x.scale) === 
                JSON.stringify(regressionLayer.encoding.x.scale)
        });
        
        spec.layer.push(regressionLayer);
    }

    // Render plot with built-in hover interaction
    vegaEmbed('#plot', spec, {
        actions: false,
        renderer: 'svg',
        hover: true
    });
}
