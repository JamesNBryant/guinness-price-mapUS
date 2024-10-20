// Metric descriptions
const metricDescriptions = {
  'GuinnessPrice': 'Average price of Guinness in USD.',
  'RPP': 'Regional Price Parity index.',
  'DPI': 'Disposable Personal Income per capita.',
  'BigMacPrice': 'Average price of a Big Mac in USD.',
  'GuinnessAffordability': 'RPP divided by Price of Guinness.',
  'BigMacAffordability': 'RPP divided by Big Mac Price.',
  'IrishAncestryNum': 'Total number of pop. claiming Irish ancestry',
  'IrishAncestryPer': 'Percentage of pop. claiming Irish ancestry',
  'Comparison': 'Ratio of selected metrics.'
};

let currentMetric = 'GuinnessPrice'; // Declare globally
let geoData; 
let dataMap = {};
let states; // Declare states globally
let colorScale = d3.scaleSequential(d3.interpolateBlues);
let currentSuggestionIndex = 0;

const width = 960;
const height = 600;

// Ensure no fixed width and height on SVG
const svg = d3.select('#map')
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .attr('preserveAspectRatio', 'xMinYMin meet')
  .classed('svg-content-responsive', true);
   
// Projection and path generator
const projection = d3.geoAlbersUsa()
  .scale(1000)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Create a group for the map elements
const mapGroup = svg.append('g').attr('class', 'map');

// Create a group for the legend elements
const legendGroup = svg.append('g').attr('class', 'legend');

// Define color scales for each metric
const colorScales = {
  'GuinnessPrice': d3.scaleSequential().interpolator(d3.interpolateHcl("#F0D878", "#180000")),
  'RPP': d3.scaleSequential(d3.interpolateBlues),
  'DPI': d3.scaleSequential().interpolator(d3.interpolateHcl("#800080", "#FFFF00")), // From Purple to Yellow
  'BigMacPrice': d3.scaleSequential(d3.interpolateReds),
  'GuinnessAffordability': d3.scaleSequential(d3.interpolateRdYlGn),
  'BigMacAffordability': d3.scaleSequential(d3.interpolateYlGnBu),
  'IrishAncestryNum': d3.scaleSequential(d3.interpolateGreens),
  'IrishAncestryPer': d3.scaleSequential(d3.interpolateGreens),
  'Comparison': d3.scaleSequential(d3.interpolateSpectral)
};

// Zoom Behaviour
const zoom = d3.zoom()
  .scaleExtent([1, 8])
  .on('zoom', (event) => {
    mapGroup.attr('transform', event.transform);
  });

svg.call(zoom);

// Shift the map upwards by 50 units
svg.call(zoom.transform, d3.zoomIdentity.translate(0, -50));

// Disable zoom on scroll by filtering out wheel events
svg.on("wheel.zoom", null);

// Add zoom control buttons
const zoomControls = d3.select('#map').append('div').attr('class', 'zoom-controls');
zoomControls.append('button').text('+').on('click', () => svg.transition().call(zoom.scaleBy, 1.2));
zoomControls.append('button').text('-').on('click', () => svg.transition().call(zoom.scaleBy, 0.8));
zoomControls.append('button').text('Reset View').on('click', () => {
  svg.transition().call(zoom.transform, d3.zoomIdentity);
});

// Tooltip
const tooltip = d3.select('body').append('div')
  .attr('class', 'tooltip');

// Info Box for Suggested Selections
const infoBox = d3.select('body').append('div')
  .attr('class', 'info-box')
  .style('position', 'fixed')
  .style('top', '150px') // Adjusted position
  .style('left', '10px')
  .style('background', 'rgba(255, 255, 255, 0.8)')
  .style('padding', '10px')
  .style('border-radius', '5px')
  .style('max-width', '200px')
  .style('display', 'none'); // Hidden by default

