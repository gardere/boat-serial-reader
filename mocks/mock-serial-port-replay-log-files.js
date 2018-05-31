const fs = require('fs');
const util = require('util');

const LOG_FILES_PREFIX = 'data_';

// const getRDG = logData => {
//     return logData.RDG ? `RDG ${logData.RDG}`: undefined;
// };

const formatGpsDateTime = datetime => {
    const date = new Date(parseInt(datetime, 10));
    return `${date.getUTCFullYear()},${date.getUTCMonth() + 1},${date.getUTCDate()},${date.getUTCHours()},${date.getUTCMinutes()},${date.getUTCSeconds()},${parseInt(date.getUTCMilliseconds() / 10, 10)}0`;
};

const getGPS = logData => {
    if (logData.position) {
        logData.position = JSON.parse(logData.position);
        return `GPS ${logData.position.longitude} ${logData.position.latitude} ${logData.position.speed} ${logData.position.course} ${logData.position.numberOfSatellites} ${logData.position.hdop} ${formatGpsDateTime(logData.position.datetime)}`;
    } else {
        return undefined;
    }
};
const getRDG = logData => logData.rdg ? `RDG ${logData.rdg}` : undefined;;
const getRPM = logData => logData.rpm ? `RPM ${JSON.parse(logData.rpm)}` : undefined;


const scheduleDataSending = (logFileData, timestamp, offset, dataKeys, serialPortSentenceHandler) => {
    const dataToSend = dataKeys.reduce((acc, dataKey) => {
        acc[dataKey] = logFileData[dataKey][timestamp];
        return acc;
    }, {});

    const delay = timestamp - offset;
    const rawDataConverters = [getRDG, getGPS, getRPM];
    rawDataConverters.forEach(rawDataConverter => setTimeout(() => {
        const rawData = rawDataConverter(dataToSend);
        if (rawData) {
            console.log('sending', rawData)
            serialPortSentenceHandler(rawData);
        }
    }, delay));
}

const processFileForTimestamp = async (logFilesFolder, timestamp, serialPortSentenceHandler) => {
    //1. get all timestamp
    const logFileData = JSON.parse(await util.promisify(fs.readFile)(`${logFilesFolder}${LOG_FILES_PREFIX}${timestamp}.json`));
    const dataKeys = Object.keys(logFileData);
    const timestamps = Object.keys(logFileData[dataKeys[0]]).map(timestamp => parseInt(timestamp, 10)).sort();

    //2. schedule data sending - offset with the earliest timestamp in the file
    timestamps.forEach(timestamp => scheduleDataSending(logFileData, timestamp, timestamps[0], dataKeys, serialPortSentenceHandler));
};

const scheduleFileProcessing = (logFilesFolder, timestamp, offset, serialPortSentenceHandler) => setTimeout(() => processFileForTimestamp(logFilesFolder, timestamp, serialPortSentenceHandler), timestamp - offset)

const initializeSerialPort = async ({ SERIAL_PORT_NAME, SERIAL_PORT_CONFIGURATION }, serialPortSentenceHandler) => {
    const logFilesFolder = SERIAL_PORT_CONFIGURATION.folder;

    //1. list files
    const files = (await util.promisify(fs.readdir)(logFilesFolder)).filter(file => file.startsWith(LOG_FILES_PREFIX));

    //2. extract timestamps
    const timestamps = files.map(file => parseInt(file.substring(5, file.length - 5), 10));

    //3. get offset
    const offset = Math.min(...timestamps);
    console.log(offset);

    //4. schedule files processing
    timestamps.forEach(timestamp => scheduleFileProcessing(logFilesFolder, timestamp, offset, serialPortSentenceHandler));
};

module.exports = {
    initializeSerialPort
};