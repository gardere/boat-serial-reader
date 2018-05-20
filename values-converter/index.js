const linearModelConverter = require('./linear-model-converter');
const polynomialModelConverter = require('./polynomial-model-converter');

const linConvert = linearModelConverter(require('./models-data/fuel-level/fuel-level-american-sender.json'));
const polyConvert = polynomialModelConverter(require('./models-data/fuel-level/fuel-level-american-sender.json'));


for (var r = 33.5; r < 240; r+=5) {
    const linearlyApproximatedValue = linConvert(r);
    const polynomiallyApproximatedValue = polyConvert(r);
    const error = Math.abs(polynomiallyApproximatedValue - linearlyApproximatedValue);
    console.log(linearlyApproximatedValue, polynomiallyApproximatedValue, error, Math.round(error / polynomiallyApproximatedValue * 100));
}


