import express, {Express, Request, response, Response} from "express";
import fs from "fs";
import https from "https";
import Service, { ServiceType } from "./models/Service";
import cookieParser from "cookie-parser";
import createTransparentProxy from "./middlewares/createTransparentProxy";
import createPveProxy from "./middlewares/createPveProxy";
import path from "path";
import authenticationMiddleware from "./middlewares/authenticationMiddleware";
import createServiceProxy from "./middlewares/createServiceProxy";
import bodyParser from "body-parser";
import expressWs from "express-ws";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Agent } from "http";

export default class HttpProxy {

    port: number = 443;
    app: Express;
    httpsServer: https.Server
    
    constructor() {        
        this.app = express();

        const credentials = {
            key: fs.readFileSync("certificates/proxy.key"),
            cert: fs.readFileSync("certificates/proxy.crt"),
        }
        this.httpsServer = https.createServer(credentials, this.app);
    }

    async registerRoutes() {
        // parse all cookies (required for authenticationMiddleware)
        this.app.use(cookieParser());

        // set req.service, if authentication cookie is valid set and req.user
        // if it exists also set req.serviceUser
        this.app.use(authenticationMiddleware);

        // this displays a message if no service is found
        this.app.use((req, res, next) => {
            if(!req.service) {
                console.log("not found");
                res.sendFile(path.resolve("static/notFound.html"));
                return;
            }

            next();
        });

        // if we aren't logged in and we have a proxy which needs authentication redirect to login
        this.app.use((req, res, next) => {
            if(!req.user && req.service?.type !== ServiceType.Transparent) {
                const origin = encodeURIComponent(req.protocol + "://" + req.headers.host + req.originalUrl)
                res.redirect(307, "https://accounts.gsys.at/login?origin=" + origin);
                return;
            }

            next();
        });

        this.app.use((req, res, next) => {
            if(!req.serviceUser && req.service?.type !== ServiceType.Transparent) {
                console.log("forbidden");
                res.sendFile(path.resolve("static/forbidden.html"));
                return;
            }

            next();
        })

        // register proxies for Services
        /*const services = await Service.find();
        for(const service of services) {
            const serviceProxy = createServiceProxy(service);
            this.app.use(serviceProxy);
        }*/


        for(const service of await Service.find()) {
            this.app.use(createTransparentProxy(service));
        }
    }

    async listen() {
        await new Promise<void>(resolve => {
            this.httpsServer.listen(this.port, resolve);
        });

        console.log("Proxy listening on Port " + this.port);
    }

}