const suggestions = [
  {
    metrics: ['GuinnessPrice'],
    message: 'This map shows the average price of Guinness in USD across different states.'
  },
  {
    metrics: ['RPP'],
    message: 'This map shows the Regional Price Parity index which is defined as the differences in price levels across states, expressed as a percentage of the overall national price level. It\'s similar to PPP but for US states.'
  },
  {
    metrics: ['RPP', 'GuinnessPrice'],
    message: 'This map shows the ratio between RPP and a Pint. Basically, how expensive is a Guinness compared to your purchasing power, on average.'
  },
  {
    metrics: ['GuinnessPrice', 'BigMacPrice'],
    message: 'This compares the prices of a pint of Guinness and a Big Mac. Nevada has one of the greatest discrepencies which expensive booze and cheap food.'
  },
  {
    metrics: ['GuinnessPrice', 'CustomPrice'],
    customPriceValue: 7, // Auto-enter the value 7 into the Custom Price box
    message: 'This map shows the areas more and less expensive than a $7 pint. Blue = cheaper than your local pint, Red = evil prevails (more expensive). Try entering the price of your local pint (in USD) in the box.'
  }
];

// Button to show info box and cycle through suggestions
const suggestionButton = d3.select('#suggestionButton')
  .on('click', () => {
    showNextSuggestion();
  });

  function showNextSuggestion() {
    const suggestion = suggestions[currentSuggestionIndex];
    
    // Update metrics based on the suggestion
    currentMetric = suggestion.metrics[0];
    d3.select('#metricSelect').property('value', currentMetric).dispatch('change');
  
    const isCompared = suggestion.metrics.length > 1;
    d3.select('#compareCheckbox').property('checked', isCompared).dispatch('change');
  
    if (isCompared) {
      const metric2 = suggestion.metrics[1];
      d3.select('#metricSelect2').property('value', metric2).dispatch('change');
      
      // Auto-enter the value 7 into the Custom Price input if specified
      if (metric2 === 'CustomPrice' && suggestion.customPriceValue !== undefined) {
        d3.select('#customPriceInput').property('value', suggestion.customPriceValue).dispatch('input');
      }
    }
  
    // Display the suggestion message
    infoBox.style('display', 'block')
      .html(`<strong>Suggestion ${currentSuggestionIndex + 1} of ${suggestions.length}</strong><br>${suggestion.message}`);
  
    // Move to the next suggestion index
    currentSuggestionIndex = (currentSuggestionIndex + 1) % suggestions.length;
  }  

// Load data
Promise.all([
  d3.json('us-states.geojson'),
  d3.csv('data.csv')
]).then(([loadedGeoData, csvData]) => {
  geoData = loadedGeoData;

  if (!geoData || !geoData.features) {
    console.error('Invalid or missing geoData:', geoData);
    return;
  }

  // Process CSV data
  csvData.forEach(d => {
    dataMap[d.State.trim().toUpperCase()] = {
      GuinnessPrice: parseFloat(d.GuinnessPrice) || 0,
      RPP: parseFloat(d.RPP) || 0,
      DPI: parseFloat(d.DPI) || 0,
      BigMacPrice: parseFloat(d.BigMacPrice) || 0,
      GuinnessAffordability: (parseFloat(d.RPP) / parseFloat(d.GuinnessPrice)) || 0,
      BigMacAffordability: (parseFloat(d.RPP) / parseFloat(d.BigMacPrice)) || 0,
      IrishAncestryNum: parseFloat(d.IrishAncestryNum) || 0,
      IrishAncestryPer: parseFloat(d.IrishAncestryPer) || 0
    };
  });

  // Draw the map
  drawMap();

  // Set up event listeners
  setupEventListeners();

  // Update map with initial metric
  updateMap();
});

