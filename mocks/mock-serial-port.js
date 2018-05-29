const getGpsDate = () => {
    const date = new Date();
    return `${date.getUTCFullYear()},${date.getUTCMonth() + 1},${date.getUTCDate()},${date.getUTCHours()},${date.getUTCMinutes()},${date.getUTCSeconds()},${parseInt(date.getUTCMilliseconds() / 10, 10)}0`;
}

const initializeSerialPort = ({ SERIAL_PORT_NAME, SERIAL_PORT_CONFIGURATION }, serialPortSentenceHandler) => {
    const cycle = () => {
        setTimeout(() => serialPortSentenceHandler("RPM 780"), 200);
        setTimeout(() => serialPortSentenceHandler("RDG 12.15 33.5 50 90"), 400);
        setTimeout(() => serialPortSentenceHandler("RDG 12.10 33.5 52 90"), 600);
        setTimeout(() => serialPortSentenceHandler("RDG 14.25 33.5 55 90"), 800);
        setTimeout(() => serialPortSentenceHandler("RPM 1200"), 1000);
        setTimeout(() => serialPortSentenceHandler("RDG 14.75 33.5 58 90"), 1000);
        setTimeout(() => serialPortSentenceHandler("RDG 14.32 33.5 60 90"), 1200);
        setTimeout(() => serialPortSentenceHandler("RDG 14.42 33.5 59 90"), 1400);
        setTimeout(() => serialPortSentenceHandler("RDG 14.51 33.5 54 90"), 1600);
        setTimeout(() => serialPortSentenceHandler("RDG 14.15 33 61 90"), 1800);
    };

    cycle();
    setInterval(cycle, 2000);
    setInterval(() => serialPortSentenceHandler(`GPS 151.5 -33.0 10 180 8 0 ${getGpsDate()}`), 100);
};

module.exports = {
    initializeSerialPort
};