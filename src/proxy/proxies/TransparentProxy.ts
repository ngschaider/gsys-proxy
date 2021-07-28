import { ClientRequest, IncomingMessage, ServerResponse } from "http";
import { Duplex } from "stream";
import Service from "../../models/Service";
import httpProxy, { ServerOptions } from "http-proxy";
import config from "../../config";


class Proxy {

    service: Service;
    server: httpProxy;

    constructor(service: Service, options?: Partial<ServerOptions>) {
        this.service = service;

        this.server = httpProxy.createServer({
            target: {
                host: service.targetHost,
                port: service.targetPort,
                protocol: service.protocol + ":",
                ca: config.CA,
            },
            changeOrigin: true,
            onProxyReq: this.onProxyReq,
            onProxyReqWs: this.onProxyReqWs,
            onProxyRes: this.onProxyRes,
            ...options
        });

        this.server.on("error", this.onError.bind(this));
    }

    async onProxyReq(proxyReq: ClientRequest, req: IncomingMessage, res: ServerResponse) {
        
    }

    async onProxyReqWs(proxyReq: ClientRequest, req: IncomingMessage, socket: Duplex, options: ServerOptions, head: Buffer) {

    }

    async onProxyRes(proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse) {
        
    }

    onError(err: Error, req: IncomingMessage, res: ServerResponse) {
        console.error("[ERROR] while proxying from '" + this.service.hostname + "': ");
        console.error(err);
    }

    relevant(req: IncomingMessage): boolean {
        return req.headers.host === this.service.hostname;
    }

    /**
     * Child classes can override this method to prevent proxying
     * 
     * @param req Request from http.Server
     * @param res Response for http.Server
     */
    web(req: IncomingMessage, res: ServerResponse) {
        this.server.web(req, res);
    }

    /**
     * Child classes can override this method to prevent proxying
     * 
     * @param req Request from http.Server
     * @param socket 
     * @param head 
     */
    ws(req: IncomingMessage, socket: Duplex, head: Buffer) {
        this.server.ws(req, socket, head);
    }

}
export default Proxy;