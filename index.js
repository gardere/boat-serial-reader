const readingsConverter = require('./readings-converter');
const readingsFilter = require('./readings-filter');

const configuration = require('./configuration/configuration.json');
const inputsConfiguration = require('./configuration/inputs-configuration.json');

const { parseGpsInput, parseReadings } = require('./parsers');

const sensorReadingPositions = inputsConfiguration.sensorReadingPositions;


const rawReadings = {};
let processedReadings = {};




const serialInputHandlers = {
    "RDG": (payload) => {
        parseReadings(sensorReadingPositions, rawReadings, payload);
        processReadings();
        processedReadings.rdg = payload;
    },
    "GPS": parseGpsInput.bind(null, rawReadings),
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
