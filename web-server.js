
const initializeWebServer = (webServerPort, responseHandler) => {
    console.log('initializing web server');
    const http = require('http');

    http.createServer((req, res) => { 
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(responseHandler()));
    }).listen(webServerPort); 
};

module.exports = {
    initializeWebServer
};