// Function to draw the map
function drawMap() {
  states = mapGroup.selectAll('path')
    .data(geoData.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('stroke', '#333')
    .attr('fill', '#ccc') // Initial fill color
    .on('mouseover', handleMouseOver)
    .on('mousemove', handleMouseMove)
    .on('mouseout', handleMouseOut);
}

// Function to set up event listeners 
function setupEventListeners() {
  d3.select('#metricSelect').on('change', function() {
    currentMetric = this.value;
    updateMap();
    hideSuggestion(); // Hide suggestion when user selects a new metric
  });

  d3.select('#compareCheckbox').on('change', function() {
    const isChecked = this.checked;
    d3.select('#metricSelect2').property('disabled', !isChecked);
    if (!isChecked) {
      d3.select('#metricSelect2').property('value', 'GuinnessPrice');
      d3.select('#customPriceInput').style('display', 'none').property('value', '');
      d3.select('#customPriceError').style('display', 'none');
    }
    updateMap();
    hideSuggestion(); // Hide suggestion when user toggles compare
  });

  d3.select('#metricSelect2').on('change', function() {
    const selectedValue = this.value;
    if (selectedValue === 'CustomPrice') {
      d3.select('#customPriceInput').style('display', 'inline-block');
    } else {
      d3.select('#customPriceInput').style('display', 'none').property('value', '');
      d3.select('#customPriceError').style('display', 'none');
    }
    updateMap();
    hideSuggestion(); // Hide suggestion when user selects a new metric
  });

  d3.select('#customPriceInput').on('input', function() {
    updateMap();
    hideSuggestion(); // Hide suggestion when user inputs custom price
  });

  d3.select('#resetButton').on('click', function() {
    // Reset selections to default values
    d3.select('#metricSelect').property('value', 'GuinnessPrice');
    d3.select('#compareCheckbox').property('checked', false);
    d3.select('#metricSelect2').property('disabled', true).property('value', 'GuinnessPrice');
    d3.select('#customPriceInput').style('display', 'none').property('value', '');
    d3.select('#customPriceError').style('display', 'none');
    currentMetric = 'GuinnessPrice';
    updateMap();

    // Reset suggestions
    infoBox.style('display', 'none');
    currentSuggestionIndex = 0;
  });    
}

// Function to hide the suggestion info box
function hideSuggestion() {
  infoBox.style('display', 'none');
}

// Function to update the map
function updateMap() {
  d3.select('#loading').style('display', 'block');
  const isCompared = d3.select('#compareCheckbox').property('checked');
  let metric2 = null;

  if (isCompared) {
    metric2 = d3.select('#metricSelect2').property('value');
  }

  if (metric2 === 'CustomPrice') {
    const customPrice = parseFloat(d3.select('#customPriceInput').property('value'));
    if (isNaN(customPrice) || customPrice <= 0) {
      d3.select('#customPriceError').style('display', 'inline');
      d3.select('#loading').style('display', 'none');
      return; // Exit the function to prevent updating with invalid data
    } else {
      d3.select('#customPriceError').style('display', 'none');
    }
  }

  updateColorScale(currentMetric, metric2);

  states.transition()
    .duration(750)
    .attr('fill', d => {
      const color = getColor(d, metric2);
      return color;
    });

  updateLegend(metric2);
  updateTables(currentMetric, metric2);
  updateMetricDescriptions(currentMetric, metric2);
  d3.select('#loading').style('display', 'none');
}

// Function to update the color scale
function updateColorScale(metric, metric2 = null) {
  let values;

  if (metric2 === 'CustomPrice') {
    const customPrice = parseFloat(d3.select('#customPriceInput').property('value'));
    if (!isNaN(customPrice)) {
      values = Object.values(dataMap)
        .map(d => d[metric])
        .filter(v => isFinite(v));

      const minValue = d3.min(values);
      const maxValue = d3.max(values);

      // Define a diverging scale centered at the custom price
      colorScale = d3.scaleDiverging()
        .domain([minValue, customPrice, maxValue])
        .interpolator(t => d3.interpolateRdBu(1 - t)); // Inverted colors
    } else {
      // Handle invalid custom price
      colorScale = d3.scaleSequential().interpolator(() => '#ccc').domain([0, 1]);
    }
  } else if (metric2) {
    // Existing code for comparing two metrics
    values = Object.values(dataMap)
      .map(d => {
        const value1 = d[metric];
        const value2 = d[metric2];
        return value2 !== 0 ? value1 / value2 : null;
      })
      .filter(v => v !== null && isFinite(v));
    colorScale = colorScales['Comparison'];
    if (values.length > 0) {
      const minValue = d3.min(values);
      const maxValue = d3.max(values);
      colorScale.domain([minValue, maxValue]);
    } else {
      colorScale.domain([0, 1]);
    }
  } else {
    // Existing code for a single metric
    values = Object.values(dataMap)
      .map(d => d[metric])
      .filter(v => isFinite(v));
    colorScale = colorScales[metric] || d3.scaleSequential(d3.interpolateBlues);
    if (values.length > 0) {
      const minValue = d3.min(values);
      const maxValue = d3.max(values);
      colorScale.domain([minValue, maxValue]);
    } else {
      colorScale.domain([0, 1]);
    }
  }
}

// Define formatters for big numbers
const formatNumber = d3.format(",.2f");
const formatInteger = d3.format(",");

// Function to get the color for a state
function getColor(d, metric2 = null) {
  if (!d || !d.properties) {
    return '#ccc'; // Default color for invalid data
  }

  const stateName = d.properties.NAME.toUpperCase();
  const stateData = dataMap[stateName];
  let value = null;

  if (stateData) {
    if (metric2 === 'CustomPrice') {
      value = stateData[currentMetric];
    } else if (metric2) {
      const value1 = stateData[currentMetric];
      const value2 = stateData[metric2];
      if (value2 !== 0) {
        value = value1 / value2;
      }
    } else {
      value = stateData[currentMetric];
    }
  }

  if (value === null || isNaN(value) || !isFinite(value)) {
    return '#ccc';
  }
  return colorScale(value);
}

// Function to handle mouseover event
function handleMouseOver(event, d) {
  const stateName = d.properties.NAME;
  const stateData = dataMap[stateName.toUpperCase()];
  const isCompared = d3.select('#compareCheckbox').property('checked');
  let metric2 = null;
  if (isCompared) {
    metric2 = d3.select('#metricSelect2').property('value');
  }
  let tooltipText = `<strong>${stateName}</strong><br>`;

  if (stateData) {
    if (metric2 === 'CustomPrice') {
      const customPrice = parseFloat(d3.select('#customPriceInput').property('value'));
      const value1 = stateData[currentMetric];
      tooltipText += `${currentMetric}: ${formatNumber(value1)}<br>`;
      tooltipText += `Custom Price: ${formatNumber(customPrice)}<br>`;
      if (!isNaN(customPrice) && customPrice !== 0) {
        const ratio = value1 / customPrice;
        tooltipText += `Ratio: ${formatNumber(ratio)}`;
      }
    } else if (metric2) {
      const value1 = stateData[currentMetric];
      const value2 = stateData[metric2];
      tooltipText += `${currentMetric}: ${formatNumber(value1)}<br>`;
      tooltipText += `${metric2}: ${formatNumber(value2)}<br>`;
      if (value2 !== 0) {
        const ratio = value1 / value2;
        tooltipText += `Ratio: ${formatNumber(ratio)}`;
      }
    } else {
      const value = stateData[currentMetric];
      let formattedValue;
      if (['DPI', 'IrishAncestryNum'].includes(currentMetric)) {
        formattedValue = formatInteger(value);
      } else {
        formattedValue = formatNumber(value);
      }
      tooltipText += `${currentMetric}: ${formattedValue}`;
    }
  } else {
    tooltipText += 'Data not available';
  }

  tooltip.style('opacity', 1)
    .html(tooltipText)
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 28) + 'px');
}   

