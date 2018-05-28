const SerialPort = require('serialport');
const configuration = require('./configuration.json');
const portName = configuration.SERIAL_PORT_NAME;
const portConfiguration = configuration.SERIAL_PORT_CONFIGURATION;
const webServerPort = configuration.WEB_SERVER_PORT;

const readingsConverter = require('./readings-converter');

const sensorReadingsInputsConfiguration = require('./sensor-readings-inputs-configuration.json');
const sensorReadingPositions = sensorReadingsInputsConfiguration.map(obj => obj.id);


const rawReadings = {};

let sp;

let rxBuffer = new Buffer('');

const parseReadings = str => {
    const tokens = str.split(' ');
    
    try {
        sensorReadingPositions.forEach((name, idx) => {
            rawReadings[name] = parseFloat(tokens[idx]);
        });
    } catch (error) {
        console.error('Error parsing readings\n', error);
    }
};

const parseGpsInput = str => {
    const tokens = str.split(' ')
    .reduce((result, token) => {
        if (token && token.trim().length > 0) {
            result.push(token);
        }
        return result;
    }, []);

    const position = rawReadings['position'] = rawReadings['position'] || {};
    position['longitude'] = parseFloat(tokens[0]);
    position['latitude'] = parseFloat(tokens[1]);
    position['speed'] = parseFloat(tokens[2]);
    position['course'] = parseFloat(tokens[3]);
    position['numberOfSatellites'] = parseInt(tokens[4], 10);
    position['hdop'] = parseFloat(tokens[5]);

    position['datetime'] = 0;
    try {
        const datetimeTokens = tokens[6].split(',').map(a => parseInt(a, 10));
        if (datetimeTokens[0] !== 2000) {
            position['datetime'] = Date.UTC(...datetimeTokens);
        }
    } catch (err) {
        //invalid value, GPS datetime could not be obtained for now
    }
    
};

const serialInputHandlers = {
    "RDG": parseReadings,
    "GPS": parseGpsInput,
    "RAW": (payload) => rawReadings['raw'] = payload,
    "RPM": (payload) => rawReadings['rpm'] = parseInt(payload, 10),
    "DEFAULT": (payload, input) => console.error('Unknown serial input type: ', input)
};

const parseSerialInput = (input) => {
    try {
        const payload = input.substring(4).trim();
        const inputType = input.substring(0, 3);
        serialInputHandlers[inputType] || serialInputHandlers['DEFAULT'](payload, input);
    } catch (error) {
        console.error('error parsing serial input', error);
    }
}

const onSerialData = (data) => {
    rxBuffer = Buffer.concat([rxBuffer, data]);
    const crLocation = rxBuffer.toString().indexOf('\n');
    if (crLocation !== -1) {
        parseSerialInput(rxBuffer.toString().substring(0, crLocation).trim())
        rxBuffer = new Buffer(rxBuffer.toString().substring(crLocation + 1));
    }
};

const initializeSerialPort = () => {
    console.log('initializing serial port');
    sp = new SerialPort(portName, portConfiguration, error => {
        if (error) {
            console.error('error initializing serial port', error);
            setTimeout(() => initializeSerialPort(), 1000);
        }
     });

     sp.on('open', () => {
        console.log('serial port initialized');
        sp.on('data', onSerialData);
    });
}


const init = () => {
    require('./web-server').initializeWebServer(webServerPort, () => readingsConverter.convertReadings(sensorReadingsInputsConfiguration, rawReadings));
    initializeSerialPort();
};

init();


