
import { Request, Response, NextFunction, Application } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { Socket } from "net";
import { RequestError } from "request-promise/errors";
import https from "https";
import http from "http";
import Service from "../models/Service";
import { rootCa } from "../utils/certificates";
import { pathToFileURL } from "url";


/*export default (service: Service, additionalOptions?: Partial<Options>) => {
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
}*/


type ProxyOptions = {
    onProxyReq: (req: Request, proxyReq: http.ClientRequest) => void;
    onProxyRes: (req: Request, proxyReq: http.ClientRequest, proxyRes: http.IncomingMessage, body: Buffer) => any;
    agent?: http.Agent;
}

export default (service: Service, proxyOptions: Partial<ProxyOptions> = {}) => {

    return async (req: Request, res: Response, next: NextFunction) => {
        if(req.hostname !== service.hostname) {
            next();
            return;
        } else {
            const client = service.protocol === "https" ? https : http;

            const proxyReqOptions: https.RequestOptions | http.RequestOptions = {
                hostname: service.targetHost,
                port: service.targetPort,
                path: req.path,
                method: req.method,
                headers: req.headers,
                agent: proxyOptions.agent,
            };

            const proxyReq = client.request(proxyReqOptions, async proxyRes => {
                let data: Buffer[] = [];
                proxyRes.on("data", chunk => {
                    data.push(chunk);
                });

                proxyRes.on("end", async () => {
                    const originalBody = Buffer.concat(data);
                    const modifiedBody = await proxyOptions.onProxyRes?.(req, proxyReq, proxyRes, originalBody);
                    const bodyToWrite = modifiedBody ?? originalBody;
                    

                    if(proxyRes.statusCode) {
                        res.status(proxyRes.statusCode);
                    }
                    for(const [key,value] of Object.entries(proxyRes.headers)) {
                        if(value) {
                            res.setHeader(key, value);
                        }
                    }     
                    res.write(bodyToWrite);
                    res.end();
                });     
            });

            proxyReq.on("error", error => {
                console.error("Error while proxying request: ");
                console.error(error);
            });

            await proxyOptions.onProxyReq?.(req, proxyReq);

            proxyReq.end();
        }
    };
}