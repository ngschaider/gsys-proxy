import express, { NextFunction, Request, Response } from "express";
import { createProxyMiddleware, fixRequestBody, responseInterceptor } from "http-proxy-middleware";
import path from "path";
import Service from "../models/Service";
import PveApi from "../pve/PveApi";
import createTransparentProxy from "./createTransparentProxy";
import querystring from "querystring";

export default (service: Service) => {
    const middleware = createTransparentProxy(service, {
        selfHandleResponse: true,
        onProxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
            if(req.url === "/") {
                // set a bogus cookie so the client thinks it is logged in.
                res.setHeader("Set-Cookie", "PVEAuthCookie=InterceptedByProxy; Secure");
            } else if(req.url === "/api2/json/access/ticket") {
                const data = JSON.parse(buffer.toString());
                if(data?.data?.ticket) {
                    data.data.ticket = "InterceptedByProxy";
                }
                return JSON.stringify(data);
            }
            return buffer;
        }),
        onProxyReq: (proxyReq, req, res) => {
            if(req.url === "/api2/json/access/ticket") {
                const bodyData = querystring.stringify({
                    username: req.serviceUser?.username,
                    password: req.serviceUser?.token,
                });
                proxyReq.setHeader('Content-Type','application/x-www-form-urlencoded');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                // stream the content
                proxyReq.write(bodyData);
            } else if(req.url.includes("vncwebsocket")) {
                
            }
        },
        onProxyReqWs: (proxyReq, req, socket, options, head) => {
            console.log("ws request: ");
            console.log(req.url);
        },
    });

    return async (req: express.Request, res: express.Response, next: NextFunction) => {
        if(!req.serviceUser) {
            next();
            return;
        }

        // if we dont have a token or the saved token is older than 2 hours, request a new token and save it
        const d = new Date();
        d.setHours(d.getHours() - 2);
        if(!req.serviceUser.token || req.serviceUser.tokenCreated < d) {
            const {username, password} = req.serviceUser;
            const host = service.protocol + "://" + service.targetHost + ":" + service.targetPort;
            const token = await PveApi.getNewTicket(host, username, password);
            if(!token) {
                res.sendFile(path.resolve("static/forbidden.html"));
                return;
            }
            console.log("Requesting new PVE token");
            req.serviceUser.tokenCreated = new Date();
            req.serviceUser.token = token;
            req.serviceUser.save();
        }

        // set the auth token
        const newCookies = {
            ...req.cookies,
            PVEAuthCookie: req.serviceUser.token,
        }
        req.headers["cookie"] = Object.keys(newCookies).map(key => key + "=" + newCookies[key]).join("; "); 

        /*if(req.url === "/api2/json/access/ticket") {
            req.write(querystring.stringify({
                username: "root@pam",
                password: "REDACTED",
            }));
        }*/


        middleware(req, res, next);
    }
}