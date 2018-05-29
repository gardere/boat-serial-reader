const readingsConverter = require('./readings-converter');
const readingsFilter = require('./readings-filter');

const configuration = require('./configuration/configuration.json');
const sensorReadingsInputsConfiguration = require('./configuration/sensor-readings-inputs-configuration.json');
const webServerPort = configuration.WEB_SERVER_PORT;

const sensorReadingPositions = sensorReadingsInputsConfiguration.map(obj => obj.id);


const rawReadings = {};
let processedReadings = {};
let sp;

let rxBuffer = new Buffer('');

const parseReadings = str => {
    const tokens = str.split(' ');
    
    try {
        sensorReadingPositions.forEach((name, idx) => {
            rawReadings[name] = parseFloat(tokens[idx]);
        });
        processReadings();
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
        --datetimeTokens[1]; //for javascript dates month is 0-base index!
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
        (serialInputHandlers[inputType] || serialInputHandlers['DEFAULT'])(payload, input);
    } catch (error) {
        console.error('error parsing serial input', error);
    }
};

const processReadings = () => {
    const sensorsConfigurationDictionary = sensorReadingsInputsConfiguration.reduce((dictionary, element) => {
        dictionary[element.id] = element;
        return dictionary;
    }, {});
    const convertedValue = readingsConverter.convertReadings(sensorsConfigurationDictionary, rawReadings);
    const filteredValue = readingsFilter.filterValue(sensorsConfigurationDictionary, convertedValue);
    processedReadings = filteredValue;
}

const init = () => {
    require('./web-server').initializeWebServer(webServerPort, () => processedReadings);
    require('./mocks/mock-serial-port').initializeSerialPort(configuration, parseSerialInput);
};

init();