// Function to handle mousemove event
function handleMouseMove(event) {
  tooltip.style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 28) + 'px');
}

// Function to handle mouseout event
function handleMouseOut() {
  tooltip.style('opacity', 0);
}

// Function to update the legend
function updateLegend(metric2 = null) {
  // Clear existing legend
  legendGroup.selectAll('*').remove();
  svg.selectAll('defs').remove();

  // Legend dimensions
  const legendWidth = 300;
  const legendHeight = 10;

  // Calculate positions
  const legendX = (width - legendWidth) / 2;
  const legendY = height - 70;

  // Append a background rectangle with 70% opacity
  legendGroup.append('rect')
    .attr('x', legendX - 20) // Slight padding on the left
    .attr('y', legendY - 20) // Slight padding on the top
    .attr('width', legendWidth + 30) // Add padding to width
    .attr('height', legendHeight + 40) // Add padding to height
    .attr('fill', 'rgba(255, 255, 255, 0.7)')
    .attr('stroke', '#ccc');

  // Create defs for gradient
  const defs = svg.append('defs');

  if (metric2 === 'CustomPrice') {
    // For CustomPrice: Create a split gradient with red-to-light and light-to-blue
    const linearGradient = defs.append('linearGradient')
      .attr('id', 'linear-gradient');

    const customPrice = parseFloat(d3.select('#customPriceInput').property('value')) || 1;
    const legendDomain = colorScale.domain(); // [min, customPrice, max]
    const min = legendDomain[0];
    const max = legendDomain[2];

    // Calculate the position of the custom price in the gradient
    const splitPercent = ((customPrice - min) / (max - min)) * 100;

    // Define gradient stops
    linearGradient.selectAll('stop')
      .data([
        { offset: '0%', color: d3.interpolateBlues(0.9) },     // Dark red
        { offset: `${splitPercent}%`, color: d3.interpolateBlues(0.3) }, // Light red
        { offset: `${splitPercent}%`, color: d3.interpolateReds(0.3) },  // Light blue
        { offset: '100%', color: d3.interpolateReds(0.9) }   // Dark blue
      ])
      .enter().append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color);

    // Append the gradient rectangle to the legendGroup
    legendGroup.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('x', legendX)
      .attr('y', legendY)
      .style('fill', 'url(#linear-gradient)');

    // Legend axis scale
    const legendScale = d3.scaleLinear()
      .domain([min, max])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format(".2f"));

    // Append the legend axis to the legendGroup
    legendGroup.append('g')
      .attr('transform', `translate(${legendX}, ${legendY + legendHeight})`)
      .call(legendAxis);

    // Add a marker for the custom price
    legendGroup.append('line')
      .attr('x1', legendX + legendScale(customPrice))
      .attr('x2', legendX + legendScale(customPrice))
      .attr('y1', legendY)
      .attr('y2', legendY + legendHeight)
      .attr('stroke', 'black')
      .attr('stroke-width', 2);

    // Add a label for the custom price
    legendGroup.append('text')
      .attr('x', legendX + legendScale(customPrice))
      .attr('y', legendY - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'black')
      .text(`Custom Price`);
  } else {
    // For sequential scales (Single metric or Comparison without CustomPrice)
    let interpolator;
    if (metric2 && metric2 !== 'CustomPrice') {
      interpolator = colorScales['Comparison'].interpolator();
    } else if (colorScales[currentMetric]) {
      interpolator = colorScales[currentMetric].interpolator();
    } else {
      interpolator = d3.interpolateBlues;
    }

    const linearGradient = defs.append('linearGradient')
      .attr('id', 'linear-gradient');

    // Generate gradient stops
    const numStops = 50;
    const legendData = d3.range(0, 1.01, 1 / numStops);

    linearGradient.selectAll('stop')
      .data(legendData)
      .enter().append('stop')
      .attr('offset', d => `${d * 100}%`)
      .attr('stop-color', d => interpolator(d));

    // Append the gradient rectangle to the legendGroup
    legendGroup.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('x', legendX)
      .attr('y', legendY)
      .style('fill', 'url(#linear-gradient)');

    // Determine the domain based on the colorScale
    const legendDomain = colorScale.domain();

    // Legend axis scale
    const legendScale = d3.scaleLinear()
      .domain([legendDomain[0], legendDomain[1]])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format(".2f"));

    // Append the legend axis to the legendGroup
    legendGroup.append('g')
      .attr('transform', `translate(${legendX}, ${legendY + legendHeight})`)
      .call(legendAxis);

    // Add mean indicator if not comparing with Custom Price
    if (!metric2) {
      const meanValue = d3.mean(Object.values(dataMap).map(d => d[currentMetric]));
      const meanPosition = (meanValue - legendDomain[0]) / (legendDomain[1] - legendDomain[0]) * legendWidth + legendX;

      legendGroup.append('line')
        .attr('x1', meanPosition)
        .attr('x2', meanPosition)
        .attr('y1', legendY)
        .attr('y2', legendY + legendHeight)
        .attr('stroke', '#000')
        .attr('stroke-width', 2);

      legendGroup.append('text')
        .attr('x', meanPosition)
        .attr('y', legendY - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#000')
        .text(`Mean: ${meanValue.toFixed(2)}`);
    }
  }
}

