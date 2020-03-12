const http = require('http');

module.exports = class LocalHostServer {
    constructor(PORT) {
        this.port = PORT;
        this.server = null;
    }

    create(requestHandler) {
        this.server = http.createServer(requestHandler);
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
};
