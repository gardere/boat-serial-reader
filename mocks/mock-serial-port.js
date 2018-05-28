const initializeSerialPort = ({ SERIAL_PORT_NAME, SERIAL_PORT_CONFIGURATION }, serialPortSentenceHandler) => {
    setTimeout(() => serialPortSentenceHandler("RPM 1234"), 500);
    setTimeout(() => serialPortSentenceHandler("RDG 14.25 50 50 90"), 5000);
};

module.exports = {
    initializeSerialPort
};