// Function to update the metric descriptions
function updateMetricDescriptions(metric1, metric2 = null) {
  let description;

  if (metric2) {
    if (metric2 === 'CustomPrice') {
      description = 'Compare the entered value to metric 1. <br>(e.g. see which states have over one million Irish, or where a Big Mac is more expensive than your local McDonalds.)';
    } else {
      description = 'Ratio between selected metrics.';
    }
  } else {
    const description1 = metricDescriptions[metric1] || '';
    description = `<strong>${metric1}:</strong> ${description1}`;
  }

  d3.select('#metricDescriptions').html(`<p>${description}</p>`);
}

// Function to update the data tables
function updateTables(metric, metric2 = null) {
  // Remove existing tables
  d3.select('#tables').html('');

  // Prepare data
  let data = Object.entries(dataMap).map(([state, values]) => {
    let value = values[metric];
    if (metric2) {
      if (metric2 === 'CustomPrice') {
        const customPrice = parseFloat(d3.select('#customPriceInput').property('value'));
        if (!isNaN(customPrice) && customPrice !== 0) {
          value = values[metric];
        } else {
          value = null;
        }
      } else {
        const value2 = values[metric2];
        if (value2 !== 0) {
          value = value / value2;
        } else {
          value = null;
        }
      }
    }
    return { state, value };
  }).filter(d => d.value !== null && !isNaN(d.value) && isFinite(d.value));

  // Sort data
  data.sort((a, b) => b.value - a.value);

  // Get top 3 and bottom 3
  const top3 = data.slice(0, 3);
  const bottom3 = data.slice(-3).reverse();

  // Create tables container
  const tablesDiv = d3.select('#tables');

  // Create Top 3 table
  createTable(tablesDiv, 'Top 3 States', top3);

  // Create Bottom 3 table
  createTable(tablesDiv, 'Bottom 3 States', bottom3);
}

