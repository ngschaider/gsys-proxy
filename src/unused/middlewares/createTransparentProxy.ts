
import { Request, Response, NextFunction, Application } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { Socket } from "net";
import { RequestError } from "request-promise/errors";
import https from "https";
import http, { IncomingMessage, METHODS, ServerResponse } from "http";
import Service from "../models/Service";
import { rootCa } from "../utils/certificates";
import { pathToFileURL } from "url";
import { UsingJoinColumnIsNotAllowedError } from "typeorm";


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
    onProxyReq: (req: IncomingMessage, proxyReq: http.ClientRequest) => void;
    onProxyRes: (req: IncomingMessage, proxyReq: http.ClientRequest, proxyRes: http.IncomingMessage, body: Buffer) => any;
    agent?: http.Agent;
}

export default async (req: IncomingMessage, res: ServerResponse, service: Service, proxyOptions: Partial<ProxyOptions> = {}) => {
    const client = service.protocol === "https" ? https : http;

    const proxyReqOptions: https.RequestOptions | http.RequestOptions = {
        hostname: service.targetHost,
        port: service.targetPort,
        path: req.url,
        method: req.method,
        headers: {
            ...req.headers,
            // From https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Host
            // "The Host request header specifies the host and port number of the server to which the request is being sent."
            host: service.targetHost + ":" + service.targetPort,
        },
        agent: proxyOptions.agent,
    };

    const proxyReq = client.request(proxyReqOptions, async proxyRes => {
        let data: Buffer[] = [];
        proxyRes.on("data", chunk => {
            data.push(chunk);
            console.log(chunk.toString());
        });

        proxyRes.on("end", async () => {
            console.log("end received for method: " + proxyReq.method);
            const originalBody = Buffer.concat(data);
            /*const modifiedBody = await proxyOptions.onProxyRes?.(req, proxyReq, proxyRes, originalBody);
            const bodyToWrite = modifiedBody ?? originalBody;*/
            

            if(proxyRes.statusCode) {
                res.statusCode = proxyRes.statusCode;
            }
            for(const [key,value] of Object.entries(proxyRes.headers)) {
                if(value) {
                    res.setHeader(key, value);
                }
            }     
            
            res.setHeader("connection", "close");
            res.write(originalBody);
            res.end();
        });     
    });

    proxyReq.on("error", error => {
        console.error("Error while proxying request: ");
        console.error(error);
    });

    await proxyOptions.onProxyReq?.(req, proxyReq);

    console.log("sending " + proxyReq.method);
    proxyReq.end();
};