import express, { NextFunction, Request, Response } from "express";
import { createProxyMiddleware, fixRequestBody, responseInterceptor } from "http-proxy-middleware";
import path from "path";
import Service from "../models/Service";
import PveApi from "../pve/PveApi";
import createTransparentProxy from "./createTransparentProxy";
import querystring from "querystring";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import User from "../models/User";
import LoginToken from "../models/LoginToken";

const ticketCache: Record<string,string> = {};

export default (service: Service) => {
    const middleware = createTransparentProxy(service, {
        selfHandleResponse: true,
        onProxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
            //console.log("received response for " + req.url);
            //console.log("Status CODE: " + proxyRes.statusCode);
            if(req.url === "/") {
                console.log("setting PVE bogus cookie");
                // set a bogus cookie so the client thinks it is logged in.
                res.setHeader("set-cookie", "PVEAuthCookie=InterceptedByProxy; secure");
            } else if(req.url === "/api2/json/access/ticket") {
                // overwrite the ticket value sent by the server to keep secrets away from client
                console.log("overwriting ticket on API ticket-creation response");
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
                // intercept the credentials when requesting a new ticket
                // (the pve client requests a new token when the current token is nearly expired)
                const bodyData = querystring.stringify({
                    username: req.serviceUser?.username,
                    password: req.serviceUser?.data.token,
                });
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            } else if(req.url.includes("spiceproxy")) {
                // rewrite the proxy field so virt-viewer connects directly to pve
                // (we do not proxy on spice ports)
                const bodyData = querystring.stringify({
                    proxy: req.service?.targetHost,
                });
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onProxyReqWs: (proxyReq, req, socket, options) => {
            // TODO / FIX ME: This is not affected by hostname filtering
            // (every service proxy's onProxyReqWs gets called on every request)

            console.log("Start of PVE websocket interception");

            const reqCookiesHeader = req.headers["cookie"];
            if(!reqCookiesHeader) {
                console.error("no cookies supplied for websocket interception");
                return;
            }

            req.cookies = cookie.parse(reqCookiesHeader);
            if(!req.cookies.GSYSAuthCookie) {
                console.error("no auth cookie supplied for websocket interception");
                return;
            }

            console.log("ticket cache: ");
            console.log(ticketCache);

            const ticket = ticketCache[req.cookies.GSYSAuthCookie];
            if(!ticket) {
                console.error("no ticket in ticketCache for supplied gsys auth cookie")
            }

            console.log("using ticket: ");
            console.log(ticket);

            const newCookies = {
                ...req.cookies,
                PVEAuthCookie: encodeURIComponent(ticket),
            }
            
            const newCookieStr = Object.keys(newCookies).map(key => key + "=" + newCookies[key]).join("; ");
            proxyReq.setHeader("cookie", newCookieStr); 
            console.log("new cookie str: ");
            console.log(newCookieStr);

            console.log("End of PVE websocket interception");
        },        
    });

    return async (req: express.Request, res: express.Response, next: NextFunction) => {
        if(!req.serviceUser) {
            next();
            return;
        }

        await req.serviceUser.preRequest();
        if(!req.serviceUser.data.token) {
            res.sendFile(path.resolve("static/forbidden.html"));
            return;
        }

        if(req.loginToken) {
            ticketCache[req.loginToken.token] = req.serviceUser.data.token;
        }

        //set the auth token
        const newCookies = {
            ...req.cookies,
            PVEAuthCookie: encodeURIComponent(req.serviceUser.data.token),
        }
        req.headers["cookie"] = Object.keys(newCookies).map(key => key + "=" + newCookies[key]).join("; "); 

        /*if(req.url === "/api2/json/access/ticket") {
            req.write(querystring.stringify({
                username: "root@pam",
                password: "REDACTED",
            }));
        }*/
        //console.log("Proxying request " + req.url + " to " + req.service?.targetHost + ":" + req.service?.targetPort);

        middleware(req, res, next);
    }
}