
import { Request, Response, NextFunction, Application } from "express";
import { createProxyMiddleware, fixRequestBody, Options } from "http-proxy-middleware";
import { Socket } from "net";
import { RequestError } from "request-promise/errors";
import Service from "../models/Service";
import { rootCa } from "../utils/certificates";


export default (service: Service, additionalOptions?: Partial<Options>) => {
    const middleware = createProxyMiddleware({
        target: {
            host: service.targetHost,
            port: service.targetPort,
            protocol: service.protocol + ":",
            ca: rootCa,
        },
        changeOrigin: true,
        ws: true,
        secure: false,
        ...additionalOptions
    });

    return (req: Request, res: Response, next: NextFunction) => {
        if(req.hostname !== service.hostname) {
            next();
            return;
        } else {
            middleware(req, res, next);
        }
    };
}