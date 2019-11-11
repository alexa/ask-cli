const http = require('http');
const url = require('url');
const messages = require('./messages');

module.exports = class LocalHostServer {
    constructor(PORT) {
        this.port = PORT;
        this.server = null;
    }

    create(callback) {
        this.server = http.createServer(this._defaultServerCallback(callback));
    }

    listen(callback) {
        this.server.listen(this.port, callback);
    }

    registerEvent(eventName, callback) {
        this.server.on(eventName, callback);
    }

    destroy() {
        this.server.close();
        this.server.unref();
    }

    _defaultServerCallback(callback) {
        return (request, response) => {
            response.on('close', () => {
                request.socket.destroy();
            });
            const requestUrl = request.url;
            const requestQuery = url.parse(requestUrl, true).query;
            this.destroy();
            if (requestUrl.startsWith('/cb?code')) {
                response.end(messages.ASK_SIGN_IN_SUCCESS_MESSAGE);
                callback(null, requestQuery.code);
            }
            if (requestUrl.startsWith('/cb?error')) {
                response.statusCode = 403;
                response.end(`Error: ${requestQuery.error}\nError description: ${requestQuery.error_description}`);
                callback(messages.ASK_SIGN_IN_FAILURE_MESSAGE);
            }
        };
    }
};
