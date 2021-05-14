import express, { NextFunction } from "express";
import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware";
import Service from "../models/Service";
import { rootCa } from "../utils/certificates";

export default (service: Service) => {
    const proxyMiddleware = createProxyMiddleware({
        target: {
            host: service.targetHost,
            port: service.targetPort,
            protocol: service.protocol + ":",
            ca: rootCa,
        },
        changeOrigin: true,
        ws: true,
        selfHandleResponse: true,
        onProxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
            if(req.url === "/") {
                res.setHeader("Set-Cookie", "PVEAuthCookie=ProxyWillChangeThisValueToTheActualTicket");
            }
            return buffer;
        }),
    });

    return (req: express.Request, res: express.Response, next: NextFunction) => {
        if(req.hostname === service.hostname) {
            req.headers["cookie"] = "PVEAuthCookie=PVE%3Aroot@pam%3A609E7772%3A%3AwnbtbGmjPK9hCrzHB/qzZ0pkxCZDWE7zzYPw8uwFE3hidaBM1WVWho5QF7YSN1IIX/3qgfXffA4z95oIcO7+F2DNuUXGz1gA1yXtjsOZA7GVTj5lPS0GEtuEb9VwLUn4BxOQz5GkI9eebwENXWTmf/Ef26DsWbeFjA+nryqtvd3KGeaYFH8a+iTSmouqrcXzciNgeMmawA+DYY9VANUTOgiBcsXEI3yfeB6OdGiHd/uMpG4pG2GPE768cBhKhq6Rc4kuNtO8qEmlAYkh78zPwYe90NoojNahJH+Fryrf1F80RKJfQ6jGC4uqCjY0fg2tAf5NgoIHrWl+IEZd6CNbcA%3D%3D";

            proxyMiddleware(req, res, next);
        }
    }
}