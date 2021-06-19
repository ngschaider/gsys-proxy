import express, { Express } from "express";
import cookieParser from "cookie-parser";
import https from "https";
import fs from "fs";
import LoginToken from "../models/LoginToken";
import { attachControllers } from "@decorators/express";
import AuthController from "./controllers/AuthController";
import UserController from "./controllers/UserController";
import ResponseType from "./ResponseType";
import ResponseMessage from "./ResponseMessage";
import ResponseCode from "./ResponseCode";
import SpiceController from "./controllers/SpiceController";
import ServiceUserController from "./controllers/ServiceUserController";
import ServiceController from "./controllers/ServiceController";

export default class HttpApi {

    basePath: string = ""
    port: number = 8100;
    app: Express
    httpsServer: https.Server;

    public constructor() {
        this.app = express();

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
            res.setHeader("access-control-allow-headers", "content-type");
            next();
        });

        this.app.use(cookieParser());
        this.app.use(express.urlencoded({
            extended: false,
        }));
        this.app.use(express.json());

        this.app.use(async (req, res, next) => {
            const token = req.cookies["GSYSAuthCookie"];
            if(token) {
                const loginToken = await LoginToken.findOne({token});
                req.loginToken = loginToken;
                if(loginToken) {
                    req.user = loginToken.user;
                }
            }

            next();
        });

        attachControllers(this.app, [
            AuthController,
            UserController,
            SpiceController,
            ServiceUserController,
            ServiceController,
        ]);


        this.app.use((req, res, next) => {
            res.json({
                type: ResponseType.Error,
                message: ResponseMessage.RESOURCE_NOT_FOUND,
                code: ResponseCode.RESOURCE_NOT_FOUND,
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