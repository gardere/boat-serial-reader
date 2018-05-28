const converters = {
    "linear-model-converter": require('./values-converter/linear-model-converter'),
    "polynomial-model-converter": require('./values-converter/polynomial-model-converter')
};

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

const convertReadings = (sensorReadingsInputsConfiguration, readingsToConvert) => {
    const readings = JSON.parse(JSON.stringify(readingsToConvert));

    Object.keys(readings).forEach(readingKey => {
        const sensorInputConfiguration = sensorReadingsInputsConfiguration[readingKey];
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

module.exports = {
    convertReadings
};