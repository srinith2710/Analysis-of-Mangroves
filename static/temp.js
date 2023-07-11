let fd = document.getElementsByName("fromdate")[0];
let td = document.getElementsByName("todate")[0];
let today = new Date().toISOString().split("T")[0];
td.max = today;
fd.max = today;
var count = 0

let chart, data, labels;

let map = L.map('map').setView([15.805, 80.9], 10);

let taskExecuted = false;


function performTask(lab) {
  if (!taskExecuted) {
    // Task logic goes here
    labels = lab;
    const ctx = document.getElementById('chartCanvas');
    let mgr = document.getElementById('mgr');
    let head = document.getElementById('thead');
    let tcont = document.getElementById('tcont');
    const m = document.getElementById('map');
    m.style.width = "50%"
    var newRow = document.createElement('tr');

    // Create the HTML content for the new row
    tcont.style.display = 'block'
    var rowContent = `<th scope="row">Analysis</th>`;
    for (i of lab) {
      rowContent += `<th>${i}</th>`;
    }
    newRow.innerHTML = rowContent;
    head.appendChild(newRow)

    // Set the HTML content of the new row
    newRow.innerHTML = rowContent;
    mgr.style.display = "block";
    map.invalidateSize();

    const chartOptions = {
      responsive: true,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        x: {
          display: true
        }
      }
    };

    data = {
      labels: labels,
      datasets: []
    };

    // Create the chart
    chart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: chartOptions
    });

    // Set the flag to true to indicate that the task has been executed
    taskExecuted = true;
  }
}

// performTask([])

function appendData(newData, lab) {
  const dataset = chart.data.datasets;
  // print(type(dataset))
  dataset.push(newData);
  // chart.data.labels.push(lab)
  // console.log(newData)
  chart.update();
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let latlng = L.latLng(15.7, 80.85);

let drawnItems = L.featureGroup().addTo(map);

// create a Rectangle draw handler
let drawControl = new L.Control.Draw({
  draw: {
    rectangle: {
      shapeOptions: {
        color: "black",
        weight: 3
      }
    },
    polygon: false,
    circle: false,
    marker: false,
    polyline: false,
    circlemarker: false
  },
  edit: {
    featureGroup: drawnItems
  }
}).addTo(map);


function getRandomColor() {
  // Generate a random color in hexadecimal format
  // Generate random RGB values in the range of 128-255 (instead of 0-128)
  // Generate random RGB values in the range of 0-255
  var red = Math.floor(Math.random() * 256);
  var green = Math.floor(Math.random() * 256);
  var blue = Math.floor(Math.random() * 256);

  // Convert the RGB components to hexadecimal and concatenate them
  return "#" + ((1 << 24) | (red << 16) | (green << 8) | blue).toString(16).slice(1);


}

function getContrastColor(color) {
  const rgb = color.match(/\d+/g);
  const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;

  return brightness >= 128 ? "black" : "white";
}

// Get the element to append the content to
let element = document.getElementById("imgcont");
let d;

// Function to append HTML content to the element
function appendContent(newContent) {
  // Generate some new HTML content
  // Append the new content to the element without overwriting the existing content
  element.insertAdjacentHTML("afterbegin", newContent);

  const imgElement = document.querySelector(`#openModalBtn${count} img`);
  const maximizeIcon = document.querySelector(`#openModalBtn${count} .maximize-icon`);

  // Add event listener to the img element
  imgElement.addEventListener('mouseenter', () => {
    maximizeIcon.style.opacity = "1";
  });

  imgElement.addEventListener('mouseleave', () => {
    // maximizeIcon.style.display = "none";
    maximizeIcon.style.opacity = "0";
  });
}


function send_req(col, send_data) {
  document.getElementById("loader").classList.remove("d-none");
  window.scrollTo(0, document.body.scrollHeight);
  fetch('/my_flask_route', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(send_data)
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        console.log(data.error);
        document.getElementById("loader").classList.add("d-none");
        count++;
        let newContent = `<div id="openModalBtn${count}" class="fade-out" style="width: 48%;">
    <span class="badge text-bg-danger" style="float: right; margin: 1.2rem 0rem;">No Data</span>
    <div style="position: relative;">
    <span class="maximize-icon">No Data Found</span>
    </div>
  </div>`;
        appendContent(newContent);
      }
      else {
        count++;
        document.getElementById("loader").classList.add("d-none");
        let tableBody = document.getElementById('tbody');
        let newRow = document.createElement('tr');
        // Create the HTML content for the new row
        let rowContent = `<th style="background-color: ${col}; color: ${getContrastColor(col)}">${count} Avg ${send_data['index']}</th>`;

        for (i of data.data) {
          rowContent += `<td>${i}</td>`
        }

        // Set the HTML content of the new row
        newRow.innerHTML = rowContent;

        performTask(data.labels);

        // Append the new row to the table body
        tableBody.appendChild(newRow);
        appendData({
          label: `${data.area}`,
          data: data.data,
          fill: false,
          borderColor: `${col}`,
          tension: 0.1
        }, data.labels)
        let newContent = `<div id="openModalBtn${count}" class="fade-out" style="width: 48%;">
    <span class="badge text-bg-primary" style="float: right; margin: 1.2rem 0rem;">${data.area},${send_data['index']}</span>
    <div style="position: relative;">
    <span class="maximize-icon"><i class="bi bi-zoom-in"></i></span>
    <img src="data:image/png;base64,${data.image}"
      style="width: 100%; border: 2px solid ${col}; margin: 2rem 0rem; border-radius: 10px;">
    </div>
  </div>`;
        appendContent(newContent);
        const openModalBtn = document.querySelector(`#openModalBtn${count} img`);
        const modal = document.getElementById("modal");
        const closeBtn = document.querySelector(".close");
        const mimg = document.getElementById("max_img");

        openModalBtn.addEventListener("click", function (event) {
          modal.style.display = "block";
          mimg.src = event.target.src;
        });

        closeBtn.addEventListener("click", function () {
          modal.style.display = "none";
        });

        window.addEventListener("click", function (event) {
          if (event.target == modal) {
            modal.style.display = "none";
          }
        });
      }
    }).catch(error => {
      console.log('An error occurred:', error);
    });
}

