
const cachedFilter = {};

const getFilter = (details, index, readingKey) => {
    const filterKey = `${readingKey}_${index}`;
    if (!cachedFilter[filterKey]) {
        cachedFilter[filterKey] = require(`./values-filter/${details.type}`)(details.params);
    }
    return cachedFilter[filterKey];
}

const filterValue = (sensorReadingsInputsConfiguration, readingsToFilter) => {
    const readings = JSON.parse(JSON.stringify(readingsToFilter));

    Object.keys(readings).forEach(readingKey => {
        const sensorInputConfiguration = sensorReadingsInputsConfiguration[readingKey];
        const filters = sensorInputConfiguration !== undefined ? sensorInputConfiguration["filters"] : undefined;
        if (filters) {
            filters.forEach((filterDetails, filterIndex) => {
                try {
                    readings[readingKey] = getFilter(filterDetails, filterIndex, readingKey)(readings[readingKey]);
                } catch (error) {
                    console.error(`could not convert ${readingKey} reading (value ${readings[readingKey] })`, error);
                }
            });
        }
    });

    return readings;
};

module.exports = {
    filterValue
};