import express, {Express, request, Request, response, Response} from "express";
import proxy from "express-http-proxy";
import fs from "fs";
import https from "https";
import {JSDOM} from "jsdom";
import User from "./models/User";
import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware";
import { rootCertificates } from "tls";
import keepAlive from "agentkeepalive";
import createFormFill from "./utils/formfill";
import Service, { ServiceType } from "./models/Service";
import registerPveService from "./proxy/createPveProxyMiddleware";
import createPveProxyMiddleware from "./proxy/createPveProxyMiddleware";

export default class HttpProxy {

    port: number = 8101;
    app: Express;

    constructor() {
        this.app = express();
    }

    async registerRoutes() {
        const services = await Service.find();

        for(const service of services) {
            if(service.type === ServiceType.PVE) {
                this.app.use(createPveProxyMiddleware(service));
            }
        }

        this.app.use((req, res, next) => {
            res.sendFile(__dirname + "/public/proxy/notFound.html");
        });
    }

    async listen() {
        const credentials = {
            key: fs.readFileSync("certificates/proxy.key"),
            cert: fs.readFileSync("certificates/proxy.crt"),
        }

        const httpsServer = https.createServer(credentials, this.app);
        await new Promise<void>(resolve => {
            httpsServer.listen(this.port, resolve);
        });

        console.log("Proxy listening on Port " + this.port);
    }

}