// The HTML element that contains the drop container.
var dropContainer;
var panel;
var geoJsonInput;
var downloadLink;
var overlays = [];

var dom = document.getElementById('map-holder');
var myChart = echarts.init(dom, null, {
  renderer: 'canvas',
  useDirtyRect: false,
});

var option;

option = {
  tooltip: {},
  backgroundColor: '#fff',
  xAxis3D: {
    type: 'value',
  },
  yAxis3D: {
    type: 'value',
  },
  zAxis3D: {
    type: 'value',
  },
  grid3D: {
    viewControl: {
      projection: 'orthographic',
    },
  },
  series: [],
};

function init() {
  // Retrieve HTML elements.
  dropContainer = document.getElementById('drop-container');
  panel = document.getElementById('panel');
  var mapContainer = document.getElementById('map-holder');
  geoJsonInput = document.getElementById('geojson-input');
  downloadLink = document.getElementById('download-link');

  // Set up the drag and drop events.
  // First on common events.
  [mapContainer, dropContainer].forEach(function (container) {
    addDomListener(container, 'drop', handleDrop);
    addDomListener(container, 'dragover', showPanel);
  });

  // Then map-specific events.
  addDomListener(mapContainer, 'dragstart', showPanel);
  addDomListener(mapContainer, 'dragenter', showPanel);

  // Then the overlay specific events (since it only appears once drag starts).
  addDomListener(dropContainer, 'dragend', hidePanel);
  addDomListener(dropContainer, 'dragleave', hidePanel);
  // Set up events for changing the geoJson input.
  addDomListener(geoJsonInput, 'input', refreshDataFromGeoJson);
  addDomListener(geoJsonInput, 'input', refreshDownloadLinkFromGeoJson);
}

function drawFeatures(geojsonData) {
  const basePoint = geojsonData.features[0].geometry.coordinates[0];

  option.series = [];
  function mapPoints(points) {
    return points.map(([lng, lat, alt]) => {
      return [
        (lng - basePoint[0]) * 1e6,
        (lat - basePoint[1]) * 1e6,
        (alt - basePoint[2]) * 1e2,
      ];
    });
  }

  for (let i = 0; i < geojsonData.features.length; i++) {
    const curFeature = geojsonData.features[i];
    if (curFeature.geometry.type == 'LineString') {
      option.series.push({
        type: 'line3D',
        name: curFeature.properties.name,
        data: mapPoints(curFeature.geometry.coordinates),
        lineStyle: {
          width: 4,
          color: 'red',
        },
      });
    }

    let pointsData = [];
    if (curFeature.geometry.type == 'Point') {
      pointsData.push(curFeature.geometry.coordinates);
    }
    option.series.push({
      type: 'scatter3D',
      symbolSize: 3,
      data: mapPoints(pointsData),
    });
  }

  console.log(option.series);

  if (option && typeof option === 'object') {
    myChart.setOption(option);
  }
}

function addDomListener(element, type, callback) {
  element.addEventListener(type, callback);
}
addDomListener(window, 'load', init);

// Replace the data layer with a new one based on the inputted geoJson.
function refreshDataFromGeoJson() {
  try {
    // draw the chart
    drawFeatures(JSON.parse(geoJsonInput.value));
  } catch (error) {
    if (geoJsonInput.value !== '') {
      setGeoJsonValidity(false);
    } else {
      setGeoJsonValidity(true);
    }
    return;
  }

  setGeoJsonValidity(true);
}

// Refresh download link.
function refreshDownloadLinkFromGeoJson() {
  downloadLink.href = 'data:;base64,' + btoa(geoJsonInput.value);
}

// Display the validity of geoJson.
function setGeoJsonValidity(newVal) {
  if (!newVal) {
    geoJsonInput.className = 'invalid';
  } else {
    geoJsonInput.className = '';
  }
}

// Control the drag and drop panel. Adapted from this code sample:
// https://developers.google.com/maps/documentation/javascript/examples/layer-data-dragndrop
function showPanel(e) {
  e.stopPropagation();
  e.preventDefault();
  dropContainer.className = 'visible';
  return false;
}

function hidePanel() {
  dropContainer.className = '';
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  hidePanel();

  var files = e.dataTransfer.files;
  if (files.length) {
    // process file(s) being dropped
    // grab the file data from each file
    for (var i = 0, file; (file = files[i]); i++) {
      var reader = new FileReader();
      reader.onload = function (e) {
        geoJsonInput.value = e.target.result;
        drawFeatures(JSON.parse(e.target.result));
      };
      reader.onerror = function (e) {
        console.error('reading failed');
      };
      reader.readAsText(file);
    }
  } else {
    // process non-file (e.g. text or html) content being dropped
    // grab the plain text version of the data
    var plainText = e.dataTransfer.getData('text/plain');
    if (plainText) {
      geoJsonInput.value = plainText;
      drawFeatures(JSON.parse(plainText));
    }
  }
  // prevent drag event from bubbling further
  return false;
}

var mapResized = false;

// Toggle the visibility of the left panel
function toggle_visibility(id) {
  var displayState = document.getElementById(id);
  if (displayState.style.display == 'block') {
    displayState.style.display = 'none';
  } else {
    displayState.style.display = 'block';
  }
}

// Change width of the map when panel toggels
function changeWidth(id) {
  var width = document.getElementById(id);
  if (width.style.width == '64.9%') {
    width.style.width = '100%';
  } else {
    width.style.width = '64.9%';
  }
}

function viewxy() {
  let op = myChart.getOption();
  let view = op.grid3D[0].viewControl;
  view.alpha = 90;
  view.beta = 0;
  myChart.setOption(op);
}

function viewxz() {
  let op = myChart.getOption();
  let view = op.grid3D[0].viewControl;
  view.alpha = 0;
  view.beta = 0;
  myChart.setOption(op);
}

function viewyz() {
  let op = myChart.getOption();
  let view = op.grid3D[0].viewControl;
  view.alpha = 0;
  view.beta = 90;
  myChart.setOption(op);
}
