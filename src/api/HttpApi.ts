import express, { Express, RequestHandler } from "express";
import { pathToFileURL } from "url";
import ApiModule from "./ApiModule";
import AuthModule from "./modules/AuthModule";
import cors from "cors";
import cookieParser from "cookie-parser";
import https from "https";
import fs from "fs";

export default class HttpApi {

    basePath: string = ""
    port: number = 8100;
    app: Express
    httpsServer: https.Server;

    modules: ApiModule[];

    public constructor() {
        this.app = express();
        this.modules = [
            new AuthModule(),
        ];

        const credentials = {
            key: fs.readFileSync("certificates/api.key"),
            cert: fs.readFileSync("certificates/api.crt"),
        }
        this.httpsServer = https.createServer(credentials, this.app);
    }

    public registerRoutes() {
        this.app.use((req, res, next) => {
            if(req.headers.origin) {
                res.setHeader("access-control-allow-origin", req.headers.origin);
            }
            res.setHeader("access-control-allow-credentials", "true");
            next();
        });
        this.app.use(cookieParser());

        for(const module of this.modules) {
            const methods = {
                get: (path: string, cb: RequestHandler) => { this.app.get(this.basePath + module.basePath + path, cb) },
                head: (path: string, cb: RequestHandler) => { this.app.head(this.basePath + module.basePath + path, cb) },
                post: (path: string, cb: RequestHandler) => { this.app.post(this.basePath + module.basePath + path, cb) },
                put: (path: string, cb: RequestHandler) => { this.app.put(this.basePath + module.basePath + path, cb) },
                delete: (path: string, cb: RequestHandler) => { this.app.delete(this.basePath + module.basePath + path, cb) },
                connect: (path: string, cb: RequestHandler) => { this.app.connect(this.basePath + module.basePath + path, cb) },
                options: (path: string, cb: RequestHandler) => { this.app.options(this.basePath + module.basePath + path, cb) },
                trace: (path: string, cb: RequestHandler) => { this.app.trace(this.basePath + module.basePath + path, cb) },
                patch: (path: string, cb: RequestHandler) => { this.app.patch(this.basePath + module.basePath + path, cb) },
            }

            module.registerRoutes(methods);
        }

        this.app.use((req, res, next) => {
            res.status(404).json({
                type: "error",
                message: "requested resource not found."
            });
        });
    }
        

    public async listen() {
        await new Promise<void>(resolve => {
            this.httpsServer.listen(this.port, resolve);
        });

        console.log("API listening on Port " + this.port);
    }

}