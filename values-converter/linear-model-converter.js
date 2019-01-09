

const converterFactory = values => {
    //throw an exception if there is only one or no item
    if (values.length < 2) {
        throw new Error('A model needs at least two values to perform any interpolation');
    }

    //throw an exception if any value is not a number
    values.forEach(item => {
        if (isNaN(item.source) || isNaN(item.target)) {
            throw new Error(`linearModelConverter - ${JSON.stringify(item)} is not a valid value`);
        }
    });

    //throw an exception if any values are duplicated
    values.reduce((acc, item) => {
        if (acc.indexOf(item.source) > -1) {
            throw new Error(`linearModelConverter - ${item.source} is a duplicated value`);
        } else {
            acc.push(item.source);
        }
        return acc;
    }, [])    

    //sort the values to ensure they are in ascending order
    const sortedValues = values.sort((a, b) => a.source > b.source ? 1 : -1);

    return value => {
        //note: to be accurate, models, need to include a source value for the low and high end of the measurable spectrum
        const lowEnd = sortedValues[0].source;
        const highEnd = sortedValues[sortedValues.length - 1].source;
        if ((value < lowEnd) || (value > highEnd)) {
            console.info(`Value ${value} is out of "interpolable" range (${lowEnd} - ${highEnd})`);
            value = (value < lowEnd) ? lowEnd : highEnd;
        }

        for (var i=0;i<sortedValues.length-1; ++i) {
            const lowBoundary = sortedValues[i];
            const highBoundary = sortedValues[i+1];
            if (value >= lowBoundary.source && value <= highBoundary.source) {
                return lowBoundary.target + (highBoundary.target - lowBoundary.target) / (highBoundary.source - lowBoundary.source) * (value - lowBoundary.source);
            }
        }
    }
};

module.exports = values => converterFactory(values);