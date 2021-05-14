import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

export type ProxyOptions = Options & {
    filterHostname: string;
}

export default (options: ProxyOptions) => {
    const filter = (pathname: string, req: express.Request) => req.hostname === options.filterHostname;

    return createProxyMiddleware(filter, options);
}