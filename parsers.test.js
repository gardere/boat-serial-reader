const parsers = require('./parsers');


describe('parseReading tests', () => {
    test('parseReadings does not fail when the string is empty', () => {
        parsers.parseReadings({}, {}, '');
    });

    test('parseReadings is using sensor configuration to know which value is what', () => {
        const readings =  {};
        const sensorReadingPositions = ["voltage","fuel-level", "oil-pressure", "water-temperature"];
        parsers.parseReadings(sensorReadingPositions, readings, '1 2 3 4');
        expect(readings['voltage']).toBe(1);
        expect(readings['fuel-level']).toBe(2);
        expect(readings['oil-pressure']).toBe(3);
        expect(readings['water-temperature']).toBe(4);
    });

    test('parseReadings can handle floating point values', () => {
        const readings =  {};
        const sensorReadingPositions = ["voltage"];
        parsers.parseReadings(sensorReadingPositions, readings, '1.2345');
        expect(readings['voltage']).toBe(1.2345);
    });
});