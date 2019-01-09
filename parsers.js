const parseGpsInput = (rawReadings, str) => {
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

const parseReadings = (sensorReadingPositions, rawReadings, str)=> {
    const tokens = str.split(' ');
    
    try {
        sensorReadingPositions.forEach((name, idx) => {
            rawReadings[name] = parseFloat(tokens[idx]);
        });
    } catch (error) {
        console.error('Error parsing readings\n', error);
    }
};


module.exports = {
    parseGpsInput,
    parseReadings
};