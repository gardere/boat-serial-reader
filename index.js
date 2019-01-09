const readingsConverter = require('./readings-converter');
const readingsFilter = require('./readings-filter');

const configuration = require('./configuration/configuration.json');
const inputsConfiguration = require('./configuration/inputs-configuration.json');

const sensorReadingPositions = inputsConfiguration.sensorReadingPositions;


const rawReadings = {};
let processedReadings = {};

const parseReadings = str => {
    const tokens = str.split(' ');
    
    try {
        sensorReadingPositions.forEach((name, idx) => {
            rawReadings[name] = parseFloat(tokens[idx]);
        });
        processReadings();
        processedReadings.rdg = str;
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
    "RDG": (payload) => {
        parseReadings(payload);
        
    },
    "GPS": parseGpsInput,
    "RAW": (payload) => rawReadings['raw'] = payload,
    "RPM": (payload) => {
        const rpmValue = parseInt(payload, 10);
        rawReadings['fuel-usage'] = rpmValue; // Why?
        rawReadings['rpm'] = rpmValue;
        processedReadings['rpm'] = rpmValue;
    },
    "DEFAULT": (payload, input) => console.error('Unknown serial input type: ', input)
};

const parseSerialInput = (input) => {
    try {
        console.log(`input: ${input}`)
        const payload = input.substring(4).trim();
        const inputType = input.substring(0, 3);
        (serialInputHandlers[inputType] || serialInputHandlers['DEFAULT'])(payload, input);
    } catch (error) {
        console.error('error parsing serial input', error);
    }
};

const processReadings = () => {
    const convertedValue = readingsConverter.convertReadings(inputsConfiguration.converters, rawReadings);
    const filteredValue = readingsFilter.filterValue(inputsConfiguration.filters, convertedValue);
    processedReadings = filteredValue;
}

const init = configuration => {
    require('./web-server').initializeWebServer(configuration.WEB_SERVER_PORT, () => processedReadings);
    require(configuration.SERIAL_PORT_TYPE).initializeSerialPort(configuration, parseSerialInput);
};

init(configuration);
