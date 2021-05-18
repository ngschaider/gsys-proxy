import { Request, Response, NextFunction } from "express";
import { Options } from "http-proxy-middleware";
import { pathToFileURL } from "url";
import Service from "../models/Service";
import createTransparentProxy from "../middlewares/createTransparentProxy";
import protectedMiddleware from "./protectedMiddleware";
import path from "path";

export default (service: Service, additionalOptions?: Options) => {

    const transparentMiddleware = createTransparentProxy(service, additionalOptions);

    return (req: Request, res: Response, next: NextFunction) => {
        protectedMiddleware(req, res, () => {
            
        });
    };
}