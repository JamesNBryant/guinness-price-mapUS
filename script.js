
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

// Set dimensions and create SVG
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

// Tooltip
const tooltip = d3.select('body').append('div')
.attr('class', 'tooltip');

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

console.log('DataMap:', dataMap);
console.log('GeoData:', geoData);

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
  console.log('Metric changed to:', currentMetric);
  updateMap();
});

d3.select('#compareCheckbox').on('change', function() {
  const isChecked = this.checked;
  console.log('Compare checkbox is now:', isChecked);
  d3.select('#metricSelect2').property('disabled', !isChecked);
  if (!isChecked) {
    d3.select('#metricSelect2').property('value', 'GuinnessPrice');
    d3.select('#customPriceInput').style('display', 'none').property('value', '');
    d3.select('#customPriceError').style('display', 'none');
  }
  updateMap();
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
});

d3.select('#customPriceInput').on('input', function() {
  updateMap();
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
});    
}

// Function to update the map
function updateMap() {
d3.select('#loading').style('display', 'block');
console.log('updateMap called with currentMetric:', currentMetric);
const isCompared = d3.select('#compareCheckbox').property('checked');
let metric2 = null;

if (isCompared) {
  metric2 = d3.select('#metricSelect2').property('value');
  console.log('Comparing with metric2:', metric2);
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
console.log('Updating map colors...');

states.transition()
  .duration(750)
  .attr('fill', d => {
    const color = getColor(d, metric2);
    if (d && d.properties && d.properties.NAME) {
        console.log('State:', d.properties.NAME, 'Color:', color);
    } else {
        console.log('State: null, Color:', color);
    }
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
    
    // Create a diverging scale centered at the custom price
    colorScale = d3.scaleDiverging()
      .domain([minValue, customPrice, maxValue])
      .interpolator(t => d3.interpolateRdBu(1 - t)); // Reverse to have blue for lower values and red for higher values
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
    tooltipText += `${currentMetric}: ${value1.toFixed(2)}<br>`;
    tooltipText += `Custom Price: ${customPrice.toFixed(2)}<br>`;
    if (!isNaN(customPrice) && customPrice !== 0) {
      const ratio = value1 / customPrice;
      tooltipText += `Ratio: ${ratio.toFixed(2)}`;
    }
  } else if (metric2) {
    const value1 = stateData[currentMetric];
    const value2 = stateData[metric2];
    tooltipText += `${currentMetric}: ${value1.toFixed(2)}<br>`;
    tooltipText += `${metric2}: ${value2.toFixed(2)}<br>`;
    if (value2 !== 0) {
      const ratio = value1 / value2;
      tooltipText += `Ratio: ${ratio.toFixed(2)}`;
    }
  } else {
    const value = stateData[currentMetric];
    tooltipText += `${currentMetric}: ${value.toFixed(2)}`;
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

// Create defs for gradient
const defs = svg.append('defs');

if (metric2 === 'CustomPrice') {
  // For CustomPrice: Create a split gradient with blue and red
  const linearGradient = defs.append('linearGradient')
    .attr('id', 'linear-gradient');

  const legendDomain = colorScale.domain(); // [min, customPrice, max]
  const min = legendDomain[0];
  const customPrice = legendDomain[1];
  const max = legendDomain[2];

  // Calculate the position of the custom price in the gradient
  const splitPercent = ((customPrice - min) / (max - min)) * 100;

  // Define gradient stops
  linearGradient.selectAll('stop')
    .data([
      { offset: '0%', color: d3.interpolateBlues(0.3) },     // Light blue
      { offset: `${splitPercent}%`, color: d3.interpolateBlues(0.9) }, // Dark blue
      { offset: `${splitPercent}%`, color: d3.interpolateReds(0.3) },  // Light red
      { offset: '100%', color: d3.interpolateReds(0.9) }   // Dark red
    ])
    .enter().append('stop')
    .attr('offset', d => d.offset)
    .attr('stop-color', d => d.color);

  // Append the gradient rectangle to the legendGroup
  legendGroup.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .attr('x', (width - legendWidth) / 2)
    .attr('y', height - 70)
    .style('fill', 'url(#linear-gradient)');

  // Legend axis scale
  const legendAxisScale = d3.scaleLinear()
    .domain([min, max])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendAxisScale)
    .ticks(5)
    .tickFormat(d3.format(".2f"));

  // Append the legend axis to the legendGroup
  legendGroup.append('g')
    .attr('transform', `translate(${(width - legendWidth) / 2}, ${height - 60})`)
    .call(legendAxis);

  // Add a marker for the custom price
  const xPosition = (width - legendWidth) / 2 + (customPrice - min) / (max - min) * legendWidth;

  // Add a line to indicate the custom price
  legendGroup.append('line')
    .attr('x1', xPosition)
    .attr('x2', xPosition)
    .attr('y1', height - 70)
    .attr('y2', height - 50)
    .attr('stroke', 'black')
    .attr('stroke-width', 2);

  // Add a label for the custom price
  legendGroup.append('text')
    .attr('x', xPosition)
    .attr('y', height - 75)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('fill', 'black')
    .text(`Custom Price: ${customPrice}`);
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
    .attr('x', (width - legendWidth) / 2)
    .attr('y', height - 70)
    .style('fill', 'url(#linear-gradient)');

  // Determine the domain based on the colorScale
  const legendDomain = colorScale.domain();

  // Legend axis scale
  const legendAxisScale = d3.scaleLinear()
    .domain([legendDomain[0], legendDomain[1]])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendAxisScale)
    .ticks(5)
    .tickFormat(d3.format(".2f"));

  // Append the legend axis to the legendGroup
  legendGroup.append('g')
    .attr('transform', `translate(${(width - legendWidth) / 2}, ${height - 60})`)
    .call(legendAxis);
}
}

// Function to update the metric descriptions
function updateMetricDescriptions(metric1, metric2 = null) {
let description;

if (metric2) {
  if (metric2 === 'CustomPrice') {
    description = 'Try putting in the price of your local pint. <br>Blue = cheaper than your local pint, red = evil prevails (more expensive)';
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
  .style('border-collapse', 'collapse');

// Table headers
table.append('thead').append('tr')
  .selectAll('th')
  .data(['Rank', 'State', 'Value'])
  .enter().append('th')
  .text(d => d)
  .style('border', '1px solid #ccc')
  .style('padding', '5px');

// Table body
const tbody = table.append('tbody');

// Add rows
const rows = tbody.selectAll('tr')
  .data(data)
  .enter().append('tr');

// Add cells
rows.selectAll('td')
  .data((d, i) => [
    i + 1,
    d.state,
    d.value.toFixed(2)
  ])
  .enter().append('td')
  .text(d => d)
  .style('border', '1px solid #ccc')
  .style('padding', '5px');
};
