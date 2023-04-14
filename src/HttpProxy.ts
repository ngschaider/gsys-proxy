import http from "http";
import https from "https";
import Service from "./models/Service";
import { IncomingMessage, ServerResponse } from "http";
import config from "./config";

export default class HttpProxy {

    httpsServer: https.Server;
    httpServer: http.Server;
    services: Service[] = [];
    
    constructor() {   
        this.httpsServer = https.createServer({
            key: config.proxy.KEY,
            cert: config.proxy.CERT,
        }, async (req, res) => {
            console.log(req.method + " - " + req.url);
        });

        this.httpServer = http.createServer(async (req, res) => {
            const redirectTo = "https://" + req.headers['host'] + req.url;
            res.setHeader("location", redirectTo);
            res.end();
        });

        /*this.httpsServer.on("upgrade", async (req, socket, head) => {

        });*/
    }

    registerService(service: Service) {

    }
    
    registerServices(services: Service[]) {
        for(const service of services) {
            this.registerService(service);
        }
    }

    async proxyWeb(req: IncomingMessage, res: ServerResponse) {

    }
    
    async proxyWs(req: any, socket: any, head: any) {

    }

    async listen() {
        await new Promise<void>(resolve => {
            this.httpServer.listen(config.proxy.PORT, resolve);
        });
        console.log("HTTP Proxy listening on Port " + config.proxy.PORT);

        await new Promise<void>(resolve => {
            this.httpsServer.listen(config.proxy.PORT_SSL, resolve);
        });
        console.log("HTTPS Proxy listening on Port " + config.proxy.PORT_SSL);
    }

}