import express, { NextFunction, Request, Response } from "express";
import { createProxyMiddleware, fixRequestBody, responseInterceptor } from "http-proxy-middleware";
import path from "path";
import Service from "../models/Service";
import PveApi from "../pve/PveApi";
import createTransparentProxy from "./createTransparentProxy";
import querystring from "querystring";
import cookieParser from "cookie-parser";
import cookie from "cookie";

const ticketCache: Record<string,string> = {};

export default (service: Service) => {
    const middleware = createTransparentProxy(service, {
        selfHandleResponse: true,
        onProxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
            if(req.url === "/") {
                // set a bogus cookie so the client thinks it is logged in.
                res.setHeader("set-cookie", "PVEAuthCookie=InterceptedByProxy; Secure");
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
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            } else if(req.url.includes("spiceproxy")) {
                const bodyData = querystring.stringify({
                    proxy: req.service?.targetHost,
                });
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onProxyReqWs: (proxyReq, req, socket, options) => {
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

            const ticket = ticketCache[req.cookies.GSYSAuthCookie];
            if(!ticket) {
                console.error("no ticket in ticketCache for supplied gsys auth cookie")
            }

            const newCookies = {
                ...req.cookies,
                PVEAuthCookie: ticket,
            }
            
            proxyReq.setHeader("cookie", Object.keys(newCookies).map(key => key + "=" + newCookies[key]).join("; ")); 
        },
    });

    return async (req: express.Request, res: express.Response, next: NextFunction) => {
        if(!req.serviceUser) {
            next();
            return;
        }

        //if we dont have a token or the saved token is older than 2 hours, request a new token and save it
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
            await req.serviceUser.save();
        }

        if(req.loginToken) {
            ticketCache[req.loginToken.token] = req.serviceUser.token;
        }

        //set the auth token
        const newCookies = {
            ...req.cookies,
            PVEAuthCookie: req.serviceUser.token,
        }
        req.headers["cookie"] = Object.keys(newCookies).map(key => key + "=" + newCookies[key]).join("; "); 

<<<<<<< HEAD
        /*if(req.url === "/api2/json/access/ticket") {
            req.write(querystring.stringify({
                username: "root@pam",
                password: "REDACTED",
            }));
        }*/


=======
>>>>>>> 6a10c93... started fixing a nasty websocket bug
        middleware(req, res, next);
    }
}