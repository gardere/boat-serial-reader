const interpolatingPolynomial = require('interpolating-polynomial');

module.exports = values => interpolatingPolynomial(values.map(entry => [entry.source, entry.target]));