let polygonCoordinates;

function OnChange() {
  try {
    let lat = parseFloat(document.getElementById("latitude").value);
    let lon = parseFloat(document.getElementById("longitude").value);
    let buf = parseFloat(document.getElementById("buffer").value);
    let todate = td.value;
    let fromdate = fd.value;
    let calc = document.getElementById("calc");
    let index = calc.value;
    if (lat != NaN && lon != NaN && buf != NaN) {
      let polygonCoordinates = [
        [lat - buf, lon - buf],
        [lat + buf, lon - buf],
        [lat + buf, lon + buf],
        [lat - buf, lon + buf]
      ];
      let lat_min = lat - buf;
      let lat_max = lat + buf;
      let lng_min = lon - buf;
      let lng_max = lon + buf;
      // Create a polygon using the coordinates
      let col = "#" + Math.floor(Math.random() * 16777215).toString(16);
      var polygon = L.polygon(polygonCoordinates, { color: col }).addTo(map);
      let data = {
        lat_min: lat_min,
        lat_max: lat_max,
        lng_min: lng_min,
        lng_max: lng_max,
        todate: todate,
        fromdate: fromdate,
        index: index
      }
      console.log(data)
      send_req(col, data)
      // document.getElementById("lat_lon").innerHTML = `The Selected values range is <br>Latitude = (${lat_min}, ${lat_max})<br>Longitude = (${lng_min}, ${lng_max})`
    }
  } catch (error) {
    // if (lat == NaN && lon == NaN && buf == NaN) {
    // let polygonCoordinates = [
    //   [lat - buf, lon - buf],
    //   [lat + buf, lon - buf],
    //   [lat + buf, lon + buf],
    //   [lat - buf, lon + buf]
    // ];
    // let lat_min = lat - buf;
    // let lat_max = lat + buf;
    // let lng_min = lon - buf;
    // let lng_max = lon + buf;
    // Create a polygon using the coordinates
    // let col = "#" + Math.floor(Math.random() * 16777215).toString(16);
    // var polygon = L.polygon(polygonCoordinates, { color: col }).addTo(map);
    // let data = {
    //   lat_min: lat_min,
    //   lat_max: lat_max,
    //   lng_min: lng_min,
    //   lng_max: lng_max,
    //   todate: todate,
    //   fromdate: fromdate,
    //   index: index
    // }
    console.log(data)
    send_req(polygonCoordinates["col"], polygonCoordinates)
  }
}

// when a rectangle is drawn, add it to the drawnItems feature group
map.on('draw:created', function (e) {
  var layer = e.layer;
  layer.options.color = getRandomColor();
  drawnItems.addLayer(layer);
  drawControl.remove();
  drawControl.addTo(map);

  // get the coordinates of the selected area
  let coordinates = layer.getLatLngs();
  console.log(coordinates)
  let lat_min = coordinates[0][0]["lat"];
  let lat_max = coordinates[0][1]["lat"];
  let lng_min = coordinates[0][0]["lng"];
  let lng_max = coordinates[0][2]["lng"];
  let todate = td.value;
  let fromdate = fd.value;
  let calc = document.getElementById("calc");
  let index = calc.value;
  let data = {
    lat_min: lat_min,
    lat_max: lat_max,
    lng_min: lng_min,
    lng_max: lng_max,
    todate: todate,
    fromdate: fromdate,
    index: index,
    col: layer.options.color
  }
  polygonCoordinates = data;
  console.log(data)
  // send_req(layer.options.color, data);
});