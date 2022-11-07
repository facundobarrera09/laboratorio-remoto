let socket = io();

// EJE CARTESIANO

let voltageArrow, currentArrow;

$.get('./img/eje_cartesiano.svg', svgText => {
    var draw = SVG().addTo('#eje');
    draw.svg(svgText, true);
    voltageArrow = document.querySelector('#voltage-arrow');
    currentArrow = document.querySelector('#current-arrow');

    currentArrow.setAttribute('x2', '550');
}, 'text');

socket.on('measurement data', (newPackage) => {
    if (currentArrow !== undefined && voltageArrow !== undefined) {
        let angle = parseFloat(newPackage.phaseShift.angle);
        let current = parseFloat(newPackage.current.rms);
        let voltage = parseFloat(newPackage.voltage.rms);

        let scale = { 
            unit: 37.5, // value of units in the scale
            unitValue: current / 4 // value of units as a vector, current occupies 4 units
        }
    
        let currentComponents = { x: current, y: 0 }
        let voltageComponents = { x: parseFloat((Math.cos((angle/180) * Math.PI)).toFixed(2)) * voltage , y: parseFloat((Math.sin((angle/180) * Math.PI)).toFixed(2)) * voltage }
        
        let voltageValues = { 
            x: (voltageComponents.x / scale.unitValue) * scale.unit,
            y: (voltageComponents.y / scale.unitValue) * scale.unit
        }

        // console.log('voltage:', voltageComponents, voltageValues);
        // console.log('current:', currentComponents, {x: 150, y: 0});

        voltageArrow.setAttribute('x2', voltageValues.x + parseInt(currentArrow.getAttribute('x1')));
        voltageArrow.setAttribute('y2', voltageValues.y + parseInt(currentArrow.getAttribute('y1')));
    }
});

// CHART

// load current chart package
google.charts.load("current", {
    packages: ["corechart", "line"]
});
// set callback function when api loaded
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
    // create data object with default value
    let data = google.visualization.arrayToDataTable([
        ['Time', 'Voltaje', 'Corriente', 'Potencia'],
        [0, 0, 0, 0],
    ]);
    for (let x = 1; x < 500; x++) {
        data.addRow([x, 0, 0, 0]);
    }

    // create options object with titles, colors, etc.
    let options = {
        height: '100%',    // ensure fills height of container
        width: '100%',     // fills width of container

        hAxis: {maxValue: 500},

        chartArea: {
            right: 100
        },
        vAxes: {
            0: {title: 'Voltaje', textPosition: 'out'},
            1: {title: 'Corriente', textPosition: 'in'},
            2: {title: 'Potencia', textPosition: 'out'}
        },
        series:{
            0: {targetAxisIndex:0, color : 'blue'},
            1: {targetAxisIndex:1, color : 'red'},
            2: {targetAxisIndex:2, color : 'green'}
        }
    };
    // draw chart on load
    let chart = new google.visualization.LineChart(
        document.getElementById("chart_div")
    );
    chart.draw(data, options);

    // data manip
    // max amount of data rows that should be displayed
    const maxDatas = 500;
    let index = 0;

    socket.on('measurement data', (newPackage) => {
        for (let x = 0; x < newPackage.size; x++) {
            //data.addRow([index, newPackage.voltage.values[x], newPackage.current.values[x], newPackage.power.values[x]]);
            //index++;

            data.setCell(x, 1, newPackage.voltage.values[x]);
            data.setCell(x, 2, newPackage.current.values[x]);
            data.setCell(x, 3, newPackage.power.values[x]);
        }
        
        chart.draw(data, options);
        document.querySelector('#valores-voltaje').innerHTML = newPackage.voltage.rms + ' volt';
        document.querySelector('#valores-corriente').innerHTML = newPackage.current.rms + ' amper';
        document.querySelector('#valores-angulo').innerHTML = newPackage.phaseShift.angle + 'º';
        document.querySelector('#valores-factor-potencia').innerHTML = newPackage.power.active + ' watt';
        document.querySelector('#valores-potencia-activa').innerHTML = newPackage.power.reactive + ' VA';
        document.querySelector('#valores-potencia-reactiva').innerHTML = newPackage.power.factor + ' ';

        // if (data.getNumberOfRows() > maxDatas) {
        //     data.removeRows(0, data.getNumberOfRows() - maxDatas);
        // }
    });
}

let stream = document.querySelector('#stream');
socket.on('stream', (image) => {
    stream.src = image;
});

// PETITION FORM

let submit_button = document.getElementById('submit-form');
submit_button.addEventListener('click', (e) => {
    e.preventDefault();

    let data = document.forms['config-form'];
    let message = {};

    message[data['rele1'].name] = data['rele1'].checked;
    message[data['rele2'].name] = data['rele2'].checked;
    message[data['rele3'].name] = data['rele3'].checked;
    message[data['rele4'].name] = data['rele4'].checked;
    message[data['rele5'].name] = data['rele5'].checked;

    console.log('Sending petition to server');
    socket.emit('petition', message, (response) => {
        console.log('Petition on queue: number ', response);
    });
});