import express, { Express, RequestHandler } from "express";
import { pathToFileURL } from "url";
import ApiModule from "./ApiModule";
import AuthModule from "./modules/AuthModule";

export default class HttpApi {

    basePath: string = "/api/v1/"
    port: number = 8100;
    app: Express

    modules: ApiModule[];

    public constructor() {
        this.app = express();
        this.modules = [
            new AuthModule(),
        ]
    }

    public registerRoutes() {
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
    }
        

    public async listen() {
        await new Promise<void>(resolve => {
            this.app.listen(this.port, resolve);
        });
        
        console.log("Listening on Port " + this.port);
    }

}