const SerialPort = require('serialport');

const onSerialData = (data) => {
    rxBuffer = Buffer.concat([rxBuffer, data]);
    const crLocation = rxBuffer.toString().indexOf('\n');
    if (crLocation !== -1) {
        parseSerialInput(rxBuffer.toString().substring(0, crLocation).trim())
        rxBuffer = new Buffer(rxBuffer.toString().substring(crLocation + 1));
    }
};

const initializeSerialPort = ({ SERIAL_PORT_NAME, SERIAL_PORT_CONFIGURATION }) => {
    console.log('initializing serial port');
    sp = new SerialPort(SERIAL_PORT_NAME, SERIAL_PORT_CONFIGURATION, error => {
        if (error) {
            console.error('error initializing serial port', error);
            setTimeout(() => initializeSerialPort({ SERIAL_PORT_NAME, SERIAL_PORT_CONFIGURATION }), 1000);
        }
     });

     sp.on('open', () => {
        console.log('serial port initialized');
        sp.on('data', onSerialData);
    });
}

module.exports = {
    initializeSerialPort
};