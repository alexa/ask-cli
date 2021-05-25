import http, { RequestListener, Server } from 'http';

export type HttpCallback = (...args: any[]) => void;

export default class LocalHostServer {
    private _port: number;
    private _server?: Server;

    constructor(port: number) {
        this._port = port;
    }

    create(requestHandler: RequestListener) {
        if (!this._server) {
            return;
        }
        this._server = http.createServer(requestHandler);
    }

    listen(callback: HttpCallback) {
        if (!this._server) {
            return;
        }
        this._server.listen(this._port, callback);
    }

    registerEvent(eventName: string, callback: HttpCallback) {
        if (!this._server) {
            return;
        }
        this._server.on(eventName, callback);
    }

    destroy() {
        if (!this._server) {
            return;
        }
        this._server.close();
        this._server.unref();
    }
};
