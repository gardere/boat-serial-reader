const SerialPort = require('serialport');
const portName = '/dev/ttyACM0';

const converters = {
    "linear-model-converter": require('./values-converter/linear-model-converter'),
    "polynomial-model-converter": require('./values-converter/polynomial-model-converter')
}

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
};

const parseSerialInput = (input) => {
    try {
        const payload = input.substring(4).trim();
        const inputType = input.substring(0, 3);
        if (inputType === 'RDG') {
            parseReadings(payload);
        } else if (inputType === 'GPS') {
            parseGpsInput(payload);
        } else {
            console.error('Unknown serial input type: ', input);
        }
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
    sp = new SerialPort(portName, {
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false
     }, error => {
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


const cachedConverters = {};
const getConverter = (model, data) => {
    const converterKey = `${model}_${data}`;
    
    if (!cachedConverters[converterKey]) {
        const modelData = require(`./values-converter/models-data/${data}.json`);
        const converter = converters[model](modelData);
        cachedConverters[converterKey] = converter;
    }

    return cachedConverters[converterKey];
};

const convertReadings = readingsToConvert => {
    const readings = JSON.parse(JSON.stringify(readingsToConvert));

    Object.keys(readings).forEach(readingKey => {
        const sensorInputConfiguration = sensorReadingsInputsConfiguration.find(cfg => cfg.id === readingKey);
        const converterModel = sensorInputConfiguration !== undefined ? sensorInputConfiguration["converter-model"] : undefined;
        if (converterModel && converterModel !== 'none') {
            try {
                const converterData = sensorInputConfiguration["converter-data"];
                readings[readingKey] = getConverter(converterModel, converterData)(readings[readingKey]);
            } catch (error) {
                console.error(`could not convert ${readingKey} reading (value ${readings[readingKey] })`, error);
            }
        }
    });

    return readings;
};


const initializeWebServer = () => {
    console.log('initializing web server');
    const http = require('http');

    http.createServer((req, res) => { 
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(convertReadings(rawReadings)));
    }).listen(8081); 
};


initializeWebServer();
initializeSerialPort();