function createTable(container, title, data) {
  const tableDiv = container.append('div').attr('class', 'table-container');

  tableDiv.append('h3').text(title);

  const table = tableDiv.append('table')
    .style('margin', '10px auto')
    .style('border-collapse', 'collapse')
    .style('width', '100%'); // Ensure tables take full width

  // Table headers without 'Rank'
  table.append('thead').append('tr')
    .selectAll('th')
    .data(['State', 'Value'])
    .enter().append('th')
    .text(d => d)
    .style('border', '1px solid #ccc')
    .style('padding', '5px')
    .style('background-color', '#f2f2f2'); // Optional: Add background color for headers

  // Table body
  const tbody = table.append('tbody');

  // Add rows without 'Rank'
  const rows = tbody.selectAll('tr')
    .data(data)
    .enter().append('tr');

  // Add cells without 'Rank'
  rows.selectAll('td')
    .data(d => {
      let formattedValue;
      if (['DPI', 'IrishAncestryNum'].includes(currentMetric)) {
        formattedValue = formatInteger(d.value);
      } else {
        formattedValue = formatNumber(d.value);
      }
      return [
        d.state,
        formattedValue
      ];
    })
    .enter()
    .append('td')
    .text(d => d)
    .style('border', '1px solid #ccc')
    .style('padding', '5px');
}
