
import { Request, Response, NextFunction, Application } from "express";
import { createProxyMiddleware, fixRequestBody, Options } from "http-proxy-middleware";
import { Socket } from "net";
import { RequestError } from "request-promise/errors";
import {instance} from "../HttpProxy";
import Service from "../models/Service";
import { rootCa } from "../utils/certificates";


export default (service: Service, additionalOptions?: Partial<Options>) => {
    //const filter = (pathname: string, req: Request) => req.hostname === service.hostname;
    const filter = (a: string, b: Request) => true;

    const options = {
        target: {
            host: service.targetHost,
            port: service.targetPort,
            protocol: service.protocol + ":",
            //ca: rootCa,
        },
        changeOrigin: true,
        ws: true,
        secure: false,
        ...additionalOptions
    }

    const middleware = createProxyMiddleware(filter, options);

    return middleware;
}