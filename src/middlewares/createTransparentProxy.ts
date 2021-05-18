import { Request, Response, NextFunction } from "express";
import { createProxyMiddleware, fixRequestBody, Options } from "http-proxy-middleware";
import Service from "../models/Service";
import { rootCa } from "../utils/certificates";


export default (service: Service, additionalOptions?: Partial<Options>) => {
    const filter = (pathname: string, req: Request) => req.hostname === service.hostname;

    const options = {
        target: {
            host: service.targetHost,
            port: service.targetPort,
            protocol: service.protocol + ":",
            ca: rootCa,
        },
        fallthrough: true,
        changeOrigin: true,
        ws: true,
        ...additionalOptions
    }

    return createProxyMiddleware(filter, options);
}