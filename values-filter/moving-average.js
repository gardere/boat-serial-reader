const movingAverageFilter = params => {
    const values = [];

    return value => {
        if (value !== undefined) {
            values.push(value);
        }
        if (values.length > params['number-of-values']) {
            values.shift();
        }
        return parseFloat(values.reduce((acc, value) => acc + value, 0.0)) / values.length;
    };
}

module.exports = params => {
    if (params === undefined) {
        throw new Error('moving-average filter requires parameters');
    }

    return movingAverageFilter(params);
}