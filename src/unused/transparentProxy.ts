import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import Service from "../models/Service";
import { rootCa } from "../utils/certificates";

const options = {
    target: {
        host: service.targetHost,
        port: service.targetPort,
        protocol: service.protocol + ":",
        ca: rootCa,
    },
    changeOrigin: true,
    ws: true,
    ...additionalOptions
}

const transparentProxy = createProxyMiddleware(filter, options);

export default

export default (service: Service, additionalOptions?: Partial<Options>) => {
    
}